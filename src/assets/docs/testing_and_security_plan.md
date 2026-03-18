# Plan de Pruebas y Seguridad (SGA FIN UAH)

Este documento complementa el Anexo 1 (Secciones 1.1, 1.2 y 1.3) detallando la metodología de validación.

## 1. Plan de Pruebas Funcionales (QA)

| ID | Módulo | Descripción | Resultado Esperado |
|----|--------|-------------|-------------------|
| F01 | Auth | Login con correo @uah.cl | Acceso concedido según ROL. |
| F02 | Inv | Carga masiva Excel | Procesamiento sin errores de >100 filas. |
| F03 | Res | Reserva de equipo | Descuento de stock y registro en bitácora. |
| F04 | Proy | Crear Fase | Visualización en carta Gantt y PDF. |
| F05 | Admin | Eliminar Sala | Borrado en cascada de horarios asociados. |

## 2. Pruebas de Carga y Estrés (No Funcionales)

- **Herramienta**: `Artillery` o `JMeter` (sugerida para el ambiente de QA UAH).
- **Escenario de Carga**: 50 usuarios recurrentes realizando búsquedas de inventario simultáneas.
- **Escenario de Estrés**: 200 peticiones por segundo al endpoint de login.
- **Métricas a Reportar**: Tiempo de respuesta (ms), Tasa de error (%), Uso de CPU/RAM del contenedor.

## 3. Pruebas de Seguridad (OWASP Top 10)

### 3.1 Prevención de SQL Injection
- **Técnica**: Uso de TypeORM con *Query Builders* y *Repositories*.
- **Evidencia**: Revisión estética del código en `backend/index.ts` donde no existen concatenaciones de strings en queries.

### 3.2 Prevención de XSS (Cross-Site Scripting)
- **Técnica**: Angular aplica sanitización automática en el DOM. En el backend, se limpian los strings antes de guardar.

### 3.3 Gestión de Sesiones Seguras
- **Técnica**: JWT firmados con clave secreta fuerte (HS256). Almacenamiento en `sessionStorage` para evitar persistencia post-browser-close.

### 3.4 Control de Acceso (Broken Access Control)
- **Técnica**: Middleware `authMiddleware` que verifica el ROL contra una lista blanca de permisos por ruta.

## 4. Documentación de Evidencia (Punto 1.4)
Se entregará un archivo ZIP final conteniendo:
1. Logs de ejecución de pruebas Artillery.
2. Capturas de pantalla de los flujos funcionales exitosos.
3. Reporte de vulnerabilidades estáticas (npm audit / Snyk).
