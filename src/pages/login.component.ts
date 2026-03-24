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
    <div class="min-h-screen flex items-center justify-center bg-gray-950 p-6 relative overflow-hidden">
      <!-- Elementos decorativos de fondo -->
      <div class="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-[#f06427] rounded-full blur-[120px]"></div>
        <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-[#f06427] rounded-full blur-[120px]"></div>
      </div>

      <div class="w-full max-w-md relative z-10">
        <!-- Contenedor principal -->
        <div class="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
          <!-- Banner Superior Institucional (Fondo Negro) -->
          <div class="bg-black p-8 flex flex-col items-center justify-center border-b-4 border-[#f06427]">
            <img src="https://ingenieria.uahurtado.cl/wp-content/uploads/2024/01/Componente-14-%E2%80%93-1.png" 
              class="w-full h-auto max-h-24 object-contain" 
              alt="Ingeniería UAH">
          </div>

          <div class="p-10">
            <div class="mb-8">
              <h2 class="text-2xl font-black text-black tracking-tight" style="font-family: 'Playfair Display', serif;">Gestión de Laboratorios</h2>
              <p class="text-gray-500 text-sm font-medium mt-1">Acceso al Sistema SGA FIN</p>
            </div>

            <!-- Formulario de Login -->
            <form (submit)="onLogin($event)" class="space-y-6">
              <div class="space-y-2">
                <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Institucional</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i class="bi bi-envelope text-[#f06427]"></i>
                  </div>
                  <input type="email" [(ngModel)]="email" name="email" 
                    class="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-[#f06427] focus:ring-0 text-sm font-semibold text-gray-800 transition-all outline-none" 
                    placeholder="ejemplo@uahurtado.cl">
                </div>
              </div>

              <div class="space-y-2">
                <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Contraseña</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i class="bi bi-lock text-[#f06427]"></i>
                  </div>
                  <input [type]="isPassVisible() ? 'text' : 'password'" [(ngModel)]="pass" name="pass" 
                    class="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-[#f06427] focus:ring-0 text-sm font-semibold text-gray-800 transition-all outline-none" 
                    placeholder="••••••••">
                  <button type="button" (click)="isPassVisible.set(!isPassVisible())" class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black transition-colors">
                    <i class="bi" [class.bi-eye]="!isPassVisible()" [class.bi-eye-slash]="isPassVisible()"></i>
                  </button>
                </div>
              </div>

              <div class="flex justify-between items-center px-1">
                <button type="button" (click)="openRecoveryModal()" class="text-[10px] font-bold text-[#f06427] hover:underline uppercase tracking-wider transition-all">
                  Solicitar Acceso / Olvidé clave
                </button>
              </div>

              <button type="submit" 
                class="w-full bg-black hover:bg-[#f06427] text-white font-bold py-5 rounded-xl shadow-lg hover:shadow-[#f06427]/20 transition-all flex items-center justify-center gap-3 group mt-4">
                INGRESAR AL PORTAL
                <i class="bi bi-chevron-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </button>
            </form>

            <div class="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Universidad Alberto Hurtado</span>
              <span class="text-[#f06427]">v2.1</span>
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

  isPassVisible = signal(false);

  constructor() {
    if (this.auth.currentUser()) {
      const role = this.auth.currentUser()?.rol;
      const isAcad = role === 'Academico' || role === 'Docente' || role === 'Alumno';
      this.router.navigate([isAcad ? '/schedule' : '/rooms']);
    }
  }

  // Señales para el enlace de datos bidireccional del formulario
  email = signal('');
  pass = signal('');

  async openRecoveryModal() {
    const { value: formValues } = await Swal.fire({
      title: '<h2 class="text-black font-black uppercase tracking-tighter text-xl">Ayuda para Registro / Recuperación</h2>',
      html: `
        <div class="text-left space-y-4 pt-4 px-2">
          <p class="text-[10px] text-gray-500 mb-6 border-l-4 border-[#f06427] pl-3 font-bold uppercase tracking-wider">Complete los campos. Se enviará una solicitud de validación a los administradores.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label class="text-[9px] font-black text-gray-400 uppercase ml-1 block mb-1">Nombre Completo</label>
                <input id="rec-name" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-2 !border-gray-50 !bg-gray-50 focus:!border-[#f06427] !h-12" placeholder="Juan Pérez">
             </div>
             <div>
                <label class="text-[9px] font-black text-gray-400 uppercase ml-1 block mb-1">RUT</label>
                <input id="rec-rut" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-2 !border-gray-50 !bg-gray-50 focus:!border-[#f06427] !h-12" placeholder="12.345.678-9">
             </div>
          </div>

          <div>
            <label class="text-[9px] font-black text-gray-400 uppercase ml-1 block mb-1">Correo Institucional</label>
            <input id="rec-email" type="email" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-2 !border-gray-50 !bg-gray-50 focus:!border-[#f06427] !h-12" placeholder="correo@uahurtado.cl">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label class="text-[9px] font-black text-gray-400 uppercase ml-1 block mb-1">Carrera</label>
                <input id="rec-career" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-2 !border-gray-50 !bg-gray-50 focus:!border-[#f06427] !h-12" placeholder="Ingeniería...">
             </div>
             <div>
                <label class="text-[9px] font-black text-gray-400 uppercase ml-1 block mb-1">Año de Ingreso</label>
                <input id="rec-year" type="number" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-2 !border-gray-50 !bg-gray-50 focus:!border-[#f06427] !h-12" placeholder="2024">
             </div>
          </div>

          <div>
            <label class="text-[9px] font-black text-gray-400 uppercase ml-1 block mb-1">Rol Solicitante</label>
            <select id="rec-role" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-2 !border-gray-50 !bg-gray-50 focus:!border-[#f06427] !h-12">
                <option value="Alumno">Soy Alumno</option>
                <option value="Docente">Soy Docente</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
             <div>
                <label class="text-[9px] font-black text-[#f06427] uppercase ml-1 block mb-1">Nueva Contraseña</label>
                <input id="rec-pass" type="password" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-2 !border-[#f06427]/10 !bg-orange-50/30 focus:!border-[#f06427] !h-12" placeholder="••••••••">
             </div>
             <div>
                <label class="text-[9px] font-black text-[#f06427] uppercase ml-1 block mb-1">Confirmar Contraseña</label>
                <input id="rec-pass2" type="password" class="swal2-input !m-0 !w-full !rounded-xl !text-sm !border-2 !border-[#f06427]/10 !bg-orange-50/30 focus:!border-[#f06427] !h-12" placeholder="••••••••">
             </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar Solicitud',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#F37021',
      preConfirm: () => {
        const name = (document.getElementById('rec-name') as HTMLInputElement).value;
        const email = (document.getElementById('rec-email') as HTMLInputElement).value;
        const rut = (document.getElementById('rec-rut') as HTMLInputElement).value;
        const career = (document.getElementById('rec-career') as HTMLInputElement).value;
        const year = (document.getElementById('rec-year') as HTMLInputElement).value;
        const role = (document.getElementById('rec-role') as HTMLSelectElement).value;
        const pass = (document.getElementById('rec-pass') as HTMLInputElement).value;
        const pass2 = (document.getElementById('rec-pass2') as HTMLInputElement).value;

        if (!name || !email || !rut || !career || !year || !pass || !pass2) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }
        if (pass !== pass2) {
          Swal.showValidationMessage('Las contraseñas no coinciden');
          return false;
        }
        return { name, email, rut, career, year, role, pass };
      }
    });

    if (formValues) {
      const ok = await this.auth.submitAccessRequest({
        type: 'register', // O 'recovery' si fuera el caso, por ahora el modal es genérico
        nombreCompleto: formValues.name,
        email: formValues.email,
        rut: formValues.rut,
        carrera: formValues.career,
        anio: formValues.year,
        rol: formValues.role
      });

      if (ok) {
        Swal.fire({
          icon: 'success',
          title: 'Solicitud Recibida',
          html: `
            <div class="text-sm space-y-3">
              <p>Tu solicitud ha sido enviada al equipo de administración.</p>
              <div class="bg-blue-50 p-3 rounded-lg border-l-4 border-uah-blue text-uah-blue font-bold">
                Favor ingresar en 4 hr o acercarse a un encargado de laboratorio para validación inmediata.
              </div>
            </div>
          `,
          confirmButtonColor: '#003366'
        });
      }
    }
  }

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
