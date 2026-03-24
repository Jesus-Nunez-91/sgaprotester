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
const InventoryItem_1 = require("../src/entities/InventoryItem");
const Reservation_1 = require("../src/entities/Reservation");
const AdminTask_1 = require("../src/entities/AdminTask");
const MaintenanceTask_1 = require("../src/entities/MaintenanceTask");
const PurchaseOrder_1 = require("../src/entities/PurchaseOrder");
const AuditLog_1 = require("../src/entities/AuditLog");
const Project_1 = require("../src/entities/Project");
const ProjectTask_1 = require("../src/entities/ProjectTask");
const WikiDoc_1 = require("../src/entities/WikiDoc");
const Bitacora_1 = require("../src/entities/Bitacora");
const Room_1 = require("../src/entities/Room");
const RoomBlock_1 = require("../src/entities/RoomBlock");
const RoomReservation_1 = require("../src/entities/RoomReservation");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres_pass",
    database: process.env.DB_NAME || "sga_db",
    synchronize: true,
    logging: false,
    entities: [Ticket_1.Ticket, Message_1.Message, User_1.User, Schedule_1.Schedule, InventoryItem_1.InventoryItem, Reservation_1.Reservation, AdminTask_1.AdminTask, MaintenanceTask_1.MaintenanceTask, PurchaseOrder_1.PurchaseOrder, AuditLog_1.AuditLog, Project_1.Project, ProjectTask_1.ProjectTask, WikiDoc_1.WikiDoc, Bitacora_1.Bitacora, Room_1.Room, RoomBlock_1.RoomBlock, RoomReservation_1.RoomReservation],
    migrations: [],
    subscribers: [],
});
