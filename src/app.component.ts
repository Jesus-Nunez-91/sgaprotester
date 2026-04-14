import { Component, inject, signal, ViewChild, ElementRef, computed } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { DataService } from './services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Componente principal de la aplicación.
 * Gestiona el layout global, la navegación lateral, las notificaciones y el asistente de IA.
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RouterLink, CommonModule, FormsModule],
    template: `
@if (authService.currentUser() && !isWelcomePage()) {
  <div class="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-500 relative">
      
      <!-- BARRA LATERAL IZQUIERDA (Institucional Black) -->
      <aside class="w-20 lg:w-72 bg-black flex flex-col justify-between z-50 transition-all duration-300 shadow-2xl relative border-r border-[#f06427]/30">
          <!-- Área del Logo / Banner Pequeño -->
          <div class="h-32 flex items-center justify-center lg:px-6 border-b border-[#f06427]/20 bg-black">
              <a routerLink="/areas" class="flex items-center gap-4 group cursor-pointer">
                    <div class="relative">
                        <img src="assets/images/uah-insignia.jpg" class="h-16 w-16 shadow-2xl relative z-10 object-contain rounded-full border-2 border-[#f06427] hover:scale-110 transition-transform duration-300" alt="Logo UAH">
                        <div class="absolute inset-0 rounded-full bg-[#f06427] animate-ping opacity-20 group-hover:opacity-40"></div>
                    </div>
                  <div class="hidden lg:flex flex-col text-left">
                      <span class="text-white font-black text-2xl leading-none tracking-tighter">SGA <span class="text-[#f06427]">FIN</span></span>
                      <span class="text-[9px] text-[#f06427] font-black tracking-widest uppercase mt-1">Ingeniería UAH</span>
                  </div>
              </a>
          </div>

          <!-- Enlaces de Navegación -->
          <nav class="flex-1 overflow-y-auto py-8 flex flex-col gap-1.5 px-4 scrollbar-hide">
              @if (isSuperUser() || hasPermission('Dashboard', 'ver')) {
                  <a routerLink="/dashboard" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                     class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                      <i class="bi bi-grid-1x2-fill text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Dashboard</span>
                  </a>
              }

              @if (isSuperUser() || hasPermission('Laboratorio', 'ver')) {
                <a routerLink="/areas" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                    class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                    <i class="bi bi-laptop-fill text-xl group-hover:scale-110 transition-transform"></i>
                    <span class="hidden lg:inline text-sm">Laboratorios</span>
                </a>
              }

              @if (isSuperUser() || hasPermission('Horarios Academicos', 'ver')) {
                <a routerLink="/schedule" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                    class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                    <i class="bi bi-calendar3 text-xl group-hover:scale-110 transition-transform"></i>
                    <span class="hidden lg:inline text-sm">Horarios Academicos</span>
                </a>
              }

              @if (isSuperUser() || hasPermission('Prestamo Equipos', 'ver')) {
                <a routerLink="/loans" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                   class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                    <i class="bi bi-laptop text-xl group-hover:scale-110 transition-transform"></i>
                    <span class="hidden lg:inline text-sm">Préstamo Equipos</span>
                </a>
              }

              @if (isSuperUser() || hasPermission('Salas y Labs', 'ver')) {
                <a routerLink="/rooms" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                   class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                    <i class="bi bi-door-open-fill text-xl group-hover:scale-110 transition-transform"></i>
                    <span class="hidden lg:inline text-sm">Salas y Labs</span>
                </a>
              }

              @if (isSuperUser() || hasPermission('Gestion de Solicitudes', 'ver')) {
                <a routerLink="/requests" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                   class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                    <i class="bi bi-file-earmark-check-fill text-xl group-hover:scale-110 transition-transform"></i>
                    <span class="hidden lg:inline text-sm">{{ isRoomAdmin() ? 'Gestión de Solicitudes' : 'Mis Solicitudes' }}</span>
                </a>
              }

              @if (isSuperUser() || hasPermission('Ayuda & Soporte', 'ver')) {
                <a routerLink="/support" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                   class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                    <i class="bi bi-chat-left-text-fill text-xl group-hover:scale-110 transition-transform"></i>
                    <span class="hidden lg:inline text-sm">Ayuda & Soporte</span>
                </a>
              }

              @if (isSuperUser() || hasPermission('Wiki', 'ver')) {
                 <a routerLink="/wiki" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                    class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                     <i class="bi bi-journal-bookmark-fill text-xl group-hover:scale-110 transition-transform"></i>
                     <span class="hidden lg:inline text-sm">Wiki</span>
                 </a>
              }

              @if (isSuperUser() || isLabAdmin() || hasPermission('Compras', 'ver') || hasPermission('Mantencion', 'ver') || hasPermission('Bitagora', 'ver') || hasPermission('Proyectos', 'ver')) {
                  <div class="my-6 border-t border-white/5"></div>
                  <span class="hidden lg:block px-5 text-[10px] font-black text-[#f06427] uppercase tracking-[0.2em] mb-4">Administración</span>
                  
                  @if (isSuperUser() || hasPermission('Compras', 'ver')) {
                    <a routerLink="/procurement" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                       class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                        <i class="bi bi-cart-check-fill text-xl group-hover:scale-110 transition-transform"></i>
                        <span class="hidden lg:inline text-sm">Compras</span>
                    </a>
                  }

                  @if (isSuperUser() || hasPermission('Mantencion', 'ver')) {
                    <a routerLink="/maintenance" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                       class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                        <i class="bi bi-tools text-xl group-hover:scale-110 transition-transform"></i>
                        <span class="hidden lg:inline text-sm">Mantención</span>
                    </a>
                  }

                  @if (isSuperUser() || hasPermission('Bitagora', 'ver')) {
                    <a routerLink="/bitacora" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                       class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                        <i class="bi bi-journal-text text-xl group-hover:scale-110 transition-transform"></i>
                        <span class="hidden lg:inline text-sm">Bitácora</span>
                    </a>
                  }

                  @if (isSuperUser() || hasPermission('Proyectos', 'ver')) {
                    <a routerLink="/projects" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                       class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                        <i class="bi bi-kanban-fill text-xl group-hover:scale-110 transition-transform"></i>
                        <span class="hidden lg:inline text-sm">Proyectos</span>
                    </a>
                  }
              }

              @if (isSuperUser() || hasPermission('Usuarios', 'ver') || hasPermission('Auditoria', 'ver')) {
                  <div class="my-6 border-t border-white/5"></div>
                  <span class="hidden lg:block px-5 text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4">Seguridad</span>
                  
                  @if (isSuperUser() || hasPermission('Usuarios', 'ver')) {
                    <a routerLink="/users" routerLinkActive="bg-red-500 text-white shadow-lg shadow-red-500/20" 
                       class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                        <i class="bi bi-people-fill text-xl group-hover:scale-110 transition-transform"></i>
                        <span class="hidden lg:inline text-sm">Usuarios</span>
                    </a>
                  }

                  @if (isSuperUser() || hasPermission('Auditoria', 'ver')) {
                    <a routerLink="/audit" routerLinkActive="bg-red-500 text-white shadow-lg shadow-red-500/20" 
                       class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                        <i class="bi bi-shield-lock-fill text-xl group-hover:scale-110 transition-transform"></i>
                        <span class="hidden lg:inline text-sm">Auditoría</span>
                    </a>
                  }
              }
          </nav>

           <!-- Perfil Mini -->
           <div class="p-6 border-t border-white/5 bg-white/5">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-xl bg-[#f06427] flex items-center justify-center text-white font-black shadow-lg">
                        {{ authService.currentUser()?.nombreCompleto ? authService.currentUser()?.nombreCompleto?.charAt(0) : 'U' }}
                    </div>
                    <div class="hidden lg:block overflow-hidden">
                        <h4 class="text-xs font-bold text-white truncate uppercase tracking-tight">{{ authService.currentUser()?.nombreCompleto }}</h4>
                        <p class="text-[9px] text-[#f06427] font-black uppercase tracking-widest">{{ authService.currentUser()?.rol }}</p>
                    </div>
                </div>
                <button (click)="authService.logout()" class="w-full flex items-center justify-center gap-2 text-[10px] font-black text-white bg-white/10 hover:bg-[#f06427] py-3 rounded-xl transition-all border border-white/5 uppercase tracking-widest">
                    <i class="bi bi-power"></i> <span class="hidden lg:inline">Cerrar Sesión</span>
                </button>
           </div>
      </aside>

      <!-- ÁREA DE CONTENIDO PRINCIPAL -->
      <main class="flex-1 flex flex-col relative z-0 overflow-hidden">
          
          <!-- BANDA SUPERIOR INSTITUCIONAL (HEADER) -->
          <header class="bg-black border-b-4 border-[#f06427] z-40">
              <!-- Sub-banda Social/Links -->
              <div class="flex justify-between items-center px-6 lg:px-10 py-1.5 bg-[#111] border-b border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <div class="flex items-center gap-6">
                      <a href="https://www.uahurtado.cl" target="_blank" class="hover:text-[#f06427] transition-colors">La Universidad</a>
                      <a href="https://admision.uahurtado.cl" target="_blank" class="hover:text-[#f06427] transition-colors">Admisión</a>
                  </div>
                  <div class="flex items-center gap-4">
                      <a href="mailto:finuah@uahurtado.cl" class="hover:text-[#f06427] transition-colors">finuah@uahurtado.cl</a>
                      <div class="flex gap-2 ml-4">
                          <a href="https://www.linkedin.com/company/facultad-de-ingenieria-civil-uah" target="_blank" class="hover:text-white"><i class="bi bi-linkedin"></i></a>
                          <a href="https://www.instagram.com/ingenieriasuah/" target="_blank" class="hover:text-white"><i class="bi bi-instagram"></i></a>
                      </div>
                  </div>
              </div>

              <!-- Banda Principal (Limpia y Minimalista) -->
              <div class="flex items-center justify-between px-6 lg:px-10 h-24 relative">
                  <div class="flex items-center gap-6">
                       <!-- Marca eliminada por redundancia: la identidad reside en el Sidebar -->
                  </div>

                  <!-- ÁREA DE IDENTITY & NOTIFICATIONS (Expandida y Visible) -->
                  <div class="flex items-center gap-10">
                      <div class="hidden md:flex flex-col items-end">
                          <div class="flex items-center gap-4 mb-1">
                              @if (authService.currentUser()?.rol === 'SuperUser') {
                                  <span class="bg-red-600/90 text-[10px] text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400/50 animate-pulse">
                                    CONTROL TOTAL • SUPERUSER
                                  </span>
                              }
                              <span class="text-lg font-black tracking-tighter text-white uppercase opacity-95">
                                Bienvenido, <span class="text-[#f06427]">{{ authService.currentUser()?.nombreCompleto }}</span>
                              </span>
                          </div>
                          <span class="text-[10px] text-white/50 font-black uppercase tracking-[0.4em]">{{ today | date:'EEEE, d MMMM y' }}</span>
                      </div>
                      
                      <div class="flex items-center gap-3">
                          <!-- ÚNICA CAMPANA UNIFICADA -->
                          <div class="relative">
                            <button (click)="toggleNotif()" class="relative h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all group border border-white/10 shadow-inner">
                                <i class="bi bi-bell-fill text-xl group-hover:animate-swing"></i>
                                @let totalAlerts = unreadCount();
                                @if (totalAlerts > 0) {
                                    <span class="absolute -top-1 -right-1 h-6 w-6 bg-[#f06427] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black animate-bounce shadow-lg">
                                        {{ totalAlerts }}
                                    </span>
                                }
                            </button>

                            @if (showNotif()) {
                                <div class="absolute right-0 top-14 w-80 bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn origin-top-right">
                                   <div class="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                        <h5 class="text-[10px] font-black text-white uppercase tracking-widest">Notificaciones</h5>
                                        @if (unreadCount() > 0) {
                                            <button (click)="markAllRead()" class="text-[9px] text-[#f06427] hover:underline uppercase font-bold">Marcar todo</button>
                                        }
                                    </div>
                                    <div class="max-h-64 overflow-y-auto custom-scrollbar">
                                        @for (n of myNotifications(); track n.id) {
                                            <div (click)="markRead(n)" class="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors flex gap-4 cursor-pointer" [class.bg-white/[0.02]]="!n.read">
                                                <div class="mt-1">
                                                    <i class="bi bi-info-circle-fill" [class.text-[#f06427]]="!n.read" [class.text-gray-600]="n.read"></i>
                                                </div>
                                                <div class="flex-1">
                                                    <h6 class="text-xs font-bold text-white">{{ n.title }}</h6>
                                                    <p class="text-[10px] text-gray-500 leading-tight mt-1">{{ n.message }}</p>
                                                </div>
                                            </div>
                                        }
                                        @if (myNotifications().length === 0) {
                                            <div class="p-8 text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">Sin notificaciones</div>
                                        }
                                    </div>
                                </div>
                            }
                          </div>

                          <button (click)="toggleDark()" class="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#f06427] hover:bg-white/10 transition-all shadow-inner">
                              <i [class]="authService.darkMode() ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill'"></i>
                          </button>
                      </div>
                  </div>
              </div>
          </header>

          <!-- Contenedor de Contenido y Footer (Scrollable) -->
          <div class="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar bg-gray-50 dark:bg-[#050505]">
              <div class="p-6 lg:p-10 min-h-[calc(100vh-18rem)]">
                <router-outlet></router-outlet>
              </div>

              <!-- FOOTER INSTITUCIONAL -->
              <footer class="mt-20 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-black p-10 lg:p-20 relative overflow-hidden">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
                      <!-- Col 1: Logo & Info -->
                      <div class="space-y-8">
                          <img src="assets/images/uah-insignia.jpg" 
                               class="h-10 w-auto rounded-lg border border-white/10 shadow-sm" alt="Logo Institucional Universidad Alberto Hurtado">
                          <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 space-y-2 leading-relaxed uppercase tracking-tighter">
                              <p>Universidad Alberto Hurtado</p>
                              <p>Alameda 1825, Santiago de Chile</p>
                              <p>Teléfono +56 2 2692 0200</p>
                          </div>
                      </div>

                      <!-- Col 2: Enlaces Rápidos -->
                      <div class="space-y-6">
                          <h6 class="text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em] border-l-2 border-[#f06427] pl-3">Categorías</h6>
                          <div class="flex flex-col gap-3 text-xs font-bold text-gray-400">
                             <a href="https://admision.uahurtado.cl/" target="_blank" class="hover:text-[#f06427] transition-all flex items-center gap-2">Admisión <i class="bi bi-box-arrow-up-right text-[10px]"></i></a>
                             <a href="https://www.uahurtado.cl/" target="_blank" class="hover:text-[#f06427] transition-all flex items-center gap-2">La Universidad <i class="bi bi-box-arrow-up-right text-[10px]"></i></a>
                          </div>
                      </div>

                      <!-- Col 3: Facultad -->
                      <div class="space-y-6">
                        <h6 class="text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em] border-l-2 border-[#f06427] pl-3">Facultad de Ingeniería</h6>
                        <div class="flex flex-col gap-3 text-xs font-bold text-gray-400">
                           <a href="https://ingenieria.uahurtado.cl" target="_blank" class="hover:text-[#f06427] transition-all">Inicio</a>
                           <a href="#" class="hover:text-[#f06427] transition-all">Plataforma SGA FIN</a>
                           <a href="mailto:finuah@uahurtado.cl" class="hover:text-[#f06427] transition-all">Contacto</a>
                        </div>
                      </div>

                      <!-- Col 4: Newsletter/Social -->
                      <div class="space-y-6 text-right">
                          <h6 class="text-[11px] font-black text-black dark:text-white uppercase tracking-[0.2em] border-[#f06427] pr-3 text-right">CONECTA CON NOSOTROS</h6>
                          <div class="flex justify-end gap-3">
                              <a href="https://www.linkedin.com/company/facultad-de-ingenieria-civil-uah" target="_blank" class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:bg-[#f06427] hover:text-white transition-all shadow-sm">
                                  <i class="bi bi-linkedin"></i>
                              </a>
                               <a href="https://www.instagram.com/ingenieriasuah/" target="_blank" class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:bg-[#f06427] hover:text-white transition-all shadow-sm">
                                  <i class="bi bi-instagram"></i>
                              </a>
                          </div>
                      </div>
                  </div>

                  <!-- Acreditación Banner -->
                  <div class="mt-20 pt-10 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
                      <img src="assets/images/acreditacion-v2.png" class="h-16 w-auto grayscale dark:grayscale-0 opacity-50 hover:opacity-100 transition-opacity" alt="Sello de Acreditación CNA 2025-2030 Universidad Alberto Hurtado">
                      <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center md:text-right">
                          © 2026 Facultad de Ingeniería - Universidad Alberto Hurtado. <br>
                          Desarrollado para la excelencia académica e investigación.
                      </div>
                  </div>
              </footer>
          </div>

      </main>

  </div>
} @else {
  <router-outlet></router-outlet>
}
`,
})
export class AppComponent {
    authService = inject(DataService);
    router = inject(Router);
    titleService = inject(Title);
    metaService = inject(Meta);

  
  today = new Date();
  currentUrl = signal('');

  isWelcomePage = computed(() => this.currentUrl().includes('/welcome'));
  
    constructor() {
        // Inicializar URL actual
        this.currentUrl.set(this.router.url);

        // Lógica de SEO Dinámico
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.currentUrl.set(this.router.url);
            this.updateSEO();
            this.checkPermissions();
        });

        // --- SEGURIDAD UAH: IDLE TIMEOUT (30 MIN) ---
        this.setupIdleTimeout();
    }

    /**
     * Sistema de seguridad que cierra sesión tras 30 minutos de inactividad.
     */
    private idleTimer: any;
    private setupIdleTimeout() {
        const resetTimer = () => {
            if (this.idleTimer) clearTimeout(this.idleTimer);
            // 30 minutos = 30 * 60 * 1000 ms
            this.idleTimer = setTimeout(() => {
                if (this.authService.currentUser()) {
                    console.warn("Sesión cerrada por inactividad (30 min)");
                    this.authService.logout();
                }
            }, 30 * 60 * 1000);
        };

        // Listeners de actividad global
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(evt => {
            document.addEventListener(evt, resetTimer, true);
        });

        resetTimer();
    }

    /**
     * Actualiza el título y meta descripción según la ruta actual.
     */
    updateSEO() {
        const url = this.router.url;
        let title = 'SGA FIN - Ingeniería UAH';
        let description = 'Sistema de Gestión de Finanzas e Infraestructura - Facultad de Ingeniería UAH';

        if (url.includes('dashboard')) title = 'Dashboard | SGA FIN UAH';
        if (url.includes('inventory')) title = 'Inventario de Equipos | SGA FIN UAH';
        if (url.includes('schedule')) title = 'Horarios y Reservas | SGA FIN UAH';
        if (url.includes('wiki')) title = 'Manuales y Wiki | SGA FIN UAH';
        if (url.includes('projects')) title = 'Proyectos e Innovación | SGA FIN UAH';

        this.titleService.setTitle(title);
        this.metaService.updateTag({ name: 'description', content: description });
    }

    /**
     * Redirige al académico si intenta entrar a áreas prohibidas.
     */
    checkPermissions() {
        const url = this.router.url;
        const role = this.authService.currentUser()?.rol;
        
        // --- PROTECCIÓN DE RUTAS SEGÚN ROL Y PERMISOS GRANULARES ---
        
        // 1. Zonas de Seguridad (Usuarios, Auditoría)
        const securityZones = url.includes('audit') || url.includes('users');
        if (securityZones && !this.isSuperUser() && !this.hasPermission('Usuarios', 'ver') && !this.hasPermission('Auditoria', 'ver')) {
            this.router.navigate(['/rooms']);
            return;
        }

        // 2. Dashboard
        if (url.includes('dashboard') && !this.isSuperUser() && !this.hasPermission('Dashboard', 'ver')) {
            this.router.navigate(['/rooms']);
            return;
        }

        // 3. Zonas de Administración de Laboratorios
        const procurementZone = url.includes('procurement') && !this.isLabAdmin() && !this.hasPermission('Compras', 'ver');
        const maintenanceZone = url.includes('maintenance') && !this.isLabAdmin() && !this.hasPermission('Mantencion', 'ver');
        const projectsZone = url.includes('projects') && !this.isLabAdmin() && !this.hasPermission('Proyectos', 'ver');
        const bitacoraZone = url.includes('bitacora') && !this.isLabAdmin() && !this.hasPermission('Bitagora', 'ver');

        if (procurementZone || maintenanceZone || projectsZone || bitacoraZone) {
            this.router.navigate(['/rooms']);
            return;
        }

        // 4. Zonas de Consulta (Laboratorios, Horarios, Wiki, Salas)
        const labZone = url.includes('inventory') && !this.isLabAdmin() && !this.hasPermission('Laboratorio', 'ver');
        const scheduleZone = url.includes('schedule') && !this.isAcadeAdmin() && !this.hasPermission('Horarios Academicos', 'ver');
        const wikiZone = url.includes('wiki') && !this.hasPermission('Wiki', 'ver');
        const roomZone = url.includes('rooms') && !this.hasPermission('Salas y Labs', 'ver');

        if (labZone || scheduleZone || wikiZone || roomZone) {
            this.router.navigate(['/welcome']);
            return;
        }
    }

    /**
     * Verifica si el usuario tiene un permiso específico para un módulo.
     */
    hasPermission(module: string, action: 'ver' | 'editar' | 'reservar'): boolean {
        const user = this.authService.currentUser();
        if (!user) return false;
        if (user.rol === 'SuperUser') return true;
        if (!user.permisos) return false;

        const level = user.permisos[module];
        if (!level) return false;

        if (action === 'ver') {
            return level === 'Editor' || level === 'Solo Vista' || level === 'Solo Reserva';
        }
        if (action === 'editar') {
            return level === 'Editor';
        }
        if (action === 'reservar') {
            return level === 'Editor' || level === 'Solo Reserva';
        }
        return false;
    }

    showNotif = signal(false);

    /**
     * Determina si el usuario actual tiene privilegios administrativos técnicos (Laboratorios).
     */
    isLabAdmin = computed(() => {
        const r = this.authService.currentUser()?.rol;
        return r === 'Admin_Labs' || r === 'SuperUser';
    });

    /**
     * Determina si el usuario actual tiene privilegios administrativos académicos (Salas/Horarios).
     */
    isAcadeAdmin = computed(() => {
        const r = this.authService.currentUser()?.rol;
        return r === 'Admin_Acade' || r === 'SuperUser';
    });

    /**
     * Determina si el usuario actual es Administrador de Salas (Gestiona Reservas).
     */
    isRoomAdmin = computed(() => {
        const r = this.authService.currentUser()?.rol;
        return r === 'Admin_Labs' || r === 'SuperUser';
    });

    /**
     * Determina si el usuario actual es SuperUser (Caja Negra).
     */
    isSuperUser = computed(() => {
        return this.authService.currentUser()?.rol === 'SuperUser';
    });

    /**
     * Filtra las notificaciones pertinentes al usuario actual.
     */
    myNotifications = computed(() => {
        const user = this.authService.currentUser();
        if (!user) return [];
        return this.authService.notifications()
            .filter(n => this.authService.isNotifForUser(n, user))
            .sort((a, b) => b.id - a.id);
    });

    /**
     * Cuenta las notificaciones no leídas y solicitudes pendientes (Caja Negra).
     */
    unreadCount = computed(() => {
        const notifs = this.myNotifications().filter(n => !n.read).length;
        const pendingRequests = this.authService.unifiedRequests().filter(r => r.status === 'Pendiente').length;
        
        // Si es Admin, suma las solicitudes pendientes de la Caja Negra al contador
        return this.isRoomAdmin() ? (notifs + pendingRequests) : notifs;
    });

    /**
     * Alterna la visibilidad del panel de notificaciones.
     */
    toggleNotif() { 
        this.showNotif.update(v => !v); 
        // Al abrir, refrescar la caja negra
        if (this.isRoomAdmin()) this.authService.fetchUnifiedRequests();
    }

    /**
     * Marca todas las notificaciones como leídas.
     */
    markAllRead() { this.authService.markAllAsRead(); }
    markRead(n: any) {
        if (!n.read) {
            this.authService.markAsRead(n.id);
        }
    }

    /**
     * Alterna el modo oscuro.
     */
    toggleDark() { this.authService.toggleDarkMode(); }
}
