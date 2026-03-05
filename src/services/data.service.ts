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
  sn: string;
  status: string;
  so: string;
  ram: string;
  rom: string;
  stockActual: number;
  stockMinimo: number;
  esFungible: boolean;
  imagenUrl: string;
  numeroFactura?: string;
  fechaLlegada?: string;
  cantidadLlegada?: number;
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

  hierarchy: Record<string, string[]> = {
    'FABLAB': ['TEXTIL', 'FABRICACION DIGITAL', 'BIOMATERIALES', 'NOTEBOOK'],
    'LAB CIENCIAS BASICAS': ['QUIMICA', 'FISICA'],
    'LAB INFORMATICA': ['HACKERLAB', 'DESARROLLO TECNOLOGICO']
  };

  constructor() {
    this.loadFromStorage();
    this.socket = io();
    this.setupSocket();
    this.fetchSchedules(); // Cargar horarios desde la API
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

  addItem(item: any) { this.inventory.update(v => [...v, { ...item, id: Date.now() }]); this.save(); }
  updateItem(id: number, item: any) { this.inventory.update(v => v.map(i => i.id === id ? { ...i, ...item } : i)); this.save(); }
  deleteItem(id: number) { this.inventory.update(v => v.filter(i => i.id !== id)); this.save(); }

  addBulkItems(items: any[]) {
    this.inventory.update(v => [...v, ...items.map(i => ({ ...i, id: Date.now() + Math.random() }))]);
    this.save();
  }

  createReservation(item: InventoryItem, fecha: string, bloque: string, cantidad: number) {
    const user = this.currentUser();
    const res: Reservation = {
      id: Date.now(),
      equipoId: item.id,
      fecha, bloque, cantidad,
      nombreSolicitante: user?.nombreCompleto || '',
      rutSolicitante: user?.rut || '',
      emailSolicitante: user?.correo || '',
      tipoUsuario: user?.rol || 'Alumno',
      aprobada: false,
      rechazada: false
    };
    this.reservations.update(v => [...v, res]);
    this.save();
  }

  updateReservationStatus(id: number, status: string, payload?: any) {
    this.reservations.update(v => v.map(r => r.id === id ? { ...r, aprobada: status === 'approve', rechazada: status === 'reject', motivoRechazo: payload?.motivo } : r));
    this.save();
  }

  // --- GESTIÓN DE MANTENCIÓN ---
  addMaintenanceTask(task: any) {
    this.maintenanceTasks.update(v => [...v, { ...task, id: Date.now() }]);
    this.save();
  }
  updateMaintenanceTask(id: number, task: any) {
    this.maintenanceTasks.update(v => v.map(t => t.id === id ? { ...t, ...task } : t));
    this.save();
  }
  deleteMaintenanceTask(id: number) {
    this.maintenanceTasks.update(v => v.filter(t => t.id !== id));
    this.save();
  }

  // --- GESTIÓN DE COMPRAS (PROCUREMENT) ---
  updateBudgets(budgets: Record<LabType, number>) {
    this.labBudgets.set({ ...budgets });
    this.save();
  }
  addPurchaseOrder(order: any) {
    const newOrder = { ...order, internalId: Date.now(), stage: 'Solicitud' };
    this.purchaseOrders.update(v => [...v, newOrder]);
    this.save();
  }
  updatePurchaseOrder(id: number, data: any, stage?: PurchaseStage) {
    this.purchaseOrders.update(v => v.map(o => {
      if (o.internalId === id) {
        return { ...o, ...data, stage: stage || o.stage };
      }
      return o;
    }));
    this.save();
  }
  deletePurchaseOrder(id: number) {
    this.purchaseOrders.update(v => v.filter(o => o.internalId !== id));
    this.save();
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
    localStorage.setItem('sga_inventory', JSON.stringify(this.inventory()));
    localStorage.setItem('sga_reservations', JSON.stringify(this.reservations()));
    localStorage.setItem('sga_purchase', JSON.stringify(this.purchaseOrders()));
    localStorage.setItem('sga_maintenance', JSON.stringify(this.maintenanceTasks()));
    localStorage.setItem('sga_notifications', JSON.stringify(this.notifications()));
    localStorage.setItem('sga_token', this.token() || '');
  }

  private loadFromStorage() {
    const i = localStorage.getItem('sga_inventory'); if (i) this.inventory.set(JSON.parse(i));
    const r = localStorage.getItem('sga_reservations'); if (r) this.reservations.set(JSON.parse(r));
    const p = localStorage.getItem('sga_purchase'); if (p) this.purchaseOrders.set(JSON.parse(p));
    const m = localStorage.getItem('sga_maintenance'); if (m) this.maintenanceTasks.set(JSON.parse(m));
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
}