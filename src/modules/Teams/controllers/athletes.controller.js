import prisma from "../../../config/database.js"; 

export class AthletesController {
  async getAthletes(req, res) {
    try {
      console.log('🔍 [AthletesController] Iniciando búsqueda de deportistas...');
      console.log('📋 [AthletesController] Headers:', req.headers);
      console.log('🔐 [AthletesController] Usuario autenticado:', req.user ? 'Sí' : 'No');
      
      // 1. Deportistas de la fundación (con inscripciones activas)
      const athletes = await prisma.athlete.findMany({
        where: {
          status: "Active",
          inscriptions: {
            some: {
              status: "Active"
            }
          }
        },
        include: {
          user: true,
          inscriptions: {
            where: {
              status: "Active"
            },
            include: {
              sportsCategory: true
            },
            orderBy: {
              inscriptionDate: 'desc'
            }
          }
        }
      });

      console.log('🏃 Deportistas fundación:', athletes.length);

      const athletesFromFoundation = athletes.map(athlete => {
        const currentInscription = athlete.inscriptions[0]; // Primera inscripción activa
        const category = currentInscription?.sportsCategory?.nombre || "Sin categoría";
        
        return {
          id: athlete.id,
          name: `${athlete.user.firstName} ${athlete.user.lastName}`,
          identification: athlete.user.identification,
          phoneNumber: athlete.user.phoneNumber,
          categoria: category,
          source: "fundacion",
          sourceLabel: "Deportistas de la Fundación",
          type: "fundacion"
        };
      });

      // 2. Deportistas temporales
      const temporaryAthletes = await prisma.temporaryPerson.findMany({
        where: {
          status: "Active",
          personType: "Deportista"
        }
      });

      console.log('⏱️ Deportistas temporales:', temporaryAthletes.length);

      const athletesFromTemporary = temporaryAthletes.map(temp => ({
        id: temp.id,
        name: `${temp.firstName} ${temp.lastName}`,
        identification: temp.identification,
        phoneNumber: temp.phone,
        categoria: temp.category || undefined,
        source: "temporal",
        sourceLabel: "Deportistas Temporales",
        type: "temporal"
      }));

      const allAthletes = [...athletesFromFoundation, ...athletesFromTemporary];
      
      console.log('✅ Total deportistas:', allAthletes.length);

      res.json({
        success: true,
        data: allAthletes
      });
    } catch (error) {
      console.error('❌ Error getting athletes:', error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message
      });
    }
  }
}

export default new AthletesController();
