import { Component, inject, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

declare var Swal: any;

/**
 * Componente de inicio de sesión.
 * Permite a los usuarios autenticarse para acceder a las funcionalidades del SGA.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-transparent p-6">
      <div class="w-full max-w-md">
        <!-- Contenedor principal con estilo institucional -->
        <div class="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,51,102,0.15)] overflow-hidden border border-gray-100 flex flex-col">
          <!-- Banner Superior -->
          <div class="bg-uah-blue p-10 flex flex-col items-center text-center relative overflow-hidden">
            <div class="absolute inset-0 opacity-10">
              <div class="absolute -top-20 -left-20 w-64 h-64 bg-uah-orange rounded-full blur-3xl"></div>
              <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-uah-gold rounded-full blur-3xl"></div>
            </div>
            
            <img src="https://i.postimg.cc/DzBvDGMs/Logo-UAH.jpg" class="w-24 h-24 mb-6 rounded-full shadow-2xl relative z-10 object-contain bg-white p-2" alt="Logo UAH">
            <h1 class="text-white text-3xl font-black tracking-tighter relative z-10">SGA <span class="text-uah-orange">PRO</span></h1>
            <p class="text-blue-100 text-xs font-bold uppercase tracking-widest mt-2 relative z-10 opacity-80">Facultad de Ingeniería</p>
          </div>

          <div class="p-10">
            <div class="mb-8">
              <h2 class="text-xl font-black text-uah-blue tracking-tight">Bienvenido al Portal</h2>
              <p class="text-gray-400 text-sm font-medium">Gestión de Laboratorios e Infraestructura</p>
            </div>

            <!-- Formulario de Login -->
            <form (submit)="onLogin($event)" class="space-y-6">
              <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institucional Email</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i class="bi bi-person-fill text-uah-blue"></i>
                  </div>
                  <input type="email" [(ngModel)]="email" name="email" 
                    class="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-uah-blue text-sm font-bold text-gray-700 transition-all shadow-inner" 
                    placeholder="ejemplo@uahurtado.cl">
                </div>
              </div>

              <div class="space-y-2">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i class="bi bi-shield-lock-fill text-uah-blue"></i>
                  </div>
                  <input type="password" [(ngModel)]="pass" name="pass" 
                    class="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-2 focus:ring-uah-blue text-sm font-bold text-gray-700 transition-all shadow-inner" 
                    placeholder="••••••••">
                </div>
              </div>

              <button type="submit" 
                class="w-full bg-uah-orange hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all flex items-center justify-center gap-3 group mt-4 tracking-tighter">
                ACCEDER AL SGA
                <i class="bi bi-arrow-right-circle-fill text-xl group-hover:translate-x-1 transition-transform"></i>
              </button>
            </form>

            <div class="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              <span>Alberto Hurtado</span>
              <span>v2.0 Beta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(DataService);
  router = inject(Router);

  constructor() {
    if (this.auth.currentUser()) {
      this.router.navigate(['/areas']);
    }
  }

  // Señales para el enlace de datos bidireccional del formulario
  email = signal('');
  pass = signal('');

  /**
   * Maneja el evento de envío del formulario de login.
   * @param e Evento de formulario.
   */
  async onLogin(e: Event) {
    e.preventDefault();
    const success = await this.auth.login(this.email(), this.pass());
    if (success) {
      // Notificación de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Autenticación correcta',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      this.router.navigate(['/areas']);
    } else {
      // Notificación de error
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Credenciales inválidas o error de conexión',
        confirmButtonColor: '#003366'
      });
    }
  }
}
