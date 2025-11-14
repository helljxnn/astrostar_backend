import { Router } from 'express';
import { upload } from '../upload.middleware.js';
import { uploadToCloudinary } from '../cloudinary.service.js';

const router = Router();

// POST /api/upload/image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se envió ninguna imagen" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    res.json({
      success: true,
      url: result.secure_url
    });

  } catch (error) {
    console.error("Error Cloudinary:", error);
    res.status(500).json({ success: false, message: "Error al subir imagen" });
  }
});

export default router;
