
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
             <h2 class="text-2xl font-black text-uah-blue dark:text-blue-400 flex items-center gap-3 tracking-tighter uppercase">
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

               <button (click)="clearAll()" class="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors flex items-center gap-2" title="VACÍAR INVENTARIO (LIMPIEZA TOTAL)">
                  <i class="bi bi-trash3-fill"></i>
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
                 <input [(ngModel)]="editItem.marca" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-orange focus:border-transparent transition-all" placeholder="Ej: Dell">
              </div>
              <div>
                <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Modelo / Detalle</label>
                 <input [(ngModel)]="editItem.modelo" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-orange focus:border-transparent transition-all" placeholder="Ej: Latitude 5420">
              </div>
              <div>
                <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">S/N (Serial Number)</label>
                 <input [(ngModel)]="editItem.sn" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-orange focus:border-transparent transition-all" placeholder="Ej: ABC123XYZ">
              </div>
              <div>
                <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Rótulo / ID Físico</label>
                 <input [(ngModel)]="editItem.rotulo_ID" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-orange focus:border-transparent transition-all" placeholder="Ej: UAH-NOTE-001">
              </div>
              
              @if (inventoryMode() === 'Equipos') {
                 <div class="grid grid-cols-2 gap-3">
                   <div>
                     <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">RAM</label>
                     <input [(ngModel)]="editItem.ram" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all" placeholder="Ej: 16GB">
                   </div>
                   <div>
                     <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Disco (ROM)</label>
                     <input [(ngModel)]="editItem.rom" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all" placeholder="Ej: 512GB SSD">
                   </div>
                 </div>
                 <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Sistema Operativo</label>
                      <input [(ngModel)]="editItem.so" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all" placeholder="Ej: Windows 11 Pro">
                    </div>
                    <div>
                      <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Procesador</label>
                      <input [(ngModel)]="editItem.procesador" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all" placeholder="Ej: Intel Core i7">
                    </div>
                 </div>
                 <div>
                   <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Software Instalado</label>
                   <textarea [(ngModel)]="editItem.softwareInstalado" rows="2" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all" placeholder="Ej: Office 2021, AutoCAD 2024, Adobe CC"></textarea>
                 </div>
              } @else {
                  <div class="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-800">
                     <input type="checkbox" [(ngModel)]="editItem.esFungible" id="chkFungible" class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500">
                     <label for="chkFungible" class="text-xs font-bold text-purple-700 dark:text-purple-300 cursor-pointer italic">¿Es un insumo consumible (Fungible)?</label>
                  </div>
              }

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
                    <label class="text-xs font-bold text-red-600 dark:text-red-400 mb-1 block ml-1">S. Defectuoso</label>
                    <input type="number" [(ngModel)]="editItem.stockDefectuoso" class="w-full text-sm border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10 dark:text-white rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all">
                 </div>
              </div>
              <div>
                 <label class="text-xs font-bold text-uah-blue dark:text-blue-300 mb-1 block ml-1">Stock Mínimo (Alerta)</label>
                 <input type="number" [(ngModel)]="editItem.stockMinimo" class="w-full text-sm border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
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
                  <button (click)="saveItem()" class="w-full bg-uah-orange text-white font-black py-4 rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-500/20 text-sm flex justify-center items-center gap-2">
                     <i class="bi bi-save"></i> {{ editItem.id ? 'ACTUALIZAR RECURSO' : 'REGISTRAR EN INVENTARIO' }}
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
                    <input id="searchInventory" type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Marca, Modelo, SN..." class="w-full pl-9 py-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-uah-blue focus:border-transparent text-sm transition-all">
                 </div>
              </div>
              <div class="w-36">
                 <label for="resDateFilter" class="text-xs font-bold text-gray-400 uppercase ml-1">Fecha Reserva</label>
                  <input id="resDateFilter" type="date" [ngModel]="resDate()" (ngModelChange)="resDate.set($event)" class="w-full py-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-uah-blue focus:border-transparent">
              </div>
              <div class="w-36">
                 <label for="resBlockFilter" class="text-xs font-bold text-gray-400 uppercase ml-1">Bloque</label>
                  <select id="resBlockFilter" [ngModel]="resBlock()" (ngModelChange)="resBlock.set($event)" class="w-full py-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-uah-blue focus:border-transparent">
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
                  <button (click)="makeReservation()" class="bg-gradient-to-r from-uah-orange to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-black py-2.5 px-8 rounded-xl shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95 uppercase text-xs tracking-widest">
                     CONFIRMAR RESERVA ({{ selectionCount() }})
                  </button>
              }
           </div>

           <!-- La Grilla -->
           <div class="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm custom-scrollbar">
              <table class="w-full text-left text-sm">
                 <thead class="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-600 dark:text-gray-300 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                    <tr>
                       <th class="p-4 text-[10px] font-black uppercase text-gray-400">Rótulo / ID</th>
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
                          <td class="p-4 whitespace-nowrap">
                                @if (item.rotulo_ID) {
                                   <span class="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg font-black uppercase border border-blue-200 dark:border-blue-800 shadow-sm">
                                      {{ item.rotulo_ID }}
                                   </span>
                                } @else {
                                   <span class="text-[10px] text-gray-400 italic">Sin Rótulo</span>
                                }
                           </td>
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
                                 @if (item.softwareInstalado) {
                                    <div class="mt-1 flex items-center gap-1 text-[10px] text-uah-blue dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-lg w-fit max-w-xs truncate" title="{{ item.softwareInstalado }}">
                                       <i class="bi bi-cpu"></i> {{ item.softwareInstalado }}
                                    </div>
                                 }
                             } @else {
                                <span class="px-2 py-1 rounded text-xs font-bold border" [class]="item.esFungible ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800'">
                                   {{ item.esFungible ? 'CONSUMIBLE' : 'DEVOLUTIVO' }}
                                </span>
                             }
                          </td>
                          <td class="p-4">
                              <div class="flex flex-col gap-2">
                                 @let available = stock;
                                 @let loaned = getLoanedCount(item);
                                 @let defective = item.stockDefectuoso || 0;

                                 <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span class="text-xs font-bold text-gray-700 dark:text-gray-200">{{ available }} Disponibles</span>
                                 </div>
                                 <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ loaned }} en Préstamo</span>
                                 </div>
                                 <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ defective }} Defectuosos</span>
                                 </div>
                              </div>
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
                                       <input type="number" min="1" [max]="stock" #qtyInput [value]="1" class="w-12 text-center text-xs border-0 py-1 focus:ring-0 font-bold text-gray-700 dark:text-gray-200">
                                       <button (click)="toggleSelection(item, +qtyInput.value)" 
                                          [class]="isSelected(item.id) ? 'bg-uah-blue text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-uah-orange hover:text-white border-uah-orange'"
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
                            <img [src]="detailItem()?.imagenUrl || 'https://picsum.photos/seed/tech/400/400'" class="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-110">
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <i class="bi bi-search text-xl"></i>
                            </div>
                        </div>
                        <div>
                             <h3 class="text-2xl font-black tracking-tighter uppercase text-white">{{ detailItem()?.marca }}</h3>
                             <p class="text-blue-100/80 text-lg font-medium">{{ detailItem()?.modelo }}</p>
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
                                @if (detailItem()?.so) {
                                    <div>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">Sistema Operativo</p>
                                        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ detailItem()?.so }}</p>
                                    </div>
                                }
                                @if (detailItem()?.procesador) {
                                    <div>
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">Procesador</p>
                                        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ detailItem()?.procesador }}</p>
                                    </div>
                                }
                                @if (detailItem()?.softwareInstalado) {
                                    <div class="col-span-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">Software Instalado</p>
                                        <p class="text-xs font-medium text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">{{ detailItem()?.softwareInstalado }}</p>
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
                                        <input id="resDateModal" type="date" [ngModel]="resDate()" (ngModelChange)="resDate.set($event)" class="w-full py-1.5 px-3 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label for="resBlockModal" class="text-[10px] font-bold text-gray-400 uppercase ml-1">Bloque Horario</label>
                                        <select id="resBlockModal" [ngModel]="resBlock()" (ngModelChange)="resBlock.set($event)" class="w-full py-1.5 px-3 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-uah-blue focus:border-transparent transition-all">
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
    const contextItems = all.filter(i => {
      const isCorrectArea = i.categoria?.toUpperCase() === this.areaName?.toUpperCase();
      const isCorrectType = i.tipoInventario === this.inventoryMode();
      
      // Lógica de compartido para FABLAB Notebooks
      if (this.areaName?.toUpperCase() === 'FABLAB' && 
          ['BIOMATERIALES', 'TEXTIL', 'FABRICACIÓN DIGITAL'].includes(this.labName?.toUpperCase())) {
        return isCorrectArea && isCorrectType && 
               (i.subCategoria?.toUpperCase() === this.labName?.toUpperCase() || i.subCategoria?.toUpperCase() === 'NOTEBOOK');
      }

      return isCorrectArea && isCorrectType && i.subCategoria?.toUpperCase() === this.labName?.toUpperCase();
    });
    console.log(`Items encontrados para este contexto: ${contextItems.length}`);
    let filtered = this.statusFilter() === 'Todos' ? contextItems : contextItems.filter(i => i.status === this.statusFilter());

    // Visibilidad: Alumnos/Docentes solo ven lo "Disponible"
    if (!this.isAdmin()) {
      filtered = filtered.filter(i => i.status === 'Disponible');
    }

    return this.data.fuzzySearch(filtered, this.searchTerm(), ['marca', 'modelo', 'sn', 'status', 'so', 'ram', 'rom', 'softwareInstalado', 'rotulo_ID']);
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
    this.router.navigate(['/areas'], { queryParams: { area: this.areaName } });
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

    return item.stockActual - reserved - (item.stockDefectuoso || 0);
  }

  /**
   * Obtiene la cantidad de unidades actualmente en préstamo (aprobadas y no devueltas aún).
   */
  getLoanedCount(item: InventoryItem): number {
    return this.data.reservations().filter(r =>
      r.equipoId === item.id &&
      r.aprobada &&
      !r.rechazada &&
      r.devuelto < r.cantidad
    ).reduce((sum, r) => sum + (r.cantidad - (r.devuelto || 0)), 0);
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

    if (this.inventoryMode() === 'Equipos' && diffHours < 12) {
      return "Las reservas de equipos deben realizarse con al menos 12 horas de antelación.";
    }

    if (this.inventoryMode() === 'Arduinos' && diffHours < 12) {
      return "Las reservas de insumos y arduinos deben realizarse con al menos 12 horas de antelación.";
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

    // 12h Lead Time Restriction for Students/Docents
    if (!this.isAdmin()) {
      const blockStart = block.split(' - ')[0]; // HH:mm
      const reservationDateTime = new Date(`${date}T${blockStart}:00`);
      const now = new Date();
      const diffMs = reservationDateTime.getTime() - now.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);

      if (diffMs < 0) {
        Swal.fire('Error', 'No puedes reservar en tiempo pasado.', 'error');
        return;
      }
      if (diffHrs < 12) {
        Swal.fire('Restricción', 'Las reservas deben realizarse con al menos 12 horas de antelación.', 'warning');
        return;
      }
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
    this.editItem = { 
      status: 'Disponible', 
      esFungible: false, 
      stockActual: 1, 
      stockMinimo: 1, 
      numeroFactura: '', 
      fechaLlegada: '', 
      cantidadLlegada: 0, 
      sn: '', rotulo_ID: '', ram: '', rom: '', so: '', procesador: '', softwareInstalado: '' 
    };
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

  /** Descarga una plantilla de Excel profesional según el modo. */
  downloadTemplate() {
    let template: any[] = [];
    
    if (this.inventoryMode() === 'Equipos') {
      template = [
        {
          UBICACIÓN: 'FABLAB',
          'SUB-LAB_ID': 'FABLAB',
          MARCA: 'LENOVO',
          MODELO: 'THINKPAD L14',
          SN: 'SN-001X',
          STATUS: 'Disponible',
          SO: 'Windows 11 Pro',
          RAM: '16GB',
          ROM: '512GB SSD',
          PROCESADOR: 'Intel Core i7 11th Gen',
          StockActual: 10,
          StockMinimo: 2,
          Factura: 'FAC-001',
          FechaLlegada: '2024-03-01',
          CantLlegada: 10,
          'ADOBE ACROBAT': 'X',
          'AUTODESK': 'X',
          'CHROME': 'X'
        }
      ];
    } else {
      template = [
        {
          LABORATORIO: 'DESARROLLO TECNOLOGICO',
          ITEM: 'MATERIAL',
          CANTIDAD: 25,
          DESCRIPCION: 'PINZAS MEDEL 170 1MM',
          UBICACIÓN: 'BODEGA',
          'FIJO/FUNGIBLE': 'FIJO',
          OBS: 'Sin observaciones',
          StockMinimo: 5,
          Factura: 'FAC-999',
          FechaLlegada: '2024-03-01'
        }
      ];
    }
    this.data.downloadExcel(template, `Plantilla_${this.inventoryMode()}`);
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
        .map((row: any) => {
          const getV = (prefixes: string[]) => {
            const keys = Object.keys(row);
            const upperPrefixes = prefixes.map(p => p.toUpperCase());
            // Prioridad 1: Match exacto
            const exact = keys.find(k => upperPrefixes.includes(k.toUpperCase()));
            if (exact) return String(row[exact] || '').trim();
            // Prioridad 2: Match parcial (soporta truncados como UBICACIÓ -> UBICACIÓN)
            const partial = keys.find(k => {
              const uk = k.toUpperCase();
              return upperPrefixes.some(up => up.includes(uk) || uk.includes(up));
            });
            return partial ? String(row[partial] || '').trim() : '';
          };
          
          const getNum = (prefixes: string[], def: number) => {
            const val = getV(prefixes);
            if (!val) return def;
            const n = parseInt(val.replace(/[^\d]/g, ''), 10);
            return isNaN(n) ? def : n;
          };

          const normalize = (s: string) => s.toUpperCase().replace(/\s+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          // 1. Determinar Categoría y Ruteo Dinámico
          let cat = this.areaName;
          let subCat = this.labName;
          let tipInv = this.inventoryMode();

          const uH = normalize(getV(['UBICACIÓN', 'UBICACION', 'LABORATORIO', 'AREA']));
          const sH = normalize(getV(['SUB-LAB_ID', 'ID', 'ROTULO', 'UBICACION', 'LAB']));
          
          // Detección de Formato (Movida arriba para ruteo)
          const marca = getV(['MARCA', 'BRAND']);
          const procesador = getV(['PROCESADOR', 'CPU']);
          const ram = getV(['RAM', 'MEMORIA']);
          const isNotebook = !!(marca || procesador || ram || getV(['SO', 'SISTEMA', 'SN', 'S/N']));

          let matched = false;
          // Buscar en la jerarquía oficial
          for (const [area, labs] of Object.entries(this.data.hierarchy)) {
            const nArea = normalize(area);
            if (uH.includes(nArea) || sH.includes(nArea)) {
              cat = area;
              const sub = labs.find(l => uH.includes(normalize(l)) || sH.includes(normalize(l)));
              if (sub) {
                subCat = sub;
              } else if (cat === 'FABLAB' && isNotebook) {
                subCat = 'NOTEBOOK';
              }
              matched = true;
              break;
            }
          }

          if (!matched) {
            if (uH.includes('HACKERLAB') || sH.includes('HACKERLAB')) {
              cat = 'LAB INFORMATICA'; subCat = 'HACKERLAB';
            } else if (uH.includes('INFORMATICA') || uH.includes('TECNOLOGICO') || sH.includes('DESARROLLO')) {
              cat = 'LAB INFORMATICA'; subCat = 'DESARROLLO TECNOLOGICO';
            }
          }

          if (cat === 'FABLAB' && isNotebook && subCat === 'FABLAB') {
            subCat = 'NOTEBOOK';
          }
          
          console.log(`Ruteo: Cat=${cat}, SubCat=${subCat}, Fila=${uH}|${sH}`);

          // 2. Mapeo de Campos según Formato
          if (isNotebook) {
            const softwareList: string[] = [];
            const standardKeys = [
              'UBICACIÓN', 'UBICACIÓ', 'UBICACION', 'SUB-LAB_ID', 'ROTULO_ID', 'ROTULO', 'ID', 'RÓTULO',
              'MARCA', 'MODELO', 'SN', 'STATUS', 'STADO', 'ESTADO', 'SO', 'RAM', 'ROM', 'PROCESADOR', 'CPU',
              'STOCK', 'ACTUAL', 'MINIMO', 'FACTURA', 'LLEGADA', 'FECHA', 'CANT'
            ];

            Object.keys(row).forEach(key => {
              const val = String(row[key]);
              if (val.toUpperCase() === 'X' || val === 'true' || row[key] === true) {
                const upperKey = key.toUpperCase();
                if (!standardKeys.some(sk => upperKey.includes(sk))) {
                  softwareList.push(key);
                }
              }
            });

            return {
              marca: marca || 'Genérico',
              modelo: getV(['MODELO', 'MODEL', 'DESCRIPCION']),
              ram: ram,
              rom: getV(['ROM', 'DISCO', 'HDD', 'SSD']),
              so: getV(['SO', 'SISTEMA', 'OPERATIVO']),
              sn: getV(['SN', 'S/N', 'SERIAL']),
              rotulo_ID: getV(['SUB-LAB_ID', 'ROTULO_ID', 'ROTULO', 'ID', 'RÓTULO']),
              procesador: procesador,
              softwareInstalado: softwareList.join('\n'),
              stockActual: getNum(['ACTUAL', 'STOCKACTUA', 'CANTIDAD'], 1),
              stockMinimo: getNum(['MINIMO', 'STOCKMINIR'], 0),
              status: (v => {
                const s = v.toUpperCase().replace('_', ' ');
                if (s.includes('DEFECT') || s.includes('FALLA') || s.includes('MALO')) return 'Defectuoso';
                if (s.includes('NO DISPONIB') || s.includes('MANTEN') || s.includes('NO_')) return 'No Disponible';
                return 'Disponible';
              })(getV(['STATUS', 'STADO', 'ESTADO'])),
              esFungible: false,
              numeroFactura: getV(['FACTURA', 'N* FACTURA']),
              fechaLlegada: getV(['FECHALLEG', 'LLEGADA', 'FECHA']),
              cantidadLlegada: getNum(['CANTLLEGA', 'LLEGADA'], 0),
              categoria: cat,
              subCategoria: subCat,
              tipoInventario: tipInv
            };
          } else {
            // Formato Insumo / Genérico
            const statusV = getV(['STATUS', 'STADO', 'ESTADO']);
            const mappedStatus = (v: string) => {
              const s = v.toUpperCase().replace('_', ' ');
              if (s.includes('DEFECT') || s.includes('FALLA')) return 'Defectuoso';
              if (s.includes('NO DISPONIB') || s.includes('MANTEN') || s.includes('NO_')) return 'No Disponible';
              return 'Disponible';
            };

            return {
              marca: marca || 'Genérico',
              modelo: getV(['DESCRIPCION', 'ITEM', 'MODELO']),
              status: mappedStatus(statusV),
              esFungible: getV(['FUNGIBLE', 'TIPO']).toUpperCase().includes('FUNGIBLE'),
              stockActual: getNum(['CANTIDAD', 'ACTUAL', 'STOCK'], 0),
              stockMinimo: getNum(['MINIMO', 'STOCKMIN'], 0),
              numeroFactura: getV(['FACTURA']),
              fechaLlegada: getV(['FECHA', 'LLEGADA']),
              categoria: cat,
              subCategoria: subCat,
              tipoInventario: cat === 'FABLAB' && tipInv === 'Equipos' ? 'Equipos' : 'Arduinos',
              sn: getV(['OBS', 'SN', 'SERIAL', 'OBSERVACION']),
              rotulo_ID: getV(['SUB-LAB_ID', 'ROTULO_ID', 'ROTULO', 'ID', 'RÓTULO', 'UBICACIÓN'])
            };
          }
        })
        .filter((row: any) => row.modelo || row.marca);

      console.log("Datos sanitizados para enviar:", itemsToUpload);

      if (itemsToUpload.length > 0) {
        this.data.addBulkItems(itemsToUpload);
        Swal.fire({
          icon: 'success',
          title: 'Carga Completada',
          text: `Se han procesado ${itemsToUpload.length} items ruteados correctamente.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
      event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  }

  /** Función para vaciar todo el inventario */
  async clearAll() {
    Swal.fire({
      title: '¿VACIAR TODO EL INVENTARIO?',
      text: "Esta acción borrará TODOS los equipos e insumos de la base de datos. ¡No se puede deshacer!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'SÍ, BORRAR TODO',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const ok = await this.data.clearAllInventory();
        if (ok) {
          Swal.fire('Vaciado', 'El inventario ha sido limpiado por completo.', 'success');
        } else {
          Swal.fire('Error', 'No se pudo vaciar el inventario.', 'error');
        }
      }
    });
  }
}
