# Procedimiento de Respaldo de Base de Datos (PostgreSQL)

Este documento detalla el procedimiento oficial para respaldar y restaurar la base de datos del sistema SGA FIN, cumpliendo con los lineamientos de seguridad de TICs.

## 1. Respaldo Manual mediante script
Se ha incluido un script automatizado `scripts/backup.sh` que genera un volcado (dump) seguro de la base de datos desde el contenedor Docker, sin necesidad de exponer los puertos de PostgreSQL al exterior.

### Ejecución del script
1. Abre una terminal en el servidor donde está alojado el proyecto.
2. Navega al directorio raíz del proyecto SGA FIN.
3. Ejecuta el script:
   ```bash
   bash scripts/backup.sh
   ```
4. El script creará un archivo SQL en el directorio `backups/` con la fecha y hora de la copia (ejemplo: `sgapro_backup_2026-05-11_09-00-00.sql`).

## 2. Respaldo Manual con comandos Docker
Si necesitas ejecutar el respaldo de forma completamente manual:

```bash
docker exec -t sgaprotester_db pg_dump -U postgres -d sga_db -c > backups/manual_backup.sql
```
*Nota: Se utiliza el usuario `postgres` y la base de datos `sga_db` según la configuración actual.*

## 3. Restauración de la Base de Datos
Para restaurar la base de datos desde un archivo SQL generado previamente:

1. Asegúrate de que los contenedores estén corriendo (`docker-compose up -d`).
2. Copia el archivo de respaldo al contenedor (opcional) o inyecta el contenido directamente:
   ```bash
   cat backups/tu_archivo_backup.sql | docker exec -i sgaprotester_db psql -U postgres -d sga_db
   ```

## 4. Automatización (Crontab)
Para programar respaldos diarios de forma automática, puedes agregar una tarea en el cron del servidor:
```bash
crontab -e
```
Agrega la siguiente línea para ejecutar el respaldo todos los días a las 02:00 AM:
```text
0 2 * * * cd /ruta/al/proyecto/sgaproactualizado && bash scripts/backup.sh >> backups/backup.log 2>&1
```
