
import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, PurchaseOrder, PurchaseStage, LabType } from '../services/data.service';

declare var Swal: any;
declare var XLSX: any;

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

      <!-- Bulk Action Toolbar (Floating) [UAH] -->
      @if (selectedIds().size > 0) {
          <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-uah-blue text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-slideUp border-2 border-white/20 backdrop-blur-md">
              <div class="flex items-center gap-2">
                  <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-black">{{ selectedIds().size }}</span>
                  <span class="text-xs font-bold uppercase tracking-widest">Seleccionados</span>
              </div>
              <div class="h-6 w-[1px] bg-white/20"></div>
              <div class="flex gap-2">
                  @if (currentStage() === 'Solicitud') {
                      <button (click)="bulkAdjudicate()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2">
                          <i class="bi bi-hammer"></i> Adjudicar Masivo
                      </button>
                  }
                  <button (click)="bulkDelete()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2">
                      <i class="bi bi-trash"></i> Borrar Todo
                  </button>
              </div>
              <button (click)="clearSelection()" class="text-white/60 hover:text-white transition-colors">
                  <i class="bi bi-x-circle text-xl"></i>
              </button>
          </div>
      }

      <!-- Main Content Grid -->
      <div class="glass-panel bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col relative border border-white/40 dark:border-gray-700">
          <!-- Table Header -->
          <div class="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
              <div>
                   <h3 class="font-black text-uah-blue dark:text-white text-sm uppercase tracking-widest">{{ getStageLabel() }}</h3>
                  <p class="text-xs text-gray-500">Gestión centralizada • {{ selectedLabFilter() === 'ALL' ? 'Vista Global' : selectedLabFilter() }}</p>
              </div>
              <div class="flex items-center gap-2">
                  <div class="relative mr-2">
                       <i class="bi bi-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                       <input [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Buscar orden..." class="pl-8 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-xs bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 w-56">
                  </div>
                  
                  <div class="flex gap-1">
                      <button (click)="exportToCSV()" class="h-9 w-9 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center" title="Exportar Todo">
                          <i class="bi bi-file-earmark-spreadsheet"></i>
                      </button>
                      <button (click)="triggerImport()" class="h-9 w-9 bg-uah-blue/5 text-uah-blue border border-uah-blue/10 rounded-lg hover:bg-uah-blue hover:text-white transition-all flex items-center justify-center" title="Importar Masivamente">
                          <i class="bi bi-cloud-arrow-up"></i>
                      </button>
                      <button (click)="downloadTemplate()" class="h-9 w-9 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg hover:bg-uah-orange hover:text-white transition-all flex items-center justify-center" title="Descargar Plantilla UAH">
                          <i class="bi bi-file-earmark-text"></i>
                      </button>
                      <input type="file" #fileInput (change)="onFileSelected($event)" class="hidden" accept=".csv, .xlsx, .xls">
                  </div>
              </div>
          </div>

          <!-- The Data Table -->
          <div class="flex-1 overflow-x-auto custom-scrollbar">
              <table class="w-full text-left text-sm whitespace-nowrap">
                  <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                      <tr>
                          <th class="p-4 pl-6 w-10 text-center">
                              <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()" class="w-4 h-4 rounded border-gray-300 text-uah-orange focus:ring-uah-orange">
                          </th>
                          <th class="p-4">ID Solicitud</th>
                          <th class="p-4">Laboratorio</th>
                          <th class="p-4">Ítem & Detalle</th>
                          <th class="p-4 text-center">Cant.</th>
                          <th class="p-4 text-right">Monto (CLP)</th>
                          <th class="p-4">Estado / Info</th>
                          <th class="p-4 text-center sticky right-0 bg-gray-50 dark:bg-gray-800 shadow-[-5px_0_10px_rgba(0,0,0,0.05)]">Acciones</th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      @for (group of groupedOrders(); track group.idNum) {
                          <tr class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group" [class.bg-blue-50/30]="selectedIds().has(group.idNum)">
                              <td class="p-4 pl-6 text-center">
                                  <input type="checkbox" [checked]="selectedIds().has(group.idNum)" (change)="toggleSelection(group.idNum)" class="w-4 h-4 rounded border-gray-300 text-uah-orange focus:ring-uah-orange">
                              </td>
                              <td class="p-4 font-mono text-xs text-gray-400">{{ group.idNum }}</td>
                              <td class="p-4">
                                  <span [class]="getLabBadgeClass(group.lab)" class="px-2 py-1 rounded-md text-[10px] font-bold border border-current/20">
                                      {{ group.lab }}
                                  </span>
                              </td>
                              <td class="p-4">
                                  <div class="flex flex-col gap-1">
                                      @for (item of group.items; track $index) {
                                          <div class="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[250px] flex items-center gap-2">
                                              <span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                              {{ item }}
                                          </div>
                                      }
                                  </div>
                                  <div class="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
                                      {{ group.fechaSolicitud }}
                                  </div>
                              </td>
                              <td class="p-4 text-center font-bold text-gray-600 dark:text-gray-300">
                                  {{ group.totalCantidad }}
                              </td>
                              <td class="p-4 text-right font-mono text-gray-700 dark:text-gray-300">
                                  $ {{ group.totalValor | number:'1.0-0' }}
                              </td>
                              <td class="p-4">
                                  <!-- Info based on group values -->
                                  @if (currentStage() === 'Solicitud') {
                                      <div class="text-[10px] text-uah-orange font-black uppercase tracking-tighter bg-orange-50 px-2 py-1 rounded border border-orange-100 w-fit">Esperando Aprobación</div>
                                  } 
                                  @if (currentStage() === 'Adjudicacion') {
                                      <div class="text-xs">
                                          <div class="font-bold text-emerald-600 truncate max-w-[120px]">{{ group.proveedor || 'Por asignar' }}</div>
                                          <div class="text-gray-400 text-[10px]">{{ group.rutProveedor || '-' }}</div>
                                      </div>
                                  }
                                  @if (currentStage() === 'Seguimiento') {
                                      <div class="flex gap-2">
                                          <span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-bold border border-indigo-100">OC: {{ group.numeroOC || 'Pendiente' }}</span>
                                      </div>
                                  }
                                  @if (currentStage() === 'Cierre') {
                                      <div class="text-xs text-gray-500">
                                          <div class="text-green-600 font-bold text-[10px]">Entregado satisfactoriamente</div>
                                      </div>
                                  }
                              </td>
                              <td class="p-4 text-center sticky right-0 bg-white dark:bg-gray-900 group-hover:bg-blue-50/50 dark:group-hover:bg-gray-800 transition-colors shadow-[-5px_0_10px_rgba(0,0,0,0.05)]">
                                  <div class="flex justify-center gap-2">
                                      <!-- Group Action Logic -->
                                      @if (currentStage() === 'Solicitud') {
                                           <button (click)="promoteGroupToAdjudication(group)" class="bg-emerald-50 text-emerald-600 border border-emerald-100 w-8 h-8 rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center font-bold" title="Adjudicar">
                                              <i class="bi bi-check-lg"></i>
                                          </button>
                                      }
                                      @if (currentStage() === 'Adjudicacion') {
                                          <button (click)="promoteGroupToTracking(group)" class="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center" title="Generar OC">
                                              <i class="bi bi-file-earmark-text"></i>
                                          </button>
                                      }
                                      @if (currentStage() === 'Seguimiento') {
                                          <button (click)="promoteGroupToClosing(group)" class="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center" title="Recepcionar">
                                              <i class="bi bi-box-seam"></i>
                                          </button>
                                      }
                                      
                                      <button (click)="exportGroupToCSV(group)" class="bg-emerald-50 text-emerald-600 w-8 h-8 rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center" title="Exportar Reporte">
                                           <i class="bi bi-file-earmark-arrow-down"></i>
                                      </button>

                                      <button (click)="openEditModal(group)" class="bg-gray-100 text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors" title="Editar Folio">
                                          <i class="bi bi-pencil-square"></i>
                                      </button>
                                      
                                      <button (click)="deleteGroup(group)" class="bg-red-50 text-red-500 w-8 h-8 rounded-lg hover:bg-red-100 transition-colors" title="Eliminar Todo">
                                          <i class="bi bi-trash"></i>
                                      </button>
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
                                  <input [(ngModel)]="currentOrder.idNum" [disabled]="isEditing" class="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500" placeholder="Ej: 7905102">
                              </div>
                              <div>
                                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Laboratorio</label>
                                  <select [(ngModel)]="currentOrder.lab" [disabled]="isEditing" class="w-full rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 p-3 text-sm focus:ring-2 focus:ring-blue-500 font-bold">
                                      <option *ngFor="let l of labTypes" [value]="l">{{ l }}</option>
                                  </select>
                              </div>
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
                          
                          <!-- Mesa Multi-Producto [UAH] -->
                           <div class="space-y-3">
                               <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                   <label class="text-[10px] font-black text-uah-blue dark:text-gray-400 uppercase tracking-widest">Listado de Productos</label>
                                   <button (click)="addItemRow()" class="text-[10px] font-black text-uah-orange uppercase flex items-center gap-1 hover:underline">
                                       <i class="bi bi-plus-circle-fill"></i> Añadir Ítem
                                   </button>
                               </div>
                               @for (item of currentOrder.itemsArray; track $index) {
                                   <div class="grid grid-cols-12 gap-2 items-center bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fadeIn">
                                       <div class="col-span-6">
                                           <input [(ngModel)]="item.description" placeholder="Descripción" class="w-full text-xs font-bold border-none bg-transparent dark:text-white focus:ring-0">
                                       </div>
                                       <div class="col-span-2">
                                           <input type="number" [(ngModel)]="item.quantity" (input)="updateTotal()" class="w-full text-xs text-center border-none bg-gray-50 dark:bg-gray-900 rounded-lg dark:text-white">
                                       </div>
                                       <div class="col-span-3">
                                           <div class="flex items-center gap-1">
                                               <span class="text-[10px] text-gray-400 font-bold uppercase">Neto $</span>
                                               <input type="number" [(ngModel)]="item.unitPrice" (input)="updateTotal()" class="w-full text-xs border-none bg-gray-50 dark:bg-gray-900 rounded-lg font-bold dark:text-white">
                                           </div>
                                       </div>
                                       <div class="col-span-1 text-right">
                                           <button (click)="removeItemRow($index)" class="text-red-400 hover:text-red-600 transition-colors">
                                               <i class="bi bi-dash-circle-fill"></i>
                                           </button>
                                       </div>
                                   </div>
                               }
                           </div>
                           <div class="bg-gradient-to-r from-uah-blue to-blue-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg border-2 border-white/10">
                                <div class="flex flex-col">
                                    <span class="text-[10px] font-black uppercase tracking-widest opacity-80">Gasto Real Bruto</span>
                                    <span class="text-xs font-bold uppercase tracking-tight text-blue-200">Total + 19% IVA</span>
                                </div>
                                <span class="text-xl font-black">$ {{ currentOrder.valorTotal | number:'1.0-0' }}</span>
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
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    isEditing = false;
    currentOrder: Partial<PurchaseOrder> & { idsToCleanup?: number[] } = {};

    // Bulk Selection [UAH]
    selectedIds = signal<Set<string>>(new Set());
    isAllSelected = computed(() => {
        const current = this.groupedOrders();
        return current.length > 0 && current.every(g => this.selectedIds().has(g.idNum));
    });

    groupedOrders = computed(() => {
        const orders = this.filteredOrders();
        const groups: Record<string, any> = {};

        orders.forEach(o => {
            // Extraemos ítems y cantidades del registro actual (pueden ser uno o muchos)
            let currentItems: string[] = [];
            let currentQty = 0;

            if (o.itemsArray && Array.isArray(o.itemsArray) && o.itemsArray.length > 0) {
                currentItems = o.itemsArray.map(i => i?.description || 'Sin descripción');
                currentQty = o.itemsArray.reduce((acc, i) => acc + (Number(i?.quantity) || 0), 0);
            } else {
                currentItems = [o.item || 'Sin descripción'];
                currentQty = Number(o.cantidad) || 0;
            }

            if (!groups[o.idNum]) {
                groups[o.idNum] = {
                    idNum: o.idNum,
                    lab: o.lab,
                    fechaSolicitud: o.fechaSolicitud,
                    stage: o.stage,
                    ids: [o.id],
                    items: [...currentItems],
                    totalCantidad: currentQty,
                    totalValor: Number(o.valorTotal) || 0,
                    proveedor: o.proveedor,
                    rutProveedor: o.rutProveedor,
                    numeroOC: o.numeroOC,
                    originalOrder: o
                };
            } else {
                groups[o.idNum].ids.push(o.id);
                groups[o.idNum].totalCantidad += currentQty;
                groups[o.idNum].totalValor += Number(o.valorTotal) || 0;

                currentItems.forEach(item => {
                    if (item && !groups[o.idNum].items.includes(item)) {
                        groups[o.idNum].items.push(item);
                    }
                });
            }
        });

        return Object.values(groups);
    });

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
                o.idNum.includes(term) ||
                (o.proveedor && o.proveedor.toLowerCase().includes(term))
            );
        }
        return orders;
    });

    // --- Stats and Counts (Folio-based) ---
    countByStage(stage: PurchaseStage): number {
        const allOrders = this.data.purchaseOrders().filter(o => o.stage === stage);
        // Conteo UAH por folio único (Anexo 1)
        const uniqueFolios = new Set(allOrders.map(o => o.idNum));
        return uniqueFolios.size;
    }

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
        switch (lab) {
            case 'FABLAB': return 'bg-uah-blue';
            case 'QUIMICA': return 'bg-emerald-600';
            case 'FISICA': return 'bg-indigo-600';
            case 'INFORMATICA': return 'bg-uah-orange';
            default: return 'bg-gray-500';
        }
    }

    getLabIcon(lab: LabType): string {
        switch (lab) {
            case 'FABLAB': return 'bi bi-printer';
            case 'QUIMICA': return 'bi bi-droplet';
            case 'FISICA': return 'bi bi-lightning';
            case 'INFORMATICA': return 'bi bi-cpu';
            default: return 'bi bi-box';
        }
    }

    getLabBadgeClass(lab: LabType): string {
        switch (lab) {
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
        Swal.fire({
            icon: 'success',
            title: '<h3 class="text-uah-blue font-black uppercase">Presupuestos Actualizados</h3>',
            text: 'Los fondos han sido reasignados correctamente.',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }

    // --- Order Actions ---

    openCreateModal() {
        this.currentOrder = {
            idNum: '', // User editable in new strict mode
            item: '',
            lab: this.selectedLabFilter() !== 'ALL' ? this.selectedLabFilter() as LabType : 'FABLAB',
            cantidad: 1,
            valorUnitario: 0,
            valorTotal: 0,
            itemsArray: [{ description: '', quantity: 1, unitPrice: 0 }],
            fechaSolicitud: new Date().toISOString().split('T')[0],
            linkReferencia: 'N/A'
        };
        this.isEditing = false;
        this.showModal.set(true);
    }

    openEditModal(group: any) {
        // 1. Identificamos todas las órdenes que pertenecen a este folio
        const allOrdersInGroup = this.data.purchaseOrders().filter(o => o.idNum === group.idNum);

        // 2. Usamos la primera como base para los metadatos (Lab, Fecha, etc.)
        const first = allOrdersInGroup[0];
        this.currentOrder = { ...first };

        // 3. Fusionamos todos los productos de todas las filas en el itemsArray
        const mergedItems: any[] = [];
        allOrdersInGroup.forEach(order => {
            if (order.itemsArray && order.itemsArray.length > 0) {
                mergedItems.push(...order.itemsArray);
            } else {
                // Si es un registro viejo sin itemsArray, creamos la entrada manual
                mergedItems.push({
                    description: order.item,
                    quantity: order.cantidad,
                    unitPrice: order.valorUnitario
                });
            }
        });

        this.currentOrder.itemsArray = mergedItems;
        this.currentOrder.idsToCleanup = allOrdersInGroup.map(o => o.id);

        this.updateTotal(); // Calculamos el IVA 19% del total consolidado
        this.isEditing = true;
        this.showModal.set(true);
    }

    editOrder(order: PurchaseOrder) {
        // Legacy method: will be redirected to folio grouping soon
        this.currentOrder = { ...order };
        if (!this.currentOrder.itemsArray || this.currentOrder.itemsArray.length === 0) {
            this.currentOrder.itemsArray = [{
                description: order.item,
                quantity: order.cantidad,
                unitPrice: order.valorUnitario
            }];
        }
        this.isEditing = true;
        this.showModal.set(true);
    }

    closeModal() { this.showModal.set(false); }

    addItemRow() {
        if (!this.currentOrder.itemsArray) this.currentOrder.itemsArray = [];
        this.currentOrder.itemsArray.push({ description: '', quantity: 1, unitPrice: 0 });
    }

    removeItemRow(index: number) {
        if (this.currentOrder.itemsArray && this.currentOrder.itemsArray.length > 1) {
            this.currentOrder.itemsArray.splice(index, 1);
            this.updateTotal();
        }
    }

    updateTotal() {
        if (this.currentOrder.itemsArray && this.currentOrder.itemsArray.length > 0) {
            let totalNeto = 0;
            this.currentOrder.itemsArray.forEach(item => {
                totalNeto += (item.quantity * item.unitPrice);
            });

            // UAH Standard: Aplicar 19% de IVA al total bruto
            this.currentOrder.valorTotal = Math.round(totalNeto * 1.19);

            // Compatibilidad Institucional: El primer item manda en la descripción resumen
            this.currentOrder.item = this.currentOrder.itemsArray[0].description;
            this.currentOrder.cantidad = this.currentOrder.itemsArray[0].quantity;
            this.currentOrder.valorUnitario = this.currentOrder.itemsArray[0].unitPrice;
        } else {
            this.currentOrder.valorTotal = 0;
        }
    }

    async saveOrder() {
        if (!this.currentOrder.itemsArray || this.currentOrder.itemsArray.length === 0 || !this.currentOrder.itemsArray[0].description) {
            Swal.fire({ icon: 'error', title: 'Faltan Datos', text: 'Complete al menos un producto con descripción.', confirmButtonColor: '#003366' });
            return;
        }

        this.updateTotal();

        if (this.isEditing) {
            // Consolidación UAH: Guardamos en el ID principal y borramos los redundantes
            const mainId = this.currentOrder.id!;
            await this.data.updatePurchaseOrder(mainId, this.currentOrder);

            if (this.currentOrder.idsToCleanup && this.currentOrder.idsToCleanup.length > 1) {
                const redundantIds = this.currentOrder.idsToCleanup.filter(id => id !== mainId);
                for (const rid of redundantIds) {
                    await this.data.deletePurchaseOrder(rid);
                }
            }
        } else {
            await this.data.addPurchaseOrder(this.currentOrder);
        }

        this.closeModal();
        this.clearSelection();
        Swal.fire({ icon: 'success', title: 'Operación Consolidada', timer: 1500, showConfirmButton: false });
    }

    deleteOrder(order: PurchaseOrder) {
        Swal.fire({
            title: '<h3 class="text-uah-blue font-black uppercase tracking-tighter">¿Eliminar Solicitud?</h3>',
            text: 'Esta operación no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#003366',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((r: any) => {
            if (r.isConfirmed) this.data.deletePurchaseOrder(order.id);
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
        this.data.updatePurchaseOrder(order.id, {}, 'Adjudicacion');
        Swal.fire({
            icon: 'success',
            title: '<h3 class="text-emerald-600 font-black uppercase">Aprobación Técnica</h3>',
            text: 'La solicitud ha sido movida a fase de Adjudicación.',
            timer: 2000,
            showConfirmButton: false
        });
    }

    promoteToTracking(order: PurchaseOrder) {
        if (!order.proveedor) {
            Swal.fire('Atención', 'Debe asignar un proveedor antes de generar OC', 'warning');
            return;
        }
        this.data.updatePurchaseOrder(order.id, {}, 'Seguimiento');
        this.currentStage.set('Seguimiento');
        Swal.fire({
            icon: 'success',
            title: '<h3 class="text-indigo-600 font-black uppercase">Orden Generada</h3>',
            text: 'El proceso continúa en fase de seguimiento.',
            timer: 2000,
            showConfirmButton: false
        });
    }

    promoteToClosing(order: PurchaseOrder) {
        if (!order.numeroOC) {
            Swal.fire('Atención', 'Falta el Número de OC', 'warning');
            return;
        }
        this.data.updatePurchaseOrder(order.id, { fechaEntrega: new Date().toISOString().split('T')[0] }, 'Cierre');
        this.currentStage.set('Cierre');
        Swal.fire({ icon: 'success', title: 'Proceso Cerrado', text: 'Producto recepcionado.', timer: 1500, showConfirmButton: false });
    }

    // --- UAH Masive Operations ---

    clearSelection() {
        this.selectedIds.set(new Set());
    }

    toggleSelection(idNum: string) {
        const next = new Set(this.selectedIds());
        if (next.has(idNum)) next.delete(idNum);
        else next.add(idNum);
        this.selectedIds.set(next);
    }

    toggleSelectAll() {
        if (this.isAllSelected()) {
            this.selectedIds.set(new Set());
        } else {
            const allFolios = this.groupedOrders().map(g => g.idNum);
            this.selectedIds.set(new Set(allFolios));
        }
    }

    async bulkAdjudicate() {
        const { value: formValues } = await Swal.fire({
            title: '<h3 class="text-uah-blue font-black uppercase">Adjudicación Masiva</h3>',
            html:
                '<label class="block text-left text-xs font-bold text-gray-500 uppercase mb-1">Proveedor Común</label>' +
                '<input id="swal-proveedor" class="swal2-input !mt-0 !mb-4 !w-full" placeholder="Razón Social">' +
                '<label class="block text-left text-xs font-bold text-gray-500 uppercase mb-1">RUT Proveedor</label>' +
                '<input id="swal-rut" class="swal2-input !mt-0 !w-full" placeholder="77.xxx.xxx-x">',
            focusConfirm: false,
            confirmButtonText: 'Procesar ' + this.selectedIds().size + ' Folios',
            confirmButtonColor: '#10b981',
            preConfirm: () => {
                return [
                    (document.getElementById('swal-proveedor') as HTMLInputElement).value,
                    (document.getElementById('swal-rut') as HTMLInputElement).value
                ]
            }
        });

        if (formValues && formValues[0]) {
            const folios = Array.from(this.selectedIds());
            const allOrders = this.data.purchaseOrders().filter(o => folios.includes(o.idNum));

            for (const order of allOrders) {
                await this.data.updatePurchaseOrder(order.id, {
                    proveedor: formValues[0],
                    rutProveedor: formValues[1],
                    stage: 'Adjudicacion'
                }, 'Adjudicacion');
            }
            this.clearSelection();
            Swal.fire('Éxito', 'Se adjudicaron ' + folios.length + ' folios.', 'success');
        }
    }

    async bulkDelete() {
        const res = await Swal.fire({
            title: '<h3 class="text-red-600 font-black uppercase">Eliminación Masiva</h3>',
            text: '¿Confirmas eliminar ' + this.selectedIds().size + ' folios completos permanentemente?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar todo'
        });

        if (res.isConfirmed) {
            const folios = Array.from(this.selectedIds());
            const allOrders = this.data.purchaseOrders().filter(o => folios.includes(o.idNum));

            for (const order of allOrders) {
                await this.data.deletePurchaseOrder(order.id);
            }
            this.clearSelection();
            Swal.fire('Eliminado', 'Se borraron los folios seleccionados.', 'success');
        }
    }

    // --- Group Promotion Logic ---

    async promoteGroupToAdjudication(group: any) {
        const folios = [group.idNum];
        const { value: formValues } = await Swal.fire({
            title: '<h3 class="text-emerald-600 font-black uppercase tracking-widest text-sm">Adjudicación Directa de Folio</h3>',
            html:
                '<div class="text-[10px] text-gray-400 mb-4 uppercase tracking-widest font-bold">Folio: ' + group.idNum + '</div>' +
                '<label class="block text-left text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cargar Proveedor</label>' +
                '<input id="swal-proveedor" class="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold mb-3" placeholder="Razón Social">' +
                '<label class="block text-left text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">RUT Proveedor</label>' +
                '<input id="swal-rut" class="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold" placeholder="77.xxx.xxx-x">',
            focusConfirm: false,
            confirmButtonText: 'Adjudicar Folio',
            confirmButtonColor: '#10b981',
            preConfirm: () => {
                return [
                    (document.getElementById('swal-proveedor') as HTMLInputElement).value,
                    (document.getElementById('swal-rut') as HTMLInputElement).value
                ]
            }
        });

        if (formValues && formValues[0]) {
            const allOrdersInGroup = this.data.purchaseOrders().filter(o => o.idNum === group.idNum);
            for (const order of allOrdersInGroup) {
                await this.data.updatePurchaseOrder(order.id, {
                    proveedor: formValues[0],
                    rutProveedor: formValues[1],
                    stage: 'Adjudicacion'
                }, 'Adjudicacion');
            }
            Swal.fire({ icon: 'success', title: 'Folio Adjudicado', timer: 1500, showConfirmButton: false });
        }
    }

    promoteGroupToTracking(group: any) {
        const allOrdersInGroup = this.data.purchaseOrders().filter(o => o.idNum === group.idNum);
        for (const order of allOrdersInGroup) {
            this.data.updatePurchaseOrder(order.id, {}, 'Seguimiento');
        }
        this.currentStage.set('Seguimiento');
        Swal.fire({ icon: 'success', title: 'OC Generada para Folio', timer: 1500, showConfirmButton: false });
    }

    promoteGroupToClosing(group: any) {
        const allOrdersInGroup = this.data.purchaseOrders().filter(o => o.idNum === group.idNum);
        for (const order of allOrdersInGroup) {
            this.data.updatePurchaseOrder(order.id, { fechaEntrega: new Date().toISOString().split('T')[0] }, 'Cierre');
        }
        this.currentStage.set('Cierre');
        Swal.fire({ icon: 'success', title: 'Folio Cerrado', timer: 1500, showConfirmButton: false });
    }

    deleteGroup(group: any) {
        Swal.fire({
            title: '¿Eliminar Folio ' + group.idNum + '?',
            text: 'Se borrarán todos los ítems asociados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444'
        }).then((res: any) => {
            if (res.isConfirmed) {
                const allOrdersInGroup = this.data.purchaseOrders().filter(o => o.idNum === group.idNum);
                for (const order of allOrdersInGroup) {
                    this.data.deletePurchaseOrder(order.id);
                }
            }
        });
    }

    exportGroupToCSV(group: any) {
        const allOrdersInGroup = this.data.purchaseOrders().filter(o => o.idNum === group.idNum);
        // Use existing export logic but with all items in group
        this.exportToCSVMulti(allOrdersInGroup, `FOLIO_${group.idNum}`);
    }

    private exportToCSVMulti(orders: PurchaseOrder[], filename: string) {
        const headers = ['Folio', 'Laboratorio', 'Producto', 'Cantidad', 'Valor_Neto_Unit', 'Total_Bruto_IVA', 'Fecha', 'Etapa', 'Proveedor', 'RUT_Proveedor', 'OC'];
        const rows: string[] = [];

        orders.forEach(o => {
            if (o.itemsArray && o.itemsArray.length > 0) {
                // Expandimos cada ítem del folio en una fila de Excel [UAH]
                o.itemsArray.forEach(item => {
                    rows.push([
                        o.idNum,
                        o.lab,
                        item.description,
                        item.quantity,
                        item.unitPrice,
                        Math.round((item.quantity * item.unitPrice) * 1.19), // Bruto institucional
                        o.fechaSolicitud,
                        o.stage,
                        o.proveedor || 'N/A',
                        o.rutProveedor || 'N/A',
                        o.numeroOC || 'N/A'
                    ].join(';'));
                });
            } else {
                // Respaldamos registros antiguos o simples
                rows.push([
                    o.idNum,
                    o.lab,
                    o.item || 'N/A',
                    o.cantidad,
                    o.valorUnitario,
                    o.valorTotal,
                    o.fechaSolicitud,
                    o.stage,
                    o.proveedor || 'N/A',
                    o.rutProveedor || 'N/A',
                    o.numeroOC || 'N/A'
                ].join(';'));
            }
        });

        const csvContent = [headers.join(';'), ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    }

    // --- UAH Auditoría & Reportes ---

    exportToCSV(singleOrder?: PurchaseOrder) {
        const orders = singleOrder ? [singleOrder] : this.filteredOrders();
        if (orders.length === 0) return;

        // Encabezados amigables para exportación masiva / edición UAH
        const headers = ['Folio', 'Laboratorio', 'Material / Nombre', 'Cantidad', 'Valor Neto Unitario', 'Valor Total (Bruto)', 'Fecha Solicitud', 'Estado Actual', 'Proveedor', 'RUT Proveedor', 'Orden de Compra (OC)'];
        const rows: any[] = [];

        orders.forEach(o => {
            if (o.itemsArray && o.itemsArray.length > 0) {
                o.itemsArray.forEach(item => {
                    rows.push({
                        'Folio': o.idNum,
                        'Laboratorio': o.lab,
                        'Material / Nombre': item.description,
                        'Cantidad': item.quantity,
                        'Valor Neto Unitario': item.unitPrice,
                        'Valor Total (Bruto)': Math.round((item.quantity * item.unitPrice) * 1.19),
                        'Fecha Solicitud': o.fechaSolicitud,
                        'Estado Actual': o.stage,
                        'Proveedor': o.proveedor || 'N/A',
                        'RUT Proveedor': o.rutProveedor || 'N/A',
                        'Orden de Compra (OC)': o.numeroOC || 'N/A'
                    });
                });
            } else {
                rows.push({
                    'Folio': o.idNum,
                    'Laboratorio': o.lab,
                    'Material / Nombre': o.item || 'N/A',
                    'Cantidad': o.cantidad,
                    'Valor Neto Unitario': o.valorUnitario,
                    'Valor Total (Bruto)': o.valorTotal,
                    'Fecha Solicitud': o.fechaSolicitud,
                    'Estado Actual': o.stage,
                    'Proveedor': o.proveedor || 'N/A',
                    'RUT Proveedor': o.rutProveedor || 'N/A',
                    'Orden de Compra (OC)': o.numeroOC || 'N/A'
                });
            }
        });

        this.data.downloadExcel(rows, `REPORTE_UAH_COMPRAS_${this.currentStage().toUpperCase()}`);
    }

    downloadTemplate() {
        let template: any[] = [];
        const stage = this.currentStage();

        if (stage === 'Solicitud') {
            template = [{
                'Folio (Opcional)': '8051368',
                'Laboratorio': 'INFORMATICA',
                'Material / Nombre': 'Cargador Lenovo original tipo C 65W',
                'Descripción / Detalle': 'Cargador para Thinkpad L14',
                'Cantidad': 5,
                'Valor Neto Unitario': 35990,
                'Observaciones': 'Urgente para Laboratorio 3',
                'Link Referencia': 'https://referencia.cl'
            }];
        } else if (stage === 'Adjudicacion') {
            template = [{
                'Folio': '8051368',
                'Proveedor / Empresa': 'LENOVO CHILE S.A.',
                'RUT Proveedor': '12.345.678-9',
                'Producto Adjudicado': 'Cargador Lenovo 65W (SKU-123)',
                'Precio Adjudicado': 32500,
                'Cantidad Adjudicada': 5
            }];
        } else if (stage === 'Seguimiento') {
            template = [{
                'Folio': '8051368',
                'Número OC': 'OC-2024-001',
                'Número Cotización': 'COT-9988',
                'Fecha Entrega Estimada': '2024-06-15'
            }];
        } else if (stage === 'Cierre') {
            template = [{
                'Folio': '8051368',
                'Número Factura': 'F-15522',
                'Fecha Factura': '2024-06-20',
                'Fecha Entrega Real': '2024-06-21'
            }];
        }

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Compras");
        XLSX.writeFile(wb, `PLANTILLA_${stage.toUpperCase()}_UAH.xlsx`);

        Swal.fire({
            icon: 'info',
            title: `Plantilla ${stage} Descargada`,
            text: 'Completa los datos en Excel. ' + (stage === 'Solicitud' ? '' : 'Asegúrate de mantener el Folio correcto para actualizar la orden.'),
            confirmButtonColor: '#003366'
        });
    }

    triggerImport() {
        this.fileInput.nativeElement.click();
    }

    async onFileSelected(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        const reader = new FileReader();

        reader.onload = async (e: any) => {
            const ordersToImport: any[] = [];
            
            if (isExcel) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                console.log('JSON extraído de Excel:', jsonData);

                jsonData.forEach((row: any) => {
                    const keys = Object.keys(row);
                    const getV = (prefixes: string[]) => {
                        const match = keys.find(k => prefixes.some(p => k.toUpperCase().trim().includes(p.toUpperCase())));
                        return match ? String(row[match]).trim() : '';
                    };

                    const folio = getV(['FOLIO', 'ID_SOLICITUD', 'IDNUM', 'ID', 'Folio']);
                    const item = getV(['ITEM', 'PRODUCTO', 'NOMBRE', 'ARTÍCULO', 'ITEM_PRODUCTO', 'Material / Nombre']);
                    const qty = parseInt(getV(['CANTIDAD', 'QTY', 'QUANTITY', 'Cantidad'])) || 0;
                    const price = parseFloat(getV(['VALOR', 'PRECIO', 'NETO', 'UNITARIO', 'COSTO', 'NETO_UNITARIO', 'Valor Neto Unitario']).replace(/[^0-9.]/g, '')) || 0;
                    const lab = getV(['LABORATORIO', 'ÁREA', 'LAB', 'Laboratorio']);
                    const obs = getV(['DESCRIPCION', 'OBSERVACIONES', 'DETALLE', 'OBS', 'Observaciones', 'Descripción / Detalle']);
                    const link = getV(['LINK', 'URL', 'REFERENCIA', 'LINK_REFERENCIA', 'Link Referencia']);

                    // Campos de Adjudicación
                    const prov = getV(['PROVEEDOR', 'VENDOR', 'COMPANY', 'Proveedor / Empresa']);
                    const rutP = getV(['RUT', 'RUT_PROVEEDOR', 'TAX_ID', 'RUT Proveedor']);
                    const prodAdj = getV(['PRODUCTO_ADJUDICADO', 'ADJUDICADO_NOMBRE', 'Producto Adjudicado']);
                    const priceAdj = parseFloat(getV(['PRECIO_ADJUDICADO', 'VALOR_ADJUDICADO', 'Precio Adjudicado']).replace(/[^0-9.]/g, '')) || 0;
                    const qtyAdj = parseInt(getV(['CANTIDAD_ADJUDICADA', 'QTY_ADJUDICADA', 'Cantidad Adjudicada'])) || 0;

                    // Seguimiento & Cierre
                    const nOc = getV(['OC', 'NUMERO_OC', 'OC_NUMBER', 'Número OC', 'Orden de Compra']);
                    const nCot = getV(['COTIZACION', 'NUMERO_COTIZACION', 'QUOTE', 'Número Cotización']);
                    const fEntregaEst = getV(['FECHA_ENTREGA_ESTIMADA', 'ENTREGA_ESTIMADA', 'Fecha Entrega Estimada']);
                    const nFactura = getV(['FACTURA', 'NUMERO_FACTURA', 'INVOICE', 'Número Factura']);
                    const fFactura = getV(['FECHA_FACTURA', 'INVOICE_DATE', 'Fecha Factura']);
                    const fEntregaReal = getV(['FECHA_ENTREGA_REAL', 'FECHA_ENTREGA', 'Fecha Entrega Real']);

                    if (folio || (item && qty > 0)) {
                        console.log('Procesando Folio:', folio, 'Item:', item, 'Lab origen:', lab);
                        ordersToImport.push(this.mapRowToOrder({
                            folio, item, qty, price, lab, obs, link,
                            prov, rutP, prodAdj, priceAdj, qtyAdj,
                            nOc, nCot, fEntregaEst, nFactura, fFactura, fEntregaReal
                        }));
                    }
                });
            } else {
                const content = e.target.result;
                const lines = content.split(/\r?\n/);
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    const cols = line.split(/[;\t]/);
                    if (cols.length >= 3) {
                        const item = cols[0]?.trim();
                        const qty = parseInt(cols[1]) || 0;
                        const price = parseFloat(cols[2]?.replace(/[^0-9.]/g, '')) || 0;
                        if (item && qty > 0) {
                            ordersToImport.push(this.mapRowToOrder({
                                folio: cols[0]?.trim(),
                                item: item,
                                qty: qty,
                                price: price,
                                lab: cols[1]?.trim(),
                                obs: cols[5]?.trim()
                            }));
                        }
                    }
                }
            }

            if (ordersToImport.length > 0) {
                const success = await this.data.addPurchaseOrdersBulk(ordersToImport);
                if (success) {
                    const movedToAdj = ordersToImport.some(o => o.prov && this.currentStage() === 'Solicitud');
                    this.searchTerm.set(''); // Limpiar búsqueda para mostrar nuevos datos
                    
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Importación Exitosa', 
                        text: `Se procesaron ${ordersToImport.length} registros.` + 
                              (movedToAdj ? ' Algunos ítems con proveedor se movieron automáticamente a Adjudicación.' : ''),
                        confirmButtonColor: '#003366'
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al procesar la importación masiva.' });
                }
            }
            this.fileInput.nativeElement.value = '';
        };

        if (isExcel) reader.readAsArrayBuffer(file);
        else reader.readAsText(file);
    }

    private resolveBaseLab(input: string): LabType {
        if (!input) return 'INFORMATICA';
        const normalized = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
        
        // 1. Mapeo directo
        if (['FABLAB', 'QUIMICA', 'FISICA', 'INFORMATICA'].includes(normalized)) return normalized as LabType;

        // 2. Mapeo por jerarquía (UAH)
        for (const [parent, children] of Object.entries(this.data.hierarchy)) {
            if (children.some(c => normalized.includes(c.toUpperCase()))) {
                // Mapear "LAB CIENCIAS BASICAS" a QUIMICA o FISICA según el texto
                if (parent === 'LAB CIENCIAS BASICAS') {
                    if (normalized.includes('QUIMICA')) return 'QUIMICA';
                    if (normalized.includes('FISICA')) return 'FISICA';
                    return 'QUIMICA'; // Default para ciencias
                }
                if (parent === 'FABLAB') return 'FABLAB';
                if (parent === 'LAB INFORMATICA') return 'INFORMATICA';
            }
        }

        // 3. Fallbacks básicos por palabras clave
        if (normalized.includes('FAB')) return 'FABLAB';
        if (normalized.includes('QUI')) return 'QUIMICA';
        if (normalized.includes('FIS')) return 'FISICA';
        if (normalized.includes('INF') || normalized.includes('TEC')) return 'INFORMATICA';

        return 'INFORMATICA';
    }

    private mapRowToOrder(d: any) {
        // Buscar el ID interno si ya existe en la lista para permitir UPDATE
        const existingOrder = this.data.purchaseOrders().find(o => o.idNum === d.folio);
        const resolvedLab = this.resolveBaseLab(d.lab || existingOrder?.lab || '');
        
        const mapped: any = {
            id: existingOrder?.id || undefined, // Clave para que TypeORM haga UPDATE
            idNum: d.folio || (existingOrder ? existingOrder.idNum : undefined),
            solicitante: this.data.currentUser()?.nombreCompleto || 'Sistema',
            item: d.item || existingOrder?.item,
            cantidad: d.qty || existingOrder?.cantidad,
            valorUnitario: d.price || existingOrder?.valorUnitario,
            valorTotal: Math.round((d.qty || existingOrder?.cantidad || 0) * (d.price || existingOrder?.valorUnitario || 0) * 1.19),
            observaciones: d.obs || existingOrder?.observaciones,
            lab: resolvedLab,
            linkReferencia: d.link || existingOrder?.linkReferencia || 'N/A',
            stage: this.currentStage() as PurchaseStage,
            fechaSolicitud: existingOrder?.fechaSolicitud || new Date().toISOString().split('T')[0],
            itemsArray: d.item ? [{
                description: d.item,
                quantity: d.qty || 1,
                unitPrice: d.price || 0
            }] : existingOrder?.itemsArray || []
        };

        // Enriquecer con campos adicionales según disponibilidad
        if (d.prov) mapped.proveedor = d.prov;
        if (d.rutP) mapped.rutProveedor = d.rutP;
        if (d.prodAdj) mapped.productoAdjudicado = d.prodAdj;
        if (d.priceAdj) mapped.precioAdjudicado = d.priceAdj;
        if (d.qtyAdj) mapped.cantidadAdjudicada = d.qtyAdj;
        if (d.nOc) mapped.numeroOC = d.nOc;
        if (d.nCot) mapped.numeroCotizacion = d.nCot;
        if (d.fEntregaEst) mapped.fechaEntrega = d.fEntregaEst;
        if (d.nFactura) mapped.numeroFactura = d.nFactura;
        if (d.fFactura) mapped.fechaFactura = d.fFactura;
        if (d.fEntregaReal) {
            mapped.fechaEntrega = d.fEntregaReal; // Sobrescribir con real si existe
            mapped.stage = 'Cierre' as PurchaseStage;
        }

        // Si se cargan datos de adjudicación, avanzar el estado si está en solicitud
        if (d.prov && mapped.stage === 'Solicitud') {
            mapped.stage = 'Adjudicacion' as PurchaseStage;
        }

        return mapped;
    }
}
