# ── Build stage ──
FROM node:22-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# ── Runtime stage ──
FROM node:22-alpine AS runtime

WORKDIR /app

# Copiar solo lo necesario para producción
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json* ./

# SEGURIDAD: Instalar solo dependencias de producción (excluir devDependencies)
RUN npm ci --omit=dev && npm cache clean --force

# Variables de entorno
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

# Healthcheck para Coolify / Traefik
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4321/ || exit 1

CMD ["node", "./dist/server/entry.mjs"]
