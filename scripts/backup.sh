#!/bin/bash

# Asegurar que el directorio de backups existe
mkdir -p backups

# Generar nombre del archivo con timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="backups/sgapro_backup_${TIMESTAMP}.sql"

# Cargar variables de entorno desde el archivo .env
export $(grep -v '^#' .env | xargs)

# Validar que las variables necesarias existan
if [ -z "$DB_USERNAME" ] || [ -z "$DB_NAME" ]; then
    echo "Error: DB_USERNAME o DB_NAME no están definidos en el archivo .env."
    exit 1
fi

echo "Iniciando respaldo de la base de datos ${DB_NAME}..."

# Ejecutar pg_dump dentro del contenedor
docker exec -t sgaprotester_db pg_dump -U "${DB_USERNAME}" -d "${DB_NAME}" -c > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "Respaldo completado exitosamente: ${BACKUP_FILE}"
else
    echo "Error durante el respaldo."
    # Si falla, borrar el archivo vacío/corrupto
    rm -f "${BACKUP_FILE}"
    exit 1
fi
