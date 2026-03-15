import { Component, inject, computed, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import Chart from 'chart.js/auto';
declare var Swal: any;

/**
 * Componente del Panel de Control (Dashboard).
 * Proporciona una visión general del estado del sistema, incluyendo estadísticas de inventario,
 * alertas de stock crítico, solicitudes de reserva pendientes y préstamos activos.
 * Solo accesible para administradores y superusuarios.
 */
@Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div class="animate-fadeIn pb-10">
      
      <!-- Tarjetas de Acción Rápida (Estadísticas) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Total Inventario -->
          <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group border border-white/10">
              <div class="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110 blur-xl"></div>
              <div class="relative z-10">
                  <div class="text-blue-100 font-bold text-xs uppercase tracking-wider mb-2">Total Inventario</div>
                  <div class="text-4xl font-black tracking-tight">{{ data.inventory().length }}</div>
                  <div class="mt-2 text-xs text-blue-100 bg-white/20 inline-block px-2 py-1 rounded-lg">Items registrados</div>
              </div>
              <i class="bi bi-box-seam absolute bottom-4 right-4 text-6xl text-white/10"></i>
          </div>

          <!-- Solicitudes Pendientes -->
          <div class="glass-panel bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
              <div class="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-bl-full transition-transform group-hover:scale-110"></div>
              <div class="relative z-10">
                  <div class="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">Solicitudes Pendientes</div>
                  <div class="text-4xl font-black text-gray-800 dark:text-white tracking-tight">{{ pendingReservations().length }}</div>
                  <div class="mt-2 text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1">
                      <i class="bi bi-clock-history"></i> Requieren acción
                  </div>
              </div>
          </div>

          <!-- Préstamos Activos -->
          <div class="glass-panel bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
               <div class="absolute right-0 top-0 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-bl-full transition-transform group-hover:scale-110"></div>
               <div class="relative z-10">
                  <div class="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">Préstamos Activos</div>
                  <div class="text-4xl font-black text-gray-800 dark:text-white tracking-tight">{{ activeReservations().length }}</div>
                   <div class="mt-2 text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                      <i class="bi bi-person-check"></i> En uso ahora
                  </div>
               </div>
          </div>

          <!-- Stock Crítico -->
          <div class="glass-panel bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
               <div class="absolute right-0 top-0 w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-bl-full transition-transform group-hover:scale-110"></div>
               <div class="relative z-10">
                  <div class="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">Stock Crítico</div>
                  <div class="text-4xl font-black text-gray-800 dark:text-white tracking-tight">{{ criticalStock().length }}</div>
                   <div class="mt-2 text-xs text-red-500 dark:text-red-400 font-bold flex items-center gap-1">
                      <i class="bi bi-exclamation-triangle"></i> Reponer
                  </div>
               </div>
          </div>
      </div>

      <!-- Gráficos de Análisis -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         <!-- Gráfico de Composición de Inventario -->
         <div class="glass-panel bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/50 dark:border-gray-700 flex flex-col h-[400px]">
             <div class="flex justify-between items-center mb-4">
                 <h4 class="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <span class="w-2 h-6 bg-uah-blue rounded-full"></span>
                    Composición del Inventario
                 </h4>
             </div>
             <div class="relative w-full flex-1">
                <canvas id="inventoryChart"></canvas>
             </div>
         </div>

         <!-- Gráfico de Análisis de Consultas -->
         <div class="glass-panel bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/50 dark:border-gray-700 flex flex-col h-[400px]">
             <div class="flex justify-between items-center mb-4">
                 <h4 class="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <span class="w-2 h-6 bg-purple-500 rounded-full"></span>
                    Análisis de Consultas
                 </h4>
                 <div class="text-xs text-gray-500 dark:text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    Total: {{ data.supportTickets().length }}
                 </div>
             </div>
             <div class="relative w-full flex-1">
                <canvas id="ticketsChart"></canvas>
             </div>
         </div>
      </div>
      
      <!-- Sección de Alertas Críticas de Stock -->
      <div class="mb-10 lg:grid lg:grid-cols-3 lg:gap-8">
         <!-- Alertas de Stock -->
         <div class="lg:col-span-2 mb-8 lg:mb-0">
            <div class="glass-panel bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-lg border border-white/50 dark:border-gray-700 overflow-hidden flex flex-col h-[350px]">
               <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-red-50/50 dark:bg-red-900/10 flex justify-between items-center">
                    <h4 class="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 text-red-600 dark:text-red-400">
                      <i class="bi bi-bell-fill animate-swing"></i> Alertas de Stock
                   </h4>
               </div>
               
               <div class="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
                  @if (criticalStock().length === 0) {
                     <div class="col-span-full h-full flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400 opacity-60">
                        <i class="bi bi-check-circle-fill text-6xl mb-4"></i>
                        <span class="text-sm font-bold uppercase tracking-widest">Sin alertas pendientes</span>
                     </div>
                  }
                  @for (item of criticalStock(); track item.id) {
                     <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500 group-hover:w-1.5 transition-all"></div>
                        <div class="flex justify-between items-start mb-1">
                           <span class="font-bold text-gray-800 dark:text-gray-200 text-sm truncate pr-2">{{ item.marca }}</span>
                           <span class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wide">Bajo Stock</span>
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">{{ item.categoria }} • {{ item.subCategoria }}</div>
                        
                        <div class="flex items-center gap-2">
                           <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                               <div class="bg-red-500 h-full rounded-full relative overflow-hidden" [style.width.%]="(item.stockActual/item.stockMinimo)*100">
                                   <div class="absolute inset-0 bg-white/30 w-full animate-[shimmer_1s_infinite]"></div>
                               </div>
                           </div>
                           <span class="text-xs font-bold text-gray-700 dark:text-gray-300 w-12 text-right">{{ item.stockActual }} / {{ item.stockMinimo }}</span>
                        </div>
                     </div>
                  }
               </div>
            </div>
         </div>

         <!-- Widget de Tareas Admin (To-Do) -->
         <div class="lg:col-span-1">
            <div class="glass-panel bg-uah-blue dark:bg-slate-900 rounded-3xl shadow-xl border border-blue-400/20 overflow-hidden flex flex-col h-[350px]">
               <div class="p-5 border-b border-blue-800 dark:border-gray-800 flex justify-between items-center bg-blue-700/30">
                  <h4 class="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                     <i class="bi bi-list-task"></i> Tareas Administrativas
                  </h4>
                  <span class="bg-yellow-400 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{{ pendingAdminTasks().length }}</span>
               </div>
               
               <!-- Add Task Input -->
               <div class="p-4 bg-blue-950/20">
                  <div class="relative">
                     <input #taskInput type="text" (keyup.enter)="addAdminTask(taskInput)" placeholder="Nueva tarea pendiente..." class="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-4 text-sm text-white placeholder-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all">
                     <button (click)="addAdminTask(taskInput)" class="absolute right-2 top-1.5 text-yellow-400 hover:text-white transition-colors">
                        <i class="bi bi-plus-circle-fill text-xl"></i>
                     </button>
                  </div>
               </div>

               <div class="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                  @for (task of data.adminTasks(); track task.id) {
                     <div class="flex items-center gap-3 p-3 rounded-2xl transition-all group" [ngClass]="task.status === 'done' ? 'bg-white/5 opacity-50' : 'bg-white/10 hover:bg-white/15'">
                        <button (click)="toggleAdminTask(task)" class="w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all" [ngClass]="task.status === 'done' ? 'bg-yellow-400 border-yellow-400 text-blue-900Scale' : 'border-white/30 text-transparent'">
                           <i class="bi bi-check-bold text-xs"></i>
                        </button>
                        <span class="text-sm font-medium text-white flex-1 leading-snug" [ngClass]="{'line-through text-white/50': task.status === 'done'}">{{ task.description }}</span>
                        <button (click)="deleteAdminTask(task.id)" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 transition-all">
                           <i class="bi bi-trash3-fill"></i>
                        </button>
                     </div>
                  }
                  @if (data.adminTasks().length === 0) {
                     <div class="h-full flex flex-col items-center justify-center text-white/30 py-8">
                        <i class="bi bi-journal-check text-4xl mb-2"></i>
                        <span class="text-xs font-bold uppercase">Sin tareas pendientes</span>
                     </div>
                  }
               </div>
            </div>
         </div>
      </div>

      <!-- Métricas Avanzadas: Presupuesto y Finanzas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div class="md:col-span-1 glass-panel p-6 rounded-3xl bg-gradient-to-br from-uah-blue to-blue-800 text-white shadow-lg relative overflow-hidden">
            <div class="absolute -right-6 -bottom-6 opacity-10 rotate-12">
               <i class="bi bi-currency-dollar text-9xl"></i>
            </div>
            <div class="relative z-10">
               <h4 class="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Presupuesto Total Lab</h4>
               <div class="text-3xl font-black mb-4">$ {{ totalBudget() | number }}</div>
               <div class="flex justify-between items-center text-[10px] font-bold">
                  <span class="text-blue-200 uppercase">Utilizado: {{ (totalSpent() / totalBudget() * 100) | number:'1.0-1' }}%</span>
                  <span class="bg-yellow-400 text-blue-900 px-2 py-0.5 rounded-full">$ {{ totalRemaining() | number }} Libre</span>
               </div>
               <div class="w-full bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
                  <div class="bg-yellow-400 h-full rounded-full" [style.width.%]="(totalSpent() / totalBudget() * 100)"></div>
               </div>
            </div>
         </div>

         <div class="md:col-span-3 glass-panel p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-4">
               <h4 class="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Desglose de Gasto por Laboratorio</h4>
               <div class="text-[10px] font-bold text-gray-400 uppercase">Calculado según O.C. Adjudicadas</div>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
               @for (lab of labsList; track lab) {
                  <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                     <div class="text-[10px] font-bold text-gray-500 uppercase mb-1">{{ lab }}</div>
                     <div class="text-sm font-black text-uah-blue dark:text-blue-400">$ {{ budgetByLab(lab) | number }}</div>
                     <div class="mt-2 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full bg-uah-blue" [style.width.%]="(budgetByLab(lab) / (data.labBudgets()[lab] || 1)) * 100"></div>
                     </div>
                  </div>
               }
            </div>
         </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <!-- Solicitudes Pendientes de Aprobación -->
          <div class="glass-panel bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
             <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                        <i class="bi bi-hourglass-split text-lg"></i>
                    </div>
                    <div>
                        <h5 class="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wide">Solicitudes Pendientes</h5>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Requieren aprobación</p>
                    </div>
                </div>
                <span class="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full">{{ pendingReservations().length }}</span>
             </div>
             
             <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                   <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                         <th class="p-4 pl-6">Solicitante</th>
                         <th class="p-4">Recurso</th>
                         <th class="p-4">Bloque</th>
                         <th class="p-4 text-center">Acciones</th>
                      </tr>
                   </thead>
                   <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
                      @for (res of pendingReservations(); track res.id) {
                         <tr class="hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors">
                            <td class="p-4 pl-6">
                               <div class="flex items-center gap-3">
                                   <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                       {{ res.nombreSolicitante.charAt(0) }}
                                   </div>
                                   <div>
                                       <div class="font-bold text-gray-800 dark:text-gray-200 text-xs">{{ res.nombreSolicitante }}</div>
                                       <div class="text-[10px] text-gray-400 uppercase font-bold">{{ res.tipoUsuario }}</div>
                                   </div>
                               </div>
                            </td>
                            <td class="p-4">
                                @let item = getItem(res.equipoId);
                                <div class="font-bold text-uah-blue dark:text-blue-400 text-xs">{{ item?.marca || 'Desconocido' }}</div>
                                <div class="flex items-center gap-1 mt-0.5">
                                    <span class="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">{{ item?.subCategoria }}</span>
                                    <span class="text-[10px] font-bold text-gray-400">x{{ res.cantidad }}</span>
                                </div>
                            </td>
                            <td class="p-4">
                               <div class="text-xs font-bold text-gray-600 dark:text-gray-300">{{ res.fecha }}</div>
                               <div class="text-[10px] text-gray-400">{{ res.bloque }}</div>
                            </td>
                            <td class="p-4 text-center">
                               <div class="flex items-center justify-center gap-2">
                                   <button (click)="approve(res.id)" class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:scale-110 transition-all flex items-center justify-center shadow-sm" title="Aprobar">
                                       <i class="bi bi-check-lg"></i>
                                   </button>
                                   <button (click)="reject(res.id)" class="w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:scale-110 transition-all flex items-center justify-center shadow-sm" title="Rechazar">
                                       <i class="bi bi-x-lg"></i>
                                   </button>
                               </div>
                            </td>
                         </tr>
                      }
                      @if (pendingReservations().length === 0) {
                         <tr><td colspan="4" class="p-8 text-center text-gray-400 text-xs font-medium italic">No hay solicitudes pendientes.</td></tr>
                      }
                   </tbody>
                </table>
             </div>
          </div>

          <!-- Préstamos Activos (En uso) -->
          <div class="glass-panel bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
             <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                        <i class="bi bi-box-arrow-right text-lg"></i>
                    </div>
                    <div>
                        <h5 class="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wide">Préstamos Activos</h5>
                        <p class="text-xs text-gray-500 dark:text-gray-400">En posesión de usuarios</p>
                    </div>
                </div>
                <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full">{{ activeReservations().length }}</span>
             </div>

             <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                   <thead class="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                         <th class="p-4 pl-6">Responsable</th>
                         <th class="p-4">Item</th>
                         <th class="p-4">Vencimiento</th>
                         <th class="p-4 text-center">Devolución</th>
                      </tr>
                   </thead>
                   <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
                      @for (res of activeReservations(); track res.id) {
                         <tr class="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                            <td class="p-4 pl-6">
                                <div class="font-bold text-gray-700 dark:text-gray-200 text-xs">{{ res.nombreSolicitante }}</div>
                                <div class="text-[10px] text-gray-400">{{ res.emailSolicitante }}</div>
                            </td>
                            <td class="p-4">
                                @let item = getItem(res.equipoId);
                                <div class="font-bold text-uah-blue dark:text-blue-400 text-xs">{{ item?.marca }}</div>
                                <div class="text-[10px] text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 inline-block px-1 rounded mt-1">{{ item?.sn || 'N/A' }}</div>
                            </td>
                            <td class="p-4">
                               <div class="flex items-center gap-2">
                                   <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                   <div>
                                       <div class="font-bold text-gray-700 dark:text-gray-200 text-xs">{{ res.bloque }}</div>
                                       <div class="text-[10px] text-gray-400">{{ res.fecha }}</div>
                                   </div>
                               </div>
                            </td>
                            <td class="p-4 text-center">
                               <button (click)="returnItem(res)" class="text-xs font-bold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-uah-gold hover:text-uah-blue hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-2 mx-auto">
                                  <i class="bi bi-box-arrow-in-left"></i> Recibir
                               </button>
                            </td>
                         </tr>
                      }
                      @if (activeReservations().length === 0) {
                          <tr><td colspan="4" class="p-8 text-center text-gray-400 text-xs font-medium italic">No hay préstamos activos.</td></tr>
                      }
                   </tbody>
                </table>
             </div>
          </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
   data = inject(DataService);
   router = inject(Router);

   // Solicitudes que aún no han sido aprobadas ni rechazadas
   pendingReservations = computed(() => this.data.reservations().filter(r => !r.aprobada && !r.rechazada));

   // Préstamos que ya han sido aprobados
   activeReservations = computed(() => this.data.reservations().filter(r => r.aprobada && !r.rechazada));

   // Items cuyo stock actual es menor o igual al stock mínimo definido
   criticalStock = computed(() => this.data.inventory().filter(i => i.stockActual <= i.stockMinimo));

   labsList = ['FABLAB', 'QUIMICA', 'FISICA', 'INFORMATICA'];

   // Lógica de Tareas Admin
   pendingAdminTasks = computed(() => this.data.adminTasks().filter(t => t.status === 'pending'));

   // Lógica de Presupuesto Real basado en O.C. Adjudicadas
   budgetByLab(lab: string) {
      return this.data.purchaseOrders()
         .filter(o => o.lab === lab && (o.stage === 'Adjudicacion' || o.stage === 'Cierre' || o.stage === 'Seguimiento'))
         .reduce((acc, current) => acc + current.valorTotal, 0);
   }

   totalBudget = computed(() => Object.values(this.data.labBudgets()).reduce((a, b) => a + b, 0));
   totalSpent = computed(() => this.data.purchaseOrders()
      .filter(o => o.stage !== 'Solicitud')
      .reduce((acc, curr) => acc + curr.valorTotal, 0));
   totalRemaining = computed(() => this.totalBudget() - this.totalSpent());

   async addAdminTask(input: HTMLInputElement) {
      if (!input.value.trim()) return;
      await this.data.addAdminTask({
         description: input.value,
         status: 'pending',
         priority: 'Media'
      });
      input.value = '';
   }

   async toggleAdminTask(task: any) {
      const newStatus = task.status === 'pending' ? 'done' : 'pending';
      await this.data.updateAdminTask(task.id, { status: newStatus });
   }

   async deleteAdminTask(id: number) {
      const result = await Swal.fire({
         title: '¿Eliminar tarea?',
         icon: 'warning',
         showCancelButton: true,
         confirmButtonColor: '#ef4444',
         confirmButtonText: 'Sí, eliminar'
      });
      if (result.isConfirmed) {
         await this.data.deleteAdminTask(id);
      }
   }

   /**
    * Obtiene un item del inventario por su ID.
    */
   getItem(id: number) { return this.data.inventory().find(i => i.id === id); }

   ngOnInit() {
      // Control de acceso: Solo Admins o SuperUsers pueden ver el Dashboard
      const role = this.data.currentUser()?.rol;
      if (role !== 'Admin' && role !== 'SuperUser') {
         this.router.navigate(['/areas']);
         return;
      }

      // Inicialización de gráficos con un pequeño retraso para asegurar que el DOM esté listo
      setTimeout(() => this.initCharts(), 500);
   }

   /**
    * Inicializa todos los gráficos del dashboard.
    */
   initCharts() {
      this.initInventoryChart();
      this.initTicketsChart();
   }

   /**
    * Inicializa el gráfico de composición de inventario por laboratorio.
    */
   initInventoryChart() {
      const ctx = document.getElementById('inventoryChart') as HTMLCanvasElement;
      if (!ctx) return;

      const labs = ['FABLAB', 'CIENCIAS', 'INFORMATICA'];
      const dataCounts = labs.map(l => this.data.inventory().filter(i => i.categoria.includes(l)).length);

      new Chart(ctx, {
         type: 'doughnut',
         data: {
            labels: labs,
            datasets: [{
               data: dataCounts,
               backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
               borderWidth: 0,
               hoverOffset: 10
            }]
         },
         options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
               legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 11 } } }
            }
         }
      });
   }

   /**
    * Inicializa el gráfico de estado de las consultas de soporte.
    */
   initTicketsChart() {
      const ctx = document.getElementById('ticketsChart') as HTMLCanvasElement;
      if (!ctx) return;

      const open = this.data.supportTickets().filter(t => t.status === 'Open').length;
      const closed = this.data.supportTickets().filter(t => t.status === 'Closed').length;

      new Chart(ctx, {
         type: 'bar',
         data: {
            labels: ['Abiertos', 'Cerrados'],
            datasets: [{
               label: 'Estado de Consultas',
               data: [open, closed],
               backgroundColor: ['#8b5cf6', '#9ca3af'],
               borderRadius: 6,
               barThickness: 40
            }]
         },
         options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
               y: { beginAtZero: true, border: { dash: [5, 5] }, grid: { color: '#f3f4f6' } },
               x: { grid: { display: false } }
            }
         }
      });
   }

   /**
    * Aprueba una solicitud de reserva.
    */
   approve(id: number) {
      Swal.fire({ title: '¿Aprobar solicitud?', icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981', cancelButtonText: 'Cancelar' }).then((r: any) => {
         if (r.isConfirmed) this.data.updateReservationStatus(id, 'approve');
      });
   }

   /**
    * Rechaza una solicitud de reserva pidiendo un motivo.
    */
   reject(id: number) {
      Swal.fire({ input: 'text', title: 'Motivo de Rechazo', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonText: 'Cancelar', placeholder: 'Escriba el motivo aquí...' }).then((r: any) => {
         if (r.isConfirmed) this.data.updateReservationStatus(id, 'reject', { motivo: r.value });
      });
   }

   /**
    * Registra la devolución de un item prestado.
    */
   returnItem(res: any) {
      this.data.updateReservationStatus(res.id, 'return', { devuelto: res.cantidad });
      Swal.fire({ icon: 'success', title: 'Devolución Exitosa', text: 'El inventario ha sido actualizado correctamente.', timer: 1500, showConfirmButton: false });
   }
}
