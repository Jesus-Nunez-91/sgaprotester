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
         <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col h-[600px] overflow-hidden relative">
             @if (selectedTicket()) {
                 <!-- Chat Header -->
                 <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <div>
                         <h3 class="font-black text-uah-blue dark:text-blue-400 uppercase tracking-tighter">{{ selectedTicket()?.subject }}</h3>
                         <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ticket #{{ selectedTicket()?.id }} • {{ selectedTicket()?.status === 'Open' ? 'Abierto' : selectedTicket()?.status === 'In Progress' ? 'En Curso' : 'Finalizado' }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        @if (isAdmin()) {
                            <button (click)="deleteTicket()" class="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1">
                               <i class="bi bi-trash"></i> Eliminar
                            </button>
                        }
                        @if (selectedTicket()?.status !== 'Closed') {
                             @if (selectedTicket()?.status === 'Open' && isAdmin()) {
                                 <button (click)="moveToInProgress(selectedTicket()!)" class="text-xs bg-uah-orange hover:bg-orange-600 text-white font-black px-3 py-1.5 rounded-lg shadow-lg shadow-orange-500/10 transition-all flex items-center gap-1 uppercase tracking-widest scale-90">
                                     <i class="bi bi-play-fill text-lg"></i> Atender
                                 </button>
                             }
                             <button (click)="closeTicket()" class="text-xs text-amber-500 hover:text-amber-700 font-bold px-3 py-1 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                                Cerrar Consulta
                             </button>
                        }
                    </div>
                 </div>

                 <!-- Messages -->
                 <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50" #chatContainer>
                     @for (msg of selectedTicket()?.messages; track $index) {
                        @if (msg.sender === 'Sistema') {
                            <!-- Log de Sistema -->
                            <div class="flex justify-center my-2">
                                <span class="bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 uppercase tracking-wider">
                                    {{ msg.text.replace('[SISTEMA]: ', '') }}
                                </span>
                            </div>
                        } @else {
                            <div [class]="isMe(msg.sender) ? 'ml-auto items-end' : 'mr-auto items-start'" class="flex flex-col max-w-[80%]">
                                <div [class]="isMe(msg.sender) ? 'bg-uah-blue text-white rounded-l-2xl rounded-tr-2xl' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-r-2xl rounded-tl-2xl'" 
                                     class="p-3 shadow-sm text-sm relative group transition-all hover:shadow-md">
                                     <p>{{ msg.text }}</p>
                                     <span class="text-[9px] opacity-60 mt-1 block text-right">
                                         {{ msg.timestamp | date:'HH:mm' }} Ã¢â‚¬Â¢ <span class="uppercase font-bold">{{ msg.senderRole }}</span>
                                     </span>
                                </div>
                                @if (!isMe(msg.sender)) {
                                    <span class="text-[10px] text-gray-400 ml-1 mt-1 font-medium">{{ msg.sender }}</span>
                                }
                            </div>
                        }
                     }
                 </div>

                 <!-- Input -->
                 @if (selectedTicket()?.status === 'Open') {
                     <div class="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                        <div class="flex gap-2">
                           <input [(ngModel)]="replyText" (keyup.enter)="sendReply()" placeholder="Escribe tu mensaje..." class="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-uah-blue focus:outline-none dark:text-white transition-all">
                           <button (click)="sendReply()" [disabled]="!replyText.trim()" class="bg-uah-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-12 rounded-xl flex items-center justify-center transition-colors">
                              <i class="bi bi-send-fill"></i>
                           </button>
                        </div>
                     </div>
                 } @else {
                     <div class="p-4 bg-gray-100 dark:bg-gray-900 text-center text-sm text-gray-500 dark:text-gray-400">
                        Esta consulta ha sido cerrada.
                     </div>
                 }
             } @else if (isCreating()) {
                 <!-- Create New Ticket View -->
                 <div class="p-8 flex flex-col h-full bg-white dark:bg-gray-800">
                     <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-6">Nueva Consulta</h3>
                     <div class="space-y-4 flex-1">
                         <div>
                            <label for="ticketSubject" class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Asunto</label>
                            <input id="ticketSubject" [(ngModel)]="newSubject" class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-uah-blue focus:outline-none dark:text-white" placeholder="Ej: Problema con reserva...">
                         </div>
                         <div>
                            <label for="ticketMessage" class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Mensaje</label>
                            <textarea id="ticketMessage" [(ngModel)]="newMessage" rows="6" class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-uah-blue focus:outline-none dark:text-white resize-none" placeholder="Describe tu consulta en detalle..."></textarea>
                         </div>
                     </div>
                     <div class="flex gap-3 mt-4">
                         <button (click)="submitTicket()" class="flex-1 bg-uah-orange text-white font-black py-4 rounded-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 uppercase text-xs tracking-widest">Enviar Consulta</button>
                         <button (click)="cancelCreate()" class="px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors uppercase text-[10px]">Cancelar</button>
                     </div>
                 </div>
             } @else {
                 <!-- Empty State -->
                 <div class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-8 text-center">
                     <div class="w-32 h-32 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
                        <i class="bi bi-chat-square-quote-fill text-6xl opacity-20"></i>
                     </div>
                     <h4 class="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">Selecciona una consulta</h4>
                     <p class="text-sm max-w-xs">Haz clic en una consulta de la lista para ver los detalles o crea una nueva si tienes dudas.</p>
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
    isAdmin = computed(() => ['Admin', 'SuperUser'].includes(this.data.currentUser()?.rol || ''));

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
                title: 'Ã‚Â¿Cerrar Consulta?',
                text: 'Esta acciÃƒÂ³n marcarÃƒÂ¡ el ticket como finalizado.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#aaa',
                confirmButtonText: 'SÃƒÂ­, cerrar',
                cancelButtonText: 'Cancelar'
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
                title: 'Ã‚Â¿ELIMINAR TICKET?',
                text: 'Se borrarÃƒÂ¡ definitivamente este ticket y todos sus mensajes. Ã‚Â¡ESTA ACCIÃƒâ€œN NO SE PUEDE DESHACER!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'SÃƒÂ, ELIMINAR',
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
