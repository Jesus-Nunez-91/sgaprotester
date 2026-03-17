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
FROM node:20-slim
WORKDIR /app

# Copiar dependencias de producción (opcional, pero por simplicidad copiaremos todo lo necesario)
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copiar los archivos compilados
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# El backend sirve el frontend desde ./dist/sga-pro-ingenieria-uah/browser
# Asegurarse de que el puerto sea el 3030
EXPOSE 3030

ENV PORT=3030
ENV NODE_ENV=production

CMD ["node", "dist-server/backend/index.js"]