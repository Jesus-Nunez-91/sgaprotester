# 📑 DOCUMENTACIÓN TÉCNICA - SGA FIN (PROYECTO UAH) 🎓
Este documento cumple con los requisitos del **Anexo 1 (DTIC)** de la Universidad Alberto Hurtado para la recepción de sistemas externos.

## 1. Diagrama de Infraestructura (Requisito 2.1)
El sistema utiliza una arquitectura basada en contenedores para garantizar paridad entre ambientes (Dev/Test/Prod).

- **Proxy/Web Server**: Nginx (para servir el build de Angular en producción).
- **Backend**: Node.js v20+ / Express ejecutado bajo PM2 o contenedor Docker.
- **Base de Datos**: PostgreSQL 15-alpine (Aislada en red interna).
- **Servicios Externos**: Google reCAPTCHA v2/v3 para seguridad en formularios.

## 2. Arquitectura de Software (Requisito 2.2)
- **Frontend**: Angular v21 (Arquitectura Standalone).
- **Control de Acceso**: Middleware personalizado basado en JWT (JSON Web Tokens).
- **Capa de Datos**: TypeORM con patrón Data Mapper para integridad SQL.
- **Integración**: API REST unificada con Socket.io para trazabilidad en tiempo real.

## 3. Seguridad Owaps (Requisito 1.3)
El sitio implementa las siguientes medidas para prevenir ataques:
1. **Inyección SQL**: Sanitización automática mediante TypeORM QueryBuilder.
2. **XSS**: Escaneo de contenido de Angular y cabeceras de seguridad vía `helmet.js`.
3. **CORS**: Política de origen restringido configurada en `backend/index.ts`.
4. **Hashing**: Passwords protegidos mediante `bcryptjs` con 10 rounds de salting.

## 4. Estrategia SEO y Accesibilidad (Anexo 2)
- **Posicionamiento**: Cumplimiento de jerarquía H1-H3, metatags dinámicos y archivos `robots.txt` / `sitemap.xml`.
- **Accesibilidad**: Etiquetas `alt` descriptivas y compatibilidad con lectores de pantalla (Nivel A WCAG).

---
*Certificado para entrega a la DTIC - Facultad de Ingeniería UAH*
