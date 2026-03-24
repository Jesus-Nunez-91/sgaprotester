import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

/**
 * Componente de Auditoría (Caja Negra).
 * Muestra un registro detallado de las acciones realizadas por los usuarios en el sistema.
 * Utiliza una estética de terminal/hacker para enfatizar la seguridad y el monitoreo.
 */
@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="bg-[#0a0a0f] text-gray-300 rounded-3xl p-0 shadow-2xl min-h-[85vh] font-mono animate-fadeIn relative overflow-hidden border border-gray-800 flex flex-col">
       
       <!-- Efecto de fondo de matriz (Grilla) -->
       <div class="absolute inset-0 z-0 opacity-10 pointer-events-none" 
            style="background-image: linear-gradient(0deg, transparent 24%, rgba(32, 255, 77, .1) 25%, rgba(32, 255, 77, .1) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .1) 75%, rgba(32, 255, 77, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(32, 255, 77, .1) 25%, rgba(32, 255, 77, .1) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .1) 75%, rgba(32, 255, 77, .1) 76%, transparent 77%, transparent); background-size: 50px 50px;">
       </div>

       <!-- Encabezado del Registro de Auditoría -->
       <div class="flex flex-col md:flex-row items-center justify-between p-8 border-b border-gray-800/60 bg-[#0f0f16]/90 relative z-10 backdrop-blur-sm">
          <div>
              <h2 class="text-3xl font-black text-white flex items-center gap-4 tracking-tighter uppercase">
                 <span class="w-12 h-12 rounded-lg bg-uah-orange/10 border border-uah-orange/20 flex items-center justify-center text-uah-orange text-2xl shadow-[0_0_15px_rgba(243,112,33,0.3)]">
                    <i class="bi bi-incognito"></i>
                 </span>
                 CAJA NEGRA <span class="text-uah-orange opacity-50">STATION</span>
              </h2>
              <div class="flex items-center gap-2 mt-2">
                 <div class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <p class="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Live System Monitoring • Secure Protocol</p>
              </div>
          </div>
          
          <!-- Controles de búsqueda y exportación -->
          <div class="flex items-center gap-3 mt-4 md:mt-0 flex-wrap justify-end">
             <div class="relative">
                 <i class="bi bi-search absolute left-3 top-2.5 text-gray-600"></i>
                 <input [(ngModel)]="searchTerm" class="pl-9 pr-4 py-2 rounded-lg border border-gray-800 bg-[#16161e] text-xs focus:ring-1 focus:ring-uah-orange focus:border-uah-orange text-gray-300 w-48" placeholder="Buscar logs...">
             </div>

             <button (click)="exportLog()" class="group bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-bold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 border border-gray-700 shadow-lg hover:shadow-gray-700/20 hover:border-gray-500">
                <i class="bi bi-file-earmark-code group-hover:text-green-400 transition-colors"></i> EXPORTAR LOG
             </button>
             <a routerLink="/areas" class="group bg-uah-orange/10 hover:bg-uah-orange/20 text-uah-orange hover:text-orange-400 text-xs font-bold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 border border-uah-orange/20 hover:border-uah-orange/40">
                <i class="bi bi-arrow-left group-hover:-translate-x-1 transition-transform"></i> REGRESAR
             </a>
          </div>
       </div>

       <!-- Tabla de Logs -->
       <div class="flex-1 overflow-auto custom-scrollbar relative z-10 bg-[#0a0a0f]/50 p-4">
          <table class="w-full text-left text-xs border-separate border-spacing-y-1">
             <thead class="text-gray-500 uppercase font-bold text-[10px] tracking-widest sticky top-0 z-20">
                <tr>
                   <th class="p-4 bg-[#0a0a0f] border-b border-gray-800">Marca de Tiempo</th>
                   <th class="p-4 bg-[#0a0a0f] border-b border-gray-800">Identidad del Actor</th>
                   <th class="p-4 bg-[#0a0a0f] border-b border-gray-800">Firma del Evento</th>
                   <th class="p-4 bg-[#0a0a0f] border-b border-gray-800">Detalle del Payload</th>
                </tr>
             </thead>
             <tbody class="font-mono">
                @for (log of filteredLogs(); track log.id) {
                   <tr class="hover:bg-white/[0.03] transition-colors group">
                      <td class="p-4 border-l-2 border-transparent group-hover:border-uah-orange/50 text-gray-600 group-hover:text-gray-400 whitespace-nowrap text-[10px] font-bold">
                          {{ log.fecha | date:'yyyy-MM-dd HH:mm:ss' }}
                      </td>
                      <td class="p-4">
                         <div class="flex items-center gap-3">
                            <div class="w-2 h-2 rounded-full bg-gray-700 group-hover:bg-gray-500"></div>
                            <div>
                                <span class="text-gray-300 font-bold block">{{ log.nombre }}</span>
                                <span class="text-gray-600 text-[10px]">{{ log.rol }} <span class="opacity-30">::</span> {{ log.usuario }}</span>
                            </div>
                         </div>
                      </td>
                      <td class="p-4">
                         <!-- Estilos dinámicos basados en el tipo de acción -->
                         <span [class.text-green-400]="log.accion.includes('CREATE') || log.accion.includes('APROBAR')"
                               [class.text-green-500]="log.accion.includes('CREATE') || log.accion.includes('APROBAR')"
                               [class.shadow-[0_0_10px_rgba(74,222,128,0.2)]]="log.accion.includes('CREATE') || log.accion.includes('APROBAR')"
                               
                               [class.text-uah-orange]="log.accion.includes('DELETE') || log.accion.includes('RECHAZAR')"
                               [class.shadow-[0_0_10px_rgba(243,112,33,0.2)]]="log.accion.includes('DELETE') || log.accion.includes('RECHAZAR')"
                               
                               [class.text-cyan-400]="log.accion.includes('LOGIN') || log.accion.includes('RESERVA')"
                               [class.text-cyan-500]="log.accion.includes('LOGIN') || log.accion.includes('RESERVA')"
                               
                               [class.text-amber-400]="log.accion.includes('UPDATE')"
                               [class.text-amber-500]="log.accion.includes('UPDATE')"
                               
                               class="font-bold border border-current/20 bg-current/5 px-2.5 py-1 rounded text-[10px] tracking-wide inline-block min-w-[80px] text-center">
                            {{ log.accion }}
                         </span>
                      </td>
                      <td class="p-4 text-gray-500 group-hover:text-gray-300 break-words max-w-md">
                         <span class="opacity-50 mr-2">></span>{{ log.detalle }}
                      </td>
                   </tr>
                }
             </tbody>
          </table>
          @if (filteredLogs().length === 0) {
             <div class="text-center py-12 text-gray-600 font-mono text-xs">
                 NO HAY DATOS QUE COINCIDAN CON LA SECUENCIA DE BÚSQUEDA
             </div>
          }
       </div>
       
       <!-- Pie de página con estado del sistema -->
       <div class="p-4 border-t border-gray-800 bg-[#0f0f16] flex justify-between items-center text-[10px] text-gray-600 font-mono">
           <div>ESTADO DEL SISTEMA: <span class="text-green-500">ONLINE</span></div>
           <div>REGISTROS TOTALES: {{ data.auditLogs().length }}</div>
       </div>
    </div>
  `
})
export class AuditComponent implements OnInit {
  data = inject(DataService);
  router = inject(Router);
  
  // Señal para el término de búsqueda
  searchTerm = signal('');

  ngOnInit() {
    const role = this.data.currentUser()?.rol;
    if (role !== 'SuperUser') {
      this.router.navigate(['/areas']);
    }
  }

  /**
   * Filtra los logs de auditoría basándose en el término de búsqueda.
   */
  filteredLogs = computed(() => {
     return this.data.fuzzySearch(this.data.auditLogs(), this.searchTerm(), ['nombre', 'usuario', 'accion', 'detalle', 'rol']);
  });

  /**
   * Exporta los logs filtrados a un archivo Excel.
   */
  exportLog() {
     this.data.downloadExcel(this.filteredLogs(), 'SGA_Audit_Log_' + new Date().toISOString().slice(0,10));
  }
}
