import { Component, inject, signal, ViewChild, ElementRef, computed } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
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
  <div class="flex h-screen w-full overflow-hidden bg-transparent transition-colors duration-500 relative">
      
      <!-- BARRA LATERAL IZQUIERDA (Glassmorphism) -->
      <aside class="w-20 lg:w-64 glass-sidebar flex flex-col justify-between z-50 transition-all duration-300 shadow-2xl relative">
          <!-- Área del Logo -->
          <div class="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-200/30 dark:border-white/5">
              <a routerLink="/areas" class="flex items-center gap-3 group cursor-pointer">
                  <div class="relative">
                      <div class="absolute inset-0 bg-uah-gold rounded-full blur-sm opacity-0 group-hover:opacity-50 transition-opacity"></div>
                      <img src="https://i.postimg.cc/DzBvDGMs/Logo-UAH.jpg" class="h-10 w-10 rounded-full shadow-lg relative z-10 object-contain bg-white p-0.5" alt="Logo UAH">
                  </div>
                  <div class="hidden lg:flex flex-col">
                      <span class="text-uah-blue dark:text-white font-bold text-lg leading-none tracking-tight text-shadow">SGA <span class="text-uah-gold">PRO</span></span>
                      <span class="text-[10px] text-gray-600 dark:text-gray-300 font-medium tracking-widest uppercase text-shadow">Ingeniería</span>
                  </div>
              </a>
          </div>

          <!-- Enlaces de Navegación -->
          <nav class="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3">
              
              <!-- Dashboard (Solo para Administradores) -->
              @if (isAdmin()) {
                  <a routerLink="/dashboard" routerLinkActive="bg-white/50 dark:bg-white/10 text-uah-blue dark:text-white shadow-sm border-l-4 border-uah-blue dark:border-uah-gold" 
                     class="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5 hover:text-uah-blue dark:hover:text-white transition-all group font-bold text-shadow">
                      <i class="bi bi-speedometer2 text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Panel de Control</span>
                  </a>
              }

              <!-- Áreas e Inventario -->
              <a routerLink="/areas" routerLinkActive="bg-white/50 dark:bg-white/10 text-uah-blue dark:text-white shadow-sm border-l-4 border-uah-blue dark:border-uah-gold" 
                 class="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5 hover:text-uah-blue dark:hover:text-white transition-all group font-bold text-shadow">
                  <i class="bi bi-grid-fill text-xl group-hover:scale-110 transition-transform"></i>
                  <span class="hidden lg:inline text-sm">Áreas & Labs</span>
              </a>

              <!-- Horarios -->
              <a routerLink="/schedule" routerLinkActive="bg-white/50 dark:bg-white/10 text-uah-blue dark:text-white shadow-sm border-l-4 border-uah-blue dark:border-uah-gold" 
                 class="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5 hover:text-uah-blue dark:hover:text-white transition-all group font-bold text-shadow">
                  <i class="bi bi-calendar-week-fill text-xl group-hover:scale-110 transition-transform"></i>
                  <span class="hidden lg:inline text-sm">Horarios</span>
              </a>

              <!-- Mis Solicitudes -->
              <a routerLink="/requests" routerLinkActive="bg-white/50 dark:bg-white/10 text-uah-blue dark:text-white shadow-sm border-l-4 border-uah-blue dark:border-uah-gold" 
                 class="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5 hover:text-uah-blue dark:hover:text-white transition-all group font-bold text-shadow">
                  <i class="bi bi-clipboard2-check-fill text-xl group-hover:scale-110 transition-transform"></i>
                  <span class="hidden lg:inline text-sm">Mis Solicitudes</span>
              </a>

              <!-- Soporte -->
              <a routerLink="/support" routerLinkActive="bg-white/50 dark:bg-white/10 text-uah-blue dark:text-white shadow-sm border-l-4 border-uah-blue dark:border-uah-gold" 
                 class="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5 hover:text-uah-blue dark:hover:text-white transition-all group font-bold text-shadow">
                  <i class="bi bi-chat-heart-fill text-xl group-hover:scale-110 transition-transform"></i>
                  <span class="hidden lg:inline text-sm">Soporte</span>
              </a>

              @if (isAdmin()) {
                  <div class="my-2 border-t border-gray-200/30 dark:border-white/10"></div>
                  <span class="hidden lg:block px-4 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2 text-shadow">Administración</span>
                  
                  <!-- Gestión de Compras -->
                  <a routerLink="/procurement" routerLinkActive="bg-white/50 dark:bg-white/10 text-uah-blue dark:text-white shadow-sm border-l-4 border-uah-blue dark:border-uah-gold" 
                     class="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5 hover:text-uah-blue dark:hover:text-white transition-all group font-bold text-shadow">
                      <i class="bi bi-currency-dollar text-xl group-hover:scale-110 transition-transform text-emerald-600 dark:text-emerald-400"></i>
                      <span class="hidden lg:inline text-sm">Gestión de Compras</span>
                  </a>

                  <!-- Mantención -->
                  <a routerLink="/maintenance" routerLinkActive="bg-white/50 dark:bg-white/10 text-uah-blue dark:text-white shadow-sm border-l-4 border-uah-blue dark:border-uah-gold" 
                     class="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5 hover:text-uah-blue dark:hover:text-white transition-all group font-bold text-shadow">
                      <i class="bi bi-tools text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Mantención</span>
                  </a>

                  <!-- Usuarios (Solo SuperUser) -->
                  <a routerLink="/users" *ngIf="isSuperUser()" routerLinkActive="bg-white/50 dark:bg-white/10 text-uah-blue dark:text-white shadow-sm border-l-4 border-uah-blue dark:border-uah-gold" 
                     class="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5 hover:text-uah-blue dark:hover:text-white transition-all group font-bold text-shadow">
                      <i class="bi bi-people-fill text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Usuarios</span>
                  </a>

                  <!-- Auditoría -->
                  <a routerLink="/audit" routerLinkActive="bg-white/50 dark:bg-white/10 text-uah-blue dark:text-white shadow-sm border-l-4 border-uah-blue dark:border-uah-gold" 
                     class="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-white/5 hover:text-uah-blue dark:hover:text-white transition-all group font-bold text-shadow">
                      <i class="bi bi-incognito text-xl group-hover:scale-110 transition-transform"></i>
                      <span class="hidden lg:inline text-sm">Auditoría</span>
                  </a>
              }
          </nav>

          <!-- Perfil de Usuario Mini -->
          <div class="p-4 border-t border-gray-200/30 dark:border-white/5 bg-white/20 dark:bg-black/20 backdrop-blur-md">
              <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-uah-blue to-blue-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white/30">
                      {{ authService.currentUser()?.nombreCompleto?.charAt(0) }}
                  </div>
                  <div class="hidden lg:block overflow-hidden">
                      <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate text-shadow">{{ authService.currentUser()?.nombreCompleto }}</h4>
                      <p class="text-[10px] text-gray-600 dark:text-gray-300 truncate font-medium">{{ authService.currentUser()?.rol }}</p>
                  </div>
                  <button (click)="authService.logout()" class="ml-auto text-gray-500 dark:text-gray-300 hover:text-red-500 transition-colors lg:hidden" title="Logout">
                      <i class="bi bi-box-arrow-right"></i>
                  </button>
              </div>
              <button (click)="authService.logout()" class="hidden lg:flex w-full mt-3 items-center justify-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 py-2 rounded-lg transition-colors">
                  <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
              </button>
          </div>
      </aside>

      <!-- ÁREA DE CONTENIDO PRINCIPAL -->
      <main class="flex-1 flex flex-col relative z-0 overflow-hidden">
          
          <!-- Encabezado Superior -->
          <header class="h-20 shrink-0 flex items-center justify-between px-6 lg:px-10 z-40">
              <!-- Bienvenida -->
              <div class="flex flex-col">
                  <h1 class="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white tracking-tight text-shadow">
                      Hola, <span class="text-uah-blue dark:text-blue-300">{{ authService.currentUser()?.nombreCompleto?.split(' ')?.[0] }}</span> 👋
                  </h1>
                  <p class="text-xs text-gray-600 dark:text-gray-300 font-medium opacity-90">
                      {{ today | date:'fullDate' }}
                  </p>
              </div>

              <!-- Utilidades (Modo Oscuro, Notificaciones) -->
              <div class="flex items-center gap-4">
                   <!-- Ayuda Rápida -->
                   @if (!isAdmin()) {
                       <a routerLink="/support" class="hidden md:flex items-center gap-2 px-4 py-2 bg-uah-gold/10 hover:bg-uah-gold/20 text-uah-blue dark:text-uah-gold rounded-xl border border-uah-gold/30 transition-all font-bold text-xs mr-2">
                           <i class="bi bi-question-circle-fill"></i>
                           <span>¿Necesitas Ayuda?</span>
                       </a>
                   }
                   
                   <!-- Modo Oscuro -->
                   <button (click)="toggleDark()" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-600 dark:text-yellow-400 hover:scale-110 transition-transform shadow-sm border border-white/40">
                       <i [class]="authService.darkMode() ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill'"></i>
                   </button>

                   <!-- Notificaciones -->
                   <div class="relative group/notif">
                      <button (click)="toggleNotif()" class="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-uah-blue dark:hover:text-blue-400 hover:scale-110 transition-all shadow-sm relative border border-white/40">
                          <i class="bi bi-bell-fill" [class.animate-swing]="unreadCount() > 0"></i>
                          @if (unreadCount() > 0) {
                              <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                  {{ unreadCount() > 9 ? '+9' : unreadCount() }}
                              </span>
                          }
                      </button>
                      
                      @if (showNotif()) {
                          <div class="absolute right-0 top-12 w-80 glass-panel bg-white/95 dark:bg-[#0f0f16]/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden animate-fadeIn z-50 origin-top-right ring-1 ring-black/5">
                             <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                  <h5 class="text-xs font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Notificaciones</h5>
                                  @if (unreadCount() > 0) {
                                      <button (click)="markAllRead()" class="text-[10px] text-uah-blue hover:underline">Marcar leídas</button>
                                  }
                              </div>
                              <div class="max-h-64 overflow-y-auto custom-scrollbar">
                                  @for (n of myNotifications(); track n.id) {
                                      <div class="p-3 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex gap-3 relative" [class.bg-blue-50_30]="!n.read">
                                          <div class="mt-1">
                                              @if(n.type === 'success') { <i class="bi bi-check-circle-fill text-green-500"></i> }
                                              @if(n.type === 'error') { <i class="bi bi-x-circle-fill text-red-500"></i> }
                                              @if(n.type === 'warning') { <i class="bi bi-exclamation-triangle-fill text-amber-500"></i> }
                                              @if(n.type === 'info') { <i class="bi bi-info-circle-fill text-blue-500"></i> }
                                          </div>
                                          <div class="flex-1">
                                              <h6 class="text-xs font-bold text-gray-800 dark:text-gray-200">{{ n.title }}</h6>
                                              <p class="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{{ n.message }}</p>
                                          </div>
                                      </div>
                                  }
                                  @if (myNotifications().length === 0) {
                                      <div class="p-6 text-center text-gray-400 text-xs">Sin notificaciones</div>
                                  }
                              </div>
                          </div>
                      }
                   </div>
              </div>
          </header>

          <!-- Contenedor de Rutas (Scrollable) -->
          <div class="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 scroll-smooth custom-scrollbar">
              <router-outlet></router-outlet>
          </div>

      </main>

  </div>

   <!-- IA REMOVIDA -->


} @else {
  <!-- El layout de Login es manejado por el router-outlet sin el wrapper de la sidebar -->
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

    today = new Date();

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
