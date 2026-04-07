
# SGA FIN - Sistema de Gestión de Activos (Facultad de Ingeniería UAH)
> **Resumen Ejecutivo Institucional - Certificación 2026 (DTIC)**

---

## 🏛️ Propósito Estratégico
**SGA FIN** es la plataforma unificada de la Facultad de Ingeniería de la Universidad Alberto Hurtado para la gestión crítica de infraestructura, inventarios, horarios académicos y wikis de proyecto. El sistema ha sido diseñado bajo estándares de **Soberanía Sistémica y Accesibilidad Universal**, permitiendo a académicos y administrativos gestionar eficientemente los activos de la universidad.

## 🛡️ Pilares Tecnológicos (Compliance UAH)
El sistema cumple íntegramente con los lineamientos de la **DTIC (Anexos 1 y 2)**:
*   **Seguridad**: Hashing de contraseñas con BcryptJS, cabeceras de seguridad Helmet y Rate Limiting para protección contra ataques masivos.
*   **Accesibilidad (WCAG 2.0)**: Interfaces con roles semánticos (ARIA) para navegación fluida mediante lectores de pantalla (Nivel A/AA).
*   **SEO Académico**: Metadatados dinámicos optimizados para la UAH y Sitemap automático para indexación institucional.
*   **Infraestructura**: Despliegue contenerizado mediante Docker, garantizando un entorno aislado y seguro para PostgreSQL.

## 📦 Gestión de Release (Paso a Producción)
El proyecto incluye un motor de release automatizado para la entrega final por SFTP:
*   **`npm run audit:system`**: Certifica el estado de salud de la base de datos y recursos.
*   **`npm run deploy:uah`**: Genera un paquete compacto (`UAH_SGA_FIN_PROD_RELEASE.zip`) con el build de producción listo para ser cargado.

---

## 🚀 Guía Rápida para la DTIC
1.  **Requisitos**: Docker & Node.js 20+.
2.  **Configuración**: El archivo `.env` en la raíz contiene las credenciales de base de datos institucional.
3.  **Hito Técnico**: Consulte el archivo `DOCUMENTACION_DTIC.md` para el Dossier completo de arquitectura y seguridad.

---
**© 2026 Facultad de Ingeniería - Universidad Alberto Hurtado.**  
*SGA FIN: Eficiencia, Transparencia e Innovación Académica.*