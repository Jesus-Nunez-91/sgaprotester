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
    <div class="animate-fadeIn pb-16 space-y-8">
      
      <!-- Welcome Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-blue-900/5">
        <div>
          <h1 class="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
            Hola, <span class="text-uah-orange uppercase">{{ data.currentUser()?.nombreCompleto?.split(' ')[0] }}</span> 👋
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1">Aquí tienes un resumen de lo que está pasando hoy.</p>
        </div>
        <div class="flex gap-3">
           <div class="bg-white/80 dark:bg-slate-700/80 px-4 py-2 rounded-2xl shadow-sm border border-white/50 flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                 <i class="bi bi-calendar-check text-xl"></i>
              </div>
              <div class="text-left">
                 <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Fecha de hoy</div>
                 <div class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ today | date:'dd MMM, yyyy' }}</div>
              </div>
           </div>
        </div>
      </div>

      <!-- Main Action Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Inventory Card -->
          <div class="group relative overflow-hidden bg-uah-blue p-8 rounded-[2.5rem] text-white shadow-2xl hover:shadow-blue-900/40 transition-all duration-500 hover:-translate-y-2 border border-white/10">
            <div class="absolute -right-8 -top-8 w-40 h-40 bg-uah-orange rounded-full blur-[80px] opacity-20 group-hover:scale-110 transition-transform"></div>
            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-md">
                <i class="bi bi-box-seam text-2xl"></i>
              </div>
              <div class="text-blue-100/70 font-bold text-xs uppercase tracking-[0.2em] mb-1">Inventario Total</div>
              <div class="text-5xl font-black tracking-tighter">{{ data.inventory().length }}</div>
              <div class="mt-4 flex items-center gap-2 text-xs font-bold text-blue-200/80">
                <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Sincronizado en línea
              </div>
            </div>
          </div>

          <!-- Pending Requests -->
          <div class="group relative overflow-hidden bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-2">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 dark:bg-amber-900/20 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
                <i class="bi bi-send-check text-2xl"></i>
              </div>
              <div class="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mb-1">Pendientes</div>
              <div class="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{{ pendingReservations().length }}</div>
              <div class="mt-4 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <i class="bi bi-arrow-right-circle"></i>
                Gestionar ahora
              </div>
            </div>
          </div>

          <!-- Active Loans -->
          <div class="group relative overflow-hidden bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-2">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <i class="bi bi-person-check text-2xl"></i>
              </div>
              <div class="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mb-1">Activos</div>
              <div class="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{{ activeReservations().length }}</div>
              <div class="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <i class="bi bi-check2-circle"></i>
                En posesión
              </div>
            </div>
          </div>

          <!-- Low Stock -->
          <div class="group relative overflow-hidden bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-rose-500/10 transition-all duration-500 hover:-translate-y-2">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
                <i class="bi bi-lightning-charge text-2xl"></i>
              </div>
              <div class="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mb-1">Criticos</div>
              <div class="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{{ criticalStock().length }}</div>
              <div class="mt-4 flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                <i class="bi bi-exclamation-triangle"></i>
                Requieren recompra
              </div>
            </div>
          </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Left Column: Activity & Storage -->
          <div class="lg:col-span-8 space-y-8">
              <!-- Charts Section -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700">
                      <h4 class="text-sm font-black text-uah-blue dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span class="w-1.5 h-6 bg-uah-orange rounded-full"></span>
                        Composición
                      </h4>
                      <div class="h-64 relative">
                        <canvas id="inventoryChart"></canvas>
                      </div>
                  </div>
                  <div class="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700">
                      <h4 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span class="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                        Soporte
                      </h4>
                      <div class="h-64 relative">
                        <canvas id="ticketsChart"></canvas>
                      </div>
                  </div>
              </div>

              <!-- Pending Requests Table -->
              <div class="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div class="p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                      <h4 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                         <span class="w-12 h-12 rounded-2xl bg-uah-orange/10 flex items-center justify-center text-uah-orange">
                           <i class="bi bi-collection"></i>
                         </span>
                        Solicitudes por Aprobar
                      </h4>
                      <span class="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full">{{ pendingReservations().length }} PENDIENTES</span>
                  </div>
                  <div class="overflow-x-auto min-h-[300px]">
                      <table class="w-full text-left">
                          <thead>
                              <tr class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                  <th class="p-8 pl-10">Solicitante</th>
                                  <th class="p-8">Recurso</th>
                                  <th class="p-8">Bloque</th>
                                  <th class="p-8 text-center px-10">Acciones</th>
                              </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-50 dark:divide-slate-700">
                              @for (res of pendingReservations(); track res.id) {
                                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                      <td class="p-6 pl-10">
                                          <div class="flex items-center gap-4">
                                              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center font-black text-slate-500 group-hover:scale-110 transition-transform">
                                                  {{ res.nombreSolicitante.charAt(0) }}
                                              </div>
                                              <div>
                                                  <div class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ res.nombreSolicitante }}</div>
                                                  <div class="text-[10px] font-black text-slate-400 uppercase">{{ res.tipoUsuario }}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td class="p-6">
                                          @let item = getItem(res.equipoId);
                                          <div class="text-sm font-bold text-uah-blue dark:text-blue-400">{{ item?.marca }}</div>
                                          <div class="text-[10px] font-bold text-slate-400 uppercase">{{ item?.subCategoria }} x{{ res.cantidad }}</div>
                                      </td>
                                      <td class="p-6">
                                          <div class="text-xs font-black text-slate-700 dark:text-slate-200">{{ res.fecha }}</div>
                                          <div class="text-[10px] font-bold text-slate-400 uppercase">{{ res.bloque }}</div>
                                      </td>
                                      <td class="p-6 text-center px-10">
                                          <div class="flex items-center justify-center gap-3">
                                              <button (click)="approve(res.id)" class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-lg border border-emerald-100 dark:border-emerald-800">
                                                  <i class="bi bi-check-lg text-xl"></i>
                                              </button>
                                              <button (click)="reject(res.id)" class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-lg border border-rose-100 dark:border-rose-800">
                                                  <i class="bi bi-x-lg text-xl"></i>
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              }
                              @if (pendingReservations().length === 0) {
                                  <tr><td colspan="4" class="p-20 text-center opacity-40">
                                      <i class="bi bi-journal-check text-6xl mb-4 block"></i>
                                      <p class="font-black text-xs uppercase tracking-widest text-slate-400">Totalmente al día</p>
                                  </td></tr>
                              }
                          </tbody>
                      </table>
                  </div>
              </div>

              <!-- Control de Acceso (Check-in / Check-out) -->
              <div class="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden mb-8">
                  <div class="p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                      <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                           <i class="bi bi-door-open-fill text-uah-orange"></i> Control de Acceso (Dashboard en Vivo)
                      </h3>
                      <span class="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg uppercase">Usuarios en Lab: {{ activeInLab().length }}</span>
                  </div>
                  <div class="overflow-x-auto">
                      <table class="w-full text-left">
                          <thead class="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                              <tr>
                                  <th class="p-6 pl-10">Usuario</th>
                                  <th class="p-6">Estado</th>
                                  <th class="p-6 text-center px-10">Acción de Registro</th>
                              </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-50 dark:divide-slate-700">
                              @for (res of activeReservations(); track res.id) {
                                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                      <td class="p-4 pl-10">
                                          <div class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ res.nombreSolicitante }}</div>
                                          <div class="text-[10px] font-bold text-slate-400 uppercase italic">{{ getItem(res.equipoId)?.marca }} - {{ res.bloque }}</div>
                                      </td>
                                      <td class="p-4">
                                          @if (res.clockOut) {
                                              <span class="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">Finalizado</span>
                                          } @else if (res.clockIn) {
                                              <span class="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase">En Laboratorio</span>
                                          } @else {
                                              <span class="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full uppercase">Pendiente Ingreso</span>
                                          }
                                      </td>
                                      <td class="p-4 text-center px-10">
                                          @if (!res.clockIn) {
                                              <button (click)="checkIn(res.id)" class="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black py-2 px-4 rounded-xl transition-all shadow-md">
                                                  REGISTRAR ENTRADA
                                              </button>
                                          } @else if (!res.clockOut) {
                                              <button (click)="checkOut(res.id)" class="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black py-2 px-4 rounded-xl transition-all shadow-md">
                                                  REGISTRAR SALIDA
                                              </button>
                                          } @else {
                                              <div class="text-[10px] font-bold text-slate-400">
                                                 {{ res.clockIn | date:'HH:mm' }} - {{ res.clockOut | date:'HH:mm' }}
                                              </div>
                                          }
                                      </td>
                                  </tr>
                              }
                          </tbody>
                      </table>
                  </div>
              </div>

          <!-- Right Column: Widgets -->
          <div class="lg:col-span-4 space-y-8">
              <!-- Audit Logs: Recent Activity -->
              <div class="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-[600px]">
                  <div class="p-8 border-b border-slate-50 dark:border-slate-700">
                      <h4 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                         <i class="bi bi-activity text-uah-orange"></i> Actividad del Sistema
                      </h4>
                  </div>
                  <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
                      @for (log of data.auditLogs().slice(0, 15); track log.id) {
                          <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                              <div class="flex justify-between items-start mb-2">
                                  <div class="text-[10px] font-black text-slate-400 uppercase">{{ log.fecha | date:'HH:mm • dd/MM' }}</div>
                                  <span [class]="log.accion.includes('FAIL') ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'" 
                                        class="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                     {{ log.accion }}
                                  </span>
                              </div>
                              <div class="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight">{{ log.detalle }}</div>
                              <div class="flex items-center gap-2 mt-2">
                                  <div class="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[9px] font-black">{{ log.nombre.charAt(0) }}</div>
                                  <span class="text-[10px] text-slate-500 truncate">{{ log.nombre }}</span>
                              </div>
                          </div>
                      }
                      @if (data.auditLogs().length === 0) {
                          <div class="h-full flex flex-col items-center justify-center opacity-30 text-center p-10">
                              <i class="bi bi-search text-4xl mb-3"></i>
                              <p class="text-[10px] font-black uppercase tracking-widest">Esperando actividad...</p>
                          </div>
                      }
                  </div>
                  <div class="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 text-center">
                      <a routerLink="/audit" class="text-[10px] font-black text-uah-blue uppercase tracking-widest hover:underline">Ver Reporte Completo</a>
                  </div>
              </div>

              <!-- Admin To-Do Quick Section -->
              <div class="bg-indigo-950 rounded-[2rem] shadow-2xl p-8 text-white relative overflow-hidden min-h-[400px]">
                 <div class="absolute -right-10 -bottom-10 opacity-10 rotate-12"><i class="bi bi-check-all text-[15rem]"></i></div>
                 <div class="relative z-10 h-full flex flex-col">
                    <h4 class="text-sm font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Recordatorios Rápidos</h4>
                    <div class="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
                        @for (task of data.adminTasks(); track task.id) {
                            <div class="group flex items-center gap-3 bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all border border-white/5">
                                <button (click)="toggleAdminTask(task)" 
                                        class="w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all"
                                         [class]="task.status === 'done' ? 'bg-uah-orange border-uah-orange text-white' : 'border-white/20 text-transparent'">
                                    <i class="bi bi-check-bold text-sm"></i>
                                </button>
                                <span class="text-xs font-bold flex-1" [class.line-through]="task.status === 'done'" [class.opacity-40]="task.status === 'done'">{{ task.description }}</span>
                                <button (click)="deleteAdminTask(task.id)" class="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 p-1">
                                   <i class="bi bi-trash-fill"></i>
                                </button>
                            </div>
                        }
                    </div>
                    <div class="relative">
                       <input #dashTaskInput (keyup.enter)="addAdminTask(dashTaskInput)" type="text" placeholder="Agregar tarea..." 
                              class="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-4 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all">
                        <button (click)="addAdminTask(dashTaskInput)" class="absolute right-3 top-2.5 text-uah-orange hover:scale-110 transition-transform">
                           <i class="bi bi-plus-circle-fill text-2xl"></i>
                        </button>
                    </div>
                 </div>
              </div>
          </div>
      </div>

      <!-- Financial Control Dashboard -->
      <div class="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-700">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-slate-50 dark:border-slate-700">
             <div>
                <h3 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Control Presupuestario</h3>
                <p class="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Gasto Real vs Presupuesto Asignado por Laboratorio</p>
             </div>
              <div class="bg-blue-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                 <div class="text-[10px] font-black text-uah-blue/60 uppercase tracking-widest mb-1">Total Consolidado</div>
                 <div class="text-3xl font-black text-uah-blue dark:text-blue-400 tracking-tighter">$ {{ totalSpent() | number }} <span class="text-sm font-bold opacity-30">/ $ {{ totalBudget() | number }}</span></div>
              </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
             @for (lab of labsList; track lab) {
                @let spent = budgetByLab(lab);
                @let budget = data.labBudgets()[lab] || 1;
                @let percent = (spent / budget) * 100;
                <div class="flex flex-col">
                   <div class="flex justify-between items-end mb-3">
                      <span class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{{ lab }}</span>
                      <span class="text-[10px] font-black px-2 py-0.5 rounded-lg" [class]="percent > 90 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'">{{ percent | number:'1.0-1' }}%</span>
                   </div>
                   <div class="group relative h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                       <div class="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
                            [style.width.%]="percent"
                            [class]="percent > 90 ? 'bg-rose-500' : 'bg-uah-blue'">
                       </div>
                      <div class="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                   </div>
                   <div class="flex justify-between text-[10px] font-black uppercase">
                      <span class="text-slate-400">Gasto: $ {{ spent | number }}</span>
                      <span class="text-slate-800 dark:text-slate-200">$ {{ budget - spent | number }} Disp.</span>
                   </div>
                </div>
             }
          </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
   data = inject(DataService);
   router = inject(Router);
   today = new Date();

   // Solicitudes que aún no han sido aprobadas ni rechazadas
   pendingReservations = computed(() => this.data.reservations().filter(r => !r.aprobada && !r.rechazada));

   // Préstamos que ya han sido aprobados
   activeReservations = computed(() => this.data.reservations().filter(r => r.aprobada && !r.rechazada));

   // Usuarios que han hecho check-in pero no check-out
   activeInLab = computed(() => this.activeReservations().filter(r => r.clockIn && !r.clockOut));

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

   async approve(id: number) {
      await this.data.updateReservationStatus(id, 'approve');
      Swal.fire({ icon: 'success', toast: true, position: 'top-end', title: 'Reserva Aprobada', timer: 1500, showConfirmButton: false });
   }

   async reject(id: number) {
      const result = await Swal.fire({
         title: 'Rechazar Reserva',
         input: 'text',
         inputPlaceholder: 'Motivo del rechazo...',
         showCancelButton: true,
         confirmButtonColor: '#ef4444'
      });
      if (result.isConfirmed) {
         await this.data.updateReservationStatus(id, 'reject', { motivo: result.value });
         Swal.fire({ icon: 'info', toast: true, position: 'top-end', title: 'Reserva Rechazada', timer: 1500, showConfirmButton: false });
      }
   }

   async checkIn(id: number) {
      await this.data.checkIn(id);
      Swal.fire({ icon: 'success', toast: true, position: 'top-end', title: 'Ingreso Registrado', timer: 1500, showConfirmButton: false });
   }

   async checkOut(id: number) {
      await this.data.checkOut(id);
      Swal.fire({ icon: 'success', toast: true, position: 'top-end', title: 'Salida Registrada', timer: 1500, showConfirmButton: false });
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
                backgroundColor: ['#003366', '#F37021', '#1e293b'],
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
                backgroundColor: ['#F37021', '#003366'],
                borderRadius: 8,
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
    * Registra la devolución de un item prestado.
    */
   returnItem(res: any) {
      this.data.updateReservationStatus(res.id, 'return', { devuelto: res.cantidad });
      Swal.fire({ icon: 'success', title: 'Devolución Exitosa', text: 'El inventario ha sido actualizado correctamente.', timer: 1500, showConfirmButton: false });
   }
}
