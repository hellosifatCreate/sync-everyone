const { v2: cloudinary } = require('cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sync-everyone',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'webm', 'mp3', 'ogg'],
    resource_type: 'auto',   // image এবং audio দুটোই handle করবে
  },
})

module.exports = { cloudinary, storage }
