import { Component, inject, computed, signal, effect } from '@angular/core';
import { DataService, SupportTicket } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

declare const Swal: any;

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="max-w-5xl mx-auto py-8 animate-fadeIn pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/80 dark:bg-gray-800/80 p-6 rounded-3xl shadow-lg border border-white/50 dark:border-gray-700 backdrop-blur-md">
          <div>
              <h2 class="text-3xl font-black text-uah-blue dark:text-blue-400 flex items-center gap-3 tracking-tighter uppercase">
                  <i class="bi bi-chat-square-text-fill"></i> Atención & Soporte
              </h2>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-1">Canal Institucional de Consultas Técnicas</p>
          </div>
          <div class="flex gap-3 mt-4 md:mt-0">
            @if (isAdmin()) {
                <button (click)="toggleViewMode()" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-uah-blue dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                    <i [class]="viewMode() === 'list' ? 'bi bi-kanban' : 'bi bi-list-task'"></i>
                    {{ viewMode() === 'list' ? 'Ver Tablero' : 'Ver Lista' }}
                </button>
            }
            <a routerLink="/areas" class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                <i class="bi bi-arrow-left"></i> Volver
            </a>
          </div>
      </div>

      @if (viewMode() === 'kanban' && isAdmin()) {
          <!-- Kanban View -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn h-[700px]">
              <!-- Column: Open -->
              <div class="flex flex-col h-full bg-gray-100/50 dark:bg-gray-900/50 rounded-3xl p-4 border border-gray-200 dark:border-gray-800">
                  <div class="flex justify-between items-center mb-4 px-2">
                      <h3 class="font-black text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-uah-blue shadow-[0_0_8px_rgba(0,51,102,0.4)]"></span> Abiertas
                      </h3>
                      <span class="bg-gray-200 dark:bg-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{{ ticketsByStatus().open.length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                      @for (t of ticketsByStatus().open; track t.id) {
                          <div (click)="selectTicket(t)" class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-transparent hover:border-uah-blue cursor-pointer transition-all group">
                              <h4 class="font-bold text-sm mb-1 dark:text-gray-200">{{ t.subject }}</h4>
                              <p class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{{ t.lastMessage }}</p>
                              <div class="flex justify-between items-center text-[9px] text-gray-400 border-t border-gray-50 dark:border-gray-700 pt-2">
                                  <span>{{ t.userName }}</span>
                                   <button (click)="$event.stopPropagation(); moveToInProgress(t)" class="text-uah-orange font-black uppercase text-[9px] tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Atender <i class="bi bi-arrow-right-short"></i></button>
                              </div>
                          </div>
                      }
                  </div>
              </div>

              <!-- Column: In Progress -->
              <div class="flex flex-col h-full bg-gray-100/50 dark:bg-gray-900/50 rounded-3xl p-4 border border-gray-200 dark:border-gray-800">
                  <div class="flex justify-between items-center mb-4 px-2">
                      <h3 class="font-black text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-uah-orange shadow-[0_0_8px_rgba(243,112,33,0.4)]"></span> En Curso
                      </h3>
                      <span class="bg-gray-200 dark:bg-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{{ ticketsByStatus().inProgress.length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                      @for (t of ticketsByStatus().inProgress; track t.id) {
                          <div (click)="selectTicket(t)" class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-transparent hover:border-uah-blue cursor-pointer transition-all group border-l-4 border-amber-400">
                              <h4 class="font-bold text-sm mb-1 dark:text-gray-200">{{ t.subject }}</h4>
                              <p class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{{ t.lastMessage }}</p>
                              <div class="flex justify-between items-center text-[9px] text-gray-400 border-t border-gray-50 dark:border-gray-700 pt-2">
                                  <span>{{ t.userName }}</span>
                                  <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button (click)="$event.stopPropagation(); moveToOpen(t)" class="text-gray-400 hover:text-gray-600"><i class="bi bi-arrow-left-short"></i> Reabrir</button>
                                      <button (click)="$event.stopPropagation(); moveToClosed(t)" class="text-green-500 font-bold">Cerrar <i class="bi bi-check2-all"></i></button>
                                  </div>
                              </div>
                          </div>
                      }
                  </div>
              </div>

              <!-- Column: Closed -->
              <div class="flex flex-col h-full bg-gray-100/50 dark:bg-gray-900/50 rounded-3xl p-4 border border-gray-200 dark:border-gray-800 opacity-80">
                  <div class="flex justify-between items-center mb-4 px-2">
                      <h3 class="font-bold text-sm text-gray-500 uppercase tracking-widest flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-gray-400"></span> Cerradas
                      </h3>
                      <span class="bg-gray-200 dark:bg-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{{ ticketsByStatus().closed.length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 grayscale hover:grayscale-0 transition-all">
                      @for (t of ticketsByStatus().closed; track t.id) {
                          <div (click)="selectTicket(t)" class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-transparent hover:border-uah-blue cursor-pointer transition-all border-l-4 border-gray-300">
                              <h4 class="font-bold text-sm mb-1 text-gray-400 dark:text-gray-500 line-through">{{ t.subject }}</h4>
                              <p class="text-[9px] text-gray-400">{{ t.lastUpdate | date:'short' }}</p>
                          </div>
                      }
                  </div>
              </div>
          </div>
      } @else {
          <!-- Standard List View (Modified for 3 status) -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <!-- Tickets List -->
         <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[600px] border border-gray-100 dark:border-gray-700">
             <div class="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 class="font-bold text-gray-700 dark:text-gray-300">Mis Consultas</h3>
                 <button (click)="createNew()" class="bg-uah-orange text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20" title="Nueva Consulta">
                   <i class="bi bi-plus-lg"></i>
                </button>
             </div>
             
             <div class="flex-1 overflow-y-auto custom-scrollbar">
                @for (ticket of myTickets(); track ticket.id) {
                   <div (click)="selectTicket(ticket)" 
                        (keydown.enter)="selectTicket(ticket)"
                        (keydown.space)="selectTicket(ticket)"
                        tabindex="0"
                        role="button"
                        [class]="selectedTicket()?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-uah-blue' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'"
                        class="p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-uah-blue">
                      <div class="flex justify-between items-start mb-1">
                         <span class="font-bold text-sm text-gray-800 dark:text-gray-200 truncate pr-2">{{ ticket.subject }}</span>
                         @if (ticket.status === 'Open') {
                             <span class="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full font-bold">ABIERTO</span>
                         } @else if (ticket.status === 'In Progress') {
                              <span class="text-[10px] bg-uah-orange text-white px-2 py-0.5 rounded-full font-bold">EN CURSO</span>
                         } @else {
                             <span class="text-[10px] bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">CERRADO</span>
                         }
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ ticket.messages[ticket.messages.length - 1].text }}</p>
                      <div class="flex justify-between items-center mt-2">
                         <span class="text-[10px] text-gray-400">{{ ticket.lastUpdate | date:'short' }}</span>
                         @if (isAdmin() && ticket.userId !== currentUser()?.id) {
                             <span class="text-[10px] font-bold text-uah-blue dark:text-blue-400 flex items-center gap-1">
                                <i class="bi bi-person"></i> {{ ticket.userName }}
                             </span>
                         }
                      </div>
                   </div>
                }
                @if (myTickets().length === 0) {
                   <div class="p-8 text-center text-gray-400">
                      <i class="bi bi-chat-square-dots text-4xl mb-2 block opacity-50"></i>
                      <p class="text-xs">No hay consultas activas.</p>
                   </div>
                }
             </div>
         </div>

         <!-- Chat Area -->
         <div class="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-gray-700/50 flex flex-col h-[650px] overflow-hidden relative group">
             <!-- Glossy Overlay -->
             <div class="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none"></div>

             @if (selectedTicket()) {
                 <!-- Chat Header -->
                 <div class="p-5 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-center bg-white/40 dark:bg-gray-900/40 relative z-10">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-uah-blue flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <i class="bi bi-chat-dots-fill text-xl"></i>
                        </div>
                        <div>
                             <h3 class="font-black text-uah-blue dark:text-blue-400 uppercase tracking-tighter text-lg">{{ selectedTicket()?.subject }}</h3>
                             <div class="flex items-center gap-2 mt-0.5">
                                 <span class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">ID #{{ selectedTicket()?.id }}</span>
                                 <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                                 @if (selectedTicket()?.status === 'Open') {
                                     <span class="text-[8px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Estado: Disponible</span>
                                 } @else if (selectedTicket()?.status === 'In Progress') {
                                      <span class="text-[8px] bg-uah-orange/10 text-uah-orange px-2 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse">En Atención Directa</span>
                                 } @else {
                                     <span class="text-[8px] bg-gray-500/10 text-gray-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Ticket Finalizado</span>
                                 }
                             </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        @if (isAdmin()) {
                            <button (click)="deleteTicket()" class="h-10 w-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-100 flex items-center justify-center shadow-sm" title="Eliminar definitivamente">
                               <i class="bi bi-trash3-fill"></i>
                            </button>
                        }
                        @if (selectedTicket()?.status !== 'Closed') {
                             @if (selectedTicket()?.status === 'Open' && isAdmin()) {
                                 <button (click)="moveToInProgress(selectedTicket()!)" class="h-10 px-4 bg-uah-orange hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest">
                                     <i class="bi bi-rocket-takeoff-fill"></i> Atender Ahora
                                 </button>
                             }
                             <button (click)="closeTicket()" class="h-10 px-4 bg-blue-50 dark:bg-blue-900/20 text-uah-blue dark:text-blue-300 hover:bg-uah-blue hover:text-white font-black rounded-xl border border-blue-100 dark:border-blue-800 transition-all text-[10px] uppercase tracking-widest">
                                Cerrar Caso
                             </button>
                        }
                    </div>
                 </div>

                 <!-- Messages Container (Modern bubbles) -->
                 <div class="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar" #chatContainer>
                     @for (msg of selectedTicket()?.messages; track $index) {
                        @if (msg.sender === 'Sistema') {
                            <!-- System Event -->
                            <div class="flex justify-center my-4">
                                <div class="bg-gray-100/80 dark:bg-gray-700/30 backdrop-blur-sm text-gray-500 dark:text-gray-400 text-[9px] font-black px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-600/50 uppercase tracking-[0.2em] shadow-sm">
                                    {{ msg.text.replace('[SISTEMA]: ', '') }}
                                </div>
                            </div>
                        } @else {
                            <div [class]="isMe(msg.sender) ? 'ml-auto items-end text-right' : 'mr-auto items-start text-left'" class="flex flex-col max-w-[75%] animate-slideUp">
                                <div class="flex items-center gap-2 mb-1.5" [class.flex-row-reverse]="isMe(msg.sender)">
                                    <div class="w-6 h-6 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-black text-gray-500 dark:text-gray-400 border border-white dark:border-gray-600 shadow-sm">
                                        {{ msg.sender.charAt(0) }}
                                    </div>
                                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ isMe(msg.sender) ? 'Tú' : msg.sender }}</span>
                                    <span class="text-[8px] text-gray-300 font-bold">• {{ msg.timestamp | date:'HH:mm' }}</span>
                                </div>

                                <div [class]="isMe(msg.sender) ? 'bg-[#f06427] text-white rounded-2xl rounded-tr-none shadow-orange-500/10' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-600/50 rounded-2xl rounded-tl-none shadow-blue-500/5'" 
                                     class="p-4 shadow-xl relative transition-all hover:scale-[1.01] duration-300">
                                     <p class="text-sm leading-relaxed">{{ msg.text }}</p>
                                     @if (isMe(msg.sender)) {
                                         <div class="absolute -right-1 -bottom-1 w-4 h-4 bg-[#f06427] rotate-45 -z-10 rounded-sm"></div>
                                     } @else {
                                         <div class="absolute -left-1 -bottom-1 w-4 h-4 bg-white dark:bg-gray-700 rotate-45 -z-10 rounded-sm"></div>
                                     }
                                </div>
                                <span class="text-[8px] font-black text-uah-blue/40 mt-1 uppercase tracking-tighter">{{ msg.senderRole }}</span>
                            </div>
                        }
                     }
                 </div>

                 <!-- Input Area (Premium) -->
                 @if (selectedTicket()?.status !== 'Closed') {
                     <div class="p-5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-t border-gray-100 dark:border-gray-700/50 relative z-10">
                        <div class="flex gap-3 bg-white dark:bg-gray-950 p-1.5 rounded-[1.25rem] shadow-2xl border border-gray-100 dark:border-gray-800 transition-all focus-within:ring-2 focus-within:ring-uah-blue/50">
                           <input [(ngModel)]="replyText" (keyup.enter)="sendReply()" placeholder="Responde a la consulta aquí..." class="flex-1 bg-transparent border-none px-4 py-3 text-sm focus:outline-none dark:text-white placeholder-gray-400 font-medium">
                           <button (click)="sendReply()" [disabled]="!replyText.trim()" class="bg-gradient-to-tr from-[#f06427] to-orange-400 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale text-white w-14 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-orange-500/30 group">
                              <i class="bi bi-send-fill text-lg group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                           </button>
                        </div>
                     </div>
                 } @else {
                     <div class="p-6 bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-md text-center flex flex-col items-center justify-center gap-2 border-t border-gray-200 dark:border-gray-700 relative z-10">
                        <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                             <i class="bi bi-lock-fill"></i>
                        </div>
                        <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Esta consulta ha sido cerrada y archivada permanentemente.</p>
                     </div>
                 }
             } @else if (isCreating()) {
                 <!-- Create New Ticket View (Modernized) -->
                 <div class="p-10 flex flex-col h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl animate-scaleUp relative z-10 overflow-y-auto custom-scrollbar">
                     <div class="flex items-center gap-4 mb-8">
                         <div class="w-14 h-14 rounded-[1.5rem] bg-gradient-to-tr from-uah-orange to-amber-400 flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                             <i class="bi bi-plus-circle-fill text-2xl"></i>
                         </div>
                         <div>
                             <h3 class="text-2xl font-black text-gray-800 dark:text-white tracking-tighter uppercase">Nueva Consulta Directa</h3>
                             <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Genera un nuevo ticket de atención institucional</p>
                         </div>
                     </div>
                     
                     <div class="space-y-6 flex-1">
                         <div class="group">
                            <label for="ticketSubject" class="text-[10px] font-black text-uah-blue dark:text-blue-400 uppercase mb-2 ml-1 block tracking-widest">Asunto Principal</label>
                            <input id="ticketSubject" [(ngModel)]="newSubject" class="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-uah-blue/10 focus:border-uah-blue focus:outline-none dark:text-white transition-all shadow-inner" placeholder="Ej: Falla en equipo de Laboratorio 3...">
                         </div>
                         <div>
                            <label for="ticketMessage" class="text-[10px] font-black text-uah-blue dark:text-blue-400 uppercase mb-2 ml-1 block tracking-widest">Detalle de la Consulta</label>
                            <textarea id="ticketMessage" [(ngModel)]="newMessage" rows="6" class="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-uah-blue/10 focus:border-uah-blue focus:outline-none dark:text-white resize-none transition-all shadow-inner" placeholder="Explica tu situación con el mayor detalle posible..."></textarea>
                         </div>
                     </div>
                     
                     <div class="flex gap-4 mt-10">
                         <button (click)="submitTicket()" class="flex-1 h-14 bg-gradient-to-tr from-[#f06427] to-orange-400 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-orange-500/30 uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                             <i class="bi bi-check-circle-fill"></i> Crear Ticket de Atención
                         </button>
                         <button (click)="cancelCreate()" class="px-8 h-14 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all uppercase text-[10px] tracking-widest">Descartar</button>
                     </div>
                 </div>
             } @else {
                 <!-- Empty State (Refined) -->
                 <div class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-12 text-center relative z-10 animate-fadeIn">
                     <div class="relative mb-8">
                         <div class="w-40 h-40 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner scale-110">
                            <i class="bi bi-chat-right-dots text-7xl opacity-20 text-uah-blue dark:text-blue-400"></i>
                         </div>
                         <div class="absolute -top-2 -right-2 w-12 h-12 bg-[#f06427] rounded-full flex items-center justify-center text-white text-xl animate-bounce shadow-lg shadow-orange-500/20">
                             <i class="bi bi-patch-question"></i>
                         </div>
                     </div>
                     <h4 class="text-2xl font-black text-uah-blue dark:text-blue-300 mb-3 uppercase tracking-tighter">Buzón de Consultas</h4>
                     <p class="text-xs text-gray-500 dark:text-gray-400 max-w-xs font-semibold leading-relaxed uppercase tracking-tight">Selecciona una conversación del panel izquierdo para gestionar tu atención o crea una nueva consulta para asistencia técnica inmediata.</p>
                 </div>
             }
         </div>
      </div>
    }
    </div>
  `
})
export class SupportComponent {
    data = inject(DataService);

    currentUser = computed(() => this.data.currentUser());
    isAdmin = computed(() => {
        const rol = this.data.currentUser()?.rol || '';
        return rol === 'Admin_Labs' || rol === 'Admin_Acade' || rol === 'SuperUser';
    });

    myTickets = computed(() => {
        const user = this.data.currentUser();
        if (!user) return [];
        if (this.isAdmin()) {
            return [...this.data.supportTickets()].sort((a, b) => b.id - a.id);
        }
        return this.data.supportTickets().filter(t => t.userId === user.id).sort((a,b) => b.id - a.id);
    });

    viewMode = signal<'list' | 'kanban'>('list');

    ticketsByStatus = computed(() => {
        const t = this.myTickets();
        const mapTicket = (tk: SupportTicket) => ({
            ...tk,
            lastMessage: tk.messages[tk.messages.length - 1]?.text || 'Sin mensajes'
        });
        return {
            open: t.filter(x => x.status === 'Open').map(mapTicket),
            inProgress: t.filter(x => x.status === 'In Progress').map(mapTicket),
            closed: t.filter(x => x.status === 'Closed').map(mapTicket)
        };
    });

    selectedTicketId = signal<number | null>(null);
    selectedTicket = computed(() => {
        const id = this.selectedTicketId();
        if (!id) return null;
        return this.data.supportTickets().find(t => t.id === id) || null;
    });

    isCreating = signal(false);

    replyText = '';
    newSubject = '';
    newMessage = '';

    constructor() {
        effect(() => {
            if (this.selectedTicket()) {
                this.scrollToBottom();
            }
        });
    }

    selectTicket(t: SupportTicket) {
        this.selectedTicketId.set(t.id);
        this.isCreating.set(false);
        this.scrollToBottom();
    }

    createNew() {
        this.selectedTicketId.set(null);
        this.isCreating.set(true);
        this.newSubject = '';
        this.newMessage = '';
    }

    cancelCreate() {
        this.isCreating.set(false);
    }

    submitTicket() {
        if (!this.newSubject || !this.newMessage) return;
        this.data.createTicket(this.newSubject, this.newMessage);
        this.isCreating.set(false);
    }

    sendReply() {
        const t = this.selectedTicket();
        if (!t || !this.replyText.trim()) return;
        this.data.replyTicket(t.id, this.replyText);
        this.replyText = '';
        this.scrollToBottom();
    }

    toggleViewMode() {
        this.viewMode.update(v => v === 'list' ? 'kanban' : 'list');
    }

    moveToInProgress(t: any) {
        this.data.updateTicketStatus(t.id, 'In Progress');
    }

    moveToOpen(t: any) {
        this.data.updateTicketStatus(t.id, 'Open');
    }

    moveToClosed(t: SupportTicket) {
        this.data.closeTicket(t.id);
    }

    closeTicket() {
        const t = this.selectedTicket();
        if (t) {
            Swal.fire({
                title: '<h3 class="text-uah-blue font-black uppercase tracking-tighter">¿Cerrar Consulta?</h3>',
                text: 'Esta acción marcará el ticket como finalizado y pasará al historial.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#aaa',
                confirmButtonText: 'Sí, cerrar',
                cancelButtonText: 'Mantener Abierta'
            }).then((result: any) => {
                if (result.isConfirmed) {
                    this.data.closeTicket(t.id);
                }
            });
        }
    }

    deleteTicket() {
        const t = this.selectedTicket();
        if (t) {
            Swal.fire({
                title: '<h3 class="text-uah-blue font-black uppercase tracking-tighter">¿Eliminar Ticket?</h3>',
                text: 'Se borrará definitivamente este ticket y todos sus mensajes. Esta acción no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#003366',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result: any) => {
                if (result.isConfirmed) {
                    this.data.deleteTicket(t.id);
                    this.selectedTicketId.set(null);
                }
            });
        }
    }

    isMe(senderName: string) {
        return senderName === this.currentUser()?.nombreCompleto;
    }

    scrollToBottom() {
        setTimeout(() => {
            const el = document.querySelector('.overflow-y-auto.p-4.space-y-4'); // Dirty selector, but works for scoped component
            if (el) el.scrollTop = el.scrollHeight;
        }, 100);
    }
}
