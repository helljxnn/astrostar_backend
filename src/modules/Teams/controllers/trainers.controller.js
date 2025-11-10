import prisma from "../../../config/database.js"; 

export class TrainersController {
  async getTrainers(req, res) {
    try {
      console.log('🔍 Buscando entrenadores...');
      
      // 1. Entrenadores de la fundación (empleados)
      const employees = await prisma.employee.findMany({
        where: {
          status: "Activo"
        },
        include: {
          user: {
            include: {
              role: true
            }
          }
        }
      });

      console.log('👥 Empleados encontrados:', employees.length);

      const trainersFromEmployees = employees
        .filter(emp => {
          const roleName = emp.user.role.name.toLowerCase();
          return roleName.includes('entrenador') || roleName.includes('trainer');
        })
        .map(emp => ({
          id: emp.id,
          name: `${emp.user.firstName} ${emp.user.lastName}`,
          identification: emp.user.identification,
          categoria: undefined,
          source: "fundacion",
          sourceLabel: "Entrenadores de la Fundación",
          type: "fundacion"
        }));

      console.log('🏋️ Entrenadores empleados:', trainersFromEmployees.length);

      // 2. Entrenadores temporales
      const temporaryTrainers = await prisma.temporaryPerson.findMany({
        where: {
          status: "Active",
          personType: "Entrenador"
        }
      });

      console.log('⏱️ Entrenadores temporales:', temporaryTrainers.length);

      const trainersFromTemporary = temporaryTrainers.map(temp => ({
        id: temp.id,
        name: `${temp.firstName} ${temp.lastName}`,
        identification: temp.identification,
        categoria: undefined,
        source: "temporal",
        sourceLabel: "Entrenadores Temporales",
        type: "temporal"
      }));

      const allTrainers = [...trainersFromEmployees, ...trainersFromTemporary];
      
      console.log('✅ Total entrenadores:', allTrainers.length);

      res.json({
        success: true,
        data: allTrainers
      });
    } catch (error) {
      console.error('❌ Error getting trainers:', error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message
      });
    }
  }
}

export default new TrainersController();