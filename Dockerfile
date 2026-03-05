# ETAPA 1: Construcción
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Forzamos instalación limpia
RUN npm install --legacy-peer-deps
COPY . .
# Compilar ambos
RUN npx ng build --configuration production
RUN npx tsc -p tsconfig.server.json

# ETAPA 2: Ejecución
FROM node:20-alpine
WORKDIR /app
# Solo dependencias de producción
COPY package*.json ./
RUN npm install --production --legacy-peer-deps
# Copiar resultados de la etapa anterior
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/.env ./.env

EXPOSE 3000
# IMPORTANTE: Ahora ejecutamos el JS sin conflictos de "module"
CMD ["node", "dist-server/backend/index.js"]