import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';

declare const Swal: any;

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 animate-fadeIn pb-20">
      <!-- Encabezado Estilo Cero Azul -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/60 dark:bg-gray-800/60 p-6 rounded-3xl shadow-lg border border-white/40 dark:border-gray-700 backdrop-blur-xl">
        <div>
          <h1 class="text-3xl md:text-5xl font-black text-black dark:text-white tracking-tighter uppercase leading-none overflow-hidden">
            RESERVA DE ESPACIOS
          </h1>
          <p class="text-gray-400 font-bold mt-2 uppercase text-[10px] tracking-[0.2em] ml-1">Gestión de salas, laboratorios y recintos universitarios</p>
        </div>
         <button *ngIf="isAdmin()" (click)="openCreateModal()" 
                 class="bg-uah-orange hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 uppercase text-xs tracking-tighter mt-4 md:mt-0">
           <i class="bi bi-plus-circle-fill text-xl"></i> NUEVA SALA / LAB
         </button>
       </div>

      <!-- Buscador y Filtros -->
      <div class="mb-10 flex flex-col lg:flex-row gap-6 items-stretch" *ngIf="!selectedRoom()">
        <div class="flex-grow">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Buscador Inteligente</label>
          <div class="relative group">
            <i class="bi bi-search absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-uah-orange transition-colors"></i>
            <input type="text" [(ngModel)]="searchText" placeholder="Escriba nombre, capacidad o ubicación..."
                   class="w-full pl-16 pr-6 py-5 rounded-[2.5rem] border-2 border-transparent focus:border-uah-orange bg-white dark:bg-gray-800 shadow-sm text-lg font-bold transition-all text-black" />
          </div>
        </div>
        <button (click)="loadRooms()" class="bg-black hover:bg-gray-900 text-white p-5 rounded-[2rem] shadow-sm border border-black self-end h-[70px]">
          <i class="bi bi-arrow-clockwise text-2xl"></i>
        </button>
      </div>

      <!-- Listado de Salas (Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16" *ngIf="!selectedRoom()">
        <div *ngFor="let room of filteredRooms()" (click)="selectRoom(room)" 
             class="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-xl cursor-pointer hover:-translate-y-3 hover:shadow-2xl transition-all border border-gray-100 relative group overflow-hidden">
          
          <div class="flex justify-between items-start mb-6">
             <div class="h-16 w-16 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-black group-hover:bg-uah-orange group-hover:text-white transition-all transform group-hover:rotate-6">
              <i class="bi bi-building-fill text-3xl"></i>
            </div>
            <span class="bg-gray-100 dark:bg-gray-700 text-gray-500 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{{ room.tipo }}</span>
          </div>

          <h3 class="text-2xl font-black text-gray-800 dark:text-white mb-2 uppercase tracking-tighter">{{ room.nombre }}</h3>
          <p class="text-xs font-bold text-gray-400 uppercase mb-6"><i class="bi bi-geo-alt-fill text-uah-orange"></i> {{ room.ubicacionPiso }}</p>
          
          <div class="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-tighter text-gray-500 mb-6">
             <span class="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"><i class="bi bi-people-fill"></i> {{ room.capacidadMaxima }} PERS.</span>
             <span class="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"><i class="bi bi-aspect-ratio"></i> {{ room.metrosCuadrados || 0 }} M²</span>
             <span class="flex items-center gap-2 bg-orange-50 text-uah-orange px-3 py-1 rounded-lg"><i class="bi bi-currency-dollar"></i> {{ room.valorHora | number:'1.0-0' }} HR</span>
          </div>
          <!-- Real-time Status Indicator Premium -->
          <div class="mb-6 p-4 rounded-2xl border transition-all duration-500"
               [class]="isCurrentlyFree(room) ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20' : 'bg-orange-50/30 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/20'">
             <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2">
                   <div class="h-2 w-2 rounded-full" 
                        [class.bg-emerald-500]="isCurrentlyFree(room)" 
                        [style.background-color]="!isCurrentlyFree(room) ? '#f06427' : ''"
                        [class.animate-pulse]="!isCurrentlyFree(room)"></div>
                   <span class="text-[8px] font-black uppercase tracking-[0.1em]" [class.text-emerald-600]="isCurrentlyFree(room)" [class.text-uah-orange]="!isCurrentlyFree(room)">
                      {{ isCurrentlyFree(room) ? 'Disponible' : 'Ocupado' }}
                   </span>
                </div>
                <span *ngIf="!isCurrentlyFree(room)" class="text-[7px] font-black text-white bg-[#f06427] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
             </div>
             <p class="text-[10px] font-black text-gray-700 dark:text-white truncate uppercase tracking-tighter">
                {{ getCurrentOccupation(room) }}
             </p>
          </div>

          <!-- Quick Equipment Icons -->
          <div class="flex flex-wrap gap-2 mb-8 h-auto min-h-4">
             <i *ngIf="room.tieneAireAcondicionado" class="bi bi-snow text-cyan-400" title="Aire"></i>
             <i *ngIf="room.tieneProyector" class="bi bi-projector text-orange-400" title="Proyector"></i>
             <i *ngIf="room.tienePizarra" class="bi bi-pencil-square text-green-400" title="Pizarra"></i>
             <i *ngIf="room.tienePizarraInteligente" class="bi bi-easel2-fill text-green-600" title="Pizarra Inteligente"></i>
             <i *ngIf="room.tieneAudio" class="bi bi-speaker text-purple-400" title="Audio"></i>
             <i *ngIf="room.tieneTelevisor" class="bi bi-tv text-blue-400" title="TV"></i>
             <i *ngIf="room.tieneComputadores" class="bi bi-pc-display text-gray-400" title="PCs"></i>
             <i *ngIf="room.tieneNotebooks" class="bi bi-laptop text-gray-500" title="Notebooks"></i>
             <i *ngIf="room.tieneMicrofono" class="bi bi-mic text-red-400" title="Micro"></i>
             <i *ngIf="room.tieneLavadero" class="bi bi-droplet text-blue-300" title="Lavadero"></i>
             <i *ngIf="room.tieneDucha" class="bi bi-moisture text-blue-500" title="Ducha"></i>
             <i *ngIf="room.tieneBano" class="bi bi-person-door text-gray-400" title="Baño"></i>
             <span *ngIf="room.otrosEquipos" class="text-[9px] text-gray-400 font-bold italic truncate flex-1">+ {{ room.otrosEquipos }}</span>
          </div>

          <div class="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <span class="text-black font-black text-[10px] uppercase tracking-widest group-hover:text-uah-orange transition-colors">Ver Disponibilidad</span>
            <div *ngIf="isAdmin()" class="flex gap-2">
               <button (click)="$event.stopPropagation(); editRoom(room)" class="p-2 hover:bg-gray-100 text-gray-800 transition-all rounded-lg"><i class="bi bi-pencil-square"></i></button>
               <button (click)="$event.stopPropagation(); borrarSalaDefinitivamente(room.id)" class="p-2 hover:bg-red-50 text-red-500 transition-all rounded-lg"><i class="bi bi-trash-fill"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- VISTA TIPO HORARIO ACADÉMICO (Seleccionada) -->
      <div *ngIf="selectedRoom()" class="animate-fadeIn">
        <div class="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <button (click)="selectedRoom.set(null)" class="bg-black hover:bg-gray-950 text-white px-8 py-4 rounded-2xl text-[10px] font-black flex items-center gap-3 transition-all shadow-md uppercase tracking-widest">
              <i class="bi bi-grid-fill"></i> Volver al listado
            </button>
            
            <div class="flex items-center gap-6 bg-white dark:bg-gray-800 p-2 rounded-[2rem] shadow-xl border border-white/40">
                <button (click)="changeWeek(-1)" class="p-4 hover:bg-gray-100 rounded-2xl transition-all text-black"><i class="bi bi-chevron-left text-xl"></i></button>
                <div class="flex flex-col items-center min-w-[220px]">
                    <span class="text-[9px] font-black text-uah-orange uppercase tracking-[0.3em] mb-1">{{ currentMonthYear }}</span>
                    <span class="text-sm font-black text-black dark:text-gray-100 uppercase tracking-tighter">{{ currentWeekRange }}</span>
                </div>
                <button (click)="changeWeek(1)" class="p-4 hover:bg-gray-100 rounded-2xl transition-all text-black"><i class="bi bi-chevron-right text-xl"></i></button>
            </div>
            
            <div class="flex gap-3">
                <button *ngIf="isAdmin()" (click)="blockFullDay()" class="bg-uah-orange hover:bg-orange-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest active:scale-90">
                    <i class="bi bi-lock-fill"></i> Bloquear Día
                </button>
                <div class="relative group">
                   <input type="date" [(ngModel)]="baseDate" (change)="onDateChange()" 
                          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                   <button class="bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black transition-all shadow-lg flex items-center gap-3 uppercase tracking-widest pointer-events-none">
                       <i class="bi bi-calendar3"></i> Ir a Fecha
                   </button>
                </div>
            </div>
        </div>

        <!-- El Panel del Horario (Negro Total con Letras Blancas) -->
        <div class="bg-white/80 dark:bg-gray-900/80 rounded-[3rem] shadow-2xl overflow-hidden border border-white/50 dark:border-gray-700 relative backdrop-blur-3xl min-h-[600px]">
           <div class="bg-black p-10 flex flex-col md:flex-row justify-between items-center text-white gap-8 border-b-4 border-uah-orange">
              <div>
                  <div class="flex items-center gap-4 mb-3">
                     <span class="px-4 py-1.5 bg-white/10 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase border border-white/10">{{ selectedRoom()?.tipo }}</span>
                     <span class="text-uah-orange font-black text-[10px] tracking-widest uppercase"><i class="bi bi-geo-alt-fill"></i> {{ selectedRoom()?.ubicacionPiso }}</span>
                  </div>
                  <h2 class="text-5xl font-black tracking-tighter uppercase leading-none text-white">{{ selectedRoom()?.nombre }}</h2>
              </div>
              <div class="flex gap-10 text-center bg-white/5 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
                 <div><p class="text-[9px] opacity-60 font-black uppercase mb-1 tracking-widest">Aforo</p><p class="text-3xl font-black">{{ selectedRoom()?.capacidadMaxima }}</p></div>
                 <div><p class="text-[9px] opacity-60 font-black uppercase mb-1 tracking-widest">Mts²</p><p class="text-3xl font-black">{{ selectedRoom()?.metrosCuadrados || 0 }}</p></div>
                 <div><p class="text-[9px] opacity-60 font-black uppercase mb-1 tracking-widest">Precio/Hr</p><p class="text-3xl font-black text-uah-orange">$ {{ selectedRoom()?.valorHora | number:'1.0-0' }}</p></div>
               </div>
               
               <div class="mt-8 flex flex-wrap gap-3 justify-center">
                  <span *ngIf="selectedRoom()?.tieneAireAcondicionado" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-snow text-cyan-400"></i> Aire</span>
                  <span *ngIf="selectedRoom()?.tieneProyector" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-projector text-orange-400"></i> Proyector</span>
                  <span *ngIf="selectedRoom()?.tienePizarra" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-pencil-square text-green-400"></i> Pizarra</span>
                  <span *ngIf="selectedRoom()?.tienePizarraInteligente" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-easel2-fill text-green-600"></i> Pizarra Inteligente</span>
                  <span *ngIf="selectedRoom()?.tieneAudio" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-speaker text-purple-400"></i> Audio</span>
                  <span *ngIf="selectedRoom()?.tieneTelevisor" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-tv text-blue-400"></i> TV</span>
                  <span *ngIf="selectedRoom()?.tieneComputadores" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-pc-display text-gray-400"></i> PCs</span>
                  <span *ngIf="selectedRoom()?.tieneNotebooks" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-laptop text-gray-500"></i> Notebooks</span>
                  <span *ngIf="selectedRoom()?.tieneMicrofono" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-mic text-red-500"></i> Micro.</span>
                  <span *ngIf="selectedRoom()?.tieneLavadero" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-droplet text-blue-300"></i> Lavadero</span>
                  <span *ngIf="selectedRoom()?.tieneDucha" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-moisture text-blue-500"></i> Ducha</span>
                  <span *ngIf="selectedRoom()?.tieneBano" class="px-4 py-2 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"><i class="bi bi-person-door text-gray-400"></i> Baño</span>
               </div>
           </div>
           
           <div class="p-10">
              <div class="overflow-x-auto custom-scrollbar">
                  <div class="min-w-[1100px]">
                      <!-- Header Días (Sin fechas, barra naranja) -->
                      <div class="grid grid-cols-6 gap-6 mb-8">
                          <div class="text-center font-black text-gray-400 text-[9px] tracking-[0.3em] uppercase self-end pb-4">BLOQUE HORARIO</div>
                          @for (day of weekDays; track day.date) {
                              <div class="text-center group">
                                  <div class="font-black text-black dark:text-gray-100 text-2xl uppercase tracking-tighter mb-1 transition-all group-hover:text-uah-orange">{{ day.name }}</div>
                                  <div class="h-1.5 w-16 bg-uah-orange rounded-full mx-auto mt-2 opacity-30 group-hover:opacity-100 transition-opacity"></div>
                              </div>
                          }
                      </div>

                      <!-- Grilla de Bloques -->
                      <div *ngIf="loadingBlocks()" class="py-32 text-center">
                          <i class="bi bi-arrow-repeat animate-spin text-7xl text-black/20"></i>
                      </div>

                      <div *ngIf="!loadingBlocks()" class="space-y-6">
                          @for (block of roomBlocks(); track block.id) {
                              <div class="grid grid-cols-6 gap-6 group">
                                  <!-- Celda Hora -->
                                   <div class="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 transition-all group-hover:bg-gray-100 shadow-inner">
                                      <span class="text-sm font-black text-gray-800 dark:text-white">{{ block.horaInicio }} - {{ block.horaFin }}</span>
                                  </div>

                                  <!-- Celdas Días -->
                                  @for (day of weekDays; track day.date) {
                                      <div (click)="handleCellClick(block, day.date, getBlockStatusForDate(block, day.date))"
                                           class="relative min-h-[100px] rounded-3xl border transition-all duration-500 flex flex-col justify-center items-center p-4 text-center cursor-pointer overflow-hidden active:scale-95"
                                           [class]="getBlockStatusForDate(block, day.date) !== 'Disponible' ? 'shadow-lg hover:-translate-y-1' : 'bg-white/40 border-gray-100 opacity-60 hover:opacity-100 hover:bg-gray-50'"
                                           [style.backgroundColor]="getReservationForBlockAndDate(block.id, day.date)?.color ? getReservationForBlockAndDate(block.id, day.date).color + '20' : (getBlockStatusForDate(block, day.date) === 'Ocupado (Clase)' ? '#ef444420' : (getBlockStatusForDate(block, day.date) !== 'Disponible' ? '#00000020' : ''))"
                                           [style.borderColor]="getReservationForBlockAndDate(block.id, day.date)?.color || (getBlockStatusForDate(block, day.date) === 'Ocupado (Clase)' ? '#ef4444' : (getBlockStatusForDate(block, day.date) !== 'Disponible' ? '#000000' : ''))">
                                          
                                          @if (getBlockStatusForDate(block, day.date) === 'Ocupado (Clase)') {
                                              <span class="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">OCUPADO (CLASE)</span>
                                              <div class="font-bold text-gray-800 text-[10px] leading-tight line-clamp-2">
                                                 {{ getClassName(block, day.date) }}
                                              </div>
                                          } @else if (getBlockStatusForDate(block, day.date) !== 'Disponible') {
                                              <span class="text-[9px] font-black uppercase tracking-widest mb-1" [style.color]="getReservationForBlockAndDate(block.id, day.date)?.color || '#000000'">
                                                {{ getBlockStatusForDate(block, day.date).toUpperCase() }}
                                              </span>
                                              <div class="font-bold text-gray-800 text-[10px] leading-tight line-clamp-2">
                                                  {{ getReservationForBlockAndDate(block.id, day.date)?.motivo }}
                                              </div>
                                          } @else {
                                              <span class="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-20">Disponible</span>
                                          }
                                      </div>
                                  }
                              </div>
                          }
                      </div>

                      <!-- Leyenda Inferior -->
                      <div class="mt-12 flex flex-wrap justify-center gap-8 pt-8 border-t border-gray-100">
                          <div class="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span class="h-3 w-3 rounded-full bg-gray-200"></span> Disponible
                          </div>
                          <div class="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span class="h-3 w-3 rounded-full bg-uah-orange"></span> Pendiente
                          </div>
                          <div class="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span class="h-3 w-3 rounded-full bg-black"></span> Aprobada
                          </div>
                          <div class="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span class="h-3 w-3 rounded-full bg-red-500"></span> Clase Académica
                          </div>
                      </div>
                      <div class="text-center mt-6 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        <i class="bi bi-info-circle-fill"></i> Los bloques marcados indican disponibilidad y reservas institucionales.
                      </div>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
  `]
})
export class RoomsComponent implements OnInit {
  data = inject(DataService);
  allRooms = signal<any[]>([]);
  selectedRoom = signal<any>(null);
  roomBlocks = signal<any[]>([]);
  allPendingReservations = signal<any[]>([]);
  allReservationsForWeek = signal<any[]>([]);
  searchText = '';
  loadingBlocks = signal(false);
  baseDate = '';
  weekDays: any[] = [];
  
  // Modal de reserva
  showReserveModal = false;
  reserveRoom: any = null;
  reserveBlock: any = null;
  reserveDate = '';
  reserveMotivo = '';
  reserveColor = '#3b82f6';

  // Computed
  isAdmin = computed(() => ['Admin_Labs', 'SuperUser'].includes(this.data.currentUser()?.rol || ''));
  isAlumno = computed(() => this.data.currentUser()?.rol === 'Alumno');
  canApprove = computed(() => ['Admin_Labs', 'SuperUser'].includes(this.data.currentUser()?.rol || ''));

  filteredRooms = computed(() => {
    const term = this.searchText.toLowerCase().trim();
    if (!term) return this.allRooms();
    return this.allRooms().filter(r => 
      r.nombre?.toLowerCase().includes(term) ||
      r.tipo?.toLowerCase().includes(term) ||
      r.ubicacionPiso?.toLowerCase().includes(term)
    );
  });

  allPendingReservationsFiltered = computed(() => this.allPendingReservations().filter(r => r.estado === 'Pendiente'));

  currentMonthYear = '';
  currentWeekRange = '';

  allRoomsCount = computed(() => this.allRooms().length);
  allGlobalReservations = signal<any[]>([]);

  ngOnInit() {
    this.loadRooms();
    this.loadTodayGlobalReservations();
    if (this.canApprove()) this.loadAllReservations();

    // Auto-actualizar cada 1 minuto
    setInterval(() => {
       this.loadRooms();
       this.loadTodayGlobalReservations();
    }, 60000);
  }

  async loadTodayGlobalReservations() {
      const today = new Date().toISOString().split('T')[0];
      try {
        const res = await fetch(`/api/room-reservations?fecha=${today}`, { headers: this.getHeaders() });
        if (res.ok) this.allGlobalReservations.set(await res.json());
      } catch(e) {}
   }

   /** Determina si una sala está libre en este instante */
   isCurrentlyFree(room: any): boolean {
      return this.getCurrentOccupation(room) === 'Sin Actividad';
   }

   /** Obtiene la actividad actual (Clase o Reserva) */
   getCurrentOccupation(room: any): string {
      const now = new Date();
      const HH = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${HH}:${mm}`;
      
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const currentDay = dayNames[now.getDay()].toUpperCase();
      const norm = (s: string) => s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
      const roomName = norm(room.nombre);

      // 1. Prioridad: Clases Programadas (Academic Schedule)
      const currentClass = this.data.classSchedules().find(s => {
          if (norm(s.lab) !== roomName || norm(s.day) !== norm(currentDay)) return false;
          // Match by time range if block contains it (e.g. "08:30 - 09:50")
          if (s.block.includes('-')) {
             const [start, end] = s.block.split('-').map(t => t.trim());
             return currentTime >= start && currentTime <= end;
          }
          // Match by standard block (approximate)
          const blocks: any = { 'BLOQUE 1': ['08:30','09:50'], 'BLOQUE 2': ['10:00','11:20'], 'BLOQUE 3': ['11:30','12:50'], 'BLOQUE 4': ['13:00','14:20'], 'BLOQUE 5': ['14:30','15:50'], 'BLOQUE 6': ['16:00','17:20'], 'BLOQUE 7': ['17:30','18:50'] };
          const range = blocks[s.block.toUpperCase()];
          if (range) return currentTime >= range[0] && currentTime <= range[1];
          return false;
      });

      if (currentClass) return currentClass.subject;

      // 2. Reservas Puntuales (Bloqueos Admin, Eventos)
      const reservation = this.allGlobalReservations().find(r => {
          if (r.roomId !== room.id || r.estado !== 'Aprobada') return false;
          // Asumimos bloques estándar para matching rápido si no tenemos los bloques de cada sala cargados
          const blocks: any = { 1: ['08:30','09:50'], 2: ['10:00','11:20'], 3: ['11:30','12:50'], 4: ['13:00','14:20'], 5: ['14:30','15:50'], 6: ['16:00','17:20'], 7: ['17:30','18:50'] };
          // El ID de bloque por defecto suele ser correlativo (1-7) si es una sala nueva
          // Si no, buscamos en los blocks cargados (si es que la sala está seleccionada)
          let range = blocks[r.roomBlockId % 7 || 7]; 
          
          if (this.selectedRoom()?.id === room.id && this.roomBlocks().length > 0) {
             const b = this.roomBlocks().find(b => b.id === r.roomBlockId);
             if (b) range = [b.horaInicio, b.horaFin];
          }

          return range && currentTime >= range[0] && currentTime <= range[1];
      });

      if (reservation) return reservation.motivo;

      return 'Sin Actividad';
   }

  getHeaders() {
    return { 'Authorization': 'Bearer ' + this.data.token(), 'Content-Type': 'application/json' };
  }

  async loadRooms() {
    try {
      const res = await fetch('/api/rooms', { headers: this.getHeaders() });
      if (res.ok) this.allRooms.set(await res.json());
    } catch (e) { console.error(e); }
  }

  async loadAllReservations() {
      try {
        const res = await fetch('/api/room-reservations', { headers: this.getHeaders() });
        if (res.ok) this.allPendingReservations.set(await res.json());
      } catch(e) {}
  }

  selectRoom(room: any) {
    this.selectedRoom.set(room);
    this.baseDate = new Date().toISOString().split('T')[0];
    this.calculateWeek(new Date(this.baseDate + 'T12:00:00'));
    this.loadWeekData();
  }

  calculateWeek(date: Date) {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    this.weekDays = days.map((name, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return {
            name,
            date: d.toISOString().split('T')[0]
        };
    });

    const first = new Date(this.weekDays[0].date + 'T12:00:00');
    const last = new Date(this.weekDays[4].date + 'T12:00:00');
    this.currentMonthYear = first.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }).toUpperCase();
    this.currentWeekRange = `Del ${first.getDate()} al ${last.getDate()} de ${last.toLocaleDateString('es-CL', { month: 'short' }).toUpperCase()}`;
  }

  async loadWeekData() {
    if (!this.selectedRoom()) return;
    this.loadingBlocks.set(true);
    const rid = this.selectedRoom().id;
    try {
      const blocksRes = await fetch(`/api/rooms/${rid}/blocks`, { headers: this.getHeaders() });
      if (blocksRes.ok) this.roomBlocks.set(await blocksRes.json());

      const resData: any[] = [];
      await Promise.all(this.weekDays.map(async d => {
          const r = await fetch(`/api/room-reservations?roomId=${rid}&fecha=${d.date}`, { headers: this.getHeaders() });
          if (r.ok) resData.push(...(await r.json()));
      }));
      this.allReservationsForWeek.set(resData);
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingBlocks.set(false);
    }
  }

  onDateChange() {
      if (!this.baseDate) return;
      this.calculateWeek(new Date(this.baseDate + 'T12:00:00'));
      this.loadWeekData();
  }

  changeWeek(dir: number) {
      const d = new Date(this.weekDays[0].date + 'T12:00:00');
      d.setDate(d.getDate() + (dir * 7));
      this.baseDate = d.toISOString().split('T')[0];
      this.calculateWeek(d);
      this.loadWeekData();
  }

  isToday(date: string) { return date === new Date().toISOString().split('T')[0]; }

  getClassName(block: any, date: string): string {
      const room = this.selectedRoom();
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(date + 'T12:00:00').getDay()];
      const norm = (s: string) => s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
      
      const roomName = norm(room.nombre);
      const day = norm(dayName);
      const bName = norm(block.nombreBloque);
      const bRange = norm(`${block.horaInicio} - ${block.horaFin}`);

      const s = this.data.classSchedules().find(s => 
         norm(s.lab) === roomName && norm(s.day) === day && (norm(s.block) === bName || norm(s.block) === bRange)
      );
      return s ? s.subject : '';
   }

  getBlockStatusForDate(block: any, date: string): string {
     const room = this.selectedRoom();
     const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(date + 'T12:00:00').getDay()];
     const norm = (s: string) => s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
     
     const roomName = norm(room.nombre);
     const day = norm(dayName);
     const bName = norm(block.nombreBloque);
     const bRange = norm(`${block.horaInicio} - ${block.horaFin}`);

     const isClass = this.data.classSchedules().some(s => 
        norm(s.lab) === roomName && norm(s.day) === day && (norm(s.block) === bName || norm(s.block) === bRange)
     );
     if (isClass) return 'Ocupado (Clase)';

     const activeRes = this.allReservationsForWeek().find(r => 
        r.roomBlockId === block.id && r.fechaExacta === date && (r.estado === 'Aprobada' || r.estado === 'Pendiente')
     );
     if (activeRes) return activeRes.estado;
     return 'Disponible';
  }



  getReservationForBlockAndDate(blockId: number, date: string) {
      return this.allReservationsForWeek().find(r => r.roomBlockId === blockId && r.fechaExacta === date);
  }

  handleCellClick(block: any, date: string, status: string) {
      if (this.isAlumno()) {
          Swal.fire({ title: 'Acceso Restringido', text: 'Los alumnos no pueden reservar salas directamente.', icon: 'info' });
          return;
      }

      if (status === 'Disponible') {
           this.openReserveModal(block, date);
      } else if (status === 'Aprobada' || status === 'Pendiente') {
          const res = this.getReservationForBlockAndDate(block.id, date);
          if (res) this.showReservationDetails(res);
      }
  }

  async openReserveModal(block: any, date: string) {
      const colors = [
          { name: 'Azul', hex: '#3b82f6' },
          { name: 'Esmeralda', hex: '#10b981' },
          { name: 'Naranja', hex: '#f97316' },
          { name: 'Rojo', hex: '#ef4444' },
          { name: 'Púrpura', hex: '#8b5cf6' },
          { name: 'Rosa', hex: '#ec4899' },
          { name: 'Cian', hex: '#06b6d4' },
          { name: 'Indigo', hex: '#6366f1' }
      ];

      const { value: formValues } = await Swal.fire({
          title: 'CONFIGURAR RESERVA',
          html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Motivo de la Reserva</label>
                    <input id="swal-motivo" class="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-uah-orange outline-none font-bold" placeholder="Ej: Laboratorio de Redes - Grupo A">
                </div>
                <div>
                   <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Identificador de Color</label>
                   <div class="flex flex-wrap gap-2">
                      ${colors.map(c => `
                        <button type="button" onclick="window.setSwalColor('${c.hex}')" 
                                class="w-8 h-8 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-125" 
                                style="background-color: ${c.hex}" title="${c.name}"></button>
                      `).join('')}
                   </div>
                   <input type="hidden" id="swal-color" value="#3b82f6">
                </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'CONFIRMAR RESERVA',
          cancelButtonText: 'CANCELAR',
          didOpen: () => {
              (window as any).setSwalColor = (hex: string) => {
                  (document.getElementById('swal-color') as HTMLInputElement).value = hex;
                  const dots = document.querySelectorAll('button[onclick^="window.setSwalColor"]');
                  dots.forEach((d: any) => d.style.transform = d.style.backgroundColor === hex ? 'scale(1.25)' : 'scale(1)');
              };
          },
          preConfirm: () => {
              return {
                  motivo: (document.getElementById('swal-motivo') as HTMLInputElement).value,
                  color: (document.getElementById('swal-color') as HTMLInputElement).value
              }
          }
      });

      if (formValues && formValues.motivo) {
          this.createReservation(block.id, date, formValues.motivo, formValues.color);
      }
  }

  async createReservation(blockId: number, date: string, motivo: string, color: string) {
      const body = {
          roomId: this.selectedRoom().id,
          roomBlockId: blockId,
          fechaExacta: date,
          motivo,
          color,
          createdBy: this.data.currentUser()?.nombreCompleto || 'Usuario',
          estado: this.isAdmin() ? 'Aprobada' : 'Pendiente'
      };

      try {
          const res = await fetch('/api/room-reservations', {
              method: 'POST',
              headers: this.getHeaders(),
              body: JSON.stringify(body)
          });
          if (res.ok) {
              Swal.fire({ title: 'Éxito', text: 'Reserva gestionada correctamente.', icon: 'success', timer: 1500, showConfirmButton: false });
              this.loadWeekData();
          }
      } catch (e) {}
  }

  showReservationDetails(res: any) {
      const isAprobada = res.estado === 'Aprobada';
      Swal.fire({
          title: 'Gestión de Reserva',
          html: `<div class="text-left p-4 bg-gray-50 rounded-2xl uppercase font-black text-[10px] space-y-1">
                  <p><b>Motivo:</b> ${res.motivo}</p>
                  <p><b>Reservado por:</b> ${res.createdBy}</p>
                  <p><b>Estado:</b> ${res.estado}</p>
                 </div>`,
          showCancelButton: true,
          confirmButtonText: isAprobada ? 'BORRAR RESERVA' : 'APROBAR RESERVA',
          confirmButtonColor: isAprobada ? '#ef4444' : '#10b981',
          cancelButtonText: 'CERRAR',
      }).then((result: any) => {
          if (result.isConfirmed) {
              if (isAprobada) this.updateStatus(res.id, 'Cancelada');
              else this.updateStatus(res.id, 'Aprobada');
          }
      });
  }

  async updateStatus(resId: number, estado: string) {
      try {
          const res = await fetch(`/api/room-reservations/${resId}/status`, { method: 'PUT', headers: this.getHeaders(), body: JSON.stringify({ estado }) });
          if (res.ok) { this.loadAllReservations(); this.loadWeekData(); }
      } catch(e) {}
  }

  async quickAdminBlock(block: any, date: string) {
      this.createReservation(block.id, date, 'BLOQUEO ADMINISTRATIVO', '#000000');
  }

  async blockFullDay() {
      const { value: date } = await Swal.fire({ title: 'BLOQUEAR DÍA ENTERO', input: 'date', inputLabel: 'Seleccione la fecha', showCancelButton: true });
      if (date) {
          for (let b of this.roomBlocks()) {
              await this.createReservation(b.id, date, 'BLOQUEO ADMINISTRATIVO', '#000000');
          }
      }
  }

  /** Abre el modal para crear una nueva sala */
  async openCreateModal() {
    this.showRoomModal();
  }

  /** Abre el modal para editar una sala existente */
  async editRoom(room: any) {
    this.showRoomModal(room);
  }

  /** Lógica unificada para crear/editar salas con SweetAlert2 */
  private async showRoomModal(room?: any) {
    const isEdit = !!room;
    const { value: formValues } = await Swal.fire({
      title: `<h3 class="text-uah-blue font-black uppercase tracking-tighter">${isEdit ? 'Editar Sala / Lab' : 'Nueva Sala / Lab'}</h3>`,
      html: `
        <div class="text-left space-y-4 pt-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre del Espacio</label>
              <input id="r-nombre" class="swal2-input w-full m-0 rounded-xl" placeholder="Ej: SALA INF 101" value="${room?.nombre || ''}">
            </div>
            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</label>
              <select id="r-tipo" class="swal2-input w-full m-0 rounded-xl">
                <option value="Sala de Clases" ${room?.tipo === 'Sala de Clases' ? 'selected' : ''}>SALA DE CLASES</option>
                <option value="Laboratorio" ${room?.tipo === 'Laboratorio' ? 'selected' : ''}>LABORATORIO</option>
                <option value="Sala de Reuniones" ${room?.tipo === 'Sala de Reuniones' ? 'selected' : ''}>SALA DE REUNIONES</option>
                <option value="Auditorio" ${room?.tipo === 'Auditorio' ? 'selected' : ''}>AUDITORIO</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacidad Máx.</label>
              <input id="r-capacidad" type="number" class="swal2-input w-full m-0 rounded-xl" value="${room?.capacidadMaxima || 30}">
            </div>
            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ubicación (Piso)</label>
              <input id="r-ubicacion" class="swal2-input w-full m-0 rounded-xl" placeholder="Ej: 1er Piso" value="${room?.ubicacionPiso || ''}">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Metros Cuadrados</label>
              <input id="r-metros" type="number" class="swal2-input w-full m-0 rounded-xl" value="${room?.metrosCuadrados || 0}">
            </div>
            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Hora ($)</label>
              <input id="r-valor" type="number" class="swal2-input w-full m-0 rounded-xl" value="${room?.valorHora || 0}">
            </div>
          </div>
          <div class="space-y-4 pt-2 border-t border-gray-100">
             <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Equipamiento Disponible</label>
             <div class="grid grid-cols-3 gap-y-2 gap-x-1">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-aire" ${room?.tieneAireAcondicionado ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Aire Acond.</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-pizarra" ${room?.tienePizarra ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Pizarra</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-pc" ${room?.tieneComputadores ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">PCs</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-notebooks" ${room?.tieneNotebooks ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Notebooks</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-audio" ${room?.tieneAudio ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Audio</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-tv" ${room?.tieneTelevisor ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">TV</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-proyector" ${room?.tieneProyector ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Proyector</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-mic" ${room?.tieneMicrofono ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Microfóno</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-piz-int" ${room?.tienePizarraInteligente ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Piz. Intelig.</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-lavadero" ${room?.tieneLavadero ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Lavadero</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-ducha" ${room?.tieneDucha ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Ducha</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="r-bano" ${room?.tieneBano ? 'checked' : ''}> <span class="text-[9px] font-bold uppercase">Baño</span>
                </label>
             </div>
             <div>
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Otros Equipos (Manual)</label>
                <input id="r-otros" class="swal2-input w-full m-0 rounded-xl" placeholder="Ej: Plotter, Impresora 3D..." value="${room?.otrosEquipos || ''}">
              </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: isEdit ? 'ACTUALIZAR' : 'CREAR SALA',
      confirmButtonColor: '#f06427',
      cancelButtonText: 'CANCELAR',
      preConfirm: () => {
        return {
          nombre: (document.getElementById('r-nombre') as HTMLInputElement).value,
          tipo: (document.getElementById('r-tipo') as HTMLSelectElement).value,
          capacidadMaxima: parseInt((document.getElementById('r-capacidad') as HTMLInputElement).value),
          ubicacionPiso: (document.getElementById('r-ubicacion') as HTMLInputElement).value,
          metrosCuadrados: parseFloat((document.getElementById('r-metros') as HTMLInputElement).value),
          valorHora: parseInt((document.getElementById('r-valor') as HTMLInputElement).value),
          tieneAireAcondicionado: (document.getElementById('r-aire') as HTMLInputElement).checked,
          tienePizarra: (document.getElementById('r-pizarra') as HTMLInputElement).checked,
          tieneComputadores: (document.getElementById('r-pc') as HTMLInputElement).checked,
          tieneNotebooks: (document.getElementById('r-notebooks') as HTMLInputElement).checked,
          tieneAudio: (document.getElementById('r-audio') as HTMLInputElement).checked,
          tieneTelevisor: (document.getElementById('r-tv') as HTMLInputElement).checked,
          tieneProyector: (document.getElementById('r-proyector') as HTMLInputElement).checked,
          tieneMicrofono: (document.getElementById('r-mic') as HTMLInputElement).checked,
          tienePizarraInteligente: (document.getElementById('r-piz-int') as HTMLInputElement).checked,
          tieneLavadero: (document.getElementById('r-lavadero') as HTMLInputElement).checked,
          tieneDucha: (document.getElementById('r-ducha') as HTMLInputElement).checked,
          tieneBano: (document.getElementById('r-bano') as HTMLInputElement).checked,
          otrosEquipos: (document.getElementById('r-otros') as HTMLInputElement).value
        }
      }
    });

    if (formValues) {
      if (!formValues.nombre || !formValues.ubicacionPiso) {
         Swal.fire('Error', 'Nombre y ubicación son obligatorios', 'error');
         return;
      }
      this.saveRoom(formValues, room?.id);
    }
  }

  /** Persiste los cambios de la sala en el servidor */
  private async saveRoom(data: any, id?: number) {
    const isUpdate = !!id;
    const url = isUpdate ? `/api/rooms/${id}` : '/api/rooms';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (res.ok) {
        Swal.fire({ 
          icon: 'success', 
          title: isUpdate ? 'Sala Actualizada' : 'Sala Creada', 
          text: `El espacio ${data.nombre} ha sido ${isUpdate ? 'modificado' : 'creado'} exitosamente.`,
          timer: 1500, 
          showConfirmButton: false 
        });
        this.loadRooms();
      } else {
        const err = await res.json();
        Swal.fire('Error', err.message || 'Error al procesar la solicitud', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  }

  async borrarSalaDefinitivamente(id: number) {
      const { isConfirmed } = await Swal.fire({
          title: '¿BORRAR SALA?',
          text: "Esta acción eliminará permanentemente la sala, sus bloques y TODAS sus reservas. ¡Es irreversible!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'SÍ, BORRAR TODO'
      });
      
      if (!isConfirmed) return;

      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE', headers: this.getHeaders() });
      if (res.ok) { 
          this.loadRooms(); 
          if (this.selectedRoom()?.id === id) this.selectedRoom.set(null);
          Swal.fire('Eliminado', 'La sala ha sido removida del sistema.', 'success');
      }
  }
}
