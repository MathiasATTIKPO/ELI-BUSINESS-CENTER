const { v2: cloudinary } = require('cloudinary');

const hasCloudinaryConfig = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
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

const uploadImage = async (file, folder) => {
  if (!file) return null;
  const result = await uploadBuffer(file.buffer, {
    folder,
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    originalName: file.originalname,
  };
};

const uploadImages = async (files = [], folder) => {
  const uploaded = await Promise.all((files || []).map((file) => uploadImage(file, folder)));
  return uploaded.filter(Boolean);
};

module.exports = {
  uploadImage,
  uploadImages,
};