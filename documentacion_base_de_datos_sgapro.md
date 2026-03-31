# Documentación de la Base de Datos - SGA Pro

Este documento detalla la estructura completa de la base de datos PostgreSQL, las relaciones entre tablas (PK/FK) y la arquitectura del sistema.

## 1. Diagrama de Entidad-Relación (ERD)
Abajo se muestra la representación gráfica de las tablas ("cuadrados") y sus conexiones.

```mermaid
erDiagram
    %% --- Módulos de Usuarios ---
    USER ||--o{ PROJECT : "gestiona"
    USER ||--o{ PROJECT_TASK : "asignado a"
    USER ||--o{ TICKET : "crea"
    USER ||--o{ RESERVATION : "solicita"

    USER {
        int id PK "SERIAL"
        string nombreCompleto
        string rut "UNIQUE"
        string correo "UNIQUE"
        string rol "ENUM: Alumno, SuperUser, etc."
        timestamp createdAt
    }

    %% --- Gestión Académica (Salas) ---
    ROOM ||--o{ ROOM_BLOCK : "contiene"
    ROOM ||--o{ ROOM_RESERVATION : "registra"
    ROOM_BLOCK ||--o{ ROOM_RESERVATION : "bloque de"

    ROOM {
        int id PK "SERIAL"
        string nombre
        string tipo "Laboratorio/Sala"
        int capacidadMaxima
        boolean estadoActivo
    }

    ROOM_BLOCK {
        int id PK "SERIAL"
        int roomId FK "Relación con Sala"
        string nombreBloque
        string horaInicio
        string horaFin
    }

    ROOM_RESERVATION {
        int id PK "SERIAL"
        int roomId FK
        int roomBlockId FK
        string fechaExacta
        string nombreCurso
        string estado "ACTIVA/CANCELADA"
    }

    %% --- Soporte y Tickets ---
    TICKET ||--o{ MESSAGE : "historial"

    TICKET {
        bigint id PK "Timestamp-based ID"
        int userId FK "Usuario creador"
        string subject
        string status "Open/Closed"
        timestamp createdAt
    }

    MESSAGE {
        int id PK "SERIAL"
        bigint ticketId FK "Relación con Ticket"
        string sender
        text text
        timestamp createdAt
    }

    %% --- Inventario y Mantenimiento ---
    INVENTORY_ITEM ||--o{ MAINTENANCE_TASK : "historial técnico"
    INVENTORY_ITEM ||--o{ RESERVATION : "préstamo"

    INVENTORY_ITEM {
        int id PK "SERIAL"
        string rotulo_ID "UNIQUE"
        string marca
        string modelo
        int stockActual
        string status "Disponible/Dañado"
    }

    MAINTENANCE_TASK {
        int id PK "SERIAL"
        int itemId FK "Equipo afectado"
        string type "Preventivo/Correctivo"
        string status "Pendiente/Listo"
        float cost
    }
```

---

## 2. Detalle de Conectividad (PK/FK)

A continuación se explica cómo están conectadas las tablas principales:

### A. Módulo Académico (Salas y Reservas)
*   **ROOM ↔ ROOM_BLOCK**: Una sala posee múltiples bloques de horario (Mañana, Tarde, Bloque 1, etc.). La conexión se hace mediante `roomId` en la tabla `ROOM_BLOCK`.
*   **ROOM_RESERVATION**: Es la tabla central que une una Sala, un Bloque de horario y una Fecha específica. Utiliza `roomId` y `roomBlockId` como llaves foráneas.

### B. Módulo de Soporte
*   **TICKET ↔ USER**: Cada ticket tiene un `userId` que identifica quién lo abrió.
*   **TICKET ↔ MESSAGE**: Los mensajes de chat están conectados mediante `ticketId` que referencia a la llave primaria `id` de la tabla `TICKET`.

### C. Módulo de Inventario
*   **INVENTORY_ITEM ↔ MAINTENANCE_TASK**: Cualquier tarea de mantenimiento referencia al `itemId` de un equipo específico en el inventario.

---

## 3. Ubicación de los Componentes

*   **Frontend**: Carpeta `/src` (Angular).
*   **Backend**: Carpeta `/backend` (Node.js/Express). Se comunica con la base de datos mediante **TypeORM**.
*   **Base de Datos**: PostgreSQL en contenedor Docker.

---

> [!IMPORTANT]
> Los datos se guardan físicamente en el volumen `./data/db` de la carpeta raíz del proyecto. No borre esta carpeta si desea conservar la información.
