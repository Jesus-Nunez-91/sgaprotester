
# SCRIPT DE GENERACIÓN DE RELEASE INSTITUCIONAL - SGA FIN (UAH)
# Cumplimiento estricto del Anexo 1 (Puntos 1.1, 1.3 y 3.2)

$ReleaseFolder = "UAH-RELEASE-SGA-FIN"
$ZipFile = "UAH_SGA_FIN_PROD_RELEASE.zip"

Write-Host "🚀 Iniciando proceso de empaquetado para la DTIC (UAH)..." -ForegroundColor Cyan

# 1. Limpieza
if (Test-Path $ReleaseFolder) { Remove-Item -Recurse -Force $ReleaseFolder }
if (Test-Path $ZipFile) { Remove-Item $ZipFile }
New-Item -ItemType Directory -Path "$ReleaseFolder/backend"
New-Item -ItemType Directory -Path "$ReleaseFolder/frontend"

# 2. Build Frontend (Angular)
Write-Host "📦 Compilando Frontend (Angular Pro)..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ Error en el build de Angular. Proceso abortado." -ForegroundColor Red
    exit 1 
}

# 3. Copia de Archivos de Producción
Write-Host "📂 Organizando archivos para Producción..." -ForegroundColor Yellow

# Copia de Frontend Compilado
Copy-Item -Recurse "dist/*" "$ReleaseFolder/frontend/"

# Copia de Backend (Solo fuentes, sin node_modules ni logs temporales)
Copy-Item -Recurse "backend/*.ts" "$ReleaseFolder/backend/"
Copy-Item -Recurse "backend/*.json" "$ReleaseFolder/backend/" 2>$null

# Copia de Raíz y Configuración
Copy-Item "package.json" "$ReleaseFolder/"
Copy-Item "package-lock.json" "$ReleaseFolder/"
Copy-Item "tsconfig.server.json" "$ReleaseFolder/"
Copy-Item ".env" "$ReleaseFolder/.env.example" # Se entrega como .example por seguridad
Copy-Item "DOCUMENTACION_DTIC.md" "$ReleaseFolder/"
Copy-Item "audit.log" "$ReleaseFolder/" 2>$null

# 4. Verificación de Integridad
Write-Host "🛡️ Verificando integridad del paquete..." -ForegroundColor Green
if (!(Test-Path "$ReleaseFolder/frontend") -or !(Test-Path "$ReleaseFolder/backend")) {
    Write-Host "❌ Error: El paquete está incompleto." -ForegroundColor Red
    exit 1
}

# 5. Generación de ZIP Final para SFTP
Write-Host "🗜️ Generando archivo ZIP para carga vía SFTP (DTIC)..." -ForegroundColor Cyan
Compress-Archive -Path "$ReleaseFolder/*" -DestinationPath $ZipFile -Force

Write-Host "--------------------------------------------------------"
Write-Host "🏅 RELEASE GENERADO CON ÉXITO: $ZipFile" -ForegroundColor Green
Write-Host "Ya puede subir este archivo al servidor institucional de la UAH." 
Write-Host "--------------------------------------------------------"
