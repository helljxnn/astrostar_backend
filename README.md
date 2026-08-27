# AstroStar Backend

API REST de AstroStar desarrollada con Node.js, Express y PostgreSQL. Centraliza la autenticación, los permisos y la lógica de negocio de los módulos administrativos y operativos de la plataforma.

## Qué resuelve este servicio

- Autenticación con JWT.
- Gestión de usuarios, roles y permisos.
- Administración de atletas, equipos, servicios, inscripciones y pagos.
- Gestión de eventos, citas, proveedores, compras, materiales y equipamiento.
- Documentación de endpoints con Swagger.
- Procesos programados para recordatorios y tareas automáticas.

## Tecnologías principales

- Node.js `22.15.0`
- Express `5`
- PostgreSQL
- Prisma
- JWT
- Jest
- Swagger / OpenAPI
- Cloudinary

## Requisitos previos

- Node.js `22.15.0`
- npm `8` o superior
- PostgreSQL disponible localmente o en un entorno remoto

## Instalación

```bash
npm install
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto con los valores de tu entorno.

Ejemplo mínimo:

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/astrostar?schema=public
PORT=4000
NODE_ENV=development

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000

JWT_SECRET=coloca_un_secreto_seguro
JWT_REFRESH_SECRET=coloca_otro_secreto_seguro
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
```

Según el módulo que vayas a usar, también pueden ser necesarias variables para:

- correo SMTP
- Cloudinary
- configuración de logs
- activación o desactivación de jobs programados

## Base de datos

Después de configurar `.env`, ejecuta:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Si necesitas revisar el estado de las migraciones:

```bash
npm run prisma:status
```

Si quieres abrir Prisma Studio:

```bash
npm run prisma:studio
```

## Ejecución

Desarrollo:

```bash
npm run dev
```

Producción:

```bash
npm start
```

El servidor escucha en `0.0.0.0`, por lo que puede ser accedido desde la red local si tu entorno lo permite.

## URLs útiles en local

- API base: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api-docs`
- Health check: `http://localhost:4000/health`

## Scripts principales

```bash
npm run dev
npm start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio
npm run prisma:status
npm run prisma:reset
npm run test
npm run test:watch
npm run test:coverage
npm run test:system
npm run test:db
```

## Módulos principales

La carpeta `src/modules` contiene, entre otros, los siguientes módulos:

- `Auth`
- `Users`
- `Roles`
- `Athletes`
- `Teams`
- `Services`
- `Events`
- `Enrollments`
- `Payments`
- `Appointments`
- `Providers`
- `Purchases`
- `Materials`
- `SportsEquipment`
- `Dashboard`

## Estructura general

```text
astrostar_backend/
|- prisma/
|- scripts/
|- src/
|  |- config/
|  |- controllers/
|  |- jobs/
|  |- middlewares/
|  |- modules/
|  |- routes/
|  |- services/
|  `- utils/
|- tests/
|- .env
|- package.json
`- README.md
```

## Seguridad y operación

El proyecto ya incluye piezas importantes para un entorno real:

- autenticación y autorización con JWT
- hash de contraseñas con bcrypt
- CORS configurado
- `helmet` para cabeceras de seguridad
- rate limiting
- subida de archivos a Cloudinary
