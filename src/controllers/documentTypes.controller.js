// src/controllers/documentTypes.controller.js
import prisma from '../config/database.js';

class DocumentTypesController {
  async getDocumentTypes(req, res) {
    try {
      console.log('📋 Obteniendo tipos de documento...');
      
      const documentTypes = await prisma.documentType.findMany({
        select: {
          id: true,
          name: true,
          description: true
        },
        orderBy: { name: 'asc' }
      });

      console.log('✅ Tipos encontrados:', documentTypes.length);

      // Mapear para el frontend
      const mappedTypes = documentTypes.map(docType => {
        let value = 'CC';
        
        if (docType.name.includes('Cédula de Ciudadanía')) value = 'CC';
        else if (docType.name.includes('Tarjeta de Identidad')) value = 'TI';
        else if (docType.name.includes('Extranjería')) value = 'CE';
        else if (docType.name.includes('Pasaporte')) value = 'PAS';
        else if (docType.name.includes('Tributaria')) value = 'NIT';
        else value = 'CC';

        return {
          id: docType.id,
          value: value,
          label: docType.name,
          description: docType.description
        };
      });

      res.json({
        success: true,
        data: mappedTypes
      });
      
    } catch (error) {
      console.error('❌ Error en getDocumentTypes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de documento'
      });
    }
  }
}

export default new DocumentTypesController();