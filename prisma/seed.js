import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el seeding completo de la base de datos...');

  // --- 1. Tipos de Documento ---
  console.log('Creando DocumentTypes...');
  const cedula = await prisma.documentType.upsert({
    where: { name: 'Cédula de Ciudadanía' },
    update: {},
    create: { name: 'Cédula de Ciudadanía', description: 'Documento para mayores de edad.' },
  });
  const tarjetaIdentidad = await prisma.documentType.upsert({
    where: { name: 'Tarjeta de Identidad' },
    update: {},
    create: { name: 'Tarjeta de Identidad', description: 'Documento para menores de edad.' },
  });
  console.log('DocumentTypes creados.');

  // --- 2. Roles ---
  console.log('Creando Roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Administrador con acceso total.' },
  });
  const employeeRole = await prisma.role.upsert({
    where: { name: 'Empleado' },
    update: {},
    create: { name: 'Empleado', description: 'Empleado con permisos operativos.' },
  });
  const athleteRole = await prisma.role.upsert({
    where: { name: 'Atleta' },
    update: {},
    create: { name: 'Atleta', description: 'Deportista con acceso a su perfil.' },
  });
  console.log('Roles creados.');

  // --- 3. Privilegios (en español) ---
  console.log('Creando Privileges...');
  const privileges = await prisma.$transaction([
    prisma.privilege.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Crear', description: 'Permite crear nuevos registros.' } }),
    prisma.privilege.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: 'Leer', description: 'Permite leer registros.' } }),
    prisma.privilege.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: 'Actualizar', description: 'Permite actualizar registros.' } }),
    prisma.privilege.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: 'Eliminar', description: 'Permite eliminar registros.' } }),
  ]);
  console.log('Privileges creados.');

  // --- 4. Permisos (Módulos en inglés) ---
  console.log('Creando Permissions...');
  const permissionNames = [
    'Dashboard', 'Users', 'Roles', 'Athletes', 'Services', 'Sponsors',
    'Inscriptions', 'Teams', 'Purchases', 'Equipments',
    'Donors', 'Appointments', 'Reports', 'Settings'
  ];
  const permissions = await prisma.$transaction(
    permissionNames.map(name =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: `Permissions for ${name} module` },
      })
    )
  );
  console.log('Permissions creados.');

  // --- 5. Asignación de todos los permisos y privilegios al rol "Admin" ---
  console.log('Asignando permisos al rol Admin...');
  for (const permission of permissions) {
    for (const privilege of privileges) {
      await prisma.rolePermissionPrivilege.upsert({
        where: {
          roleId_permissionId_privilegeId: {
            roleId: adminRole.id,
            permissionId: permission.id,
            privilegeId: privilege.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
          privilegeId: privilege.id,
        },
      });
    }
  }
  console.log('Permisos asignados a Admin.');

  // --- 6. Creación de Usuarios (Admin, Empleado, Atleta) ---
  console.log('Creando Usuarios...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@astrostar.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Astro',
      email: 'admin@astrostar.com',
      passwordHash: hashedPassword,
      birthDate: new Date('1990-01-01'),
      identification: '123456789',
      documentTypeId: cedula.id,
      roleId: adminRole.id,
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: 'empleado@astrostar.com' },
    update: {},
    create: {
      firstName: 'Empleado',
      lastName: 'Ejemplar',
      email: 'empleado@astrostar.com',
      passwordHash: await bcrypt.hash('empleado123', 10),
      birthDate: new Date('1995-05-05'),
      identification: '987654321',
      documentTypeId: cedula.id,
      roleId: employeeRole.id,
    },
  });

  const athleteUser = await prisma.user.upsert({
    where: { email: 'atleta@astrostar.com' },
    update: {},
    create: {
      firstName: 'Atleta',
      lastName: 'Futuro',
      email: 'atleta@astrostar.com',
      passwordHash: await bcrypt.hash('atleta123', 10),
      birthDate: new Date('2008-08-08'),
      identification: '1122334455',
      documentTypeId: tarjetaIdentidad.id,
      roleId: athleteRole.id,
    },
  });
  console.log('Usuarios creados.');

  // --- 7. Empleado ---
  console.log('Creando Employee...');
  const employee = await prisma.employee.upsert({
    where: { userId: employeeUser.id },
    update: {},
    create: {
      userId: employeeUser.id,
      status: 'Activo',
    },
  });
  console.log('Employee creado.');

  // --- 8. Guardian ---
  console.log('Creando Guardian...');
  const guardian = await prisma.guardian.upsert({
    where: { email: 'tutor@astrostar.com' },
    update: {},
    create: {
      firstName: 'Tutor',
      lastName: 'Responsable',
      identification: '55667788',
      email: 'tutor@astrostar.com',
      phone: '3101234567',
      documentTypeId: cedula.id,
    },
  });
  console.log('Guardian creado.');

  // --- 9. Atleta ---
  console.log('Creando Athlete...');
  const athlete = await prisma.athlete.upsert({
    where: { userId: athleteUser.id },
    update: {},
    create: {
      userId: athleteUser.id,
      guardianId: guardian.id,
      relationship: 'Father',
    },
  });
  console.log('Athlete creado.');

  // --- 10. Categorías (Deportivas y de Eventos) y Tipos de Servicio ---
  console.log('Creando Categorías y Tipos...');
  const sportsCategory = await prisma.sportsCategory.upsert({
    where: { id: 1 },
    update: {},
    create: { nombre: 'Sub-15', edadMinima: 13, edadMaxima: 15 },
  });
  const eventCategory = await prisma.eventCategory.upsert({
    where: { name: 'Torneo' },
    update: {},
    create: { name: 'Torneo', description: 'Competencias oficiales.' },
  });
  const serviceType = await prisma.serviceType.upsert({
    where: { name: 'Campeonato Local' },
    update: {},
    create: { name: 'Campeonato Local', description: 'Campeonato dentro de la ciudad.' },
  });
  console.log('Categorías y Tipos creados.');

  // --- 11. Inscripción ---
  console.log('Creando Inscription...');
  await prisma.inscription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      athleteId: athlete.id,
      sportsCategoryId: sportsCategory.id,
      inscriptionDate: new Date(),
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      concept: 'Inscripción temporada 2025',
    },
  });
  console.log('Inscription creada.');

  // --- 12. Equipo ---
  console.log('Creando Team...');
  const team = await prisma.team.upsert({
    where: { name: 'AstroStar FC' },
    update: {},
    create: {
      name: 'AstroStar FC',
      description: 'Equipo principal de la fundación.',
      category: 'Sub-15',
    },
  });
  console.log('Team creado.');

  // --- 13. Miembro de Equipo ---
  console.log('Creando TeamMember...');
  await prisma.teamMember.upsert({
    where: { unique_athlete_per_team: { teamId: team.id, athleteId: athlete.id } },
    update: {},
    create: {
      teamId: team.id,
      athleteId: athlete.id,
      memberType: 'Athlete',
      role: 'Player',
      jerseyNumber: 10,
    },
  });
  console.log('TeamMember creado.');

  // --- 14. Servicio (Evento) ---
  console.log('Creando Service...');
  const service = await prisma.service.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Copa Futuro 2025',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-15'),
      startTime: '08:00',
      endTime: '18:00',
      location: 'Estadio Municipal',
      phone: '1234567',
      categoryId: eventCategory.id,
      typeId: serviceType.id,
      publish: true,
    },
  });
  console.log('Service creado.');

  // --- 15. Participante de Evento ---
  console.log('Creando Participant...');
  await prisma.participant.upsert({
    where: { serviceId_teamId: { serviceId: service.id, teamId: team.id } },
    update: {},
    create: {
      serviceId: service.id,
      teamId: team.id,
      type: 'Team',
    },
  });
  console.log('Participant creado.');

  // --- 16. Proveedor ---
  console.log('Creando Provider...');
  const provider = await prisma.provider.upsert({
    where: { nit: '900123456-7' },
    update: {},
    create: {
      businessName: 'Deportes El Golazo SAS',
      nit: '900123456-7',
      mainContact: 'Carlos Ventas',
      email: 'ventas@elgolazo.com',
      phone: '6017654321',
      address: 'Calle Falsa 123',
      city: 'Bogotá',
    },
  });
  console.log('Provider creado.');

  // --- 17. Implemento Deportivo ---
  console.log('Creando SportsEquipment...');
  const sportsEquipment = await prisma.sportsEquipment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Balón de Fútbol #5',
      quantityInitial: 0,
      quantityTotal: 10,
    },
  });
  console.log('SportsEquipment creado.');

  // --- 18. Compra ---
  console.log('Creando Purchase...');
  const purchase = await prisma.purchase.create({
    data: {
      purchaseNumber: 'FC-2025-001',
      totalAmount: 500000,
      providerId: provider.id,
      employeeId: employee.id,
      items: {
        create: {
          productName: 'Balón de Fútbol #5',
          quantity: 10,
          unitPrice: 50000,
          subtotal: 500000,
          sportsEquipmentId: sportsEquipment.id,
        },
      },
    },
  });
  console.log('Purchase creada.');

  // --- 19. Cita ---
  console.log('Creando Appointment...');
  await prisma.appointment.create({
    data: {
      title: 'Revisión Médica Anual',
      description: 'Chequeo general de aptitud física.',
      start: new Date('2025-11-20T10:00:00'),
      end: new Date('2025-11-20T11:00:00'),
      athleteId: athlete.id,
    },
  });
  console.log('Appointment creada.');

  // --- 20. Donante/Patrocinador ---
  console.log('Creando DonorSponsor...');
  const donor = await prisma.donorSponsor.upsert({
    where: { email: 'donante@example.com' },
    update: {},
    create: {
      identification: '10101010',
      name: 'Juan Donante',
      type: 'Donor',
      personType: 'Natural',
      phone: '3001112233',
      email: 'donante@example.com',
    },
  });
  console.log('DonorSponsor creado.');

  console.log('Seeding completo y exitoso.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
