import { Component, inject, signal, computed } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
          <button (click)="openAddModal()" 
                  class="bg-uah-orange hover:bg-orange-600 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 uppercase text-xs tracking-widest">
            <i class="bi bi-plus-circle-fill"></i> Nueva Anotación
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-uah-blue opacity-20"></div>
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Total Registros</span>
            <div class="text-4xl font-black text-uah-blue">{{ data.bitacora().length }}</div>
          </div>
        </div>

        <div class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white dark:border-gray-700 overflow-hidden">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-900/50">
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Laboratorio</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Sección</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Descripción</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Admin</th>
                <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (entry of data.bitacora(); track entry.id) {
                <tr class="hover:bg-uah-blue/[0.03] dark:hover:bg-white/[0.02] transition-colors border-l-4 border-transparent hover:border-uah-orange">
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
                  <td class="px-6 py-4">
                    <button (click)="deleteEntry(entry.id)" class="text-red-400 hover:text-red-600 transition-colors">
                      <i class="bi bi-trash3-fill"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class BitacoraComponent {
  data = inject(DataService);

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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/bitacora/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${this.data.token()}` }
          });
          if (res.ok) {
            this.data.bitacora.update(entries => entries.filter(e => e.id !== id));
          }
        } catch (e) {
          console.error("Error al eliminar", e);
        }
      }
    });
  }

  async openAddModal() {
    const { value: formValues } = await Swal.fire({
      title: '<h3 class="text-uah-blue font-black uppercase">Nueva Anotación</h3>',
      html: `
        <div class="text-left space-y-4 pt-4">
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Laboratorio Principal</label>
            <select id="b-lab" class="swal2-input w-full m-0 rounded-xl">
              <option value="FABLAB">FABLAB</option>
              <option value="CIENCIAS_BASICAS">CIENCIAS BÁSICAS</option>
              <option value="INFORMATICA">INFORMÁTICA</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Sección / Área Específica</label>
            <input id="b-section" class="swal2-input w-full m-0 rounded-xl" placeholder="Ej: Biomateriales, Química, Hackerlab">
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Tipo de Nota</label>
            <select id="b-type" class="swal2-input w-full m-0 rounded-xl">
              <option value="Incidencia">Incidencia / Fallo</option>
              <option value="Observacion">Observación</option>
              <option value="Mejora">Propuesta de Mejora</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase">Descripción Detallada</label>
            <textarea id="b-desc" class="swal2-textarea w-full m-0 rounded-xl" rows="4"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      preConfirm: () => {
        return {
          lab: (document.getElementById('b-lab') as HTMLSelectElement).value,
          section: (document.getElementById('b-section') as HTMLInputElement).value,
          type: (document.getElementById('b-type') as HTMLSelectElement).value,
          description: (document.getElementById('b-desc') as HTMLTextAreaElement).value
        }
      }
    });

    if (formValues) {
      try {
        const res = await fetch('/api/bitacora', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.data.token()}`
          },
          body: JSON.stringify(formValues)
        });
        if (res.ok) {
          const newEntry = await res.json();
          this.data.bitacora.update(entries => [newEntry, ...entries]);
        }
      } catch (e) {
        console.error("Error al guardar", e);
      }
    }
  }

  ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    try {
      const res = await fetch('/api/bitacora', {
        headers: { 'Authorization': `Bearer ${this.data.token()}` }
      });
      if (res.ok) {
        this.data.bitacora.set(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  }
}
