import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, MaintenanceTask } from '../services/data.service';


declare var Chart: any;
declare var Swal: any;

/**
 * Componente de Gestión de Mantención.
 * Permite realizar el seguimiento de reparaciones, mantenimientos preventivos y correctivos.
 * Incluye indicadores de costos, estados de tareas y visualización gráfica.
 */
@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fadeIn pb-12">
      <!-- Encabezado -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/40 dark:border-gray-700">
          <div>
              <h2 class="text-3xl font-black text-uah-blue dark:text-gray-100 flex items-center gap-3 tracking-tighter uppercase">
                  <span class="w-12 h-12 rounded-2xl bg-uah-orange flex items-center justify-center text-white shadow-lg text-xl">
                      <i class="bi bi-wrench-adjustable-circle-fill"></i>
                  </span>
                  Plan de Mantención
              </h2>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-16">Seguimiento Institucional de Activos y Correctivos</p>
          </div>
          <div class="flex gap-3 mt-4 md:mt-0">
              <button (click)="openModal()" class="bg-uah-blue text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-800 transition-all flex items-center gap-2 uppercase text-xs tracking-widest">
                  <i class="bi bi-plus-lg"></i> Nueva Orden
              </button>
          </div>
      </div>

      <!-- Cuadrícula de Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-1 bg-uah-orange"></div>
              <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordenes Activas</div>
              <div class="text-3xl font-black text-uah-blue dark:text-white mt-1">{{ activeTasks().length }}</div>
              <div class="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                 <div class="bg-uah-orange h-full rounded-full" style="width: 60%"></div>
              </div>
           </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div class="text-xs font-bold text-gray-400 uppercase">Finalizadas (Mes)</div>
             <div class="text-3xl font-black text-gray-800 dark:text-white mt-1">{{ completedTasks().length }}</div>
             <div class="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div class="bg-green-500 h-full rounded-full" style="width: 85%"></div>
             </div>
          </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div class="text-xs font-bold text-gray-400 uppercase">Costo Total (Histórico)</div>
             <div class="text-3xl font-black text-gray-800 dark:text-white mt-1">$ {{ totalCost().toLocaleString() }}</div>
             <div class="text-xs text-red-500 mt-2 font-bold"><i class="bi bi-graph-up"></i> +12% vs mes anterior</div>
          </div>
           <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-1 bg-uah-blue"></div>
              <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado de Activos</div>
              <div class="text-3xl font-black text-uah-blue dark:text-white mt-1">94%</div>
              <div class="text-[10px] text-green-500 mt-2 font-black uppercase tracking-widest">Operatividad Nominal</div>
           </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Lista de Tareas -->
          <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]">
              <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                  <h3 class="font-bold text-gray-700 dark:text-gray-200">Listado de Órdenes</h3>
                  <div class="flex gap-2 text-xs">
                      <button (click)="filter.set('all')" [class.bg-gray-200]="filter() === 'all'" [class.dark:bg-gray-700]="filter() === 'all'" class="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Todos</button>
                      <button (click)="filter.set('active')" [class.bg-orange-100]="filter() === 'active'" [class.text-orange-700]="filter() === 'active'" class="px-3 py-1 rounded-lg hover:bg-orange-50 transition-colors">Activos</button>
                  </div>
              </div>
              
              <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                  @for (task of filteredTasks(); track task.id) {
                      <div class="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow relative group">
                          <div class="flex justify-between items-start">
                              <div class="flex items-start gap-3">
                                  <div [ngClass]="{
                                      'bg-red-100 text-red-600': task.priority === 'Crítica',
                                      'bg-orange-100 text-orange-600': task.priority === 'Alta',
                                      'bg-yellow-100 text-yellow-600': task.priority === 'Media',
                                      'bg-blue-100 text-blue-600': task.priority === 'Baja'
                                  }" class="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0">
                                      <i class="bi bi-exclamation-triangle-fill" *ngIf="task.priority === 'Crítica'"></i>
                                      <i class="bi bi-arrow-up-circle-fill" *ngIf="task.priority === 'Alta'"></i>
                                      <i class="bi bi-dash-circle-fill" *ngIf="task.priority === 'Media'"></i>
                                      <i class="bi bi-arrow-down-circle-fill" *ngIf="task.priority === 'Baja'"></i>
                                  </div>
                                  <div>
                                      <h4 class="font-bold text-gray-800 dark:text-white text-sm">{{ task.itemName }}</h4>
                                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ task.description }}</p>
                                      <div class="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-mono uppercase">
                                          <span><i class="bi bi-calendar"></i> {{ task.dateScheduled }}</span>
                                          <span><i class="bi bi-person"></i> {{ task.technician }}</span>
                                          <span class="font-bold text-gray-500 dark:text-gray-300">$ {{ task.cost }}</span>
                                      </div>
                                  </div>
                              </div>
                              <div class="flex flex-col items-end gap-2">
                                   <span [ngClass]="{
                                       'bg-gray-100 text-gray-500': task.status === 'Pendiente',
                                       'bg-uah-orange/10 text-uah-orange animate-pulse': task.status === 'En Progreso',
                                       'bg-green-100 text-green-600': task.status === 'Finalizado'
                                   }" class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                                       {{ task.status }}
                                   </span>
                                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button (click)="edit(task)" class="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"><i class="bi bi-pencil"></i></button>
                                      <button (click)="del(task.id)" class="w-6 h-6 rounded bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-500"><i class="bi bi-trash"></i></button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  }
                  @if (filteredTasks().length === 0) {
                      <div class="text-center py-12 text-gray-400">
                          <i class="bi bi-clipboard-check text-4xl mb-2 block opacity-50"></i>
                          No hay tareas registradas.
                      </div>
                  }
              </div>
          </div>

          <!-- Gráficos y Resumen -->
          <div class="space-y-6">
              <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 h-[300px] flex flex-col">
                  <h4 class="font-bold text-gray-700 dark:text-gray-200 mb-4 text-sm">Distribución por Tipo</h4>
                  <div class="flex-1 relative">
                      <canvas id="maintChart"></canvas>
                  </div>
              </div>

              <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
                  <div class="absolute -right-10 -top-10 w-40 h-40 bg-uah-orange/10 rounded-full blur-3xl"></div>
                  <h4 class="font-black mb-4 text-[10px] uppercase tracking-widest flex items-center gap-2"><i class="bi bi-lightning-charge-fill text-uah-orange"></i> Operaciones</h4>
                  
                  <div class="space-y-3 relative z-10">
                      <button class="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl text-xs text-left flex items-center gap-3 transition-colors">
                          <i class="bi bi-file-earmark-pdf text-red-400 text-lg"></i>
                          <div>
                              <div class="font-bold">Exportar Reporte Mensual</div>
                              <div class="opacity-60 text-[10px]">PDF • 2.4 MB</div>
                          </div>
                      </button>
                      <button class="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl text-xs text-left flex items-center gap-3 transition-colors">
                          <i class="bi bi-envelope text-blue-400 text-lg"></i>
                          <div>
                              <div class="font-bold">Notificar Técnicos</div>
                              <div class="opacity-60 text-[10px]">Email masivo a soporte</div>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <!-- Modal de Orden de Trabajo -->
      @if (showModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div class="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                  <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                      <h3 class="font-bold text-lg dark:text-white">{{ isEditing ? 'Editar Orden' : 'Nueva Orden de Trabajo' }}</h3>
                      <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="bi bi-x-lg"></i></button>
                  </div>
                  
                  <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      <div>
                          <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Equipo / Activo</label>
                          <select [(ngModel)]="currentTask.itemId" (change)="onItemSelect($event)" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm">
                              @for (item of data.inventory(); track item.id) {
                                  <option [value]="item.id">{{ item.marca }} {{ item.modelo }} ({{ item.sn }})</option>
                              }
                          </select>
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                          <div>
                              <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Tipo</label>
                              <select [(ngModel)]="currentTask.type" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm">
                                  <option>Preventivo</option>
                                  <option>Correctivo</option>
                              </select>
                          </div>
                          <div>
                              <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Prioridad</label>
                              <select [(ngModel)]="currentTask.priority" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm">
                                  <option>Baja</option>
                                  <option>Media</option>
                                  <option>Alta</option>
                                  <option>Crítica</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Descripción del Problema/Tarea</label>
                          <textarea [(ngModel)]="currentTask.description" rows="3" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm"></textarea>
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                          <div>
                              <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Técnico Asignado</label>
                              <input [(ngModel)]="currentTask.technician" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm">
                          </div>
                          <div>
                              <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Costo Estimado</label>
                              <input type="number" [(ngModel)]="currentTask.cost" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm">
                          </div>
                      </div>

                      <div>
                           <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Estado Actual</label>
                           <div class="flex gap-2">
                               <button (click)="currentTask.status = 'Pendiente'" [class.ring-2]="currentTask.status === 'Pendiente'" class="flex-1 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200">Pendiente</button>
                               <button (click)="currentTask.status = 'En Progreso'" [class.ring-2]="currentTask.status === 'En Progreso'" class="flex-1 py-2 bg-blue-100 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-200">En Progreso</button>
                               <button (click)="currentTask.status = 'Finalizado'" [class.ring-2]="currentTask.status === 'Finalizado'" class="flex-1 py-2 bg-green-100 rounded-lg text-xs font-bold text-green-600 hover:bg-green-200">Finalizado</button>
                           </div>
                      </div>
                  </div>

                   <div class="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                      <button (click)="save()" class="flex-1 bg-uah-orange text-white font-black py-4 rounded-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 uppercase text-xs tracking-widest">Guardar Orden</button>
                      <button (click)="closeModal()" class="px-6 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancelar</button>
                  </div>
              </div>
          </div>
      }
    </div>
  `
})
export class MaintenanceComponent implements OnInit {
    data = inject(DataService);
    
    /** Señal para controlar la visibilidad del modal */
    showModal = signal(false);
    /** Indica si se está editando una tarea existente */
    isEditing = false;
    /** Filtro actual de la lista de tareas */
    filter = signal<'all'|'active'>('active');
    
    /** Tarea actual en edición o creación */
    currentTask: Partial<MaintenanceTask> = {};

    /** Tareas que no han sido finalizadas */
    activeTasks = computed(() => this.data.maintenanceTasks().filter(t => t.status !== 'Finalizado'));
    /** Tareas que ya han sido finalizadas */
    completedTasks = computed(() => this.data.maintenanceTasks().filter(t => t.status === 'Finalizado'));
    
    /** Tareas filtradas según la selección del usuario */
    filteredTasks = computed(() => {
        if (this.filter() === 'active') return this.activeTasks();
        return this.data.maintenanceTasks();
    });

    /** Costo total acumulado de todas las tareas */
    totalCost = computed(() => this.data.maintenanceTasks().reduce((sum, t) => sum + (Number(t.cost) || 0), 0));

    ngOnInit() {
        // Inicializar el gráfico después de un breve retraso para asegurar que el DOM esté listo
        setTimeout(() => this.initChart(), 500);
    }

    /** Inicializa el gráfico de distribución de tipos de mantenimiento */
    initChart() {
        const ctx = document.getElementById('maintChart') as HTMLCanvasElement;
        if (!ctx) return;
        
        const prev = this.data.maintenanceTasks().filter(t => t.type === 'Preventivo').length;
        const corr = this.data.maintenanceTasks().filter(t => t.type === 'Correctivo').length;

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Preventivo', 'Correctivo'],
                datasets: [{
                    data: [prev, corr],
                    backgroundColor: ['#10b981', '#f97316'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }

    /** Abre el modal para crear una nueva orden de trabajo */
    openModal() {
        this.currentTask = { priority: 'Media', type: 'Correctivo', status: 'Pendiente', dateScheduled: new Date().toISOString().split('T')[0] };
        this.isEditing = false;
        this.showModal.set(true);
    }

    /** Cierra el modal de orden de trabajo */
    closeModal() { this.showModal.set(false); }

    /**
     * Carga una tarea existente en el modal para su edición.
     * @param task Tarea a editar.
     */
    edit(task: MaintenanceTask) {
        this.currentTask = { ...task };
        this.isEditing = true;
        this.showModal.set(true);
    }

    /**
     * Maneja la selección de un item del inventario en el formulario.
     * @param e Evento de cambio del select.
     */
    onItemSelect(e: any) {
        const id = Number(e.target.value);
        const item = this.data.inventory().find(i => i.id === id);
        if (item) {
            this.currentTask.itemName = `${item.marca} ${item.modelo}`;
            this.currentTask.itemId = id;
        }
    }

    /** Guarda la orden de trabajo (creación o actualización). */
    save() {
        if (!this.currentTask.itemId || !this.currentTask.description) {
            Swal.fire('Error', 'Faltan datos obligatorios', 'error');
            return;
        }

        if (this.isEditing && this.currentTask.id) {
            this.data.updateMaintenanceTask(this.currentTask.id, this.currentTask);
        } else {
            this.data.addMaintenanceTask(this.currentTask);
        }
        this.closeModal();
        Swal.fire('Éxito', 'Orden guardada correctamente', 'success');
    }

    /**
     * Elimina una orden de trabajo con confirmación.
     * @param id ID de la tarea a eliminar.
     */
    del(id: number) {
        Swal.fire({ 
            title: '¿Eliminar Orden?', 
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning', 
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((r: any) => {
            if(r.isConfirmed) this.data.deleteMaintenanceTask(id);
        });
    }
}
