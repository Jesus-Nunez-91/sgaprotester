import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { AppDataSource } from '../data-source';
import { AuditLog } from '../../src/entities/AuditLog';

const logDir = 'logs';

const fileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '14d', // Mantener logs por 14 días
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    fileTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export const logAudit = async (nombre: string, usuario: string, rol: string, accion: string, detalle: string) => {
  try {
    const repo = AppDataSource.getRepository(AuditLog);
    const log = repo.create({ nombre, usuario, rol, accion, detalle });
    await repo.save(log);
  } catch (error) {
    logger.error(`Error saving audit log: ${error}`);
  }
};

export default logger;
