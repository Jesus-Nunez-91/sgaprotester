import { Component, inject, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
        <h1 class="text-3xl md:text-4xl font-bold text-uah-blue mb-2">SISTEMA DE GESTIÓN INTEGRAL</h1>
        <p class="text-gray-500 font-medium">Seleccione el área de laboratorios para operar</p>
      </div>

      <!-- Cuadrícula de Áreas Principales (Visible si no hay área seleccionada) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" *ngIf="!selectedArea()">
        <!-- FABLAB -->
        <div (click)="selectArea('FABLAB')" class="glass-panel p-8 rounded-3xl shadow-xl cursor-pointer group hover:-translate-y-2 transition-all border-b-8 border-blue-600 hover:border-yellow-400">
          <div class="h-20 w-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
            <i class="bi bi-printer-fill text-4xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">FABLAB</h3>
          <p class="text-sm text-gray-500 leading-relaxed">Textil, Impresión 3D, Biomateriales y Computación móvil.</p>
        </div>

        <!-- LAB CIENCIAS BASICAS -->
        <div (click)="selectArea('LAB CIENCIAS BASICAS')" class="glass-panel p-8 rounded-3xl shadow-xl cursor-pointer group hover:-translate-y-2 transition-all border-b-8 border-green-600 hover:border-yellow-400">
           <div class="h-20 w-20 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
            <i class="bi bi-people-fill text-4xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">CIENCIAS BÁSICAS</h3>
          <p class="text-sm text-gray-500 leading-relaxed">Laboratorios de Física y Química experimental.</p>
        </div>

        <!-- LAB INFORMATICA -->
        <div (click)="selectArea('LAB INFORMATICA')" class="glass-panel p-8 rounded-3xl shadow-xl cursor-pointer group hover:-translate-y-2 transition-all border-b-8 border-orange-500 hover:border-yellow-400">
           <div class="h-20 w-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 text-orange-600 group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
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
             <h2 class="text-2xl font-bold text-uah-blue">{{ selectedArea() }}</h2>
             <p class="text-xs text-gray-500 uppercase tracking-wider font-bold">Seleccione Laboratorio Específico</p>
           </div>
           <button (click)="selectedArea.set('')" class="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
             <i class="bi bi-arrow-left"></i> VOLVER
           </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div *ngFor="let lab of subLabs()" (click)="goToInventory(lab)" class="bg-white p-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-2xl hover:scale-105 transition-all text-center border border-gray-100 group">
             <i class="bi bi-folder2-open text-5xl text-blue-200 group-hover:text-uah-gold transition-colors mb-4 block"></i>
             <h4 class="font-bold text-gray-700 group-hover:text-uah-blue">{{ lab }}</h4>
             <span class="inline-block mt-3 px-3 py-1 bg-gray-100 text-[10px] font-bold uppercase text-gray-500 rounded-full group-hover:bg-uah-blue group-hover:text-white transition-colors">Acceder</span>
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
