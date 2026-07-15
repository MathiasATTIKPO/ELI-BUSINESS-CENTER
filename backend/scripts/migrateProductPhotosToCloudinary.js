const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');
const { connectDatabase } = require('../bootstrap');
const { hasCloudinaryConfig, storeFileBuffer } = require('../services/cloudinary');

const uploadsPattern = /^\/?uploads\//i;
const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''));

const normalizeUploadPath = (value) => String(value || '')
  .trim()
  .replace(/\\/g, '/')
  .replace(/^\/+/, '');

const isLegacyUploadValue = (value) => uploadsPattern.test(normalizeUploadPath(value));

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const resolveLocalSourceFile = (photoValue) => {
  const normalized = normalizeUploadPath(photoValue);
  const backendRoot = path.join(__dirname, '..');

  const candidatePaths = [
    path.join(backendRoot, normalized),
    path.join(backendRoot, normalized.replace(/^uploads\/products\//i, 'uploads/')),
    path.join(backendRoot, 'uploads', path.basename(normalized)),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
};

const uploadLocalImageToCloudinary = async (sourceFile) => {
  const buffer = await fs.promises.readFile(sourceFile);
  const fileName = path.basename(sourceFile);
  const result = await storeFileBuffer(buffer, {
    folder: 'products',
    fileName,
    resourceType: 'image',
    mimeType: 'image/jpeg',
  });

  return result.url;
};

const verifyViaApi = async (apiBaseUrl) => {
  const base = String(apiBaseUrl || 'http://localhost:4001').replace(/\/+$/, '');
  const endpoint = `${base}/api/products`;

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        endpoint,
        status: response.status,
        message: data?.message || 'API returned non-200 response.',
      };
    }

    const products = Array.isArray(data?.data) ? data.data : [];
    const residual = products
      .filter((product) => Array.isArray(product.photos) && product.photos.some((p) => isLegacyUploadValue(p)))
      .map((product) => String(product._id));

    return {
      ok: true,
      endpoint,
      productCount: products.length,
      residualLegacyPhotoProductIds: residual,
      residualCount: residual.length,
    };
  } catch (error) {
    return {
      ok: false,
      endpoint,
      message: error.message,
    };
  }
};

const run = async () => {
  const startedAt = new Date();
  const dryRun = String(process.env.DRY_RUN || '').toLowerCase() === '1' || String(process.env.DRY_RUN || '').toLowerCase() === 'true';

  if (!hasCloudinaryConfig() && !dryRun) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_URL (or CLOUDINARY_* vars) before running migration.');
  }

  await connectDatabase();

  const products = await Product.find({});
  const impactedProducts = products.filter((product) => Array.isArray(product.photos) && product.photos.some((p) => isLegacyUploadValue(p)));

  const report = {
    startedAt: startedAt.toISOString(),
    dryRun,
    totalProductsScanned: products.length,
    impactedProductIds: impactedProducts.map((p) => String(p._id)),
    impactedCount: impactedProducts.length,
    migratedProducts: [],
    skippedProducts: [],
    failedPhotos: [],
    finalApiCheck: null,
  };

  for (const product of impactedProducts) {
    const originalPhotos = Array.isArray(product.photos) ? [...product.photos] : [];
    const updatedPhotos = [...originalPhotos];
    let replacedCount = 0;

    for (let i = 0; i < originalPhotos.length; i += 1) {
      const currentValue = originalPhotos[i];

      if (!isLegacyUploadValue(currentValue) || isAbsoluteUrl(currentValue)) {
        continue;
      }

      const sourceFile = resolveLocalSourceFile(currentValue);
      if (!sourceFile) {
        report.failedPhotos.push({
          productId: String(product._id),
          productName: product.name,
          originalValue: currentValue,
          reason: 'Local source file not found',
        });
        continue;
      }

      if (dryRun) {
        replacedCount += 1;
        continue;
      }

      try {
        const cloudinaryUrl = await uploadLocalImageToCloudinary(sourceFile);
        updatedPhotos[i] = cloudinaryUrl;
        replacedCount += 1;
      } catch (error) {
        report.failedPhotos.push({
          productId: String(product._id),
          productName: product.name,
          originalValue: currentValue,
          sourceFile,
          reason: error.message,
        });
      }
    }

    if (replacedCount > 0 && !dryRun) {
      product.photos = updatedPhotos;
      await product.save();
      report.migratedProducts.push({
        productId: String(product._id),
        productName: product.name,
        replacedCount,
      });
    } else if (replacedCount > 0 && dryRun) {
      report.migratedProducts.push({
        productId: String(product._id),
        productName: product.name,
        replacedCount,
        dryRun: true,
      });
    } else {
      report.skippedProducts.push({
        productId: String(product._id),
        productName: product.name,
        reason: 'No replaceable local source found',
      });
    }
  }

  report.finishedAt = new Date().toISOString();
  report.durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
  report.migratedCount = report.migratedProducts.length;
  report.failedPhotosCount = report.failedPhotos.length;

  report.finalApiCheck = await verifyViaApi(process.env.VERIFY_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4001');

  const reportsDir = path.join(__dirname, '..', 'docs', 'reports');
  ensureDir(reportsDir);
  const reportPath = path.join(reportsDir, `product-photo-migration-${Date.now()}.json`);
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Product photo migration completed.');
  console.log(`Scanned products: ${report.totalProductsScanned}`);
  console.log(`Impacted products: ${report.impactedCount}`);
  console.log(`Migrated products: ${report.migratedCount}`);
  console.log(`Failed photo replacements: ${report.failedPhotosCount}`);
  console.log(`Impacted IDs: ${report.impactedProductIds.join(', ') || '(none)'}`);
  console.log(`Report: ${reportPath}`);

  if (report.finalApiCheck?.ok) {
    console.log(`API check endpoint: ${report.finalApiCheck.endpoint}`);
    console.log(`Residual products with legacy /uploads photos: ${report.finalApiCheck.residualCount}`);
  } else {
    console.log(`API check failed: ${report.finalApiCheck?.message || 'Unknown error'}`);
  }
};

run()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      // Ignore close errors.
    } 
  });
