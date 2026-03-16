# 📚 EXPLICACIÓN DETALLADA - MÓDULO DE ROLES

## 🏗️ ARQUITECTURA GENERAL

El módulo de roles sigue una **arquitectura en capas** (Layered Architecture) con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                     │
├─────────────────────────────────────────────────────────────┤
│  Components │  Hooks  │  Services  │  Validations │  Utils  │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTP Requests
                              │
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js)                     │
├─────────────────────────────────────────────────────────────┤
│   Routes   │ Controllers │ Services │ Repository │ Database │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 BACKEND - EXPLICACIÓN DETALLADA

### **1. 📊 BASE DE DATOS (Prisma Schema)**

```prisma
model Role {
  id          Int        @id @default(autoincrement())
  name        String     @unique @db.VarChar(50)
  description String     @db.VarChar(200)
  status      RoleStatus @default(Active)
  permissions Json?      @default("{}")
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  users       User[]
}
```

**Explicación:**
- **id**: Clave primaria autoincremental
- **name**: Nombre único del rol (máximo 50 caracteres)
- **description**: Descripción del rol (máximo 200 caracteres)
- **status**: Estado del rol (Active/Inactive)
- **permissions**: JSON con permisos granulares por módulo
- **timestamps**: Fechas de creación y actualización automáticas
- **users**: Relación uno-a-muchos con usuarios

### **2. 🗄️ REPOSITORY LAYER (Acceso a Datos)**

**Archivo:** `roles.repository.js`

```javascript
export class RoleRepository {
  // Métodos principales:
  async findAll({ page, limit, search })     // Paginación y búsqueda
  async create(roleData)                     // Crear rol
  async findById(id)                         // Buscar por ID
  async findByName(name)                     // Buscar por nombre exacto
  async findByNameCaseInsensitive(name)      // Buscar sin case-sensitive
  async update(id, roleData)                 // Actualizar rol
  async delete(id)                           // Eliminar con validaciones
  async getStats()                           // Estadísticas
}
```

**Responsabilidades:**
- **Abstrae las consultas a la base de datos**
- **Maneja paginación y búsqueda**
- **Implementa validaciones de seguridad** (protege rol Administrador)
- **Gestiona relaciones** (incluye usuarios asociados)

**Ejemplo de método complejo:**
```javascript
async findAll({ page, limit, search }) {
  const skip = (page - 1) * limit;
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [roles, total] = await Promise.all([
    prisma.role.findMany({ where, skip, take: limit, include: { users: true } }),
    prisma.role.count({ where })
  ]);

  return { roles, total, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
```

### **3. 🔧 SERVICE LAYER (Lógica de Negocio)**

**Archivo:** `roles.services.js`

```javascript
export class RoleService {
  // Métodos principales:
  async getAllRoles({ page, limit, search })    // Obtener con paginación
  async createRole(roleData)                    // Crear con validaciones
  async getRoleById(id)                         // Obtener por ID
  async updateRole(id, roleData)                // Actualizar con validaciones
  async deleteRole(id)                          // Eliminar con restricciones
  async checkRoleNameExists(name, excludeId)    // Validar nombres duplicados
  validatePermissions(permissions)              // Validar estructura de permisos
  getAvailablePermissions()                     // Obtener permisos disponibles
}
```

**Responsabilidades:**
- **Implementa la lógica de negocio**
- **Valida reglas de negocio** (nombres únicos, roles protegidos)
- **Coordina operaciones complejas**
- **Maneja errores específicos del dominio**

**Ejemplo de lógica de negocio:**
```javascript
async createRole(roleData) {
  // 1. Verificar nombre único
  const existingRole = await this.roleRepository.findByNameCaseInsensitive(roleData.name);
  if (existingRole) {
    throw new Error(`El nombre "${roleData.name}" ya está en uso.`);
  }

  // 2. Crear el rol
  const newRole = await this.roleRepository.create(roleData);
  return newRole;
}
```

### **4. 🎮 CONTROLLER LAYER (Manejo de HTTP)**

**Archivo:** `roles.controller.js`

```javascript
export class RoleController {
  // Endpoints principales:
  getAllRoles = async (req, res)              // GET /api/roles
  createRole = async (req, res)               // POST /api/roles
  getRoleById = async (req, res)              // GET /api/roles/:id
  updateRole = async (req, res)               // PUT /api/roles/:id
  deleteRole = async (req, res)               // DELETE /api/roles/:id
  getRoleStats = async (req, res)             // GET /api/roles/stats
  getAvailablePermissions = async (req, res)  // GET /api/roles/permissions
  checkRoleNameAvailability = async (req, res) // GET /api/roles/check-name
}
```

**Responsabilidades:**
- **Maneja peticiones HTTP**
- **Valida parámetros de entrada**
- **Coordina con el service layer**
- **Formatea respuestas JSON**
- **Maneja códigos de estado HTTP**

**Ejemplo de endpoint completo:**
```javascript
createRole = async (req, res) => {
  try {
    const { name, description, status, permissions } = req.body;

    const newRole = await this.roleService.createRole({
      name: name.trim(),
      description: description.trim(),
      status: status || 'Active',
      permissions: permissions || {}
    });

    res.status(201).json({
      success: true,
      data: newRole,
      message: `El rol "${newRole.name}" ha sido creado exitosamente`
    });
  } catch (error) {
    // Manejo específico de errores
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: `El nombre "${req.body.name}" ya está en uso.`
      });
    }
    // ... más manejo de errores
  }
};
```

### **5. 🛡️ VALIDATION LAYER (Validaciones)**

**Archivo:** `role.validator.js`

```javascript
export const roleValidators = {
  create: [
    body('name')
      .notEmpty().withMessage('El nombre del rol es obligatorio.')
      .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/).withMessage('Solo se permiten letras, números y espacios.')
      .custom(async (value) => {
        const existingRole = await roleRepository.findByNameCaseInsensitive(value);
        if (existingRole) {
          throw new Error(`El nombre "${value}" ya está en uso.`);
        }
      }),
    // ... más validaciones
  ],
  update: [...],
  delete: [...],
  getAll: [...]
}
```

**Responsabilidades:**
- **Valida entrada antes de llegar al controller**
- **Sanitiza datos de entrada**
- **Verifica nombres duplicados en tiempo real**
- **Proporciona mensajes de error específicos**

### **6. 🛣️ ROUTES LAYER (Definición de Rutas)**

**Archivo:** `roles.routes.js`

```javascript
// Rutas específicas ANTES de rutas con parámetros
router.get('/check-name', roleController.checkRoleNameAvailability);
router.get('/stats', roleController.getRoleStats);
router.get('/permissions', roleController.getAvailablePermissions);

// Rutas con parámetros AL FINAL
router.get('/:id', roleValidators.getById, handleValidationErrors, roleController.getRoleById);
```

**Responsabilidades:**
- **Define endpoints y métodos HTTP**
- **Aplica middlewares de validación**
- **Documenta API con Swagger**
- **Maneja orden de rutas** (específicas antes que paramétricas)

### **7. 🔐 MIDDLEWARE LAYER (Seguridad y Permisos)**

**Archivo:** `checkRole.js`

```javascript
export const checkRole = (requiredRoles) => {
  return async (req, res, next) => {
    // 1. Verificar autenticación
    // 2. Obtener rol del usuario
    // 3. Verificar permisos
    // 4. Permitir o denegar acceso
  };
};

export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    // Verificación granular de permisos
  };
};
```

---

## 🎨 FRONTEND - EXPLICACIÓN DETALLADA

### **1. 📱 COMPONENTS LAYER (Interfaz de Usuario)**

#### **A. Componente Principal: `Roles.jsx`**

```javascript
const Roles = () => {
  // Hooks personalizados
  const { roles, pagination, fetchRoles, createRole, updateRole, deleteRole } = useRoles();
  const { hasPermission } = usePermissions();
  
  // Estados locales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Efectos para búsqueda y paginación
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchRoles({ page: currentPage, limit: rowsPerPage, search: searchTerm });
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, currentPage]);
  
  // Handlers para CRUD
  const handleSave = async (newRole) => { /* ... */ };
  const handleEdit = (role) => { /* ... */ };
  const handleDelete = async (role) => { /* ... */ };
  
  return (
    // JSX con tabla, modales, paginación
  );
};
```

**Responsabilidades:**
- **Gestiona estado de la interfaz**
- **Coordina operaciones CRUD**
- **Maneja búsqueda y paginación**
- **Controla modales y formularios**

#### **B. Modal de Creación/Edición: `RoleModal.jsx`**

```javascript
const RoleModal = ({ isOpen, onClose, onSave, roleData }) => {
  // Hooks de validación
  const { values: formData, errors, touched, handleChange, validateAllFields } = useFormRoleValidation();
  const { nameValidation, validateRoleName } = useRoleNameValidation(roleData?.id);
  
  // Estados para permisos
  const [expandedCategories, setExpandedCategories] = useState({});
  const [permissionError, setPermissionError] = useState("");
  
  // Manejo de permisos por módulo
  const handlePermissionChange = (moduleKey, action) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [moduleKey]: { ...prev.permisos[moduleKey], [action]: !prev.permisos[moduleKey]?.[action] }
      }
    }));
  };
  
  return (
    // Modal con formulario, validaciones en tiempo real, gestión de permisos
  );
};
```

**Características:**
- **Validación en tiempo real**
- **Gestión visual de permisos**
- **Animaciones con Framer Motion**
- **Formulario responsivo**

### **2. 🎣 HOOKS LAYER (Lógica Reutilizable)**

#### **A. Hook Principal: `useRoles.js`**

```javascript
export const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  
  const fetchRoles = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await rolesService.getAllRoles(params);
      if (response.success) {
        setRoles(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      showErrorAlert('Error', 'No se pudieron cargar los roles');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const createRole = async (roleData, currentParams = {}) => {
    // Lógica de creación con manejo de errores
  };
  
  return { roles, loading, pagination, fetchRoles, createRole, updateRole, deleteRole };
};
```

#### **B. Hook de Validación: `useRoleNameValidation.js`**

```javascript
export const useRoleNameValidation = (currentRoleId = null) => {
  const [nameValidation, setNameValidation] = useState({
    isChecking: false,
    isDuplicate: false,
    message: '',
    isAvailable: false
  });
  
  const validateRoleName = async (name) => {
    if (!name || name.trim().length < 2) return;
    
    try {
      const response = await rolesService.checkRoleNameAvailability(name.trim(), currentRoleId);
      
      if (response.success) {
        setNameValidation({
          isChecking: false,
          isDuplicate: !response.data.available,
          message: response.data.message,
          isAvailable: response.data.available
        });
      }
    } catch (error) {
      // Fallback a validación local
    }
  };
  
  const debouncedValidateRoleName = (name) => {
    // Debounce de 300ms para optimizar peticiones
  };
  
  return { nameValidation, validateRoleName: debouncedValidateRoleName };
};
```

#### **C. Hook de Validación de Formularios: `useFormRoleValidation.js`**

```javascript
export const useFormRoleValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validateField = (name, value) => {
    const rules = validationRules[name];
    for (const rule of rules) {
      const error = rule(value, values);
      if (error) return error;
    }
    return '';
  };
  
  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };
  
  return { values, errors, touched, handleChange, handleBlur, validateAllFields };
};

// Reglas de validación sincronizadas con el backend
export const roleValidationRules = {
  nombre: [
    (value) => !value?.trim() ? 'El nombre del rol es obligatorio.' : '',
    (value) => value?.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres.' : '',
    (value) => value?.trim().length > 50 ? `El nombre no puede exceder 50 caracteres (${value?.trim().length}/50).` : '',
    (value) => !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/.test(value?.trim() || '') ? 'Solo se permiten letras, números y espacios.' : ''
  ],
  // ... más reglas
};
```

### **3. 🌐 SERVICES LAYER (Comunicación con API)**

**Archivo:** `rolesService.js`

```javascript
class RolesService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/roles`;
  }
  
  async makeRequest(endpoint = '', options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = { headers: { 'Content-Type': 'application/json' }, ...options };
    
    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }
  
  // Métodos para cada endpoint
  async getAllRoles(params = {}) { /* ... */ }
  async createRole(roleData) { /* ... */ }
  async updateRole(id, roleData) { /* ... */ }
  async deleteRole(id) { /* ... */ }
  async checkRoleNameAvailability(name, excludeId = null) { /* ... */ }
}

export default new RolesService();
```

---

## 🔄 FLUJO DE DATOS COMPLETO

### **Ejemplo: Crear un Nuevo Rol**

```
1. 👤 Usuario llena formulario en RoleModal
   ↓
2. 🔍 useRoleNameValidation valida nombre en tiempo real
   ↓ (300ms debounce)
3. 🌐 rolesService.checkRoleNameAvailability()
   ↓
4. 🛣️ GET /api/roles/check-name?name=Editor
   ↓
5. 🎮 roleController.checkRoleNameAvailability()
   ↓
6. 🔧 roleService.checkRoleNameExists()
   ↓
7. 🗄️ roleRepository.findByNameCaseInsensitive()
   ↓
8. 📊 Consulta a PostgreSQL
   ↓
9. 📤 Respuesta: { available: false, message: "Nombre en uso" }
   ↓
10. 🎨 UI muestra: ❌ "Nombre no disponible"

--- Si el usuario corrige el nombre y envía ---

11. 👤 Usuario hace clic en "Crear Rol"
    ↓
12. 🔍 useFormRoleValidation valida todos los campos
    ↓
13. 🎣 useRoles.createRole() se ejecuta
    ↓
14. 🌐 rolesService.createRole(roleData)
    ↓
15. 🛣️ POST /api/roles con datos del rol
    ↓
16. 🛡️ roleValidators.create valida entrada
    ↓
17. 🎮 roleController.createRole()
    ↓
18. 🔧 roleService.createRole()
    ↓
19. 🗄️ roleRepository.create()
    ↓
20. 📊 INSERT en PostgreSQL
    ↓
21. 📤 Respuesta: { success: true, data: newRole }
    ↓
22. 🎨 UI muestra: ✅ "Rol creado exitosamente"
    ↓
23. 🔄 Lista de roles se actualiza automáticamente
```

---

## 🎯 CARACTERÍSTICAS AVANZADAS

### **1. 🔍 Validación en Tiempo Real**
- **Debounce de 300ms** para optimizar peticiones
- **Validación case-insensitive** ("admin" detecta "Admin")
- **Fallback local** si falla la conexión
- **Estados visuales claros** (verificando, disponible, no disponible)

### **2. 🛡️ Sistema de Permisos Granulares**
- **10 categorías de módulos**
- **4 acciones por módulo** (Crear, Editar, Eliminar, Ver)
- **40+ permisos individuales**
- **Interfaz visual intuitiva** con contadores y selección masiva

### **3. 🔒 Seguridad Robusta**
- **Protección del rol Administrador** (no editable/eliminable)
- **Validación de roles activos** (no eliminables)
- **Verificación de roles en uso** (no eliminables si tienen usuarios)
- **Sanitización de entrada** en frontend y backend

### **4. 📱 UX/UI Optimizada**
- **Animaciones suaves** con Framer Motion
- **Estados de carga** con spinners
- **Mensajes específicos** y concisos
- **Diseño responsivo** para móviles
- **Feedback inmediato** en validaciones

### **5. 🚀 Performance**
- **Paginación eficiente** en backend
- **Búsqueda optimizada** con índices de base de datos
- **Debounce en búsquedas** para reducir peticiones
- **Carga lazy** de componentes pesados
- **Cache local** de roles para validaciones

---

## 📋 RESUMEN DE ARCHIVOS Y RESPONSABILIDADES

### **Backend (Node.js + Express + Prisma)**
```
src/modules/Roles/
├── controllers/roles.controller.js    # 🎮 Manejo HTTP, códigos de estado
├── services/roles.services.js         # 🔧 Lógica de negocio, validaciones
├── repository/roles.repository.js     # 🗄️ Acceso a datos, consultas SQL
├── routes/roles.routes.js             # 🛣️ Definición de endpoints + Swagger
├── validators/role.validator.js       # 🛡️ Validaciones de entrada
└── tests/roles.test.js               # 🧪 Pruebas unitarias
```

### **Frontend (React + Hooks + Services)**
```
src/features/dashboard/pages/Admin/pages/Roles/
├── Roles.jsx                         # 📱 Componente principal, lista
├── components/
│   ├── RoleModal.jsx                 # 📝 Modal crear/editar
│   └── RoleDetailModal.jsx           # 👁️ Modal ver detalles
└── hooks/
    ├── useRoles.js                   # 🎣 Hook principal CRUD
    ├── useFormRoleValidation.js      # 🔍 Validaciones de formulario
    └── useRoleNameValidation.js      # ⚡ Validación en tiempo real

src/shared/
├── services/rolesService.js          # 🌐 Comunicación con API
├── hooks/useRoles.js                 # 🎣 Hook global de roles
└── components/                       # 🧩 Componentes reutilizables
```

---

## 🎉 CONCLUSIÓN

Este módulo de roles es un **sistema completo y profesional** que implementa:

✅ **Arquitectura escalable** con separación de responsabilidades
✅ **Validaciones robustas** en frontend y backend sincronizadas
✅ **Sistema de permisos granulares** con interfaz visual intuitiva
✅ **Seguridad avanzada** con protecciones múltiples
✅ **UX/UI optimizada** con validación en tiempo real
✅ **Performance optimizada** con paginación, búsqueda y cache
✅ **Documentación completa** con Swagger
✅ **Manejo de errores robusto** con mensajes específicos
✅ **Código mantenible** con patrones de diseño claros

Es una **base sólida** para construir otros módulos del sistema AstroStar siguiendo los mismos patrones y estándares de calidad.
