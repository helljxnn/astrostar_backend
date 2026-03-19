FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --only=production

# Install dev dependencies needed for Prisma generation
RUN npm install prisma@^7.5.0 --save-dev

# Copy prisma files and config
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Set environment
ENV NODE_ENV=production

EXPOSE 4000

# Ensure Prisma client is generated and run migrations
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start"]