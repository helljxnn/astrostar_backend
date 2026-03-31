import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuración para guardar archivos en memoria
const storage = multer.memoryStorage();

// Filtro para archivos de comprobantes de pago
const paymentReceiptFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, WEBP) o PDF'), false);
  }
};

// Filtro solo para imágenes (para otros usos)
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, etc.)'), false);
  }
};

// Límite de tamaño: 5MB
const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

// Función para subir a Cloudinary desde buffer
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'payment-receipts',
        resource_type: 'auto',
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Middleware personalizado para subir a Cloudinary después de multer
const cloudinaryUpload = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Agregar información de Cloudinary al archivo
    req.file.cloudinary = result;
    req.file.path = result.secure_url;
    req.file.public_id = result.public_id;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al subir el archivo'
    });
  }
};

// Upload para comprobantes de pago (imágenes y PDFs)
export const upload = multer({ 
  storage, 
  fileFilter: paymentReceiptFilter,
  limits
});

// Middleware combinado: multer + cloudinary con manejo explícito de errores
export const uploadPaymentReceipt = (req, res, next) => {
  upload.single('receipt')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo no debe superar los 5MB'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Error al procesar el archivo adjunto'
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Archivo de comprobante inválido'
      });
    }

    return cloudinaryUpload(req, res, next);
  });
};

// Upload solo para imágenes (para otros módulos)
export const uploadImage = multer({ 
  storage, 
  fileFilter: imageFilter,
  limits
});

// Upload en memoria para casos especiales
export const uploadMemory = multer({ 
  storage, 
  fileFilter: imageFilter,
  limits
});
