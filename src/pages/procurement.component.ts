
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, PurchaseOrder, PurchaseStage, LabType } from '../services/data.service';

declare var Swal: any;

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fadeIn pb-12 max-w-[98%] mx-auto">
      
      <!-- Top Header Row for Budgets -->
      <div class="flex justify-between items-end mb-4 px-2">
          <div>
              <h2 class="text-2xl font-black text-uah-blue dark:text-white tracking-tighter uppercase">Gestión Presupuestaria</h2>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Estado financiero por centro de costo</p>
          </div>
          <button (click)="openBudgetEditor()" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 transition-all hover:bg-white dark:hover:bg-gray-800">
              <i class="bi bi-gear-fill"></i> Ajustar Presupuestos
          </button>
      </div>

      <!-- Top Budget Command Center -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (lab of labTypes; track lab) {
              @let allocated = getLabBudget(lab);
              @let spent = getLabSpent(lab);
              @let percent = (spent / allocated) * 100;
              
              <div class="rounded-3xl p-5 text-white shadow-xl relative overflow-hidden group transition-all hover:-translate-y-1 border border-white/10"
                   [ngClass]="getLabGradient(lab)">
                  
                  <div class="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl group-hover:scale-110 transition-transform"></div>
                  
                  <div class="relative z-10">
                      <div class="flex justify-between items-start mb-2">
                          <span class="font-bold text-xs uppercase tracking-widest bg-black/20 px-2 py-1 rounded">{{ lab }}</span>
                          <i [class]="getLabIcon(lab)" class="text-2xl text-white/80"></i>
                      </div>
                      
                      <div class="flex items-end gap-2 mb-1">
                          <div class="text-2xl font-black tracking-tight">$ {{ spent | number:'1.0-0' }}</div>
                          <div class="text-[10px] opacity-80 mb-1.5">usado</div>
                      </div>
                      
                      <div class="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mb-2">
                          <div class="h-full bg-white/90 rounded-full transition-all duration-1000 ease-out" [style.width.%]="percent"></div>
                      </div>
                      
                      <div class="flex justify-between text-[10px] font-medium opacity-80">
                          <span>Presupuesto: $ {{ allocated | number:'1.0-0' }}</span>
                          <span>{{ percent | number:'1.0-0' }}%</span>
                      </div>
                  </div>
              </div>
          }
      </div>

      <!-- Action & Filter Bar -->
      <div class="flex flex-col md:flex-row gap-4 mb-6 items-center">
          <!-- Stage Navigation -->
          <div class="flex overflow-x-auto gap-2 bg-white/50 dark:bg-gray-800/50 p-1.5 rounded-2xl backdrop-blur-sm flex-1 w-full md:w-auto">
              @for (tab of tabs; track tab.id) {
                  <button (click)="currentStage.set(tab.id)" 
                           [class]="currentStage() === tab.id ? 'bg-white dark:bg-gray-700 text-uah-orange dark:text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'"
                          class="flex-1 py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs whitespace-nowrap">
                      <i [class]="tab.icon"></i>
                      <span class="hidden sm:inline">{{ tab.label }}</span>
                      @if (getCount(tab.id) > 0) {
                          <span class="bg-red-500 text-white text-[9px] px-1.5 rounded-full">{{ getCount(tab.id) }}</span>
                      }
                  </button>
              }
          </div>

          <!-- Lab Filter -->
          <div class="relative min-w-[180px]">
              <i class="bi bi-funnel-fill absolute left-3 top-2.5 text-gray-400 text-xs"></i>
               <select [ngModel]="selectedLabFilter()" (ngModelChange)="selectedLabFilter.set($event)" class="w-full pl-9 pr-8 py-2.5 rounded-xl border-none bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-uah-orange appearance-none cursor-pointer">
                  <option value="ALL">Todos los Laboratorios</option>
                  <option *ngFor="let l of labTypes" [value]="l">{{ l }}</option>
              </select>
              <i class="bi bi-chevron-down absolute right-3 top-3 text-gray-400 text-xs pointer-events-none"></i>
          </div>

          <!-- New Button -->
           <button (click)="openCreateModal()" class="bg-gradient-to-r from-uah-orange to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl px-6 py-2.5 shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-transform hover:scale-[1.02] font-black text-xs uppercase tracking-widest">
             <i class="bi bi-plus-lg"></i>
             <span>Nueva Solicitud</span>
          </button>
      </div>

      <!-- Main Content Grid -->
      <div class="glass-panel bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col relative border border-white/40 dark:border-gray-700">
          <!-- Table Header -->
          <div class="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
              <div>
                   <h3 class="font-black text-uah-blue dark:text-white text-sm uppercase tracking-widest">{{ getStageLabel() }}</h3>
                  <p class="text-xs text-gray-500">Gestión centralizada • {{ selectedLabFilter() === 'ALL' ? 'Vista Global' : selectedLabFilter() }}</p>
              </div>
              <div class="relative">
                  <i class="bi bi-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                  <input [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Buscar orden..." class="pl-8 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-xs bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 w-56">
              </div>
          </div>

          <!-- The Data Table -->
          <div class="flex-1 overflow-x-auto custom-scrollbar">
              <table class="w-full text-left text-sm whitespace-nowrap">
                  <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                      <tr>
                          <th class="p-4 pl-6">ID Solicitud</th>
                          <th class="p-4">Laboratorio</th>
                          <th class="p-4">Ítem & Detalle</th>
                          <th class="p-4 text-center">Cant.</th>
                          <th class="p-4 text-right">Monto (CLP)</th>
                          <th class="p-4">Estado / Info</th>
                          <th class="p-4 text-center sticky right-0 bg-gray-50 dark:bg-gray-800 shadow-[-5px_0_10px_rgba(0,0,0,0.05)]">Acciones</th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      @for (order of filteredOrders(); track order.internalId) {
                          <tr class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                              <td class="p-4 pl-6 font-mono text-xs text-gray-400">{{ order.id }}</td>
                              <td class="p-4">
                                  <span [class]="getLabBadgeClass(order.lab)" class="px-2 py-1 rounded-md text-[10px] font-bold border border-current/20">
                                      {{ order.lab }}
                                  </span>
                              </td>
                              <td class="p-4">
                                  <div class="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[200px]" title="{{ order.item }}">{{ order.item }}</div>
                                  <div class="text-[10px] text-gray-400 flex items-center gap-2 mt-1">
                                      <span>{{ order.fechaSolicitud }}</span>
                                      @if (order.linkReferencia && order.linkReferencia !== 'N/A') {
                                          <a [href]="order.linkReferencia" target="_blank" class="text-blue-500 hover:underline"><i class="bi bi-link-45deg"></i> Ref</a>
                                      }
                                  </div>
                              </td>
                              <td class="p-4 text-center font-bold text-gray-600 dark:text-gray-300">{{ order.cantidad }}</td>
                              <td class="p-4 text-right font-mono text-gray-700 dark:text-gray-300">
                                  $ {{ order.valorTotal | number:'1.0-0' }}
                              </td>
                              <td class="p-4">
                                  <!-- Dynamic columns based on stage -->
                                  @if (currentStage() === 'Solicitud') {
                                      <div class="text-xs text-gray-500 italic max-w-[150px] truncate">{{ order.observaciones || '---' }}</div>
                                  } 
                                  @if (currentStage() === 'Adjudicacion') {
                                      <div class="text-xs">
                                          <div class="font-bold text-emerald-600 truncate max-w-[120px]">{{ order.proveedor || 'Por asignar' }}</div>
                                          <div class="text-gray-400 text-[10px]">{{ order.rutProveedor || '-' }}</div>
                                      </div>
                                  }
                                  @if (currentStage() === 'Seguimiento') {
                                      <div class="flex gap-2">
                                          <span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold border border-indigo-100">OC: {{ order.numeroOC || 'Pendiente' }}</span>
                                      </div>
                                  }
                                  @if (currentStage() === 'Cierre') {
                                      <div class="text-xs text-gray-500">
                                          <div>Fact: {{ order.numeroFactura }}</div>
                                          <div class="text-green-600 font-bold text-[10px]">Entregado: {{ order.fechaEntrega }}</div>
                                      </div>
                                  }
                              </td>
                              <td class="p-4 text-center sticky right-0 bg-white dark:bg-gray-900 group-hover:bg-blue-50/50 dark:group-hover:bg-gray-800 transition-colors shadow-[-5px_0_10px_rgba(0,0,0,0.05)]">
                                  <div class="flex justify-center gap-2">
                                      <!-- Action Logic -->
                                      @if (currentStage() === 'Solicitud') {
                                           <button (click)="promoteToAdjudication(order)" class="bg-emerald-50 text-emerald-600 border border-emerald-100 w-8 h-8 rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center font-bold" title="Adjudicar">
                                              <i class="bi bi-check-lg"></i>
                                          </button>
                                      }
                                      @if (currentStage() === 'Adjudicacion') {
                                          <button (click)="promoteToTracking(order)" class="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center" title="Generar OC">
                                              <i class="bi bi-file-earmark-text"></i>
                                          </button>
                                      }
                                      @if (currentStage() === 'Seguimiento') {
                                          <button (click)="promoteToClosing(order)" class="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center" title="Recepcionar">
                                              <i class="bi bi-box-seam"></i>
                                          </button>
                                      }
                                      
                                      <button (click)="editOrder(order)" class="bg-gray-100 text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors" title="Editar">
                                          <i class="bi bi-pencil-square"></i>
                                      </button>
                                      
                                      @if (currentStage() === 'Solicitud') {
                                          <button (click)="deleteOrder(order)" class="bg-red-50 text-red-500 w-8 h-8 rounded-lg hover:bg-red-100 transition-colors" title="Eliminar">
                                              <i class="bi bi-trash"></i>
                                          </button>
                                      }
                                  </div>
                              </td>
                          </tr>
                      }
                      @if (filteredOrders().length === 0) {
                          <tr>
                              <td colspan="7" class="p-12 text-center text-gray-400">
                                  <i class="bi bi-inbox text-4xl mb-2 block opacity-30"></i>
                                  No hay órdenes en esta vista.
                              </td>
                          </tr>
                      }
                  </tbody>
              </table>
          </div>
      </div>

      <!-- Budget Editing Modal -->
      @if (showBudgetModal()) {
          <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div class="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                   <div class="p-6 bg-uah-blue text-white">
                      <h3 class="font-bold text-lg">Configurar Presupuestos</h3>
                      <p class="text-xs opacity-80">Asignación de fondos por laboratorio</p>
                  </div>
                  <div class="p-6 space-y-4">
                      @for (lab of labTypes; track lab) {
                          <div>
                              <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">{{ lab }}</label>
                              <div class="relative">
                                  <span class="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                                   <input type="number" [(ngModel)]="editingBudgets[lab]" class="w-full pl-7 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-uah-orange text-sm font-bold">
                              </div>
                          </div>
                      }
                  </div>
                  <div class="p-6 bg-gray-50 dark:bg-gray-900 flex gap-3">
                       <button (click)="saveBudgets()" class="flex-1 bg-uah-orange text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors uppercase text-xs tracking-widest">Guardar Cambios</button>
                      <button (click)="showBudgetModal.set(false)" class="px-6 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancelar</button>
                  </div>
              </div>
          </div>
      }

      <!-- Edit/Action Modal -->
      @if (showModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div class="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div class="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 class="font-bold text-lg dark:text-white">{{ isEditing ? 'Editar Orden' : 'Nueva Solicitud' }}</h3>
                      <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="bi bi-x-lg"></i></button>
                  </div>
                  
                  <div class="p-8 overflow-y-auto space-y-6 flex-1">
                      
                      <!-- Phase 1: Solicitud (Always visible / Editable if new) -->
                      <div class="space-y-4">
                          <h4 class="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                              <i class="bi bi-clipboard-plus"></i> Detalles de Solicitud
                          </h4>
                          
                          <div class="grid grid-cols-2 gap-4">
                              <div>
                                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Número de Solicitud</label>
                                  <input [(ngModel)]="currentOrder.id" [disabled]="isEditing" class="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500" placeholder="Ej: 7905102">
                              </div>
                              <div>
                                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Laboratorio</label>
                                  <select [(ngModel)]="currentOrder.lab" [disabled]="isEditing" class="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 font-bold">
                                      <option *ngFor="let l of labTypes" [value]="l">{{ l }}</option>
                                  </select>
                              </div>
                          </div>

                          <div>
                              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Ítem / Descripción</label>
                              <textarea [(ngModel)]="currentOrder.item" rows="2" class="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-blue-500"></textarea>
                          </div>

                          <div class="grid grid-cols-2 gap-4">
                              <div>
                                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Link de Referencia</label>
                                  <input [(ngModel)]="currentOrder.linkReferencia" class="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 text-sm">
                              </div>
                              <div>
                                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Solicitud</label>
                                  <input type="date" [(ngModel)]="currentOrder.fechaSolicitud" class="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 text-sm">
                              </div>
                          </div>
                          
                          <div class="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                              <div>
                                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad</label>
                                  <input type="number" [(ngModel)]="currentOrder.cantidad" (input)="updateTotal()" class="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-2 text-sm text-center">
                              </div>
                              <div>
                                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Unitario (CLP)</label>
                                  <input type="number" [(ngModel)]="currentOrder.valorUnitario" (input)="updateTotal()" class="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-2 text-sm text-center">
                              </div>
                              <div>
                                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Total (CLP)</label>
                                  <div class="w-full rounded-lg bg-gray-200 dark:bg-gray-700 p-2 text-sm text-center font-bold text-gray-700 dark:text-gray-200">
                                      $ {{ currentOrder.valorTotal | number:'1.0-0' }}
                                  </div>
                              </div>
                          </div>

                          <div>
                              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Observaciones</label>
                              <textarea [(ngModel)]="currentOrder.observaciones" rows="2" class="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-blue-500"></textarea>
                          </div>
                      </div>

                      <!-- Phase 2: Adjudicacion -->
                      @if (currentStage() === 'Adjudicacion' || currentOrder.stage === 'Adjudicacion' || currentOrder.stage === 'Seguimiento' || currentOrder.stage === 'Cierre') {
                          <div class="pt-4 border-t border-gray-100 dark:border-gray-700 animate-fadeIn">
                              <h4 class="font-bold text-emerald-600 text-sm uppercase border-b border-emerald-100 dark:border-emerald-900/30 pb-2 mb-4 flex items-center gap-2">
                                  <i class="bi bi-hammer"></i> Adjudicación de Compras
                              </h4>
                              
                              <div class="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Proveedor</label>
                                      <input [(ngModel)]="currentOrder.proveedor" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-emerald-500">
                                  </div>
                                  <div>
                                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">RUT Proveedor</label>
                                      <input [(ngModel)]="currentOrder.rutProveedor" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-emerald-500">
                                  </div>
                              </div>
                              
                              <div>
                                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Producto Adjudicado</label>
                                  <input [(ngModel)]="currentOrder.productoAdjudicado" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-emerald-500">
                              </div>

                              <div class="grid grid-cols-2 gap-4 mt-4">
                                  <div>
                                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Adjudicado (CLP)</label>
                                      <input type="number" [(ngModel)]="currentOrder.precioAdjudicado" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-emerald-500">
                                  </div>
                                  <div>
                                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad Adjudicada</label>
                                      <input type="number" [(ngModel)]="currentOrder.cantidadAdjudicada" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-emerald-500">
                                  </div>
                              </div>
                          </div>
                      }

                      <!-- Phase 3: Seguimiento -->
                      @if (currentStage() === 'Seguimiento' || currentOrder.stage === 'Seguimiento' || currentOrder.stage === 'Cierre') {
                           <div class="pt-4 border-t border-gray-100 dark:border-gray-700 animate-fadeIn">
                              <h4 class="font-bold text-indigo-600 text-sm uppercase border-b border-indigo-100 dark:border-indigo-900/30 pb-2 mb-4 flex items-center gap-2">
                                  <i class="bi bi-truck"></i> Seguimiento
                              </h4>
                              <div class="grid grid-cols-2 gap-4">
                                  <div>
                                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Número de OC</label>
                                      <input [(ngModel)]="currentOrder.numeroOC" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-indigo-500 font-mono">
                                  </div>
                                  <div>
                                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Número Cotización</label>
                                      <input [(ngModel)]="currentOrder.numeroCotizacion" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-indigo-500 font-mono">
                                  </div>
                              </div>
                           </div>
                      }
                      
                      <!-- Phase 4: Cierre -->
                      @if (currentStage() === 'Cierre' || currentOrder.stage === 'Cierre') {
                           <div class="pt-4 border-t border-gray-100 dark:border-gray-700 animate-fadeIn">
                              <h4 class="font-bold text-blue-600 text-sm uppercase border-b border-blue-100 dark:border-blue-900/30 pb-2 mb-4 flex items-center gap-2">
                                  <i class="bi bi-check-circle-fill"></i> Cierre de Compras
                              </h4>
                              <div class="grid grid-cols-2 gap-4">
                                  <div>
                                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Número de Factura</label>
                                      <input [(ngModel)]="currentOrder.numeroFactura" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 font-mono">
                                  </div>
                                  <div>
                                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Factura</label>
                                      <input type="date" [(ngModel)]="currentOrder.fechaFactura" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-blue-500">
                                  </div>
                                  <div class="col-span-2">
                                      <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Entrega del Producto</label>
                                      <input type="date" [(ngModel)]="currentOrder.fechaEntrega" class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-blue-500">
                                  </div>
                              </div>
                           </div>
                      }
                  </div>

                  <div class="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                       <button (click)="saveOrder()" class="flex-1 bg-gradient-to-r from-uah-blue to-blue-800 text-white font-black py-4 rounded-xl hover:shadow-xl transition-all uppercase text-xs tracking-widest">Guardar Operación</button>
                      <button (click)="closeModal()" class="px-6 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancelar</button>
                  </div>
              </div>
          </div>
      }
    </div>
  `
})
export class ProcurementComponent {
  data = inject(DataService);

  currentStage = signal<PurchaseStage>('Solicitud');
  searchTerm = signal('');
  selectedLabFilter = signal<LabType | 'ALL'>('ALL');
  
  showModal = signal(false);
  showBudgetModal = signal(false);
  isEditing = false;
  currentOrder: Partial<PurchaseOrder> = {};
  
  // Budget Editing
  editingBudgets: Record<string, number> = {};

  labTypes: LabType[] = ['FABLAB', 'QUIMICA', 'FISICA', 'INFORMATICA'];

  tabs: { id: PurchaseStage, label: string, icon: string }[] = [
      { id: 'Solicitud', label: 'Solicitud', icon: 'bi bi-clipboard-plus' },
      { id: 'Adjudicacion', label: 'Adjudicación', icon: 'bi bi-hammer' },
      { id: 'Seguimiento', label: 'Seguimiento', icon: 'bi bi-truck' },
      { id: 'Cierre', label: 'Cierre', icon: 'bi bi-box-seam-fill' }
  ];

  filteredOrders = computed(() => {
     let orders = this.data.purchaseOrders().filter(o => o.stage === this.currentStage());
     
     if (this.selectedLabFilter() !== 'ALL') {
         orders = orders.filter(o => o.lab === this.selectedLabFilter());
     }

     const term = this.searchTerm().toLowerCase();
     if (term) {
         orders = orders.filter(o => 
             o.item.toLowerCase().includes(term) || 
             o.id.includes(term) ||
             (o.proveedor && o.proveedor.toLowerCase().includes(term))
         );
     }
     return orders;
  });

  // --- Budget Calculations ---
  getLabBudget(lab: LabType): number {
      return this.data.labBudgets()[lab] || 0;
  }

  getLabSpent(lab: LabType): number {
      return this.data.purchaseOrders()
          .filter(o => o.lab === lab)
          .reduce((sum, o) => sum + (o.valorTotal || 0), 0);
  }

  getLabGradient(lab: LabType): string {
      switch(lab) {
           case 'FABLAB': return 'bg-uah-blue';
           case 'QUIMICA': return 'bg-emerald-600';
           case 'FISICA': return 'bg-indigo-600';
           case 'INFORMATICA': return 'bg-uah-orange';
          default: return 'bg-gray-500';
      }
  }
  
  getLabIcon(lab: LabType): string {
      switch(lab) {
          case 'FABLAB': return 'bi bi-printer';
          case 'QUIMICA': return 'bi bi-droplet';
          case 'FISICA': return 'bi bi-lightning';
          case 'INFORMATICA': return 'bi bi-cpu';
          default: return 'bi bi-box';
      }
  }

  getLabBadgeClass(lab: LabType): string {
      switch(lab) {
          case 'FABLAB': return 'text-blue-600 bg-blue-50 border-blue-200';
          case 'QUIMICA': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
          case 'FISICA': return 'text-purple-600 bg-purple-50 border-purple-200';
          case 'INFORMATICA': return 'text-orange-600 bg-orange-50 border-orange-200';
          default: return 'text-gray-600 bg-gray-50';
      }
  }

  pendingCount = computed(() => this.data.purchaseOrders().filter(o => o.stage !== 'Cierre').length);
  shippingCount = computed(() => this.data.purchaseOrders().filter(o => o.stage === 'Seguimiento').length);

  getCount(stage: PurchaseStage) {
      if (this.selectedLabFilter() !== 'ALL') {
          return this.data.purchaseOrders().filter(o => o.stage === stage && o.lab === this.selectedLabFilter()).length;
      }
      return this.data.purchaseOrders().filter(o => o.stage === stage).length;
  }
  
  getStageLabel() {
      return this.tabs.find(t => t.id === this.currentStage())?.label;
  }

  // --- Budget Actions ---
  
  openBudgetEditor() {
      // Clone current budgets to edit
      this.editingBudgets = { ...this.data.labBudgets() };
      this.showBudgetModal.set(true);
  }

  saveBudgets() {
      this.data.updateBudgets(this.editingBudgets as Record<LabType, number>);
      this.showBudgetModal.set(false);
      Swal.fire({ icon: 'success', title: 'Presupuestos Actualizados', timer: 1500, showConfirmButton: false });
  }

  // --- Order Actions ---

  openCreateModal() {
      this.currentOrder = { 
          id: '', // User editable in new strict mode
          item: '',
          lab: this.selectedLabFilter() !== 'ALL' ? this.selectedLabFilter() as LabType : 'FABLAB', 
          cantidad: 1,
          valorUnitario: 0,
          valorTotal: 0,
          fechaSolicitud: new Date().toISOString().split('T')[0],
          linkReferencia: 'N/A'
      };
      this.isEditing = false;
      this.showModal.set(true);
  }

  editOrder(order: PurchaseOrder) {
      this.currentOrder = { ...order };
      this.isEditing = true;
      this.showModal.set(true);
  }
  
  closeModal() { this.showModal.set(false); }

  updateTotal() {
      if(this.currentOrder.cantidad && this.currentOrder.valorUnitario) {
          this.currentOrder.valorTotal = this.currentOrder.cantidad * this.currentOrder.valorUnitario;
      } else {
          this.currentOrder.valorTotal = 0;
      }
  }

  saveOrder() {
      if (!this.currentOrder.item || !this.currentOrder.cantidad || !this.currentOrder.lab) {
          Swal.fire('Error', 'Complete los campos obligatorios (Ítem, Cantidad, Laboratorio)', 'error');
          return;
      }
      
      // Ensure total is correct before saving
      this.updateTotal();

      if (this.isEditing && this.currentOrder.internalId) {
          this.data.updatePurchaseOrder(this.currentOrder.internalId, this.currentOrder);
      } else {
          this.data.addPurchaseOrder(this.currentOrder);
      }
      this.closeModal();
      Swal.fire({ icon: 'success', title: 'Guardado', timer: 1000, showConfirmButton: false });
  }

  deleteOrder(order: PurchaseOrder) {
      Swal.fire({ title: '¿Eliminar Solicitud?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' }).then((r: any) => {
          if (r.isConfirmed) this.data.deletePurchaseOrder(order.internalId);
      });
  }

  // --- Transitions ---

  promoteToAdjudication(order: PurchaseOrder) {
      this.currentOrder = { ...order };
      this.currentOrder.proveedor = '';
      this.currentOrder.rutProveedor = '';
      // Defaults for adjudication fields
      this.currentOrder.productoAdjudicado = order.item;
      this.currentOrder.precioAdjudicado = order.valorUnitario;
      this.currentOrder.cantidadAdjudicada = order.cantidad;
      
      this.isEditing = true;
      this.currentStage.set('Adjudicacion'); 
      this.data.updatePurchaseOrder(order.internalId, {}, 'Adjudicacion');
      Swal.fire({ icon: 'success', title: 'Movido a Adjudicación', text: 'Ahora ingrese los datos del proveedor.', timer: 1500, showConfirmButton: false });
  }

  promoteToTracking(order: PurchaseOrder) {
      if (!order.proveedor) {
          Swal.fire('Atención', 'Debe asignar un proveedor antes de generar OC', 'warning');
          return;
      }
      this.data.updatePurchaseOrder(order.internalId, {}, 'Seguimiento');
      this.currentStage.set('Seguimiento');
      Swal.fire({ icon: 'success', title: 'Movido a Seguimiento', text: 'Ingrese el N° de OC.', timer: 1500, showConfirmButton: false });
  }

  promoteToClosing(order: PurchaseOrder) {
      if (!order.numeroOC) {
           Swal.fire('Atención', 'Falta el Número de OC', 'warning');
           return;
      }
      this.data.updatePurchaseOrder(order.internalId, { fechaEntrega: new Date().toISOString().split('T')[0] }, 'Cierre');
      this.currentStage.set('Cierre');
      Swal.fire({ icon: 'success', title: 'Proceso Cerrado', text: 'Producto recepcionado.', timer: 1500, showConfirmButton: false });
  }
}
