import { Component, inject, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-black min-h-screen font-sans text-white overflow-x-hidden">
      
      <!-- HERO SECTION: 100% INMERSIVA -->
      <div class="relative w-full h-[50vh] md:h-[70vh] flex flex-col items-center justify-start overflow-hidden pt-10 md:pt-[60px]">
        
        <!-- Imagen de Fondo con Tratamiento de Contraste -->
        <div class="absolute inset-0 z-0">
          <img 
            src="assets/images/hero-areas.png" 
            alt="Fondo interactivo de los Laboratorios de Ingeniería UAH"
            class="w-full h-full object-cover object-center filter brightness-[0.6]"
          >
          <!-- Degradado inferior para suavizar la transicion a las tarjetas -->
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black"></div>
        </div>
 
        <!-- Marca "RESERVA" -->
        <div class="relative z-10 text-center animate-fade-in px-4">
          <div class="p-6 md:p-10 rounded-[2rem] bg-black/30 backdrop-blur-md border border-white/10">
            <h1 class="text-4xl md:text-6xl lg:text-[100px] font-black italic text-white m-0 tracking-tighter leading-none shadow-2xl">
              LABORATORIOS <span class="text-[#f06427]">UAH</span>
            </h1>
            <div class="h-1.5 w-16 md:w-[100px] bg-[#f06427] mx-auto my-4 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.8)]"></div>
            <p class="text-[8px] md:text-sm lg:text-base font-black tracking-[0.3em] md:tracking-[0.5em] text-white uppercase">SGA FIN - Ingeniería</p>
          </div>
        </div>
      </div>
 
      <!-- SECCION DE ACCESO RAPIDO -->
      <div class="max-w-[1300px] mx-auto -mt-20 md:-mt-32 mb-24 px-6 relative z-30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        
        <!-- FABLAB -->
        <div (click)="selectArea('FABLAB')" class="area-card group bg-white rounded-[2.5rem] p-8 md:p-10 text-center cursor-pointer transition-all duration-500 border-b-[15px] border-black shadow-2xl hover:-translate-y-4 hover:border-[#f06427]">
          <div class="w-32 h-32 md:w-44 md:h-44 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 overflow-hidden shadow-xl border border-gray-100">
            <img src="assets/images/icons/fablab.png" alt="FabLab Icon" class="w-full h-full object-contain scale-[2.6]">
          </div>
          <h2 class="text-black text-2xl md:text-3xl font-black mb-4 tracking-tighter uppercase">FABLAB</h2>
          <p class="text-gray-500 text-sm md:text-base font-medium leading-relaxed">Taller de Fabricación e Impresión 3D.</p>
          <div class="mt-8 text-[#f06427] font-black uppercase text-[10px] md:text-xs tracking-widest group-hover:text-black transition-colors">
            Entrar al área <i class="bi bi-arrow-right ml-2"></i>
          </div>
        </div>
 
        <!-- CIENCIAS BASICAS -->
        <div (click)="selectArea('LAB CIENCIAS BASICAS')" class="area-card group bg-white rounded-[2.5rem] p-8 md:p-10 text-center cursor-pointer transition-all duration-500 border-b-[15px] border-black shadow-2xl hover:-translate-y-4 hover:border-[#f06427]">
          <div class="w-32 h-32 md:w-44 md:h-44 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 overflow-hidden shadow-xl border border-gray-100">
            <img src="assets/images/icons/ciencias.png" alt="Ciencias Icon" class="w-full h-full object-contain scale-[2.2]">
          </div>
          <h2 class="text-black text-2xl md:text-3xl font-black mb-4 tracking-tighter uppercase">CIENCIAS BÁSICAS</h2>
          <p class="text-gray-500 text-sm md:text-base font-medium leading-relaxed">Laboratorios de Física y Química.</p>
          <div class="mt-8 text-[#f06427] font-black uppercase text-[10px] md:text-xs tracking-widest group-hover:text-black transition-colors">
            Entrar al área <i class="bi bi-arrow-right ml-2"></i>
          </div>
        </div>
 
        <!-- INFORMATICA -->
        <div (click)="selectArea('LAB INFORMATICA')" class="area-card group bg-white rounded-[2.5rem] p-8 md:p-10 text-center cursor-pointer transition-all duration-500 border-b-[15px] border-black shadow-2xl hover:-translate-y-4 hover:border-[#f06427]">
          <div class="w-32 h-32 md:w-44 md:h-44 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 overflow-hidden shadow-xl border border-gray-100">
            <img src="assets/images/icons/informatica.png" alt="Informatica Icon" class="w-full h-full object-contain scale-[2.2]">
          </div>
          <h2 class="text-black text-2xl md:text-3xl font-black mb-4 tracking-tighter uppercase">INFORMÁTICA</h2>
          <p class="text-gray-500 text-sm md:text-base font-medium leading-relaxed">Hardware, Redes y Desarrollo.</p>
          <div class="mt-8 text-[#f06427] font-black uppercase text-[10px] md:text-xs tracking-widest group-hover:text-black transition-colors">
            Entrar al área <i class="bi bi-arrow-right ml-2"></i>
          </div>
        </div>
      </div>
 
      <!-- PANEL DE LABORATORIOS ESPECIFICOS -->
      <section *ngIf="selectedArea()" class="max-w-[1300px] mx-auto mb-24 p-6 md:p-12 bg-white rounded-[2.5rem] md:rounded-[3rem] animate-slide-up">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 border-l-[10px] border-[#f06427] pl-6">
          <div>
            <h3 class="text-2xl md:text-4xl font-black text-black uppercase tracking-tighter leading-none">{{ selectedArea() }}</h3>
            <p class="text-[#f06427] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs mt-2">Infraestructura Disponible</p>
          </div>
          <button (click)="selectedArea.set('')" class="w-full md:w-auto bg-gray-100 hover:bg-black hover:text-white text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
            VOLVER AL MENU
          </button>
        </div>
 
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <article *ngFor="let lab of subLabs()" (click)="goToInventory(lab)" class="group/lab bg-gray-50 hover:bg-white p-8 rounded-[2rem] cursor-pointer text-center transition-all border-4 border-transparent hover:border-[#f06427] hover:shadow-2xl">
            <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover/lab:scale-110 transition-transform">
               <i [class]="'bi ' + getLabIcon(lab)" class="text-3xl text-black"></i>
            </div>
            <h4 class="text-lg font-black text-black mb-6 uppercase tracking-tight leading-tight">{{ lab }}</h4>
            <button class="w-full py-4 bg-black text-white rounded-xl font-black uppercase text-[9px] tracking-widest group-hover/lab:bg-[#f06427] transition-colors">Panel Control</button>
          </article>
        </div>
      </section>
    </div>
 
    <style>
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
      .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
    </style>
  `
})
export class AreasComponent {
  dataService = inject(DataService);
  router = inject(Router);
  selectedArea = signal('');
  subLabs = signal<string[]>([]);
  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params['area']) this.selectArea(params['area']);
    });
  }
  selectArea(area: string) {
    this.selectedArea.set(area);
    this.subLabs.set(this.dataService.hierarchy[area] || []);
  }

  getLabIcon(labName: string): string {
    const icons: Record<string, string> = {
      'QUIMICA': 'bi-droplet-fill',
      'FISICA': 'bi-magnet-fill',
      'BIOMATERIALES': 'bi-flower1',
      'TEXTIL': 'bi-layers-fill',
      'FABRICACIÓN DIGITAL': 'bi-printer-fill',
      'HACKERLAB': 'bi-terminal-fill',
      'DESARROLLO TECNOLOGICO': 'bi-cpu-fill'
    };
    return icons[labName] || 'bi-box-seam';
  }

  goToInventory(lab: string) {
    this.router.navigate(['/inventory', this.selectedArea(), lab]);
  }
}
