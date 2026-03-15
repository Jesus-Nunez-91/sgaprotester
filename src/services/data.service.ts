import { Injectable, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';

// --- INTERFACES COMPLETAS ---

export interface User {
  id: number;
  nombreCompleto: string;
  rut: string;
  correo: string;
  password?: string;
  rol: 'Alumno' | 'Docente' | 'Admin' | 'SuperUser';
}

export interface InventoryItem {
  id: number;
  tipoInventario: 'Equipos' | 'Arduinos';
  categoria: string;
  subCategoria: string;
  marca: string;
  modelo: string;
  sn?: string;
  status: string;
  so?: string;
  ram?: string;
  rom?: string;
  stockActual: number;
  stockMinimo: number;
  stockDefectuoso: number;
  esFungible: boolean;
  imagenUrl?: string;
  numeroFactura?: string;
  fechaLlegada?: string;
  cantidadLlegada: number;
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
  status: 'Open' | 'Closed';
  messages: any[];
  lastUpdate: string;
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
  internalId: number;
  id: string;
  lab: LabType;
  item: string;
  linkReferencia: string;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
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
  labBudgets = signal<Record<string, number>>({ 'FABLAB': 15000000, 'QUIMICA': 8000000, 'FISICA': 8000000, 'INFORMATICA': 12000000 });
  darkMode = signal<boolean>(false);
  adminTasks = signal<any[]>([]);

  hierarchy: Record<string, string[]> = {
    'FABLAB': ['TEXTIL', 'FABRICACION DIGITAL', 'BIOMATERIALES', 'NOTEBOOK'],
    'LAB CIENCIAS BASICAS': ['QUIMICA', 'FISICA'],
    'LAB INFORMATICA': ['HACKERLAB', 'DESARROLLO TECNOLOGICO']
  };

  constructor() {
    this.loadFromStorage();
    this.socket = io();
    this.setupSocket();
    this.fetchSchedules();
    this.fetchInventory();
    this.fetchReservations();
    this.fetchMaintenanceTasks();
    this.fetchPurchaseOrders();
    this.fetchAdminTasks();
    effect(() => document.documentElement.classList.toggle('dark', this.darkMode()));
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
      this.supportTickets.update(v => v.map(t => t.id == msg.ticketId ? { ...t, messages: [...t.messages, msg] } : t));

      const user = this.currentUser();
      if (user && msg.sender !== user.nombreCompleto) {
        console.log("Generando notificación para el usuario...");
        const isAdmin = user.rol === 'Admin' || user.rol === 'SuperUser';
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

  deleteTicket(ticketId: number) {
    this.socket.emit('ticket:delete', { ticketId });
  }

  // --- MÉTODOS DE NEGOCIO ---
  isNotifForUser(n: any, user: User) { return n.userId === user.id || n.userId === 'all'; }
  markAllAsRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.save();
  }
  toggleDarkMode() { this.darkMode.update(v => !v); }

  async addItem(item: any) {
    if (!this.token()) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
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

  async updateItem(id: number, item: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(item)
      });
      if (res.ok) await this.fetchInventory();
    } catch (e) {
      console.error("Error al actualizar item", e);
    }
  }

  async deleteItem(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) await this.fetchInventory();
    } catch (e) {
      console.error("Error al eliminar item", e);
    }
  }

  async addBulkItems(items: any[]) {
    if (!this.token()) return;
    try {
      const res = await fetch('/api/inventory/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(items)
      });
      if (res.ok) await this.fetchInventory();
    } catch (e) {
      console.error("Error en carga masiva", e);
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
      const res = await fetch('/api/reservations', {
        method: 'POST',
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
      const res = await fetch(`/api/reservations/${id}`, {
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

  // --- GESTIÓN DE MANTENCIÓN API ---
  async fetchMaintenanceTasks() {
    if (!this.token()) return;
    try {
      const res = await fetch('/api/maintenance', {
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) this.maintenanceTasks.set(await res.json());
    } catch (e) { console.error("Error al cargar mantenciones", e); }
  }

  async addMaintenanceTask(task: any) {
    if (!this.token()) return;
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
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
      const res = await fetch(`/api/maintenance/${id}`, {
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
      const res = await fetch(`/api/maintenance/${id}`, {
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
      const res = await fetch('/api/procurement', {
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) this.purchaseOrders.set(await res.json());
    } catch (e) { console.error("Error al cargar órdenes de compra", e); }
  }

  async addPurchaseOrder(order: any) {
    if (!this.token()) return;
    try {
      const res = await fetch('/api/procurement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(order)
      });
      if (res.ok) await this.fetchPurchaseOrders();
    } catch (e) { console.error("Error al crear OC", e); }
  }

  async updatePurchaseOrder(id: number, data: any) {
    if (!this.token()) return;
    try {
      const res = await fetch(`/api/procurement/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token()}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) await this.fetchPurchaseOrders();
    } catch (e) { console.error("Error al actualizar OC", e); }
  }

  async deletePurchaseOrder(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(`/api/procurement/${id}`, {
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
      const res = await fetch('/api/admin-tasks', {
        headers: { 'Authorization': `Bearer ${this.token()}` }
      });
      if (res.ok) this.adminTasks.set(await res.json());
    } catch (e) { console.error("Error al cargar tareas admin", e); }
  }

  async addAdminTask(task: any) {
    if (!this.token()) return;
    try {
      const res = await fetch('/api/admin-tasks', {
        method: 'POST',
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
      const res = await fetch(`/api/admin-tasks/${id}`, {
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
      const res = await fetch(`/api/admin-tasks/${id}`, {
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

  // --- GESTIÓN DE USUARIOS API ---
  async fetchUsers() {
    if (!this.token()) return;
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${this.token()}` }
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
      const res = await fetch('/api/users', {
        method: 'POST',
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
      const res = await fetch(`/api/users/${id}`, {
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
      const res = await fetch(`/api/users/${id}`, {
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
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) {
        const data = await res.json();
        this.classSchedules.set(data);
      }
    } catch (e) {
      console.error("Error al cargar horarios", e);
    }
  }

  async updateSchedule(schedule: Partial<ClassSchedule>) {
    if (!this.token()) return;
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
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

  async deleteSchedule(id: number) {
    if (!this.token()) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, {
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
      const res = await fetch('/api/users/bulk', {
        method: 'POST',
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
    localStorage.setItem('sga_notifications', JSON.stringify(this.notifications()));
    localStorage.setItem('sga_token', this.token() || '');
  }

  private loadFromStorage() {
    const n = localStorage.getItem('sga_notifications'); if (n) this.notifications.set(JSON.parse(n));

    const token = localStorage.getItem('sga_token');
    const session = sessionStorage.getItem('uah_user');
    if (token && session) {
      this.token.set(token);
      this.currentUser.set(JSON.parse(session));
      this.fetchUsers();
    }
  }

  async login(correo: string, pass: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password: pass })
      });

      if (res.ok) {
        const { token, user } = await res.json();
        this.token.set(token);
        this.currentUser.set(user);
        localStorage.setItem('sga_token', token);
        sessionStorage.setItem('uah_user', JSON.stringify(user));

        if (user.rol === 'Admin' || user.rol === 'SuperUser') {
          this.fetchUsers();
        }
        return true;
      }
    } catch (error) {
      console.error("Error en login API", error);
    }
    return false;
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
    try {
      const res = await fetch('/api/inventory');
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
    try {
      const res = await fetch('/api/reservations');
      if (res.ok) {
        const data = await res.json();
        this.reservations.set(data);
      }
    } catch (e) {
      console.error("Error al cargar reservas", e);
    }
  }
}