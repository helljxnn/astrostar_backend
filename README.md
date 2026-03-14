# AstroStar Backend

Backend de gestión deportiva desarrollado con **Node.js**, **Express** y **PostgreSQL**.
Proporciona una **API REST** robusta para la administración de AstroStar (roles, atletas, servicios, inscripciones, equipos, inventario, etc.).

## Tabla de contenidos

* [Características](#características)
* [Tecnologías](#tecnologías)
* [Requisitos previos](#requisitos-previos)
* [Instalación](#instalación)
* [Configuración](#configuración)
* [Uso](#uso)
* [API Endpoints](#api-endpoints)
* [Base de datos](#base-de-datos)
* [Arquitectura](#arquitectura)
* [Scripts disponibles](#scripts-disponibles)
* [Testing](#testing)
* [Seguridad](#seguridad)
* [Despliegue](#despliegue)
* [Contribución](#contribución)
* [Changelog](#changelog)

## Características

* **Sistema de roles y permisos granulares**: control de acceso basado en roles por módulo.
* **Gestión de atletas y tutores**: información personal, datos deportivos y tutores para menores.
* **Administración de servicios**: eventos deportivos, entrenamientos, competencias.
* **Sistema de inscripciones**: estados, fechas de vencimiento y control por servicio.
* **Gestión de equipos**: equipos, posiciones y números de camiseta.
* **Inventario de materiales para eventos**: materiales consumibles y reutilizables con control de stock.
* **Integración donaciones → materiales → eventos**: impacto directo de donaciones en el inventario.
* **Proveedores y compras**: registro de proveedores y órdenes de compra.
* **API REST documentada con Swagger**.
* **Validación robusta de datos** y arquitectura modular escalable.

## Tecnologías

* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js 5.x
* **Base de datos**: PostgreSQL
* **ORM**: Prisma 6.x
* **Autenticación**: JWT (JSON Web Tokens)
* **Validación**: express-validator
* **Documentación**: Swagger / OpenAPI 3.0
* **Encriptación**: bcryptjs
* **CORS**: habilitado para el frontend AstroStar SPA

## Requisitos previos

* **Node.js** 22.15.0 (recomendado, ver archivo `.nvmrc`)
* **npm ≥ 8.0.0**
* **PostgreSQL ≥ 13.0**

Opcional (para desarrollo más cómodo):

* Docker / Docker Compose

## Instalación

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
# Edita .env con tus credenciales/locales
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

## Configuración

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (o usa el ejemplo `.env.example` como base):

```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/astrostar?schema=public"

# Servidor
PORT=4000

# JWT
JWT_SECRET="tu_jwt_secret_aqui"
JWT_EXPIRES_IN="24h"

# Entorno
NODE_ENV="development"
```

### Base de datos PostgreSQL

1. **Crear base de datos y usuario**

```sql
CREATE DATABASE astrostar;
CREATE USER astrostar_user WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE astrostar TO astrostar_user;
```

2. **Probar la conexión**

```bash
npm run test:db
```

## Uso

### Entorno de desarrollo

```bash
npm run dev
```

El servidor estará disponible en:

* API: `http://localhost:4000/api`
* Swagger: `http://localhost:4000/api-docs`
* Health check: `http://localhost:4000/health`

### Producción

```bash
npm start
```

### Prisma Studio (UI de base de datos)

```bash
npm run prisma:studio
```

Abre en:

```
http://localhost:5555
```

## API Endpoints

Ejemplo (módulo de roles):

* `GET /api/roles`
* `GET /api/roles/:id`
* `POST /api/roles`
* `PUT /api/roles/:id`
* `DELETE /api/roles/:id`
* `GET /api/roles/check-name`
* `GET /api/roles/stats`
* `GET /api/roles/permissions`

Documentación completa:

```
http://localhost:4000/api-docs
```

## Base de datos

### Modelos principales

* **Users** — usuarios del sistema
* **Roles** — roles con permisos
* **Athletes** — atletas
* **Guardians** — tutores
* **Services** — servicios deportivos
* **Teams** — equipos
* **Inscriptions** — inscripciones
* **Providers** — proveedores
* **Purchases** — compras

### Migraciones y seeders

```bash
npm run prisma:migrate
npm run prisma:reset
npm run prisma:seed
npm run prisma:status
```

## Arquitectura

El proyecto sigue una **arquitectura en capas**:

* **Routes** — endpoints HTTP
* **Middlewares** — autenticación, validación, logging
* **Controllers** — manejo request/response
* **Services** — lógica de negocio
* **Repositories** — acceso a datos

Estructura simplificada:

```
src/
├ config/
├ middlewares/
├ modules/
│  └ Roles/
│     ├ controllers/
│     ├ services/
│     ├ repository/
│     ├ routes/
│     ├ validators/
│     └ tests/
├ routes/
└ utils/
```

Más detalles en `BACKEND_ARCHITECTURE.md`.

## Scripts disponibles

### Desarrollo

```bash
npm run dev
npm start
```

### Base de datos

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
npm run prisma:push
npm run prisma:reset
```

### Testing

```bash
npm run test:system
npm run test:db
npm run test:roles
```

## Testing

Se incluyen pruebas mínimas:

* `tests/auth.test.js`
* `tests/permissions.test.js`
* `tests/crud.test.js`

```bash
npm test
npm run test:watch
npm run test:coverage
```

Resultados en:

```
astrostar_backend/test-results/
```

## Seguridad

* Validación de datos en múltiples capas
* Sanitización de inputs
* CORS configurado
* Contraseñas hasheadas con bcryptjs
* Autorización por roles y permisos

## Despliegue

### Variables de entorno

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/astrostar"
PORT=4000
```

### Deploy

```bash
npm ci --only=production
npm run prisma:generate
npm run prisma:deploy
npm start
```

## Contribución

1. Fork del proyecto
2. Crear rama:

```bash
git checkout -b feature/nueva-funcionalidad
```

3. Commit

```bash
git commit -m "Agregar nueva funcionalidad"
```

4. Push

```bash
git push origin feature/nueva-funcionalidad
```

5. Abrir Pull Request

### Estándares

* ES Modules
* Arquitectura en capas
* Documentar en Swagger
* Validaciones completas
* Pruebas automatizadas

## Changelog

### v1.0.0

* Sistema de roles y permisos
* Gestión de atletas y tutores
* API REST con Swagger
* PostgreSQL + Prisma
* Arquitectura modular

---

# Cómo evitar que vuelva a romperse

Guarda el archivo siempre como **UTF-8**.

En VSCode:

```
Bottom bar → UTF-8 → Save with encoding → UTF-8
```

También puedes forzar en el repo con `.editorconfig`:

```
[*]
charset = utf-8
```

