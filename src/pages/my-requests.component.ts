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
                  <i class="bi bi-clipboard2-check"></i> Mis Solicitudes
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Historial de préstamos y estado de reservas.</p>
          </div>
          <div class="flex items-center gap-3 mt-4 md:mt-0">
             <div class="relative">
                 <i class="bi bi-search absolute left-3 top-2.5 text-gray-400"></i>
                 <input [(ngModel)]="searchTerm" class="pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-uah-blue dark:text-white" placeholder="Buscar solicitud...">
             </div>
             <a routerLink="/areas" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                <i class="bi bi-arrow-left"></i> Volver
             </a>
          </div>
      </div>

      <div class="glass-panel rounded-3xl p-8 shadow-xl border border-white/40 dark:border-gray-700">
        
        <!-- Active Requests Section -->
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <i class="bi bi-clock-history"></i> En Curso
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
                       <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{{ req.fecha }}</span>
                          <span>{{ req.bloque }}</span>
                          <span class="font-bold">Cant: {{ req.cantidad }}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div>
                    @if (req.aprobada) {
                       <span class="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-bold text-xs uppercase shadow-sm animate-pulse flex items-center gap-2">
                          <i class="bi bi-person-check-fill"></i> En Posesión
                       </span>
                    } @else {
                       <span class="px-4 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-bold text-xs uppercase shadow-sm flex items-center gap-2">
                          <i class="bi bi-hourglass-split"></i> Pendiente
                       </span>
                    }
                 </div>
              </div>
           }
           @if (filteredActiveRequests().length === 0) {
              <div class="text-center py-8 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 text-sm">
                  <i class="bi bi-inbox text-2xl block mb-1"></i>
                  No se encontraron solicitudes activas.
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
                       <h4 class="font-bold text-gray-700 dark:text-gray-200 text-sm">{{ item?.marca || 'Item Eliminado' }}</h4>
                       <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ req.fecha }} - {{ req.bloque }}</p>
                    </div>
                 </div>
                 
                 <div>
                    @if (req.rechazada && (req.motivoRechazo === 'Finalizado' || req.devuelto)) {
                       <span class="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold text-[10px] uppercase flex items-center gap-1">
                          <i class="bi bi-arrow-return-left"></i> Devuelto
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
  `
})
export class MyRequestsComponent {
  data = inject(DataService);
  searchTerm = signal('');
  
  allRequests = computed(() => {
     const email = this.data.currentUser()?.correo;
     const requests = this.data.reservations().filter(r => r.emailSolicitante === email).reverse();
     
     if (!this.searchTerm()) return requests;
     
     // Manual fuzzy search here because we need to join with Item Name
     const term = this.searchTerm().toLowerCase();
     return requests.filter(r => {
         const item = this.getItem(r.equipoId);
         const searchStr = `${item?.marca} ${r.bloque} ${r.fecha} ${r.motivoRechazo || ''}`.toLowerCase();
         return searchStr.includes(term);
     });
  });

  // Active: Not rejected AND (not approved yet OR approved but not returned)
  filteredActiveRequests = computed(() => this.allRequests().filter(r => !r.rechazada && !(r.aprobada && r.devuelto)));
  
  // History: Rejected OR (Approved and Returned)
  filteredHistoryRequests = computed(() => this.allRequests().filter(r => r.rechazada || (r.aprobada && r.devuelto)));

  getItem(id: number) { return this.data.inventory().find(i => i.id === id); }
}