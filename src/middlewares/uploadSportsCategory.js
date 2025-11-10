import multer from "multer";
import path from "path";
import fs from "fs";

// Carpeta donde se guardarán las imágenes
const uploadPath = "uploads/categorias";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "");
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Solo se permiten imágenes"), false);
};

export const uploadSportsCategory = multer({ storage, fileFilter });
