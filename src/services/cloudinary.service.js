import cloudinary from '../config/cloudinary.config.js';
import streamifier from 'streamifier';

class CloudinaryService {
  /**
   * Subir imagen a Cloudinary
   * @param {Buffer} fileBuffer - Buffer del archivo
   * @param {string} folder - Carpeta en Cloudinary
   * @param {string} resourceType - Tipo de recurso (image, raw, video, auto)
   * @returns {Promise<Object>} - Resultado de la subida
   */
  async uploadFile(fileBuffer, folder = 'events', resourceType = 'auto') {
    // Validar que el buffer no esté vacío
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('El archivo está vacío');
    }

    // Validar tamaño máximo (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (fileBuffer.length > maxSize) {
      throw new Error('El archivo excede el tamaño máximo permitido de 5MB');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: resourceType,
          transformation: resourceType === 'image' ? [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ] : undefined
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Error al subir archivo a Cloudinary: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes
            });
          }
        }
      );

      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  /**
   * Eliminar archivo de Cloudinary
   * @param {string} publicId - ID público del archivo
   * @param {string} resourceType - Tipo de recurso
   * @returns {Promise<Object>}
   */
  async deleteFile(publicId, resourceType = 'image') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      return result;
    } catch (error) {
      throw new Error(`Error eliminando archivo: ${error.message}`);
    }
  }

  /**
   * Obtener URL optimizada de imagen
   * @param {string} publicId - ID público de la imagen
   * @param {Object} options - Opciones de transformación
   * @returns {string} - URL optimizada
   */
  getOptimizedUrl(publicId, options = {}) {
    const {
      width = 800,
      height = 600,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;

    return cloudinary.url(publicId, {
      transformation: [
        { width, height, crop },
        { quality },
        { fetch_format: format }
      ]
    });
  }

  /**
   * Extraer public_id de una URL de Cloudinary
   * @param {string} url - URL de Cloudinary
   * @returns {string|null} - Public ID o null
   */
  extractPublicId(url) {
    if (!url || typeof url !== 'string') return null;
    
    try {
      // Formato: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      return matches ? matches[1] : null;
    } catch (error) {
      return null;
    }
  }
}

export default new CloudinaryService();
