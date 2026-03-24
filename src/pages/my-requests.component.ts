import { Component, inject, computed, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
                 <input [(ngModel)]="searchTerm" class="pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-uah-blue dark:text-white" placeholder="Buscar solicitud...">
             </div>
             <a routerLink="/rooms" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                <i class="bi bi-arrow-left"></i> Volver a Salas
             </a>
          </div>
      </div>

      <div class="glass-panel rounded-3xl p-8 shadow-xl border border-white/40 dark:border-gray-700">
        
        <!-- Active Requests Section -->
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <i class="bi bi-clock-history"></i> {{ isRoomAdmin() ? 'Peticiones Pendientes & Activas' : 'En Curso' }}
        </h3>
        <div class="space-y-4 mb-10">
           @for (req of filteredActiveRequests(); track req.id) {
              <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex flex-col sm:flex-row justify-between items-center gap-4 transition-transform hover:scale-[1.01]">
                 <div class="flex items-center gap-4">
                    <div class="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl text-blue-500">
                       <i class="bi bi-box-seam"></i>
                    </div>
                    <div>
                       @let item = getItem(req.equipoId);
                       <h4 class="font-bold text-gray-800 dark:text-white text-lg">{{ item?.marca || 'Item Eliminado' }}</h4>
                       <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{{ req.fecha }}</span>
                          <span>{{ req.bloque }}</span>
                          <span class="font-bold">Cant: {{ req.cantidad }}</span>
                          @if (isRoomAdmin()) {
                             <span class="text-uah-blue font-bold px-2 border-l border-gray-300">{{ req.nombreSolicitante }}</span>
                             <span class="text-[10px] bg-blue-100 text-blue-700 px-2 rounded-full font-black uppercase">{{ req.tipoUsuario }}</span>
                          }
                       </div>
                    </div>
                 </div>
                 
                 <div class="flex flex-wrap gap-2">
                    @if (isRoomAdmin()) {
                        @if (!req.aprobada) {
                           <button (click)="data.updateReservationStatus(req.id, 'approve')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase shadow-md transition">Aprobar</button>
                           <button (click)="data.updateReservationStatus(req.id, 'reject')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase shadow-md transition">Rechazar</button>
                        } @else if (!req.devuelto) {
                           <button (click)="data.updateReservationStatus(req.id, 'approve', { devuelto: 1 })" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase shadow-md transition flex items-center gap-2" title="Marcar como entregado">
                             <i class="bi bi-arrow-return-left"></i> Devolución
                           </button>
                        }
                    }

                    @if (req.aprobada) {
                       <span class="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-bold text-[10px] uppercase shadow-sm flex items-center gap-2">
                          <i class="bi bi-person-check-fill"></i> Activa
                       </span>
                    } @else {
                       <span class="px-3 py-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-bold text-[10px] uppercase shadow-sm flex items-center gap-2">
                          <i class="bi bi-hourglass-split"></i> Pendiente
                       </span>
                    }
                 </div>
              </div>
           }
           @if (filteredActiveRequests().length === 0) {
              <div class="text-center py-8 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 text-sm">
                  <i class="bi bi-inbox text-2xl block mb-1"></i>
                  No se encontraron peticiones activas.
              </div>
           }
        </div>

        <!-- History Section -->
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <i class="bi bi-archive"></i> Historial & Devoluciones
        </h3>
        <div class="space-y-3">
           @for (req of filteredHistoryRequests(); track req.id) {
              <div class="bg-gray-50/80 dark:bg-gray-800/80 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                 <div class="flex items-center gap-4">
                    <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg text-gray-500 dark:text-gray-400">
                       <i class="bi bi-check2"></i>
                    </div>
                    <div>
                       @let item = getItem(req.equipoId);
                       <h4 class="font-bold text-gray-700 dark:text-gray-200 text-sm">
                          {{ item?.marca || 'Item Eliminado' }} 
                          @if (isRoomAdmin()) { <span class="text-uah-blue ml-2 opacity-70">({{ req.nombreSolicitante }})</span> }
                       </h4>
                       <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ req.fecha }} - {{ req.bloque }}</p>
                    </div>
                 </div>
                 
                 <div>
                    @if (req.rechazada && (req.motivoRechazo === 'Finalizado' || req.devuelto)) {
                       <span class="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold text-[10px] uppercase flex items-center gap-1">
                          <i class="bi bi-arrow-return-left"></i> Finalizado
                       </span>
                    } @else {
                       <div class="text-right">
                          <span class="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 font-bold text-[10px] uppercase flex items-center gap-1 justify-end">
                             <i class="bi bi-x-circle"></i> Rechazada
                          </span>
                          <div class="text-[10px] text-red-500 dark:text-red-400 mt-1 italic">{{ req.motivoRechazo || 'Sin motivo' }}</div>
                       </div>
                    }
                 </div>
              </div>
           }
           @if (filteredHistoryRequests().length === 0) {
              <div class="text-center py-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 text-xs">Historial vacío.</div>
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

  isRoomAdmin = computed(() => {
     const r = this.data.currentUser()?.rol;
     return r === 'Admin_Labs' || r === 'SuperUser';
  });
  
  allRequests = computed(() => {
     const user = this.data.currentUser();
     const requests = this.data.reservations();
     
     // Si es encargado de salas o superuser, ve todo. Sino, solo lo suyo.
     const list = this.isRoomAdmin() 
        ? requests.slice().reverse() 
        : requests.filter(r => r.emailSolicitante === user?.correo).reverse();
     
     if (!this.searchTerm()) return list;
     
     const term = this.searchTerm().toLowerCase();
     return list.filter(r => {
         const item = this.getItem(r.equipoId);
         const searchStr = `${item?.marca} ${r.nombreSolicitante} ${r.bloque} ${r.fecha} ${r.motivoRechazo || ''}`.toLowerCase();
         return searchStr.includes(term);
     });
  });

  // Active: Not rejected AND (not approved yet OR approved but not returned)
  filteredActiveRequests = computed(() => this.allRequests().filter(r => !r.rechazada && !(r.aprobada && r.devuelto)));
  
  // History: Rejected OR (Approved and Returned)
  filteredHistoryRequests = computed(() => this.allRequests().filter(r => r.rechazada || (r.aprobada && r.devuelto)));

  getItem(id: number) { return this.data.inventory().find(i => i.id === id); }
}