import { Component, inject, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="absolute inset-0 bg-black text-white font-sans overflow-x-hidden overflow-y-auto z-10 custom-scrollbar">
      
      <!-- HERO SECTION INMERSIVA -->
      <div class="relative w-full min-h-[60vh] flex flex-col items-center justify-center overflow-hidden">
        <div class="absolute inset-0">
          <img 
            src="https://i.postimg.cc/cJBkTjYs/Gemini-Generated-Image-iz80n9iz80n9iz80.png" 
            alt="Laboratorio UAH" 
            class="w-full h-full object-cover object-center"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60"></div>
        </div>

        <div class="relative z-10 text-center px-4 max-w-4xl mt-16 pb-12">
          <div class="bg-black/50 backdrop-blur-sm px-12 py-10 rounded-3xl border-2 border-orange-500/50 shadow-[0_0_40px_rgba(249,115,22,0.3)]">
            <h1 class="text-6xl md:text-8xl font-black tracking-tighter mb-4 italic text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              RESERVA
            </h1>
            <div class="h-2 w-40 bg-orange-500 mx-auto mb-8 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.8)]"></div>
            <p class="text-xl md:text-2xl font-black tracking-[0.3em] text-orange-400 uppercase drop-shadow-md">
              Área de Laboratorios UAH
            </p>
          </div>
        </div>
      </div>

      <!-- GRID DE TARJETAS -->
      <div class="max-w-7xl mx-auto px-6 -mt-16 sm:-mt-24 relative z-20 pb-32">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div (click)="selectArea('FABLAB')" class="group cursor-pointer bg-white rounded-[2.5rem] p-10 shadow-2xl hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] transition-all duration-500 transform hover:-translate-y-4 border-b-[12px] border-black hover:border-orange-500">
            <div class="relative w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-black transition-colors duration-300 mx-auto">
              <i class="bi bi-printer-fill text-5xl text-black group-hover:text-orange-500"></i>
            </div>
            <h3 class="text-3xl font-black text-black mb-4 text-center group-hover:text-orange-500 tracking-tighter">FABLAB</h3>
            <p class="text-gray-600 text-base leading-relaxed text-center font-medium">Taller de Fabricación Digital: Impresión 3D, Corte Láser y Prototipado Avanzado.</p>
            <div class="mt-10 flex justify-center items-center text-black font-black text-sm tracking-widest uppercase group-hover:text-orange-500">
              Ingresar <i class="bi bi-arrow-right ml-3 group-hover:translate-x-3 transition-transform text-lg"></i>
            </div>
          </div>

          <div (click)="selectArea('LAB CIENCIAS BASICAS')" class="group cursor-pointer bg-white rounded-[2.5rem] p-10 shadow-2xl hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] transition-all duration-500 transform hover:-translate-y-4 border-b-[12px] border-black hover:border-orange-500">
            <div class="relative w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-black transition-colors duration-300 mx-auto">
              <i class="bi bi-flask-fill text-5xl text-black group-hover:text-orange-500"></i>
            </div>
            <h3 class="text-3xl font-black text-black mb-4 text-center group-hover:text-orange-500 tracking-tighter">CIENCIAS BÁSICAS</h3>
            <p class="text-gray-600 text-base leading-relaxed text-center font-medium">Laboratorios de Física, Química y Biología con instrumental de alta precisión.</p>
            <div class="mt-10 flex justify-center items-center text-black font-black text-sm tracking-widest uppercase group-hover:text-orange-500">
              Ingresar <i class="bi bi-arrow-right ml-3 group-hover:translate-x-3 transition-transform text-lg"></i>
            </div>
          </div>

          <div (click)="selectArea('LAB INFORMATICA')" class="group cursor-pointer bg-white rounded-[2.5rem] p-10 shadow-2xl hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] transition-all duration-500 transform hover:-translate-y-4 border-b-[12px] border-black hover:border-orange-500">
            <div class="relative w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-black transition-colors duration-300 mx-auto">
              <i class="bi bi-cpu-fill text-5xl text-black group-hover:text-orange-500"></i>
            </div>
            <h3 class="text-3xl font-black text-black mb-4 text-center group-hover:text-orange-500 tracking-tighter">INFORMÁTICA</h3>
            <p class="text-gray-600 text-base leading-relaxed text-center font-medium">Infraestructura de Redes, Computación de Alto Rendimiento y Desarrollo de Software.</p>
            <div class="mt-10 flex justify-center items-center text-black font-black text-sm tracking-widest uppercase group-hover:text-orange-500">
              Ingresar <i class="bi bi-arrow-right ml-3 group-hover:translate-x-3 transition-transform text-lg"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- VISTA DE SUB-LABORATORIOS -->
      <div *ngIf="selectedArea()" class="max-w-7xl mx-auto px-6 pb-20 mt-8 animate-fade-in relative z-20">
        <div class="flex flex-col md:flex-row items-center justify-between mb-12 bg-white/10 backdrop-blur-md p-10 rounded-[2.5rem] shadow-2xl border-l-[12px] border-orange-500">
           <div class="mb-6 md:mb-0 text-center md:text-left">
              <h2 class="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-3 drop-shadow-md">{{ selectedArea() }}</h2>
              <p class="text-sm text-gray-300 uppercase tracking-[0.4em] font-black">Seleccione Infraestructura Específica</p>
           </div>
           <button (click)="selectedArea.set('')" class="px-8 py-5 rounded-2xl bg-white text-black text-sm font-black hover:bg-orange-500 hover:text-white transition-colors flex items-center justify-center gap-3 uppercase tracking-widest">
             <i class="bi bi-arrow-left text-xl"></i> VOLVER AL PANEL
           </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <div *ngFor="let lab of subLabs()" (click)="goToInventory(lab)" class="bg-white p-10 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer hover:shadow-[0_15px_50px_rgba(249,115,22,0.6)] hover:-translate-y-3 transition-all text-center border-[4px] border-transparent hover:border-orange-500 group relative">
             <div class="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-black transition-colors duration-500">
                <i class="bi bi-box-seam text-5xl text-black group-hover:text-orange-500"></i>
             </div>
             <h4 class="font-black text-black group-hover:text-orange-500 uppercase text-2xl leading-tight mb-8">{{ lab }}</h4>
             <button class="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl group-hover:bg-orange-500 shadow-xl transition-all active:scale-95">PANEL DE RESERVA</button>
          </div>
        </div>
      </div>
    </div>

    <style>
      @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      :host { display: block; width: 100%; height: 100%; position: relative; }
      .custom-scrollbar::-webkit-scrollbar { width: 10px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #f97316; border-radius: 5px; }
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

  goToInventory(lab: string) {
    this.router.navigate(['/inventory', this.selectedArea(), lab]);
  }
}
