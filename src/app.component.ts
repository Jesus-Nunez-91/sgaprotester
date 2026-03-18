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
@if (authService.currentUser()) {
  <div class="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-500 relative">
      
      <!-- BARRA LATERAL IZQUIERDA (Institucional Black) -->
      <aside class="w-20 lg:w-72 bg-black flex flex-col justify-between z-50 transition-all duration-300 shadow-2xl relative border-r border-[#f06427]/30">
          <!-- Área del Logo / Banner Pequeño -->
          <div class="h-24 flex items-center justify-center lg:px-6 border-b border-[#f06427]/20 bg-black">
              <a routerLink="/areas" class="flex items-center gap-3 group cursor-pointer">
                  <div class="relative">
                      <img src="https://i.postimg.cc/DzBvDGMs/Logo-UAH.jpg" class="h-12 w-12 rounded-full shadow-2xl relative z-10 object-contain bg-white p-1" alt="Logo Universidad Alberto Hurtado">
                  </div>
                  <div class="hidden lg:flex flex-col">
                      <span class="text-white font-black text-xl leading-none tracking-tighter">SGA <span class="text-[#f06427]">FIN</span></span>
                      <span class="text-[9px] text-[#f06427] font-black tracking-widest uppercase mt-1">Ingeniería UAH</span>
                  </div>
              </a>
          </div>

          <!-- Enlaces de Navegación -->
          <nav class="flex-1 overflow-y-auto py-8 flex flex-col gap-1.5 px-4 scrollbar-hide">
              @if (isAdmin()) {
                  <a routerLink="/dashboard" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                     class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                      <i class="bi bi-grid-1x2-fill text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Dashboard</span>
                  </a>
              }

              <a routerLink="/areas" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                 class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                  <i class="bi bi-laptop-fill text-xl group-hover:scale-110 transition-transform"></i>
                  <span class="hidden lg:inline text-sm">Laboratorios</span>
              </a>

              <a routerLink="/schedule" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                 class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                  <i class="bi bi-calendar3 text-xl group-hover:scale-110 transition-transform"></i>
                  <span class="hidden lg:inline text-sm">Horarios</span>
              </a>

              <a routerLink="/requests" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                 class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                  <i class="bi bi-file-earmark-check-fill text-xl group-hover:scale-110 transition-transform"></i>
                  <span class="hidden lg:inline text-sm">Mis Solicitudes</span>
              </a>

              <a routerLink="/support" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                 class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                  <i class="bi bi-chat-left-text-fill text-xl group-hover:scale-110 transition-transform"></i>
                  <span class="hidden lg:inline text-sm">Ayuda & Soporte</span>
              </a>

              @if (isAdmin()) {
                  <div class="my-6 border-t border-white/5"></div>
                  <span class="hidden lg:block px-5 text-[10px] font-black text-[#f06427] uppercase tracking-[0.2em] mb-4">Administración</span>
                  
                  <a routerLink="/procurement" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                     class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                      <i class="bi bi-cart-check-fill text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Compras</span>
                  </a>

                  <a routerLink="/maintenance" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                     class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                      <i class="bi bi-tools text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Mantención</span>
                  </a>

                  <a routerLink="/users" *ngIf="isSuperUser()" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                     class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                      <i class="bi bi-people-fill text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Usuarios</span>
                  </a>

                  <a routerLink="/projects" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                     class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                      <i class="bi bi-kanban text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Proyectos</span>
                  </a>

                  <a routerLink="/wiki" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                     class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                      <i class="bi bi-journal-bookmark-fill text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Wiki</span>
                  </a>

                  <a routerLink="/bitacora" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                     class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                      <i class="bi bi-journal-text text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Bitácora</span>
                  </a>

                  <a routerLink="/audit" routerLinkActive="bg-[#f06427] text-white shadow-lg shadow-[#f06427]/20" 
                     class="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group font-bold tracking-tight">
                      <i class="bi bi-shield-lock-fill text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Auditoría</span>
                  </a>
              }
          </nav>

           <!-- Perfil Mini -->
           <div class="p-6 border-t border-white/5 bg-white/5">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-xl bg-[#f06427] flex items-center justify-center text-white font-black shadow-lg">
                        {{ authService.currentUser()?.nombreCompleto?.charAt(0) }}
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

              <!-- Banda Principal con Banner -->
              <div class="flex items-center justify-between px-6 lg:px-10 h-20">
                  <div class="flex items-center gap-8">
                       <img src="https://ingenieria.uahurtado.cl/wp-content/uploads/2024/01/Componente-14-%E2%80%93-1.png" 
                            class="h-10 lg:h-12 w-auto object-contain" alt="Facultad de Ingeniería UAH - Sistema SGA FIN">
                  </div>

                  <div class="flex items-center gap-6">
                       <!-- Bienvenida -->
                      <div class="hidden md:flex flex-col text-right">
                          <h1 class="text-sm font-black text-white tracking-tight uppercase">
                              Bienvenido, <span class="text-[#f06427]">{{ authService.currentUser()?.nombreCompleto?.split(' ')?.[0] }}</span>
                          </h1>
                          <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                              {{ today | date:'fullDate' }}
                          </p>
                      </div>

                      <!-- Acciones Rápidas -->
                      <div class="flex items-center gap-3">
                          <button (click)="toggleDark()" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#f06427] hover:bg-white/10 transition-all">
                              <i [class]="authService.darkMode() ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill'"></i>
                          </button>

                          <div class="relative">
                              <button (click)="toggleNotif()" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#f06427] hover:bg-white/10 transition-all relative">
                                  <i class="bi bi-bell-fill" [class.animate-swing]="unreadCount() > 0"></i>
                                  @if (unreadCount() > 0) {
                                      <span class="absolute -top-1 -right-1 w-5 h-5 bg-[#f06427] border-2 border-black rounded-full flex items-center justify-center text-[9px] font-black text-white">
                                          {{ unreadCount() }}
                                      </span>
                                  }
                              </button>
                              
                              @if (showNotif()) {
                                  <div class="absolute right-0 top-12 w-80 bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn origin-top-right">
                                     <div class="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                          <h5 class="text-[10px] font-black text-white uppercase tracking-widest">Notificaciones</h5>
                                          @if (unreadCount() > 0) {
                                              <button (click)="markAllRead()" class="text-[9px] text-[#f06427] hover:underline uppercase font-bold">Marcar todo</button>
                                          }
                                      </div>
                                      <div class="max-h-64 overflow-y-auto custom-scrollbar">
                                          @for (n of myNotifications(); track n.id) {
                                              <div class="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors flex gap-4" [class.bg-white/[0.02]]="!n.read">
                                                  <div class="mt-1">
                                                      <i class="bi bi-info-circle-fill text-[#f06427]"></i>
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
                          <img src="https://ingenieria.uahurtado.cl/wp-content/uploads/2024/01/Componente-14-%E2%80%93-1.png" 
                               class="h-10 w-auto brightness-0 dark:brightness-100" alt="Logo Institucional Universidad Alberto Hurtado">
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
                      <img src="https://ingenieria.uahurtado.cl/wp-content/uploads/2024/01/logo_acredicacion_v2_2025_2030.png" class="h-16 w-auto grayscale dark:grayscale-0 opacity-50 hover:opacity-100 transition-opacity" alt="Sello de Acreditación CNA 2025-2030 Universidad Alberto Hurtado">
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
    styles: [`
        .glass-sidebar {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        :host-context(.dark) .glass-sidebar {
            background: rgba(15, 15, 22, 0.8);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
        }
    `]
})
export class AppComponent {
    authService = inject(DataService);
    router = inject(Router);
    titleService = inject(Title);
    metaService = inject(Meta);

    today = new Date();

    constructor() {
        // Lógica de SEO Dinámico
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.updateSEO();
        });
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

    // Estados de Notificaciones
    showNotif = signal(false);

    @ViewChild('chatContainer') private chatContainer!: ElementRef;

    /**
     * Determina si el usuario actual tiene privilegios administrativos.
     */
    isAdmin = computed(() => {
        const r = this.authService.currentUser()?.rol;
        return r === 'Admin' || r === 'SuperUser';
    });

    /**
     * Determina si el usuario actual es SuperUser.
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
     * Cuenta las notificaciones no leídas.
     */
    unreadCount = computed(() => this.myNotifications().filter(n => !n.read).length);

    /**
     * Alterna la visibilidad del panel de notificaciones.
     */
    toggleNotif() { this.showNotif.update(v => !v); }

    /**
     * Marca todas las notificaciones como leídas.
     */
    markAllRead() { this.authService.markAllAsRead(); }

    /**
     * Alterna el modo oscuro.
     */
    toggleDark() { this.authService.toggleDarkMode(); }
}
