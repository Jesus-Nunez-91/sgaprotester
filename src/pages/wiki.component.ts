import { Component, inject, computed, signal } from '@angular/core';
import { DataService, WikiDoc } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
                          <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                               @if (isAdmin()) {
                                 @if (!doc.isPublic) {
                                     <span class="bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 opacity-70">
                                         <i class="bi bi-lock-fill text-[9px]"></i> Privado
                                     </span>
                                 }
                                 <button (click)="deleteDoc(doc.id)" class="text-red-400 hover:text-red-600 transition-colors">
                                     <i class="bi bi-trash text-sm"></i>
                                 </button>
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
                              <button (click)="viewDoc(doc)" class="text-uah-blue text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                                  Ver Documento <i class="bi bi-arrow-right"></i>
                              </button>
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
    if (cat === 'all') return docs;
    return docs.filter(d => d.category === cat);
  });

  isAdmin = computed(() => ['Admin', 'SuperUser'].includes(this.data.currentUser()?.rol || ''));

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

  openAddModal() {
    Swal.fire({
      title: 'Añadir a la Wiki',
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Título</label>
            <input id="w-title" class="swal2-input w-full m-0 rounded-xl" placeholder="Ej: Protocolo de Seguridad Fablab">
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Categoría</label>
            <select id="w-cat" class="swal2-input w-full m-0 rounded-xl">
              <option value="Protocolo">Protocolo</option>
              <option value="Manual">Manual de Uso</option>
              <option value="Guia">Guía Rápida</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Resumen / Contenido</label>
            <textarea id="w-content" class="swal2-textarea w-full m-0 rounded-xl" rows="4"></textarea>
          </div>
          <div class="flex items-center gap-2 pt-2 px-1">
            <input type="checkbox" id="w-public" checked class="w-4 h-4 rounded text-uah-blue">
            <label for="w-public" class="text-sm font-bold text-gray-700 dark:text-gray-300">Hacer este documento público</label>
          </div>
        </div>
      `,
      showCancelButton: true,
      preConfirm: () => {
        const title = (document.getElementById('w-title') as HTMLInputElement).value;
        const category = (document.getElementById('w-cat') as HTMLSelectElement).value;
        const content = (document.getElementById('w-content') as HTMLTextAreaElement).value;
        const isPublic = (document.getElementById('w-public') as HTMLInputElement).checked;
        return { title, category, content, isPublic };
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.data.saveWiki(result.value);
      }
    });
  }

  viewDoc(doc: WikiDoc) {
     Swal.fire({
      title: doc.title,
      text: doc.content,
      confirmButtonText: 'Cerrar',
      customClass: {
         popup: 'rounded-3xl'
      }
    });
  }

  deleteDoc(id: number) {
     Swal.fire({
      title: '¿Eliminar Documento?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then((result: any) => {
      if (result.isConfirmed) this.data.deleteWiki(id);
    });
  }
}
