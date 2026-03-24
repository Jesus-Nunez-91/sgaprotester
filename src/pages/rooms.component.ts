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
    <div class="max-w-7xl mx-auto py-8 px-4 animate-fadeIn">
      <!-- Encabezado -->
      <div class="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h1 class="text-3xl md:text-4xl font-black text-uah-blue dark:text-white tracking-tighter">RESERVA DE SALAS Y LABS</h1>
          <p class="text-gray-500 font-medium mt-1">Busque y reserve espacios fácilmente</p>
        </div>
         <button *ngIf="isAdmin()" (click)="openCreateModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-lg">
           <i class="bi bi-plus-circle"></i> NUEVA SALA
         </button>
       </div>

      <!-- Filtro Búsqueda General Predictiva -->
      <div class="mb-8 relative flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-grow">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Buscador General</label>
          <div class="relative">
            <i class="bi bi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input type="text" [(ngModel)]="searchText" placeholder="Escriba aquí (ej. Hackerlab)..."
                   class="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-uah-orange focus:ring-0 text-lg shadow-sm transition-all bg-white" />
          </div>
        </div>
        <button (click)="loadRooms()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-4 rounded-2xl font-bold transition flex items-center gap-2 border-2 border-transparent">
          <i class="bi bi-arrow-clockwise"></i> ACTUALIZAR
        </button>
      </div>

      <!-- Grid Horizontal de Máximo 3 por fila -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" *ngIf="!selectedRoom()">
        <div *ngFor="let room of filteredRooms()" (click)="selectRoom(room)" 
             class="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-lg cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all border-b-8 border-uah-blue hover:border-uah-orange relative overflow-hidden group">
          
          <div class="flex justify-between items-start mb-4">
             <div class="h-16 w-16 bg-blue-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-uah-blue group-hover:bg-orange-50 group-hover:text-uah-orange transition-colors">
              <i class="bi bi-door-open-fill text-3xl"></i>
            </div>
            <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold uppercase">{{ room.tipo }}</span>
          </div>

          <h3 class="text-2xl font-black text-gray-800 dark:text-white mb-2 leading-tight uppercase">{{ room.nombre }}</h3>
          
          <div class="space-y-2 mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <p class="flex items-center gap-2"><i class="bi bi-geo-alt-fill text-gray-400"></i> Piso / Ubicación: {{ room.ubicacionPiso }}</p>
            <p class="flex items-center gap-2"><i class="bi bi-people-fill text-gray-400"></i> Capacidad Máxima: {{ room.capacidadMaxima }} personas</p>
          </div>
          
          <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <span class="text-uah-blue dark:text-blue-400 font-bold text-sm uppercase">Ver Disponibilidad</span>
            <div *ngIf="isAdmin()" class="flex gap-2">
               <button (click)="$event.stopPropagation(); editRoom(room)" class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black hover:bg-blue-100 transition uppercase">Editar</button>
               <button (click)="$event.stopPropagation(); borrarSalaDefinitivamente(room.id)" class="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-black hover:bg-red-100 transition uppercase">Eliminar</button>
            </div>
            <i *ngIf="!isAdmin()" class="bi bi-arrow-right text-uah-blue"></i>
          </div>
        </div>

        <div *ngIf="filteredRooms().length === 0" class="col-span-full py-12 text-center text-gray-500 font-bold">
           No se encontraron salas o labs con ese criterio de búsqueda.
        </div>
      </div>

      <!-- Vista de Sala Seleccionada -->
      <div *ngIf="selectedRoom()" class="animate-fadeIn">
        <button (click)="selectedRoom.set(null)" class="mb-6 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
          <i class="bi bi-arrow-left"></i> VOLVER AL LISTADO
        </button>

        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100 dark:border-gray-700">
           <div class="bg-uah-blue text-white p-6 flex justify-between items-center">
              <div>
                 <h2 class="text-2xl font-black uppercase">{{ selectedRoom()?.nombre }}</h2>
                 <p class="opacity-80 text-sm mt-1 flex items-center gap-4">
                   <span><i class="bi bi-geo-alt"></i> {{ selectedRoom()?.ubicacionPiso }}</span>
                   <span><i class="bi bi-people"></i> Capacidad: {{ selectedRoom()?.capacidadMaxima }} Max.</span>
                 </p>
              </div>
           </div>
           
           <div class="p-6 md:p-8">
              <!-- Selector de Fecha -->
              <div class="mb-8 max-w-sm">
                 <label class="block text-sm font-bold text-gray-700 mb-2">Seleccione una Fecha para verificar bloques</label>
                 <input type="date" [(ngModel)]="selectedDate" (change)="loadBlocksAndReservations()"
                        class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-uah-blue focus:ring-0 shadow-sm" />
              </div>

              <!-- Loader -->
              <div *ngIf="loadingBlocks()" class="py-12 text-center text-gray-500">
                <i class="bi bi-arrow-repeat animate-spin text-4xl mb-4 block"></i>
                <p class="font-bold">Cargando disponibilidad...</p>
              </div>

              <!-- Bloques (Mínimo 3 por fila) -->
              <div *ngIf="!loadingBlocks() && selectedDate" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 <div *ngFor="let block of roomBlocks()" 
                      class="border-2 rounded-2xl p-4 transition-all"
                      [ngClass]="getBlockClass(block)">
                    
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-black text-[10px] uppercase text-gray-500">{{ block.nombreBloque }}</span>
                        <span class="text-[10px] font-black px-2 py-0.5 rounded border capitalize" [ngClass]="getStatusBadgeClass(block)">{{ getBlockStatus(block) }}</span>
                     </div>
                     <div class="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100 border-b pb-2">
                        {{ block.horaInicio }} - {{ block.horaFin }}
                     </div>

                     <button *ngIf="getBlockStatus(block) === 'Disponible'" (click)="openReserveModal(block)" 
                             class="w-full bg-uah-blue hover:bg-blue-800 text-white font-bold py-2 rounded-xl text-xs transition shadow-md">
                       Solicitar Reserva
                     </button>

                     <div *ngIf="canApprove() && getBlockStatus(block) === 'Pendiente'" class="space-y-2 mt-2">
                        @let res = getReservationForBlock(block);
                        @if (res) {
                           <button (click)="updateStatus(res.id, 'Aprobada')" 
                                   class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] transition uppercase shadow-lg shadow-emerald-500/20">
                             Aceptar Reserva
                           </button>
                           <button (click)="updateStatus(res.id, 'Rechazada')" 
                                   class="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold py-2 rounded-xl text-[10px] transition uppercase">
                             Rechazar
                           </button>
                        }
                     </div>
                     
                     <div *ngIf="isSuperUser()" class="mt-3 flex gap-2">
                         <button (click)="editBlock(block)" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-1.5 rounded-lg text-[10px] transition uppercase">EDITAR</button>
                         <button (click)="deleteBlock(block.id)" class="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition" title="Borrar Bloque"><i class="bi bi-trash"></i></button>
                     </div>
                 </div>
                 
                 <div *ngIf="roomBlocks().length === 0" class="col-span-full py-6 text-gray-500 text-center font-bold">
                    Esta sala no tiene bloques horarios configurados.
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      <!-- Panel de Administrador (Reservas Pendientes) -->
      <div *ngIf="canApprove() && pendingReservations().length > 0 && !selectedRoom()" class="mt-12 bg-white rounded-3xl p-8 shadow-xl border-t-8 border-orange-500 animate-fadeIn">
         <h2 class="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3"><i class="bi bi-shield-lock-fill text-orange-500"></i> RESERVAS PENDIENTES DE APROBACIÓN</h2>
         
         <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
               <thead>
                  <tr class="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                     <th class="p-4 rounded-tl-xl">Sala</th>
                     <th class="p-4">Fecha</th>
                     <th class="p-4">Bloque</th>
                     <th class="p-4">Solicitante</th>
                     <th class="p-4">Motivo / Personas</th>
                     <th class="p-4 text-right rounded-tr-xl">Acciones</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-gray-100">
                  <tr *ngFor="let res of pendingReservations()" class="hover:bg-gray-50 transition text-sm">
                     <td class="p-4 font-bold text-gray-800">{{ getRoomName(res.roomId) }}</td>
                     <td class="p-4">{{ res.fechaExacta }}</td>
                     <td class="p-4 font-bold text-gray-600">{{ getBlockName(res.roomBlockId) }}</td>
                     <td class="p-4">ID Usuario: {{ res.userId }}</td>
                     <td class="p-4">
                        <div class="max-w-xs truncate" title="{{ res.motivo }}">{{ res.motivo }}</div>
                        <div class="text-xs text-gray-500 mt-1"><i class="bi bi-people"></i> {{ res.participantes || 0 }} pers.</div>
                     </td>
                     <td class="p-4 text-right">
                        <button (click)="updateStatus(res.id, 'Aprobada')" class="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded-lg font-bold mr-2 transition">APROBAR</button>
                        <button (click)="updateStatus(res.id, 'Rechazada')" class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg font-bold transition">RECHAZAR</button>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>

    <!-- Modal Formulario de Reserva -->
    <div *ngIf="showReserveModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
       <div class="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative transform transition-all scale-100">
          <button (click)="showReserveModal = false" class="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition"><i class="bi bi-x-lg text-xl"></i></button>
          
          <div class="mb-6">
             <h3 class="text-2xl font-black text-gray-800 uppercase">Solicitar Bloque</h3>
             <p class="text-gray-500 text-sm mt-1">Sala: {{ selectedRoom()?.nombre }} | Fecha: {{ selectedDate }} | Bloque: {{ activeBlock?.nombreBloque }}</p>
          </div>

          <div class="space-y-4">
             <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Motivo de Reserva <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="reserveMotivo" placeholder="Ej. Reunión de proyecto de título" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-opacity-50 focus:border-uah-blue" />
             </div>
             
             <div class="flex gap-4">
                <div class="flex-1">
                   <label class="block text-sm font-bold text-gray-700 mb-1">Nº Participantes</label>
                   <input type="number" [(ngModel)]="reserveParticipantes" min="1" max="{{ selectedRoom()?.capacidadMaxima }}" class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-0 focus:border-uah-blue" />
                </div>
             </div>

             <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Observación adicional (Opcional)</label>
                <textarea [(ngModel)]="reserveObservacion" rows="3" placeholder="Necesitamos uso prioritario del proyector..." class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-0 focus:border-uah-blue"></textarea>
             </div>
          </div>

          <div class="mt-8 flex gap-4">
             <button (click)="showReserveModal = false" class="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition">CANCELAR</button>
             <button (click)="submitReservation()" [disabled]="!reserveMotivo" class="flex-1 px-4 py-3 rounded-xl bg-uah-orange hover:bg-orange-600 text-white font-black disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-orange-500/30">ENVIAR SOLICITUD</button>
          </div>
       </div>
    </div>
    
    <!-- Modal Crear Sala (Admin) -->
    <div *ngIf="showCreateModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
       <div class="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative">
          <button (click)="showCreateModal = false" class="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition"><i class="bi bi-x-lg text-xl"></i></button>
          <div class="mb-6">
             <h3 class="text-2xl font-black text-gray-800 uppercase">Añadir Nueva Sala/Lab</h3>
             <p class="text-gray-500 text-sm mt-1">Se generarán automáticamente los bloques horarios estándar.</p>
          </div>
          <div class="space-y-4">
             <div>
                <label class="block text-sm font-bold mb-1">Nombre</label>
                <input type="text" [(ngModel)]="newRoom.nombre" placeholder="Ej. Sala de Estudio 1" class="w-full px-4 py-2 border rounded-xl" />
             </div>
             <div>
                <label class="block text-sm font-bold mb-1">Tipo</label>
                <select [(ngModel)]="newRoom.tipo" class="w-full px-4 py-2 border rounded-xl bg-white">
                   <option value="Sala de Reuniones">Sala de Reuniones</option>
                   <option value="Laboratorio Computación">Laboratorio Computación</option>
                   <option value="Auditorio">Auditorio</option>
                   <option value="Multiuso">Multiuso</option>
                </select>
             </div>
             <div>
                <label class="block text-sm font-bold mb-1">Capacidad Máxima</label>
                <input type="number" [(ngModel)]="newRoom.capacidadMaxima" class="w-full px-4 py-2 border rounded-xl" />
             </div>
             <div>
                <label class="block text-sm font-bold mb-1">Piso / Ubicación</label>
                <input type="text" [(ngModel)]="newRoom.ubicacionPiso" placeholder="Ej. 2do Piso, Edificio B" class="w-full px-4 py-2 border rounded-xl" />
             </div>
          </div>
          <div class="mt-8 flex gap-4">
             <button (click)="createRoom()" class="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition shadow-lg">GUARDAR Y CREAR BLOQUES</button>
          </div>
       </div>
    </div>

    <!-- Modal Editar Sala (Admin) -->
    <div *ngIf="showEditRoomModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
       <div class="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative">
          <button (click)="showEditRoomModal = false" class="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition"><i class="bi bi-x-lg text-xl"></i></button>
          <div class="mb-6">
             <h3 class="text-2xl font-black text-gray-800 uppercase">Editar Sala</h3>
          </div>
          <div class="space-y-4">
             <div>
                <label class="block text-sm font-bold mb-1 uppercase text-gray-400">Nombre</label>
                <input type="text" [(ngModel)]="editingRoom.nombre" class="w-full px-4 py-2 border rounded-xl" />
             </div>
             <div>
                <label class="block text-sm font-bold mb-1 uppercase text-gray-400">Tipo</label>
                <select [(ngModel)]="editingRoom.tipo" class="w-full px-4 py-2 border rounded-xl bg-white">
                   <option value="Sala de Reuniones">Sala de Reuniones</option>
                   <option value="Laboratorio Computación">Laboratorio Computación</option>
                   <option value="Auditorio">Auditorio</option>
                   <option value="Multiuso">Multiuso</option>
                </select>
             </div>
             <div>
                <label class="block text-sm font-bold mb-1 uppercase text-gray-400">Capacidad Máxima</label>
                <input type="number" [(ngModel)]="editingRoom.capacidadMaxima" class="w-full px-4 py-2 border rounded-xl" />
             </div>
             <div>
                <label class="block text-sm font-bold mb-1 uppercase text-gray-400">Piso / Ubicación</label>
                <input type="text" [(ngModel)]="editingRoom.ubicacionPiso" class="w-full px-4 py-2 border rounded-xl" />
             </div>
          </div>
          <div class="mt-8 flex gap-4">
             <button (click)="updateRoom()" class="w-full px-4 py-3 rounded-xl bg-uah-blue text-white font-black hover:bg-blue-700 transition shadow-lg uppercase">Guardar Cambios</button>
          </div>
       </div>
    </div>

    <!-- Modal Editar Bloque (Admin) -->
    <div *ngIf="showEditBlockModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
       <div class="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative">
          <button (click)="showEditBlockModal = false" class="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition"><i class="bi bi-x-lg text-xl"></i></button>
          <div class="mb-6">
             <h3 class="text-2xl font-black text-gray-800 uppercase">Editar Bloque Horario</h3>
          </div>
          <div class="space-y-4">
             <div>
                <label class="block text-sm font-bold mb-1 uppercase text-gray-400">Nombre del Bloque</label>
                <input type="text" [(ngModel)]="editingBlock.nombreBloque" class="w-full px-4 py-2 border rounded-xl" />
             </div>
             <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold mb-1 uppercase text-gray-400">Hora Inicio</label>
                  <input type="text" [(ngModel)]="editingBlock.horaInicio" placeholder="HH:MM" class="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label class="block text-sm font-bold mb-1 uppercase text-gray-400">Hora Fin</label>
                  <input type="text" [(ngModel)]="editingBlock.horaFin" placeholder="HH:MM" class="w-full px-4 py-2 border rounded-xl" />
                </div>
             </div>
          </div>
          <div class="mt-8 flex gap-4">
             <button (click)="updateBlock()" class="w-full px-4 py-3 rounded-xl bg-orange-600 text-white font-black hover:bg-orange-700 transition shadow-lg uppercase">Actualizar Bloque</button>
          </div>
       </div>
    </div>
  `
})
export class RoomsComponent implements OnInit {
  private data = inject(DataService);

  // Datos
  allRooms = signal<any[]>([]);
  roomBlocks = signal<any[]>([]);
  dailyReservations = signal<any[]>([]);
  allPendingReservations = signal<any[]>([]);
  
  // Estado de UI
  searchText = '';
  selectedRoom = signal<any | null>(null);
  selectedDate: string = new Date().toISOString().split('T')[0];
  loadingBlocks = signal(false);
  
  // Modals
  showReserveModal = false;
  showCreateModal = false;
  showEditRoomModal = false;
  showEditBlockModal = false;
  activeBlock: any = null;
  editingRoom: any = {};
  editingBlock: any = {};
  
  // Form Reservation
  reserveMotivo = '';
  reserveParticipantes = 1;
  reserveObservacion = '';
  
  // Form Create Room
  newRoom = { nombre: '', tipo: 'Laboratorio', capacidadMaxima: 20, ubicacionPiso: '' };

  isAdmin = computed(() => {
    const rol = this.data.currentUser()?.rol || '';
    return rol === 'Admin_Labs' || rol === 'SuperUser';
  });

  isSuperUser = computed(() => {
    return this.data.currentUser()?.rol === 'SuperUser';
  });

  canApprove = computed(() => {
    const rol = this.data.currentUser()?.rol || '';
    return rol === 'Admin_Labs' || rol === 'SuperUser';
  });

  filteredRooms = computed(() => {
    const term = this.searchText.toLowerCase().trim();
    if (!term) return this.allRooms();
    
    return this.allRooms().filter(r => 
      r.nombre?.toLowerCase().includes(term) ||
      r.tipo?.toLowerCase().includes(term) ||
      r.ubicacionPiso?.toLowerCase().includes(term) ||
      String(r.capacidadMaxima).includes(term)
    );
  });

  pendingReservations = computed(() => {
      return this.allPendingReservations().filter(r => r.estado === 'Pendiente');
  });

  ngOnInit() {
    this.loadRooms();
    if (this.canApprove()) this.loadAllReservations();
  }

  getHeaders() {
    return { 
      'Authorization': 'Bearer ' + this.data.token(), 
      'Content-Type': 'application/json' 
    };
  }

  async loadRooms() {
    try {
      const res = await fetch('/api/rooms', { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        console.log('Salas cargadas:', data);
        this.allRooms.set(data);
      } else {
        const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('Error API rooms:', res.status, err);
        // Opcional: alert('No se pudieron cargar las salas. Verifique su conexión o sesión.');
      }
    } catch (e) { 
      console.error('Error fetch rooms:', e);
      // alert('Error de conexión con el servidor de salas.');
    }
  }

  async loadAllReservations() {
      // Para admin (reservas pendientes)
      try {
        const res = await fetch('/api/room-reservations', { headers: this.getHeaders() });
        if (res.ok) {
            const data = await res.json();
            this.allPendingReservations.set(data);
        }
      } catch(e) {}
  }

  selectRoom(room: any) {
    this.selectedRoom.set(room);
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.loadBlocksAndReservations();
  }

  async loadBlocksAndReservations() {
    if (!this.selectedRoom() || !this.selectedDate) return;
    this.loadingBlocks.set(true);
    
    const rid = this.selectedRoom().id;
    try {
      const [blocksRes, resRes] = await Promise.all([
         fetch(`/api/rooms/${rid}/blocks`, { headers: this.getHeaders() }),
         fetch(`/api/room-reservations?roomId=${rid}&fecha=${this.selectedDate}`, { headers: this.getHeaders() })
      ]);
      
      if (blocksRes.ok) this.roomBlocks.set(await blocksRes.json());
      if (resRes.ok) this.dailyReservations.set(await resRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingBlocks.set(false);
    }
  }

  getDayName(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const fullDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return fullDays[d.getDay()];
  }

  getBlockStatus(block: any): string {
     const room = this.selectedRoom();
     if (!room) return 'Disponible';

     // 1. Verificar Horario Académico (Prioridad)
     const dateStr = this.selectedDate;
     const day = this.getDayName(dateStr);
     const schedules = this.data.classSchedules();
     
     // Normalización de texto (quita acentos y pasa a mayúsculas)
     const norm = (s: string) => s?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

     const isClass = schedules.some(s => 
        norm(s.lab) === norm(room.nombre) && 
        norm(s.day) === norm(day) && 
        (norm(s.block) === norm(block.nombreBloque) || norm(s.block) === norm(`${block.horaInicio} - ${block.horaFin}`))
     );
     if (isClass) return 'Ocupado (Clase)';

     // 2. Verificar Solicitudes de Reserva
     const activeRes = this.dailyReservations().find(r => 
        r.roomBlockId === block.id && (r.estado === 'Aprobada' || r.estado === 'Pendiente')
     );
     
     if (activeRes) {
        return activeRes.estado === 'Aprobada' ? 'Aprobado' : 'Pendiente';
     }
     
     return 'Disponible';
  }

  getReservationForBlock(block: any) {
    return this.dailyReservations().find(r => r.roomBlockId === block.id);
  }

  getBlockClass(block: any) {
      const status = this.getBlockStatus(block);
      if (status === 'Disponible') return 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-500 shadow-sm';
      if (status === 'Pendiente') return 'border-orange-200 bg-orange-50/50 opacity-90';
      if (status === 'Aprobado') return 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed';
      if (status === 'Ocupado (Clase)') return 'border-red-100 bg-red-50/40 opacity-70 cursor-not-allowed grayscale-[0.5]';
      return '';
  }

  getStatusBadgeClass(block: any) {
      const status = this.getBlockStatus(block);
      if (status === 'Disponible') return 'text-emerald-700 border-emerald-300 bg-emerald-100';
      if (status === 'Pendiente') return 'text-orange-700 border-orange-300 bg-orange-100';
      if (status === 'Aprobado') return 'text-gray-600 border-gray-300 bg-gray-200';
      if (status === 'Ocupado (Clase)') return 'text-red-700 border-red-300 bg-red-100';
      return '';
  }

  openReserveModal(block: any) {
      this.activeBlock = block;
      this.reserveMotivo = '';
      this.reserveParticipantes = 1;
      this.reserveObservacion = '';
      this.showReserveModal = true;
  }

  async submitReservation() {
      if (!this.reserveMotivo) return;
      const payload = {
          roomId: this.selectedRoom().id,
          roomBlockId: this.activeBlock.id,
          fechaExacta: this.selectedDate,
          motivo: this.reserveMotivo,
          participantes: this.reserveParticipantes,
          observacionOpcional: this.reserveObservacion
      };

      try {
          const res = await fetch('/api/room-reservations', {
              method: 'POST',
              headers: this.getHeaders(),
              body: JSON.stringify(payload)
          });
          if (res.ok) {
              Swal.fire({
                 icon: 'success',
                 title: 'Solicitud Enviada',
                 text: 'Su reserva ha sido registrada y está pendiente de aprobación.',
                 customClass: {
                   popup: 'uah-premium-popup',
                   title: 'uah-premium-title',
                   confirmButton: 'uah-premium-confirm'
                 },
                 buttonsStyling: false,
                 confirmButtonColor: '#003366'
              });
              this.showReserveModal = false;
              this.loadBlocksAndReservations(); 
              if (this.canApprove()) this.loadAllReservations();
          } else {
              const e = await res.json().catch(() => ({ message: 'Error de red' }));
              Swal.fire('Error', 'No pudo enviarse: ' + e.message, 'error');
          }
      } catch (error) {
          Swal.fire('Error', 'Problema de conexión al procesar.', 'error');
      }
  }

  openCreateModal() {
      this.newRoom = { nombre: '', tipo: 'Sala de Reuniones', capacidadMaxima: 10, ubicacionPiso: '' };
      this.showCreateModal = true;
  }

  async createRoom() {
      if (!this.newRoom.nombre) return;
      try {
          const res = await fetch('/api/rooms', {
              method: 'POST',
              headers: this.getHeaders(),
              body: JSON.stringify(this.newRoom)
          });
          if (res.ok) {
              const saved = await res.json();
              Swal.fire({
                 icon: 'success',
                 title: 'Sala Creada',
                 text: `La sala "${saved.nombre}" ha sido configurada correctamente.`,
                 customClass: {
                   popup: 'uah-premium-popup',
                   title: 'uah-premium-title',
                   confirmButton: 'uah-premium-confirm'
                 },
                 buttonsStyling: false,
                 confirmButtonColor: '#003366'
              });
              this.showCreateModal = false;
              await this.loadRooms();
          } else {
              const e = await res.json().catch(() => ({ message: 'Error de red' }));
              Swal.fire('Error', 'No se pudo crear: ' + e.message, 'error');
          }
      } catch (e) {
          Swal.fire('Error', 'Hubo un problema de conexión al procesar la sala.', 'error');
      }
  }

  async updateStatus(resId: number, estado: string) {
      const isApprove = estado === 'Aprobada';
      const confirm = await Swal.fire({
         title: isApprove ? '¿Aprobar Reserva?' : '¿Rechazar Reserva?',
         text: isApprove ? 'Se notificará al usuario de la confirmación.' : 'Esta acción no se puede deshacer.',
         icon: isApprove ? 'question' : 'warning',
         showCancelButton: true,
         confirmButtonText: isApprove ? 'SÍ, APROBAR' : 'SÍ, RECHAZAR',
         cancelButtonText: 'CANCELAR',
         confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
         cancelButtonColor: '#6b7280',
         customClass: {
           popup: 'uah-premium-popup',
           title: 'uah-premium-title',
           confirmButton: 'uah-premium-confirm',
           cancelButton: 'uah-premium-cancel'
         },
         buttonsStyling: false
      });

      if (!confirm.isConfirmed) return;

      try {
          const res = await fetch(`/api/room-reservations/${resId}/status`, {
              method: 'PUT',
              headers: this.getHeaders(),
              body: JSON.stringify({ estado })
          });
          if (res.ok) {
              Swal.fire({
                 icon: 'success',
                 title: isApprove ? 'Reserva Aprobada' : 'Reserva Rechazada',
                 toast: true,
                 position: 'top-end',
                 showConfirmButton: false,
                 timer: 2000,
                 customClass: {
                   popup: 'uah-premium-popup',
                   title: 'uah-premium-title'
                 }
              });
              this.loadAllReservations();
              if (this.selectedRoom()) this.loadBlocksAndReservations();
          }
      } catch(e) {}
  }
  
  async editRoom(room: any) {
      this.editingRoom = { ...room };
      this.showEditRoomModal = true;
  }

  async updateRoom() {
      try {
          const res = await fetch(`/api/rooms/${this.editingRoom.id}`, {
              method: 'PUT',
              headers: this.getHeaders(),
              body: JSON.stringify(this.editingRoom)
          });
          if (res.ok) {
              this.showEditRoomModal = false;
              this.loadRooms();
        if (this.selectedRoom()?.id === this.editingRoom.id) {
                  this.selectedRoom.set(await res.json());
              }
          }
      } catch(e) { Swal.fire('Error', 'No pudo actualizarse la sala.', 'error'); }
  }

  async borrarSalaDefinitivamente(id: number) {
      console.log('--- ACCION BORRAR SALA ID:', id);
      
      const result = await Swal.fire({
          title: '¿Confirmar eliminación?',
          text: "Se borrarán todos sus bloques y reservas. Esta acción no se puede deshacer.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar sala',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#003366',
          customClass: {
            popup: 'uah-premium-popup',
            title: 'uah-premium-title',
            confirmButton: 'uah-premium-confirm',
            cancelButton: 'uah-premium-cancel'
          },
          buttonsStyling: false
      });

      if (!result.isConfirmed) return;

      try {
          const res = await fetch(`/api/rooms/${id}`, {
              method: 'DELETE',
              headers: this.getHeaders()
          });
          
          if (res.ok) {
              Swal.fire('Eliminada', 'La sala ha sido removida del sistema.', 'success');
              this.loadRooms();
              if (this.selectedRoom()?.id === id) this.selectedRoom.set(null);
          } else {
              const err = await res.json().catch(() => ({ message: 'Error interno del servidor' }));
              Swal.fire('Error', 'No pudo eliminarse: ' + (err.message || 'Error desconocido'), 'error');
          }
      } catch(e) {
          console.error('--- EXCEPCION BORRADO:', e);
          Swal.fire('Error', 'Fallo de conexión.', 'error');
      }
  }

  async editBlock(block: any) {
      this.editingBlock = { ...block };
      this.showEditBlockModal = true;
  }

  async updateBlock() {
      try {
          const res = await fetch(`/api/room-blocks/${this.editingBlock.id}`, {
              method: 'PUT',
              headers: this.getHeaders(),
              body: JSON.stringify(this.editingBlock)
          });
          if (res.ok) {
              this.showEditBlockModal = false;
              this.loadBlocksAndReservations();
          }
      } catch(e) { Swal.fire('Error', 'No se pudo actualizar el bloque.', 'error'); }
  }

  async deleteBlock(id: number) {
      const confirmResult = await Swal.fire({
          title: '¿Eliminar bloque?',
          text: '¿Seguro que desea eliminar este bloque del horario?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar',
          customClass: {
            popup: 'uah-premium-popup',
            title: 'uah-premium-title',
            confirmButton: 'uah-premium-confirm',
            cancelButton: 'uah-premium-cancel'
          },
          buttonsStyling: false
      });
      if (!confirmResult.isConfirmed) return;

      try {
          const res = await fetch(`/api/room-blocks/${id}`, {
              method: 'DELETE',
              headers: this.getHeaders()
          });
          if (res.ok) this.loadBlocksAndReservations();
      } catch(e) { Swal.fire('Error', 'No se pudo eliminar el bloque.', 'error'); }
  }

  getRoomName(roomId: number) {
      const room = this.allRooms().find(r => r.id === roomId);
      return room ? room.nombre : 'Desconocida';
  }

  getBlockName(blockId: number) {
      // Necesitaríamos los bloques cacheados pero como sólo mostramos nombre/ID, 
      // Si el frontend local no tiene el bloque, retorna su ID.
      // Se podría mejorar fetcheando una vez global.
      return `ID_Bloque: ${blockId}`;
  }
}
