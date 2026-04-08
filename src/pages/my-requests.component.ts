import { Component, inject, computed, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare var Swal: any;

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto py-8 animate-fadeIn pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/80 dark:bg-gray-800/80 p-6 rounded-3xl shadow-lg border border-white/50 dark:border-gray-700 backdrop-blur-md">
          <div>
              <h2 class="text-3xl font-bold text-uah-blue dark:text-blue-400 flex items-center gap-3">
                  <i class="bi bi-clipboard2-check"></i> {{ isRoomAdmin() ? 'Gestión de Solicitudes' : 'Mis Solicitudes' }}
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
                 {{ isRoomAdmin() ? 'Centro de aprobación y seguimiento de reservas.' : 'Historial de préstamos y estado de reservas.' }}
              </p>
          </div>
          <div class="flex items-center gap-3 mt-4 md:mt-0">
             <div class="relative">
                 <i class="bi bi-search absolute left-3 top-2.5 text-gray-400"></i>
                 <input [(ngModel)]="searchTerm" (input)="onSearchChange($event)" class="pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-uah-blue dark:text-white" placeholder="Buscar solicitud...">
             </div>
             <a routerLink="/rooms" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                <i class="bi bi-arrow-left"></i> Volver a Salas
             </a>
          </div>
      </div>

      <div class="glass-panel rounded-3xl p-8 shadow-xl border border-white/40 dark:border-gray-700">
        
        <!-- Peticiones Pendientes -->
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <i class="bi bi-clock-history"></i> PANEL DE CONTROL: PENDIENTES
            </h3>
            @if (isSuperUser() && filteredActiveRequests().length > 0) {
              <button (click)="purgeGhosts()" class="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-tighter flex items-center gap-1 bg-red-50 px-3 py-1 rounded-lg border border-red-100 transition-all">
                 <i class="bi bi-stars"></i> Limpiar Registros Fantasma
              </button>
            }
        </div>
        <div class="space-y-4 mb-10">
           @for (req of filteredActiveRequests(); track req.id) {
              <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-[#f06427] flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
                 <div class="flex items-center gap-4 flex-1">
                    <div class="h-12 w-12 rounded-xl flex items-center justify-center text-xl shadow-inner" 
                         [ngClass]="req.tipoItem === 'SALA' ? 'bg-orange-50 text-[#f06427]' : 'bg-blue-50 text-blue-500'">
                       <i [class]="req.tipoItem === 'SALA' ? 'bi bi-door-open-fill' : 'bi bi-laptop-fill'"></i>
                    </div>
                    <div>
                       <div class="flex items-center gap-2 mb-1">
                          <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md" 
                                [ngClass]="req.tipoItem === 'SALA' ? 'bg-[#f06427]/10 text-[#f06427]' : 'bg-blue-100 text-blue-700'">
                             {{ req.tipoItem }}
                          </span>
                          <span class="text-xs font-bold text-gray-400">{{ req.fecha | date:'shortDate' }}</span>
                          @if (req.horario) {
                             <span class="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                <i class="bi bi-clock-fill"></i> {{ req.horario }}
                             </span>
                          }
                       </div>
                       <h4 class="font-black text-gray-800 dark:text-white text-lg leading-tight">{{ req.detalle || 'Solicitud sin descripción' }}</h4>
                       <p class="text-xs text-gray-500 font-bold uppercase tracking-tight mt-1">
                          <i class="bi bi-person-fill"></i> Solicitante: <span class="text-[#f06427]">{{ req.usuario || 'Desconocido' }}</span>
                       </p>
                    </div>
                 </div>
                 
                 <div class="flex gap-2">
                    <button (click)="approve(req)" class="bg-[#f06427] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-[#f06427]/20 transition-all flex items-center gap-2">
                       <i class="bi bi-check-circle-fill"></i> Aprobar
                    </button>
                    <button (click)="reject(req)" class="bg-white dark:bg-gray-700 border border-red-200 dark:border-red-900 text-red-500 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all hover:bg-red-50">
                       <i class="bi bi-x-circle-fill"></i> Rechazar
                    </button>
                    @if (isSuperUser()) {
                      <button (click)="purgeRecord(req)" class="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl shadow-lg transition-all" title="Eliminar registro fantasma">
                         <i class="bi bi-trash3-fill"></i>
                      </button>
                    }
                 </div>
              </div>
           }
           @if (filteredActiveRequests().length === 0) {
              <div class="text-center py-12 bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
                  <i class="bi bi-shield-check text-4xl block mb-2 opacity-20"></i>
                  <p class="text-[10px] font-black uppercase tracking-[0.2em]">Todo al día. No hay solicitudes pendientes.</p>
              </div>
           }
        </div>

        <!-- Historial Unificado -->
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <i class="bi bi-archive"></i> HISTORIAL DE ACCIONES (CAJA NEGRA)
        </h3>
        <div class="space-y-2">
           @for (req of filteredHistoryRequests(); track req.id) {
              <div class="bg-gray-50/80 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center opacity-70 hover:opacity-100 transition-all">
                 <div class="flex items-center gap-4 flex-1">
                    <i [class]="req.tipoItem === 'SALA' ? 'bi bi-door-open' : 'bi bi-box-seam'" 
                       [ngClass]="req.status === 'Aprobada' ? 'text-green-500' : 'text-red-500'"></i>
                    <div>
                       <h4 class="font-bold text-gray-700 dark:text-gray-200 text-xs">{{ req.detalle || 'Registro histórico' }}</h4>
                       <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{{ req.usuario }} • {{ req.status }}</p>
                    </div>
                 </div>
                 <div class="flex items-center gap-3">
                    <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full"
                          [ngClass]="req.status === 'Aprobada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                       {{ req.status }}
                    </span>
                    @if (isSuperUser()) {
                      <button (click)="purgeRecord(req)" class="text-gray-300 hover:text-red-500 transition-colors" title="Borrar registro permanentemente">
                        <i class="bi bi-trash3-fill"></i>
                      </button>
                    }
                 </div>
              </div>
           }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .glass-panel {
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(10px);
    }
    :host-context(.dark) .glass-panel {
      background: rgba(31, 41, 55, 0.4);
    }
  `]
})
export class MyRequestsComponent {
  data = inject(DataService);
  searchTerm = signal('');

  constructor() {
    this.data.fetchUnifiedRequests();
    this.data.fetchInventory(); // Para nombres de equipos
  }

  isRoomAdmin = computed(() => {
     const r = this.data.currentUser()?.rol;
     return r === 'Admin_Labs' || r === 'Admin_Acade' || r === 'SuperUser';
  });

  isSuperUser = computed(() => this.data.currentUser()?.rol === 'SuperUser');
  
  allRequests = computed(() => {
     const list = this.data.unifiedRequests().slice();
     if (!this.searchTerm()) return list;
     
     const term = this.searchTerm().toLowerCase();
     return list.filter(r => {
          const u = r.usuario || '';
          const d = r.detalle || '';
          const s = r.status || '';
          const t = r.tipoItem || '';
          const searchStr = `${u} ${t} ${d} ${s}`.toLowerCase();
          return searchStr.includes(term);
     });
  });

  // Pendientes: Las que están en estado 'Pendiente'
  filteredActiveRequests = computed(() => this.allRequests().filter(r => r.status === 'Pendiente'));
  
  // Historial: Ya aprobadas o rechazadas
  filteredHistoryRequests = computed(() => this.allRequests().filter(r => r.status !== 'Pendiente'));

  onSearchChange(event: any) {
    this.searchTerm.set(event.target.value);
  }

  /**
   * Helper robusto para extraer el ID real.
   * Blindado contra valores nulos y descripciones corruptas.
   */
  getSafeId(req: any): number {
    // 1. Prioridad: recId (Vínculo físico directo)
    if (req.recId && req.recId !== 'null' && req.recId !== 'undefined') {
       return parseInt(req.recId);
    }
    // 2. Fallback: Buscar el ID en el texto de "detalle" (Ej: "Reserva de sala 45")
    if (req.detalle) {
        const match = req.detalle.match(/\d+/);
        if (match) return parseInt(match[0]);
    }
    // 3. Last Resort: Si es Admin/Superuser y el registro es fantasma, devolver el ID del log (req.id)
    // para que al menos la purga funcione usando el ID de la tabla ProcurementRequest
    return req.id ? parseInt(req.id) : 0;
  }

  async approve(req: any) {
    const safeId = this.getSafeId(req);
    if (!safeId || (req.recId === null && !req.detalle?.includes('sala'))) {
       Swal.fire({
          icon: 'warning',
          title: 'Registro Incompleto',
          text: 'Esta solicitud no tiene un ID físico vinculado. Use "Eliminar" para limpiar registros fantasma.',
          confirmButtonColor: '#f06427'
       });
       return;
    }

    const isSala = req.tipoItem === 'SALA';
    const baseUrl = (window.hasOwnProperty('Capacitor')) ? 'http://10.10.0.20:3040' : '';
    const endpoint = isSala 
        ? `${baseUrl}/api/room-reservations/${safeId}/status`
        : `${baseUrl}/api/reservations/${safeId}`;
    
    try {
        const res = await fetch(endpoint, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.data.token()}` 
            },
            body: JSON.stringify({ estado: 'Aprobada', aprobada: true, rechazada: false })
        });

        if (res.ok) {
            this.data.fetchUnifiedRequests();
            Swal.fire({ icon: 'success', title: '¡Aprobado!', text: 'Solicitud aprobada con éxito.', timer: 1500, showConfirmButton: false });
        } else {
            const err = await res.json();
            Swal.fire('Error', err.message || 'Error al procesar la aprobación', 'error');
        }
    } catch (e) {
        console.error("Error al aprobar", e);
    }
  }

  async reject(req: any) {
    const safeId = this.getSafeId(req);
    if (!safeId) return;

    const isSala = req.tipoItem === 'SALA';
    const baseUrl = (window.hasOwnProperty('Capacitor')) ? 'http://10.10.0.20:3040' : '';
    const endpoint = isSala 
        ? `${baseUrl}/api/room-reservations/${safeId}/status`
        : `${baseUrl}/api/reservations/${safeId}`;

    try {
        const res = await fetch(endpoint, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.data.token()}` 
            },
            body: JSON.stringify({ estado: 'Rechazada', aprobada: false, rechazada: true, motivoRechazo: 'Cancelado por SuperUser' })
        });
        if (res.ok) {
            this.data.fetchUnifiedRequests();
            Swal.fire({ icon: 'info', title: 'Rechazado', text: 'Solicitud cancelada.', timer: 1500, showConfirmButton: false });
        }
    } catch (e) {
        console.error("Error al rechazar", e);
    }
  }

  /**
   * Operación de Purga: Borra físicamente el registro de la base de datos.
   * Vital para limpiar "registros fantasma" corruptos.
   */
  async purgeRecord(req: any) {
    const result = await Swal.fire({
      title: '¿Eliminar permanentemente?',
      text: "Esta acción borrará el registro de la base de datos (Caja Negra) y cualquier reserva vinculada. No se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, purgar registro',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const baseUrl = (window.hasOwnProperty('Capacitor')) ? 'http://10.10.0.20:3040' : '';
      const endpoint = `${baseUrl}/api/procurement-requests/${req.id}`;

      try {
        const res = await fetch(endpoint, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.data.token()}` }
        });

        if (res.ok) {
          this.data.fetchUnifiedRequests();
          Swal.fire('¡Purgado!', 'El registro ha sido eliminado del sistema.', 'success');
        } else {
          Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
        }
      } catch (e) {
        console.error("Error en purga", e);
      }
    }
  }

  async purgeGhosts() {
    const result = await Swal.fire({
      title: '¿Limpiar registros fantasma?',
      text: "Se eliminarán masivamente todas las solicitudes pendientes que sean 'Carga masiva' o 'Actualizaciones'. Esto despejará tu panel de control.",
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      confirmButtonText: 'Sí, limpiar panel',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const baseUrl = (window.hasOwnProperty('Capacitor')) ? 'http://10.10.0.20:3040' : '';
      const endpoint = `${baseUrl}/api/procurement-requests/mass/clear-ghosts`;
      
      try {
        const res = await fetch(endpoint, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.data.token()}` }
        });

        if (res.ok) {
          const data = await res.json();
          this.data.fetchUnifiedRequests();
          Swal.fire('¡Panel Limpio!', `Se han eliminado ${data.affected} registros correctamente.`, 'success');
        } else {
          Swal.fire('Error', 'No se pudo completar la limpieza masiva.', 'error');
        }
      } catch (e) {
        console.error("Error en purgeGhosts", e);
      }
    }
  }
}