import prisma from '../src/config/database.js';
import bcrypt from 'bcrypt';

async function setupAdmin() {
  try {
    console.log('🔍 Verificando configuración de administrador...\n');

    // 1. Verificar si existe el rol Admin
    let adminRole = await prisma.role.findFirst({
      where: { 
        OR: [
          { name: 'Admin' },
          { name: 'Administrador' }
        ]
      }
    });

    if (!adminRole) {
      console.log('📝 Creando rol de Administrador...');
      adminRole = await prisma.role.create({
        data: {
          name: 'Administrador',
          description: 'Administrador del sistema con acceso completo',
          permissions: {
            dashboard: { Ver: true, Crear: true, Editar: true, Eliminar: true },
            users: { Ver: true, Crear: true, Editar: true, Eliminar: true },
            roles: { Ver: true, Crear: true, Editar: true, Eliminar: true }
          }
        }
      });
      console.log('✅ Rol creado:', adminRole.name);
    } else {
      console.log('✅ Rol encontrado:', adminRole.name);
    }

    // 2. Verificar tipo de documento
    let documentType = await prisma.documentType.findFirst();
    
    if (!documentType) {
      console.log('📝 Creando tipo de documento...');
      documentType = await prisma.documentType.create({
        data: {
          name: 'Cédula de Ciudadanía',
          description: 'Documento de identidad'
        }
      });
      console.log('✅ Tipo de documento creado');
    }

    // 3. Verificar si existe usuario admin
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@astrostar.com' },
      include: { role: true }
    });

    if (existingAdmin) {
      console.log('\n✅ Usuario administrador ya existe:');
      console.log('   📧 Email:', existingAdmin.email);
      console.log('   👤 Nombre:', existingAdmin.firstName, existingAdmin.lastName);
      console.log('   🎭 Rol:', existingAdmin.role.name);
      console.log('\n🔑 Credenciales de acceso:');
      console.log('   Email: admin@astrostar.com');
      console.log('   Password: Admin123!');
      console.log('\n⚠️  Si olvidaste la contraseña, elimina este usuario y vuelve a ejecutar el script.');
      return;
    }

    // 4. Crear usuario admin
    console.log('\n📝 Creando usuario administrador...');
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    const admin = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin@astrostar.com',
        passwordHash: passwordHash,
        phoneNumber: '3001234567',
        address: 'Oficina Principal',
        birthDate: new Date('1990-01-01'),
        identification: '1000000001',
        status: 'Active',
        documentTypeId: documentType.id,
        roleId: adminRole.id,
        age: 34
      },
      include: {
        role: true
      }
    });

    console.log('✅ Usuario administrador creado exitosamente!\n');
    console.log('📋 Información del usuario:');
    console.log('   ID:', admin.id);
    console.log('   📧 Email:', admin.email);
    console.log('   👤 Nombre:', admin.firstName, admin.lastName);
    console.log('   🎭 Rol:', admin.role.name);
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Email: admin@astrostar.com');
    console.log('   Password: Admin123!');
    console.log('\n🚀 Ahora puedes iniciar sesión en la aplicación web!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.error('⚠️  Ya existe un usuario con ese email o identificación');
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
