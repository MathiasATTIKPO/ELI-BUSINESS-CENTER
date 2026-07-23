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
        public_id: options.public_id || undefined, // optionnel
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
//  Filtre de fichiers (identique à l’original)
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
//  Middleware de base (memoryStorage + multer)
// ------------------------------------------------------------
const createMulterMiddleware = (fieldName = 'files', maxCount = 10, limits = {}) => {
  const storage = multer.memoryStorage();
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, ...limits },
    fileFilter,
  }).array(fieldName, maxCount);
};

// ------------------------------------------------------------
//  Middlewares pré-configurés pour chaque cas d'usage
// ------------------------------------------------------------
const uploadProducts = createMulterMiddleware('files', 10);
const uploadContracts = createMulterMiddleware('files', 5);
const uploadInvoices = createMulterMiddleware('files', 5);
const uploadReceipts = createMulterMiddleware('files', 5);
const uploadVipInvoices = createMulterMiddleware('files', 5);

// Pour compatibilité avec les routes qui utilisent le champ 'photos'
const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).array('photos', 10);

// Instance de base (champ 'files')
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).array('files', 10);

// ------------------------------------------------------------
//  Middleware d'upload complet (multer + envoi vers Cloudinary)
// ------------------------------------------------------------
// À utiliser comme remplacement direct de vos anciens middlewares
// Exemple : router.post('/products', uploadAndProcess('products', 'image'), handler)
const uploadAndProcess = (folder, resourceType = 'image', transformation = undefined) => {
  // Le vrai middleware à retourner
  return async (req, res, next) => {
    try {
      // 1) Multer lit les fichiers en mémoire
      await new Promise((resolve, reject) => {
        const multerMiddleware = multer({
          storage: multer.memoryStorage(),
          limits: { fileSize: 10 * 1024 * 1024 },
          fileFilter,
        }).array('files', 10);

        multerMiddleware(req, res, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      // 2) Si aucun fichier, on passe à la suite
      if (!req.files || req.files.length === 0) {
        return next();
      }

      // 3) Uploader chaque buffer vers Cloudinary
      const uploadPromises = req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, {
          folder,
          resourceType,
          transformation: resourceType === 'image' ? transformation : undefined,
        })
      );

      const results = await Promise.all(uploadPromises);

      // 4) Attacher les URLs sécurisées et les public_id aux fichiers
      req.files = req.files.map((file, index) => ({
        ...file,
        cloudinary: {
          url: results[index].secure_url,
          public_id: results[index].public_id,
        },
      }));

      // 5) Continuer vers le handler
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Versions pré-configurées avec transformations
const uploadProductsCloud = uploadAndProcess('products', 'image', [{ width: 800, height: 800, crop: 'limit' }]);
const uploadContractsCloud = uploadAndProcess('contracts', 'raw');
const uploadInvoicesCloud = uploadAndProcess('invoices', 'raw');
const uploadReceiptsCloud = uploadAndProcess('receipts', 'raw');
const uploadVipInvoicesCloud = uploadAndProcess('vip_invoices', 'raw');

// Pour le champ 'photos' (si besoin)
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
//  Exports (conservés pour compatibilité avec votre code existant)
// ------------------------------------------------------------
module.exports = {
  // Pour les routes qui veulent faire l'upload en deux étapes (multer puis Cloudinary manuel)
  upload,
  uploadMultiple,
  uploadProducts,
  uploadContracts,
  uploadInvoices,
  uploadReceipts,
  uploadVipInvoices,

  // NOUVEAU : middlewares "tout-en-un" qui font multer + Cloudinary
  uploadProductsCloud,
  uploadContractsCloud,
  uploadInvoicesCloud,
  uploadReceiptsCloud,
  uploadVipInvoicesCloud,
  uploadMultipleCloud,

  // Fonction utilitaire si vous voulez faire des uploads personnalisés ailleurs
  uploadBufferToCloudinary,
};