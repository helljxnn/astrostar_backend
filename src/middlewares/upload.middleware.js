import multer from 'multer';
import path from 'path';

// Configuración de almacenamiento en memoria
const storage = multer.memoryStorage();

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Permitir imágenes
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const imageMimeTypes = /image\/(jpeg|jpg|png|gif|webp)/;
  
  // Permitir PDFs para cronogramas
  const documentTypes = /pdf/;
  const documentMimeTypes = /application\/pdf/;
  
  const extname = path.extname(file.originalname).toLowerCase().substring(1);
  const mimetype = file.mimetype.toLowerCase();
  
  // Validar tanto extensión como mimetype para mayor seguridad
  const isValidImage = imageTypes.test(extname) && imageMimeTypes.test(mimetype);
  const isValidDocument = documentTypes.test(extname) && documentMimeTypes.test(mimetype);
  
  if (isValidImage || isValidDocument) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP) o PDF. Verifica que el archivo tenga el formato correcto.'));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: fileFilter
});

export default upload;
