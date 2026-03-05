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
    <div class="min-h-screen flex items-center justify-center -mt-10">
      <div class="w-full max-w-md">
        <!-- Contenedor principal con efecto Glassmorphism -->
        <div class="glass-panel p-8 rounded-3xl shadow-2xl text-center transform transition-all hover:scale-[1.01]">
          <img src="https://i.postimg.cc/DzBvDGMs/Logo-UAH.jpg" class="w-32 h-32 mx-auto mb-6 rounded-full shadow-lg object-contain bg-white p-2" alt="Logo UAH">
          
          <h2 class="text-2xl font-bold text-uah-blue mb-2">Portal de Ingeniería</h2>
          <p class="text-gray-500 text-sm mb-8">Gestión de Laboratorios & Activos</p>

          <!-- Formulario de Login -->
          <form (submit)="onLogin($event)" class="space-y-4 text-left">
            <div>
              <label class="block text-xs font-bold text-uah-blue uppercase mb-1 ml-1">Correo Electrónico</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="bi bi-envelope text-gray-400"></i>
                </div>
                <input type="email" [(ngModel)]="email" name="email" class="w-full pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:border-uah-blue focus:ring-uah-blue bg-white/50 backdrop-blur-sm shadow-sm transition-all" placeholder="nombre@uahurtado.cl">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-uah-blue uppercase mb-1 ml-1">Contraseña</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="bi bi-lock text-gray-400"></i>
                </div>
                <input type="password" [(ngModel)]="pass" name="pass" class="w-full pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:border-uah-blue focus:ring-uah-blue bg-white/50 backdrop-blur-sm shadow-sm transition-all" placeholder="•••••••">
              </div>
            </div>

            <button type="submit" class="w-full bg-uah-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group mt-6">
              INGRESAR AL SISTEMA
              <i class="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
          </form>

          <!-- Sección de ayuda removida por seguridad -->
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
