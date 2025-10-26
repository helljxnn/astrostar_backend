// Aqui es donde se cargan datos iniciales en esas tablas (por ejemplo, los tipos de documento por defecto).
import { PrismaClient } from '../generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  // Seed document types
  await prisma.documentType.createMany({
    data: [
      { name: 'Cédula de Ciudadanía', description: 'Documento de identidad para ciudadanos colombianos' },
      { name: 'Tarjeta de Identidad', description: 'Documento de identidad para menores de edad' },
      { name: 'Permiso de Permanencia', description: 'Documento para extranjeros con permiso de permanencia' },
      { name: 'Tarjeta de Extranjería', description: 'Documento de identidad para extranjeros' },
      { name: 'Cédula de Extranjería', description: 'Documento de identidad para extranjeros residentes' },
      { name: 'Número de Identificación Tributaria', description: 'Documento de identificación tributaria' },
      { name: 'Pasaporte', description: 'Documento de identidad internacional' },
      { name: 'Número de Identificación Extranjero', description: 'Documento de identificación para extranjeros' },
    ],
    skipDuplicates: true,
  });

  // Seed employee types
  await prisma.employeeType.createMany({
    data: [
      { name: 'Administrador', description: 'Personal administrativo y de gestión' },
      { name: 'Entrenador', description: 'Entrenadores deportivos y técnicos' },
      { name: 'Instructor', description: 'Instructores de actividades específicas' },
      { name: 'Coordinador', description: 'Coordinadores de programas y eventos' },
      { name: 'Auxiliar', description: 'Personal auxiliar y de apoyo' },
      { name: 'Mantenimiento', description: 'Personal de mantenimiento y servicios generales' },
      { name: 'Seguridad', description: 'Personal de seguridad y vigilancia' }
    ],
    skipDuplicates: true,
  });

  // Solo crear rol de Administrador (crítico para el sistema)
  await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {}, // No actualizar si ya existe
    create: {
      name: 'Administrador',
      description: 'Acceso completo al sistema con todos los permisos. Este rol no puede ser eliminado.',
      status: 'Active',
      permissions: {
        // Permisos completos para todos los módulos
        dashboard: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        users: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        roles: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        sportsEquipment: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        employees: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        employeesSchedule: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        appointmentManagement: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        sportsCategory: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        athletesSection: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        athletesAssistance: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        donorsSponsors: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        donationsManagement: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        eventsManagement: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        temporaryWorkers: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        temporaryTeams: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        providers: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        purchasesManagement: { Ver: true, Crear: true, Editar: true, Eliminar: true }
      }
    }
  });

  console.log('✅ Document types seeded successfully!');
  console.log('✅ Employee types seeded successfully!');
  console.log('✅ Administrator role ensured!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
