"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Ticket_1 = require("../src/entities/Ticket");
const Message_1 = require("../src/entities/Message");
const User_1 = require("../src/entities/User");
const Schedule_1 = require("../src/entities/Schedule");
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno desde el archivo .env
dotenv_1.default.config();
/**
 * Configuración de la conexión a la base de datos PostgreSQL.
 * Utiliza variables de entorno para mayor seguridad y flexibilidad.
 */
exports.AppDataSource = new typeorm_1.DataSource({
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
    entities: [Ticket_1.Ticket, Message_1.Message, User_1.User, Schedule_1.Schedule],
    migrations: [],
    subscribers: [],
});
