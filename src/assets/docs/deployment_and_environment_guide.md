# Guía de Despliegue y Ambientes (SGA FIN UAH)

Este documento aborda los puntos de la Sección 2.3, 2.4 y Sección 3 del Anexo 1.

## 1. Requisitos de Implementación (Software)

- **Runtime**: Node.js 20.x o superior.
- **Package Manager**: npm v10+.
- **Database**: PostgreSQL 15.
- **Orquestación**: Docker y Docker-Compose (altamente recomendado).
- **Reverse Proxy**: Nginx (configuración incluida para SSL y WebSocket).

## 2. Gestión de Ambientes

### 2.1 Ambiente de Desarrollo
Configurado localmente mediante contenedores. Permite iteración rápida sin afectar la base de datos centralizada.
- Variable `NODE_ENV=development`.

### 2.2 Ambiente de Test (QA)
Ambiente proporcionado por UAH.
- **Despliegue**: Mediante `git clone` y `docker-compose up --build`.
- **Base de Datos**: Instancia aislada para pruebas de carga.
- **Protocolo SFTP**: Se usará para cargas puntuales de certificados o archivos estáticos no versionados.

### 2.3 Ambiente de Producción
Controlado exclusivamente por DTIC UAH.
- **Paso a Producción**: Se realiza una vez aprobadas las pruebas en QA.
- **Seguridad**: Firewall perimetral, SSL/TLS (Let's Encrypt o corporativo) gestionado en Nginx.

## 3. Servicios Externos y APIs (Sección 2.4)

| Servicio | Propósito | Costo/Licencia | Vigencia |
|----------|-----------|----------------|----------|
| **Socket.io** | Tiempo real | Open Source (MIT) | Indefinida |
| **TypeORM** | Acceso a DB | Open Source (MIT) | Indefinida |
| **XLSX / ExcelJS** | Reportes Excel | Open Source (MIT) | Indefinida |
| **jsPDF** | Reportes PDF | Open Source (MIT) | Indefinida |

*Nota: No se utilizan APIs pagadas ni servicios de terceros con costo recurrente para esta etapa del proyecto.*

## 4. Instrucciones de Implementación (Punto 2.3)

1. **Clonar Repositorio**: `git clone [REPO_URL]`.
2. **Configurar Variables**: Copiar `.env.example` a `.env` y ajustar credenciales de DB y Secreto JWT.
3. **Levantar Stack**: `docker-compose up -d --build`.
4. **Verificación**: Acceder a `http://localhost:[PUERTO]` y verificar logs de conexión a DB.
