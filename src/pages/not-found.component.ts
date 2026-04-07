import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div class="relative mb-8">
        <h1 class="text-[120px] md:text-[200px] font-black text-white/5 leading-none select-none">404</h1>
        <div class="absolute inset-0 flex items-center justify-center">
          <img src="https://i.postimg.cc/DzBvDGMs/Logo-UAH.jpg" class="h-24 w-24 rounded-full border-4 border-[#f06427] p-2 bg-white" alt="Logo UAH">
        </div>
      </div>
      
      <h2 class="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
        Página <span class="text-[#f06427]">No Encontrada</span>
      </h2>
      
      <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs max-w-md mb-12">
        Lo sentimos, el recurso que buscas no existe o ha sido movido. Verifica la URL o vuelve al inicio.
      </p>

      <a routerLink="/areas" class="group flex items-center gap-3 bg-[#f06427] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all shadow-xl shadow-[#f06427]/20">
        <i class="bi bi-arrow-left group-hover:-translate-x-2 transition-transform"></i>
        Volver al Inicio
      </a>
    </div>
  `
})
export class NotFoundComponent {}
