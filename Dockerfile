FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema before install because postinstall runs prisma generate
COPY prisma ./prisma

# Update base OS packages to include latest security patches
RUN apk upgrade --no-cache

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Regenerate Prisma client after full source copy to avoid stale generated client files
RUN npx prisma generate

# Set environment
ENV NODE_ENV=production

EXPOSE 4000

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
