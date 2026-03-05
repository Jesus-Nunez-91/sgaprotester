import "reflect-metadata";
import { DataSource } from "typeorm";
import { Ticket } from "../src/entities/Ticket";
import { Message } from "../src/entities/Message";
import { User } from "../src/entities/User";
import { Schedule } from "../src/entities/Schedule";
import dotenv from "dotenv";

// Cargar variables de entorno desde el archivo .env
dotenv.config();

/**
 * Configuración de la conexión a la base de datos PostgreSQL.
 * Utiliza variables de entorno para mayor seguridad y flexibilidad.
 */
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres_pass",
    database: process.env.DB_NAME || "sga_db",

    // Sincronización automática del esquema (solo para desarrollo)
    synchronize: true,
    logging: false,

    // Entidades que forman parte del modelo de datos
    entities: [Ticket, Message, User, Schedule],
    migrations: [],
    subscribers: [],
});
