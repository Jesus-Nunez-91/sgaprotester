import { Injectable, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { validateInstitucionalEmail } from '../utils/auth-validation';

declare var Swal: any;

// --- INTERFACES COMPLETAS ---

export interface User {
  id: number;
  nombreCompleto: string;
  rut: string;
  correo: string;
  password?: string;
  rol: 'Alumno' | 'Docente' | 'Academico' | 'Admin_Acade' | 'Admin_Labs' | 'SuperUser';
  permisos?: any;
  carrera?: string;
  anioIngreso?: number;
}

export interface InventoryItem {
  id: number;
  tipoInventario: 'Equipos' | 'Materiales';
  categoria: string;
  subCategoria: string;
  rotulo_ID?: string;
  marca: string;
  modelo: string;
  sn?: string;
  status: string;
  so?: string;
  procesador?: string;
  ram?: string;
  rom?: string;
  softwareInstalado?: string;
  stockActual: number;
  stockMinimo: number;
  stockDefectuoso: number;
  esFungible: boolean;
  imagenUrl?: string;
  numeroFactura?: string;
  fechaLlegada?: string;
  cantidadLlegada: number;
  observaciones?: string;
}

export interface Reservation {
  id: number;
  equipoId: number;
  fecha: string;
  bloque: string;
  cantidad: number;
  nombreSolicitante: string;
  rutSolicitante: string;
  emailSolicitante: string;
  tipoUsuario: string;
  aprobada: boolean;
  rechazada: boolean;
  motivoRechazo?: string;
  devuelto?: number;
  clockIn?: Date | string;
  clockOut?: Date | string;
}

export interface AuditLog {
  id: number;
  fecha: string;
  nombre: string;
  usuario: string;
  rol: string;
  accion: string;
  detalle: string;
}

export interface SupportTicket {
  id: number;
  userId: number;
  userName: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Closed';
  messages: any[];
  lastUpdate: string;
}

export interface ProjectTask {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  progress: number;
  projectId: number;
  assigneeId?: number;
  assignees?: string;
  status?: 'En espera' | 'En proceso' | 'Pendiente de Aprobacion' | 'Finalizada';
}

export interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Planeacion' | 'En Progreso' | 'Finalizado';
  color: string;
  managerId: number;
  tasks: ProjectTask[];
}

export interface WikiDoc {
  id: number;
  title: string;
  category: 'Protocolo' | 'Manual' | 'Guia';
  content: string;
  isPublic: boolean;
  fileUrl?: string;
  createdAt: string;
}

export interface MaintenanceTask {
  id: number;
  itemId: number;
  itemName: string;
  type: 'Preventivo' | 'Correctivo';
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  status: 'Pendiente' | 'En Progreso' | 'Finalizado';
  technician: string;
  cost: number;
  description: string;
  dateScheduled: string;
}

export type PurchaseStage = 'Solicitud' | 'Adjudicacion' | 'Seguimiento' | 'Cierre';
export type LabType = 'FABLAB' | 'QUIMICA' | 'FISICA' | 'INFORMATICA';

export interface PurchaseOrder {
  id: number;
  idNum: string;
  lab: LabType;
  item: string;
  linkReferencia: string;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
  itemsArray?: { description: string, quantity: number, unitPrice: number }[];
  fechaSolicitud: string;
  observaciones: string;
  stage: PurchaseStage;
  proveedor?: string;
  rutProveedor?: string;
  productoAdjudicado?: string;
  precioAdjudicado?: number;
  cantidadAdjudicada?: number;
  numeroOC?: string;
  numeroCotizacion?: string;
  numeroFactura?: string;
  fechaFactura?: string;
  fechaEntrega?: string;
}

export interface ClassSchedule {
  id?: number;
  lab: string;
  day: string;
  block: string;
  subject: string;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private router = inject(Router);
  private socket: Socket;

  currentUser = signal<User | null>(null);
  token = signal<string | null>(null);

  // Listas de datos
  users = signal<User[]>([]);
  inventory = signal<InventoryItem[]>([]);
  reservations = signal<Reservation[]>([]);
  auditLogs = signal<AuditLog[]>([]);
  supportTickets = signal<SupportTicket[]>([]);
  notifications = signal<any[]>([]);
  maintenanceTasks = signal<MaintenanceTask[]>([]);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  classSchedules = signal<ClassSchedule[]>([]);
  projects = signal<Project[]>([]);
  wikiDocs = signal<WikiDoc[]>([]);
  labBudgets = signal<Record<string, number>>({ 'FABLAB': 0, 'QUIMICA': 0, 'FISICA': 0, 'INFORMATICA': 0 }); // Iniciamos en 0 para limpieza total
  darkMode = signal<boolean>(false);
  adminTasks = signal<any[]>([]);
  bitacora = signal<any[]>([]);
  unifiedRequests = signal<any[]>([]); // "Caja Negra" institucional
  isLoading = signal<boolean>(false);

  // Configuración de conexión dinámica (Navegador vs Móvil)
  private baseUrl = (window.hasOwnProperty('Capacitor'))
    ? 'http://10.10.0.20:3040' // Para dispositivos móviles reales
    : '';                        // Para el navegador (usa la misma URL del sitio)

  hierarchy: Record<string, string[]> = {
    'FABLAB': ['BIOMATERIALES', 'TEXTIL', 'FABRICACIÓN DIGITAL'],
    'LAB CIENCIAS BASICAS': ['QUIMICA', 'FISICA'],
    'LAB INFORMATICA': ['HACKERLAB', 'DESARROLLO TECNOLOGICO']
  };

  constructor() {
    this.loadFromStorage();
    this.socket = io(this.baseUrl);
    this.setupSocket();
    this.fetchSchedules();
    this.fetchInventory();
    this.fetchReservations();
    this.fetchMaintenanceTasks();
    this.fetchPurchaseOrders();
    this.fetchAdminTasks();
    this.fetchAuditLogs();
    this.fetchProjects();
    this.fetchWiki();
    this.fetchSystemSettings();
    this.fetchNotifications(); // NUEVO: Cargar notificaciones persistentes
    effect(() => document.documentElement.classList.toggle('dark', this.darkMode()));

    // --- TIEMPO REAL UAH: AUTO-REFRESCO (5 SEG) ---
    this.startAutoRefresh();
  }

  private refreshInterval: any;
  private startAutoRefresh() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    
    this.refreshInterval = setInterval(() => {
      if (this.token()) {
        // Refrescar señales críticas
        this.fetchNotifications();
        this.fetchUnifiedRequests();
        this.fetchPurchaseOrders();
        this.fetchSystemSettings(); // Para presupuestos en tiempo real
        this.fetchReservations();
        this.fetchMaintenanceTasks();
      }
    }, 5000); 
  }

  // --- PERSISTENCIA TOTAL: CONFIGURACIONES (UAH) ---
  async fetchSystemSettings() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/settings', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        const settings: any[] = await res.json();
        const budgets = { ...this.labBudgets() };
        settings.forEach(s => {
          if (s.key.startsWith('BUDGET_')) {
            const lab = s.key.replace('BUDGET_', '');
            budgets[lab] = Number(s.value);
          }
        });
        this.labBudgets.set(budgets);
      }
    } catch (e) { console.error("Error al cargar configuraciones", e); }
  }


  async updateLabBudget(lab: string, amount: number) {
    if (!this.token()) return;
    try {
      await fetch(this.baseUrl + '/api/settings', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify({
          key: `BUDGET_${lab}`,
          value: amount.toString(),
          description: `Presupuesto Máximo para el laboratorio de ${lab}`
        })
      });
      await this.fetchSystemSettings();
    } catch (e) { console.error("Error al actualizar presupuesto", e); }
  }

  private setupSocket() {
    this.socket.on('init', ({ tickets }) => {
      console.log("Tickets iniciales cargados via socket:", tickets?.length);
      this.supportTickets.set(tickets || []);
    });

    this.socket.on('ticket:created', (t) => {
      console.log("Evento ticket:created recibido:", t);
      this.supportTickets.update(v => [t, ...v]);
      const user = this.currentUser();
      const isMe = t.userId === user?.id;
      this.notifications.update(n => [{
        id: Date.now(),
        userId: isMe ? t.userId : 'all',
        title: isMe ? 'Ticket Creado' : 'Nuevo Ticket Soporte',
        message: `${t.userName}: ${t.subject}`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      }, ...n]);
    });

    this.socket.on('message:received', (msg) => {
      console.log("Evento message:received recibido:", msg);
      // Actualizar tickets (usando == para evitar problemas de string vs number en IDs)
      this.supportTickets.update(v => v.map(t => t.id == msg.ticketId ? { ...t, messages: [...t.messages, msg], status: msg.newStatus || t.status } : t));

      const user = this.currentUser();
      if (user && msg.sender !== user.nombreCompleto) {
        console.log("Generando notificación para el usuario...");
        const isAdmin = user.rol === 'Admin_Labs' || user.rol === 'Admin_Acade' || user.rol === 'SuperUser' || user.rol === 'Academico';
        this.notifications.update(n => [{
          id: Date.now(),
          userId: isAdmin ? 'all' : user.id,
          title: 'Nuevo Mensaje Soporte',
          message: `${msg.sender}: ${msg.text.substring(0, 30)}...`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString()
        }, ...n]);
      }
    });

    this.socket.on('ticket:deleted', ({ ticketId }) => {
      console.log("Ticket eliminado remotamente:", ticketId);
      this.supportTickets.update(v => v.filter(t => t.id != ticketId));
    });

    // Unirse a salas privadas al cargar el usuario
    effect(() => {
      const user = this.currentUser();
      if (user) {
        console.log("Enviando evento 'join' para sala:", user.id, user.rol, user.nombreCompleto);
        this.socket.emit('join', { userId: user.id, role: user.rol, name: user.nombreCompleto });
      }
    });
  }

  // --- PERSISTENCIA TOTAL: NOTIFICACIONES (UAH) ---
  async fetchNotifications() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/notifications', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) this.notifications.set(await res.json());
    } catch (e) { console.error("Error al cargar notificaciones", e); }
  }

  async createNotification(notif: { title: string, message: string, userId?: string, type?: string }) {
    if (!this.token()) return;
    try {
      await fetch(this.baseUrl + '/api/notifications', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify({ ...notif, userId: notif.userId || 'all', type: notif.type || 'info' })
      });
      await this.fetchNotifications();
    } catch (e) { console.error("Error al crear notificación", e); }
  }

  deleteTicket(ticketId: number) {
    this.socket.emit('ticket:delete', { ticketId });
  }

  // --- MÉTODOS DE NEGOCIO ---
  isNotifForUser(n: any, user: User) { return n.userId.toString() === user.id.toString() || n.userId === 'all'; }
  async markAllAsRead() {
    if (!this.token()) return;
    try {
      await fetch(this.baseUrl + '/api/notifications/mark-all-read', { credentials: 'include', method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      await this.fetchNotifications();
    } catch (e) { console.error("Error al marcar como leídas", e); }
  }

  async markAsRead(id: number) {
    if (!this.token()) return;
    try {
      await fetch(this.baseUrl + `/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      // Actualización optimista del estado local
      this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) { console.error("Error al marcar notificación como leída", e); }
  }
  toggleDarkMode() { this.darkMode.update(v => !v); }
  updateBudgets(newBudgets: Record<string, number>) {
    this.labBudgets.set(newBudgets);
    this.save();
  }

  async addItem(item: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/inventory', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(item)
      });
      if (res.ok) await this.fetchInventory();
    } catch (e) {
      console.error("Error al añadir item", e);
    }
  }

  async checkIn(id: number) {
    try {
      const res = await fetch(this.baseUrl + `/api/reservations/${id}/check-in`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        const updated = await res.json();
        this.reservations.update(list => list.map(r => r.id === id ? { ...r, clockIn: updated.clockIn } : r));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async checkOut(id: number) {
    try {
      const res = await fetch(this.baseUrl + `/api/reservations/${id}/check-out`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        const updated = await res.json();
        this.reservations.update(list => list.map(r => r.id === id ? { ...r, clockOut: updated.clockOut } : r));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async updateItem(id: number, item: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(item)
      });
      if (res.ok) {
        await this.fetchInventory();
        await this.fetchMaintenanceTasks();
      }
    } catch (e) {
      console.error("Error al actualizar item", e);
    }
  }

  async deleteItem(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) await this.fetchInventory();
    } catch (e) {
      console.error("Error al eliminar item", e);
    }
  }

  async deleteRoomReservation(id: number): Promise<boolean> {
    if (!this.token()) return false;
    try {
      const res = await fetch(this.baseUrl + `/api/room-reservations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        await this.fetchReservations();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error al eliminar reserva de sala", e);
      return false;
    }
  }

  async deleteLaboratoryReservation(id: number): Promise<boolean> {
    if (!this.token()) return false;
    try {
      const res = await fetch(this.baseUrl + `/api/reservations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        await this.fetchReservations();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error al eliminar reserva", e);
      return false;
    }
  }

  async resetDatabase(): Promise<boolean> {
    if (!this.token()) return false;
    try {
      const res = await fetch(this.baseUrl + '/api/maintenance/reset-db', { credentials: 'include', method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        await this.fetchInventory();
        await this.fetchPurchaseOrders();
        await this.fetchReservations();
        await this.fetchNotifications();
        await this.fetchUnifiedRequests();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error al resetear BD", e);
      return false;
    }
  }

  async addBulkItems(items: any[]) {
    if (!this.token()) return false;
    try {
      const res = await fetch(this.baseUrl + '/api/inventory/bulk', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(items)
      });
      if (res.ok) {
        await this.fetchInventory();
        return true;
      } else {
        const errorData = await res.json();
        console.error("Error en respuesta bulk:", errorData);
        throw new Error(errorData.message || "Error desconocido en el servidor");
      }
    } catch (e: any) {
      console.error("Error en carga masiva", e);
      Swal.fire({
        icon: 'error',
        title: 'Error de Carga',
        text: e.message || 'No se pudo completar la carga masiva.'
      });
      return false;
    }
  }

  async clearAllInventory() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/inventory/mass/clear', { credentials: 'include', method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) await this.fetchInventory();
      return res.ok;
    } catch (e) {
      console.error("Error al vaciar inventario", e);
      return false;
    }
  }

  async createReservation(item: InventoryItem, fecha: string, bloque: string, cantidad: number) {
    if (!this.token()) return;
    const user = this.currentUser();
    const resPayload: any = {
      equipoId: item.id,
      fecha, bloque, cantidad,
      nombreSolicitante: user?.nombreCompleto || '',
      rutSolicitante: user?.rut || '',
      emailSolicitante: user?.correo || '',
      tipoUsuario: user?.rol || 'Alumno',
      aprobada: false,
      rechazada: false
    };
    try {
      const res = await fetch(this.baseUrl + '/api/reservations', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(resPayload)
      });
      if (res.ok) await this.fetchReservations();
    } catch (e) {
      console.error("Error al crear reserva", e);
    }
  }

  async updateReservationStatus(id: number, status: string, payload?: any) {
    const isApprove = status === 'approve';
    const isReject = status === 'reject';
    
    // Optimistic UI update
    this.reservations.update(v => v.map(r => r.id === id ? { ...r, aprobada: isApprove, rechazada: isReject, motivoRechazo: payload?.motivo } : r));
    this.save();
    
    // Backend persistance
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify({ 
           aprobada: isApprove, 
           rechazada: isReject, 
           motivoRechazo: payload?.motivo,
           devuelto: payload?.devuelto
        })
      });
      if (res.ok) {
        await this.fetchReservations();
      }
    } catch (e) {
      console.error("Error al actualizar reserva en API", e);
    }
  }

  async fetchAuditLogs() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/audit', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.auditLogs.set(data);
      }
    } catch (e) {
      console.error("Error al cargar logs", e);
    }
  }

  // --- GESTIÓN DE MANTENCIÓN API ---
  async fetchMaintenanceTasks() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/maintenance', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) this.maintenanceTasks.set(await res.json());
    } catch (e) { console.error("Error al cargar mantenciones", e); }
  }

  async addMaintenanceTask(task: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/maintenance', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(task)
      });
      if (res.ok) await this.fetchMaintenanceTasks();
    } catch (e) { console.error("Error al crear mantención", e); }
  }

  async updateMaintenanceTask(id: number, task: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/maintenance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(task)
      });
      if (res.ok) await this.fetchMaintenanceTasks();
    } catch (e) { console.error("Error al actualizar mantención", e); }
  }

  async deleteMaintenanceTask(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/maintenance/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) await this.fetchMaintenanceTasks();
    } catch (e) { console.error("Error al eliminar mantención", e); }
  }

  // --- GESTIÓN DE COMPRAS API (PROCUREMENT) ---
  async fetchPurchaseOrders() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/procurement', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) this.purchaseOrders.set(await res.json());
    } catch (e) { console.error("Error al cargar órdenes de compra", e); }
  }

  async addPurchaseOrder(order: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/procurement', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(order)
      });
      if (res.ok) await this.fetchPurchaseOrders();
    } catch (e) { console.error("Error al crear OC", e); }
  }


  async updatePurchaseOrder(id: number, data: any, stage?: PurchaseStage) {
    if (!this.token()) return;
    const payload = stage ? { ...data, stage } : data;
    try {
      const res = await fetch(this.baseUrl + `/api/procurement/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) await this.fetchPurchaseOrders();
    } catch (e) { console.error("Error al actualizar OC", e); }
  }

  async deletePurchaseOrder(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/procurement/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) await this.fetchPurchaseOrders();
    } catch (e) { console.error("Error al eliminar OC", e); }
  }

  // --- GESTIÓN DE TAREAS ADMIN API ---
  async fetchAdminTasks() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/admin-tasks', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) this.adminTasks.set(await res.json());
    } catch (e) { console.error("Error al cargar tareas admin", e); }
  }

  async addAdminTask(task: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/admin-tasks', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(task)
      });
      if (res.ok) await this.fetchAdminTasks();
    } catch (e) { console.error("Error al crear tarea admin", e); }
  }

  async updateAdminTask(id: number, data: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/admin-tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) await this.fetchAdminTasks();
    } catch (e) { console.error("Error al actualizar tarea admin", e); }
  }

  async deleteAdminTask(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/admin-tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) await this.fetchAdminTasks();
    } catch (e) { console.error("Error al eliminar tarea admin", e); }
  }

  // --- TICKETS DE SOPORTE ---
  createTicket(subject: string, message: string) {
    const user = this.currentUser();
    this.socket.emit('ticket:create', {
      id: Date.now(),
      subject,
      userId: user?.id,
      userName: user?.nombreCompleto,
      messages: [{ text: message, sender: user?.nombreCompleto, role: user?.rol }]
    });
  }

  replyTicket(id: number, text: string) {
    const user = this.currentUser();
    this.socket.emit('message:send', {
      ticketId: id,
      text,
      sender: user?.nombreCompleto,
      role: user?.rol
    });
  }

  closeTicket(id: number) {
    this.socket.emit('ticket:update_status', { ticketId: id, status: 'Closed' });
  }

  updateTicketStatus(ticketId: number, status: string) {
    this.socket.emit('ticket:update_status', { ticketId, status });
  }

  // --- GESTIÓN DE USUARIOS API ---
  async fetchUsers() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/users', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.users.set(data);
      }
    } catch (e) {
      console.error("Error al cargar usuarios", e);
    }
  }

  async addUser(user: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/users', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        await this.fetchUsers();
      }
    } catch (e) {
      console.error("Error al crear usuario", e);
    }
  }

  async updateUser(id: number, user: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(user)
      });
      if (res.ok) {
        await this.fetchUsers();
      }
    } catch (e) {
      console.error("Error al actualizar usuario", e);
    }
  }

  async deleteUser(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        await this.fetchUsers();
      }
    } catch (e) {
      console.error("Error al eliminar usuario", e);
    }
  }

  // --- GESTIÓN DE HORARIOS API ---
  async fetchSchedules() {
    if (!this.token()) return;
    this.isLoading.set(true);
    try {
      const res = await fetch(this.baseUrl + '/api/schedules', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.classSchedules.set(data);
      }
    } catch (e) {
      console.error("Error al cargar horarios", e);
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateSchedule(schedule: Partial<ClassSchedule>) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/schedules', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(schedule)
      });
      if (res.ok) {
        await this.fetchSchedules();
      }
    } catch (e) {
      console.error("Error al actualizar horario", e);
    }
  }

  async addBulkSchedules(schedules: any[]) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/schedules/bulk', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(schedules)
      });
      if (res.ok) await this.fetchSchedules();
      return res.ok;
    } catch (e) {
      console.error("Error en carga masiva de horarios", e);
      return false;
    }
  }

  // --- CAJA NEGRA: GESTIÓN UNIFICADA (SALAS + EQUIPOS) ---
  async fetchUnifiedRequests() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/procurement-requests', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        this.unifiedRequests.set(await res.json());
      }
    } catch (e) {
      console.error("Error al cargar CAJA NEGRA", e);
    }
  }

  async deleteSchedule(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/schedules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        await this.fetchSchedules();
      }
    } catch (e) {
      console.error("Error al eliminar horario", e);
    }
  }

  async addBulkUsers(users: any[]) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/users/bulk', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(users)
      });
      if (res.ok) {
        await this.fetchUsers();
      }
    } catch (e) {
      console.error("Error al crear usuarios masivamente", e);
    }
  }

  private save() {
    localStorage.setItem('sga_token', this.token() || '');
  }

  private loadFromStorage() {
    const token = localStorage.getItem('sga_token');
    const session = sessionStorage.getItem('uah_user');
    if (token && session) {
      this.token.set(token);
      this.currentUser.set(JSON.parse(session));
      this.fetchAuditLogs();
      this.fetchSystemSettings();
      this.fetchNotifications();
    }
  }

  async login(correo: string, pass: string, recaptchaToken?: string): Promise<boolean> {
    try {
      const res = await fetch(this.baseUrl + '/api/auth/login', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password: pass, recaptchaToken })
      });

      if (res.ok) {
        const { user } = await res.json();
        this.token.set('cookie-based');
        this.currentUser.set(user);
        sessionStorage.setItem('uah_user', JSON.stringify(user));

        if (user.rol === 'Admin_Labs' || user.rol === 'Admin_Acade' || user.rol === 'SuperUser') {
          this.fetchUsers();
          this.fetchAuditLogs();
        }
        
        // Carga inmediata de datos operativos para todos los roles
        this.fetchSchedules();
        this.fetchInventory();
        this.fetchProjects();
        this.fetchWiki();
        this.fetchBitacora();
        this.fetchReservations();
        this.fetchSystemSettings();
        this.fetchNotifications();

        return true;
      }
    } catch (error) {
      console.error("Error en login API", error);
    }
    return false;
  }

  /**
   * Envía una solicitud de acceso (registro o restablecimiento) que se convierte en un ticket.
   */
  async submitAccessRequest(data: any): Promise<boolean> {
    if (!validateInstitucionalEmail(data.email)) {
      Swal.fire({ icon: 'error', title: 'Dominio Inválido', text: 'Solo se permiten correos @uah.cl, @uahurtado.cl o @alumnos.uahurtado.cl' });
      return false;
    }

    try {
      const ticketId = Date.now();
      // Emitir evento para crear ticket de soporte especial
      this.socket.emit('ticket:create', {
        id: ticketId,
        subject: `[SOLICITUD] ${data.type === 'register' ? 'REGISTRO' : 'ACCESO'}: ${data.nombreCompleto}`,
        userId: 0, // 0 indica que es un invitado/no registrado
        userName: data.nombreCompleto,
        messages: [{
          text: `DATOS DE LA SOLICITUD
          -------------------
          Nombre: ${data.nombreCompleto}
          RUT: ${data.rut}
          Carrera: ${data.carrera}
          Año: ${data.anio}
          Rol: ${data.rol}
          Email: ${data.email}
          Tipo: ${data.type === 'register' ? 'Nuevo Registro' : 'Restablecimiento de Contraseña'}`,
          sender: data.nombreCompleto
        }]
      });

      return true;
    } catch (error) {
      console.error("Error al enviar solicitud", error);
      return false;
    }
  }

  logout() {
    this.currentUser.set(null);
    this.token.set(null);
    sessionStorage.removeItem('uah_user');
    localStorage.removeItem('sga_token');
    this.router.navigate(['/login']);
  }

  fuzzySearch<T>(items: T[], query: string, keys: (keyof T)[]): T[] {
    if (!query) return items;
    const term = query.toLowerCase();
    return items.filter(item => keys.some(k => String((item as any)[k]).toLowerCase().includes(term)));
  }

  downloadExcel(data: any[], fileName: string) {
    if (typeof (window as any).XLSX === 'undefined') {
      console.error('Librería XLSX no cargada');
      return;
    }
    const ws = (window as any).XLSX.utils.json_to_sheet(data);
    const wb = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(wb, ws, "Datos");
    (window as any).XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  async fetchInventory() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/inventory', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Inventario cargado desde API:", data.length, "items");
        this.inventory.set(data);
      } else {
        console.error("Fallo al obtener inventario de la API", res.status);
      }
    } catch (e) {
      console.error("Error al cargar inventario", e);
    }
  }

  async fetchReservations() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/reservations', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.reservations.set(data);
      }
    } catch (e) {
      console.error("Error al cargar reservas", e);
    }
  }

  async fetchProjects() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/projects', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` } });
      if (res.ok) this.projects.set(await res.json());
    } catch (e) { console.error("Error al cargar proyectos", e); }
  }

  async saveProject(project: any) {
    if (!this.token()) return;
    const method = project.id ? 'PUT' : 'POST';
    const url = project.id ? `/api/projects/${project.id}` : '/api/projects';
    // Limpieza institucional: Enviamos 'tasks' como JSON array
    const { manager, createdAt, updatedAt, ...cleanProject } = project;
    
    try {
      const res = await fetch(url, { credentials: 'include', method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token()}` },
        body: JSON.stringify(cleanProject)
      });
      if (res.ok) await this.fetchProjects();
    } catch (e) { console.error("Error al guardar proyecto", e); }
  }

  async addProjectTask(project: any, task: any) {
    if (!project.tasks) project.tasks = [];
    task.id = Date.now(); // local simple ID
    project.tasks.push(task);
    await this.saveProject(project);
  }

  async updateProjectTask(project: any, task: any) {
    if (!project.tasks) return;
    const idx = project.tasks.findIndex((t: any) => t.id === task.id);
    if (idx !== -1) {
       project.tasks[idx] = task;
       await this.saveProject(project);
    }
  }

  async deleteProjectTask(project: any, taskId: number) {
    if (!project.tasks) return;
    project.tasks = project.tasks.filter((t: any) => t.id !== taskId);
    await this.saveProject(project);
  }

  async deleteProject(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) await this.fetchProjects();
    } catch (e) { console.error("Error al eliminar proyecto", e); }
  }
  // --- GESTIÓN DE WIKI API ---
  async fetchWiki() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/wiki', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` } });
      if (res.ok) this.wikiDocs.set(await res.json());
    } catch (e) { console.error("Error al cargar wiki", e); }
  }

  async saveWiki(doc: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/wiki', { credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token()}` },
        body: JSON.stringify(doc)
      });
      if (res.ok) await this.fetchWiki();
    } catch (e) { console.error("Error al guardar wiki", e); }
  }

  async deleteWiki(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/wiki/${id}`, { credentials: 'include', method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) await this.fetchWiki();
    } catch (e) { console.error("Error al eliminar wiki", e); }
  }

  async updateWiki(id: number, doc: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/wiki/${id}`, { credentials: 'include', method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token()}` },
        body: JSON.stringify(doc)
      });
      if (res.ok) await this.fetchWiki();
    } catch (e) { console.error("Error al actualizar wiki", e); }
  }

  // --- GESTIÓN DE BITÁCORA API ---
  async fetchBitacora() {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + '/api/bitacora', { credentials: 'include', headers: { 'Authorization': `Bearer ${this.token()}` } });
      if (res.ok) this.bitacora.set(await res.json());
    } catch (e) { console.error("Error al cargar bitácora", e); }
  }

  async saveBitacora(entry: any) {
    if (!this.token()) return;
    const method = entry.id ? 'PUT' : 'POST';
    const url = entry.id ? `/api/bitacora/${entry.id}` : '/api/bitacora';
    try {
      const res = await fetch(url, { credentials: 'include', method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token()}` },
        body: JSON.stringify(entry)
      });
      if (res.ok) await this.fetchBitacora();
    } catch (e) { console.error("Error al guardar bitácora", e); }
  }

  async deleteBitacora(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(this.baseUrl + `/api/bitacora/${id}`, { credentials: 'include', method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) await this.fetchBitacora();
    } catch (e) { console.error("Error al eliminar bitácora", e); }
  }

  // --- GESTIÓN DE HORARIOS ---
  async deleteLabSchedules(lab: string): Promise<boolean> {
    if (!this.token()) return false;
    try {
      const res = await fetch(this.baseUrl + `/api/schedules/lab/${lab}`, { credentials: 'include', method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) {
        await this.fetchSchedules();
        return true;
      }
    } catch (e) { console.error("Error al eliminar laboratorio", e); }
    return false;
  }

  async addPurchaseOrdersBulk(orders: any[]): Promise<boolean> {
    if (!this.token()) return false;
    try {
      const res = await fetch(this.baseUrl + '/api/procurement/bulk', { credentials: 'include', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(orders)
      });
      if (res.ok) {
        await this.fetchPurchaseOrders();
        return true;
      } else {
        const errorData = await res.json();
        console.error("Error en importación masiva de compras:", errorData);
        return false;
      }
    } catch (e) {
      console.error("Error de red en importación masiva", e);
      return false;
    }
  }
}