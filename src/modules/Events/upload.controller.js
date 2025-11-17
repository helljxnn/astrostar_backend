import cloudinaryService from '../../services/cloudinary.service.js';

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Gestión de subida de archivos a Cloudinary
 */

export class UploadController {
  /**
   * @swagger
   * /api/events/upload/image:
   *   post:
   *     summary: Subir imagen de evento a Cloudinary
   *     description: Sube una imagen para un evento. Formatos permitidos JPG, PNG, GIF, WEBP. Tamaño máximo 5MB. La imagen se optimiza automáticamente.
   *     tags: [Upload]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - image
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: Archivo de imagen (JPG, PNG, GIF, WEBP)
   *     responses:
   *       200:
   *         description: Imagen subida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     url:
   *                       type: string
   *                       format: uri
   *                       example: "https://res.cloudinary.com/dpi6uu5fk/image/upload/v1234567890/astrostar/events/images/abc123.jpg"
   *                     publicId:
   *                       type: string
   *                       example: "astrostar/events/images/abc123"
   *                 message:
   *                   type: string
   *                   example: "Imagen subida exitosamente"
   *       400:
   *         description: No se proporcionó archivo o formato inválido
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "No se proporcionó ningún archivo"
   *       500:
   *         description: Error al subir imagen
   */
  uploadEventImage = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
      }

      const result = await cloudinaryService.uploadFile(
        req.file.buffer,
        'astrostar/events/images',
        'image'
      );

      res.json({
        success: true,
        data: {
          url: result.url,
          publicId: result.publicId
        },
        message: 'Imagen subida exitosamente'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la imagen',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/events/upload/schedule:
   *   post:
   *     summary: Subir cronograma de evento (PDF) a Cloudinary
   *     description: Sube un archivo PDF con el cronograma del evento. Solo formato PDF permitido. Tamaño máximo 5MB.
   *     tags: [Upload]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - schedule
   *             properties:
   *               schedule:
   *                 type: string
   *                 format: binary
   *                 description: Archivo PDF del cronograma
   *     responses:
   *       200:
   *         description: Cronograma subido exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     url:
   *                       type: string
   *                       format: uri
   *                       example: "https://res.cloudinary.com/dpi6uu5fk/raw/upload/v1234567890/astrostar/events/schedules/xyz789.pdf"
   *                     publicId:
   *                       type: string
   *                       example: "astrostar/events/schedules/xyz789"
   *                 message:
   *                   type: string
   *                   example: "Cronograma subido exitosamente"
   *       400:
   *         description: No se proporcionó archivo o formato inválido
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "No se proporcionó ningún archivo"
   *       500:
   *         description: Error al subir cronograma
   */
  uploadEventSchedule = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
      }

      const result = await cloudinaryService.uploadFile(
        req.file.buffer,
        'astrostar/events/schedules',
        'raw'
      );

      res.json({
        success: true,
        data: {
          url: result.url,
          publicId: result.publicId
        },
        message: 'Cronograma subido exitosamente'
      });
    } catch (error) {
      console.error('Error uploading schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir el cronograma',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * @swagger
   * /api/events/upload/delete:
   *   delete:
   *     summary: Eliminar archivo de Cloudinary
   *     description: Elimina un archivo (imagen o PDF) de Cloudinary usando su publicId
   *     tags: [Upload]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - publicId
   *             properties:
   *               publicId:
   *                 type: string
   *                 description: ID público del archivo en Cloudinary
   *                 example: "astrostar/events/images/abc123"
   *               resourceType:
   *                 type: string
   *                 enum: [image, raw]
   *                 default: image
   *                 description: Tipo de recurso (image para imágenes, raw para PDFs)
   *           example:
   *             publicId: "astrostar/events/images/abc123"
   *             resourceType: "image"
   *     responses:
   *       200:
   *         description: Archivo eliminado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Archivo eliminado exitosamente"
   *       400:
   *         description: No se proporcionó publicId
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "No se proporcionó el ID del archivo"
   *       500:
   *         description: Error al eliminar archivo
   */
  deleteFile = async (req, res) => {
    try {
      const { publicId, resourceType = 'image' } = req.body;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó el ID del archivo'
        });
      }

      await cloudinaryService.deleteFile(publicId, resourceType);

      res.json({
        success: true,
        message: 'Archivo eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el archivo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}
