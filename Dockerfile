# Multi-stage Dockerfile para chollometro-cli
# Diseñado para ejecutar el CLI o el daemon de monitorización (watch) 24/7

FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json tsup.config.ts ./
RUN npm ci

COPY src/ ./src/
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
RUN npm link

ENTRYPOINT ["chollometro"]
CMD ["hot"]
