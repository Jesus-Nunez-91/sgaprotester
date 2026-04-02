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
                      </h1>
                      <div class="flex items-center justify-center gap-6 mt-4 opacity-80">
                          <span class="h-0.5 w-12 bg-uah-orange rounded-full"></span>
                          <p class="text-white font-black uppercase tracking-[0.4em] text-[10px]">Área de Laboratorios UAH</p>
                          <span class="h-0.5 w-12 bg-uah-orange rounded-full"></span>
                      </div>
                  </div>
              </div>

              <!-- Cuadrícula de Tarjetas Flotantes -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl">
                  
                  <!-- FABLAB -->
                  <div (click)="selectArea('FABLAB')" class="group relative bg-white/95 dark:bg-slate-900/95 p-10 rounded-[2.5rem] shadow-2xl cursor-pointer hover:-translate-y-4 transition-all duration-500 border-b-[12px] border-uah-blue hover:border-uah-orange active:scale-95">
                      <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                         <i class="bi bi-printer-fill text-6xl"></i>
                      </div>
                      <div class="h-20 w-20 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 text-uah-blue group-hover:bg-uah-blue group-hover:text-white transition-all duration-500 shadow-xl">
                        <i class="bi bi-printer-fill text-4xl"></i>
                      </div>
                      <h3 class="text-2xl font-black text-gray-800 dark:text-white mb-3 tracking-tighter uppercase">FABLAB</h3>
                      <p class="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-medium">Textil, Impresión 3D, Biomateriales y Computación móvil.</p>
                      <div class="mt-8 flex items-center gap-2 text-uah-blue font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                          Ingresar Área <i class="bi bi-chevron-right"></i>
                      </div>
                  </div>

                  <!-- LAB CIENCIAS BASICAS -->
                  <div (click)="selectArea('LAB CIENCIAS BASICAS')" class="group relative bg-white/95 dark:bg-slate-900/95 p-10 rounded-[2.5rem] shadow-2xl cursor-pointer hover:-translate-y-4 transition-all duration-500 border-b-[12px] border-emerald-600 hover:border-uah-orange active:scale-95">
                      <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                         <i class="bi bi-flask-fill text-6xl"></i>
                      </div>
                      <div class="h-20 w-20 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-8 text-green-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-xl">
                        <i class="bi bi-people-fill text-4xl"></i>
                      </div>
                      <h3 class="text-2xl font-black text-gray-800 dark:text-white mb-3 tracking-tighter uppercase">CIENCIAS BÁSICAS</h3>
                      <p class="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-medium">Laboratorios de Física y Química experimental.</p>
                      <div class="mt-8 flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                          Ingresar Área <i class="bi bi-chevron-right"></i>
                      </div>
                  </div>

                  <!-- LAB INFORMATICA -->
                  <div (click)="selectArea('LAB INFORMATICA')" class="group relative bg-white/95 dark:bg-slate-900/95 p-10 rounded-[2.5rem] shadow-2xl cursor-pointer hover:-translate-y-4 transition-all duration-500 border-b-[12px] border-uah-blue hover:border-uah-orange active:scale-95">
                      <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                         <i class="bi bi-cpu-fill text-6xl"></i>
                      </div>
                      <div class="h-20 w-20 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 text-uah-blue group-hover:bg-uah-blue group-hover:text-white transition-all duration-500 shadow-xl">
                        <i class="bi bi-cpu-fill text-4xl"></i>
                      </div>
                      <h3 class="text-2xl font-black text-gray-800 dark:text-white mb-3 tracking-tighter uppercase">INFORMÁTICA</h3>
                      <p class="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-medium">Hackerlab, Desarrollo Tecnológico y Hardware.</p>
                      <div class="mt-8 flex items-center gap-2 text-uah-blue font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                          Ingresar Área <i class="bi bi-chevron-right"></i>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- VISTA DE SUB-LABORATORIOS (Democratizada) -->
      <div *ngIf="selectedArea()" class="animate-fadeIn p-4">
        <div class="flex items-center justify-between mb-12 bg-white/80 dark:bg-slate-800/80 p-8 rounded-[2rem] shadow-2xl backdrop-blur-md border-l-8 border-uah-blue">
           <div>
              <h2 class="text-3xl font-black text-uah-blue dark:text-white tracking-tighter uppercase leading-none mb-2">{{ selectedArea() }}</h2>
              <p class="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-[0.4em] font-black">Seleccione Infraestructura Específica</p>
           </div>
           <button (click)="selectedArea.set('')" class="px-8 py-4 rounded-2xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-200 text-xs font-black hover:bg-uah-blue hover:text-white transition-all flex items-center gap-3 uppercase tracking-widest shadow-lg">
             <i class="bi bi-arrow-left text-lg"></i> VOLVER AL PANEL
           </button>
        </div>

        <div class="flex flex-wrap justify-center gap-10">
          <div *ngFor="let lab of subLabs()" (click)="goToInventory(lab)" class="w-full sm:w-80 bg-white dark:bg-gray-950 p-12 rounded-[2.5rem] shadow-xl cursor-pointer hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all text-center border border-gray-100 dark:border-white/5 group relative overflow-hidden">
             <div class="absolute inset-0 bg-uah-orange opacity-0 group-hover:opacity-[0.03] transition-opacity"></div>
             <div class="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <i class="bi bi-box-seam text-4xl text-uah-blue/20 dark:text-white/20 group-hover:text-uah-orange"></i>
             </div>
             <h4 class="font-black text-slate-800 dark:text-gray-100 group-hover:text-uah-orange transition-colors uppercase text-xl leading-tight mb-8">{{ lab }}</h4>
             <button class="w-full py-4 bg-uah-blue dark:bg-[#f06427] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl group-hover:bg-uah-orange shadow-lx transition-all active:scale-95">PANEL DE CONTROL</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .animate-scaleUp { animation: scaleUp 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
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
