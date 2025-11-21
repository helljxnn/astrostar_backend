// src/controllers/documentTypes.controller.js
import prisma from "../config/database.js";
import jwt from "jsonwebtoken";

class DocumentTypesController {
  async getDocumentTypes(req, res) {
    try {
      const documentTypes = await prisma.documentType.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: "asc" },
      });

      // Mapear para el frontend
      const mappedTypes = documentTypes.map(docType => {
        return {
          id: docType.id,
          value: docType.id, // Usar el ID como value para el select
          label: docType.name,
          description: docType.description,
        };
      });

      // Solución: Filtrar para eliminar duplicados basados en el campo 'value'
      const uniqueMappedTypes = mappedTypes.filter(
        (doc, index, self) =>
          index === self.findIndex((d) => d.value === doc.value)
      );

      res.json({
        success: true,
        data: uniqueMappedTypes,
      });
    } catch (error) {
      console.error("❌ Error en getDocumentTypes:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener tipos de documento",
      });
    }
  }

  async getDocumentTypesByUser(req, res) {
    try {
      const { accessToken } = req.cookies;

      if (!accessToken) {
        return res.status(401).json({
          success: false,
          message: "Acceso denegado. No se proporcionó token.",
        });
      }

      let userId;
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          return res
            .status(401)
            .json({ success: false, message: "Token de acceso expirado." });
        }
        return res
          .status(403)
          .json({ success: false, message: "Token inválido." });
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
          documentType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      if (!user || !user.documentType) {
        return res.status(404).json({
          success: false,
          message: "Tipo de documento para el usuario no encontrado.",
        });
      }

      // Devolver el objeto de tipo de documento directamente
      // para que el selector del formulario lo pueda usar.
      res.json({ success: true, data: user.documentType });
    } catch (error) {
      console.error("❌ Error en getDocumentTypesByUser:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el tipo de documento del usuario",
      });
    }
  }
}

export default new DocumentTypesController();
