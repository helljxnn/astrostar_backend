import prisma from '../config/database.js';

class DocumentTypesController {
  async getDocumentTypes(req, res) {
    try {
      // Excluir "Registro Civil" del endpoint global
      // Este tipo solo debe estar disponible en el módulo de deportistas
      const documentTypes = await prisma.documentType.findMany({
        where: {
          NOT: {
            name: 'Registro Civil'
          }
        },
        select: {
          id: true,
          name: true,
          description: true
        },
        orderBy: { name: 'asc' }
      });

      // Mapear para el frontend
      const mappedTypes = documentTypes.map(docType => {
        return {
          id: docType.id,
          value: docType.id, // Usar el ID como value para el select
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