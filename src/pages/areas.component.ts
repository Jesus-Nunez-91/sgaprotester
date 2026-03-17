import { Component, inject, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

/**
 * Componente de selección de Áreas y Laboratorios.
 * Permite al usuario navegar por la jerarquía de laboratorios de la universidad.
 */
@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 animate-fadeIn">
      <!-- Encabezado de la página -->
      <div class="text-center mb-12">
        <h1 class="text-3xl md:text-4xl font-black text-uah-blue mb-2 tracking-tighter">SISTEMA DE GESTIÓN INTEGRAL</h1>
        <p class="text-gray-500 font-medium">Seleccione el área de laboratorios para operar</p>
      </div>

      <!-- Cuadrícula de Áreas Principales (Visible si no hay área seleccionada) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" *ngIf="!selectedArea()">
        <!-- FABLAB -->
        <div (click)="selectArea('FABLAB')" class="glass-panel p-8 rounded-3xl shadow-xl cursor-pointer group hover:-translate-y-2 transition-all border-b-8 border-uah-blue hover:border-uah-orange">
           <div class="h-20 w-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-uah-blue group-hover:bg-orange-50 group-hover:text-uah-orange transition-colors">
            <i class="bi bi-printer-fill text-4xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">FABLAB</h3>
          <p class="text-sm text-gray-500 leading-relaxed">Textil, Impresión 3D, Biomateriales y Computación móvil.</p>
        </div>

        <!-- LAB CIENCIAS BASICAS -->
        <div (click)="selectArea('LAB CIENCIAS BASICAS')" class="glass-panel p-8 rounded-3xl shadow-xl cursor-pointer group hover:-translate-y-2 transition-all border-b-8 border-emerald-600 hover:border-uah-orange">
           <div class="h-20 w-20 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:bg-orange-50 group-hover:text-uah-orange transition-colors">
            <i class="bi bi-people-fill text-4xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">CIENCIAS BÁSICAS</h3>
          <p class="text-sm text-gray-500 leading-relaxed">Laboratorios de Física y Química experimental.</p>
        </div>

        <!-- LAB INFORMATICA -->
        <div (click)="selectArea('LAB INFORMATICA')" class="glass-panel p-8 rounded-3xl shadow-xl cursor-pointer group hover:-translate-y-2 transition-all border-b-8 border-indigo-500 hover:border-uah-orange">
           <div class="h-20 w-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:bg-orange-100 group-hover:text-uah-orange transition-colors">
            <i class="bi bi-cpu-fill text-4xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">INFORMÁTICA</h3>
          <p class="text-sm text-gray-500 leading-relaxed">Hackerlab, Desarrollo Tecnológico y Hardware.</p>
        </div>
      </div>

      <!-- Cuadrícula de Sub-Laboratorios (Visible cuando se selecciona un área) -->
      <div *ngIf="selectedArea()" class="animate-fadeIn">
        <div class="flex items-center justify-between mb-8 bg-white/80 p-4 rounded-2xl shadow-sm backdrop-blur-sm">
           <div>
              <h2 class="text-2xl font-black text-uah-blue tracking-tighter uppercase">{{ selectedArea() }}</h2>
              <p class="text-[10px] text-gray-400 uppercase tracking-widest font-black">Seleccione Laboratorio Específico</p>
           </div>
           <button (click)="selectedArea.set('')" class="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
             <i class="bi bi-arrow-left"></i> VOLVER
           </button>
        </div>

        <div class="flex flex-wrap justify-center gap-6">
          <div *ngFor="let lab of subLabs()" (click)="goToInventory(lab)" class="w-full sm:w-64 bg-white p-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-2xl hover:scale-105 transition-all text-center border border-gray-100 group">
             <i class="bi bi-folder2-open text-5xl text-blue-100 group-hover:text-uah-orange transition-colors mb-4 block"></i>
             <h4 class="font-black text-slate-700 group-hover:text-uah-blue uppercase text-sm tracking-tight">{{ lab }}</h4>
             <span class="inline-block mt-3 px-3 py-1 bg-gray-100 text-[10px] font-black uppercase text-gray-500 rounded-full group-hover:bg-uah-blue group-hover:text-white transition-colors">Acceder</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AreasComponent {
  dataService = inject(DataService);
  router = inject(Router);
  
  // Señal para el área seleccionada actualmente
  selectedArea = signal('');
  // Señal para la lista de laboratorios pertenecientes al área seleccionada
  subLabs = signal<string[]>([]);

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params['area']) {
        this.selectArea(params['area']);
      }
    });
  }

  /**
   * Selecciona un área y carga sus laboratorios asociados.
   * @param area Nombre del área seleccionada.
   */
  selectArea(area: string) {
    this.selectedArea.set(area);
    this.subLabs.set(this.dataService.hierarchy[area] || []);
  }

  /**
   * Navega a la vista de inventario del laboratorio seleccionado.
   * @param lab Nombre del laboratorio específico.
   */
  goToInventory(lab: string) {
    this.router.navigate(['/inventory', this.selectedArea(), lab]);
  }
}
