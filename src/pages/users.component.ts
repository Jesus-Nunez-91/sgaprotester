import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { DataService, User } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

declare const Swal: any;
declare const XLSX: any;

@Component({
   selector: 'app-users',
   standalone: true,
   imports: [CommonModule, FormsModule, RouterLink],
   template: `
    <div class="animate-fadeIn pb-10">
        <!-- Header -->
        <div class="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/40 dark:border-gray-700 sticky top-4 z-30 transition-colors">
            <div>
                <h2 class="text-3xl font-black text-uah-blue dark:text-gray-100 flex items-center gap-3 tracking-tighter uppercase">
                    <span class="w-12 h-12 rounded-2xl bg-uah-orange flex items-center justify-center text-white shadow-lg text-xl">
                        <i class="bi bi-shield-lock"></i>
                    </span>
                    Gestión de Usuarios
                </h2>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-16">Administración de credenciales y roles de acceso.</p>
            </div>
            <a routerLink="/areas" class="mt-4 md:mt-0 group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:text-uah-blue dark:hover:text-white hover:border-uah-blue px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <i class="bi bi-arrow-left group-hover:-translate-x-1 transition-transform"></i> Volver al Menú
            </a>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <!-- Form -->
           <div class="lg:col-span-4 h-fit">
               <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                  <div class="absolute top-0 left-0 w-full h-2 bg-uah-orange"></div>
                  
                  <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                     {{ editUser.id ? 'Editar Perfil' : 'Nuevo Registro' }}
                  </h3>

                  <div class="space-y-5">
                     <div class="group">
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">Nombre Completo</label>
                        <div class="relative">
                            <i class="bi bi-person absolute left-4 top-3.5 text-gray-400 group-focus-within:text-uah-orange transition-colors"></i>
                            <input [(ngModel)]="editUser.nombreCompleto" class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:border-uah-orange focus:ring-4 focus:ring-uah-orange/10 dark:text-white transition-all text-sm font-bold outline-none" placeholder="Ej: Juan Pérez">
                        </div>
                     </div>
                     
                     <div class="group">
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">RUT</label>
                        <div class="relative">
                            <i class="bi bi-card-heading absolute left-4 top-3.5 text-gray-400 group-focus-within:text-uah-orange transition-colors"></i>
                            <input [(ngModel)]="editUser.rut" class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:border-uah-orange focus:ring-4 focus:ring-uah-orange/10 dark:text-white transition-all text-sm font-bold outline-none" placeholder="Ej: 12345678-9">
                        </div>
                     </div>

                     <div class="group">
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">Correo Institucional</label>
                        <div class="relative">
                            <i class="bi bi-envelope absolute left-4 top-3.5 text-gray-400 group-focus-within:text-uah-orange transition-colors"></i>
                            <input [(ngModel)]="editUser.correo" class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:border-uah-orange focus:ring-4 focus:ring-uah-orange/10 dark:text-white transition-all text-sm font-bold outline-none" placeholder="nombre@uah.cl">
                        </div>
                     </div>

                     <div class="group">
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">Rol del Usuario</label>
                        <div class="relative">
                            <i class="bi bi-award absolute left-4 top-3.5 text-gray-400 group-focus-within:text-uah-orange transition-colors"></i>
                            <select [(ngModel)]="editUser.rol" class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:border-uah-orange focus:ring-4 focus:ring-uah-orange/10 dark:text-white transition-all text-sm font-bold outline-none appearance-none">
                                <option value="Alumno">Alumno</option>
                                <option value="Docente">Docente</option>
                                <option value="Acad_Labs">Acad_Labs</option>
                                <option value="Admin_Acade">Admin_Acade</option>
                                <option value="Admin_Labs">Admin_Labs</option>
                                <option value="SuperUser">SuperUser</option>
                            </select>
                            <i class="bi bi-chevron-down absolute right-4 top-4 text-xs text-gray-400 pointer-events-none"></i>
                        </div>
                     </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div class="group">
                           <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">Carrera</label>
                           <div class="relative">
                               <input [(ngModel)]="editUser.carrera" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:border-uah-orange focus:ring-4 focus:ring-uah-orange/10 dark:text-white transition-all text-sm font-bold outline-none" placeholder="Ej: Informática">
                           </div>
                        </div>
                        <div class="group">
                           <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">Año</label>
                           <div class="relative">
                               <input [(ngModel)]="editUser.anioIngreso" type="number" class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:border-uah-orange focus:ring-4 focus:ring-uah-orange/10 dark:text-white transition-all text-sm font-bold outline-none" placeholder="2024">
                           </div>
                        </div>
                      </div>

                      <div class="group">
                         <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">Contraseña (Opcional)</label>
                         <div class="relative">
                             <i class="bi bi-key absolute left-4 top-3.5 text-gray-400 group-focus-within:text-uah-orange transition-colors"></i>
                             <input [(ngModel)]="editUser.password" type="password" class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:border-uah-orange focus:ring-4 focus:ring-uah-orange/10 dark:text-white transition-all text-sm font-bold outline-none" placeholder="•••••••">
                         </div>
                      </div>
                     
                     <div class="pt-4 flex flex-col gap-3">
                          <button (click)="save()" class="w-full bg-uah-blue hover:bg-blue-800 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all flex justify-center items-center gap-2 active:scale-95 uppercase text-xs tracking-widest">
                             <i class="bi bi-check-circle-fill"></i> {{ editUser.id ? 'ACTUALIZAR USUARIO' : 'REGISTRAR USUARIO' }}
                          </button>
                          <button (click)="reset()" class="w-full bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-xs flex items-center justify-center gap-2">
                             <i class="bi bi-x-lg"></i> CANCELAR
                          </button>
                     </div>
                  </div>
               </div>
           </div>

           <!-- List -->
           <div class="lg:col-span-8">
              <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden h-full">
                  <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-900/50">
                     <div class="flex items-center gap-4 w-full sm:w-auto">
                         <div>
                            <h4 class="font-black text-uah-blue dark:text-white text-lg tracking-tight uppercase">Directorio de Usuarios</h4>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total: {{ data.users().length }} registros</p>
                         </div>
                     </div>
                     
                      <div class="flex flex-wrap gap-2 items-center">
                         <button (click)="downloadTemplate()" class="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-200 transition-colors flex items-center gap-2" title="Descargar Plantilla">
                            <i class="bi bi-file-earmark-arrow-down-fill"></i>
                         </button>
                                                  <div class="relative">
                             <button (click)="triggerFileInput()" class="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-200 transition-colors flex items-center gap-2" title="Carga Masiva Usuarios">
                                <i class="bi bi-file-earmark-arrow-up-fill"></i>
                             </button>
                             <input type="file" #fileInput (change)="importExcel($event)" accept=".xlsx,.xls" class="hidden">
                          </div>

                         <div class="relative w-full sm:w-64">
                             <i class="bi bi-search absolute left-3 top-2.5 text-gray-400"></i>
                             <input [(ngModel)]="searchTerm" class="w-full pl-9 py-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-uah-orange focus:border-transparent text-sm dark:text-white transition-all" placeholder="Buscar usuario...">
                         </div>
                      </div>
                  </div>

                  <div class="overflow-x-auto flex-1">
                      <table class="w-full text-left text-sm">
                         <thead class="bg-gray-50 dark:bg-gray-900 text-gray-400 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                            <tr>
                               <th class="p-5 pl-6">Usuario</th>
                               <th class="p-5">RUT</th>
                               <th class="p-5">Carrera / Año</th>
                               <th class="p-5">Rol & Permisos</th>
                               <th class="p-5 text-center">Acciones</th>
                            </tr>
                         </thead>
                         <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
                            @for (u of filteredUsers(); track u.id) {
                               <tr class="hover:bg-uah-blue/5 dark:hover:bg-uah-blue/10 transition-colors group">
                                  <td class="p-5 pl-6">
                                     <div class="flex items-center gap-4">
                                         <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-uah-blue font-black flex items-center justify-center shadow-sm group-hover:bg-uah-blue group-hover:text-white transition-all">
                                             {{ u.nombreCompleto.charAt(0) }}
                                         </div>
                                         <div>
                                             <div class="font-bold text-gray-800 dark:text-gray-200">{{ u.nombreCompleto }}</div>
                                             <div class="text-xs text-gray-400">{{ u.correo }}</div>
                                         </div>
                                     </div>
                                  </td>
                                  <td class="p-5">
                                      <div class="flex items-center gap-2">
                                          <i class="bi bi-person-vcard text-gray-300 dark:text-gray-600"></i>
                                          <span class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ u.rut }}</span>
                                      </div>
                                  </td>
                                  <td class="p-5">
                                      <div class="flex flex-col">
                                          <span class="text-xs font-bold text-gray-700 dark:text-gray-300">{{ u.carrera || 'N/A' }}</span>
                                          <span class="text-[10px] text-gray-400">{{ u.anioIngreso || '-' }}</span>
                                      </div>
                                  </td>
                                  <td class="p-5">
                                     <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border" 
                                           [ngClass]="{
                                              'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900': u.rol === 'SuperUser',
                                              'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900': u.rol === 'Admin_Labs',
                                              'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900': u.rol === 'Admin_Acade',
                                              'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900': u.rol === 'Acad_Labs',
                                              'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900': u.rol === 'Docente',
                                              'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-600': u.rol === 'Alumno'
                                            }">
                                        <span class="w-1.5 h-1.5 rounded-full" 
                                              [ngClass]="{
                                                'bg-red-500': u.rol === 'SuperUser',
                                                'bg-blue-500': u.rol === 'Admin_Labs',
                                                'bg-emerald-500': u.rol === 'Admin_Acade',
                                                'bg-purple-500': u.rol === 'Acad_Labs',
                                                'bg-amber-500': u.rol === 'Docente',
                                                'bg-gray-400': u.rol === 'Alumno'
                                              }"></span>
                                        {{ u.rol }}
                                     </span>
                                  </td>
                                  <td class="p-5 text-center">
                                     <div class="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                         <button (click)="edit(u)" class="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-center shadow-sm" title="Editar">
                                            <i class="bi bi-pencil-square"></i>
                                         </button>
                                         <button (click)="del(u)" class="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all flex items-center justify-center shadow-sm" title="Eliminar">
                                            <i class="bi bi-trash"></i>
                                         </button>
                                     </div>
                                  </td>
                               </tr>
                            }
                            @if (filteredUsers().length === 0) {
                                <tr>
                                    <td colspan="5" class="p-8 text-center text-gray-400">
                                        No se encontraron usuarios que coincidan con "{{ searchTerm() }}".
                                    </td>
                                </tr>
                            }
                         </tbody>
                      </table>
                  </div>
              </div>
           </div>
        </div>
    </div>
  `
})
export class UsersComponent {
   @ViewChild('fileInput') fileInput!: ElementRef;
   data = inject(DataService);
   editUser: Partial<User> = { rol: 'Alumno' };
   searchTerm = signal('');

   filteredUsers = computed(() => {
      return this.data.fuzzySearch(this.data.users(), this.searchTerm(), ['nombreCompleto', 'correo', 'rut', 'rol']);
   });

   reset() { this.editUser = { rol: 'Alumno' }; }

   triggerFileInput() {
      this.fileInput.nativeElement.click();
   }

   edit(u: User) {
      this.editUser = { ...u, password: '' }; // Clear password for security/UI
      window.scrollTo({ top: 0, behavior: 'smooth' });
   }

   async save() {
      if (!this.editUser.correo || !this.editUser.nombreCompleto) {
         Swal.fire({ icon: 'error', title: 'Faltan Datos', text: 'Complete los campos obligatorios para continuar.', confirmButtonColor: '#003366' });
         return;
      }

      if (this.editUser.id) {
         await this.data.updateUser(this.editUser.id, this.editUser);
      } else {
         await this.data.addUser(this.editUser);
      }
      this.reset();
      Swal.fire({
         icon: 'success',
         title: '<h3 class="text-uah-blue font-black uppercase">Usuario Guardado</h3>',
         text: 'El registro se ha actualizado correctamente.',
         toast: true,
         position: 'top-end',
         showConfirmButton: false,
         timer: 2000
      });
   }

   async del(u: User) {
      Swal.fire({
         title: '<h3 class="text-uah-blue font-black uppercase tracking-tighter">¿Eliminar Usuario?</h3>',
         text: `Se revocará permanentemente el acceso a ${u.nombreCompleto}.`,
         icon: 'warning',
         showCancelButton: true,
         confirmButtonColor: '#d33',
         cancelButtonColor: '#003366',
         confirmButtonText: 'Sí, eliminar',
         cancelButtonText: 'Cancelar'
      }).then(async (result: any) => {
         if (result.isConfirmed) {
            await this.data.deleteUser(u.id);
            Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El usuario ha sido removido del sistema.', timer: 1500, showConfirmButton: false });
         }
      });
   }

   /** Descarga una plantilla de Excel con datos de ejemplo para usuarios. */
   downloadTemplate() {
      const template = [
         {
            'Nombre Completo': 'Juan Pérez',
            'RUT': '12.345.678-9',
            'Correo': 'juan.perez@uahurtado.cl',
            'Carrera': 'Ingeniería',
            'Año': 2024,
            'Rol': 'Alumno'
         },
         {
            'Nombre Completo': 'Maria Garcia',
            'RUT': '9.876.543-2',
            'Correo': 'mgarcia@uahurtado.cl',
            'Carrera': 'Derecho',
            'Año': 2023,
            'Rol': 'Admin_Labs'
         }
      ];
      this.data.downloadExcel(template, 'Plantilla_Usuarios');
   }

   /** Importa usuarios desde un archivo Excel. */
   async importExcel(event: any) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e: any) => {
         try {
            const data = new Uint8Array(e.target.result);
            const workbook = (window as any).XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = (window as any).XLSX.utils.sheet_to_json(worksheet);

            const usersToUpload = jsonData.map((row: any) => ({
               nombreCompleto: row['Nombre Completo'] || row['Nombre'] || '',
               rut: String(row['RUT'] || ''),
               correo: row['Correo'] || row['Email'] || '',
               carrera: row['Carrera'] || '',
               anioIngreso: Number(row['Año'] || row['Anio'] || 0),
               rol: row['Rol'] || 'Alumno'
            })).filter(u => u.correo && u.nombreCompleto);

            if (usersToUpload.length > 0) {
               await this.data.addBulkUsers(usersToUpload);
               Swal.fire({
                  icon: 'success',
                  title: '<h3 class="text-uah-blue font-black uppercase">Carga Masiva Exitosa</h3>',
                  text: `Se han procesado ${usersToUpload.length} usuarios nuevos.`,
                  timer: 3000,
                  showConfirmButton: false
               });
            } else {
               Swal.fire({ icon: 'warning', title: 'Sin Registros', text: 'No se encontraron datos válidos en el archivo.', confirmButtonColor: '#003366' });
            }
         } catch (err) {
            Swal.fire('Error', 'No se pudo procesar el archivo Excel.', 'error');
            console.error(err);
         }
         event.target.value = '';
      };
      reader.readAsArrayBuffer(file);
   }
}