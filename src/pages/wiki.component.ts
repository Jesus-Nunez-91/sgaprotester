import { Component, inject, computed, signal } from '@angular/core';
import { DataService, WikiDoc } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import jsPDF from 'jspdf';

declare const Swal: any;

@Component({
  selector: 'app-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto py-8 animate-fadeIn pb-20 px-4">
      <!-- Header -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/80 dark:bg-gray-800/80 p-6 rounded-3xl shadow-lg border border-white/50 dark:border-gray-700 backdrop-blur-md">
          <div>
              <h2 class="text-3xl font-black text-uah-blue dark:text-blue-400 flex items-center gap-3 tracking-tighter uppercase">
                  <i class="bi bi-book-half"></i> Wiki Institucional
              </h2>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-10">Repositorio de Manuales, Guías y Normativas de Seguridad</p>
          </div>
          <div class="flex gap-3 mt-4 md:mt-0">
            @if (isAdmin()) {
                <button (click)="openAddModal()" class="bg-uah-blue text-white px-4 py-2 rounded-xl font-black text-xs shadow-lg shadow-blue-500/20 hover:bg-blue-800 transition-all flex items-center gap-2 uppercase tracking-widest">
                    <i class="bi bi-journal-plus"></i> Nuevo Documento
                </button>
            }
            <a routerLink="/areas" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                <i class="bi bi-arrow-left"></i> Volver
            </a>
          </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Filter Sidebar -->
          <div class="space-y-4">
              <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                  <h3 class="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Categorías</h3>
                  <div class="space-y-2">
                       <button (click)="filterCategory('all')" [class.bg-blue-50]="selectedCat() === 'all'" [class.text-uah-blue]="selectedCat() === 'all'" class="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
                          <i class="bi bi-grid-fill text-uah-blue"></i> Todos
                      </button>
                       <button (click)="filterCategory('Protocolo')" [class.bg-blue-50]="selectedCat() === 'Protocolo'" [class.text-uah-blue]="selectedCat() === 'Protocolo'" class="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
                          <i class="bi bi-shield-lock-fill text-uah-orange"></i> Protocolos
                      </button>
                      <button (click)="filterCategory('Manual')" [class.bg-blue-50]="selectedCat() === 'Manual'" [class.text-uah-blue]="selectedCat() === 'Manual'" class="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
                          <i class="bi bi-tools text-uah-blue"></i> Manuales de Uso
                      </button>
                      <button (click)="filterCategory('Guia')" [class.bg-blue-50]="selectedCat() === 'Guia'" [class.text-uah-blue]="selectedCat() === 'Guia'" class="w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
                          <i class="bi bi-info-circle-fill text-teal-600"></i> Guías Rápidas
                      </button>
                  </div>
              </div>
          </div>

          <!-- Document Grid -->
          <div class="lg:col-span-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  @for (doc of filteredDocs(); track doc.id) {
                      <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-transparent hover:border-uah-blue/30 transition-all p-6 relative group overflow-hidden">
                          <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2 items-center">
                                @if (isAdmin()) {
                                  <button (click)="openAddModal(doc)" class="text-blue-400 hover:text-blue-600 transition-colors bg-white/80 dark:bg-gray-700/80 p-1.5 rounded-lg backdrop-blur-sm shadow-sm" title="Editar">
                                    <i class="bi bi-pencil-square text-sm"></i>
                                  </button>
                                  <button (click)="deleteDoc(doc.id)" class="text-red-400 hover:text-red-600 transition-colors bg-white/80 dark:bg-gray-700/80 p-1.5 rounded-lg backdrop-blur-sm shadow-sm" title="Eliminar">
                                      <i class="bi bi-trash text-sm"></i>
                                  </button>
                                }
                                @if (!doc.isPublic) {
                                  <span class="bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 opacity-70">
                                      <i class="bi bi-lock-fill text-[9px]"></i> Reservado
                                  </span>
                                }
                            </div>
                          
                          <div class="flex items-center gap-4 mb-4">
                              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" [class]="getCategoryIconClass(doc.category)">
                                  <i [class]="getCategoryIcon(doc.category)"></i>
                              </div>
                               <div>
                                   <h4 class="text-sm font-black text-uah-blue dark:text-white group-hover:text-uah-orange transition-colors uppercase tracking-tight">{{ doc.title }}</h4>
                                   <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">{{ doc.category }}</span>
                               </div>
                          </div>
                          
                          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-6">{{ doc.content }}</p>
                          
                          <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
                              <span class="text-[10px] text-gray-400">{{ doc.createdAt | date:'dd MMM yyyy' }}</span>
                              <div class="flex gap-4">
                                  <button (click)="exportOrDownloadDoc(doc)" class="text-uah-orange hover:text-orange-600 text-sm font-bold transition-all" title="Descargar/Exportar PDF">
                                      <i class="bi bi-file-earmark-arrow-down-fill"></i>
                                  </button>
                                  <button (click)="viewDoc(doc)" class="text-uah-blue text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                      Ver Documento <i class="bi bi-arrow-right"></i>
                                  </button>
                              </div>
                          </div>
                      </div>
                  }
                  @if (filteredDocs().length === 0) {
                      <div class="md:col-span-2 py-20 text-center text-gray-400">
                          <i class="bi bi-search text-6xl opacity-20 mb-4 block"></i>
                          <p>No se encontraron documentos en esta categoría.</p>
                      </div>
                  }
              </div>
          </div>
      </div>
    </div>
  `
})
export class WikiComponent {
  data = inject(DataService);
  selectedCat = signal('all');

  filteredDocs = computed(() => {
    const docs = this.data.wikiDocs();
    const cat = this.selectedCat();
    const userRole = this.data.currentUser()?.rol;
    const isPrivileged = userRole === 'Admin_Labs' || userRole === 'Admin_Acade' || userRole === 'SuperUser';
    
    let filtered = docs;
    // Si no es admin, solo ver públicos
    if (!isPrivileged) {
        filtered = docs.filter(d => d.isPublic);
    }
    
    if (cat === 'all') return filtered;
    return filtered.filter(d => d.category === cat);
  });

  isAdmin = computed(() => {
    const rol = this.data.currentUser()?.rol || '';
    return rol === 'Admin_Labs' || rol === 'Admin_Acade' || rol === 'SuperUser';
  });

  filterCategory(cat: string) {
    this.selectedCat.set(cat);
  }

  getCategoryIcon(cat: string) {
    switch (cat) {
      case 'Protocolo': return 'bi-shield-lock-fill';
      case 'Manual': return 'bi-tools';
      case 'Guia': return 'bi-info-circle-fill';
      default: return 'bi-file-text';
    }
  }

  getCategoryIconClass(cat: string) {
    switch (cat) {
      case 'Protocolo': return 'bg-red-50 text-red-500 dark:bg-red-900/20';
      case 'Manual': return 'bg-amber-50 text-amber-500 dark:bg-amber-900/20';
      case 'Guia': return 'bg-teal-50 text-teal-500 dark:bg-teal-900/20';
      default: return 'bg-gray-50 text-gray-500';
    }
  }

  async openAddModal(docToEdit?: WikiDoc) {
    const { value: result } = await Swal.fire({
      title: docToEdit ? 'Editar Documento' : 'Añadir a la Wiki',
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Título</label>
            <input id="w-title" class="swal2-input w-full m-0 rounded-xl" placeholder="Ej: Protocolo de Seguridad Fablab" value="${docToEdit?.title || ''}">
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Categoría</label>
            <select id="w-cat" class="swal2-input w-full m-0 rounded-xl">
              <option value="Protocolo" ${docToEdit?.category === 'Protocolo' ? 'selected' : ''}>Protocolo</option>
              <option value="Manual" ${docToEdit?.category === 'Manual' ? 'selected' : ''}>Manual de Uso</option>
              <option value="Guia" ${docToEdit?.category === 'Guia' ? 'selected' : ''}>Guía Rápida</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Resumen / Contenido</label>
            <textarea id="w-content" class="swal2-textarea w-full m-0 rounded-xl" rows="3" placeholder="Describa el contenido...">${docToEdit?.content || ''}</textarea>
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Archivo PDF (${docToEdit?.fileUrl ? 'Reemplazar' : 'Opcional'})</label>
            <input type="file" id="w-file" accept="application/pdf" class="swal2-file w-full m-0 mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-uah-blue hover:file:bg-blue-100">
            <p class="text-[10px] text-gray-400 mt-1">Máx. 5MB. Se mostrará en el visor integrado.</p>
          </div>
          <div class="flex items-center gap-2 pt-2 px-1">
            <input type="checkbox" id="w-public" ${docToEdit ? (docToEdit.isPublic ? 'checked' : '') : 'checked'} class="w-4 h-4 rounded text-uah-blue">
            <label for="w-public" class="text-sm font-bold text-gray-700 dark:text-gray-300">Documento Público (Visible para Alumnos)</label>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: docToEdit ? 'Actualizar' : 'Subir Documento',
      preConfirm: () => {
        return new Promise((resolve) => {
            const title = (document.getElementById('w-title') as HTMLInputElement).value;
            const category = (document.getElementById('w-cat') as HTMLSelectElement).value;
            const content = (document.getElementById('w-content') as HTMLTextAreaElement).value;
            const isPublic = (document.getElementById('w-public') as HTMLInputElement).checked;
            
            const fileInput = document.getElementById('w-file') as HTMLInputElement;
            let fileUrl = docToEdit?.fileUrl || '';

            if (fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (file.size > 5 * 1024 * 1024) { 
                    Swal.showValidationMessage('El archivo supera los 5MB');
                    return resolve(false);
                }
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    fileUrl = e.target.result;
                    resolve({ title, category, content, isPublic, fileUrl });
                };
                reader.onerror = () => {
                    Swal.showValidationMessage('Error al leer el archivo PDF');
                    resolve(false);
                }
                reader.readAsDataURL(file);
            } else {
                resolve({ title, category, content, isPublic, fileUrl });
            }
        });
      }
    });

    if (result) {
      if (docToEdit) {
        await this.data.updateWiki(docToEdit.id, result);
      } else {
        await this.data.saveWiki(result);
      }
      Swal.fire('Guardado', 'El documento se ha actualizado correctamente.', 'success');
    }
  }

  viewDoc(doc: WikiDoc) {
    const isPdf = doc.fileUrl && doc.fileUrl.startsWith('data:application/pdf');
    Swal.fire({
        title: `<span class="uppercase font-black text-uah-blue">${doc.title}</span>`,
        html: `
            <div class="text-left mb-4">
                <span class="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-black uppercase text-gray-500">${doc.category}</span>
                <p class="mt-2 text-sm text-gray-600 line-clamp-3">${doc.content}</p>
            </div>
            ${isPdf ? `
                <div class="w-full h-[60vh] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                    <iframe src="${doc.fileUrl}" class="w-full h-full" border="0"></iframe>
                </div>
            ` : `
                <div class="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
                    <p class="whitespace-pre-wrap text-left text-gray-700 italic">"${doc.content}"</p>
                </div>
            `}
        `,
        width: '800px',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'rounded-[2rem]'
        }
    });
  }

  exportOrDownloadDoc(doc: WikiDoc) {
    if (doc.fileUrl && doc.fileUrl.startsWith('data:application/pdf')) {
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = `${doc.title.replace(/\s+/g, '_')}_UAH.pdf`;
        link.click();
    } else {
        const pdf = new jsPDF() as any;
        pdf.setFillColor(0, 51, 102); 
        pdf.rect(0, 0, 210, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('UNIVERSIDAD ALBERTO HURTADO', 105, 12, { align: 'center' });
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Wiki de Laboratorios Tecnológicos', 105, 20, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(doc.title.toUpperCase(), 14, 45);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Categoría: ${doc.category}`, 14, 52);
        pdf.text(`Fecha: ${new Date(doc.createdAt).toLocaleDateString()}`, 14, 58);
        pdf.line(14, 62, 196, 62);
        pdf.setFontSize(11);
        const splitText = pdf.splitTextToSize(doc.content, 180);
        pdf.text(splitText, 14, 70);
        pdf.save(`${doc.title.replace(/\s+/g, '_')}_UAH.pdf`);
    }
  }


  deleteDoc(id: number) {
     Swal.fire({
      title: '¿Eliminar Documento?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
          this.data.deleteWiki(id);
          Swal.fire('Eliminado', 'El documento ha sido removido.', 'success');
      }
    });
  }

  constructor() {}
}
