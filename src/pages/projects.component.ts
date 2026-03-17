import { Component, inject, computed, signal } from '@angular/core';
import { DataService, Project, ProjectTask } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
                                  <button (click)="editProject(project)" class="p-2 text-gray-400 hover:text-uah-blue transition-colors"><i class="bi bi-pencil-square"></i></button>
                                  <button (click)="deleteProject(project.id)" class="p-2 text-gray-400 hover:text-red-500 transition-colors"><i class="bi bi-trash"></i></button>
                              </div>
                          }
                      </div>
                  </div>

                  <!-- Mini Gantt / Tasks -->
                  <div class="p-6 bg-gray-50/50 dark:bg-gray-900/30">
                       <div class="flex items-center justify-between mb-4">
                           <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cronograma de Tareas</h4>
                           <button (click)="addTask(project)" class="text-[10px] text-uah-orange font-black uppercase tracking-widest hover:underline">+ Añadir Tarea</button>
                       </div>
                      
                      <div class="space-y-3">
                          @for (task of project.tasks; track task.id) {
                              <div class="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                   <div class="w-1/4 min-w-[150px]">
                                       <span class="text-xs font-black text-gray-600 dark:text-gray-200 uppercase tracking-tight">{{ task.name }}</span>
                                   </div>
                                  <div class="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative group/progress">
                                      <div class="h-full rounded-full transition-all duration-500" [style.width.%]="task.progress" [style.backgroundColor]="project.color"></div>
                                      <span class="absolute right-2 top-0 text-[10px] font-bold text-gray-500 opacity-0 group-hover/progress:opacity-100 transition-opacity">{{ task.progress }}%</span>
                                  </div>
                                  <div class="flex items-center gap-3">
                                      <span class="text-xs text-gray-400">{{ task.startDate | date:'dd/MM' }}</span>
                                      <i class="bi bi-arrow-right text-gray-300"></i>
                                      <span class="text-xs text-gray-400">{{ task.endDate | date:'dd/MM' }}</span>
                                  </div>
                              </div>
                          }
                          @if (project.tasks.length === 0) {
                              <p class="text-center text-gray-400 text-xs py-4 italic">Sin tareas definidas aún.</p>
                          }
                      </div>
                  </div>
              </div>
          }
          @if (projects().length === 0) {
              <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <i class="bi bi-calendar-event text-6xl text-gray-200 mb-4 block"></i>
                  <h3 class="text-xl font-bold text-gray-400">No hay proyectos activos</h3>
                  <p class="text-gray-500 max-w-sm mx-auto mt-2">Los proyectos permiten organizar grandes iniciativas y realizar seguimiento mediante Carta Gantt.</p>
              </div>
          }
      </div>
    </div>
  `
})
export class ProjectsComponent {
  data = inject(DataService);

  projects = computed(() => this.data.projects());
  isAdmin = computed(() => ['Admin', 'SuperUser'].includes(this.data.currentUser()?.rol || ''));

  getStatusClass(status: string) {
    switch (status) {
      case 'Planeacion': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'En Progreso': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Finalizado': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700';
    }
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
    // Logic to edit existing project
  }

  deleteProject(id: number) {
    Swal.fire({
      title: '¿Eliminar Proyecto?',
      text: 'Se perderán todas las tareas asociadas.',
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
      title: 'Añadir Tarea al Proyecto',
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Nombre de la Tarea</label>
            <input id="swal-task-name" class="swal2-input w-full m-0 rounded-xl border-gray-300" placeholder="Ej: Compra de insumos">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Inicio</label>
              <input id="swal-task-start" type="date" class="swal2-input w-full m-0 rounded-xl border-gray-300">
            </div>
            <div>
              <label class="text-xs font-bold text-gray-500 uppercase">Fin</label>
              <input id="swal-task-end" type="date" class="swal2-input w-full m-0 rounded-xl border-gray-300">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-task-name') as HTMLInputElement).value,
          startDate: (document.getElementById('swal-task-start') as HTMLInputElement).value,
          endDate: (document.getElementById('swal-task-end') as HTMLInputElement).value,
          progress: 0,
          projectId: project.id
        }
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        const updatedProject = { ...project, tasks: [...project.tasks, result.value] };
        this.data.saveProject(updatedProject);
      }
    });
  }
}
