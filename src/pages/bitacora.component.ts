import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare var Swal: any;

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-8 animate-fadeIn">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 class="text-3xl font-black text-uah-blue dark:text-white flex items-center gap-3 tracking-tighter uppercase">
              <i class="bi bi-journal-text"></i> Bitácora de Gestión
            </h1>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Registro Institucional de Novedades y Casos</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            @if (selectedIds().size > 0) {
                <button (click)="exportSelectedToPDF()" 
                        class="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 uppercase text-xs tracking-widest animate-bounceIn">
                  <i class="bi bi-file-earmark-check-fill"></i> PDF Selección ({{ selectedIds().size }})
                </button>
                <button (click)="deleteSelected()" 
                        class="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 uppercase text-xs tracking-widest animate-bounceIn">
                  <i class="bi bi-trash3-fill"></i> Eliminar ({{ selectedIds().size }})
                </button>
            } @else {
                <button (click)="exportToPDF()"
                        class="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 font-black px-6 py-3 rounded-2xl shadow-sm transition-all flex items-center gap-2 uppercase text-xs tracking-widest border border-blue-200 dark:border-blue-800">
                  <i class="bi bi-file-earmark-pdf-fill text-red-500"></i> Exportar Todo
                </button>
            }
            <button (click)="openAddModal()" 
                    class="bg-uah-orange hover:bg-orange-600 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 uppercase text-xs tracking-widest">
              <i class="bi bi-plus-circle-fill"></i> Nueva Anotación
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-uah-blue opacity-20"></div>
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Total Registros</span>
            <div class="text-4xl font-black text-uah-blue">{{ data.bitacora().length }}</div>
          </div>
        </div>

        <div class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-900/50">
                  <th class="px-6 py-4 w-10">
                    <input type="checkbox" (change)="toggleAll($event)" [checked]="isAllSelected()" class="rounded border-gray-300 text-uah-blue focus:ring-uah-blue">
                  </th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Laboratorio</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Sección</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Descripción</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Admin</th>
                  <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                @for (entry of data.bitacora(); track entry.id) {
                  <tr class="hover:bg-uah-blue/[0.03] dark:hover:bg-white/[0.02] transition-colors border-l-4 border-transparent hover:border-uah-orange" [class.bg-blue-50]="selectedIds().has(entry.id)">
                    <td class="px-6 py-4">
                      <input type="checkbox" [checked]="selectedIds().has(entry.id)" (change)="toggleSelection(entry.id)" class="rounded border-gray-300 text-uah-blue focus:ring-uah-blue">
                    </td>
                    <td class="px-6 py-4 text-xs font-bold text-gray-400 uppercase">{{ entry.date | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 rounded-full text-[10px] font-bold bg-uah-blue/10 text-uah-blue">
                        {{ entry.lab }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm font-black text-uah-blue dark:text-gray-300">{{ entry.section }}</td>
                    <td class="px-6 py-4">
                      <span [class]="getTypeClass(entry.type)" class="px-3 py-1 rounded-full text-[10px] font-bold">
                        {{ entry.type }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{{ entry.description }}</td>
                    <td class="px-6 py-4 text-sm font-medium text-gray-500">{{ entry.adminName }}</td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex justify-center gap-2">
                        <button (click)="openAddModal(entry)" class="text-blue-400 hover:text-blue-600 transition-colors p-1" title="Editar">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button (click)="deleteEntry(entry.id)" class="text-red-400 hover:text-red-600 transition-colors p-1" title="Eliminar">
                          <i class="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BitacoraComponent implements OnInit {
  data = inject(DataService);
  selectedIds = signal<Set<number>>(new Set());
  isAllSelected = computed(() => this.data.bitacora().length > 0 && this.selectedIds().size === this.data.bitacora().length);

  ngOnInit() {
    this.data.fetchBitacora();
  }

  toggleSelection(id: number) {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      this.selectedIds.set(new Set(this.data.bitacora().map(e => e.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  getTypeClass(type: string) {
    switch (type) {
      case 'Incidencia': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'Observacion': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Mejora': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  deleteEntry(id: number) {
    Swal.fire({
      title: '<h3 class="text-uah-blue font-black uppercase tracking-tighter">¿Eliminar registro?</h3>',
      text: "Esta acción removerá permanentemente la anotación de la bitácora institucional.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#003366',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        await this.data.deleteBitacora(id);
        const next = new Set(this.selectedIds());
        next.delete(id);
        this.selectedIds.set(next);
      }
    });
  }

  async deleteSelected() {
    const count = this.selectedIds().size;
    Swal.fire({
      title: `¿Eliminar ${count} registros?`,
      text: "Esta acción es masiva y permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        for (const id of this.selectedIds()) {
          await this.data.deleteBitacora(id);
        }
        this.selectedIds.set(new Set());
        Swal.fire('Eliminados', 'Los registros se han borrado exitosamente.', 'success');
      }
    });
  }

  async openAddModal(entry?: any) {
    const { value: formValues } = await Swal.fire({
      title: `<h3 class="text-uah-blue font-black uppercase">${entry ? 'Editar' : 'Nueva'} Anotación</h3>`,
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Laboratorio Principal</label>
            <select id="b-lab" class="swal2-input w-full m-0 rounded-xl">
              <option value="FABLAB" ${entry?.lab === 'FABLAB' ? 'selected' : ''}>FABLAB</option>
              <option value="LAB CIENCIAS BASICAS" ${entry?.lab === 'LAB CIENCIAS BASICAS' ? 'selected' : ''}>CIENCIAS BÁSICAS</option>
              <option value="LAB INFORMATICA" ${entry?.lab === 'LAB INFORMATICA' ? 'selected' : ''}>INFORMÁTICA</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Sección / Área Específica</label>
            <input id="b-section" class="swal2-input w-full m-0 rounded-xl" placeholder="Ej: Biomateriales, Química..." value="${entry?.section || ''}">
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Tipo de Nota</label>
            <select id="b-type" class="swal2-input w-full m-0 rounded-xl">
              <option value="Incidencia" ${entry?.type === 'Incidencia' ? 'selected' : ''}>Incidencia / Fallo</option>
              <option value="Observacion" ${entry?.type === 'Observacion' ? 'selected' : ''}>Observación</option>
              <option value="Mejora" ${entry?.type === 'Mejora' ? 'selected' : ''}>Propuesta de Mejora</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Descripción Detallada</label>
            <textarea id="b-desc" class="swal2-textarea w-full m-0 rounded-xl" rows="4" placeholder="Describa el evento...">${entry?.description || ''}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      preConfirm: () => {
        return {
          id: entry?.id,
          lab: (document.getElementById('b-lab') as HTMLSelectElement).value,
          section: (document.getElementById('b-section') as HTMLInputElement).value,
          type: (document.getElementById('b-type') as HTMLSelectElement).value,
          description: (document.getElementById('b-desc') as HTMLTextAreaElement).value
        }
      }
    });

    if (formValues) {
      await this.data.saveBitacora(formValues);
    }
  }

  exportToPDF() {
    this.generatePDF(this.data.bitacora(), "Reporte_Completo_Bitacora_UAH.pdf");
  }

  exportSelectedToPDF() {
    const selected = this.data.bitacora().filter(e => this.selectedIds().has(e.id));
    this.generatePDF(selected, "Reporte_Seleccion_Bitacora_UAH.pdf");
  }

  private generatePDF(entries: any[], filename: string) {
    if (entries.length === 0) {
      Swal.fire('Atención', 'No hay datos para exportar.', 'info');
      return;
    }

    const doc = new jsPDF('p', 'pt', 'a4');
    const margins = { top: 70, bottom: 40, left: 40, right: 40 };

    // --- Header Institucional ---
    doc.setFillColor(0, 51, 102); // uah-blue
    doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text("UNIVERSIDAD ALBERTO HURTADO", 40, 45);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("FACULTAD DE INGENIERÍA - LABORATORIOS TECNOLÓGICOS", 40, 60);

    doc.setDrawColor(240, 100, 39); // uah-orange
    doc.setLineWidth(1.5);
    doc.line(40, 68, doc.internal.pageSize.width - 40, 68);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text("REPORTE ACADÉMICO / BITÁCORA", doc.internal.pageSize.width / 2, 95, { align: "center" });
    
    const currentFullDate = new Date();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Fecha de Emisión: ${currentFullDate.toLocaleDateString('es-CL')} ${currentFullDate.toLocaleTimeString('es-CL')}`, doc.internal.pageSize.width - 40, 45, { align: "right" });
    
    const tableBody = entries.map(entry => {
       const dateObj = new Date(entry.date);
       const dateStr = `${dateObj.toLocaleDateString('es-CL')} ${dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
       return [
         dateStr,
         entry.lab,
         entry.section,
         entry.type,
         entry.description,
         entry.adminName
       ];
    });

    autoTable(doc, {
      startY: 110,
      head: [['Fecha', 'Laboratorio', 'Sección', 'Tipo', 'Descripción', 'Administrador']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { fontSize: 9, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 80 },
        2: { cellWidth: 80 },
        3: { cellWidth: 60 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 70 }
      },
      styles: { overflow: 'linebreak', cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: margins,
      didDrawPage: (data: any) => {
        const str = 'Página ' + doc.getCurrentPageInfo().pageNumber;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 20);
      }
    });

    doc.save(filename);
    
    Swal.fire({
      icon: 'success',
      title: 'PDF Generado',
      text: 'El reporte institucional se ha descargado exitosamente.',
      timer: 2000,
      showConfirmButton: false
    });
  }
}
