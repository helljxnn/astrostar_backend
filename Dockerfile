FROM cgr.dev/chainguard/node:latest-dev AS build

WORKDIR /app

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV NODE_ENV=production
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

USER root
RUN apk add --no-cache python3

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY . .
RUN npx prisma generate

USER nonroot

FROM cgr.dev/chainguard/node:latest-dev AS runtime

WORKDIR /app

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV NODE_ENV=production
ENV PORT=4000

USER root
COPY --from=build --chown=nonroot:nonroot /app /app
RUN apk upgrade --no-cache \
 && apk del npm \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/bin/npm /usr/bin/npx /usr/lib/node_modules/npm

USER nonroot
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD ["/usr/bin/node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || '4000') + '/health').then((res) => { if (!res.ok) process.exit(1); }).catch(() => process.exit(1));"]
CMD ["src/bootstrap.js"]
