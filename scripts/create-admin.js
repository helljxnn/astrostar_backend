import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creando usuario administrador...');

    // Buscar el rol de Administrador
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Administrador' }
    });

    if (!adminRole) {
      throw new Error('El rol de Administrador no existe. Ejecuta el seed primero.');
    }

    // Buscar tipo de documento "Cédula de Ciudadanía"
    const documentType = await prisma.documentType.findFirst({
      where: { name: 'Cédula de Ciudadanía' }
    });

    if (!documentType) {
      throw new Error('No se encontró el tipo de documento. Ejecuta el seed primero.');
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'astrostar.java@gmail.com' }
    });

    if (existingUser) {
      console.log('⚠️  El usuario administrador ya existe.');
      console.log('📧 Email: astrostar.java@gmail.com');
      return;
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash('Admin123', 10);

    // Crear el usuario administrador
    const adminUser = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Astrostar',
        email: 'astrostar.java@gmail.com',
        passwordHash: passwordHash,
        phoneNumber: '3001234567',
        address: 'Calle Principal #123',
        birthDate: new Date('1990-01-01'),
        identification: '1000000000',
        status: 'Active',
        documentTypeId: documentType.id,
        roleId: adminRole.id,
        age: 34
      }
    });

    // Crear el empleado asociado
    await prisma.employee.create({
      data: {
        userId: adminUser.id,
        status: 'Activo'
      }
    });

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('📧 Email: astrostar.java@gmail.com');
    console.log('🔑 Contraseña: Admin123');
    console.log('👤 Rol: Administrador');

  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
