const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configuration de base du storage Cloudinary
const createStorage = (folder, resourceType = 'image', allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'pdf']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      resource_type: resourceType, // 'image' ou 'raw' pour PDF
      allowed_formats: allowedFormats,
      transformation: resourceType === 'image' ? [{ width: 800, height: 800, crop: 'limit' }] : undefined
    }
  });
};

// Filtre générique : accepte images et PDF
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

// Création d'instances multer pour différents cas d'usage
const createMulterInstance = (folder, resourceType = 'image', maxCount = 10) => {
  const storage = createStorage(folder, resourceType);
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
    fileFilter
  }).array('files', maxCount); // champ générique 'files'
};

// Export des middlewares préconfigurés pour chaque besoin
const uploadProducts = createMulterInstance('products', 'image', 10);
const uploadContracts = createMulterInstance('contracts', 'raw', 5); // PDF
const uploadInvoices = createMulterInstance('invoices', 'raw', 5);
const uploadReceipts = createMulterInstance('receipts', 'raw', 5);
const uploadVipInvoices = createMulterInstance('vip_invoices', 'raw', 5);

// Pour compatibilité avec vos routes existantes qui utilisent 'photos' comme champ
const uploadMultiple = multer({
  storage: createStorage('products', 'image'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
}).array('photos', 10);

// Export de l'instance multer de base (pour ceux qui veulent personnaliser)
const upload = multer({
  storage: createStorage('uploads', 'raw'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

module.exports = {
  upload,
  uploadMultiple,
  uploadProducts,
  uploadContracts,
  uploadInvoices,
  uploadReceipts,
  uploadVipInvoices
};