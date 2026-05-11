import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { User } from '../src/entities/User';
import { EquipmentInventory } from '../src/entities/EquipmentInventory';
import { EquipmentLoan } from '../src/entities/EquipmentLoan';
import { SpecialLoan } from '../src/entities/SpecialLoan';

export const runSeed = async () => {
  console.log("🌱 Iniciando procesos de siembra de base de datos...");
  
  // Semilla Administrador (SuperUser)
  try {
    const userRepo = AppDataSource.getRepository(User);
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@uah.cl';
    const adminExists = await userRepo.findOneBy({ correo: ADMIN_EMAIL });
    if (!adminExists) {
        console.log(`🌱 Creando administrador root (${ADMIN_EMAIL})...`);
        const ADMIN_PASS = process.env.ADMIN_DEFAULT_PASSWORD;
        if (!ADMIN_PASS) {
          console.error("FATAL ERROR: ADMIN_DEFAULT_PASSWORD no está configurado en .env");
          return;
        }
        const hashedPassword = await bcrypt.hash(ADMIN_PASS, 10);
        await userRepo.save(userRepo.create({
            nombreCompleto: 'Administrador Sistema',
            rut: '1-9',
            correo: ADMIN_EMAIL,
            password: hashedPassword,
            rol: 'SuperUser', 
            permisos: { 
              'Welcome': 'Editor', 'Dashboard': 'Editor', 'Laboratorio': 'Editor', 
              'Horarios Academicos': 'Editor', 'Salas y Labs': 'Editor', 
              'Gestion de Solicitudes': 'Editor', 'Ayuda & Soporte': 'Editor', 
              'Wiki': 'Editor', 'Compras': 'Editor', 'Mantencion': 'Editor', 
              'Bitagora': 'Editor', 'Proyectos': 'Editor', 'Usuarios': 'Editor', 
              'Auditoria': 'Editor', 'Prestamo Equipos': 'Editor' 
            }
        }));
    }
  } catch(e) { console.warn("⚠️ Error al verificar semilla Admin:", e); }

  // Semilla Prestamo Equipos
  try {
    const invRepo = AppDataSource.getRepository(EquipmentInventory);
    const loanRepo = AppDataSource.getRepository(EquipmentLoan);
    const specialRepo = AppDataSource.getRepository(SpecialLoan);
    
    const invExists = await invRepo.find();
    if (invExists.length === 0) {
      console.log("🌱 Inicializando inventario de laboratorios...");
      await invRepo.save(invRepo.create({
        dellLaptops: 12, macLaptops: 15, dellChargers: 12, macChargers: 15, extensionCords: 10, configName: 'SGA_DEFAULT'
      }));
    }

    const loansExist = await loanRepo.find();
    if (loansExist.length === 0) {
      console.log("🌱 Inicializando malla completa de préstamos...");
      const initialLoans = [
        { className: 'F.Prog sec 02', professor: 'Hector', day: 'Lunes', timeBlock: '10:00 - 11:20', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'F.Prog sec 04', professor: 'Felipe', day: 'Lunes', timeBlock: '13:00 - 14:20', colorTheme: 'pink', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Base de Datos sec 02', professor: 'Felipe', day: 'Lunes', timeBlock: '14:30 - 15:50', colorTheme: 'pink', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Base de Datos sec 03', professor: 'Guillermo', day: 'Lunes', timeBlock: '16:00 - 17:20', colorTheme: 'pink', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Programación Avanzada sec 02', professor: 'FABIO ANTONIO SÁEZ JARA', day: 'Martes', timeBlock: '08:30 - 09:50', colorTheme: 'pink', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Programación Avanzada 02', professor: 'FABIO ANTONIO SÁEZ JARA', day: 'Martes', timeBlock: '10:00 - 11:20', colorTheme: 'pink', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Ayudantía Redes Sociales sec 01', professor: 'Ayudante', day: 'Martes', timeBlock: '11:30 - 12:50', colorTheme: 'yellow', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Arte y creatividad en ingeniería Sec 1', professor: 'STEFANI NATALIA MARDONES CARVAJAL', day: 'Martes', timeBlock: '13:00 - 14:20', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Probabilidad y Estadística sec 01', professor: 'Christopher', day: 'Martes', timeBlock: '16:00 - 17:20', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'F.Prog sec 02', professor: 'Hector', day: 'Miércoles', timeBlock: '10:00 - 11:20', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Ayudantía Redes', professor: 'Ayudante', day: 'Miércoles', timeBlock: '11:30 - 12:50', colorTheme: 'yellow', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'F.Prog sec 04', professor: 'Felipe', day: 'Miércoles', timeBlock: '13:00 - 14:20', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Base de Datos sec 02', professor: 'Felipe', day: 'Miércoles', timeBlock: '14:30 - 15:50', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Base de Datos sec 03', professor: 'Guillermo', day: 'Miércoles', timeBlock: '16:00 - 17:20', colorTheme: 'pink', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Redes', professor: 'JUAN ANTONIO SARAVIA VILLAR', day: 'Miércoles', timeBlock: '17:30 - 18:50', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Ayudantía Programación Avanzada sec 02', professor: 'Ayudante', day: 'Jueves', timeBlock: '11:30 - 12:50', colorTheme: 'yellow', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Arte y creatividad en ingeniería Sec 1', professor: 'STEFANI NATALIA MARDONES CARVAV JAL', day: 'Jueves', timeBlock: '13:00 - 14:20', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Arte y creatividad en ingeniería Sec 4', professor: 'Claudia Moreno', day: 'Jueves', timeBlock: '16:00 - 17:20', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Redes', professor: 'JUAN ANTONIO SARAVIA VILLAR', day: 'Jueves', timeBlock: '17:30 - 18:50', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Arquitectura de software', professor: 'Cristian', day: 'Viernes', timeBlock: '08:30 - 09:50', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Ayudantía Arquitectura de software', professor: 'Ayudante', day: 'Viernes', timeBlock: '10:00 - 11:20', colorTheme: 'yellow', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Arquitectura de software', professor: 'Cristian', day: 'Viernes', timeBlock: '11:30 - 12:50', colorTheme: 'pink', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Ayudantía redes sociales sec 2', professor: 'Ayudante', day: 'Viernes', timeBlock: '13:00 - 14:20', colorTheme: 'yellow', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'Ayudantía Base de Datos sec 02', professor: 'Ayudante', day: 'Viernes', timeBlock: '14:30 - 15:50', colorTheme: 'yellow', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } },
        { className: 'F.Prog sec 09', professor: 'Sin profesor', day: 'Viernes', timeBlock: '16:00 - 17:20', colorTheme: 'blue', equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } }
      ];
      await loanRepo.save(loanRepo.create(initialLoans as any));
    }

    const specialsExists = await specialRepo.find();
    if (specialsExists.length === 0) {
      console.log("🌱 Inicializando préstamos especiales...");
      const initialSpecials = [
        {
          applicantName: 'Ignacio Muñoz',
          applicantRut: '20.123.126-4',
          applicantType: 'Alumno',
          startDate: '2026-04-09',
          endDate: '2026-04-16',
          reason: 'Feria FIDAE',
          equipment: { dellLaptops: 0, macLaptops: 1, dellChargers: 0, macChargers: 1, extensionCords: 0 },
          detailedItems: [{ id: 'item-1', type: 'Laptop Mac', brand: 'Apple', model: 'MacBook Pro M2', serialNumber: 'C02F12345678', chargerSerialNumber: 'CHG-987654321', observations: 'Pequeño rasguño en la tapa' }],
          status: 'active',
          documentNumber: '480'
        }
      ];
      await specialRepo.save(specialRepo.create(initialSpecials as any));
    }
  } catch(e) { console.warn("⚠️ Error en semilla de préstamos:", e); }
};
