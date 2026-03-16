# 🛡️ SISTEMA DE PERMISOS GRANULARES - GUÍA PARA DESARROLLADORES

Hemos implementado un sistema de permisos granulares que permite controlar exactamente qué puede hacer cada usuario en cada módulo de la aplicación. **Los permisos se definen una sola vez al crear roles**, y luego cada módulo consulta automáticamente esos permisos.

---

## 🎯 **¿CÓMO FUNCIONA EL SISTEMA?**

### **1. FLUJO GENERAL**

```
ADMIN CREA ROL → USUARIO RECIBE ROL → MÓDULOS CONSULTAN PERMISOS → UI SE ADAPTA
```

### **2. EJEMPLO PRÁCTICO**

**Paso 1: Admin crea rol "Editor de Contenido"**

```javascript
// En el modal de roles, el admin selecciona:
Rol "Editor de Contenido" = {
  permissions: {
    users: { Ver: true, Crear: false, Editar: false, Eliminar: false },
    materials: { Ver: true, Crear: true, Editar: true, Eliminar: false },
    materialCategories: { Ver: true, Crear: true, Editar: true, Eliminar: false },
    donationsManagement: { Ver: true, Crear: true, Editar: true, Eliminar: true }
  }
}
```

**Paso 2: Usuario "Jennifer" recibe el rol**

```javascript
Usuario "Jennifer" = {
  name: "Jennifer Lascarro",
  role: "Editor de Contenido" // ← Hereda TODOS los permisos del rol
}
```

**Paso 3: Los módulos consultan automáticamente**

```javascript
// En el módulo de Usuarios
hasPermission("users", "Crear"); // → false (botón oculto)

// En el módulo de Material Deportivo
hasPermission("materials", "Crear"); // → true (botón visible)
```

---

## 🚀 **CÓMO IMPLEMENTAR EN TU MÓDULO (3 PASOS SIMPLES)**

### **PASO 1: Agregar Importaciones (2 líneas)**

```jsx
// Al inicio de tu componente, agregar estas 2 líneas:
import PermissionGuard from "../../../../../../shared/components/PermissionGuard";
import { usePermissions } from "../../../../../../shared/hooks/usePermissions";
```

### **PASO 2: Usar el Hook (1 línea)**

```jsx
const TuModulo = () => {
  const { hasPermission } = usePermissions(); // ← Agregar esta línea
  // ... resto de tu código existente (no cambiar nada más)
};
```

### **PASO 3: Proteger Elementos**

**A) Proteger Botones:**

```jsx
{
  /* Envolver botones importantes con PermissionGuard */
}
<PermissionGuard module="tuModulo" action="Crear">
  <button onClick={handleCreate}>
    <FaPlus /> Crear
  </button>
</PermissionGuard>;
```

**B) Configurar Tabla:**

```jsx
<Table
  // Cambiar estas líneas:
  onEdit={hasPermission("tuModulo", "Editar") ? handleEdit : null}
  onDelete={hasPermission("tuModulo", "Eliminar") ? handleDelete : null}
  onView={hasPermission("tuModulo", "Ver") ? handleView : null}
  // Agregar esta configuración:
  buttonConfig={{
    edit: (item) => ({ show: hasPermission("tuModulo", "Editar") }),
    delete: (item) => ({ show: hasPermission("tuModulo", "Eliminar") }),
    view: (item) => ({ show: hasPermission("tuModulo", "Ver") }),
  }}
/>
```

**C) Verificar en Funciones:**

```jsx
const handleEdit = (item) => {
  // Agregar esta verificación al inicio:
  if (!hasPermission('tuModulo', 'Editar')) {
    showErrorAlert('Sin permisos', 'No tienes permisos para editar');
    return;
  }
  // ... tu código existente
};
  }}
/>;
```

---

## 📝 **NOMBRES DE MÓDULOS DISPONIBLES**

**IMPORTANTE**: Usa exactamente estos nombres en tu código:

```javascript
const MODULOS_DISPONIBLES = [
  "dashboard", // Dashboard principal
  "users", // Usuarios
  "roles", // Roles y permisos
  "materials", // Material deportivo
  "materialCategories", // Categorías de materiales
  "materialsRegistry", // Ingresos de materiales
  "employees", // Empleados
  "employeesSchedule", // Horario de empleados
  "appointmentManagement", // Gestión de citas
  "sportsCategory", // Categorías deportivas
  "athletesSection", // Gestión de deportistas
  "athletesAssistance", // Asistencia de deportistas
  "donorsSponsors", // Donantes y patrocinadores
  "donationsManagement", // Gestión de donaciones
  "eventsManagement", // Gestión de eventos
  "temporaryWorkers", // Trabajadores temporales
  "temporaryTeams", // Equipos temporales
  "providers", // Proveedores
  "purchasesManagement", // Gestión de compras
];
```

**ACCIONES DISPONIBLES:**

```javascript
const ACCIONES_DISPONIBLES = ["Ver", "Crear", "Editar", "Eliminar", "Listar"];
```

---

## 🎯 **EJEMPLOS ESPECÍFICOS POR MÓDULO**

### **EMPLEADOS**

```jsx
// Reemplaza "employees" por tu módulo específico
<PermissionGuard module="employees" action="Crear">
  <button onClick={handleCreateEmployee}>Crear Empleado</button>
</PermissionGuard>

// En la tabla
onEdit={hasPermission('employees', 'Editar') ? handleEdit : null}
```

### **CITAS**

```jsx
// Reemplaza "appointmentManagement" por tu módulo específico
<PermissionGuard module="appointmentManagement" action="Crear">
  <button onClick={handleCreateAppointment}>Crear Cita</button>
</PermissionGuard>
```

### **DONACIONES**

```jsx
// Reemplaza "donationsManagement" por tu módulo específico
<PermissionGuard module="donationsManagement" action="Ver">
  <ReportButton data={donations} />
</PermissionGuard>
```

---

## ✅ **EJEMPLO COMPLETO FUNCIONAL**

```jsx
import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import PermissionGuard from "../../../../../../shared/components/PermissionGuard";
import { usePermissions } from "../../../../../../shared/hooks/usePermissions";
import Table from "../../../../../../shared/components/Table/table";
import { showErrorAlert } from "../../../../../../shared/utils/alerts";

const MiModulo = () => {
  const { hasPermission } = usePermissions(); // ← Hook de permisos
  const [data, setData] = useState([]);

  const handleCreate = () => {
    // Tu lógica existente
  };

  const handleEdit = (item) => {
    if (!hasPermission("miModulo", "Editar")) {
      showErrorAlert("Sin permisos", "No tienes permisos para editar");
      return;
    }
    // Tu lógica existente
  };

  const handleDelete = (item) => {
    if (!hasPermission("miModulo", "Eliminar")) {
      showErrorAlert("Sin permisos", "No tienes permisos para eliminar");
      return;
    }
    // Tu lógica existente
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mi Módulo</h1>

        {/* ✅ BOTÓN PROTEGIDO */}
        <PermissionGuard module="miModulo" action="Crear">
          <button onClick={handleCreate} className="btn-primary">
            <FaPlus /> Crear
          </button>
        </PermissionGuard>
      </div>

      {/* ✅ TABLA CON PERMISOS */}
      <Table
        thead={{ titles: ["Nombre", "Estado"], state: true, actions: true }}
        tbody={{ data: data, dataPropertys: ["name", "status"], state: true }}
        onEdit={hasPermission("miModulo", "Editar") ? handleEdit : null}
        onDelete={hasPermission("miModulo", "Eliminar") ? handleDelete : null}
        onView={hasPermission("miModulo", "Ver") ? handleView : null}
        buttonConfig={{
          edit: (item) => ({ show: hasPermission("miModulo", "Editar") }),
          delete: (item) => ({ show: hasPermission("miModulo", "Eliminar") }),
          view: (item) => ({ show: hasPermission("miModulo", "Ver") }),
        }}
      />
    </div>
  );
};

export default MiModulo;
```

**¡Eso es todo!** Con estos 3 pasos simples tu módulo tendrá permisos granulares funcionando.

---

## 🔧 **CASOS ESPECIALES**

### **Verificación en Lógica de Negocio**

```jsx
const handleSensitiveAction = () => {
  // ✅ Verificar permisos antes de ejecutar
  if (!hasPermission("miModulo", "Editar")) {
    showErrorAlert("Sin permisos", "No tienes permisos para esta acción");
    return;
  }

  // Continuar con la lógica
  performAction();
};
```

### **Múltiples Permisos**

```jsx
{
  /* Requiere TODOS los permisos */
}
<PermissionGuard
  module={["users", "roles"]}
  action={["Ver", "Editar"]}
  requireAll={true}
>
  <SuperAdminPanel />
</PermissionGuard>;

{
  /* Requiere AL MENOS UNO de los permisos */
}
<PermissionGuard
  module={["donations", "events"]}
  action="Ver"
  requireAll={false}
>
  <ReportsSection />
</PermissionGuard>;
```

### **Botones con Lógica Específica**

```jsx
buttonConfig={{
  delete: (item) => ({
    show: hasPermission('miModulo', 'Eliminar'),
    disabled: item.hasRelations || item.isSystemItem, // ← Tu lógica específica
    className: (item.hasRelations || item.isSystemItem) ? 'opacity-50 cursor-not-allowed' : '',
    title: item.hasRelations ? 'No se puede eliminar: tiene relaciones' : 'Eliminar'
  })
}}
```

---

## 🚨 **ERRORES COMUNES A EVITAR**

### ❌ **ERROR 1: Nombre de módulo incorrecto**

```jsx
// ❌ MAL
<PermissionGuard module="empleados" action="Crear">

// ✅ BIEN
<PermissionGuard module="employees" action="Crear">
```

### ❌ **ERROR 2: Acción incorrecta**

```jsx
// ❌ MAL
<PermissionGuard module="users" action="create">

// ✅ BIEN
<PermissionGuard module="users" action="Crear">
```

### ❌ **ERROR 3: No verificar en lógica de negocio**

```jsx
// ❌ MAL - Solo oculta el botón pero no verifica en la función
const handleDelete = (item) => {
  deleteItem(item); // ← Cualquiera puede llamar esta función
};

// ✅ BIEN - Verifica permisos en la función
const handleDelete = (item) => {
  if (!hasPermission("miModulo", "Eliminar")) {
    showErrorAlert("Sin permisos");
    return;
  }
  deleteItem(item);
};
```

---

## 📊 **ESTADO ACTUAL DE IMPLEMENTACIÓN**

### ✅ **MÓDULOS COMPLETADOS**

- ✅ **Roles**: 100% implementado
- ✅ **Usuarios**: 100% implementado
- ✅ **Material Deportivo**: 100% implementado

### ✅ **MÓDULOS RECIÉN COMPLETADOS**

- ✅ **Empleados**: 100% implementado
- ✅ **Horario Empleados**: 100% implementado
- ✅ **Gestión de Eventos**: 100% implementado
- ✅ **Trabajadores Temporales**: 100% implementado

### ⚠️ **MÓDULOS PENDIENTES** (ASIGNAR A DESARROLLADORES)

- ❌ **Gestión de Citas** → Asignar a: \***\*\_\_\_\*\***
- ❌ **Categorías Deportivas** → Asignar a: \***\*\_\_\_\*\***
- ❌ **Gestión de Deportistas** → Asignar a: \***\*\_\_\_\*\***
- ❌ **Asistencia Deportistas** → Asignar a: \***\*\_\_\_\*\***
- ❌ **Donantes/Patrocinadores** → Asignar a: \***\*\_\_\_\*\***
- ❌ **Gestión de Donaciones** → Asignar a: \***\*\_\_\_\*\***
- ❌ **Equipos Temporales** → Asignar a: \***\*\_\_\_\*\***
- ❌ **Proveedores** → Asignar a: \***\*\_\_\_\*\***
- ❌ **Gestión de Compras** → Asignar a: \***\*\_\_\_\*\***

---

## 🎯 **CHECKLIST DE IMPLEMENTACIÓN**

Para cada módulo, verificar:

- [ ] ✅ Importaciones agregadas (`PermissionGuard`, `usePermissions`)
- [ ] ✅ Hook `hasPermission` implementado
- [ ] ✅ Botón "Crear" protegido con `PermissionGuard`
- [ ] ✅ Otros botones de acción protegidos
- [ ] ✅ Tabla configurada con `buttonConfig`
- [ ] ✅ Verificación en funciones de negocio
- [ ] ✅ Probado con diferentes roles

---

## 🆘 **SOPORTE**

Si tienes dudas durante la implementación:

1. **Revisa los módulos ya implementados**: `Roles.jsx`, `Users.jsx`, `Employees.jsx`, `TemporaryWorkers.jsx`
2. **Consulta este documento**
3. **Pregunta al equipo de arquitectura**

## ⚡ **RESUMEN RÁPIDO**

**Para implementar permisos en cualquier módulo:**

1. **Importar** `PermissionGuard` y `usePermissions`
2. **Agregar** `const { hasPermission } = usePermissions();`
3. **Envolver botones** con `<PermissionGuard module="tuModulo" action="Crear">`
4. **Configurar tabla** con `hasPermission('tuModulo', 'Accion') ? handler : null`
5. **Verificar en funciones** con `if (!hasPermission(...)) return;`

**¡No necesitas crear hooks ni configuraciones adicionales!** Todo ya está listo para usar.

---

## 🎉 **BENEFICIOS DEL SISTEMA**

Una vez implementado completamente:

- ✅ **Seguridad granular**: Control exacto de qué puede hacer cada usuario
- ✅ **UX mejorada**: Los usuarios solo ven lo que pueden usar
- ✅ **Mantenimiento fácil**: Cambios de permisos desde un solo lugar (roles)
- ✅ **Escalabilidad**: Fácil agregar nuevos módulos y permisos
- ✅ **Consistencia**: Comportamiento uniforme en toda la aplicación

---


