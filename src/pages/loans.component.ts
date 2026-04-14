import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoansService, EquipmentLoan, SpecialLoan, EquipmentInventory, Equipment, DayOfWeek, TimeBlock } from '../services/loans.service';
import { DataService } from '../services/data.service';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(...registerables);

declare const Swal: any;

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#f4f6f8] text-gray-900 font-sans p-4 md:p-6 pb-20">
      
      <!-- Encabezado UAH Style -->
      <header class="bg-black rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6 mb-8 relative overflow-hidden shadow-2xl">
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-[10px] font-black tracking-widest text-[#ff5e14] uppercase bg-[#ff5e14]/20 px-3 py-1 rounded-full border border-[#ff5e14]/30">Préstamo de Equipos</span>
            <span class="text-[10px] font-black tracking-widest text-green-400 uppercase flex items-center gap-2">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
              Estado: Sincronizado
            </span>
          </div>
          <h1 class="text-4xl md:text-5xl font-black tracking-tighter mb-2 italic">
            HOLA, <span class="text-[#ff5e14]">{{ currentUser()?.nombreCompleto || 'ADMIN' }}</span>
          </h1>
          <p class="text-gray-400 text-sm max-w-xl font-medium tracking-tight">
            Gestión de Laboratorios e Infraestructura Tecnológica. <br/>
            <strong class="text-white uppercase text-[10px] tracking-widest bg-white/10 px-2 py-0.5 rounded mt-2 inline-block">Control de Inventario de Equipos</strong>
          </p>
        </div>

        <div class="flex items-center gap-2 relative z-10">
          <nav class="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-1">
            <button (click)="activeView.set('dashboard')" [class.bg-white]="activeView() === 'dashboard'" [class.text-black]="activeView() === 'dashboard'" class="px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 hover:bg-white/10">
              <i class="bi bi-speedometer2"></i> Dashboard
            </button>
            <button (click)="activeView.set('schedule')" [class.bg-white]="activeView() === 'schedule'" [class.text-black]="activeView() === 'schedule'" class="px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 hover:bg-white/10">
              <i class="bi bi-calendar3"></i> Horario
            </button>
            <button (click)="activeView.set('special')" [class.bg-white]="activeView() === 'special'" [class.text-black]="activeView() === 'special'" class="px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 hover:bg-white/10">
              <i class="bi bi-briefcase"></i> Préstamos Especiales
            </button>
          </nav>
          
          <button (click)="openInventoryModal()" class="w-12 h-12 bg-gray-800 text-white rounded-2xl flex items-center justify-center hover:bg-[#ff5e14] transition-all shadow-lg border border-white/10" title="Configurar Inventario">
            <i class="bi bi-gear-fill"></i>
          </button>
        </div>

        <!-- Decorative elements -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-[#ff5e14]/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-[#ff5e14]/5 rounded-full blur-3xl"></div>
      </header>

      <!-- Vista: DASHBOARD -->
      @if (activeView() === 'dashboard') {
        <div class="animate-fadeIn">
          <!-- KPIs -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:shadow-xl transition-all border-b-4 border-b-orange-500">
               <div class="flex justify-between items-start mb-6">
                 <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                   <i class="bi bi-box-seam text-xl"></i>
                 </div>
                 <span class="text-[10px] font-black text-gray-300 uppercase tracking-widest">Equipamiento</span>
               </div>
               <div>
                 <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Stock Disponible</p>
                 <p class="text-4xl font-black text-gray-900 tracking-tighter">{{ availableStock() }}</p>
               </div>
            </div>

            <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:shadow-xl transition-all border-b-4 border-b-blue-500">
               <div class="flex justify-between items-start mb-6">
                 <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                   <i class="bi bi-clock text-xl"></i>
                 </div>
                 <span class="text-[10px] font-black text-blue-300 uppercase tracking-widest">Próximas Hoy</span>
               </div>
               <div>
                 <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Clases Agendadas</p>
                 <p class="text-4xl font-black text-gray-900 tracking-tighter">{{ todaysLoans().length }}</p>
               </div>
            </div>

            <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:shadow-xl transition-all border-b-4 border-b-green-500">
               <div class="flex justify-between items-start mb-6">
                 <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-500 transition-colors">
                   <i class="bi bi-check2-circle text-xl"></i>
                 </div>
                 <span class="text-[10px] font-black text-green-300 uppercase tracking-widest">Activas</span>
               </div>
               <div>
                 <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Préstamos en Curso</p>
                 <p class="text-4xl font-black text-gray-900 tracking-tighter">{{ activeLoans().length }}</p>
               </div>
            </div>

            <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:shadow-xl transition-all border-b-4 border-b-red-500">
               <div class="flex justify-between items-start mb-6">
                 <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                   <i class="bi bi-exclamation-triangle text-xl"></i>
                 </div>
                 <span class="text-[10px] font-black text-red-300 uppercase tracking-widest">Alerta Crítica</span>
               </div>
               <div>
                 <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Sin Stock</p>
                 <p class="text-4xl font-black text-gray-900 tracking-tighter">{{ criticalItemsCount() }}</p>
               </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Columna Izquierda: Solicitudes de hoy -->
            <div class="lg:col-span-2 flex flex-col gap-8">
               <div class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
                  <div class="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h3 class="font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter text-lg">
                      <div class="bg-[#ff5e14] w-2 h-6 rounded-full"></div>
                      Solicitudes de Equipamiento <span class="text-gray-300 font-medium tracking-normal ml-2 lowercase">| hoy</span>
                    </h3>
                    <div class="flex items-center gap-2">
                       <span class="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">
                         {{ todaysLoans().length }} Pendientes
                       </span>
                    </div>
                  </div>

                  <div class="flex-1 p-8">
                    @if (todaysLoans().length === 0) {
                      <div class="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                         <div class="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                            <i class="bi bi-check2-all text-4xl"></i>
                         </div>
                         <p class="text-xs font-black tracking-widest uppercase">No hay solicitudes pendientes para hoy</p>
                      </div>
                    } @else {
                      <div class="space-y-4">
                         <div class="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">
                            <div class="col-span-4 italic">Identidad de Clase</div>
                            <div class="col-span-4 italic">Materiales</div>
                            <div class="col-span-2 italic text-center">Horario</div>
                            <div class="col-span-2 italic text-right">Acción</div>
                         </div>
                         @for (loan of todaysLoans(); track loan.id) {
                            @let isActive = isLoanActive(loan);
                            <div class="grid grid-cols-12 gap-4 items-center p-5 rounded-3xl border transition-all" 
                                 [class]="isActive ? 'bg-[#ff5e14]/5 border-[#ff5e14]/30 shadow-lg shadow-orange-500/5' : loan.status === 'cancelled' ? 'bg-gray-50 border-gray-100 opacity-50 grayscale' : 'bg-white border-gray-100 hover:border-gray-300 shadow-sm'">
                               <div class="col-span-4">
                                  <p class="font-black text-gray-900 tracking-tight leading-tight mb-0.5">{{ loan.className }}</p>
                                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{{ loan.professor }}</p>
                               </div>
                               <div class="col-span-4 flex flex-wrap gap-1.5">
                                  @if (loan.equipment.dellLaptops > 0) { <span class="bg-white px-2 py-0.5 rounded-lg border border-gray-100 text-[10px] font-black text-gray-500">{{ loan.equipment.dellLaptops }} DELL</span> }
                                  @if (loan.equipment.macLaptops > 0) { <span class="bg-white px-2 py-0.5 rounded-lg border border-gray-100 text-[10px] font-black text-gray-500">{{ loan.equipment.macLaptops }} MAC</span> }
                                  @if (loan.equipment.dellChargers > 0) { <span class="bg-white px-2 py-0.5 rounded-lg border border-gray-100 text-[10px] font-black text-gray-500 italic">C.DELL</span> }
                                  @if (loan.equipment.macChargers > 0) { <span class="bg-white px-2 py-0.5 rounded-lg border border-gray-100 text-[10px] font-black text-gray-500 italic">C.MAC</span> }
                               </div>
                               <div class="col-span-2 text-center">
                                  <p class="font-black text-gray-900 text-xs">{{ loan.timeBlock }}</p>
                                  @if (isActive && loan.status !== 'cancelled') {
                                    <span class="text-[8px] font-black bg-[#ff5e14] text-white px-1.5 py-0.5 rounded uppercase animate-pulse">En Curso</span>
                                  }
                               </div>
                               <div class="col-span-2 flex justify-end items-center gap-2">
                                  @if (loan.status === 'pending') {
                                    <button (click)="updateStatus(loan.id!, 'confirmed')" class="w-9 h-9 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all"><i class="bi bi-check-lg"></i></button>
                                    <button (click)="updateStatus(loan.id!, 'cancelled')" class="w-9 h-9 bg-red-100 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-200 transition-all"><i class="bi bi-x-lg"></i></button>
                                  } @else if (loan.status === 'confirmed') {
                                    <span class="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-green-200 flex items-center gap-1"><i class="bi bi-patch-check-fill"></i> Entregado</span>
                                  } @else {
                                    <span class="bg-gray-100 text-gray-400 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-gray-200">Cancelado</span>
                                  }
                               </div>
                            </div>
                         }
                      </div>
                    }
                  </div>
               </div>

               <!-- Actividad Live -->
               <div class="bg-black rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col gap-6">
                  <div class="flex justify-between items-center relative z-10">
                     <h3 class="font-black text-lg tracking-tighter uppercase flex items-center gap-3">
                        <i class="bi bi-broadcast text-[#ff5e14]"></i> Actividad Live
                     </h3>
                     <span class="text-[9px] font-black tracking-[0.2em] uppercase text-green-400 border border-green-400/30 px-3 py-1 rounded-full bg-green-400/5 flex items-center gap-2">
                        <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Sistema en línea
                     </span>
                  </div>
                  
                  <div class="relative z-10 flex-1 flex items-center justify-center py-6 border-y border-white/5">
                     @if (activeLoans().length === 0) {
                        <p class="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em] italic">No hay préstamos activos en este bloque</p>
                     } @else {
                        <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                           @for (loan of activeLoans(); track loan.id) {
                              <div class="bg-white/5 border border-white/10 rounded-3xl p-5 flex justify-between items-center">
                                 <div>
                                    <p class="font-black text-white text-sm mb-0.5">{{ loan.className }}</p>
                                    <p class="text-[10px] text-gray-500 font-bold uppercase">{{ loan.professor }}</p>
                                 </div>
                                 <div class="text-right">
                                    <p class="text-[#ff5e14] font-black text-xs leading-none">{{ loan.timeBlock }}</p>
                                    <p class="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-1">Bloque Actual</p>
                                 </div>
                              </div>
                           }
                        </div>
                     }
                  </div>

                  <div class="relative z-10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                     <span>Próximo Bloque: {{ nextTimeBlock() || 'Final Jornada' }}</span>
                     <span>{{ currentClock() }}</span>
                  </div>

                  <div class="absolute top-0 right-0 w-32 h-32 bg-[#ff5e14]/5 rounded-full blur-2xl"></div>
               </div>
            </div>

            <!-- Columna Derecha: Gráficos y Agenda -->
            <div class="flex flex-col gap-8">
               <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                  <h3 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                     <span class="w-1.5 h-4 bg-black rounded-full"></span> Análisis de Inventario
                  </h3>
                  <div class="h-64 relative">
                     <canvas id="inventoryChart"></canvas>
                  </div>
                  <div class="mt-8 space-y-4">
                     <div class="flex justify-between items-center">
                        <span class="text-[10px] font-black text-gray-400 uppercase">Eficiencia de Uso</span>
                        <span class="text-xs font-black">{{ utilizationRate() }}%</span>
                     </div>
                     <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div class="bg-[#ff5e14] h-full transition-all duration-1000" [style.width.%]="utilizationRate()"></div>
                     </div>
                  </div>
               </div>

               <div class="bg-[#ff5e14] rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
                  <h3 class="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                     <i class="bi bi-calendar-check"></i> Agenda Administrativa
                  </h3>
                  <div class="space-y-4 relative z-10">
                     <div class="bg-black/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-black/30 transition-all cursor-pointer">
                        <p class="text-[10px] text-white/50 font-black uppercase mb-1">Próxima Revisión</p>
                        <p class="font-black text-sm mb-0.5 tracking-tight uppercase">Mantenimiento Preventivo Mac</p>
                        <p class="text-xs text-white/80">Sábado 19, 09:00 hrs</p>
                     </div>
                     <div class="bg-black/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-black/30 transition-all cursor-pointer">
                        <p class="text-[10px] text-white/50 font-black uppercase mb-1">Auditoría</p>
                        <p class="font-black text-sm mb-0.5 tracking-tight uppercase">Conteo Físico General</p>
                        <p class="text-xs text-white/80">Viernes 25, 17:30 hrs</p>
                     </div>
                  </div>
                  <i class="bi bi-briefcase absolute -bottom-4 -right-4 text-white/10 text-9xl rotate-12 group-hover:scale-110 transition-transform"></i>
               </div>
            </div>
          </div>
        </div>
      }

      <!-- Vista: HORARIO (GRID) -->
      @if (activeView() === 'schedule') {
        <div class="animate-fadeIn">
          <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
             <div class="flex items-center gap-6">
                <!-- Mini Inventory Summary -->
                <div class="flex gap-4">
                   <div class="text-center">
                      <p class="text-[9px] font-black text-gray-400 uppercase mb-1">Dell</p>
                      <p class="text-xl font-black text-uah-blue">{{ inventory()?.dellLaptops }}</p>
                   </div>
                   <div class="text-center border-l border-gray-100 pl-4">
                      <p class="text-[9px] font-black text-gray-400 uppercase mb-1">Mac</p>
                      <p class="text-xl font-black text-dah-orange" style="color: #ff5e14">{{ inventory()?.macLaptops }}</p>
                   </div>
                   <div class="text-center border-l border-gray-100 pl-4">
                      <p class="text-[9px] font-black text-gray-400 uppercase mb-1">Alarg.</p>
                      <p class="text-xl font-black text-gray-700">{{ inventory()?.extensionCords }}</p>
                   </div>
                </div>
                <div class="h-10 w-px bg-gray-100 hidden md:block"></div>
                <div>
                   <h2 class="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Malla Semanal</h2>
                   <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Planificación de Recursos Tecnológicos</p>
                </div>
             </div>
             
             <div class="flex gap-2">
                <button (click)="exportToCSV()" class="bg-gray-100 text-gray-700 font-bold text-xs px-5 py-3 rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-2">
                  <i class="bi bi-file-earmark-spreadsheet"></i> CSV
                </button>
                <button (click)="exportToJSON()" class="bg-black text-white font-black text-xs px-5 py-3 rounded-2xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg shadow-black/10">
                  <i class="bi bi-download"></i> EXPORTAR
                </button>
             </div>
          </div>

          <!-- The Table / Grid -->
          <div class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
             <table class="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr class="bg-black text-white">
                    <th class="p-6 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/5 text-center bg-gray-900 w-32">Bloque</th>
                    @for (day of days; track day) {
                      <th class="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-center border-r border-white/5">{{ day }}</th>
                    }
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 font-bold">
                  @for (block of timeBlocks; track block) {
                    <tr class="hover:bg-gray-50/50 transition-colors">
                      <td class="p-6 text-center text-[10px] font-black bg-gray-50/50 border-r border-gray-100 text-gray-400">{{ block }}</td>
                      @for (day of days; track day) {
                        @let loan = getLoanAt(day, block);
                        <td (click)="handleCellClick(day, block, loan)" class="p-3 border-r border-gray-50 relative group cursor-pointer h-32 align-top">
                           @if (loan) {
                             <div class="w-full h-full rounded-2xl p-4 transition-all shadow-sm hover:shadow-md relative overflow-hidden" 
                                  [class]="loan.colorTheme === 'blue' ? 'bg-[#003057]/95 text-white' : loan.colorTheme === 'pink' ? 'bg-[#ff5e14]/95 text-white' : 'bg-[#eab308] text-white'">
                                <p class="text-[11px] font-black leading-tight uppercase mb-1">{{ loan.className }}</p>
                                <p class="text-[9px] font-medium opacity-60 uppercase mb-3">{{ loan.professor }}</p>
                                <div class="flex gap-2 opacity-90">
                                   @if (loan.equipment.dellLaptops > 0) { <div class="flex items-center gap-1 text-[8px] bg-white/10 px-1.5 py-0.5 rounded-md"><i class="bi bi-laptop"></i> {{ loan.equipment.dellLaptops }}</div> }
                                   @if (loan.equipment.macLaptops > 0) { <div class="flex items-center gap-1 text-[8px] bg-white/10 px-1.5 py-0.5 rounded-md"><i class="bi bi-apple"></i> {{ loan.equipment.macLaptops }}</div> }
                                   @if (loan.status === 'confirmed') { <i class="bi bi-check-circle-fill text-[10px] absolute bottom-3 right-3 text-white/50"></i> }
                                </div>
                             </div>
                           } @else {
                             <div class="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-50 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:bg-gray-50 transition-all text-gray-300">
                               <i class="bi bi-plus text-3xl"></i>
                             </div>
                           }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
             </table>
          </div>
        </div>
      }

      <!-- Vista: ESPECIALES -->
      @if (activeView() === 'special') {
         <div class="animate-fadeIn">
            <div class="bg-black rounded-[2.5rem] p-10 text-white mb-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
               <div class="relative z-10">
                  <h2 class="text-4xl font-black tracking-tighter italic mb-2 uppercase">Préstamos Especiales</h2>
                  <p class="text-gray-400 text-sm font-medium tracking-tight">Administración de equipamiento para eventos, ferias y préstamos de largo plazo.</p>
               </div>
               <button (click)="openSpecialModal()" class="relative z-10 bg-white text-black font-black px-8 py-4 rounded-3xl hover:bg-[#ff5e14] hover:text-white transition-all shadow-xl text-xs tracking-widest uppercase mt-6 md:mt-0 flex items-center gap-2">
                  <i class="bi bi-plus-lg"></i> Nuevo Préstamo
               </button>
               <div class="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               @for (loan of specialLoans(); track loan.id) {
                 <div class="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-2xl hover:-translate-y-1 transition-all">
                    <div class="p-8 border-b border-gray-50 flex justify-between items-start">
                       <div>
                          <div class="flex items-center gap-2 mb-2">
                             <span class="bg-black text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">{{ loan.applicantType }}</span>
                             <span [class]="loan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'" class="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">{{ loan.status === 'active' ? 'Activo' : 'Devuelto' }}</span>
                          </div>
                           <h4 class="text-xl font-black text-gray-900 tracking-tighter uppercase leading-tight">{{ loan.applicantName }}</h4>
                           <p class="text-[10px] font-bold text-gray-400 tracking-wider mb-4">{{ loan.applicantRut }}</p>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                           <p class="text-2xl font-black text-gray-100 group-hover:text-gray-200 transition-colors">#{{ loan.documentNumber }}</p>
                           <button (click)="$event.stopPropagation(); deleteSpecialLoan(loan.id!)" class="text-gray-300 hover:text-red-500 transition-colors" title="Eliminar rápidamente">
                              <i class="bi bi-trash3-fill"></i>
                           </button>
                        </div>
                     </div>
                    <div class="p-8 bg-gray-50/50">
                       <div class="grid grid-cols-2 gap-4 mb-6">
                          <div>
                             <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Motivo</p>
                             <p class="text-xs font-bold text-gray-800">{{ loan.reason }}</p>
                          </div>
                          <div class="text-right">
                             <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Plazo</p>
                             <p class="text-xs font-bold text-[#ff5e14] italic">{{ loan.startDate | date:'dd MMM' }} - {{ loan.endDate | date:'dd MMM' }}</p>
                          </div>
                       </div>
                       
                       <div class="bg-white rounded-2xl p-4 border border-gray-100 flex justify-around items-center">
                          <div class="text-center">
                             <p class="text-[8px] font-black text-gray-300 uppercase mb-1">Dell</p>
                             <p class="text-sm font-black">{{ loan.equipment.dellLaptops }}</p>
                          </div>
                          <div class="w-px h-6 bg-gray-100"></div>
                          <div class="text-center">
                             <p class="text-[8px] font-black text-gray-300 uppercase mb-1">Mac</p>
                             <p class="text-sm font-black">{{ loan.equipment.macLaptops }}</p>
                          </div>
                          <div class="w-px h-6 bg-gray-100"></div>
                          <div class="text-center">
                             <p class="text-[8px] font-black text-gray-300 uppercase mb-1">Cargadores</p>
                             <p class="text-sm font-black">{{ loan.equipment.dellChargers + loan.equipment.macChargers }}</p>
                          </div>
                       </div>
                    </div>
                    <div class="p-8 pt-0">
                       <button (click)="openSpecialModal(loan)" class="w-full bg-black/5 hover:bg-black hover:text-white text-gray-400 font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em]">Ver Detalle Pro / Documentos</button>
                    </div>
                 </div>
               }
               @if (specialLoans().length === 0) {
                  <div class="col-span-full py-20 bg-white/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-400">
                     <i class="bi bi-inbox text-5xl mb-4"></i>
                     <p class="text-xs font-black uppercase tracking-widest">No se registran préstamos especiales activos</p>
                  </div>
               }
            </div>
         </div>
      }

      <!-- MODAL: GESTIÓN DE PRÉSTAMO HORARIO -->
      @if (showLoanModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
           <div class="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-white/20 animate-zoomIn flex flex-col max-h-[90vh]">
              <div class="bg-black p-10 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                 <div class="relative z-10">
                    <h3 class="text-3xl font-black italic tracking-tighter uppercase mb-2">Solicitud de Equipos</h3>
                    <p class="text-gray-400 text-xs font-medium tracking-tight uppercase tracking-widest">{{ selectedDayModal }} | {{ selectedBlockModal }}</p>
                 </div>
                 <button (click)="showLoanModal.set(false)" class="relative z-10 bg-white/10 hover:bg-white/20 w-12 h-12 rounded-2xl transition-all flex items-center justify-center"><i class="bi bi-x-lg"></i></button>
                 <div class="absolute top-0 right-0 w-64 h-64 bg-[#ff5e14]/20 rounded-full blur-3xl"></div>
              </div>
              
              <div class="p-10 overflow-y-auto custom-scrollbar">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div class="space-y-6">
                       <h4 class="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Datos de la Clase</h4>
                       <div>
                          <label class="text-[10px] font-black text-uah-blue uppercase mb-2 block ml-1 tracking-widest">Nombre de la Clase</label>
                          <input [(ngModel)]="editLoan.className" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#ff5e14] transition-all" placeholder="Ej: Fundamentos Programación Sec 02">
                       </div>
                       <div>
                          <label class="text-[10px] font-black text-uah-blue uppercase mb-2 block ml-1 tracking-widest">Profesor a Cargo</label>
                          <input [(ngModel)]="editLoan.professor" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#ff5e14] transition-all" placeholder="Ej: Hector Ugalde">
                       </div>
                       <div>
                          <label class="text-[10px] font-black text-uah-blue uppercase mb-2 block ml-1 tracking-widest">Tema Visual</label>
                          <div class="flex gap-2">
                             <button (click)="editLoan.colorTheme = 'blue'" [class.ring-4]="editLoan.colorTheme === 'blue'" class="w-10 h-10 rounded-full bg-[#003057] transition-all border-2 border-white"></button>
                             <button (click)="editLoan.colorTheme = 'pink'" [class.ring-4]="editLoan.colorTheme === 'pink'" class="w-10 h-10 rounded-full bg-[#ff5e14] transition-all border-2 border-white"></button>
                             <button (click)="editLoan.colorTheme = 'yellow'" [class.ring-4]="editLoan.colorTheme === 'yellow'" class="w-10 h-10 rounded-full bg-[#eab308] transition-all border-2 border-white"></button>
                          </div>
                       </div>
                    </div>
                    
                    <div class="bg-[#f4f6f8] rounded-[2rem] p-8 border border-gray-100">
                       <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                          Recursos Solicitados
                          <span class="text-[#ff5e14] text-[8px] tracking-tight">Capacidad Máxima Lab</span>
                       </h4>
                       <div class="space-y-6">
                          <div class="flex items-center justify-between">
                             <span class="text-xs font-black uppercase text-gray-600">Dell Laptops</span>
                             <div class="flex items-center gap-3">
                                <input type="number" [(ngModel)]="editLoan.equipment.dellLaptops" class="w-14 bg-white border-2 border-gray-100 rounded-xl px-2 py-1 text-center font-black text-xs">
                                <span class="text-[10px] font-bold text-gray-300">/ {{ inventory()?.dellLaptops }}</span>
                             </div>
                          </div>
                          <div class="flex items-center justify-between">
                             <span class="text-xs font-black uppercase text-gray-600">Mac Laptops</span>
                             <div class="flex items-center gap-3">
                                <input type="number" [(ngModel)]="editLoan.equipment.macLaptops" class="w-14 bg-white border-2 border-gray-100 rounded-xl px-2 py-1 text-center font-black text-xs">
                                <span class="text-[10px] font-bold text-gray-300">/ {{ inventory()?.macLaptops }}</span>
                             </div>
                          </div>
                          <div class="flex items-center justify-between">
                             <span class="text-xs font-black uppercase text-gray-600">Cargadores Dell</span>
                             <div class="flex items-center gap-3">
                                <input type="number" [(ngModel)]="editLoan.equipment.dellChargers" class="w-14 bg-white border-2 border-gray-100 rounded-xl px-2 py-1 text-center font-black text-xs">
                                <span class="text-[10px] font-bold text-gray-300">/ {{ inventory()?.dellChargers }}</span>
                             </div>
                          </div>
                          <div class="flex items-center justify-between">
                             <span class="text-xs font-black uppercase text-gray-600">Cargadores Mac</span>
                             <div class="flex items-center gap-3">
                                <input type="number" [(ngModel)]="editLoan.equipment.macChargers" class="w-14 bg-white border-2 border-gray-100 rounded-xl px-2 py-1 text-center font-black text-xs">
                                <span class="text-[10px] font-bold text-gray-300">/ {{ inventory()?.macChargers }}</span>
                             </div>
                          </div>
                          <div class="flex items-center justify-between">
                             <span class="text-xs font-black uppercase text-gray-600">Alargadores</span>
                             <div class="flex items-center gap-3">
                                <input type="number" [(ngModel)]="editLoan.equipment.extensionCords" class="w-14 bg-white border-2 border-gray-100 rounded-xl px-2 py-1 text-center font-black text-xs">
                                <span class="text-[10px] font-bold text-gray-300">/ {{ inventory()?.extensionCords }}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div class="flex gap-4">
                    <button (click)="saveLoan()" class="flex-1 bg-black text-white font-black py-5 rounded-3xl hover:bg-[#ff5e14] transition-all shadow-xl shadow-black/10 text-xs tracking-[0.2em] uppercase">Guardar Cambios</button>
                    @if (editLoan.id) {
                      <button (click)="deleteLoan(editLoan.id!)" class="bg-red-50 text-red-500 font-bold px-8 py-5 rounded-3xl hover:bg-red-500 hover:text-white transition-all text-xs tracking-[0.2em] uppercase"><i class="bi bi-trash3-fill"></i></button>
                    }
                 </div>
              </div>
           </div>
        </div>
      }

      <!-- MODAL: GESTIÓN DE INVENTARIO -->
      @if (showInventoryModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
           <div class="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden border border-white/20 animate-zoomIn">
              <div class="bg-uah-blue p-10 text-white flex justify-between items-center relative overflow-hidden">
                 <div class="relative z-10">
                    <h3 class="text-3xl font-black italic tracking-tighter uppercase mb-2">Configuración Lab</h3>
                    <p class="text-blue-200 text-xs font-medium tracking-tight uppercase tracking-widest italic">Recurso Humano y Tecnológico</p>
                 </div>
                 <button (click)="showInventoryModal.set(false)" class="relative z-10 bg-white/10 hover:bg-white/20 w-12 h-12 rounded-2xl transition-all flex items-center justify-center"><i class="bi bi-x-lg"></i></button>
                 <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              </div>
              
              <div class="p-10 space-y-6">
                 <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Notebooks DELL Disponibles (Total)</label>
                    <input type="number" [(ngModel)]="editInv.dellLaptops" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-2 focus:ring-uah-blue transition-all">
                 </div>
                 <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">MacBooks Disponibles (Total)</label>
                    <input type="number" [(ngModel)]="editInv.macLaptops" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-2 focus:ring-uah-blue transition-all">
                 </div>
                 <div class="grid grid-cols-2 gap-4">
                    <div>
                       <label class="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Carg. Dell</label>
                       <input type="number" [(ngModel)]="editInv.dellChargers" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-2 focus:ring-uah-blue transition-all">
                    </div>
                    <div>
                       <label class="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Carg. Mac</label>
                       <input type="number" [(ngModel)]="editInv.macChargers" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-2 focus:ring-uah-blue transition-all">
                    </div>
                 </div>
                 <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Alargadores / Zapatillas</label>
                    <input type="number" [(ngModel)]="editInv.extensionCords" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-2 focus:ring-uah-blue transition-all">
                 </div>
                 
                 <button (click)="saveInventory()" class="w-full bg-black text-white font-black py-5 rounded-3xl hover:bg-uah-blue transition-all shadow-xl shadow-black/10 text-[10px] tracking-[0.3em] uppercase mt-4">Actualizar Inventario Base</button>
              </div>
           </div>
        </div>
      }

      <!-- MODAL: PRÉSTAMO ESPECIAL (DETALLADO) -->
      @if (showSpecialModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
           <div class="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full overflow-hidden border border-white/20 animate-zoomIn flex flex-col max-h-[95vh]">
              <div class="bg-[#ff5e14] p-8 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                 <div class="relative z-10">
                    <h3 class="text-3xl font-black italic tracking-tighter uppercase mb-1">Acta de Préstamo</h3>
                    <p class="text-orange-200 text-[10px] font-black uppercase tracking-[0.2em]">Gestión de Equipamiento de Largo Plazo</p>
                 </div>
                 <div class="flex items-center gap-3 relative z-10">
                    <span class="bg-black/20 px-4 py-2 rounded-xl text-xs font-black">{{ editSpecialLoan.documentNumber }}</span>
                    <button (click)="showSpecialModal.set(false)" class="bg-white/10 hover:bg-white/20 w-10 h-10 rounded-xl transition-all flex items-center justify-center"><i class="bi bi-x-lg"></i></button>
                 </div>
                 <div class="absolute top-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
              </div>
              
              <div class="p-8 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <!-- Columna 1: Solicitante y Fechas -->
                    <div class="space-y-6">
                       <h4 class="text-[10px] font-black text-[#ff5e14] uppercase tracking-[0.2em] border-b border-orange-100 pb-2 flex items-center gap-2">
                         <i class="bi bi-person-badge-fill"></i> Identificación del Solicitante
                       </h4>
                       <div class="grid grid-cols-2 gap-4">
                          <div class="col-span-2">
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Nombre Completo</label>
                             <input [(ngModel)]="editSpecialLoan.applicantName" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-[#ff5e14] outline-none transition-all">
                          </div>
                          <div>
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">RUT</label>
                             <input [(ngModel)]="editSpecialLoan.applicantRut" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-[#ff5e14] outline-none transition-all">
                          </div>
                          <div>
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Tipo de Usuario</label>
                             <select [(ngModel)]="editSpecialLoan.applicantType" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-[#ff5e14] outline-none transition-all">
                                <option value="Alumno">Alumno</option>
                                <option value="Docente">Docente</option>
                                <option value="Administrativo">Administrativo</option>
                                <option value="Externo">Externo</option>
                             </select>
                          </div>
                       </div>

                       <h4 class="text-[10px] font-black text-[#ff5e14] uppercase tracking-[0.2em] border-b border-orange-100 pb-2 flex items-center gap-2 pt-2">
                         <i class="bi bi-calendar-range-fill"></i> Período de Préstamo
                       </h4>
                       <div class="grid grid-cols-2 gap-4">
                          <div>
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Fecha Inicio</label>
                             <input type="date" [(ngModel)]="editSpecialLoan.startDate" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-[#ff5e14] outline-none transition-all">
                          </div>
                          <div>
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Fecha Devolución</label>
                             <input type="date" [(ngModel)]="editSpecialLoan.endDate" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-[#ff5e14] outline-none transition-all">
                          </div>
                          <div class="col-span-2">
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Motivo / Evento</label>
                             <input [(ngModel)]="editSpecialLoan.reason" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-[#ff5e14] outline-none transition-all" placeholder="Ej: Feria Tecnológica FIDAE">
                          </div>
                       </div>
                    </div>

                    <!-- Columna 2: Individualización del Equipo -->
                    <div class="space-y-6">
                       <h4 class="text-[10px] font-black text-uah-blue uppercase tracking-[0.2em] border-b border-blue-100 pb-2 flex items-center gap-2">
                         <i class="bi bi-laptop-fill"></i> Detalle del Equipamiento
                       </h4>
                       <div class="grid grid-cols-2 gap-4">
                          <div>
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Tipo de Equipo</label>
                             <input [(ngModel)]="editSpecialLoan.itemType" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-uah-blue outline-none transition-all" placeholder="Ej: Notebook">
                          </div>
                          <div>
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Modelo</label>
                             <input [(ngModel)]="editSpecialLoan.itemModel" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-uah-blue outline-none transition-all" placeholder="Ej: Macbook Pro">
                          </div>
                          <div>
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Número / ID Físico</label>
                             <input [(ngModel)]="editSpecialLoan.itemId" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-uah-blue outline-none transition-all" placeholder="Ej: 038">
                          </div>
                          <div>
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Estado de Entrega</label>
                             <input [(ngModel)]="editSpecialLoan.deliveryCondition" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-uah-blue outline-none transition-all" placeholder="Ej: Operativo">
                          </div>
                          <div class="col-span-2">
                             <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Accesorios Incluidos</label>
                             <input [(ngModel)]="editSpecialLoan.accessories" class="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-uah-blue outline-none transition-all" placeholder="Ej: Cargador, Mouse, Maletín">
                          </div>
                       </div>

                       <h4 class="text-[10px] font-black text-uah-blue uppercase tracking-[0.2em] border-b border-blue-100 pb-2 flex items-center gap-2 pt-2">
                         <i class="bi bi-people-fill"></i> Responsables Institucionales
                       </h4>
                       <div class="space-y-4">
                          <div class="grid grid-cols-2 gap-2">
                             <div class="col-span-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                <p class="text-[8px] font-black text-uah-blue uppercase mb-2">Responsable de Entrega</p>
                                <div class="grid grid-cols-2 gap-2">
                                   <input [(ngModel)]="editSpecialLoan.respDeliveryName" class="w-full bg-white border-none rounded-lg px-3 py-2 text-[11px] font-bold" placeholder="Nombre">
                                   <input [(ngModel)]="editSpecialLoan.respDeliveryRole" class="w-full bg-white border-none rounded-lg px-3 py-2 text-[11px] font-bold" placeholder="Cargo">
                                </div>
                             </div>
                             <div class="col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p class="text-[8px] font-black text-gray-500 uppercase mb-2">Responsable de Difusión / Aval</p>
                                <div class="grid grid-cols-3 gap-2">
                                   <input [(ngModel)]="editSpecialLoan.respDiffusionName" class="w-full bg-white border-none rounded-lg px-3 py-2 text-[11px] font-bold col-span-1" placeholder="Nombre">
                                   <input [(ngModel)]="editSpecialLoan.respDiffusionRole" class="w-full bg-white border-none rounded-lg px-3 py-2 text-[11px] font-bold col-span-1" placeholder="Cargo">
                                   <input [(ngModel)]="editSpecialLoan.respDiffusionRut" class="w-full bg-white border-none rounded-lg px-3 py-2 text-[11px] font-bold col-span-1" placeholder="RUT">
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div class="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-100">
                    <button (click)="saveSpecialLoan()" class="flex-1 bg-black text-white font-black py-4 rounded-2xl hover:bg-[#ff5e14] transition-all shadow-xl text-xs tracking-widest uppercase">Guardar Cambios</button>
                    @if (editSpecialLoan.id) {
                      <button (click)="generateActaPDF(editSpecialLoan)" class="bg-[#003057] text-white font-black px-8 py-4 rounded-2xl hover:shadow-lg transition-all text-xs tracking-widest uppercase flex items-center gap-2">
                        <i class="bi bi-file-earmark-pdf"></i> Acta
                      </button>
                      <button (click)="toggleSpecialLoanStatus(editSpecialLoan)" [class]="editSpecialLoan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'" class="px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                        {{ editSpecialLoan.status === 'active' ? 'Devuelto' : 'Activo' }}
                      </button>
                      <button (click)="deleteSpecialLoan(editSpecialLoan.id!)" class="bg-red-50 text-red-500 font-bold px-6 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all text-xs uppercase flex items-center justify-center">
                        <i class="bi bi-trash"></i>
                      </button>
                    }
                 </div>
              </div>
           </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .glass-nav { @apply bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl; }
    .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
    .animate-zoomIn { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class LoansComponent implements OnInit {
  loansService = inject(LoansService);
  dataService = inject(DataService);

  currentUser = this.dataService.currentUser;
  activeView = signal<'dashboard' | 'schedule' | 'special'>('dashboard');
  
  loans = signal<EquipmentLoan[]>([]);
  specialLoans = signal<SpecialLoan[]>([]);
  inventory = signal<EquipmentInventory | null>(null);

  // Modal states
  showLoanModal = signal(false);
  showInventoryModal = signal(false);
  showSpecialModal = signal(false);
  
  selectedDayModal: DayOfWeek = 'Lunes';
  selectedBlockModal: TimeBlock = '08:30 - 09:50';
  editLoan: Partial<EquipmentLoan> = { equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 } };
  editInv: EquipmentInventory = { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 };
  editSpecialLoan: Partial<SpecialLoan> = { 
    equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 },
    detailedItems: [] 
  };

  days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  timeBlocks: TimeBlock[] = ['08:30 - 09:50', '10:00 - 11:20', '11:30 - 12:50', '13:00 - 14:20', '14:30 - 15:50', '16:00 - 17:20', '17:30 - 18:50'];

  // Signals for dashboard
  todaysLoans = computed(() => {
    const today = this.getTodayName();
    return this.loans().filter(l => l.day === today).sort((a,b) => a.timeBlock.localeCompare(b.timeBlock));
  });

  activeLoans = computed(() => {
    const today = this.getTodayName();
    const currentBlock = this.getCurrentTimeBlock();
    if (!currentBlock) return [];
    return this.loans().filter(l => l.day === today && l.timeBlock === currentBlock && l.status !== 'cancelled');
  });

  availableStock = computed(() => {
    const inv = this.inventory();
    if (!inv) return 0;
    
    // Total capacity
    const total = inv.dellLaptops + inv.macLaptops + inv.extensionCords;
    
    // Discount current active loans
    const currentlyInUse = this.activeLoans().reduce((acc, curr) => {
       return acc + curr.equipment.dellLaptops + curr.equipment.macLaptops + curr.equipment.extensionCords;
    }, 0);
    
    return Math.max(0, total - currentlyInUse);
  });

  utilizationRate = computed(() => {
    const inv = this.inventory();
    if (!inv) return 0;
    const total = inv.dellLaptops + inv.macLaptops + inv.extensionCords;
    if (total === 0) return 0;
    return Math.round(((total - this.availableStock()) / total) * 100);
  });

  criticalItemsCount = computed(() => {
    const current = this.getCurrentlyAvailableEquipment();
    let count = 0;
    if (current.dellLaptops === 0) count++;
    if (current.macLaptops === 0) count++;
    if (current.extensionCords === 0) count++;
    return count;
  });

  currentClock = signal('');
  chart: any;

  ngOnInit() {
    this.refreshData();
    this.updateClock();
    setInterval(() => this.updateClock(), 10000);
  }

  refreshData() {
    this.loansService.getLoans().subscribe(data => this.loans.set(data));
    this.loansService.getSpecialLoans().subscribe(data => this.specialLoans.set(data));
    this.loansService.getInventoryConfig().subscribe(data => {
      this.inventory.set(data);
      this.initChart();
    });
  }

  updateClock() {
    const now = new Date();
    this.currentClock.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  initChart() {
    setTimeout(() => {
      const inv = this.inventory();
      const available = this.getCurrentlyAvailableEquipment();
      if (!inv || !document.getElementById('inventoryChart')) return;

      if (this.chart) this.chart.destroy();
      
      const ctx = (document.getElementById('inventoryChart') as HTMLCanvasElement).getContext('2d');
      if (ctx) {
        this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Dell', 'Mac', 'Alarg.'],
            datasets: [
              { label: 'Uso', data: [inv.dellLaptops - available.dellLaptops, inv.macLaptops - available.macLaptops, inv.extensionCords - available.extensionCords], backgroundColor: '#003057', borderRadius: 4 },
              { label: 'Total', data: [inv.dellLaptops, inv.macLaptops, inv.extensionCords], backgroundColor: '#ff5e14', borderRadius: 4 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, display: false }, x: { grid: { display: false } } },
            plugins: { legend: { display: false } }
          }
        });
      }
    }, 100);
  }

  // Logic helpers
  getTodayName() {
    const daysArr: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 1 = Mon
    if (day < 1 || day > 5) return 'Lunes';
    return daysArr[day - 1];
  }

  getCurrentTimeBlock(): TimeBlock | null {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeNum = hours * 100 + minutes;

    for (const block of this.timeBlocks) {
      const [start, end] = block.split(' - ');
      const startNum = parseInt(start.replace(':', ''));
      const endNum = parseInt(end.replace(':', ''));
      if (timeNum >= startNum && timeNum <= endNum) return block;
    }
    return null;
  }

  nextTimeBlock(): TimeBlock | null {
      const current = this.getCurrentTimeBlock();
      if (!current) return this.timeBlocks[0];
      const idx = this.timeBlocks.indexOf(current);
      return (idx < this.timeBlocks.length - 1) ? this.timeBlocks[idx + 1] : null;
  }

  isLoanActive(loan: EquipmentLoan): boolean {
    const today = this.getTodayName();
    const current = this.getCurrentTimeBlock();
    return loan.day === today && loan.timeBlock === current;
  }

  getCurrentlyAvailableEquipment(): Equipment {
    const inv = this.inventory();
    if (!inv) return { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 };
    
    const active = this.activeLoans();
    const used = active.reduce((acc, curr) => {
      acc.dellLaptops += curr.equipment.dellLaptops;
      acc.macLaptops += curr.equipment.macLaptops;
      acc.dellChargers += curr.equipment.dellChargers;
      acc.macChargers += curr.equipment.macChargers;
      acc.extensionCords += curr.equipment.extensionCords;
      return acc;
    }, { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 });

    return {
      dellLaptops: inv.dellLaptops - used.dellLaptops,
      macLaptops: inv.macLaptops - used.macLaptops,
      dellChargers: inv.dellChargers - used.dellChargers,
      macChargers: inv.macChargers - used.macChargers,
      extensionCords: inv.extensionCords - used.extensionCords
    };
  }

  getLoanAt(day: string, block: string) {
    return this.loans().find(l => l.day === day && l.timeBlock === block);
  }

  // Handlers
  handleCellClick(day: DayOfWeek, block: TimeBlock, existing?: EquipmentLoan) {
    this.selectedDayModal = day;
    this.selectedBlockModal = block;
    if (existing) {
      this.editLoan = JSON.parse(JSON.stringify(existing)); // Deep copy
    } else {
      this.editLoan = { 
        day, 
        timeBlock: block, 
        className: '', 
        professor: '', 
        colorTheme: 'blue', 
        status: 'pending',
        equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 }
      };
    }
    this.showLoanModal.set(true);
  }

  saveLoan() {
    if (!this.editLoan.className || !this.editLoan.professor) {
       return Swal.fire('Error', 'Debe ingresar nombre de clase y profesor', 'error');
    }
    this.loansService.saveLoan(this.editLoan as EquipmentLoan).subscribe(() => {
       this.showLoanModal.set(false);
       this.refreshData();
       Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
    });
  }

  deleteLoan(id: number) {
    Swal.fire({
      title: '¿Eliminar registro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff5e14',
      cancelButtonColor: '#003057',
      confirmButtonText: 'Sí, eliminar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.loansService.deleteLoan(id).subscribe(() => {
          this.showLoanModal.set(false);
          this.refreshData();
        });
      }
    });
  }

  updateStatus(id: number, status: string) {
    this.loansService.updateLoanStatus(id, status).subscribe(() => this.refreshData());
  }

  openInventoryModal() {
    if (this.inventory()) {
      this.editInv = JSON.parse(JSON.stringify(this.inventory()));
    }
    this.showInventoryModal.set(true);
  }

  saveInventory() {
    this.loansService.updateInventoryConfig(this.editInv).subscribe(() => {
      this.showInventoryModal.set(false);
      this.refreshData();
      Swal.fire({ icon: 'success', title: 'Inventario Actualizado', timer: 1500, showConfirmButton: false });
    });
  }

  openSpecialModal(loan?: SpecialLoan) {
    if (loan) {
      this.editSpecialLoan = JSON.parse(JSON.stringify(loan));
    } else {
      const nextNum = (this.specialLoans().length > 0) 
        ? Math.max(...this.specialLoans().map(l => parseInt(l.documentNumber.replace('#', '')) || 0)) + 1 
        : 481;

      this.editSpecialLoan = {
        applicantName: '',
        applicantRut: '',
        applicantType: 'Alumno',
        reason: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        equipment: { dellLaptops: 0, macLaptops: 0, dellChargers: 0, macChargers: 0, extensionCords: 0 },
        detailedItems: [],
        status: 'active',
        documentNumber: `#${nextNum}`,
        itemType: 'Notebook',
        itemModel: '',
        itemId: '',
        accessories: '',
        deliveryCondition: 'Operativo y en óptimas condiciones',
        respDeliveryName: '',
        respDeliveryRole: '',
        respDiffusionName: '',
        respDiffusionRole: '',
        respDiffusionRut: ''
      };
    }
    this.showSpecialModal.set(true);
  }

  saveSpecialLoan() {
    if (!this.editSpecialLoan.applicantName || !this.editSpecialLoan.applicantRut) {
      return Swal.fire('Error', 'Faltan datos del solicitante', 'error');
    }
    this.loansService.saveSpecialLoan(this.editSpecialLoan as SpecialLoan).subscribe(() => {
      this.showSpecialModal.set(false);
      this.refreshData();
      Swal.fire({ icon: 'success', title: 'Préstamo Especial Registrado', timer: 1500, showConfirmButton: false });
    });
  }

  toggleSpecialLoanStatus(loan: Partial<SpecialLoan>) {
    loan.status = loan.status === 'active' ? 'returned' : 'active';
    this.loansService.saveSpecialLoan(loan as SpecialLoan).subscribe(() => this.refreshData());
  }

  deleteSpecialLoan(id: number) {
    Swal.fire({
      title: '¿Eliminar préstamo especial?',
      text: "Esta acción no se puede deshacer y eliminará el registro de la base de datos.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#003057',
      confirmButtonText: 'Sí, eliminar permanentemente',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.loansService.deleteSpecialLoan(id).subscribe(() => {
          this.showSpecialModal.set(false);
          this.refreshData();
          Swal.fire('Eliminado', 'El préstamo ha sido removido.', 'success');
        });
      }
    });
  }

  async generateActaPDF(loan: any) {
    const doc = new jsPDF('p', 'pt', 'a4') as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- Header ---
    try {
        const logoData = await this.getBase64ImageFromURL('assets/images/uah-insignia.jpg');
        doc.addImage(logoData, 'JPEG', 40, 40, 60, 60);
    } catch (e) { console.warn("No se pudo cargar el logo local", e); }

    doc.setTextColor(0, 51, 102); 
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIVERSIDAD ALBERTO HURTADO', pageWidth - 40, 55, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Facultad de Ingeniería', pageWidth - 40, 70, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Laboratorio de Desarrollo Tecnológico', pageWidth - 40, 82, { align: 'right' });

    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(2);
    doc.line(40, 105, pageWidth - 40, 105);

    // --- Título ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('ACTA DE PRÉSTAMO DE EQUIPAMIENTO', pageWidth / 2, 140, { align: 'center' });
    
    // --- 1. Antecedentes ---
    this.drawSectionHeader(doc, '1. ANTECEDENTES DEL PRÉSTAMO', 170);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const introText = `En Santiago, a ${this.formatDateSp(loan.startDate)}, se formaliza la entrega de equipamiento en calidad de préstamo, perteneciente al Laboratorio de Desarrollo Tecnológico de la Universidad Alberto Hurtado.`;
    const splitIntro = doc.splitTextToSize(introText, pageWidth - 80);
    doc.text(splitIntro, 40, 195);

    doc.setFillColor(245, 245, 245);
    doc.rect(40, 215, pageWidth - 80, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha de Inicio: ${this.formatDateSp(loan.startDate)}`, 55, 232);
    doc.text(`Fecha de Devolución: ${this.formatDateSp(loan.endDate)}`, pageWidth / 2 + 10, 232);

    // --- 2. Individualización del Equipo ---
    this.drawSectionHeader(doc, '2. INDIVIDUALIZACIÓN DEL EQUIPO', 265);
    autoTable(doc, {
      startY: 285,
      margin: { left: 40, right: 40 },
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 9, cellPadding: 6 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [250, 250, 250], cellWidth: 150 } },
      body: [
        ['Tipo de Equipo', loan.itemType || 'Notebook'],
        ['Modelo', loan.itemModel || 'N/A'],
        ['Número / ID', loan.itemId || 'N/A'],
        ['Accesorios', loan.accessories || 'Ninguno'],
        ['Estado Entrega', loan.deliveryCondition || 'Operativo']
      ]
    });

    // --- 3. Identificación de las Partes ---
    const finalY2 = (doc as any).lastAutoTable.finalY || 400;
    this.drawSectionHeader(doc, '3. IDENTIFICACIÓN DE LAS PARTES', finalY2 + 20);
    
    autoTable(doc, {
        startY: finalY2 + 40,
        margin: { left: 40, right: 40 },
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 8 },
        head: [['USUARIO (SOLICITANTE)', 'RESPONSABLE ENTREGA', 'RESPONSABLE DIFUSIÓN']],
        headStyles: { fillColor: [240, 245, 255], textColor: [0, 51, 102], fontSize: 7, fontStyle: 'bold' },
        body: [
          [
            `Nombre: ${loan.applicantName}\nUnidad: ${loan.applicantType}\nRut: ${loan.applicantRut}`,
            `Nombre: ${loan.respDeliveryName || 'N/A'}\nCargo: ${loan.respDeliveryRole || ''}`,
            `Nombre: ${loan.respDiffusionName || 'N/A'}\nCargo: ${loan.respDiffusionRole || ''}\nRut: ${loan.respDiffusionRut || ''}`
          ]
        ]
    });

    // --- 4. Compromisos ---
    const finalY3 = (doc as any).lastAutoTable.finalY || 550;
    this.drawSectionHeader(doc, '4. COMPROMISO Y RESPONSABILIDAD', finalY3 + 20);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const commitments = [
        "1. El usuario utilizará el equipo exclusivamente para fines académicos y de desarrollo institucional.",
        "2. Es responsabilidad del usuario la custodia y buen trato del hardware y software entregado.",
        `3. La devolución se realizará impostergablemente el día ${this.formatDateSp(loan.endDate)} en el Laboratorio.`,
        "4. En caso de daño, pérdida o robo por negligencia, el usuario acepta la responsabilidad de reposición del bien."
    ];
    let currentY = finalY3 + 45;
    commitments.forEach(c => {
        doc.text(c, 50, currentY);
        currentY += 15;
    });

    // --- Firmas ---
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(80, 750, 220, 750);
    doc.line(pageWidth - 220, 750, pageWidth - 80, 750);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(loan.applicantName, 150, 765, { align: 'center' });
    doc.text(loan.respDeliveryName || '', pageWidth - 150, 765, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('FIRMA USUARIO', 150, 775, { align: 'center' });
    doc.text((loan.respDeliveryRole || '').toUpperCase(), pageWidth - 150, 775, { align: 'center' });

    // --- Footer ---
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`© ${new Date().getFullYear()} Universidad Alberto Hurtado - Facultad de Ingeniería - Documento de Control Interno`, pageWidth / 2, 810, { align: 'center' });

    doc.save(`Acta_Prestamo_${loan.documentNumber.replace('#', '')}_${loan.applicantName.replace(/\s+/g, '_')}.pdf`);
  }

  private drawSectionHeader(doc: any, title: string, y: number) {
    doc.setFillColor(240, 245, 255);
    doc.rect(40, y, doc.internal.pageSize.getWidth() - 80, 20, 'F');
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(2);
    doc.line(40, y, 40, y + 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(title, 50, y + 13);
    doc.setTextColor(0, 0, 0);
  }

  private formatDateSp(dateStr: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${date.getUTCDate()} de ${months[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
  }

  private getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg");
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  }

  exportToJSON() {
    const dataStr = JSON.stringify(this.loans(), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `malla_equipos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }

  exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,ID,Clase,Profesor,Dia,Bloque,Dell,Mac,Estado\n";
    this.loans().forEach(l => {
      csvContent += `${l.id},"${l.className}","${l.professor}",${l.day},${l.timeBlock},${l.equipment.dellLaptops},${l.equipment.macLaptops},${l.status}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "malla_equipos.csv");
    document.body.appendChild(link);
    link.click();
  }
}
