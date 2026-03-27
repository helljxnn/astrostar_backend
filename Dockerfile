FROM node:22-bookworm-slim

WORKDIR /app

# Keep UTF-8 locale and minimize mojibake risks in process output.
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Copy package files
COPY package*.json ./

# Copy Prisma schema before install because postinstall runs prisma generate
COPY prisma ./prisma

# Update OS packages and npm to patched versions.
RUN apt-get update \
  && apt-get upgrade -y --no-install-recommends \
  && apt-get install -y --no-install-recommends ca-certificates \
  && npm install -g npm@11.12.0 \
  && npm cache clean --force \
  && rm -rf /var/lib/apt/lists/*

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
