import { Component, inject, computed, signal } from '@angular/core';
import { DataService, Project, ProjectTask } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare const Swal: any;

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto py-8 animate-fadeIn pb-20 px-4">
      <!-- Header -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/80 dark:bg-gray-800/80 p-6 rounded-3xl shadow-lg border border-white/50 dark:border-gray-700 backdrop-blur-md">
          <div>
              <h2 class="text-3xl font-black text-uah-blue dark:text-blue-400 flex items-center gap-3 tracking-tighter uppercase">
                  <i class="bi bi-kanban-fill"></i> Proyectos Institucionales
              </h2>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-10">Planificación Estratégica y Seguimiento de Hitos</p>
          </div>
          <div class="flex gap-3 mt-4 md:mt-0">
            @if (isAdmin()) {
                <button (click)="openProjectModal()" class="bg-uah-orange text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center gap-2 uppercase tracking-widest">
                    <i class="bi bi-plus-lg"></i> Nuevo Proyecto
                </button>
            }
            <a routerLink="/areas" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                <i class="bi bi-arrow-left"></i> Volver
            </a>
          </div>
      </div>

      <!-- Projects Grid/Gantt -->
      <div class="grid grid-cols-1 gap-8">
          @for (project of projects(); track project.id) {
              <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden group">
                  <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4" [style.borderLeftColor]="project.color" [style.borderLeftWidth]="'6px'">
                       <div>
                           <h3 class="text-xl font-black text-uah-blue dark:text-white uppercase tracking-tighter">{{ project.name }}</h3>
                           <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ project.description }}</p>
                       </div>
                      <div class="flex items-center gap-6">
                          <div class="text-center">
                              <span class="block text-[10px] font-bold text-gray-400 uppercase">Estado</span>
                              <span [class]="getStatusClass(project.status)" class="px-3 py-1 rounded-full text-xs font-bold">{{ project.status }}</span>
                          </div>
                          <div class="text-center">
                              <span class="block text-[10px] font-bold text-gray-400 uppercase">Fechas</span>
                              <span class="text-sm font-medium dark:text-gray-300">{{ project.startDate | date:'dd MMM' }} - {{ project.endDate | date:'dd MMM yyyy' }}</span>
                          </div>
                          @if (isAdmin()) {
                              <div class="flex gap-2">
                                  <button (click)="exportToPDF(project)" class="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Exportar Carta Gantt a PDF"><i class="bi bi-file-earmark-pdf-fill"></i></button>
                                  <button (click)="exportToExcel(project)" class="p-2 text-gray-400 hover:text-green-500 transition-colors" title="Exportar a Excel"><i class="bi bi-file-earmark-excel-fill"></i></button>
                                  <button (click)="editProject(project)" class="p-2 text-gray-400 hover:text-uah-blue transition-colors"><i class="bi bi-pencil-square"></i></button>
                                  <button (click)="deleteProject(project.id)" class="p-2 text-gray-400 hover:text-red-500 transition-colors"><i class="bi bi-trash"></i></button>
                              </div>
                          }
                      </div>
                  </div>

                  <!-- Phases Table -->
                  <div class="p-6 bg-gray-50 dark:bg-gray-900/50">
                      <div class="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                          <h4 class="text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-uah-blue flex items-center gap-2 transition-colors select-none" (click)="toggleProjectExpansion(project.id)" title="Expandir/Ocultar Cronograma">
                              @if (isProjectExpanded(project.id)) {
                                  <i class="bi bi-chevron-down"></i>
                              } @else {
                                  <i class="bi bi-chevron-right"></i>
                              }
                              Cronograma de Fases
                          </h4>
                          @if (isAdmin()) {
                              <button (click)="addTask(project)" class="text-uah-orange hover:text-orange-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <i class="bi bi-plus-lg"></i> Añadir Fase
                              </button>
                          }
                      </div>

                      @if (isProjectExpanded(project.id)) {
                          @if (project.tasks && project.tasks.length > 0) {
                          <!-- Nuevo Gantt Visual -->
                          <div class="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 mt-2 filter drop-shadow-sm bg-white dark:bg-gray-800 pb-2">
                             <div class="min-w-[800px]">
                                <!-- Cabecera de Meses y Semanas -->
                                <div class="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                                    <div class="w-64 min-w-[16rem] p-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 dark:border-gray-700 flex items-end">
                                        Actividades
                                    </div>
                                    <div class="flex-1 flex">
                                        @for (month of getGanttHeaders(project); track month.name + month.year) {
                                            <div class="flex-1 border-r border-gray-100 dark:border-gray-700 last:border-r-0">
                                                <div class="text-[10px] font-bold text-center py-1.5 bg-gray-100 dark:bg-gray-800 text-uah-blue dark:text-blue-300 uppercase tracking-widest border-b border-gray-200 dark:border-gray-600">
                                                    {{ month.name }} {{ month.year }}
                                                </div>
                                                <div class="flex">
                                                    @for (day of month.days; track day) {
                                                        <div class="flex-1 text-[9px] text-center font-bold text-gray-400 py-1 border-r border-dashed border-gray-200 dark:border-gray-700 last:border-r-0">
                                                            {{ day }}
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                                <!-- Cuerpo del Gantt -->
                                <div class="divide-y divide-gray-100 dark:divide-gray-700">
                                     @for (task of project.tasks; track task.id; let i = $index) {
                                         <div class="flex relative hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                             <div class="w-64 min-w-[16rem] p-3 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col justify-center">
                                                 <div class="flex justify-between items-start gap-2">
                                                     <div class="font-bold text-xs text-gray-800 dark:text-gray-200 leading-tight">
                                                         <span class="text-gray-400 mr-1">{{i + 1}}.</span>{{ task.name }}
                                                     </div>
                                                     @if (task.assignees) {
                                                         <div class="flex flex-wrap gap-1 mt-1.5 flex-1">
                                                             @for (person of task.assignees.split(','); track person) {
                                                                 @if (person.trim()) {
                                                                     <div class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-uah-blue dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-sm transition-transform hover:scale-110 cursor-help" [title]="person.trim()">
                                                                         <i class="bi bi-person-fill text-[10px]"></i>
                                                                     </div>
                                                                 }
                                                             }
                                                         </div>
                                                     }
                                                     @if (isAdmin()) {
                                                         <div class="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button (click)="editTask(project, task)" class="p-1 text-gray-400 hover:text-uah-blue"><i class="bi bi-pencil text-[10px]"></i></button>
                                                            <button (click)="deleteTask(project, task)" class="p-1 text-gray-400 hover:text-red-500"><i class="bi bi-trash text-[10px]"></i></button>
                                                         </div>
                                                     }
                                                 </div>
                                                 <div class="flex items-center justify-between mt-2">
                                                     <div class="text-[9px] text-gray-400 uppercase tracking-widest">{{ task.startDate | date:'dd/MM' }} - {{ task.endDate | date:'dd/MM' }}</div>
                                                     <span [class]="getTaskStatusClass(task.status || 'En espera')" class="text-[8px] font-black flex items-center gap-1 uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm border border-black/5 dark:border-white/5 whitespace-nowrap">
                                                         {{ task.status === 'Finalizada' ? '✓' : (task.status === 'En espera' ? '⏳' : '●') }} {{ task.status || 'En espera' }}
                                                     </span>
                                                 </div>
                                                 <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2 overflow-hidden flex items-center shadow-inner" [title]="task.progress + '% completado'">
                                                     <div class="h-full rounded-full transition-all duration-500 relative flex items-center justify-end pr-2" 
                                                          [style.width]="task.progress + '%'" 
                                                          [style.backgroundColor]="getTaskProgressColor(task.progress)">
                                                          @if (task.progress > 10) {
                                                              <span class="text-[9px] font-black text-white" style="text-shadow: 0px 1px 2px rgba(0,0,0,0.6);">{{task.progress}}%</span>
                                                          }
                                                     </div>
                                                 </div>
                                             </div>
                                             <div class="flex-1 flex bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJub25lIi8+PC9zdmc+')] relative">
                                                @for (month of getGanttHeaders(project); track month.name + month.year) {
                                                    <div class="flex-1 flex border-r border-gray-100 dark:border-gray-700 last:border-r-0 relative z-0">
                                                        @for (day of month.days; track day) {
                                                            <div class="flex-1 border-r border-dashed border-gray-100 dark:border-gray-700 last:border-r-0 py-2 px-0.5 min-w-[20px]">
                                                                @if (isTaskInDay(task, month.year, month.monthIndex, day)) {
                                                                     <div class="h-full w-full rounded-sm opacity-90 transition-all hover:opacity-100 shadow-sm flex items-center justify-center relative overflow-hidden"
                                                                          [style.backgroundColor]="getTaskProgressColor(task.progress)"
                                                                          [title]="task.name + ' (' + task.progress + '%)'">
                                                                          <div class="absolute inset-0 bg-gradient-to-r from-transparent to-black/10"></div>
                                                                     </div>
                                                                }
                                                            </div>
                                                        }
                                                    </div>
                                                }
                                             </div>
                                         </div>
                                     }
                                 </div>
                                 <!-- Leyenda de Progreso -->
                                 <div class="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                                     <h4 class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><i class="bi bi-palette-fill"></i> Leyenda de Progreso (Colores)</h4>
                                     <div class="flex flex-wrap gap-x-6 gap-y-2 text-[9px] font-bold text-gray-500 uppercase">
                                         <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[#ef4444] shadow-sm"></span> 0-24% : Crítico / Iniciando</div>
                                         <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[#f97316] shadow-sm"></span> 25-49% : En Despliegue</div>
                                         <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[#eab308] shadow-sm"></span> 50-74% : Avanzado</div>
                                         <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[#3b82f6] shadow-sm"></span> 75-99% : Etapa Final</div>
                                         <div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[#22c55e] shadow-sm"></span> 100% : Completado</div>
                                     </div>
                                 </div>
                              </div>
                           </div>
                      } @else {
                          <div class="text-center py-10 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                             <i class="bi bi-calendar-x text-3xl text-gray-300 block mb-2"></i>
                             <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">Sin fases definidas aún.</p>
                          </div>
                      }
                  }
                  </div>
              </div>
          }
      </div>
    </div>
  `,
  styles: [`
    .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProjectsComponent {
  data = inject(DataService);
  projects = this.data.projects;
  isAdmin = computed(() => ['SuperUser', 'Admin_Acade', 'Admin_Labs'].includes(this.data.currentUser()?.rol || ''));

  expandedProjects = signal<Set<number>>(new Set());

  toggleProjectExpansion(projectId: number) {
    this.expandedProjects.update(set => {
      const newSet = new Set(set);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }
  
  isProjectExpanded(projectId: number) {
    return this.expandedProjects().has(projectId);
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Finalizado': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'En Progreso': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  }

  getTaskStatusClass(status: string) {
    switch (status) {
      case 'Finalizada': return 'bg-green-100 text-green-600';
      case 'En proceso': return 'bg-blue-100 text-blue-600';
      case 'Pendiente de Aprobacion': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  }

  getTaskProgressColor(progress: number) {
      if (progress < 25) return '#ef4444'; // Rojo
      if (progress < 50) return '#f97316'; // Naranja
      if (progress < 75) return '#eab308'; // Amarillo
      if (progress < 100) return '#3b82f6'; // Azul
      return '#22c55e'; // Verde
  }

  openProjectModal() {
    Swal.fire({
      title: 'Crear Nuevo Proyecto',
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Nombre del Proyecto</label>
            <input id="swal-name" class="swal2-input w-full m-0 rounded-xl border-gray-300 focus:ring-uah-blue" placeholder="Ej: Renovación Impresoras 3D">
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Descripción</label>
            <textarea id="swal-desc" class="swal2-textarea w-full m-0 rounded-xl border-gray-300 focus:ring-uah-blue" placeholder="Detalle de los objetivos..."></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Inicio</label>
              <input id="swal-start" type="date" class="swal2-input w-full m-0 rounded-xl border-gray-300">
            </div>
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Fin Estimado</label>
              <input id="swal-end" type="date" class="swal2-input w-full m-0 rounded-xl border-gray-300">
            </div>
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Color de Identificación</label>
            <input id="swal-color" type="color" class="w-full h-10 rounded-xl border-none cursor-pointer" value="#3b82f6">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear Proyecto',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-name') as HTMLInputElement).value,
          description: (document.getElementById('swal-desc') as HTMLTextAreaElement).value,
          startDate: (document.getElementById('swal-start') as HTMLInputElement).value,
          endDate: (document.getElementById('swal-end') as HTMLInputElement).value,
          color: (document.getElementById('swal-color') as HTMLInputElement).value,
          status: 'Planeacion',
          managerId: this.data.currentUser()?.id,
          tasks: []
        }
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.data.saveProject(result.value);
      }
    });
  }

  editProject(project: Project) {
      Swal.fire({
      title: 'Editar Proyecto',
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Nombre del Proyecto</label>
            <input id="swal-name" class="swal2-input w-full m-0 rounded-xl" value="${project.name}">
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Descripción</label>
            <textarea id="swal-desc" class="swal2-textarea w-full m-0 rounded-xl">${project.description}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Inicio</label>
              <input id="swal-start" type="date" class="swal2-input w-full m-0" value="${project.startDate}">
            </div>
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Fin</label>
              <input id="swal-end" type="date" class="swal2-input w-full m-0" value="${project.endDate}">
            </div>
          </div>
           <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Color</label>
            <input id="swal-color" type="color" class="w-full h-10 rounded-xl border-none cursor-pointer" value="${project.color}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      preConfirm: () => {
        return {
          ...project,
          name: (document.getElementById('swal-name') as HTMLInputElement).value,
          description: (document.getElementById('swal-desc') as HTMLTextAreaElement).value,
          startDate: (document.getElementById('swal-start') as HTMLInputElement).value,
          endDate: (document.getElementById('swal-end') as HTMLInputElement).value,
          color: (document.getElementById('swal-color') as HTMLInputElement).value
        }
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.data.saveProject(result.value);
      }
    });
  }

  deleteProject(id: number) {
    Swal.fire({
      title: '¿Eliminar Proyecto?',
      text: 'Se perderán todas las fases asociadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.data.deleteProject(id);
      }
    });
  }

  addTask(project: Project) {
    Swal.fire({
      title: 'Añadir Fase al Proyecto',
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Nombre de la Fase</label>
            <input id="swal-task-name" class="swal2-input w-full m-0 rounded-xl" placeholder="Ej: Adquisición de equipos">
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Detalle de la Fase</label>
            <textarea id="swal-task-desc" class="swal2-textarea w-full m-0 rounded-xl" placeholder="Descripción de los objetivos..."></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Inicio</label>
              <input id="swal-task-start" type="date" class="swal2-input w-full m-0 rounded-xl">
            </div>
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Fin</label>
              <input id="swal-task-end" type="date" class="swal2-input w-full m-0 rounded-xl">
            </div>
          </div>
          <div class="mt-4">
            <div class="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <label class="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1"><i class="bi bi-people-fill"></i> Participantes</label>
                <button type="button" class="text-[9px] text-uah-blue font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900 top-0 right-0 rounded transition-colors uppercase tracking-widest" onclick="
                    const cont = document.getElementById('participantes-list');
                    const row = document.createElement('div');
                    row.className = 'flex gap-2 mt-2 animate-fadeIn';
                    row.innerHTML = '<input class=\\'swal2-input w-full m-0 h-8 rounded-lg text-sm border-gray-200 swal-participant\\' placeholder=\\'Escribe el nombre aquí...\\'><button type=\\'button\\' class=\\'text-red-500 hover:text-red-700 px-2 transition-colors\\' onclick=\\'this.parentElement.remove()\\'><i class=\\'bi bi-x-circle-fill\\'></i></button>';
                    cont.appendChild(row);
                "><i class="bi bi-plus-lg"></i> Añadir Persona</button>
            </div>
            <div id="participantes-list" class="space-y-0 text-left max-h-32 overflow-y-auto pr-1"></div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Fase',
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-task-name') as HTMLInputElement).value,
          description: (document.getElementById('swal-task-desc') as HTMLTextAreaElement).value,
          startDate: (document.getElementById('swal-task-start') as HTMLInputElement).value,
          endDate: (document.getElementById('swal-task-end') as HTMLInputElement).value,
          assignees: Array.from(document.querySelectorAll('.swal-participant')).map((el: any) => el.value).filter((v: string) => v.trim() !== '').join(','),
          progress: 0,
          status: 'En espera',
          projectId: project.id
        }
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.data.addProjectTask(project, result.value);
      }
    });
  }

  editTask(project: Project, task: ProjectTask) {
    Swal.fire({
      title: 'Editar Fase',
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Nombre de la Fase</label>
            <input id="swal-task-name" class="swal2-input w-full m-0 rounded-xl" value="${task.name}">
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Detalle de la Fase</label>
            <textarea id="swal-task-desc" class="swal2-textarea w-full m-0 rounded-xl">${task.description || ''}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Inicio</label>
              <input id="swal-task-start" type="date" class="swal2-input w-full m-0" value="${task.startDate}">
            </div>
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Fin</label>
              <input id="swal-task-end" type="date" class="swal2-input w-full m-0" value="${task.endDate}">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold text-gray-500 uppercase">Avance (%)</label>
                <input id="swal-task-prog" type="number" min="0" max="100" class="swal2-input w-full m-0" value="${task.progress}">
              </div>
              <div>
                <label class="text-xs font-bold text-gray-500 uppercase">Estado</label>
                <select id="swal-task-status" class="swal2-input w-full m-0 text-sm">
                  <option value="En espera" ${task.status === 'En espera' ? 'selected' : ''}>En espera</option>
                  <option value="En proceso" ${task.status === 'En proceso' ? 'selected' : ''}>En proceso</option>
                  <option value="Pendiente de Aprobacion" ${task.status === 'Pendiente de Aprobacion' ? 'selected' : ''}>Pendiente Aprob.</option>
                  <option value="Finalizada" ${task.status === 'Finalizada' ? 'selected' : ''}>Finalizada</option>
                </select>
              </div>
          </div>
          <div class="mt-4">
            <div class="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <label class="text-[10px] font-black text-gray-500 uppercase flex items-center gap-1"><i class="bi bi-people-fill"></i> Participantes</label>
                <button type="button" class="text-[9px] text-uah-blue font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900 top-0 right-0 rounded transition-colors uppercase tracking-widest" onclick="
                    const cont = document.getElementById('participantes-list');
                    const row = document.createElement('div');
                    row.className = 'flex gap-2 mt-2 animate-fadeIn';
                    row.innerHTML = '<input class=\\'swal2-input w-full m-0 h-8 rounded-lg text-sm border-gray-200 swal-participant\\' placeholder=\\'Escribe el nombre aquí...\\'><button type=\\'button\\' class=\\'text-red-500 hover:text-red-700 px-2 transition-colors\\' onclick=\\'this.parentElement.remove()\\'><i class=\\'bi bi-x-circle-fill\\'></i></button>';
                    cont.appendChild(row);
                "><i class="bi bi-plus-lg"></i> Añadir Persona</button>
            </div>
            <div id="participantes-list" class="space-y-0 text-left max-h-32 overflow-y-auto pr-1">
               ${(task.assignees || '').split(',').filter(x => x.trim() !== '').map(p => `
                  <div class="flex gap-2 mt-2">
                      <input class="swal2-input w-full m-0 h-8 rounded-lg text-sm border-gray-200 swal-participant" value="${p.trim()}" placeholder="Escribe el nombre aquí...">
                      <button type="button" class="text-red-500 hover:text-red-700 px-2 transition-colors" onclick="this.parentElement.remove()"><i class="bi bi-x-circle-fill"></i></button>
                  </div>
               `).join('')}
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      preConfirm: () => {
        return {
          ...task,
          name: (document.getElementById('swal-task-name') as HTMLInputElement).value,
          description: (document.getElementById('swal-task-desc') as HTMLTextAreaElement).value,
          startDate: (document.getElementById('swal-task-start') as HTMLInputElement).value,
          endDate: (document.getElementById('swal-task-end') as HTMLInputElement).value,
          assignees: Array.from(document.querySelectorAll('.swal-participant')).map((el: any) => el.value).filter((v: string) => v.trim() !== '').join(','),
          progress: parseInt((document.getElementById('swal-task-prog') as HTMLInputElement).value) || 0,
          status: (document.getElementById('swal-task-status') as HTMLSelectElement).value
        }
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.data.updateProjectTask(project, result.value);
        Swal.fire('Fase Actualizada', '', 'success');
      }
    });
  }

  deleteTask(project: Project, task: ProjectTask) {
    Swal.fire({
      title: '¿Eliminar Fase?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.data.deleteProjectTask(project, task.id);
      }
    });
  }

  exportToPDF(project: Project) {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const primaryColor: [number, number, number] = [0, 51, 102];
    const accentColor: [number, number, number] = [255, 120, 0];

    // Cabecera Institucional
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIVERSIDAD ALBERTO HURTADO', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Departamento de Tecnologías e Ingeniería', pageWidth / 2, 22, { align: 'center' });
    doc.text('SISTEMA DE GESTIÓN DE PROYECTOS (SGA PRO)', pageWidth / 2, 28, { align: 'center' });

    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(1);
    doc.line(0, 35, pageWidth, 35);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(project.name ? project.name.toUpperCase() : 'PROYECTO SIN NOMBRE', 14, 50);

    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 55, pageWidth - 28, 30, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('ESTADO:', 20, 62);
    doc.text('PERIODO:', 20, 69);
    doc.text('ID PROYECTO:', 20, 76);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(project.status || 'Planeación', 50, 62);
    doc.text(`${project.startDate || 'N/A'} al ${project.endDate || 'N/A'}`, 50, 69);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${project.id}`, 50, 76);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPCION GENERAL:', 14, 95);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(project.description || 'Sin descripción detallada.', pageWidth - 28);
    doc.text(splitDesc, 14, 102);

    let startY = 105 + (splitDesc.length * 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const hasTasks = project.tasks && project.tasks.length > 0;
    doc.text(hasTasks ? 'CRONOGRAMA DE ACTIVIDADES Y HITOS' : 'SIN ACTIVIDADES REGISTRADAS', 14, startY);

    if (hasTasks) {
       startY += 5;
       const headers = this.getGanttHeaders(project);
       
       // Construct matrix for jsPDF
       const head = [['Actividad', ...headers.map(h => `${h.name} ${h.year}`)]];
       const body = project.tasks.map(t => {
           const row = [`${t.name}\n${t.progress}%`];
           headers.forEach(h => {
               // Para PDF dibujaremos un bloque solido o cruz
               let inMonth = false;
               h.days.forEach((d: number) => {
                   if (this.isTaskInDay(t, h.year, h.monthIndex, d)) inMonth = true;
               });
               row.push(inMonth ? '████' : '');
           });
           return row;
       });

       autoTable(doc, {
        startY: startY + 5,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        bodyStyles: { textColor: [50, 50, 50], fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', minCellWidth: 40 } },
        styles: { cellPadding: 2, overflow: 'linebreak' },
        didParseCell: function (data: any) {
            // Pinta color secundario en los "cuadros" del Gantt
            if (data.section === 'body' && data.column.index > 0 && data.cell.raw === '████') {
                data.cell.styles.textColor = accentColor;
            }
        }
       });
    }

    doc.save(`Gantt_Proyecto_${project.id}_SGA.pdf`);
  }

  getGanttHeaders(project: Project) {
      if (!project.startDate || !project.endDate) return [];
      const start = new Date(project.startDate + 'T12:00:00');
      const end = new Date(project.endDate + 'T12:00:00');
      const headers = [];
      
      let current = new Date(start.getFullYear(), start.getMonth(), 1); 
      const endMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0);
      
      while (current <= endMonth) {
          const monthName = current.toLocaleString('es-ES', { month: 'short' });
          
          const daysInMonth = [];
          const daysToIterate = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
          
          for(let i = 1; i <= daysToIterate; i++) {
             const d = new Date(current.getFullYear(), current.getMonth(), i);
             const dayOfWeek = d.getDay();
             if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
                 daysInMonth.push(i);
             }
          }
          
          headers.push({
              name: monthName,
              year: current.getFullYear(),
              monthIndex: current.getMonth(),
              days: daysInMonth 
          });
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
      return headers;
  }
  
  isTaskInDay(task: ProjectTask, year: number, monthIndex: number, day: number) {
      if (!task.startDate || !task.endDate) return false;
      
      const tStartStr = task.startDate + 'T00:00:00';
      const tEndStr = task.endDate + 'T23:59:59';
      const tStart = new Date(tStartStr);
      const tEnd = new Date(tEndStr);
      
      const currentDay = new Date(year, monthIndex, day, 12, 0, 0);
      
      return (currentDay >= tStart && currentDay <= tEnd);
  }

  exportToExcel(project: Project) {
      const headers = this.getGanttHeaders(project);
      
      const wsData: any[][] = [];
      
      const rowMonths: any[] = ['Nº', 'Actividades', 'Días ->', 'Inicio', 'Fin', '%'];
      headers.forEach(h => {
          rowMonths.push(`${h.name} ${h.year}`);
          for(let i=1; i<h.days.length; i++) {
              rowMonths.push('');
          }
      });
      wsData.push(rowMonths);
      
      const rowDays: any[] = ['', '', '', '', '', ''];
      headers.forEach(h => {
          h.days.forEach((d: number) => {
              rowDays.push(d.toString());
          });
      });
      wsData.push(rowDays);
      
      project.tasks?.forEach((task, index) => {
          const rowData: any[] = [
              index + 1,
              task.name,
              '',
              task.startDate,
              task.endDate,
              task.progress + '%'
          ];
          
          headers.forEach(h => {
              h.days.forEach((d: any) => {
                  let indicator = this.isTaskInDay(task, h.year, h.monthIndex, d) ? '██████' : '';
                  rowData.push(indicator);
              });
          });
          
          wsData.push(rowData);
      });
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Carta Gantt");
      
      XLSX.writeFile(wb, `Carta_Gantt_${project.name.replace(/\s+/g, '_')}.xlsx`);
  }
}
