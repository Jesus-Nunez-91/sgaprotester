
import { Component, inject, signal, computed } from '@angular/core';
import { DataService, InventoryItem } from '../services/data.service';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare const Swal: any;
declare const XLSX: any;

/**
 * Componente de Inventario.
 * Permite visualizar, filtrar y gestionar los items de un laboratorio específico.
 * Soporta dos modos: 'Equipos' (Notebooks, Laptops) y 'Arduinos' (Insumos electrónicos).
 * Incluye funcionalidades para administradores (CRUD) y usuarios (Reservas).
 */
@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="glass-panel min-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn relative">
      <!-- Encabezado -->
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-20 transition-colors">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-3">
             <h2 class="text-2xl font-bold text-uah-blue dark:text-blue-400 flex items-center gap-3">
                {{ labName }}
             </h2>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
              {{ areaName }} 
              <span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500 dark:text-gray-300">{{ inventoryMode() }}</span>
          </p>
        </div>
        
        <div class="flex flex-wrap gap-2 items-center justify-center md:justify-end">
           
           <button (click)="exportData()" class="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors flex items-center gap-2" title="Exportar a Excel">
              <i class="bi bi-file-earmark-excel-fill"></i>
           </button>

           @if (isAdmin()) {
              <button (click)="downloadTemplate()" class="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-2" title="Descargar Plantilla">
                 <i class="bi bi-file-earmark-arrow-down-fill"></i>
              </button>
              
              <div class="relative">
                 <button (click)="excelInput.click()" class="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors flex items-center gap-2" title="Carga Masiva Excel">
                    <i class="bi bi-file-earmark-arrow-up-fill"></i>
                 </button>
                 <input type="file" #excelInput (change)="importExcel($event)" accept=".xlsx, .xls" class="hidden">
              </div>

              <button (click)="resetForm()" class="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2" title="Nuevo Item">
                 <i class="bi bi-plus-lg text-lg"></i>
              </button>
           }
           
           <div class="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex shadow-inner">
               <button (click)="setMode('Equipos')" [class]="inventoryMode() === 'Equipos' ? 'bg-white dark:bg-gray-600 text-uah-blue dark:text-blue-300 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'" class="px-3 py-1.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
                 <i class="bi bi-laptop"></i>
               </button>
               <button (click)="setMode('Arduinos')" [class]="inventoryMode() === 'Arduinos' ? 'bg-white dark:bg-gray-600 text-teal-600 dark:text-teal-300 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'" class="px-3 py-1.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
                 <i class="bi bi-cpu"></i>
               </button>
           </div>

           <button (click)="goBack()" class="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold text-sm flex items-center justify-center gap-2 bg-white dark:bg-gray-800 shadow-sm transition-colors">
             <i class="bi bi-arrow-left"></i>
           </button>
        </div>
      </div>
      
      <div class="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        <!-- Barra Lateral de Administración -->
        @if (isAdmin()) {
          <div class="w-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors">
            <!-- Formulario de Administración -->
            <h5 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i class="bi bi-sliders"></i> Gestión de Inventario
            </h5>
            <div class="space-y-4">
              <div class="text-center mb-4">
                  <div class="w-full h-36 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 relative cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all group">
                      @if (editItem.imagenUrl) {
                          <img [src]="editItem.imagenUrl" class="w-full h-full object-cover">
                          <button (click)="removeImage()" class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md transition-transform hover:scale-110"><i class="bi bi-trash"></i></button>
                      } @else {
                          <div class="text-gray-400 group-hover:text-blue-400 transition-colors">
                             <i class="bi bi-cloud-arrow-up text-3xl mb-1 block"></i>
                             <span class="text-xs font-bold">Subir Imagen</span>
                          </div>
                      }
                      <input type="file" (change)="processImage($event)" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" [disabled]="!!editItem.imagenUrl">
                  </div>
              </div>
              <div>
                <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Marca / Nombre</label>
                <input [(ngModel)]="editItem.marca" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all" placeholder="Ej: Dell">
              </div>
              <div>
                <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Modelo / Detalle</label>
                <input [(ngModel)]="editItem.modelo" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all" placeholder="Ej: Latitude 5420">
              </div>
              
              <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
                <h6 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Administración de Ingreso</h6>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">N° Factura</label>
                    <input [(ngModel)]="editItem.numeroFactura" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all" placeholder="Ej: FAC-12345">
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Fecha Llegada</label>
                      <input type="date" [(ngModel)]="editItem.fechaLlegada" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
                    </div>
                    <div class="relative">
                      <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Cant. Llegada</label>
                      <div class="flex gap-1">
                        <input type="number" [(ngModel)]="editItem.cantidadLlegada" class="flex-1 text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
                        <button (click)="applyArrival()" type="button" class="bg-emerald-500 text-white px-2 rounded-xl hover:bg-emerald-600 transition-colors" title="Sumar al Stock Total">
                          <i class="bi bi-plus-circle"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                 <div>
                    <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Stock Total</label>
                    <input type="number" [(ngModel)]="editItem.stockActual" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
                 </div>
                 <div>
                    <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Stock Mínimo</label>
                    <input type="number" [(ngModel)]="editItem.stockMinimo" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
                 </div>
              </div>
              <div>
                 <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Estado Operativo</label>
                 <select [(ngModel)]="editItem.status" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
                    <option value="Disponible">Disponible</option>
                    <option value="En Mantención">En Mantención</option>
                    <option value="Baja">Baja</option>
                 </select>
              </div>
              <div class="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                 <button (click)="saveItem()" class="w-full bg-uah-blue text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl text-sm flex justify-center items-center gap-2">
                    <i class="bi bi-save"></i> {{ editItem.id ? 'ACTUALIZAR' : 'GUARDAR' }}
                 </button>
                 <button (click)="resetForm()" class="w-full bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-300 font-bold py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm">
                    LIMPIAR
                 </button>
              </div>
            </div>
          </div>
        }

        <!-- Área de Tabla -->
        <div class="flex-1 p-6 overflow-hidden flex flex-col bg-gray-50/50 dark:bg-gray-900/50 relative z-0">
           <!-- Barra de Filtros -->
           <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-4 flex flex-wrap gap-4 items-end border border-gray-100 dark:border-gray-700">
              <div class="flex-1 min-w-[200px]">
                 <label for="searchInventory" class="text-xs font-bold text-gray-400 uppercase ml-1">Buscar Recurso</label>
                 <div class="relative group">
                    <i class="bi bi-search absolute left-3 top-2.5 text-gray-400 group-hover:text-uah-blue transition-colors"></i>
                    <input id="searchInventory" type="text" [(ngModel)]="searchTerm" placeholder="Marca, Modelo, SN..." class="w-full pl-9 py-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent text-sm transition-all">
                 </div>
              </div>
              <div class="w-36">
                 <label for="resDateFilter" class="text-xs font-bold text-gray-400 uppercase ml-1">Fecha Reserva</label>
                 <input id="resDateFilter" type="date" [(ngModel)]="resDate" class="w-full py-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-uah-blue focus:border-transparent">
              </div>
              <div class="w-36">
                 <label for="resBlockFilter" class="text-xs font-bold text-gray-400 uppercase ml-1">Bloque</label>
                 <select id="resBlockFilter" [(ngModel)]="resBlock" class="w-full py-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-uah-blue focus:border-transparent">
                    <option>08:30 - 09:50</option>
                    <option>10:00 - 11:20</option>
                    <option>11:30 - 12:50</option>
                    <option>13:00 - 14:20</option>
                    <option>14:30 - 15:50</option>
                    <option>16:00 - 17:20</option>
                    <option>17:30 - 18:50</option>
                 </select>
              </div>

              @if (leadTimeNotice() && !isAdmin()) {
                 <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2 rounded-xl flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-400 max-w-[200px]">
                     <i class="bi bi-info-circle-fill"></i>
                     <span>{{ leadTimeNotice() }}</span>
                 </div>
              }

              @if (specificTimeError()) {
                 <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 rounded-xl flex items-center gap-2 text-[10px] text-red-600 dark:text-red-400 max-w-[200px]">
                     <i class="bi bi-exclamation-triangle-fill"></i>
                     <span>{{ specificTimeError() }}</span>
                 </div>
              }

              @if (selection().length > 0) {
                 <button (click)="makeReservation()" class="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg hover:shadow-green-200 transition-all animate-pulse active:scale-95">
                    CONFIRMAR RESERVA ({{ selectionCount() }})
                 </button>
              }
           </div>

           <!-- La Grilla -->
           <div class="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm custom-scrollbar">
              <table class="w-full text-left text-sm">
                 <thead class="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-600 dark:text-gray-300 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                    <tr>
                       <th class="p-4">Recurso</th>
                       <th class="p-4">Especificaciones</th>
                       <th class="p-4">Disponibilidad Real</th>
                       <th class="p-4 text-center">Acción</th>
                    </tr>
                 </thead>
                 <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    @for (item of filteredItems(); track item.id) {
                       @let stock = getAvailableStock(item);
                       @let isLowStock = item.stockActual <= item.stockMinimo;
                       
                       <tr [class]="isLowStock ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l-4 border-red-400' : 'hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group border-l-4 border-transparent'">
                          <td class="p-4">
                             <div class="flex items-start gap-3">
                                <div class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ease-out">
                                    @if (item.imagenUrl) {
                                       <img [src]="item.imagenUrl" class="w-full h-full object-cover">
                                    } @else {
                                       <div class="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
                                         <i class="bi bi-image"></i>
                                       </div>
                                    }
                                </div>
                                <div>
                                   <div class="font-bold text-uah-blue dark:text-blue-300 text-base">{{ item.marca }}</div>
                                   <div class="text-gray-500 dark:text-gray-400 text-xs">{{ item.modelo }}</div>
                                   @if (item.sn && isAdmin()) { <code class="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-300 font-mono mt-1 inline-block">{{ item.sn }}</code> }
                                </div>
                             </div>
                          </td>
                          <td class="p-4">
                             @if (inventoryMode() === 'Equipos') {
                                <div class="flex flex-wrap gap-1 mb-1">
                                   @if (item.ram) { <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300">{{ item.ram }}</span> }
                                   @if (item.rom) { <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300">{{ item.rom }}</span> }
                                </div>
                                <div class="text-xs text-gray-400 truncate max-w-[200px]" title="{{ item.so }}">{{ item.so }}</div>
                             } @else {
                                <span class="px-2 py-1 rounded text-xs font-bold border" [class]="item.esFungible ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800'">
                                   {{ item.esFungible ? 'CONSUMIBLE' : 'DEVOLUTIVO' }}
                                </span>
                             }
                          </td>
                          <td class="p-4">
                              @if (item.status !== 'Disponible') {
                                 <span class="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase shadow-sm">{{ item.status }}</span>
                              } @else if (stock <= 0) {
                                 <span class="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold text-xs shadow-sm">AGOTADO</span>
                              } @else {
                                 <span class="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold text-xs shadow-sm flex w-fit items-center gap-1">
                                    <i class="bi bi-check-circle-fill text-[10px]"></i> {{ stock }} Disp.
                                 </span>
                              }
                          </td>
                          <td class="p-4 text-center">
                             <div class="flex items-center justify-center gap-2">
                                <button (click)="openDetails(item)" class="text-gray-400 hover:text-uah-blue dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 w-8 h-8 rounded-full transition-colors flex items-center justify-center">
                                   <i class="bi bi-info-circle-fill text-lg"></i>
                                </button>
                                
                                @if (isAdmin()) {
                                   <button (click)="loadEdit(item)" class="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 w-8 h-8 rounded-full transition-colors flex items-center justify-center"><i class="bi bi-pencil-fill"></i></button>
                                   <button (click)="deleteItem(item)" class="text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 w-8 h-8 rounded-full transition-colors flex items-center justify-center"><i class="bi bi-trash-fill"></i></button>
                                }

                                @if (item.status === 'Disponible' && stock > 0) {
                                    <div class="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700 shadow-sm ml-2 h-8">
                                       <input type="number" min="1" [max]="stock" #qtyInput [value]="1" class="w-12 text-center text-xs border-0 py-1 focus:ring-0 font-bold text-gray-700 dark:text-gray-200 bg-transparent">
                                       <button (click)="toggleSelection(item, +qtyInput.value)" 
                                          [class]="isSelected(item.id) ? 'bg-uah-blue text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-uah-gold hover:text-uah-blue'"
                                          class="border-l border-gray-300 dark:border-gray-500 px-3 h-full font-bold text-[10px] transition-colors">
                                          {{ isSelected(item.id) ? 'QUITAR' : 'PEDIR' }}
                                       </button>
                                    </div>
                                }
                             </div>
                          </td>
                       </tr>
                    }
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      <!-- Modal de Detalle -->
      @if (detailItem()) {
          <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-white/20 dark:border-gray-600 max-h-[90vh] flex flex-col relative">
                <!-- Contenido del Modal -->
                <div class="bg-uah-blue dark:bg-gray-900 p-6 text-white flex justify-between items-start shrink-0">
                    <div class="flex gap-6 items-center">
                        <div (click)="selectedImage.set(detailItem()?.imagenUrl || 'https://picsum.photos/seed/tech/400/400')" class="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg overflow-hidden group relative cursor-zoom-in">
                            <img [src]="detailItem()?.imagenUrl || 'https://picsum.photos/seed/tech/400/400'" alt="Vista previa del equipo" class="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-110">
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <i class="bi bi-search text-xl"></i>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold tracking-tight">{{ detailItem()?.marca }}</h3>
                            <p class="text-blue-200 text-lg">{{ detailItem()?.modelo }}</p>
                            <div class="mt-2 flex gap-2">
                                <span class="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">{{ detailItem()?.subCategoria }}</span>
                                <span class="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">{{ detailItem()?.tipoInventario }}</span>
                            </div>
                        </div>
                    </div>
                    <button (click)="closeDetails()" class="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><i class="bi bi-x-lg"></i></button>
                </div>
                <div class="p-6 overflow-y-auto custom-scrollbar">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        @if (isAdmin()) {
                            <div class="space-y-4">
                                <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                    <i class="bi bi-shield-lock"></i> Información de Origen
                                </h4>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">N° Factura</p>
                                        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ detailItem()?.numeroFactura || 'N/A' }}</p>
                                    </div>
                                    <div>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">Fecha Llegada</p>
                                        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ detailItem()?.fechaLlegada || 'N/A' }}</p>
                                    </div>
                                    <div>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">Cant. Llegada</p>
                                        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ detailItem()?.cantidadLlegada || '0' }}</p>
                                    </div>
                                    <div>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">Stock Actual</p>
                                        <p class="text-sm font-bold text-uah-blue dark:text-blue-400">{{ detailItem()?.stockActual }}</p>
                                    </div>
                                </div>
                            </div>
                        }
                        
                        <div class="space-y-4">
                            <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                <i class="bi bi-cpu"></i> Especificaciones
                            </h4>
                            <div class="grid grid-cols-2 gap-4">
                                @if (isAdmin()) {
                                    <div>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">S/N</p>
                                        <p class="text-sm font-mono text-gray-700 dark:text-gray-200">{{ detailItem()?.sn || 'N/A' }}</p>
                                    </div>
                                }
                                <div>
                                    <p class="text-[10px] text-gray-400 font-bold uppercase">Estado</p>
                                    <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ detailItem()?.status }}</p>
                                </div>
                                @if (detailItem()?.ram) {
                                    <div>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">RAM</p>
                                        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ detailItem()?.ram }}</p>
                                    </div>
                                }
                                @if (detailItem()?.rom) {
                                    <div>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">Almacenamiento</p>
                                        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ detailItem()?.rom }}</p>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    @if (isAdmin()) {
                        <h4 class="text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Historial de Reservas</h4>
                        <div class="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                            <table class="w-full text-xs text-left text-gray-700 dark:text-gray-300">
                                <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold uppercase text-[10px]">
                                    <tr><th class="p-3">Fecha</th><th class="p-3">Usuario</th><th class="p-3">Estado</th></tr>
                                </thead>
                                <tbody>
                                    @for (h of itemHistory(); track h.id) {
                                        <tr class="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td class="p-3">{{ h.fecha }}</td>
                                            <td class="p-3 font-medium">{{ h.nombreSolicitante }}</td>
                                            <td class="p-3">
                                                <span [class]="h.aprobada ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'" class="px-2 py-0.5 rounded-full font-bold">
                                                    {{ h.aprobada ? 'Aprobado' : 'Pendiente' }}
                                                </span>
                                            </td>
                                        </tr>
                                    }
                                    @if (itemHistory().length === 0) {
                                        <tr><td colspan="3" class="p-4 text-center text-gray-400 italic">Sin historial previo</td></tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    }

                    <!-- Sección de Reserva para Estudiantes/Docentes -->
                    <div class="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 shadow-inner">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h4 class="text-sm font-bold text-uah-blue dark:text-blue-300 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <i class="bi bi-calendar-check"></i> Disponibilidad & Reserva
                                </h4>
                                @let stock = getAvailableStock(detailItem()!);
                                
                                <div class="mt-3 grid grid-cols-2 gap-3">
                                    <div class="flex flex-col gap-1">
                                        <label for="resDateModal" class="text-[10px] font-bold text-gray-400 uppercase ml-1">Fecha de Reserva</label>
                                        <input id="resDateModal" type="date" [(ngModel)]="resDate" class="w-full py-1.5 px-3 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label for="resBlockModal" class="text-[10px] font-bold text-gray-400 uppercase ml-1">Bloque Horario</label>
                                        <select id="resBlockModal" [(ngModel)]="resBlock" class="w-full py-1.5 px-3 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
                                            <option>08:30 - 09:50</option>
                                            <option>10:00 - 11:20</option>
                                            <option>11:30 - 12:50</option>
                                            <option>13:00 - 14:20</option>
                                            <option>14:30 - 15:50</option>
                                            <option>16:00 - 17:20</option>
                                            <option>17:30 - 18:50</option>
                                        </select>
                                    </div>
                                </div>

                                @if (specificTimeError()) {
                                    <div class="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-[10px] text-red-600 dark:text-red-400 flex items-start gap-2">
                                        <i class="bi bi-exclamation-triangle-fill mt-0.5"></i>
                                        <span>{{ specificTimeError() }}</span>
                                    </div>
                                }
                                
                                @if (leadTimeNotice() && !isAdmin()) {
                                    <div class="mt-2 p-2 bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl text-[10px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                        <i class="bi bi-clock-history mt-0.5"></i>
                                        <span>{{ leadTimeNotice() }} Si tienes una emergencia, contacta al encargado.</span>
                                    </div>
                                }

                                <div class="mt-2 flex items-baseline gap-2">
                                    <span class="text-3xl font-black text-uah-blue dark:text-blue-400">{{ stock }}</span>
                                    <span class="text-xs font-bold text-gray-400 uppercase">Unidades Disponibles</span>
                                </div>
                            </div>

                            @if (stock > 0) {
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center border-2 border-uah-blue/20 dark:border-blue-400/20 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg h-14">
                                        <div class="px-3 text-[10px] font-bold text-gray-400 uppercase border-r border-gray-100 dark:border-gray-700">Cant.</div>
                                        <input type="number" min="1" [max]="stock" #modalQty [value]="1" class="w-16 text-center text-lg border-0 py-2 focus:ring-0 font-black text-uah-blue dark:text-blue-400 bg-transparent">
                                        <button (click)="toggleSelection(detailItem()!, +modalQty.value); closeDetails()" 
                                                [class]="isSelected(detailItem()!.id) ? 'bg-red-500 text-white' : 'bg-uah-blue text-white hover:bg-blue-700'"
                                                class="px-6 h-full font-bold text-xs transition-all flex items-center gap-2">
                                            <i [class]="isSelected(detailItem()!.id) ? 'bi bi-dash-circle' : 'bi bi-plus-circle'"></i>
                                            {{ isSelected(detailItem()!.id) ? 'QUITAR' : 'RESERVAR' }}
                                        </button>
                                    </div>
                                </div>
                            } @else {
                                <div class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl border border-red-100 dark:border-red-900/50 flex items-center gap-3">
                                    <i class="bi bi-exclamation-octagon-fill text-xl"></i>
                                    <span class="font-bold text-sm">No hay stock disponible para este horario.</span>
                                </div>
                            }
                        </div>
                        
                        <div class="mt-6 pt-4 border-t border-blue-100/50 dark:border-blue-800/50 flex flex-wrap justify-between items-center gap-4">
                            <p class="text-[10px] text-gray-400 italic max-w-sm">
                                * Las solicitudes de reserva quedan en estado <strong>pendiente</strong> hasta ser aprobadas por el administrador del laboratorio.
                            </p>
                            <a routerLink="/support" class="bg-white dark:bg-gray-800 text-uah-blue dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all border border-blue-100 dark:border-blue-800">
                                <i class="bi bi-chat-dots-fill"></i> ¿Necesitas ayuda? Enviar Mensaje
                            </a>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      }
      
      <!-- Vista Previa de Imagen en Pantalla Completa -->
      @if (selectedImage()) {
          <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fadeIn" (click)="selectedImage.set(null)">
              <button class="absolute top-6 right-6 text-white text-3xl hover:scale-110 transition-transform"><i class="bi bi-x-lg"></i></button>
              <img [src]="selectedImage()" class="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-zoomIn" (click)="$event.stopPropagation()">
          </div>
      }
    </div>
  `
})
export class InventoryComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  data = inject(DataService);

  /** Nombre del área (ej: FABLAB) */
  areaName = '';
  /** Nombre del laboratorio (ej: Electrónica) */
  labName = '';
  /** Modo de inventario actual */
  inventoryMode = signal<'Equipos' | 'Arduinos'>('Equipos');
  /** Término de búsqueda para filtrar items */
  searchTerm = signal('');
  /** Filtro de estado (Disponible, En Mantención, etc.) */
  statusFilter = signal('Todos');

  /** Fecha seleccionada para la reserva */
  resDate = signal(new Date().toISOString().split('T')[0]);
  /** Bloque horario seleccionado para la reserva */
  resBlock = signal('08:30 - 09:50');

  /** Aviso sobre el tiempo de antelación requerido para reservar */
  leadTimeNotice = computed(() => {
    if (this.isAdmin()) return null;
    return this.inventoryMode() === 'Equipos'
      ? 'Las reservas de equipos (Notebooks/Hackerlab) requieren 4 horas de antelación.'
      : 'Las reservas de insumos (Arduinos/Electrónica) requieren 48 horas de antelación.';
  });

  /** Error específico si no se cumple el tiempo de antelación */
  specificTimeError = computed(() => {
    return this.getLeadTimeError();
  });

  /** Lista de items seleccionados para reservar */
  selection = signal<{ id: number, qty: number }[]>([]);
  /** Item seleccionado para ver detalles */
  detailItem = signal<InventoryItem | null>(null);
  /** URL de la imagen seleccionada para vista previa */
  selectedImage = signal<string | null>(null);

  /** Historial de reservas del item seleccionado */
  itemHistory = computed(() => {
    const item = this.detailItem();
    if (!item) return [];
    return this.data.reservations().filter(r => r.equipoId === item.id).reverse();
  });

  /** Item en edición (para el formulario de administración) */
  editItem: Partial<InventoryItem> = {};

  /** Indica si el usuario actual tiene rol de administrador */
  isAdmin = computed(() => ['Admin', 'SuperUser'].includes(this.data.currentUser()?.rol || ''));

  /** Items filtrados por área, laboratorio, modo, estado y término de búsqueda */
  filteredItems = computed(() => {
    const all = this.data.inventory();
    console.log(`Filtrando para ${this.areaName} / ${this.labName} (${this.inventoryMode()}). Total items en DB: ${all.length}`);
    const contextItems = all.filter(i =>
      i.categoria === this.areaName &&
      i.subCategoria === this.labName &&
      i.tipoInventario === this.inventoryMode()
    );
    console.log(`Items encontrados para este contexto: ${contextItems.length}`);
    const filtered = this.statusFilter() === 'Todos' ? contextItems : contextItems.filter(i => i.status === this.statusFilter());
    return this.data.fuzzySearch(filtered, this.searchTerm(), ['marca', 'modelo', 'sn', 'status', 'so', 'ram', 'rom']);
  });

  /** Estados disponibles en el inventario actual para filtrar */
  availableStatuses = computed(() => {
    const items = this.data.inventory().filter(i =>
      i.categoria === this.areaName &&
      i.subCategoria === this.labName &&
      i.tipoInventario === this.inventoryMode()
    );
    const statuses = new Set(items.map(i => i.status));
    return Array.from(statuses).sort();
  });

  /** Cantidad total de items seleccionados */
  selectionCount = computed(() => this.selection().reduce((acc, curr) => acc + curr.qty, 0));

  constructor() {
    this.route.params.subscribe(p => {
      this.areaName = p['area'];
      this.labName = p['lab'];
      this.resetForm();
    });
  }

  /**
   * Cambia el modo de inventario (Equipos o Arduinos).
   * @param m Nuevo modo.
   */
  setMode(m: 'Equipos' | 'Arduinos') {
    this.inventoryMode.set(m);
    this.selection.set([]);
  }

  /** Navega de regreso a la selección de áreas. */
  goBack() {
    this.router.navigate(['/areas']);
  }

  /** Exporta los items filtrados a un archivo Excel. */
  exportData() {
    this.data.downloadExcel(this.filteredItems(), `Inventario_${this.labName}_${this.inventoryMode()}`);
  }

  /**
   * Calcula el stock disponible para un item en la fecha y bloque seleccionados.
   * @param item Item a consultar.
   * @returns Cantidad disponible.
   */
  getAvailableStock(item: InventoryItem): number {
    const reserved = this.data.reservations().filter(r =>
      !r.rechazada &&
      (r.equipoId === item.id) &&
      (item.esFungible ? !r.aprobada : (r.fecha === this.resDate() && r.bloque === this.resBlock()))
    ).reduce((sum, r) => sum + r.cantidad, 0);

    return item.stockActual - reserved;
  }

  /**
   * Verifica si se cumple el tiempo de antelación requerido para la reserva.
   * @returns Mensaje de error o null si es válido.
   */
  getLeadTimeError(): string | null {
    if (this.isAdmin()) return null;

    const dateStr = this.resDate();
    const blockStr = this.resBlock();

    const blockStarts: Record<string, string> = {
      '08:30 - 09:50': '08:30',
      '10:00 - 11:20': '10:00',
      '11:30 - 12:50': '11:30',
      '13:00 - 14:20': '13:00',
      '14:30 - 15:50': '14:30',
      '16:00 - 17:20': '16:00',
      '17:30 - 18:50': '17:30'
    };

    const startTime = blockStarts[blockStr];
    if (!startTime) return "Bloque horario no válido.";

    const reservationDateTime = new Date(`${dateStr}T${startTime}:00`);
    const now = new Date();

    if (reservationDateTime < now) {
      return "No puedes realizar reservas para fechas u horarios pasados.";
    }

    const diffMs = reservationDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (this.inventoryMode() === 'Equipos' && diffHours < 4) {
      return "Las reservas de equipos deben realizarse con al menos 4 horas de antelación.";
    }

    if (this.inventoryMode() === 'Arduinos' && diffHours < 48) {
      return "Las reservas de insumos (Arduinos) deben realizarse con al menos 48 horas de antelación.";
    }

    return null;
  }

  /** Verifica si un item está seleccionado. */
  isSelected(id: number) { return this.selection().some(s => s.id === id); }

  /** Alterna la selección de un item para reserva. */
  toggleSelection(item: InventoryItem, qty: number) {
    const exists = this.selection().find(s => s.id === item.id);
    if (exists) {
      this.selection.update(v => v.filter(s => s.id !== item.id));
    } else {
      this.selection.update(v => [...v, { id: item.id, qty }]);
    }
  }

  /**
   * Verifica si hay un conflicto con el horario de clases.
   * @param date Fecha.
   * @param block Bloque horario.
   * @returns Nombre de la asignatura en conflicto o null.
   */
  checkClassConflict(date: string, block: string): string | null {
    const d = new Date(date + 'T12:00:00');
    const dayIndex = d.getDay();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = days[dayIndex];

    const conflict = this.data.classSchedules().find(c =>
      c.lab === this.labName &&
      c.day === dayName &&
      c.block === block
    );

    return conflict ? conflict.subject : null;
  }

  /** Procesa la solicitud de reserva de los items seleccionados. */
  makeReservation() {
    const date = this.resDate();
    const block = this.resBlock();
    if (!date || !block) return;

    const leadTimeError = this.getLeadTimeError();
    if (leadTimeError) {
      Swal.fire({
        icon: 'error',
        title: 'Restricción de Tiempo',
        text: leadTimeError,
        showCancelButton: true,
        confirmButtonText: 'Entendido',
        cancelButtonText: 'Contactar Soporte',
        cancelButtonColor: '#003366',
        reverseButtons: true
      }).then((result: any) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
          this.router.navigate(['/support']);
        }
      });
      return;
    }

    const conflictSubject = this.checkClassConflict(date, block);
    if (conflictSubject) {
      Swal.fire({
        icon: 'warning',
        title: 'Bloque Reservado por Docencia',
        html: `No es posible reservar en este horario.<br>El laboratorio está ocupado por la clase:<br><b>${conflictSubject}</b>`,
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    this.selection().forEach(sel => {
      const item = this.data.inventory().find(i => i.id === sel.id);
      if (item) this.data.createReservation(item, date, block, sel.qty);
    });

    Swal.fire({
      icon: 'success', title: 'Solicitud Enviada',
      text: 'El encargado revisará tu solicitud.',
      timer: 2000, showConfirmButton: false
    });
    this.selection.set([]);
  }

  /** Abre el modal de detalles de un item. */
  openDetails(item: InventoryItem) { this.detailItem.set(item); }
  /** Cierra el modal de detalles. */
  closeDetails() { this.detailItem.set(null); }

  /** Reinicia el formulario de edición. */
  resetForm() {
    this.editItem = { status: 'Disponible', esFungible: false, stockActual: 1, stockMinimo: 1, numeroFactura: '', fechaLlegada: '', cantidadLlegada: 0 };
  }

  /** Carga un item en el formulario para su edición. */
  loadEdit(item: InventoryItem) { this.editItem = { ...item }; }

  /** Procesa la subida de una imagen para un item. */
  processImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.editItem.imagenUrl = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  /** Elimina la imagen del item en edición. */
  removeImage() { this.editItem.imagenUrl = ''; }

  /** Aplica la cantidad de llegada al stock actual. */
  applyArrival() {
    const qty = this.editItem.cantidadLlegada || 0;
    if (qty > 0) {
      this.editItem.stockActual = (this.editItem.stockActual || 0) + qty;
      Swal.fire({ icon: 'info', toast: true, position: 'top-end', title: `Sumado ${qty} al stock`, timer: 1500, showConfirmButton: false });
    }
  }

  /** Guarda o actualiza un item en el inventario. */
  saveItem() {
    const item = { ...this.editItem, categoria: this.areaName, subCategoria: this.labName, tipoInventario: this.inventoryMode() };
    if (item.id) {
      this.data.updateItem(item.id, item);
    } else {
      this.data.addItem(item);
    }
    this.resetForm();
    Swal.fire({ icon: 'success', toast: true, position: 'top-end', title: 'Guardado', timer: 1000, showConfirmButton: false });
  }

  /** Elimina un item del inventario con confirmación. */
  deleteItem(item: InventoryItem) {
    Swal.fire({
      title: '¿Eliminar Item?',
      text: `Estás a punto de borrar: ${item.marca} ${item.modelo}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.data.deleteItem(item.id);
        Swal.fire('Eliminado', 'El item ha sido eliminado del inventario.', 'success');
      }
    });
  }


  /** Descarga una plantilla de Excel con datos de ejemplo para el inventario. */
  downloadTemplate() {
    const template = [
      {
        Marca: 'Dell',
        Modelo: 'Latitude 5420',
        RAM: '16GB',
        ROM: '512GB SSD',
        SO: 'Windows 11',
        SN: 'ABC123XYZ',
        StockActual: 10,
        StockMinimo: 2,
        Status: 'Disponible',
        EsFungible: false,
        Factura: 'FAC-0001',
        FechaLlegada: '2026-03-01',
        CantLlegada: 10
      },
      {
        Marca: 'Arduino',
        Modelo: 'Uno R3',
        RAM: '',
        ROM: '',
        SO: '',
        SN: '',
        StockActual: 50,
        StockMinimo: 10,
        Status: 'Disponible',
        EsFungible: true,
        Factura: 'FAC-0002',
        FechaLlegada: '2026-03-01',
        CantLlegada: 50
      }
    ];
    this.data.downloadExcel(template, 'Plantilla_Inventario');
  }

  /** Importa datos desde un archivo Excel. */
  importExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const itemsToUpload = jsonData
        .filter((row: any) => row['Marca'] || row['Modelo'])
        .map((row: any) => {
          const parseNum = (val: any, def: number) => {
            if (val === undefined || val === null || val === '') return def;
            const n = parseInt(val, 10);
            return isNaN(n) ? def : n;
          };

          return {
            marca: String(row['Marca'] || ''),
            modelo: String(row['Modelo'] || ''),
            ram: String(row['RAM'] || ''),
            rom: String(row['ROM'] || ''),
            so: String(row['SO'] || ''),
            sn: String(row['SN'] || ''),
            stockActual: parseNum(row['StockActual'], 0),
            stockMinimo: parseNum(row['StockMinimo'], 5),
            status: String(row['Status'] || 'Disponible'),
            esFungible: row['EsFungible'] === true || row['EsFungible'] === 'true' || row['EsFungible'] === 'Sí' || row['EsFungible'] === 'VERDADERO',
            numeroFactura: String(row['Factura'] || ''),
            fechaLlegada: String(row['FechaLlegada'] || ''),
            cantidadLlegada: parseNum(row['CantLlegada'], 0),
            categoria: this.areaName,
            subCategoria: this.labName,
            tipoInventario: this.inventoryMode()
          };
        });

      console.log("Datos sanitizados para enviar:", itemsToUpload);

      if (itemsToUpload.length > 0) {
        this.data.addBulkItems(itemsToUpload);
        Swal.fire({
          icon: 'success',
          title: 'Carga Completada',
          text: `Se han procesado ${itemsToUpload.length} items.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
      event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  }
}
