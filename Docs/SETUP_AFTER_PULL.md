# Setup After Pull (Backend)

Esta guía evita errores de esquema/Prisma después de hacer `git pull`.

## 1) Comandos obligatorios después de cada pull

Ejecutar en `astrostar_backend`:

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run db:fix-local-schema
```

Luego iniciar backend:

```bash
npm run dev
```

## 2) Si aparecen errores de Prisma (P2021/P2022)

1. Verifica `.env` (que apunte a la BD correcta).
2. Repite:

```bash
npm run prisma:deploy
npm run db:fix-local-schema
npm run prisma:generate
```

3. Reinicia servidor (`npm run dev`).

## 3) Regla de equipo para cambios de base de datos

Si cambias `prisma/schema.prisma`, debes crear migración y subirla al repo:

```bash
npx prisma migrate dev --name <descripcion_cambio>
```

Debes commitear:
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_<descripcion>/migration.sql`

## 4) Qué NO hacer en flujo de equipo

- No usar `prisma db push` como flujo normal compartido.
- No dejar cambios de DB solo en tu máquina sin migración.

## 5) Resumen rápido

- `pull` actualiza código.
- `prisma:deploy` actualiza estructura de BD con migraciones versionadas.
- `db:fix-local-schema` corrige drift histórico local.
- `prisma:generate` sincroniza el cliente Prisma con el schema actual.
