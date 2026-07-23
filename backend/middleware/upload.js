const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// ------------------------------------------------------------
//  Fonction utilitaire pour uploader un buffer vers Cloudinary
// ------------------------------------------------------------
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'uploads',
        resource_type: options.resourceType || 'image',
        allowed_formats: options.allowedFormats || ['jpg', 'jpeg', 'png', 'webp'],
        transformation: options.transformation || undefined,
        public_id: options.public_id || undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// ------------------------------------------------------------
//  Filtre de fichiers
// ------------------------------------------------------------
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers JPG, PNG, WEBP et PDF sont autorisés.'), false);
  }
};

// ------------------------------------------------------------
//  Instances Multer de base
// ------------------------------------------------------------
// Instance Multer générique (à utiliser avec .single(), .array(), etc.)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

// Instance pour les uploads avec le champ 'photos' (utilisée dans certaines routes)
const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// ------------------------------------------------------------
//  Middlewares pré‑configurés (prêts à être utilisés directement)
// ------------------------------------------------------------
// Pour les routes qui n'ont pas besoin de spécifier le champ et le nombre
const createMulterMiddleware = (fieldName = 'files', maxCount = 10, limits = {}) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, ...limits },
    fileFilter,
  }).array(fieldName, maxCount);
};

const uploadProducts = createMulterMiddleware('files', 10);
const uploadContracts = createMulterMiddleware('files', 5);
const uploadInvoices = createMulterMiddleware('files', 5);
const uploadReceipts = createMulterMiddleware('files', 5);
const uploadVipInvoices = createMulterMiddleware('files', 5);

// ------------------------------------------------------------
//  Middlewares "tout‑en‑un" (Multer + upload Cloudinary automatique)
// ------------------------------------------------------------
// Pratique pour les routes où vous souhaitez que les fichiers soient immédiatement envoyés sur Cloudinary
const uploadAndProcess = (folder, resourceType = 'image', transformation = undefined) => {
  return async (req, res, next) => {
    try {
      // 1) Multer lit les fichiers en mémoire
      await new Promise((resolve, reject) => {
        multer({
          storage: multer.memoryStorage(),
          limits: { fileSize: 10 * 1024 * 1024 },
          fileFilter,
        }).array('files', 10)(req, res, (err) => (err ? reject(err) : resolve()));
      });

      if (!req.files || req.files.length === 0) return next();

      // 2) Envoi des buffers vers Cloudinary
      const uploadPromises = req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, {
          folder,
          resourceType,
          transformation: resourceType === 'image' ? transformation : undefined,
        })
      );
      const results = await Promise.all(uploadPromises);

      // 3) Attacher les URLs et public_id aux fichiers
      req.files = req.files.map((file, index) => ({
        ...file,
        cloudinary: {
          url: results[index].secure_url,
          public_id: results[index].public_id,
        },
      }));
      next();
    } catch (error) {
      next(error);
    }
  };
};

const uploadProductsCloud = uploadAndProcess('products', 'image', [{ width: 800, height: 800, crop: 'limit' }]);
const uploadContractsCloud = uploadAndProcess('contracts', 'raw');
const uploadInvoicesCloud = uploadAndProcess('invoices', 'raw');
const uploadReceiptsCloud = uploadAndProcess('receipts', 'raw');
const uploadVipInvoicesCloud = uploadAndProcess('vip_invoices', 'raw');

const uploadMultipleCloud = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter,
      }).array('photos', 10)(req, res, (err) => (err ? reject(err) : resolve()));
    });

    if (!req.files || req.files.length === 0) return next();

    const uploadPromises = req.files.map((file) =>
      uploadBufferToCloudinary(file.buffer, {
        folder: 'products',
        resourceType: 'image',
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      })
    );
    const results = await Promise.all(uploadPromises);
    req.files = req.files.map((file, i) => ({
      ...file,
      cloudinary: { url: results[i].secure_url, public_id: results[i].public_id },
    }));
    next();
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------
//  Exports
// ------------------------------------------------------------
module.exports = {
  // Instances Multer (pour appeler .single(), .array(), .fields() etc.)
  upload,
  uploadMultiple,

  // Middlewares Multer pré‑configurés (utilisables directement dans les routes)
  uploadProducts,
  uploadContracts,
  uploadInvoices,
  uploadReceipts,
  uploadVipInvoices,

  // Middlewares tout‑en‑un (Multer + Cloudinary)
  uploadProductsCloud,
  uploadContractsCloud,
  uploadInvoicesCloud,
  uploadReceiptsCloud,
  uploadVipInvoicesCloud,
  uploadMultipleCloud,

  // Utilitaire
  uploadBufferToCloudinary,
};