import { Component, inject, computed, signal, effect, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
    <div class="max-w-6xl mx-auto py-8 animate-fadeIn pb-20">
      <!-- Header Institucional -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/80 dark:bg-gray-800/80 p-6 rounded-3xl shadow-xl border border-white/50 dark:border-gray-700 backdrop-blur-md transition-all">
          <div class="flex items-center gap-5">
              <div class="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-uah-blue to-blue-800 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 transform hover:rotate-12 transition-transform duration-500">
                  <i class="bi bi-chat-heart-fill text-3xl"></i>
              </div>
              <div>
                  <h2 class="text-3xl font-black text-uah-blue dark:text-blue-400 tracking-tighter uppercase leading-tight">Canal de Soporte</h2>
                  <p class="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                       <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistema de Atención en Tiempo Real
                  </p>
              </div>
          </div>
          <div class="flex gap-3 mt-6 md:mt-0">
            @if (isAdmin()) {
                <button (click)="toggleViewMode()" 
                        class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-uah-blue dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-600 px-5 py-2.5 rounded-2xl font-black text-xs shadow-sm transition-all flex items-center gap-2 uppercase tracking-widest">
                    <i [class]="viewMode() === 'list' ? 'bi bi-kanban' : 'bi bi-list-stars'"></i>
                    {{ viewMode() === 'list' ? 'Tablero' : 'Lista' }}
                </button>
            }
            <a routerLink="/areas" class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-2xl font-black text-xs shadow-sm transition-all flex items-center gap-2 uppercase tracking-widest">
                <i class="bi bi-house-door-fill"></i> Salir
            </a>
          </div>
      </div>

      <!-- Vista Kanban (Administrativa) -->
      @if (viewMode() === 'kanban' && isAdmin()) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn min-h-[700px]">
              <!-- Columna: Abiertas -->
              <div class="flex flex-col bg-gray-100/50 dark:bg-gray-900/50 rounded-[2.5rem] p-5 border border-gray-100 dark:border-gray-800 shadow-inner">
                  <div class="flex justify-between items-center mb-6 px-3">
                      <h3 class="font-black text-[11px] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-uah-blue shadow-[0_0_12px_rgba(0,51,102,0.5)]"></span> Por Atender
                      </h3>
                      <span class="bg-uah-blue text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-lg shadow-blue-500/20">{{ ticketsByStatus().open.length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                      @for (t of ticketsByStatus().open; track t.id) {
                          <div (click)="selectTicket(t)" class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-uah-blue/30 cursor-pointer transition-all group animate-slideIn">
                              <h4 class="font-black text-gray-800 dark:text-gray-100 mb-2 leading-tight">{{ t.subject }}</h4>
                              <p class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 italic font-medium">"{{ t.lastMessage }}"</p>
                              <div class="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-700/50">
                                  <div class="flex items-center gap-2">
                                      <div class="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[9px] font-black text-uah-blue">{{ t.userName.charAt(0) }}</div>
                                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{{ t.userName }}</span>
                                  </div>
                                  <button (click)="$event.stopPropagation(); moveToInProgress(t)" class="text-uah-orange font-black uppercase text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 hover:translate-x-1">Atender <i class="bi bi-chevron-right"></i></button>
                              </div>
                          </div>
                      }
                  </div>
              </div>

              <!-- Columna: En Curso -->
              <div class="flex flex-col bg-amber-50/30 dark:bg-amber-900/10 rounded-[2.5rem] p-5 border border-amber-100/50 dark:border-amber-800/20 shadow-inner">
                  <div class="flex justify-between items-center mb-6 px-3">
                      <h3 class="font-black text-[11px] text-uah-orange uppercase tracking-[0.2em] flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-uah-orange shadow-[0_0_12px_rgba(243,112,33,0.5)]"></span> En Atención
                      </h3>
                      <span class="bg-uah-orange text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-lg shadow-orange-500/20">{{ ticketsByStatus().inProgress.length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                      @for (t of ticketsByStatus().inProgress; track t.id) {
                          <div (click)="selectTicket(t)" class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-uah-orange/30 cursor-pointer transition-all group border-l-4 border-amber-400 animate-slideIn">
                              <h4 class="font-black text-gray-800 dark:text-gray-100 mb-2 leading-tight">{{ t.subject }}</h4>
                              <p class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 italic font-medium">"{{ t.lastMessage }}"</p>
                              <div class="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-700/50">
                                   <div class="flex items-center gap-2">
                                      <div class="w-5 h-5 rounded-md bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-[9px] font-black text-uah-orange">{{ t.userName.charAt(0) }}</div>
                                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{{ t.userName }}</span>
                                  </div>
                                  <div class="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button (click)="$event.stopPropagation(); moveToOpen(t)" class="text-gray-400 hover:text-gray-600 transition-colors"><i class="bi bi-arrow-counterclockwise"></i></button>
                                      <button (click)="$event.stopPropagation(); moveToClosed(t)" class="text-emerald-500 font-black text-[9px] uppercase tracking-widest hover:scale-110 transition-transform">Finalizar</button>
                                  </div>
                              </div>
                          </div>
                      }
                  </div>
              </div>

              <!-- Columna: Archivados -->
              <div class="flex flex-col bg-gray-100/30 dark:bg-gray-900/30 rounded-[2.5rem] p-5 border border-gray-100 dark:border-gray-800 opacity-80 shadow-inner">
                  <div class="flex justify-between items-center mb-6 px-3">
                      <h3 class="font-black text-[11px] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <span class="w-3 h-3 rounded-full bg-gray-400 shadow-[0_0_12px_rgba(156,163,175,0.5)]"></span> Historial
                      </h3>
                      <span class="bg-gray-200 dark:bg-gray-700 text-gray-500 text-[10px] font-black px-3 py-1 rounded-xl shadow-lg">{{ ticketsByStatus().closed.length }}</span>
                  </div>
                  <div class="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 grayscale hover:grayscale-0 transition-all duration-500">
                      @for (t of ticketsByStatus().closed; track t.id) {
                          <div (click)="selectTicket(t)" class="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-50 dark:border-gray-700/50 cursor-pointer hover:bg-white transition-all">
                              <h4 class="font-bold text-xs text-gray-400 line-through mb-1 truncate">{{ t.subject }}</h4>
                              <div class="flex justify-between items-center">
                                  <span class="text-[8px] font-black text-gray-300 uppercase tracking-widest">{{ t.lastUpdate | date:'shortDate' }}</span>
                                  <i class="bi bi-archive text-gray-200"></i>
                              </div>
                          </div>
                      }
                  </div>
              </div>
          </div>
      } @else {
          <!-- Vista Estándar (Conversaciones) -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[750px] animate-fadeIn">
          
          <!-- Panel Izquierdo: Lista de Tickets -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/40 dark:border-gray-700/50 group">
              <div class="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center relative">
                 <div class="flex flex-col">
                    <h3 class="font-black text-uah-blue dark:text-blue-400 uppercase tracking-tighter text-lg leading-none">Buzón Digital</h3>
                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 ml-0.5">{{ myTickets().length }} Conversaciones</span>
                 </div>
                 <button (click)="createNew()" class="bg-uah-orange text-white w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-orange-600 hover:rotate-90 transition-all duration-300 shadow-xl shadow-orange-500/20 active:scale-90" title="Nueva Consulta">
                    <i class="bi bi-plus-lg text-lg"></i>
                 </button>
              </div>
              
              <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                 @for (ticket of myTickets(); track ticket.id) {
                    <div (click)="selectTicket(ticket)" 
                         (keydown.enter)="selectTicket(ticket)"
                         (keydown.space)="selectTicket(ticket)"
                         tabindex="0"
                         role="button"
                         [class]="selectedTicket()?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/30 border-uah-blue scale-[1.02] shadow-lg' : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/50 border-transparent'"
                         class="p-5 rounded-2xl border-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-uah-blue relative overflow-hidden animate-slideIn">
                       
                       <div class="flex justify-between items-start mb-2 relative z-10">
                          <span class="font-black text-sm text-gray-800 dark:text-gray-100 truncate pr-4 leading-tight uppercase tracking-tight">{{ ticket.subject }}</span>
                          @if (ticket.status === 'Open') {
                              <span class="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] mt-1"></span>
                          } @else if (ticket.status === 'In Progress') {
                               <span class="flex-shrink-0 w-2 h-2 rounded-full bg-uah-orange shadow-[0_0_8px_rgba(243,112,33,0.5)] mt-1"></span>
                          } @else {
                              <span class="flex-shrink-0 w-2 h-2 rounded-full bg-gray-300 mt-1"></span>
                          }
                       </div>
                       
                       <p class="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 italic font-medium leading-relaxed relative z-10">"{{ ticket.messages[ticket.messages.length - 1].text }}"</p>
                       
                       <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/40 relative z-10">
                          <div class="flex items-center gap-1.5">
                              <i class="bi bi-clock-history text-[10px] text-gray-300"></i>
                              <span class="text-[10px] font-bold text-gray-400">{{ ticket.lastUpdate | date:'HH:mm' }}</span>
                          </div>
                          @if (isAdmin() && ticket.userId !== currentUser()?.id) {
                              <span class="text-[9px] font-black text-uah-blue dark:text-blue-400 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 uppercase tracking-tighter">
                                 {{ ticket.userName }}
                              </span>
                          }
                       </div>
                    </div>
                 }
                 @if (myTickets().length === 0) {
                    <div class="p-12 text-center text-gray-300 flex flex-col items-center justify-center h-full">
                       <i class="bi bi-chat-dots-fill text-6xl mb-4 opacity-10"></i>
                       <p class="text-[11px] font-black uppercase tracking-widest max-w-[150px]">No hay diálogos institucionales iniciados.</p>
                    </div>
                 }
              </div>
          </div>

          <!-- Panel Central/Derecho: Área de Chat Inteligente -->
          <div class="lg:col-span-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-3xl rounded-[3rem] shadow-2xl border-4 border-white/80 dark:border-gray-700/50 flex flex-col h-full overflow-hidden relative group">
              <!-- Glass Glow Effects -->
              <div class="absolute -top-40 -right-40 w-80 h-80 bg-uah-blue/5 rounded-full blur-[100px] pointer-events-none"></div>
              <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-uah-orange/5 rounded-full blur-[100px] pointer-events-none"></div>

              @if (selectedTicket()) {
                  <!-- Chat Header Premium -->
                  <div class="p-6 border-b border-gray-100/50 dark:border-gray-700/50 flex justify-between items-center bg-white/20 dark:bg-gray-900/20 relative z-10">
                     <div class="flex items-center gap-5">
                         <div class="relative">
                            <div class="w-14 h-14 rounded-2xl bg-uah-blue flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 transform -rotate-6">
                                <i class="bi bi-patch-check-fill text-2xl"></i>
                            </div>
                            <span class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white dark:border-gray-800 shadow-sm"></span>
                         </div>
                         <div>
                              <h3 class="font-black text-uah-blue dark:text-blue-400 uppercase tracking-tighter text-xl leading-none mb-1">{{ selectedTicket()?.subject }}</h3>
                              <div class="flex items-center gap-3">
                                  <span class="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">FOLIO #{{ selectedTicket()?.id }}</span>
                                  <div class="flex items-center gap-2">
                                      <span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                      @if (selectedTicket()?.status === 'Open') {
                                          <span class="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 px-3 py-0.5 rounded-full">Abierto para atención</span>
                                      } @else if (selectedTicket()?.status === 'In Progress') {
                                           <span class="text-[9px] font-black text-uah-orange uppercase tracking-widest bg-orange-50 dark:bg-orange-900/30 px-3 py-0.5 rounded-full animate-pulse">Atención Directa</span>
                                      } @else {
                                          <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-3 py-0.5 rounded-full italic">Caso resuelto</span>
                                      }
                                  </div>
                              </div>
                         </div>
                     </div>
                     <div class="flex items-center gap-3">
                        @if (isAdmin()) {
                            <button (click)="deleteTicket()" class="h-12 w-12 rounded-2xl bg-white dark:bg-gray-800 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-500 border border-red-100 dark:border-red-900/30 flex items-center justify-center shadow-lg hover:shadow-red-500/20 group" title="Eliminar definitivamente">
                               <i class="bi bi-trash3-fill group-hover:scale-125 transition-transform"></i>
                            </button>
                        }
                        @if (selectedTicket()?.status !== 'Closed') {
                             @if (selectedTicket()?.status === 'Open' && isAdmin()) {
                                 <button (click)="moveToInProgress(selectedTicket()!)" class="h-12 px-6 bg-uah-orange hover:bg-orange-600 text-white font-black rounded-2xl shadow-2xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 uppercase text-[10px] tracking-widest">
                                     <i class="bi bi-lightning-charge-fill text-lg"></i> Iniciar
                                 </button>
                             }
                             <button (click)="closeTicket()" class="h-12 px-6 bg-white dark:bg-gray-800 text-uah-blue dark:text-blue-300 hover:bg-uah-blue hover:text-white font-black rounded-2xl border-2 border-blue-50 dark:border-blue-900/30 transition-all shadow-lg text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95">
                                Finalizar
                             </button>
                        }
                     </div>
                  </div>

                  <!-- Contenedor de Mensajes (Scroll Automático Optimizado) -->
                  <div class="flex-1 overflow-y-auto p-8 space-y-8 relative z-10 custom-scrollbar scroll-smooth" #chatContainer>
                      @for (msg of selectedTicket()?.messages; track $index) {
                         @if (msg.sender === 'Sistema') {
                             <div class="flex justify-center my-6">
                                 <div class="bg-gray-100/40 dark:bg-gray-700/20 backdrop-blur-xl text-gray-400 dark:text-gray-500 text-[10px] font-black px-6 py-2 rounded-full border border-gray-100/50 dark:border-gray-600/30 uppercase tracking-[0.3em] shadow-sm transform hover:scale-105 transition-transform">
                                     {{ msg.text.replace('[SISTEMA]: ', '') }}
                                 </div>
                             </div>
                         } @else {
                             <div [class]="isMe(msg.sender) ? 'ml-auto items-end' : 'mr-auto items-start'" class="flex flex-col max-w-[85%] animate-slideUp">
                                 <div class="flex items-center gap-3 mb-2" [class.flex-row-reverse]="isMe(msg.sender)">
                                     <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[12px] font-black text-uah-blue dark:text-white border-2 border-white dark:border-gray-500 shadow-xl shadow-gray-400/10">
                                         {{ msg.sender.charAt(0) }}
                                     </div>
                                     <div class="flex flex-col" [class.items-end]="isMe(msg.sender)">
                                         <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">{{ isMe(msg.sender) ? 'SGA Tú' : msg.sender }}</span>
                                         <span class="text-[9px] text-gray-300 font-bold tracking-tighter">{{ msg.timestamp | date:'HH:mm' }}</span>
                                     </div>
                                 </div>

                                 <div [class]="isMe(msg.sender) ? 'bg-[#f06427] text-white rounded-[2rem] rounded-tr-none shadow-2xl shadow-orange-500/10' : 'bg-white/80 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100 border-2 border-white dark:border-gray-600/50 rounded-[2rem] rounded-tl-none shadow-2xl shadow-blue-500/5'" 
                                      class="p-6 backdrop-blur-xl relative transition-all hover:scale-[1.01] duration-500 group/msg">
                                      <p class="text-sm font-medium leading-relaxed tracking-tight selection:bg-uah-blue selection:text-white">{{ msg.text }}</p>
                                      
                                      <div class="absolute -bottom-2 -right-3 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                          <span class="text-[9px] font-black text-uah-blue/20 uppercase tracking-widest">{{ msg.senderRole }}</span>
                                      </div>
                                 </div>
                             </div>
                         }
                      }
                      
                      <!-- Indicador de "Atención en línea" -->
                      @if (selectedTicket()?.status === 'In Progress') {
                         <div class="mr-auto flex items-center gap-2 opacity-30 animate-pulse ml-2">
                             <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Personal en línea</span>
                             <div class="flex gap-1">
                                 <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                                 <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                                 <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
                             </div>
                         </div>
                      }
                  </div>

                  <!-- Barra de Entrada de Datos -->
                  @if (selectedTicket()?.status !== 'Closed') {
                      <div class="p-8 bg-gray-50/30 dark:bg-gray-900/30 backdrop-blur-2xl border-t border-gray-100/50 dark:border-gray-700/50 relative z-10 transition-all">
                         <div class="flex gap-4 bg-white dark:bg-gray-950 p-2 rounded-[2rem] shadow-2xl border-2 border-gray-100 dark:border-gray-800 transition-all focus-within:ring-4 focus-within:ring-uah-blue/20 focus-within:border-uah-blue/50">
                            <input [(ngModel)]="replyText" 
                                   (keyup.enter)="sendReply()" 
                                   placeholder="Escribe tu mensaje institucional..." 
                                   class="flex-1 bg-transparent border-none px-6 py-4 text-sm focus:outline-none dark:text-white placeholder-gray-400 font-bold">
                            
                            <button (click)="sendReply()" 
                                    [disabled]="!replyText.trim()" 
                                    class="bg-gradient-to-tr from-[#f06427] to-orange-400 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale text-white px-8 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl shadow-orange-500/30 group relative overflow-hidden">
                               <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                               <i class="bi bi-send-fill text-xl relative z-10 group-hover:rotate-12 transition-transform"></i>
                            </button>
                         </div>
                      </div>
                  } @else {
                      <div class="p-10 bg-gray-100/20 dark:bg-gray-900/40 backdrop-blur-3xl text-center flex flex-col items-center justify-center gap-4 border-t-2 border-gray-100 dark:border-gray-700/50 relative z-10">
                         <div class="w-16 h-16 rounded-[2rem] bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600 shadow-inner">
                              <i class="bi bi-shield-lock-fill text-3xl"></i>
                         </div>
                         <div class="flex flex-col gap-1">
                            <h5 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Protocolo Terminado</h5>
                            <p class="text-[10px] text-gray-400 font-medium italic">Diálogo sellado por el departamento técnico.</p>
                         </div>
                      </div>
                  }
              } @else if (isCreating()) {
                  <!-- Crear Nueva Consulta -->
                  <div class="p-12 flex flex-col h-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-3xl animate-scaleUp relative z-10 overflow-y-auto custom-scrollbar">
                      <div class="flex items-center gap-6 mb-12">
                          <div class="w-18 h-18 rounded-[2rem] bg-gradient-to-tr from-[#f06427] to-orange-400 flex items-center justify-center text-white shadow-2xl shadow-orange-500/30 ring-8 ring-orange-500/10">
                              <i class="bi bi-plus-circle-fill text-4xl"></i>
                          </div>
                          <div>
                              <h3 class="text-3xl font-black text-gray-800 dark:text-white tracking-tighter uppercase leading-none">Nueva Consulta Directa</h3>
                              <p class="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-3 bg-gray-100/50 dark:bg-gray-900/50 px-4 py-1.5 rounded-full w-fit">Ticket de Asistencia Técnica</p>
                          </div>
                      </div>
                      
                      <div class="grid grid-cols-1 gap-8 flex-1">
                          <div class="group/field">
                             <label for="ticketSubject" class="text-[10px] font-black text-uah-blue dark:text-blue-400 uppercase mb-3 ml-2 block tracking-[0.2em] group-focus-within/field:translate-x-2 transition-transform">Asunto Institucional</label>
                             <div class="relative">
                                <i class="bi bi-tag absolute left-5 top-5 text-gray-400 text-xl"></i>
                                <input id="ticketSubject" [(ngModel)]="newSubject" class="w-full bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] pl-16 pr-8 py-5 focus:ring-8 focus:ring-uah-blue/5 focus:border-uah-blue focus:outline-none dark:text-white transition-all shadow-2xl text-lg font-black tracking-tight placeholder-gray-300" placeholder="¿Cuál es el motivo?">
                             </div>
                          </div>
                          <div class="group/field flex-1 flex flex-col">
                             <label for="ticketMessage" class="text-[10px] font-black text-uah-blue dark:text-blue-400 uppercase mb-3 ml-2 block tracking-[0.2em] group-focus-within/field:translate-x-2 transition-transform">Detalle de la Consulta</label>
                             <div class="relative flex-1">
                                <i class="bi bi-text-left absolute left-5 top-5 text-gray-400 text-xl"></i>
                                <textarea id="ticketMessage" [(ngModel)]="newMessage" class="w-full h-full bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-[2.5rem] pl-16 pr-8 py-6 focus:ring-8 focus:ring-uah-blue/5 focus:border-uah-blue focus:outline-none dark:text-white resize-none transition-all shadow-2xl font-bold p-8 leading-relaxed placeholder-gray-300" placeholder="Describe tu situación técnica con precisión..."></textarea>
                             </div>
                          </div>
                      </div>
                      
                      <div class="flex gap-6 mt-12 bg-white/40 dark:bg-gray-900/20 p-4 rounded-[2.5rem] border-2 border-white dark:border-gray-800 shadow-xl">
                          <button (click)="submitTicket()" class="flex-1 h-16 bg-gradient-to-tr from-uah-blue to-blue-800 text-white font-black rounded-[1.5rem] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-blue-500/40 uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 group">
                              <i class="bi bi-shield-fill-check text-2xl group-hover:rotate-12 transition-transform"></i> Enviar Consulta Oficial
                          </button>
                          <button (click)="cancelCreate()" class="px-10 h-16 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-300 font-black rounded-[1.5rem] hover:bg-gray-50 dark:hover:bg-gray-600 transition-all uppercase text-[10px] tracking-[0.2em] hover:text-red-500">Descartar</button>
                      </div>
                  </div>
              } @else {
                  <div class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-12 text-center relative z-10 animate-fadeIn">
                      <div class="relative mb-12">
                          <div class="w-56 h-56 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner scale-110 border-8 border-white/20">
                             <i class="bi bi-chat-right-text text-8xl opacity-10 text-uah-blue dark:text-blue-400"></i>
                          </div>
                      </div>
                      <h4 class="text-3xl font-black text-uah-blue dark:text-blue-300 mb-4 uppercase tracking-tighter">Buzón Digital</h4>
                      <p class="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm font-black leading-relaxed uppercase tracking-[0.2em] opacity-60">Selecciona una conversación del panel lateral o inicia un nuevo ticket para recibir asistencia institucional inmediata.</p>
                  </div>
              }
          </div>
      </div>
    }
    </div>
  `
})
export class SupportComponent implements AfterViewChecked {
    data = inject(DataService);

    @ViewChild('chatContainer') private chatContainer!: ElementRef;

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
            lastMessage: tk.messages[tk.messages.length - 1]?.text || 'Conversación iniciada'
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
            if (this.selectedTicket()?.messages.length) {
                this.scrollToBottom();
            }
        });
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    selectTicket(t: SupportTicket) {
        this.selectedTicketId.set(t.id);
        this.isCreating.set(false);
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
        if (!this.newSubject.trim() || !this.newMessage.trim()) return;
        this.data.createTicket(this.newSubject, this.newMessage);
        this.isCreating.set(false);
    }

    sendReply() {
        const t = this.selectedTicket();
        if (!t || !this.replyText.trim()) return;
        this.data.replyTicket(t.id, this.replyText);
        this.replyText = '';
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
                text: 'Esta acción archivará el ticket permanentemente.',
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
                text: 'Se borrará el historial definitivamente.',
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

    private scrollToBottom(): void {
        try {
            if (this.chatContainer) {
                this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
            }
        } catch (err) { }
    }
}
