import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Verificando usuarios existentes...');
    
    // Verificar si ya existe un usuario admin
    const existingUser = await prisma.user.findFirst({
      where: { email: 'admin@astrostar.com' },
      include: { role: true }
    });

    if (existingUser) {
      console.log('✅ Usuario admin ya existe:');
      console.log('   Email:', existingUser.email);
      console.log('   Rol:', existingUser.role.name);
      console.log('\n📧 Credenciales de prueba:');
      console.log('   Email: admin@astrostar.com');
      console.log('   Password: Admin123!');
      return;
    }

    console.log('📝 Creando usuario de prueba...');

    // Verificar que exista el rol Admin
    let adminRole = await prisma.role.findFirst({
      where: { name: 'Admin' }
    });

    if (!adminRole) {
      console.log('⚠️  Rol Admin no encontrado, creando...');
      adminRole = await prisma.role.create({
        data: {
          name: 'Admin',
          description: 'Administrador del sistema',
          permissions: {}
        }
      });
    }

    // Verificar que exista un tipo de documento
    let documentType = await prisma.documentType.findFirst();
    
    if (!documentType) {
      console.log('⚠️  Tipo de documento no encontrado, creando...');
      documentType = await prisma.documentType.create({
        data: {
          name: 'Cédula de Ciudadanía',
          description: 'Documento de identidad colombiano'
        }
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin@astrostar.com',
        passwordHash: passwordHash,
        phoneNumber: '3001234567',
        address: 'Dirección de prueba',
        birthDate: new Date('1990-01-01'),
        identification: '1234567890',
        status: 'Active',
        documentTypeId: documentType.id,
        roleId: adminRole.id,
        age: 34
      },
      include: {
        role: true
      }
    });

    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log('\n📧 Credenciales de prueba:');
    console.log('   Email: admin@astrostar.com');
    console.log('   Password: Admin123!');
    console.log('\n👤 Información del usuario:');
    console.log('   ID:', user.id);
    console.log('   Nombre:', user.firstName, user.lastName);
    console.log('   Rol:', user.role.name);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
