import prisma from '../config/database.js';

/**
 * Script para verificar que el rol de administrador tenga todos los permisos
 */
const verifyAdminPermissions = async () => {
  try {
    console.log('🔍 Verificando permisos del rol de Administrador...');

    // Buscar el rol de administrador
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Administrador' }
    });

    if (!adminRole) {
      console.error('❌ No se encontró el rol de Administrador');
      return false;
    }

    console.log('✅ Rol de Administrador encontrado:', adminRole.name);

    // Verificar permisos
    const permissions = adminRole.permissions || {};
    const modules = Object.keys(permissions);

    console.log('📋 Módulos con permisos:', modules.length);

    // Lista esperada de módulos
    const expectedModules = [
      'dashboard', 'users', 'roles', 'sportsEquipment',
      'employees', 'employeesSchedule', 'appointmentManagement',
      'sportsCategory', 'athletesSection', 'athletesAssistance',
      'donorsSponsors', 'donationsManagement',
      'eventsManagement', 'temporaryWorkers', 'temporaryTeams',
      'providers', 'purchasesManagement'
    ];

    const expectedActions = ['Ver', 'Crear', 'Editar', 'Eliminar'];

    console.log('🎯 Módulos esperados:', expectedModules.length);

    // Verificar módulos faltantes
    const missingModules = expectedModules.filter(module => !permissions[module]);
    if (missingModules.length > 0) {
      console.error('❌ Módulos faltantes:', missingModules);
    } else {
      console.log('✅ Todos los módulos están presentes');
    }

    // Verificar permisos por módulo
    let totalPermissions = 0;
    let missingPermissions = [];

    for (const module of expectedModules) {
      if (permissions[module]) {
        for (const action of expectedActions) {
          totalPermissions++;
          if (!permissions[module][action]) {
            missingPermissions.push(`${module}.${action}`);
          }
        }
      }
    }

    console.log('🔐 Total de permisos verificados:', totalPermissions);

    if (missingPermissions.length > 0) {
      console.error('❌ Permisos faltantes:', missingPermissions);
      return false;
    } else {
      console.log('✅ Todos los permisos están configurados correctamente');
    }

    // Mostrar resumen detallado
    console.log('\n📊 RESUMEN DETALLADO:');
    console.log('='.repeat(50));
    
    for (const module of expectedModules) {
      const modulePerms = permissions[module] || {};
      const activePerms = expectedActions.filter(action => modulePerms[action]).length;
      const status = activePerms === expectedActions.length ? '✅' : '❌';
      
      console.log(`${status} ${module}: ${activePerms}/${expectedActions.length} permisos`);
      
      if (activePerms < expectedActions.length) {
        const missing = expectedActions.filter(action => !modulePerms[action]);
        console.log(`   Faltantes: ${missing.join(', ')}`);
      }
    }

    console.log('='.repeat(50));
    console.log('🎉 Verificación completada');

    return missingModules.length === 0 && missingPermissions.length === 0;

  } catch (error) {
    console.error('❌ Error verificando permisos:', error);
    return false;
  }
};

/**
 * Ejecutar verificación si se llama directamente
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyAdminPermissions()
    .then((success) => {
      if (success) {
        console.log('✅ Verificación exitosa: El administrador tiene todos los permisos');
        process.exit(0);
      } else {
        console.log('❌ Verificación fallida: Faltan permisos para el administrador');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Error en verificación:', error);
      process.exit(1);
    });
}

export { verifyAdminPermissions };