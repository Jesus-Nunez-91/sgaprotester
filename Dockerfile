# ETAPA 1: Construcción
FROM node:20 AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies para el build)
RUN npm install --legacy-peer-deps

# Copiar el resto del código
COPY . .

# Compilar el Frontend (Angular)
RUN npm run build

# Compilar el Backend (Express + TypeORM)
RUN npm run build-server

# ETAPA 2: Ejecución
FROM node:20-alpine
WORKDIR /app

# Crear un usuario específico para la app (seguridad)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar dependencias de producción
COPY --from=build --chown=appuser:appgroup /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copiar los archivos compilados
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/dist-server ./dist-server

# Dar permisos al usuario no-root
RUN chown -R appuser:appgroup /app

# Cambiar al usuario sin privilegios
USER appuser

# El backend sirve el frontend desde ./dist/sga-fin/browser
EXPOSE 3040

ENV PORT=3040
ENV NODE_ENV=production

CMD ["node", "dist-server/backend/index.js"]