import { AppDataSource } from './data-source';
import { WikiDoc } from "../src/entities/WikiDoc";
import { InventoryItem } from "../src/entities/InventoryItem";
import { Schedule } from "../src/entities/Schedule";
import { User } from "../src/entities/User";
import "reflect-metadata";

/**
 * PROTOCOLO DE AUDITORÍA SGA FIN
 * Certificación de funciones críticas y democratización de recursos.
 */
async function runAudit() {
    console.log("🚀 INICIANDO AUDITORÍA DE SOBERANÍA SISTÉMICA - SGA FIN");
    console.log("-------------------------------------------------------");

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log("✅ Conexión a Infraestructura de Datos: EXITOSA");

        const wikiRepo = AppDataSource.getRepository(WikiDoc);
        const invRepo = AppDataSource.getRepository(InventoryItem);
        const schedRepo = AppDataSource.getRepository(Schedule);
        const userRepo = AppDataSource.getRepository(User);

        // 1. Verificación de Democratización Wiki
        try {
            const publicDocs = await wikiRepo.count({ where: { isPublic: true } });
            const privateDocs = await wikiRepo.count({ where: { isPublic: false } });
            console.log(`📑 WIKI: ${publicDocs} documentos públicos / ${privateDocs} privados.`);
        } catch (e: any) { console.error("⚠️ WIKI: No accesible -", e.message); }

        // 2. Verificación de Inventario Abierto
        try {
            const totalItems = await invRepo.count();
            const availableItems = await invRepo.count({ where: { status: 'Disponible' } });
            console.log(`📦 INVENTARIO: ${availableItems}/${totalItems} equipos operativos.`);
        } catch (e: any) { console.error("⚠️ INVENTARIO: No accesible -", e.message); }

        // 3. Verificación de Horarios Académicos
        try {
            const totalSchedules = await schedRepo.count();
            console.log(`📅 HORARIOS: ${totalSchedules} bloques de clase detectados.`);
        } catch (e: any) { console.error("⚠️ HORARIOS: No accesible -", e.message); }

        // 4. Verificación de Roles Granulares
        try {
            const users = await userRepo.find({ take: 10 });
            const rolesDetected = Array.from(new Set(users.map(u => u.rol)));
            console.log(`👥 SEGURIDAD: Roles en sistema: ${rolesDetected.join(', ')}`);
        } catch (e: any) { console.error("⚠️ SEGURIDAD: Fallo en auditoría de usuarios."); }

        console.log("-------------------------------------------------------");
        console.log("🏅 AUDITORÍA COMPLETADA - REVISE LOS AVISOS SUPERIORES");
        process.exit(0);
    } catch (error: any) {
        console.error("❌ ERROR CRÍTICO EN AUDITORÍA:", error.message);
        process.exit(1);
    }
}

runAudit();
