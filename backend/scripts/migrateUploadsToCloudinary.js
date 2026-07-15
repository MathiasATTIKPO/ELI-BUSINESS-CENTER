const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDatabase } = require('../bootstrap');
const { hasCloudinaryConfig, storeFileBuffer } = require('../services/cloudinary');

const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const RepairRequest = require('../models/RepairRequest');
const TradeinRequest = require('../models/TradeinRequest');
const Sale = require('../models/Sale');
const Invoice = require('../models/Invoice');
const ResellerContract = require('../models/ResellerContract');
const VIPInvoice = require('../models/VIPInvoice');

const backendRoot = path.join(__dirname, '..');
const uploadsRoot = path.join(backendRoot, 'uploads');
const uploadsPattern = /^\/?uploads\//i;

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''));

const normalizeUploadPath = (value) => String(value || '')
  .trim()
  .replace(/\\/g, '/')
  .replace(/^\/+/, '');

const isLegacyUploadValue = (value) => uploadsPattern.test(normalizeUploadPath(value)) && !isAbsoluteUrl(value);

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const listFilesRecursively = (dirPath) => {
  if (!fs.existsSync(dirPath)) return [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(absolutePath));
      continue;
    }
    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
};

const getRelativeUploadPath = (absolutePath) => {
  const relative = path.relative(backendRoot, absolutePath).replace(/\\/g, '/');
  return relative.startsWith('uploads/') ? relative : `uploads/${path.basename(absolutePath)}`;
};

const resolveLocalSourceFile = (uploadValue) => {
  const normalized = normalizeUploadPath(uploadValue);
  const basename = path.basename(normalized);
  const topFolder = normalized.split('/')[1] || '';

  const candidatePaths = [
    path.join(backendRoot, normalized),
    path.join(uploadsRoot, path.relative('uploads', normalized)),
    path.join(uploadsRoot, basename),
    topFolder ? path.join(uploadsRoot, topFolder, basename) : null,
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  const allUploadFiles = listFilesRecursively(uploadsRoot);
  return allUploadFiles.find((candidate) => path.basename(candidate) === basename) || null;
};

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
};

const getCloudinaryOptionsFromPath = (uploadValue, sourceFile) => {
  const normalized = normalizeUploadPath(uploadValue || getRelativeUploadPath(sourceFile));
  const segments = normalized.split('/').filter(Boolean);
  const folder = segments[1] || 'uploads';
  const mimeType = getMimeType(sourceFile);
  const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';

  return {
    folder,
    fileName: path.basename(sourceFile),
    resourceType,
    mimeType,
  };
};

const uploadLocalFileToCloudinary = async (uploadValue, sourceFile) => {
  const buffer = await fs.promises.readFile(sourceFile);
  const options = getCloudinaryOptionsFromPath(uploadValue, sourceFile);
  const result = await storeFileBuffer(buffer, options);
  return result.url;
};

const collectLegacyValues = (value, collector) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectLegacyValues(item, collector));
    return;
  }

  if (typeof value === 'string' && isLegacyUploadValue(value)) {
    collector.add(normalizeUploadPath(value));
  }
};

const replaceArrayValues = async ({ values, owner, field, dryRun, report, referencedPaths }) => {
  if (!Array.isArray(values)) return { changed: false, nextValues: values };

  let changed = false;
  const nextValues = [...values];

  for (let index = 0; index < values.length; index += 1) {
    const currentValue = values[index];
    if (!isLegacyUploadValue(currentValue)) continue;

    const normalized = normalizeUploadPath(currentValue);
    referencedPaths.add(normalized);

    const sourceFile = resolveLocalSourceFile(currentValue);
    if (!sourceFile) {
      report.failedItems.push({ owner, field: `${field}[${index}]`, originalValue: currentValue, reason: 'Local source file not found' });
      continue;
    }

    if (dryRun) {
      changed = true;
      continue;
    }

    try {
      nextValues[index] = await uploadLocalFileToCloudinary(currentValue, sourceFile);
      changed = true;
    } catch (error) {
      report.failedItems.push({ owner, field: `${field}[${index}]`, originalValue: currentValue, sourceFile, reason: error.message });
    }
  }

  return { changed, nextValues };
};

const replaceSingleValue = async ({ value, owner, field, dryRun, report, referencedPaths }) => {
  if (!isLegacyUploadValue(value)) return { changed: false, nextValue: value };

  const normalized = normalizeUploadPath(value);
  referencedPaths.add(normalized);

  const sourceFile = resolveLocalSourceFile(value);
  if (!sourceFile) {
    report.failedItems.push({ owner, field, originalValue: value, reason: 'Local source file not found' });
    return { changed: false, nextValue: value };
  }

  if (dryRun) {
    return { changed: true, nextValue: value };
  }

  try {
    const nextValue = await uploadLocalFileToCloudinary(value, sourceFile);
    return { changed: true, nextValue };
  } catch (error) {
    report.failedItems.push({ owner, field, originalValue: value, sourceFile, reason: error.message });
    return { changed: false, nextValue: value };
  }
};

const migrateDocument = async (doc, handlers, report, referencedPaths, dryRun) => {
  let changed = false;
  const owner = `${doc.constructor.modelName}:${String(doc._id)}`;

  for (const handler of handlers) {
    const result = await handler({ doc, owner, dryRun, report, referencedPaths });
    changed = changed || result;
  }

  if (changed) {
    if (!dryRun) {
      await doc.save();
    }
    report.migratedDocuments.push(owner);
  } else {
    report.skippedDocuments.push(owner);
  }
};

const handleArrayField = (field) => async ({ doc, owner, dryRun, report, referencedPaths }) => {
  const values = doc.get(field);
  const { changed, nextValues } = await replaceArrayValues({ values, owner, field, dryRun, report, referencedPaths });
  if (changed && !dryRun) {
    doc.set(field, nextValues);
  }
  return changed;
};

const handleSingleField = (field) => async ({ doc, owner, dryRun, report, referencedPaths }) => {
  const value = doc.get(field);
  const { changed, nextValue } = await replaceSingleValue({ value, owner, field, dryRun, report, referencedPaths });
  if (changed && !dryRun) {
    doc.set(field, nextValue);
  }
  return changed;
};

const handleVipPaymentsReceipts = async ({ doc, owner, dryRun, report, referencedPaths }) => {
  const payments = Array.isArray(doc.payments) ? [...doc.payments] : [];
  let changed = false;

  for (let index = 0; index < payments.length; index += 1) {
    const payment = payments[index];
    const { changed: itemChanged, nextValue } = await replaceSingleValue({
      value: payment?.receiptUrl,
      owner,
      field: `payments[${index}].receiptUrl`,
      dryRun,
      report,
      referencedPaths,
    });

    if (itemChanged) {
      changed = true;
      if (!dryRun) {
        payments[index].receiptUrl = nextValue;
      }
    }
  }

  if (changed && !dryRun) {
    doc.set('payments', payments);
  }

  return changed;
};

const modelConfigs = [
  { model: Product, handlers: [handleArrayField('photos')] },
  { model: InventoryItem, handlers: [handleArrayField('photos')] },
  { model: RepairRequest, handlers: [handleArrayField('photos'), handleSingleField('saleInfo.invoiceUrl')] },
  { model: TradeinRequest, handlers: [handleArrayField('photos'), handleSingleField('saleInfo.invoiceUrl')] },
  { model: Sale, handlers: [handleSingleField('saleInfo.invoiceUrl')] },
  { model: Invoice, handlers: [handleSingleField('pdfUrl')] },
  { model: ResellerContract, handlers: [handleSingleField('contractPdfUrl'), handleSingleField('payment.invoiceUrl')] },
  { model: VIPInvoice, handlers: [handleSingleField('pdfPath'), handleSingleField('receiptPath'), handleVipPaymentsReceipts] },
];

const run = async () => {
  const startedAt = new Date();
  const dryRun = ['1', 'true', 'yes'].includes(String(process.env.DRY_RUN || '').toLowerCase());

  if (!hasCloudinaryConfig() && !dryRun) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_URL (or CLOUDINARY_* vars) before running migration.');
  }

  await connectDatabase();

  const report = {
    startedAt: startedAt.toISOString(),
    dryRun,
    migratedDocuments: [],
    skippedDocuments: [],
    failedItems: [],
    scannedModels: [],
    orphanUploadsMigrated: [],
    orphanUploadsFailed: [],
    localUploadsDiscovered: [],
  };

  const referencedPaths = new Set();

  for (const config of modelConfigs) {
    const docs = await config.model.find({});
    report.scannedModels.push({ model: config.model.modelName, count: docs.length });

    for (const doc of docs) {
      for (const handler of config.handlers) {
        // Pre-collect legacy refs for orphan detection even if later replacement fails.
        const fieldPaths = ['photos', 'saleInfo.invoiceUrl', 'pdfUrl', 'contractPdfUrl', 'payment.invoiceUrl', 'pdfPath', 'receiptPath'];
        for (const fieldPath of fieldPaths) {
          collectLegacyValues(doc.get(fieldPath), referencedPaths);
        }
        if (Array.isArray(doc.payments)) {
          doc.payments.forEach((payment) => collectLegacyValues(payment?.receiptUrl, referencedPaths));
        }
        break;
      }

      await migrateDocument(doc, config.handlers, report, referencedPaths, dryRun);
    }
  }

  const localUploadFiles = listFilesRecursively(uploadsRoot);
  report.localUploadsDiscovered = localUploadFiles.map((filePath) => getRelativeUploadPath(filePath));

  for (const absolutePath of localUploadFiles) {
    const relativePath = getRelativeUploadPath(absolutePath);
    if (referencedPaths.has(relativePath)) {
      continue;
    }

    if (dryRun) {
      report.orphanUploadsMigrated.push({ relativePath, dryRun: true });
      continue;
    }

    try {
      const cloudinaryUrl = await uploadLocalFileToCloudinary(relativePath, absolutePath);
      report.orphanUploadsMigrated.push({ relativePath, cloudinaryUrl });
    } catch (error) {
      report.orphanUploadsFailed.push({ relativePath, reason: error.message });
    }
  }

  report.finishedAt = new Date().toISOString();
  report.durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
  report.migratedCount = report.migratedDocuments.length;
  report.failedItemsCount = report.failedItems.length;
  report.orphanUploadsMigratedCount = report.orphanUploadsMigrated.length;
  report.orphanUploadsFailedCount = report.orphanUploadsFailed.length;

  const reportsDir = path.join(backendRoot, 'docs', 'reports');
  ensureDir(reportsDir);
  const reportPath = path.join(reportsDir, `uploads-migration-${Date.now()}.json`);
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Uploads migration completed.');
  console.log(`Migrated documents: ${report.migratedCount}`);
  console.log(`Failed item replacements: ${report.failedItemsCount}`);
  console.log(`Orphan uploads migrated: ${report.orphanUploadsMigratedCount}`);
  console.log(`Orphan uploads failed: ${report.orphanUploadsFailedCount}`);
  console.log(`Report: ${reportPath}`);
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