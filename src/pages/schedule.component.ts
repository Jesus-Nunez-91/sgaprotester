
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, ClassSchedule } from '../services/data.service';


declare const Swal: any;

@Component({
    selector: 'app-schedule',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="max-w-7xl mx-auto py-8 animate-fadeIn pb-20">
      
      <!-- Header Area -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/60 dark:bg-gray-800/60 p-6 rounded-3xl shadow-lg border border-white/40 dark:border-gray-700 backdrop-blur-xl">
          <div>
              <h2 class="text-3xl font-black text-uah-blue dark:text-gray-100 flex items-center gap-3 tracking-tighter uppercase">
                  <span class="w-12 h-12 rounded-2xl bg-uah-orange flex items-center justify-center text-white shadow-lg text-xl">
                      <i class="bi bi-calendar-week-fill"></i>
                  </span>
                  Horarios Académicos
              </h2>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-16">Disponibilidad de Recintos y Bloques Reservados</p>
          </div>
          
          <div class="mt-4 md:mt-0 flex items-center gap-4">
               @if (isAdmin()) {
                 <button (click)="toggleEditMode()" 
                         [class]="isEditMode() ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-600 hover:bg-gray-700'"
                         class="px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2">
                    <i class="bi" [class]="isEditMode() ? 'bi-pencil-fill' : 'bi-pencil'"></i>
                    {{ isEditMode() ? 'Salir de Edición' : 'Modo Edición' }}
                 </button>
               }
                <div class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-xs font-black text-uah-blue dark:text-blue-300 flex items-center gap-2 uppercase tracking-widest">
                   <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                       <span class="relative inline-flex rounded-full h-3 w-3 bg-uah-orange"></span>
                   </span>
                   Semestre 1 - 2026
               </div>
          </div>
      </div>

      <!-- Lab Selector Tabs -->
      <div class="flex flex-wrap justify-center gap-4 mb-8">
          @for (lab of labs; track lab) {
               <button (click)="selectedLab.set(lab)"
                       [class]="selectedLab() === lab 
                         ? 'bg-uah-blue text-white shadow-lg shadow-blue-500/20 scale-105' 
                         : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-uah-orange'"
                      class="px-6 py-3 rounded-2xl font-bold transition-all duration-300 border border-transparent flex items-center gap-2">
                  <i [class]="getIcon(lab)"></i>
                  {{ lab }}
              </button>
          }
      </div>

      <!-- The Schedule Grid -->
      <div class="glass-panel bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow-2xl overflow-hidden border border-white/50 dark:border-gray-700 relative">
          
          <!-- Background decoration -->
          <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div class="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

          <div class="overflow-x-auto custom-scrollbar">
              <div class="min-w-[1000px] p-6">
                  <!-- Days Header -->
                  <div class="grid grid-cols-6 gap-4 mb-4">
                       <div class="text-center font-black text-gray-400 uppercase text-[10px] tracking-widest self-end pb-2">BLOQUE HORARIO</div>
                      @for (day of days; track day) {
                          <div class="text-center">
                               <div class="font-black text-uah-blue dark:text-gray-100 text-lg uppercase tracking-tighter">{{ day }}</div>
                               <div class="h-1 w-12 bg-uah-orange rounded-full mx-auto mt-1 opacity-50"></div>
                          </div>
                      }
                  </div>

                  <!-- Time Blocks Rows -->
                  <div class="space-y-4">
                      @for (block of timeBlocks; track block) {
                          <div class="grid grid-cols-6 gap-4 group">
                              <!-- Time Column -->
                               <div class="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl text-[10px] font-black text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-indigo-900/20 transition-colors uppercase tracking-tight">
                                  {{ block }}
                              </div>

                              <!-- Days Columns -->
                              @for (day of days; track day) {
                                  @let cellClass = getClass(day, block);
                                  
                                   <div (click)="editCell(day, block, cellClass)"
                                        class="relative min-h-[100px] rounded-xl border transition-all duration-300 flex flex-col justify-center items-center p-3 text-center"
                                        [class]="cellClass ? 
                                           'shadow-sm hover:shadow-md hover:-translate-y-1' : 
                                           'bg-white/40 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700 opacity-60 hover:opacity-100'"
                                         [style.backgroundColor]="cellClass?.color ? cellClass.color + '20' : (cellClass ? '#00336620' : '')"
                                         [style.borderColor]="cellClass?.color ? cellClass.color : (cellClass ? '#003366' : '')"
                                        [class.cursor-pointer]="isEditMode()"
                                        [class.ring-2]="isEditMode()"
                                        [class.ring-amber-400]="isEditMode()">
                                       
                                       @if (cellClass) {
                                            <span class="text-[10px] font-black uppercase tracking-widest mb-1" [style.color]="cellClass.color || '#003366'">OCUPADO</span>
                                          <div class="font-bold text-gray-800 dark:text-white text-xs leading-tight line-clamp-3">
                                              {{ cellClass.subject }}
                                          </div>
                                      } @else {
                                           <span class="text-[10px] text-gray-300 dark:text-gray-600 font-bold uppercase tracking-widest">Disponible</span>
                                      }

                                      @if (isEditMode()) {
                                          <div class="absolute inset-0 bg-amber-500/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                                              <i class="bi bi-pencil-square text-amber-600 text-xl shadow-sm"></i>
                                          </div>
                                      }
                                  </div>
                              }
                          </div>
                      }
                  </div>
              </div>
          </div>
      </div>
      
      <div class="mt-6 text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
              <i class="bi bi-info-circle"></i> Los bloques marcados en color indican clases regulares. El laboratorio no admite reservas externas durante estos periodos.
          </p>
      </div>

    </div>
  `
})
export class ScheduleComponent {
    data = inject(DataService);

    labs = ['FABLAB', 'HACKERLAB', 'DESARROLLO TECNOLOGICO'];
    selectedLab = signal('FABLAB');
    isEditMode = signal(false);

    days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    timeBlocks = [
        '08:30 - 09:50',
        '10:00 - 11:20',
        '11:30 - 12:50',
        '13:00 - 14:20',
        '14:30 - 15:50',
        '16:00 - 17:20',
        '17:30 - 18:50'
    ];

    isAdmin = computed(() => {
        const role = this.data.currentUser()?.rol;
        return role === 'Admin' || role === 'SuperUser';
    });

    getIcon(lab: string): string {
        if (lab.includes('FABLAB')) return 'bi bi-printer';
        if (lab.includes('HACKER')) return 'bi bi-cpu';
        return 'bi bi-code-square';
    }

    getClass(day: string, block: string): ClassSchedule | undefined {
        return this.data.classSchedules().find(c =>
            c.lab === this.selectedLab() &&
            c.day === day &&
            c.block === block
        );
    }

    toggleEditMode() {
        this.isEditMode.update(v => !v);
    }

    async editCell(day: string, block: string, current?: ClassSchedule) {
        if (!this.isEditMode()) return;

        const currentSubject = current?.subject || '';

        Swal.fire({
            title: `Editar Horario`,
            html: `
                <div class="text-left space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre del Ramo / Docente</label>
                        <input id="swal-subject" class="swal2-input w-full m-0" placeholder="Ej: Programación Avanzada - Dr. Soto" value="${currentSubject}">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Etiqueta de Color</label>
                        <div class="flex flex-wrap gap-2 mt-2">
                             ${['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'].map(c => `
                                <button type="button" onclick="document.getElementById('swal-color').value='${c}'; this.parentNode.querySelectorAll('button').forEach(b=>b.style.border='none'); this.style.border='3px solid #000';" 
                                        style="background-color: ${c}; width: 32px; height: 32px; border-radius: 8px; ${current?.color === c ? 'border: 3px solid #000;' : ''}"></button>
                             `).join('')}
                        </div>
                        <input type="hidden" id="swal-color" value="${current?.color || '#3b82f6'}">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    subject: (document.getElementById('swal-subject') as HTMLInputElement).value,
                    color: (document.getElementById('swal-color') as HTMLInputElement).value
                }
            },
            confirmButtonColor: '#4f46e5',
        }).then(async (result: any) => {
            if (result.isConfirmed) {
                const { subject, color } = result.value;

                if (subject.trim() === '') {
                    if (current?.id) {
                        Swal.fire({
                            title: '¿Eliminar bloque?',
                            text: '¿Deseas quitar esta asignatura del horario?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Sí, eliminar',
                            cancelButtonText: 'No, mantener',
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                        }).then(async (delResult: any) => {
                            if (delResult.isConfirmed) {
                                await this.data.deleteSchedule(current.id);
                            }
                        });
                    }
                } else {
                    await this.data.updateSchedule({
                        lab: this.selectedLab(),
                        day,
                        block,
                        subject: subject.trim(),
                        color
                    });

                    Swal.fire({
                        icon: 'success',
                        title: 'Horario Actualizado',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            }
        });
    }
}
