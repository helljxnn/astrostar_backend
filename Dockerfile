FROM cgr.dev/chainguard/node:latest-dev AS build

USER root
WORKDIR /app

# Keep UTF-8 locale and minimize mojibake risks in process output.
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV NODE_ENV=production

# Build tools for native deps (bcrypt) and Prisma engines
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package*.json ./

# Copy Prisma schema before install because postinstall runs prisma generate
COPY prisma ./prisma

# Avoid prisma generate during npm ci; run it after full copy
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Install production dependencies
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Regenerate Prisma client after full source copy to avoid stale generated client files
RUN npx prisma generate

FROM cgr.dev/chainguard/node:latest-dev

USER root
WORKDIR /app

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV NODE_ENV=production

# Runtime openssl needed for Prisma engines
RUN apk add --no-cache openssl

COPY --from=build --chown=65532:65532 /app /app

USER 65532
EXPOSE 4000

# Run migrations and start the app
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["npx prisma migrate deploy && node src/index.js"]
