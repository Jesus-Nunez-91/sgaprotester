import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

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
   imports: [CommonModule, RouterLink],
   template: `
      <!-- WELCOME HERO: Institutional Branding -->
      <div class="relative overflow-hidden bg-black p-12 rounded-[2.5rem] shadow-2xl border-b-8 border-[#f06427] group">
        <div class="absolute -right-32 -top-32 w-[600px] h-[600px] bg-[#f06427] rounded-full blur-[180px] opacity-10 group-hover:opacity-20 transition-all duration-1000"></div>
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div class="space-y-4">
             <div class="flex items-center gap-3 mb-2">
                <span class="px-4 py-1.5 bg-[#f06427]/10 text-[#f06427] text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[#f06427]/30">Portal Administrativo</span>
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Sistema Operativo</span>
             </div>
            <h1 class="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-none" style="font-family: 'Playfair Display', serif;">
              Hola, <span class="text-[#f06427]">{{ data.currentUser()?.nombreCompleto?.split(' ')[0] }}</span> 
            </h1>
            <p class="text-gray-400 font-medium text-lg max-w-2xl leading-relaxed">Gestión Integral de Laboratorios, Infraestructura e Inventario. <span class="text-white">Panel de Control General</span>.</p>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-6">
              <div class="bg-white/5 backdrop-blur-md px-10 py-6 rounded-3xl border border-white/10 flex items-center gap-6 group/item hover:bg-white/10 transition-all">
                 <div class="w-14 h-14 rounded-2xl bg-[#f06427] flex items-center justify-center text-white shadow-xl shadow-[#f06427]/20 group-hover/item:scale-110 transition-transform">
                    <i class="bi bi-cpu-fill text-3xl"></i>
                 </div>
                 <div class="text-left">
                    <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-70">En Laboratorio</div>
                    <div class="text-3xl font-black text-white tracking-tight">{{ activeInLab().length }} <span class="text-sm font-bold opacity-30 uppercase">Usuarios</span></div>
                 </div>
              </div>
          </div>
        </div>
      </div>


      <!-- MAIN METRICS GRID -->

      <!-- MAIN METRICS GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Metric Cards -->
          <div class="bg-white dark:bg-[#0f0f12] p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-white/5 group hover:border-[#f06427]/40 transition-all">
              <div class="flex justify-between items-center mb-8">
                  <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 group-hover:text-[#f06427] flex items-center justify-center text-2xl transition-colors">
                      <i class="bi bi-collection-fill"></i>
                  </div>
                  <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Equipamiento</span>
              </div>
              <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock Disponible</div>
              <div class="text-5xl font-black text-black dark:text-white tracking-tighter">{{ totalStockUnits() | number }}</div>
              <div class="text-[9px] font-bold text-[#f06427] mt-1">{{ data.inventory().length }} ITEMS DIFERENTES</div>
          </div>

          <div class="bg-white dark:bg-[#0f0f12] p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-white/5 group hover:border-[#f06427]/40 transition-all">
              <div class="flex justify-between items-center mb-8">
                  <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 group-hover:text-[#f06427] flex items-center justify-center text-2xl transition-colors">
                      <i class="bi bi-clock-history"></i>
                  </div>
                  <span class="text-[9px] font-black text-[#f06427] uppercase tracking-widest">Pendientes</span>
              </div>
              <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Por Aprobar</div>
              <div class="text-5xl font-black text-black dark:text-white tracking-tighter">{{ pendingReservations().length }}</div>
          </div>

          <div class="bg-white dark:bg-[#0f0f12] p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-white/5 group hover:border-[#f06427]/40 transition-all">
              <div class="flex justify-between items-center mb-8">
                  <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 group-hover:text-emerald-500 flex items-center justify-center text-2xl transition-colors">
                      <i class="bi bi-shield-fill-check"></i>
                  </div>
                  <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Activas</span>
              </div>
              <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">En Posesión</div>
              <div class="text-5xl font-black text-black dark:text-white tracking-tighter">{{ activeReservations().length }}</div>
          </div>

          <div class="bg-white dark:bg-[#0f0f12] p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-white/5 group hover:border-[#f06427]/40 transition-all">
              <div class="flex justify-between items-center mb-8">
                  <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 group-hover:text-rose-500 flex items-center justify-center text-2xl transition-colors">
                      <i class="bi bi-exclamation-octagon-fill"></i>
                  </div>
                  <span class="text-[9px] font-black text-rose-500 uppercase tracking-widest">Crítico</span>
              </div>
              <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sin Stock</div>
              <div class="text-5xl font-black text-black dark:text-white tracking-tighter">{{ criticalStock().length }}</div>
          </div>
      </div>

      <!-- OPERATIONAL CORE -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div class="lg:col-span-8 space-y-10">
              <!-- Pending Requests: Table Redesign -->
              <div class="bg-white dark:bg-[#0f0f12] rounded-[2rem] shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                  <div class="p-8 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                      <div class="flex items-center gap-4">
                         <div class="w-10 h-10 rounded-xl bg-[#f06427] text-white flex items-center justify-center">
                            <i class="bi bi-clipboard-pulse text-xl"></i>
                         </div>
                         <h4 class="text-sm font-black text-black dark:text-white uppercase tracking-widest">Solicitudes de Equipamiento</h4>
                      </div>
                      <div class="flex items-center gap-4">
                         <span class="text-[10px] font-black bg-black text-white px-4 py-2 rounded-xl uppercase tracking-widest">{{ pendingReservations().length }} ACTIVAS</span>
                      </div>
                  </div>
                  <div class="overflow-x-auto min-h-[350px]">
                      <table class="w-full text-left">
                          <thead>
                              <tr class="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-white/5">
                                  <th class="p-6 pl-10">Identidad</th>
                                  <th class="p-6">Material Solicitado</th>
                                  <th class="p-6">Programación</th>
                                  <th class="p-6 text-center pr-10">Acción</th>
                              </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-50 dark:divide-white/5">
                              @for (res of pendingReservations(); track res.id) {
                                  <tr class="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                      <td class="p-6 pl-10">
                                          <div class="flex items-center gap-5">
                                              <div class="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-black group-hover:bg-[#f06427] transition-colors shadow-lg">
                                                  {{ (res.user?.charAt(0) || '?') }}
                                              </div>
                                              <div>
                                                  <div class="text-sm font-bold text-black dark:text-white">{{ res.user }}</div>
                                                  <div class="text-[9px] font-black text-[#f06427] uppercase tracking-widest mt-1">{{ res.userRole }}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td class="p-6">
                                          <div class="flex items-center gap-3">
                                              <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
                                                    [class]="res.tipoItem === 'SALA' ? 'bg-indigo-100 text-indigo-500' : 'bg-orange-100 text-orange-500'">
                                                  {{ res.tipoItem }}
                                              </span>
                                              <div class="text-xs font-black text-black dark:text-gray-200 uppercase truncate max-w-[200px]">{{ res.detalle }}</div>
                                          </div>
                                      </td>
                                      <td class="p-6">
                                          <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{{ res.createdAt | date:'EE dd MMM' }}</div>
                                          <div class="text-[9px] font-bold text-[#f06427] uppercase tracking-widest">{{ res.createdAt | date:'HH:mm' }} HRS</div>
                                      </td>
                                      <td class="p-6 pr-10 text-center">
                                          <div class="flex items-center justify-center gap-3">
                                              <button [routerLink]="['/requests']" class="px-4 py-2 rounded-xl bg-black text-white hover:bg-[#f06427] transition-all text-[9px] font-black tracking-widest uppercase shadow-lg active:scale-95">
                                                  GESTIONAR
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              }
                              @if (pendingReservations().length === 0) {
                                  <tr><td colspan="4" class="p-24 text-center">
                                      <div class="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                          <i class="bi bi-journal-check text-5xl text-gray-200"></i>
                                      </div>
                                      <p class="font-black text-[11px] uppercase tracking-[0.2em] text-gray-400">Excelente. No hay pendientes por hoy.</p>
                                  </td></tr>
                              }
                          </tbody>
                      </table>
                  </div>
              </div>

               <!-- Live Laboratorios Status -->
               <div class="bg-black text-white rounded-[2rem] shadow-2xl p-8 border border-white/5">
                  <div class="flex justify-between items-center mb-10">
                      <div class="flex items-center gap-4">
                         <div class="w-10 h-10 rounded-xl bg-[#f06427] text-white flex items-center justify-center">
                             <i class="bi bi-activity text-xl"></i>
                         </div>
                                                   <h3 class="text-sm font-black uppercase tracking-widest text-white">Actividad Live</h3>
                      </div>
                      <div class="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                          <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">En Línea</span>
                      </div>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      @for (res of activeReservations(); track res.id) {
                          <div class="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/[0.08] transition-all group">
                              <div class="flex justify-between items-start mb-4">
                                  <div class="w-10 h-10 rounded-xl bg-[#f06427] flex items-center justify-center text-sm font-black shadow-lg">
                                      {{ (res.nombreSolicitante?.charAt(0) || '?') }}
                                  </div>
                                  <span class="text-[8px] font-black bg-white/10 px-2 py-1 rounded tracking-tighter uppercase">{{ res.bloque }}</span>
                              </div>
                              <h5 class="text-xs font-bold truncate mb-1">{{ res.nombreSolicitante }}</h5>
                              <p class="text-[10px] text-gray-500 font-bold mb-6 overflow-hidden text-ellipsis">{{ getItem(res.equipoId)?.marca }}</p>
                              
                              <div class="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                                  @if (!res.clockIn) {
                                      <button (click)="checkIn(res.id)" class="bg-[#f06427] hover:bg-orange-600 text-[9px] font-black py-2 px-4 rounded-xl transition-all w-full uppercase tracking-widest shadow-xl shadow-orange-500/20">
                                          Confirmar Entrada
                                      </button>
                                  } @else if (!res.clockOut) {
                                      <button (click)="checkOut(res.id)" class="bg-white text-black hover:bg-gray-200 text-[9px] font-black py-2 px-4 rounded-xl transition-all w-full uppercase tracking-widest">
                                          Registrar Salida
                                      </button>
                                  } @else {
                                      <div class="text-[9px] font-black text-gray-500 uppercase text-center w-full bg-white/5 py-2 rounded-xl">
                                          Sesión Finalizada
                                      </div>
                                  }
                              </div>
                          </div>
                      }
                      @if (activeReservations().length === 0) {
                        <div class="col-span-full p-12 text-center text-gray-600 font-black text-[10px] uppercase tracking-widest border border-dashed border-white/10 rounded-3xl">
                            Sin préstamos activos en este momento
                        </div>
                      }
                  </div>
               </div>

                             <!-- Premium Real-time Room Status Widget -->
                <div class="bg-black text-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 group">
                   <div class="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-white/5 to-transparent">
                       <div class="flex items-center gap-5">
                          <div class="w-14 h-14 rounded-2xl bg-[#f06427] text-white flex items-center justify-center shadow-2xl shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                              <i class="bi bi-broadcast-pin text-3xl"></i>
                          </div>
                          <div>
                             <h3 class="text-xl font-black uppercase tracking-tighter leading-none mb-2 text-white">Monitor Live: Salas & Labs</h3>
                             <div class="flex items-center gap-4">
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                   <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistema en tiempo real activo
                                </p>
                                <div class="px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                                   <span class="text-[12px] font-black font-mono text-uah-orange tracking-widest">{{ currentTimeDisplay() }}</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       <div class="flex items-center gap-3">
                           <div class="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                               <span class="text-[9px] font-black text-gray-500 uppercase mb-1">Libres</span>
                               <span class="text-xl font-black text-emerald-400">{{ allRooms().length - occupiedRooms().length }}</span>
                           </div>
                           <div class="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                               <span class="text-[9px] font-black text-gray-500 uppercase mb-1">En Uso</span>
                               <span class="text-xl font-black text-orange-400">{{ occupiedRooms().length }}</span>
                           </div>
                       </div>
                   </div>
                   
                   <div class="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                        @for (room of allRooms(); track room.id) {
                           @let activity = getRoomActivity(room);
                           @let progress = getBlockProgress();
                           <div class="relative p-8 rounded-[2rem] border transition-all duration-500 group/room overflow-hidden"
                                [class]="activity.status === 'Sin Actividad' ? 'bg-white/2 dark:bg-white/[0.02] border-white/5' : 'bg-[#f06427]/5 border-[#f06427]/20 shadow-2xl'">
                               
                               <!-- Background accent for active rooms -->
                               @if (activity.status !== 'Sin Actividad') {
                                  <div class="absolute top-0 right-0 w-32 h-32 bg-[#f06427] blur-[80px] opacity-10 -mr-16 -mt-16"></div>
                               }

                               <div class="relative z-10 flex flex-col h-full">
                                  <div class="flex justify-between items-start mb-6">
                                      <div>
                                         <h5 class="text-lg font-black uppercase tracking-tighter text-white" [style.color]="activity.status !== 'Sin Actividad' ? '#f06427' : ''">{{ room.nombre }}</h5>
                                         <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">{{ room.ubicacionPiso }}</span>
                                      </div>
                                      <div class="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest" 
                                           [class]="activity.status === 'Sin Actividad' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500 text-white animate-pulse'">
                                         {{ activity.status === 'Sin Actividad' ? 'Disponible' : 'En Uso' }}
                                      </div>
                                  </div>

                                  @if (activity.status !== 'Sin Actividad') {
                                     <div class="mb-4">
                                        <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 opacity-60">Actividad Actual</div>
                                        <div class="text-sm font-black text-white leading-tight uppercase mb-6">{{ activity.detail }}</div>
                                        
                                        <!-- Progress Bar for block -->
                                        <div class="space-y-2">
                                           <div class="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                                               <span class="text-[#f06427]">Ocupación del Bloque</span>
                                               <span class="text-white">{{ progress }}%</span>
                                           </div>
                                           <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                               <div class="h-full bg-gradient-to-r from-[#f06427] to-orange-400 rounded-full transition-all duration-[2000ms]" [style.width.%]="progress"></div>
                                           </div>
                                        </div>
                                     </div>
                                  } @else {
                                     <div class="mt-auto pt-6 border-t border-white/5 flex items-center gap-3">
                                         <i class="bi bi-info-circle text-gray-600"></i>
                                         <span class="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Sin programaciones activas</span>
                                     </div>
                                  }
                               </div>
                           </div>
                        }
                   </div>
                   
                   <div class="bg-white/[0.02] p-6 text-center border-t border-white/5">
                        <button [routerLink]="['/rooms']" class="text-[10px] font-black text-[#f06427] uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all">
                           Ver Calendario Completo <i class="bi bi-arrow-right ml-2 text-lg align-middle"></i>
                        </button>
                   </div>
                </div>
          </div>

          <!-- SIDEBAR WIDGETS -->
          <div class="lg:col-span-4 space-y-10">
              
              <!-- Charts Container -->
              <div class="bg-white dark:bg-[#0f0f12] p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-white/5 space-y-10">
                  <div>
                      <h4 class="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                          <span class="w-1 h-4 bg-[#f06427] rounded-full"></span> Análisis de Inventario
                      </h4>
                      <div class="h-60 relative">
                        <canvas id="inventoryChart"></canvas>
                      </div>
                  </div>
                  <div class="pt-10 border-t border-gray-50 dark:border-white/5">
                      <h4 class="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                          <span class="w-1 h-4 bg-[#f06427] rounded-full"></span> Soporte Técnico
                      </h4>
                      <div class="h-52">
                        <canvas id="ticketsChart"></canvas>
                      </div>
                  </div>
              </div>

              <!-- Agenda: Dark Theme -->
              <div class="bg-[#f06427] rounded-[2.5rem] shadow-2xl p-10 text-white relative overflow-hidden flex flex-col group">
                 <div class="absolute -right-20 -top-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                 <div class="relative z-10">
                    <h4 class="text-sm font-black uppercase tracking-widest mb-10 flex items-center gap-3">
                        <i class="bi bi-stack text-lg"></i> Agenda Administrativa
                    </h4>
                    <div class="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar-white pr-4 mb-10">
                        @for (task of data.adminTasks(); track task.id) {
                            <div class="group/task flex items-center gap-5 bg-black/10 hover:bg-black/20 p-5 rounded-2xl transition-all border border-white/10">
                                <button (click)="toggleAdminTask(task)" 
                                        class="w-8 h-8 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all bg-black/30"
                                         [class]="task.status === 'done' ? 'bg-white border-white text-[#f06427]' : 'border-white/40 text-transparent'">
                                    <i class="bi bi-check-lg text-lg"></i>
                                </button>
                                <span class="text-xs font-bold flex-1 leading-snug" [class.line-through]="task.status === 'done'" [class.opacity-50]="task.status === 'done'">{{ task.description }}</span>
                                <button (click)="deleteAdminTask(task.id)" class="opacity-0 group-hover/task:opacity-100 text-white hover:text-black transition-opacity">
                                   <i class="bi bi-trash-fill"></i>
                                </button>
                            </div>
                        }
                    </div>
                    <div class="relative">
                       <input #dashTaskInput (keyup.enter)="addAdminTask(dashTaskInput)" type="text" placeholder="Nueva nota..." 
                              class="w-full bg-black/20 border border-white/20 rounded-2xl py-5 px-6 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-0 focus:border-white transition-all shadow-inner uppercase tracking-tighter font-black">
                        <button (click)="addAdminTask(dashTaskInput)" class="absolute right-4 top-4 text-white hover:scale-110 transition-transform">
                           <i class="bi bi-plus-circle-fill text-3xl"></i>
                        </button>
                    </div>
                 </div>
              </div>
          </div>
      </div>

      <!-- BUDGET & BUDGET PERFORMANCE -->
      <div class="bg-white dark:bg-[#0f0f12] rounded-[3rem] p-12 lg:p-16 shadow-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden">
          <div class="absolute right-0 top-0 w-[800px] h-[800px] bg-[#f06427]/5 rounded-full blur-[180px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-20 relative z-10">
             <div>
                <h3 class="text-4xl font-black text-black dark:text-white tracking-tighter mb-3 uppercase" style="font-family: 'Playfair Display', serif;">Presupuesto Institucional</h3>
                <p class="text-[12px] text-gray-400 font-black uppercase tracking-[0.3em] flex items-center gap-3">
                    <span class="w-10 h-0.5 bg-[#f06427]"></span> Ejecución Real de Compras
                </p>
             </div>
              <div class="bg-black p-8 lg:px-12 rounded-[2.5rem] shadow-2xl flex flex-col items-end border-b-4 border-[#f06427]">
                 <div class="text-[10px] font-black text-[#f06427] uppercase tracking-[0.2em] mb-4 opacity-70 italic">Capital Ejecutado Global</div>
                 <div class="text-6xl font-black text-white tracking-tighter">$ {{ totalSpent() | number }} <span class="text-xl font-black opacity-20 ml-2">Total</span></div>
              </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
             @for (lab of labsList; track lab) {
                @let spent = budgetByLab(lab);
                @let budget = data.labBudgets()[lab] || 1;
                @let percent = (spent / budget) * 100;
                <div class="flex flex-col bg-gray-50/50 dark:bg-white/[0.02] p-10 rounded-3xl border border-gray-100 dark:border-white/5 group/bar hover:bg-white dark:hover:bg-black transition-all hover:shadow-2xl hover:scale-[1.02] duration-500">
                   <div class="flex justify-between items-end mb-6">
                      <span class="text-sm font-black text-black dark:text-white uppercase tracking-widest">{{ lab }}</span>
                      <span class="text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg" [class]="percent > 90 ? 'bg-rose-500 text-white' : 'bg-black text-white'">{{ percent | number:'1.0-0' }}%</span>
                   </div>
                   <div class="relative h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-8">
                       <div class="h-full rounded-full transition-all duration-[1500ms] ease-in-out" 
                            [style.width.%]="percent"
                            [class]="percent > 90 ? 'bg-rose-500' : 'bg-[#f06427]'">
                       </div>
                   </div>
                   <div class="flex flex-col gap-3">
                      <div class="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                         <span class="text-gray-400">Gastado:</span>
                         <span class="text-black dark:text-white">$ {{ spent | number }}</span>
                      </div>
                      <div class="flex justify-between text-[11px] font-bold uppercase tracking-widest mt-2 pt-4 border-t border-gray-100 dark:border-white/10">
                         <span class="text-gray-400">Fondo Lab:</span>
                         <span class="text-black dark:text-gray-400">$ {{ budget | number }}</span>
                      </div>
                   </div>
                </div>
             }
          </div>

          <!-- CONTROL CENTRALIZADO DE COMPRAS (UAH) -->
          <div class="mt-20 pt-20 border-t border-gray-100 dark:border-white/5 relative z-10 animate-fadeIn">
             <div class="flex items-center gap-4 mb-10">
                 <div class="w-1.5 h-10 bg-[#f06427] rounded-full shadow-[0_0_20px_rgba(240,100,39,0.4)]"></div>
                 <div>
                     <h4 class="text-3xl font-black text-black dark:text-white uppercase tracking-tighter italic">Torre de Control de Compras</h4>
                     <p class="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Estado Global de Solicitudes y Adjudicaciones</p>
                 </div>
             </div>

             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 <!-- SOLICITUD -->
                 <div [routerLink]="['/procurement']" class="bg-gray-50/50 dark:bg-white/[0.02] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 cursor-pointer hover:bg-white dark:hover:bg-black transition-all hover:shadow-2xl group overflow-hidden relative">
                     <div class="absolute right-0 top-0 w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-bl-[2.5rem] opacity-50"></div>
                     <div class="flex justify-between items-center mb-6 relative z-10">
                         <div class="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-[#f06427] transition-all shadow-sm">
                             <i class="bi bi-clipboard-plus text-2xl"></i>
                         </div>
                         <span class="text-[11px] font-black text-gray-400 uppercase tracking-widest">Solicitudes</span>
                     </div>
                     <div class="text-6xl font-black text-black dark:text-white tracking-tighter mb-2">{{ countPurchaseByStage('Solicitud') }}</div>
                     <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pendientes de Mesa</p>
                 </div>

                 <!-- ADJUDICACION -->
                 <div [routerLink]="['/procurement']" class="bg-gray-50/50 dark:bg-white/[0.02] p-8 rounded-[2.5rem] border-l-[12px] border-l-[#f06427] border-y border-r border-gray-100 dark:border-white/5 cursor-pointer hover:bg-white dark:hover:bg-black transition-all hover:shadow-2xl group overflow-hidden relative">
                     <div class="absolute right-0 top-0 w-20 h-20 bg-[#f06427]/5 rounded-bl-[2.5rem] opacity-50"></div>
                     <div class="flex justify-between items-center mb-6 relative z-10">
                         <div class="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-[#f06427] group-hover:scale-110 transition-transform shadow-sm">
                             <i class="bi bi-hammer text-2xl"></i>
                         </div>
                     <span class="text-[11px] font-black text-[#f06427] uppercase tracking-widest">Adjudicación</span>
                     </div>
                     <div class="text-6xl font-black text-black dark:text-white tracking-tighter mb-2">{{ countPurchaseByStage('Adjudicacion') }}</div>
                     <p class="text-[10px] font-bold text-[#f06427] uppercase tracking-widest animate-pulse">Por Asignar Proveedor</p>
                 </div>

                 <!-- SEGUIMIENTO -->
                 <div [routerLink]="['/procurement']" class="bg-gray-50/50 dark:bg-white/[0.02] p-8 rounded-[2.5rem] border-l-[12px] border-l-blue-500 border-y border-r border-gray-100 dark:border-white/5 cursor-pointer hover:bg-white dark:hover:bg-black transition-all hover:shadow-2xl group overflow-hidden relative">
                     <div class="absolute right-0 top-1 w-20 h-20 bg-blue-500/5 rounded-bl-[2.5rem] opacity-50"></div>
                     <div class="flex justify-between items-center mb-6 relative z-10">
                         <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 shadow-sm">
                             <i class="bi bi-truck text-2xl"></i>
                         </div>
                         <span class="text-[11px] font-black text-blue-500 uppercase tracking-widest">Seguimiento</span>
                     </div>
                     <div class="text-6xl font-black text-black dark:text-white tracking-tighter mb-2">{{ countPurchaseByStage('Seguimiento') }}</div>
                     <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">O.C. Firmada / Transito</p>
                 </div>

                 <!-- CIERRE -->
                 <div [routerLink]="['/procurement']" class="bg-white dark:bg-black p-8 rounded-[2.5rem] border-l-[12px] border-l-emerald-500 shadow-xl cursor-pointer transition-all group overflow-hidden relative">
                     <div class="absolute right-0 top-0 w-20 h-20 bg-emerald-500/5 rounded-bl-[2.5rem] opacity-50"></div>
                     <div class="flex justify-between items-center mb-6 relative z-10">
                         <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shadow-sm">
                             <i class="bi bi-check-circle-fill text-2xl"></i>
                         </div>
                         <span class="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Cerrados</span>
                     </div>
                     <div class="text-6xl font-black text-black dark:text-white tracking-tighter mb-2">{{ countPurchaseByStage('Cierre') }}</div>
                     <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestión Finalizada</p>
                 </div>
             </div>
          </div>
      </div>
   `
})
export class DashboardComponent implements OnInit {
   data = inject(DataService);
   router = inject(Router);
   today = new Date();

   // Solicitudes Unificadas (Caja Negra)
   unifiedRequests = computed(() => this.data.unifiedRequests());
   
   // Solicitudes que aún no han sido aprobadas ni rechazadas (Caja Negra Total)
   pendingReservations = computed(() => this.unifiedRequests().filter(r => r.status === 'Pendiente'));

   // Préstamos de equipos activos (Histórico compatible)
   activeReservations = computed(() => this.data.reservations().filter(r => r.aprobada && !r.rechazada));

   // Usuarios que han hecho check-in pero no check-out
   activeInLab = computed(() => this.activeReservations().filter(r => r.clockIn && !r.clockOut));

   // Items cuyo stock actual es menor o igual al stock mínimo definido
   criticalStock = computed(() => this.data.inventory().filter(i => i.stockActual <= i.stockMinimo));

   // SUMA TOTAL DE UNIDADES FÍSICAS (Para que cuadre con la realidad del usuario)
   totalStockUnits = computed(() => this.data.inventory().reduce((acc, i) => acc + (i.stockActual || 0), 0));

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

   // Reloj en tiempo real
   currentTimeDisplay = signal<string>('00:00:00');

   // --- Salas y Labs Live Dashboard ---
   allRooms = signal<any[]>([]);
   allRoomReservationsToday = signal<any[]>([]);
   occupiedRooms = computed(() => this.allRooms().filter(r => this.getRoomActivity(r).status !== 'Sin Actividad'));

   async loadRooms() {
      try {
         const r = await fetch('/api/rooms', { headers: { 'Authorization': `Bearer ${this.data.token()}` } });
         if (r.ok) this.allRooms.set(await r.json());
      } catch(e) {}
   }

   async loadRoomReservationsToday() {
      const today = new Date().toISOString().split('T')[0];
      try {
         const r = await fetch(`/api/room-reservations?fecha=${today}`, { headers: { 'Authorization': `Bearer ${this.data.token()}` } });
         if (r.ok) this.allRoomReservationsToday.set(await r.json());
      } catch(e) {}
   }

   getRoomActivity(room: any): { status: string, detail: string } {
      const now = new Date();
      const HH = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${HH}:${mm}`;
      
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const currentDay = dayNames[now.getDay()].toUpperCase();
      const norm = (s: string) => s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
      const roomName = norm(room.nombre);

      // 1. Clases
      const currentClass = this.data.classSchedules().find(s => {
          if (norm(s.lab) !== roomName || norm(s.day) !== norm(currentDay)) return false;
          if (s.block.includes('-')) {
             const [start, end] = s.block.split('-').map(t => t.trim());
             return currentTime >= start && currentTime <= end;
          }
          const blocks: any = { 'BLOQUE 1': ['08:30','09:50'], 'BLOQUE 2': ['10:00','11:20'], 'BLOQUE 3': ['11:30','12:50'], 'BLOQUE 4': ['13:00','14:20'], 'BLOQUE 5': ['14:30','15:50'], 'BLOQUE 6': ['16:00','17:20'], 'BLOQUE 7': ['17:30','18:50'] };
          const range = blocks[s.block.toUpperCase()];
          if (range) return currentTime >= range[0] && currentTime <= range[1];
          return false;
      });
      if (currentClass) return { status: 'Ocupado', detail: currentClass.subject };

      // 2. Reservas
      const reservation = this.allRoomReservationsToday().find(r => {
          if (r.roomId !== room.id || r.estado !== 'Aprobada') return false;
          const blocks: any = { 1: ['08:30','09:50'], 2: ['10:00','11:20'], 3: ['11:30','12:50'], 4: ['13:00','14:20'], 5: ['14:30','15:50'], 6: ['16:00','17:20'], 7: ['17:30','18:50'] };
          const range = blocks[r.roomBlockId % 7 || 7]; 
          return range && currentTime >= range[0] && currentTime <= range[1];
      });
      if (reservation) return { status: 'Ocupado', detail: reservation.motivo };

      return { status: 'Sin Actividad', detail: '' };
   }

   /** Calcula el progreso del bloque de tiempo actual (basado en bloques de 1.5 horas aprox) */
   getBlockProgress(): number {
      const now = new Date();
      const HH = now.getHours();
      const mm = now.getMinutes();
      const currentTime = HH * 60 + mm;

      const blocks = [
         { s: 8*60+30, e: 9*60+50 },
         { s: 10*60+0, e: 11*60+20 },
         { s: 11*60+30, e: 12*60+50 },
         { s: 13*60+0, e: 14*60+20 },
         { s: 14*60+30, e: 15*60+50 },
         { s: 16*60+0, e: 17*60+20 },
         { s: 17*60+30, e: 18*60+50 }
      ];

      const currentBlock = blocks.find(b => currentTime >= b.s && currentTime <= b.e);
      if (!currentBlock) return 0;

      const total = currentBlock.e - currentBlock.s;
      const elapsed = currentTime - currentBlock.s;
      return Math.min(100, Math.round((elapsed / total) * 100));
   }

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
         title: '<h3 class="text-uah-blue font-black uppercase tracking-tighter">¿Eliminar Tarea?</h3>',
         text: 'Esta nota se borrará permanentemente de tu agenda.',
         icon: 'warning',
         showCancelButton: true,
         confirmButtonColor: '#ef4444',
         cancelButtonColor: '#003366',
         confirmButtonText: 'Sí, eliminar',
         cancelButtonText: 'Cancelar'
      });
     if (result.isConfirmed) {
        await this.data.deleteAdminTask(id);
     }
    }

   async approve(id: number) {
      await this.data.updateReservationStatus(id, 'approve');
      Swal.fire({ 
        icon: 'success', 
        toast: true, 
        position: 'top-end', 
        title: '<span class="text-emerald-600 font-bold uppercase text-xs">Reserva Aprobada</span>', 
        timer: 2000, 
        showConfirmButton: false 
      });
   }

   async reject(id: number) {
      const result = await Swal.fire({
         title: '<h3 class="text-uah-blue font-black uppercase tracking-tighter">Rechazar Reserva</h3>',
         input: 'text',
         inputPlaceholder: 'Escriba el motivo del rechazo...',
         showCancelButton: true,
         confirmButtonColor: '#ef4444',
         cancelButtonColor: '#003366',
         cancelButtonText: 'Cancelar',
         confirmButtonText: 'Confirmar Rechazo'
      });
      if (result.isConfirmed) {
         await this.data.updateReservationStatus(id, 'reject', { motivo: result.value });
         Swal.fire({ 
            icon: 'info', 
            toast: true, 
            position: 'top-end', 
            title: '<span class="text-rose-500 font-bold uppercase text-xs">Reserva Rechazada</span>', 
            timer: 2000, 
            showConfirmButton: false 
         });
      }
   }

   async checkIn(id: number) {
      await this.data.checkIn(id);
      Swal.fire({ 
        icon: 'success', 
        toast: true, 
        position: 'top-end', 
        title: '<span class="text-uah-blue font-bold uppercase text-xs">Ingreso Registrado</span>', 
        timer: 2000, 
        showConfirmButton: false 
      });
   }

   async checkOut(id: number) {
      await this.data.checkOut(id);
      Swal.fire({ 
        icon: 'success', 
        toast: true, 
        position: 'top-end', 
        title: '<span class="text-uah-orange font-bold uppercase text-xs">Salida Registrada</span>', 
        timer: 2000, 
        showConfirmButton: false 
      });
   }

   /**
    * Obtiene un item del inventario por su ID.
    */
   getItem(id: number) { return this.data.inventory().find(i => i.id === id); }

    ngOnInit() {
       // Control de acceso: Solo Admin_Labs o SuperUsers pueden ver el Dashboard
       const role = this.data.currentUser()?.rol;
       if (role !== 'Admin_Labs' && role !== 'SuperUser') {
          this.router.navigate(['/areas']);
          return;
       }

      // Carga de datos de salas para dashboard live
      this.loadRooms();
      this.loadRoomReservationsToday();
      this.data.fetchUnifiedRequests(); // Sincronizar Caja Negra

     // Auto-actualización de datos cada 1 minuto
     setInterval(() => {
        this.loadRooms();
        this.loadRoomReservationsToday();
     }, 60000);

     // Iniciar Reloj
     this.updateClock();
     setInterval(() => this.updateClock(), 1000);

     // Inicialización de gráficos con un pequeño retraso para asegurar que el DOM esté listo
     setTimeout(() => this.initCharts(), 500);
   }

   updateClock() {
      const now = new Date();
      const HH = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const ss = now.getSeconds().toString().padStart(2, '0');
      this.currentTimeDisplay.set(`${HH}:${mm}:${ss}`);
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
      Swal.fire({ 
        icon: 'success', 
        title: '<h3 class="text-uah-blue font-black uppercase">Devolución Exitosa</h3>', 
        text: 'El inventario institucional ha sido actualizado correctamente.', 
        timer: 2500, 
        showConfirmButton: false 
      });
   }

   countPurchaseByStage(stage: string): number {
       // Conteo Institucional (UAH) Centralizado por Folio Único
       const orders = this.data.purchaseOrders().filter(o => o.stage === (stage as any));
       const uniqueFolios = new Set(orders.map(o => o.idNum));
       return uniqueFolios.size;
   }
}
