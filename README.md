# AstroStar Backend

AstroStar REST API built with Node.js, Express, and PostgreSQL. It centralizes authentication, permissions, and the business logic for the platform's administrative and operational modules.

## What This Service Provides

- JWT authentication.
- User, role, and permission management.
- Management of athletes, teams, services, enrollments, and payments.
- Management of events, appointments, providers, purchases, materials, and sports equipment.
- Endpoint documentation with Swagger.
- Scheduled processes for reminders and automated tasks.

## Main Technologies

- Node.js `22.15.0`
- Express `5`
- PostgreSQL
- Prisma
- JWT
- Jest
- Swagger / OpenAPI
- Cloudinary

## Prerequisites

- Node.js `22.15.0`
- npm `8` or later
- PostgreSQL available locally or in a remote environment

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the project root with the values required for your environment.

Minimum example:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/astrostar?schema=public
PORT=4000
NODE_ENV=development

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000

JWT_SECRET=enter_a_secure_secret
JWT_REFRESH_SECRET=enter_another_secure_secret
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
```

Depending on the modules you plan to use, you may also need environment variables for:

- SMTP email
- Cloudinary
- Logging configuration
- Enabling or disabling scheduled jobs

## Database

After configuring the `.env` file, run:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

To check the migration status:

```bash
npm run prisma:status
```

To open Prisma Studio:

```bash
npm run prisma:studio
```

## Running the Application

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

The server listens on `0.0.0.0`, so it can be accessed from the local network if your environment allows it.

## Useful Local URLs

- Base API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api-docs`
- Health check: `http://localhost:4000/health`

## Main Scripts

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

## Main Modules

The `src/modules` directory contains, among others, the following modules:

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

## Project Structure

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

## Security and Operations

The project already includes important components for a production environment:

- JWT authentication and authorization
- Password hashing with bcrypt
- CORS configuration
- Security headers with `helmet`
- Rate limiting
- File uploads to Cloudinary
