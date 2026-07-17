const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

const getCloudinaryConfig = () => {
  if (process.env.CLOUDINARY_URL) {
    try {
      const parsed = new URL(process.env.CLOUDINARY_URL);
      return {
        cloud_name: parsed.hostname,
        api_key: decodeURIComponent(parsed.username || ''),
        api_secret: decodeURIComponent(parsed.password || ''),
        secure: true,
      };
    } catch (error) {
      return null;
    }
  }

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    };
  }

  return null;
};

const hasCloudinaryConfig = () => Boolean(getCloudinaryConfig());
const shouldRequireCloudinary = () => Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
const shouldPersistLocalReplica = () => !process.env.VERCEL;

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ''));

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeFileName = (fileName = 'file') => String(fileName)
  .trim()
  .replace(/[^a-zA-Z0-9._-]/g, '_');

const cloudinaryConfig = getCloudinaryConfig();
if (cloudinaryConfig) {
  cloudinary.config(cloudinaryConfig);
}

const uploadBuffer = (buffer, options = {}) => new Promise((resolve, reject) => {
  if (!hasCloudinaryConfig()) {
    reject(new Error('Cloudinary configuration missing.'));
    return;
  }

  const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(result);
  });

  stream.end(buffer);
});

const uploadBufferWithRetry = async (buffer, options = {}, retries = 2) => {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await uploadBuffer(buffer, options);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    }
  }

  throw lastError || new Error('Cloudinary upload failed.');
};

const storeFileBuffer = async (buffer, {
  folder = 'uploads',
  fileName = `file_${Date.now()}`,
  resourceType = 'raw',
  mimeType = 'application/octet-stream',
} = {}) => {
  const safeFileName = sanitizeFileName(fileName);

  if (hasCloudinaryConfig()) {
    const extension = path.extname(safeFileName).replace(/^\./, '');
    const publicId = `${folder}/${path.basename(safeFileName, path.extname(safeFileName))}_${Date.now()}`;
    const result = await uploadBufferWithRetry(buffer, {
      folder,
      resource_type: resourceType,
      public_id: publicId,
      format: extension || undefined,
      use_filename: false,
      unique_filename: false,
      overwrite: false,
      filename_override: safeFileName,
    });

    let localFilePath = '';
    if (shouldPersistLocalReplica()) {
      try {
        const outputDir = path.join(__dirname, '..', 'uploads', folder);
        ensureDir(outputDir);
        localFilePath = path.join(outputDir, safeFileName);
        await fs.promises.writeFile(localFilePath, buffer);
      } catch (error) {
        // Cloudinary upload already succeeded, so local replica failure must not break request flow.
        localFilePath = '';
      }
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      filePath: localFilePath,
      mimeType,
    };
  }

  if (shouldRequireCloudinary()) {
    throw new Error('Cloudinary configuration missing in production/serverless environment.');
  }

  const outputDir = path.join(__dirname, '..', 'uploads', folder);
  ensureDir(outputDir);
  const absolutePath = path.join(outputDir, safeFileName);
  await fs.promises.writeFile(absolutePath, buffer);

  return {
    url: `/uploads/${folder}/${safeFileName}`,
    publicId: '',
    filePath: absolutePath,
    mimeType,
  };
};

const uploadImage = async (file, folder) => {
  if (!file) return null;
  const result = await storeFileBuffer(file.buffer, {
    folder,
    fileName: `${Date.now()}-${sanitizeFileName(file.originalname || 'image')}`,
    resourceType: 'image',
    mimeType: file.mimetype || 'image/jpeg',
  });

  return {
    url: result.url,
    publicId: result.publicId,
    originalName: file.originalname,
  };
};

const uploadImages = async (files = [], folder) => {
  const uploaded = await Promise.all((files || []).map((file) => uploadImage(file, folder)));
  return uploaded.filter(Boolean);
};

module.exports = {
  getCloudinaryConfig,
  uploadImage,
  uploadImages,
  hasCloudinaryConfig,
  isAbsoluteUrl,
  storeFileBuffer,
};