import "reflect-metadata";
import { DataSource } from "typeorm";
import { Ticket } from "../src/entities/Ticket";
import { Message } from "../src/entities/Message";
import { User } from "../src/entities/User";
import { Schedule } from "../src/entities/Schedule";
import { InventoryItem } from "../src/entities/InventoryItem";
import { Reservation } from "../src/entities/Reservation";
import { AdminTask } from "../src/entities/AdminTask";
import { MaintenanceTask } from "../src/entities/MaintenanceTask";
import { PurchaseOrder } from "../src/entities/PurchaseOrder";
import { AuditLog } from "../src/entities/AuditLog";
import { Project } from "../src/entities/Project";
import { ProjectTask } from "../src/entities/ProjectTask";
import { WikiDoc } from "../src/entities/WikiDoc";
import { Bitacora } from "../src/entities/Bitacora";
import { Room } from "../src/entities/Room";
import { RoomBlock } from "../src/entities/RoomBlock";
import { RoomReservation } from "../src/entities/RoomReservation";
import { ProcurementRequest } from "../src/entities/ProcurementRequest";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres_pass",
    database: process.env.DB_NAME || "sga_db",
    synchronize: false,
    logging: false,
    entities: [Ticket, Message, User, Schedule, InventoryItem, Reservation, AdminTask, MaintenanceTask, PurchaseOrder, AuditLog, Project, ProjectTask, WikiDoc, Bitacora, Room, RoomBlock, RoomReservation, ProcurementRequest],
    migrations: [],
    subscribers: [],
});
