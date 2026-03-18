# Estrategia de Posicionamiento SEO (SGA Pro UAH)

Este documento detalla el cumplimiento del Anexo 2 solicitado por la UAH.

## 1. Estrategia de Palabras Clave (Sección 2)

Se definen entre 5 y 9 palabras clave por cada sección crítica del sitio para optimizar el alcance académico e institucional.

| Módulo / Artículo | Palabras Clave Propuestas |
|-------------------|--------------------------|
| **Inicio / Dashboard** | Gestión Activos UAH, Ingeniería Alberto Hurtado, SGA Pro, Optimización Laboratorios, Dashboard Académico, Universidad Alberto Hurtado. |
| **Inventario (Equipos)** | Notebooks Ingeniería, Inventario Tecnológico, Préstamo Equipos UAH, Hardware Académico, Laptop Management, Gestión de Activos Fijos. |
| **Inventario (Arduinos)** | Kit Electrónica UAH, Arduinos Ingeniería, Componentes Electrónicos, Prototipado Rápido, Insumos Laboratorio, Sensores Académicos. |
| **Horarios / Salas** | Reserva Salas UAH, Disponibilidad Laboratorios, Horario Académico Ingeniería, Gestión Espacios UAH, Planificación Laboratorio. |
| **Proyectos / Fases** | Gestión de Proyectos UAH, Cronograma Ingeniería, Carta Gantt Académica, Innovación UAH, Seguimiento de Fases, Proyectos Estudiantiles. |
| **Wiki / Manuales** | Protocolos Laboratorio, Guías Académicas UAH, Manual de Usuario SGA, Documentación Técnica, Soporte Ingeniería UAH. |

## 2. Archivos Técnicos SEO (Sección 3)

### 2.1 robots.txt
Ubicación propuesta: `src/robots.txt`
```text
User-agent: *
Allow: /
Allow: /wiki
Disallow: /api/
Disallow: /admin/
Sitemap: https://sga.uah.cl/sitemap.xml
```

### 2.2 sitemap.xml
Se implementará una ruta dinámica o archivo estático que liste las URLs principales:
- `/`
- `/inventory`
- `/schedule`
- `/wiki`
- `/projects`

## 3. Implementación de Meta Tags (Sección 3)

Se utilizará el servicio `Title` y `Meta` de Angular para actualizar dinámicamente:
- **Title Tag**: Ej: "SGA Pro - Inventario de Equipos | UAH"
- **Meta Description**: Ej: "Sistema de Gestión de Activos de la Facultad de Ingeniería UAH. Consulta disponibilidad y reserva equipos."
- **Alt Text**: Todas las imágenes de inventario y manuales llevarán el atributo `alt` descriptivo basado en la marca/modelo.

## 4. Analítica y Errores (Sección 4, 5, 6)

- **Google Analytics (GA4)**: Se insertará el código coordinado con TICs en el `index.html`.
- **Error 404**: Se implementará un `NotFoundComponent` con diseño institucional y redirección al inicio.
- **Redirecciones 301/302**: Manejadas vía Angular Router para rutas antiguas o depreciadas.

## 5. Accesibilidad (Deseable - Sección 7)

Se apunta a un nivel **WCAG 2.1 AA**:
- Uso de contrastes adecuados (UAH Blue vs White).
- Soporte para navegación por teclado.
- Etiquetas `aria-label` en botones interactivos.
