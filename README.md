# 🌟 AstroStar Backend

Sistema de gestión deportiva completo desarrollado con Node.js, Express y PostgreSQL. Proporciona una API REST robusta para la administración de ASTROSTAR.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Base de Datos](#-base-de-datos)
- [Arquitectura](#-arquitectura)
- [Scripts Disponibles](#-scripts-disponibles)
- [Testing](#-testing)
- [Contribución](#-contribución)

## ✨ Características

- **Sistema de Roles y Permisos Granulares**: Control de acceso basado en roles con permisos específicos por módulo
- **Gestión de Atletas**: Registro completo de atletas con información de tutores y categorías deportivas
- **Administración de Servicios**: Gestión de eventos deportivos, entrenamientos y competencias
- **Sistema de Inscripciones**: Control de inscripciones con estados y fechas de vencimiento
- **Gestión de Equipos**: Organización de atletas en equipos con posiciones y números de camiseta
- **Sistema de Materiales para Eventos**: Gestión de materiales consumibles y reutilizables con control de stock
- **Integración Donaciones → Materiales → Eventos**: Conexión automática de donaciones con inventario y eventos
- **Proveedores y Compras**: Sistema completo de gestión de proveedores y compras
- **API REST Completa**: Endpoints bien documentados con Swagger
- **Validación Robusta**: Validación de datos en múltiples capas
- **Arquitectura Escalable**: Diseño modular y mantenible

## 🛠 Tecnologías

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma 6.x
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Express Validator
- **Documentación**: Swagger/OpenAPI 3.0
- **Encriptación**: bcryptjs
- **CORS**: Habilitado para frontend

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- PostgreSQL >= 13.0
- npm >= 8.0.0

## 🚀 Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd astrostar_backend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Configurar base de datos**

```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar datos iniciales
npm run prisma:seed
```

5. **Verificar instalación**

```bash
npm run test:system
```

## ⚙️ Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/astrostar?schema=public"

# Servidor
PORT=4000

# JWT (opcional para futuras implementaciones)
JWT_SECRET="tu_jwt_secret_aqui"
JWT_EXPIRES_IN="24h"

# Entorno
NODE_ENV="development"
```

### Base de Datos PostgreSQL

1. **Crear base de datos**

```sql
CREATE DATABASE astrostar;
CREATE USER astrostar_user WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE astrostar TO astrostar_user;
```

2. **Verificar conexión**

```bash
npm run test:db
```

## 🎯 Uso

### Desarrollo

```bash
# Iniciar servidor en modo desarrollo (con hot reload)
npm run dev

# El servidor estará disponible en:
# - API: http://localhost:4000/api
# - Documentación: http://localhost:4000/api-docs
# - Health Check: http://localhost:4000/health
```

### Producción

```bash
# Iniciar servidor en modo producción
npm start
```

### Prisma Studio (Interfaz visual de BD)

```bash
npm run prisma:studio
# Abre en http://localhost:5555
```

## 📚 API Endpoints

### Roles

- `GET /api/roles` - Obtener todos los roles (con paginación y búsqueda)
- `GET /api/roles/:id` - Obtener rol por ID
- `POST /api/roles` - Crear nuevo rol
- `PUT /api/roles/:id` - Actualizar rol
- `DELETE /api/roles/:id` - Eliminar rol
- `GET /api/roles/check-name` - Verificar disponibilidad de nombre
- `GET /api/roles/stats` - Estadísticas de roles
- `GET /api/roles/permissions` - Obtener permisos disponibles

### Documentación Completa

Visita `http://localhost:4000/api-docs` para ver la documentación interactiva de Swagger con todos los endpoints disponibles.

## 🗄️ Base de Datos

### Modelos Principales

- **Users**: Usuarios del sistema con información personal
- **Roles**: Roles con permisos granulares por módulo
- **Athletes**: Atletas con información deportiva
- **Guardians**: Tutores de atletas menores de edad
- **Services**: Eventos y servicios deportivos
- **Teams**: Equipos deportivos
- **Inscriptions**: Inscripciones de atletas
- **Providers**: Proveedores de servicios/productos
- **Purchases**: Compras y adquisiciones

### Migraciones y Seeders

```bash
# Crear nueva migración
npm run prisma:migrate

# Resetear base de datos (¡CUIDADO!)
npm run prisma:reset

# Ejecutar solo seeders
npm run prisma:seed

# Ver estado de migraciones
npm run prisma:status
```

## 🏗️ Arquitectura

El proyecto sigue una **arquitectura en capas** bien definida:

```
┌─────────────────────────────────────────┐
│                CLIENTE                  │
├─────────────────────────────────────────┤
│            ROUTES (HTTP)                │
├─────────────────────────────────────────┤
│         MIDDLEWARES (Auth/Valid)        │
├─────────────────────────────────────────┤
│        CONTROLLERS (HTTP Logic)         │
├─────────────────────────────────────────┤
│        SERVICES (Business Logic)        │
├─────────────────────────────────────────┤
│       REPOSITORY (Data Access)          │
├─────────────────────────────────────────┤
│        DATABASE (PostgreSQL)            │
└─────────────────────────────────────────┘
```

### Estructura de Directorios

```
src/
├── config/           # Configuraciones (DB, Swagger)
├── middlewares/      # Middlewares globales
├── modules/          # Módulos de negocio
│   └── Roles/        # Ejemplo: módulo de roles
│       ├── controllers/
│       ├── services/
│       ├── repository/
│       ├── routes/
│       ├── validators/
│       └── tests/
├── routes/           # Router principal
└── utils/            # Utilidades y helpers
```

Para más detalles, consulta [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md).

## 📜 Scripts Disponibles

### Desarrollo

```bash
npm run dev          # Servidor con hot reload
npm start           # Servidor producción
```

### Base de Datos

```bash
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:seed      # Poblar datos iniciales
npm run prisma:studio    # Interfaz visual
npm run prisma:push      # Push schema sin migración
npm run prisma:reset     # Reset completo de BD
```

### Testing

```bash
npm run test:system     # Test completo del sistema
npm run test:db         # Test de conexión a BD
npm run test:roles      # Test específico de roles
```

## 🧪 Testing

### Test de Sistema Completo

```bash
npm run test:system
```

Este comando ejecuta:

- ✅ Test de conexión a base de datos
- ✅ Test de funcionalidad de roles
- ✅ Verificación de variables de entorno
- ✅ Validación de estructura de datos

### Test de Conexión a BD

```bash
npm run test:db
```

### Test Específicos por Módulo

```bash
npm run test:roles      # Test del módulo de roles
```

## 🔒 Seguridad

- **Validación de Datos**: Validación en múltiples capas (middleware, service, repository)
- **Sanitización**: Limpieza automática de datos de entrada
- **CORS**: Configurado para permitir requests del frontend
- **Encriptación**: Contraseñas hasheadas con bcryptjs
- **Roles y Permisos**: Sistema granular de autorización

## 🚀 Despliegue

### Variables de Entorno para Producción

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/astrostar"
PORT=4000
```

### Comandos de Despliegue

```bash
# Instalar dependencias de producción
npm ci --only=production

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:deploy

# Iniciar aplicación
npm start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

### Estándares de Código

- Usar ES Modules (import/export)
- Seguir arquitectura en capas establecida
- Documentar endpoints con Swagger
- Incluir validaciones en todas las capas
- Escribir tests para nuevas funcionalidades

## 📝 Changelog

### v1.0.0 (Actual)

- ✅ Sistema completo de roles y permisos
- ✅ Gestión de atletas y tutores
- ✅ API REST con documentación Swagger
- ✅ Base de datos PostgreSQL con Prisma
- ✅ Arquitectura escalable y mantenible

---

**ASTROSTAR**
