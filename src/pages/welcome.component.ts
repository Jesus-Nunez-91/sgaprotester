import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';

/**
 * Componente de Bienvenida (Intro) con Video Institucional.
 * Se muestra inmediatamente después del login antes de acceder al dashboard principal.
 */
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-y-auto custom-scrollbar">
      <!-- Fondo decorativo -->
      <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div class="absolute -top-48 -left-48 w-[600px] h-[600px] bg-[#f06427] rounded-full blur-[150px]"></div>
        <div class="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-[#f06427] rounded-full blur-[150px]"></div>
      </div>

      <!-- Contenedor del Video -->
      <div class="w-full max-w-4xl z-10 animate-fade-in px-4">
        <div class="relative bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-[#f06427]/20 flex items-center justify-center min-h-[400px]">
          <img 
            src="assets/images/welcome-hero.png" 
            class="w-full h-full object-cover absolute inset-0"
            alt="Bienvenida SGA Pro"
          >
          <!-- Overlay sutil para mejorar legibilidad si fuera necesario -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

        <!-- Información y Botón de Inicio -->
        <div class="mt-12 text-center space-y-6">
          <div class="space-y-2">
            <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
              Bienvenido a <span class="text-[#f06427]">SGA Pro</span>
            </h1>
            <p class="text-gray-400 font-bold uppercase tracking-widest text-sm">
              Sistema de Gestión Académica y Laboratorios - UAH
            </p>
          </div>

          <button (click)="proceed()" 
            class="mt-8 bg-[#f06427] hover:bg-[#d8531d] text-white font-black py-4 px-12 rounded-full shadow-xl shadow-[#f06427]/30 transform hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-lg flex items-center gap-3 mx-auto group">
            Comenzar Gestión
            <i class="bi bi-arrow-right text-xl group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
      </div>

      <!-- Footer Minimalista -->
      <div class="absolute bottom-8 left-0 w-full text-center z-10">
        <p class="text-[10px] font-black text-gray-600 uppercase tracking-widest">
          Universidad Alberto Hurtado © 2024 • Departamento de Tecnologías e Innovación
        </p>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class WelcomeComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(DataService);

  ngOnInit() {
    // Si no hay usuario, redirigir a login inmediatamente
    if (!this.auth.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  proceed() {
    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Lógica de redirección basada en rol
    const role = user.rol;
    const isAcad = ['Academico', 'Docente', 'Alumno'].includes(role);

    if (role === 'SuperUser') {
      this.router.navigate(['/dashboard']);
    } else if (isAcad) {
      this.router.navigate(['/schedule']);
    } else {
      this.router.navigate(['/areas']);
    }
  }
}
