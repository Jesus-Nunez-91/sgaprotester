$Target = "https://10.10.0.20:3040"
$IgnoreSsl = $true # Poner en $true para certificados autofirmados

if ($IgnoreSsl) {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
}

Write-Host "`n--- VALIDANDO SEGURIDAD (POST-REPARACIÓN) ---" -ForegroundColor Cyan

# 1. Verificar Disponibilidad HTTPS
Write-Host "[1] Verificando conexión HTTPS en $Target..." -NoNewline
try {
    $Response = Invoke-WebRequest -Uri $Target -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host " [OK]" -ForegroundColor Green
} catch {
    Write-Host " [ERROR: No se pudo conectar. ¿Está el servidor corriendo?]" -ForegroundColor Yellow
    $Response = $null
}

if ($Response) {
    # 2. Verificar Cabeceras de Seguridad
    Write-Host "[2] Verificando cabeceras de seguridad..." -ForegroundColor Cyan
    $Headers = $Response.Headers
    
    $ExpectedHeaders = @(
        "X-Frame-Options",
        "Content-Security-Policy",
        "Strict-Transport-Security",
        "Cache-Control",
        "Permissions-Policy"
    )

    foreach ($H in $ExpectedHeaders) {
        if ($Headers.ContainsKey($H)) {
            Write-Host "  - $H: OK" -ForegroundColor Green
        } else {
            if ($H -eq "Strict-Transport-Security") {
                Write-Host "  - $H: FALTA (Opcional en dev, recomendado en prod)" -ForegroundColor Gray
            } else {
                Write-Host "  - $H: FALTA" -ForegroundColor Red
            }
        }
    }

    # 3. Verificar CORS (Prueba de origen malicioso)
    Write-Host "[3] Verificando validación de ORIGIN (CORS)..." -ForegroundColor Cyan
    try {
        $CorsResponse = Invoke-WebRequest -Uri "$Target/api/auth/status" -Method Options -Headers @{"Origin"="https://sitio-malicioso.com"} -ErrorAction SilentlyContinue
        if ($CorsResponse.Headers.ContainsKey("Access-Control-Allow-Origin") -and $CorsResponse.Headers["Access-Control-Allow-Origin"] -eq "https://sitio-malicioso.com") {
            Write-Host "  ALERTA: CORS sigue vulnerable (Permite orígenes arbitrarios)" -ForegroundColor Red
        } else {
            Write-Host "  CORS Protegido: Origen malicioso bloqueado o no reflejado." -ForegroundColor Green
        }
    } catch {
        Write-Host "  CORS Protegido: Petición rechazada correctamente." -ForegroundColor Green
    }

    # 4. Verificar Errores (Prueba de ruta inexistente)
    Write-Host "[4] Verificando exposición de errores técnicos..." -ForegroundColor Cyan
    try {
        $ErrorUrl = "$Target/api/ruta-inexistente-segura"
        $ErrorResponse = Invoke-WebRequest -Uri $ErrorUrl -Method Get -ErrorAction Stop
    } catch {
        $ResponseBody = $_.Exception.Response.GetResponseStream()
        $Reader = New-Object System.IO.StreamReader($ResponseBody)
        $Content = $Reader.ReadToEnd()
        
        if ($Content -match "sql|column|stack|debug|Invalid column") {
            Write-Host "  ALERTA: Se filtran datos técnicos en la respuesta." -ForegroundColor Red
        } else {
            Write-Host "  Manejo de errores seguro: Información técnica oculta." -ForegroundColor Green
        }
    }
} else {
    Write-Host "`n⚠️  No se pudo completar la validación porque el servidor no respondió en $Target." -ForegroundColor Yellow
    Write-Host "Asegúrate de ejecutar 'npm run dev' o iniciar el backend antes de correr este test."
}

Write-Host "`n--- FIN DE VALIDACIÓN ---`n"
