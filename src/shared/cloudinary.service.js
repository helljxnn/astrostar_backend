import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Sube un buffer a Cloudinary
 * @param {Buffer} buffer - Buffer del archivo
 * @param {string} folder - Carpeta en Cloudinary
 * @returns {Promise<string>} URL segura del archivo subido
 */
export const uploadToCloudinary = (buffer, folder = 'astrostar') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder,
        resource_type: 'auto',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Error subiendo a Cloudinary:', error);
          reject(error);
        } else {
          console.log('✅ Archivo subido a Cloudinary:', result.secure_url);
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
};

export default cloudinary;