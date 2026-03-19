FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema before install because postinstall runs prisma generate
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Set environment
ENV NODE_ENV=production

EXPOSE 4000

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
