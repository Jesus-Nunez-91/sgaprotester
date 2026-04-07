import { Component, inject, computed, signal } from '@angular/core';
import { DataService, Project, ProjectTask } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
                                  <button (click)="editProject(project)" class="p-2 text-gray-400 hover:text-uah-blue transition-colors"><i class="bi bi-pencil-square"></i></button>
                                  <button (click)="deleteProject(project.id)" class="p-2 text-gray-400 hover:text-red-500 transition-colors"><i class="bi bi-trash"></i></button>
                              </div>
                          }
                      </div>
                  </div>

                  <!-- Mini Gantt / Phases -->
                  <div class="p-6 bg-gray-50/50 dark:bg-gray-900/30">
                       <div class="flex items-center justify-between mb-4">
                           <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cronograma de Fases</h4>
                           <button (click)="addTask(project)" class="text-[10px] text-uah-orange font-black uppercase tracking-widest hover:underline">+ Añadir Fase</button>
                       </div>
                      
                      <div class="space-y-4">
                          @for (task of (project.tasks || []); track task.id) {
                              <div class="flex flex-col gap-2 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                   <div class="flex items-center justify-between">
                                       <span class="text-sm font-black text-uah-blue dark:text-gray-100 uppercase tracking-tight">{{ task.name }}</span>
                                       <div class="flex items-center gap-3">
                                           <!-- Status Badge -->
                                           <span [ngClass]="getTaskStatusClass(task.status)" class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-current shadow-sm">{{ task.status || 'En espera' }}</span>
                                           
                                           <span class="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{{ task.startDate | date:'dd/MM/yyyy' }}</span>
                                           <i class="bi bi-arrow-right text-gray-300"></i>
                                           <span class="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{{ task.endDate | date:'dd/MM/yyyy' }}</span>
                                           
                                           @if (isAdmin()) {
                                              <button (click)="editTask(project, task)" class="text-gray-400 hover:text-uah-blue transition-colors ml-2" title="Editar Fase"><i class="bi bi-pencil-square"></i></button>
                                              <button (click)="deleteTask(project, task)" class="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar Fase"><i class="bi bi-trash"></i></button>
                                           }
                                       </div>
                                   </div>
                                   @if (task.description) {
                                       <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{{ task.description }}</p>
                                   }
                                   <!-- Progress Bar (Gantt visualizer) -->
                                  <div class="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative group/progress mt-1">
                                      <div class="h-full rounded-full transition-all duration-500" [style.width.%]="task.progress || 0" [style.backgroundColor]="project.color"></div>
                                      <span class="absolute right-0 -top-1 text-[8px] font-bold text-gray-500 opacity-0 group-hover/progress:opacity-100 transition-opacity pr-1">{{ task.progress || 0 }}%</span>
                                  </div>
                              </div>
                          }
                          @if (!project.tasks || project.tasks.length === 0) {
                              <p class="text-center text-gray-400 text-xs py-4 italic">Sin fases definidas aún.</p>
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
  isAdmin = computed(() => {
    const rol = this.data.currentUser()?.rol || '';
    return rol === 'Admin_Labs' || rol === 'Admin_Acade' || rol === 'SuperUser';
  });

  getStatusClass(status: string) {
    switch (status) {
      case 'Planeacion': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'En Progreso': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Finalizado': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getTaskStatusClass(status?: string) {
    switch (status) {
      case 'En proceso': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20';
      case 'Pendiente de Aprobacion': return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20';
      case 'Finalizada': return 'bg-green-50 text-green-600 dark:bg-green-900/20';
      case 'En espera': 
      default: return 'bg-gray-50 text-gray-500 dark:bg-gray-800';
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

  exportToPDF(project: Project) {
    const doc = new jsPDF() as any;
    
    // Configuración de logo e insitucional
    doc.setFillColor(5, 50, 100); 
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIVERSIDAD ALBERTO HURTADO', 105, 12, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Facultad de Ingeniería', 105, 20, { align: 'center' });

    // Título y Detalle del Proyecto
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`PROYECTO: ${project.name.toUpperCase()}`, 14, 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estado: ${project.status}`, 14, 52);
    const splitDesc = doc.splitTextToSize(`Descripción: ${project.description}`, 180);
    doc.text(splitDesc, 14, 58);

    const startY = 60 + (splitDesc.length * 5);
    doc.text(`Fecha Planificada: ${project.startDate} al ${project.endDate}`, 14, startY);

    // Tabla de fases
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CRONOGRAMA DE FASES', 14, startY + 12);

    const tableData = (project.tasks || []).map((t: any) => [
      t.name,
      t.description || 'Sin detalle',
      t.startDate,
      t.endDate,
      t.status || 'En espera',
      `${t.progress || 0}%`
    ]);

    autoTable(doc, {
      startY: startY + 16,
      head: [['FASE', 'DETALLE', 'INICIO', 'FIN', 'ESTADO', 'AVANCE']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 50, 100], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 20 }
      },
      styles: { fontSize: 8, valign: 'middle' }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;

    // Firmas
    doc.line(40, finalY, 90, finalY);
    doc.text('Responsable', 55, finalY + 5);

    doc.line(120, finalY, 170, finalY);
    doc.text('Coordinador General', 130, finalY + 5);

    setTimeout(() => {
        doc.save(`Proyecto_${project.name.replace(/\s+/g, '_')}_Gantt.pdf`);
        Swal.fire('Exportado', 'El PDF ha sido generado exitosamente.', 'success');
    }, 500);
  }

  addTask(project: Project) {
     Swal.fire({
      title: 'Añadir Fase al Proyecto',
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Nombre de la Fase</label>
            <input id="swal-task-name" class="swal2-input w-full m-0 rounded-xl border-gray-300 focus:ring-uah-blue" placeholder="Ej: Adquisición de equipos">
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Detalle de la Fase</label>
            <textarea id="swal-task-desc" class="swal2-textarea w-full m-0 rounded-xl border-gray-300 focus:ring-uah-blue" placeholder="Descripción de los objetivos de esta fase..."></textarea>
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
      confirmButtonText: 'Guardar Fase',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-task-name') as HTMLInputElement).value,
          description: (document.getElementById('swal-task-desc') as HTMLTextAreaElement).value,
          startDate: (document.getElementById('swal-task-start') as HTMLInputElement).value,
          endDate: (document.getElementById('swal-task-end') as HTMLInputElement).value,
          progress: 0,
          status: 'En espera',
          projectId: project.id
        }
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        const currentTasks = project.tasks || [];
        const updatedProject = { ...project, tasks: [...currentTasks, result.value] };
        this.data.saveProject(updatedProject);
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
          progress: parseInt((document.getElementById('swal-task-prog') as HTMLInputElement).value) || 0,
          status: (document.getElementById('swal-task-status') as HTMLSelectElement).value
        }
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        // Encontrar y reemplazar tarea en el proyecto
        const currentTasks = project.tasks || [];
        const updatedTasks = currentTasks.map(t => t.id === task.id ? result.value : t);
        this.data.saveProject({ ...project, tasks: updatedTasks });
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
        this.data.deleteProjectTask(task.id);
      }
    });
  }
}
