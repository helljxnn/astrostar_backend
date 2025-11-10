import multer from 'multer';

// Configuración para guardar archivos en memoria (buffer)
const storage = multer.memoryStorage();

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
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

export const upload = multer({ 
  storage, 
  fileFilter,
  limits
});