import { Component, inject, signal } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="background-color: #000; min-height: 100vh; font-family: 'Inter', sans-serif; color: white; overflow-x: hidden;">
      
      <!-- HERO SECTION: 100% INMERSIVA -->
      <div style="position: relative; width: 100%; height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; overflow: hidden; padding-top: 60px;">
        
        <!-- Imagen de Fondo con Tratamiento de Contraste -->
        <div style="position: absolute; inset: 0; z-index: 0;">
          <img 
            src="assets/images/hero-areas.png" 
            alt="Fondo interactivo de los Laboratorios de Ingeniería UAH"
            style="width: 100%; height: 100%; object-fit: cover; object-position: center; filter: brightness(0.6);"
          >
          <!-- Degradado inferior para suavizar la transicion a las tarjetas -->
          <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 50%, #000 100%);"></div>
        </div>

        <!-- Marca "RESERVA" (Posicionada arriba para no tapar el letrero de la imagen) -->
        <div style="position: relative; z-index: 10; text-align: center; animate: fade-in 1s ease-out;">
          <div style="padding: 20px 60px; border-radius: 30px; background: rgba(0,0,0,0.3); backdrop-blur: 10px; border: 1px solid rgba(255,255,255,0.1);">
            <h1 style="font-size: clamp(40px, 8vw, 100px); font-weight: 950; font-style: italic; color: #FFF; margin: 0; letter-spacing: -4px; text-shadow: 0 10px 30px rgba(0,0,0,0.5); line-height: 0.9;">
              LABORATORIOS <span style="color: #f97316;">UAH</span>
            </h1>
            <div style="height: 6px; width: 100px; background: #f97316; margin: 15px auto; border-radius: 10px; box-shadow: 0 0 20px rgba(249,115,22,0.8);"></div>
            <p style="font-size: clamp(10px, 2vw, 16px); font-weight: 900; letter-spacing: 8px; color: #FFF; text-transform: uppercase;">SGA FIN - Sistema de Gestión Académica</p>
          </div>
        </div>
      </div>

      <!-- SECCION DE ACCESO RAPIDO -->
      <div style="max-width: 1300px; margin: -120px auto 100px; padding: 0 30px; position: relative; z-index: 30; display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 30px;">
        
        <!-- FABLAB -->
        <div (click)="selectArea('FABLAB')" class="area-card" style="background: #FFF; border-radius: 40px; padding: 50px 40px; text-align: center; cursor: pointer; transition: 0.5s cubic-bezier(0.2, 1, 0.3, 1); border-bottom: 15px solid #000; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
          <div style="width: 90px; height: 90px; background: #f8f9fa; border-radius: 25px; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px;">
            <i class="bi bi-printer-fill" style="font-size: 50px; color: #000;"></i>
          </div>
          <h2 style="color: #000; font-size: 32px; font-weight: 900; margin-bottom: 15px; letter-spacing: -1px;">FABLAB</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6; font-weight: 500;">Taller de Fabricación e Impresión 3D.</p>
          <div class="card-action" style="margin-top: 30px; color: #f97316; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">
            Entrar al área <i class="bi bi-arrow-right"></i>
          </div>
        </div>

        <!-- CIENCIAS BASICAS -->
        <div (click)="selectArea('LAB CIENCIAS BASICAS')" class="area-card" style="background: #FFF; border-radius: 40px; padding: 50px 40px; text-align: center; cursor: pointer; transition: 0.5s cubic-bezier(0.2, 1, 0.3, 1); border-bottom: 15px solid #000; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
          <div style="width: 90px; height: 90px; background: #f8f9fa; border-radius: 25px; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px;">
            <i class="bi bi-microscope" style="font-size: 50px; color: #000;"></i>
          </div>
          <h2 style="color: #000; font-size: 32px; font-weight: 900; margin-bottom: 15px; letter-spacing: -1px;">CIENCIAS BÁSICAS</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6; font-weight: 500;">Laboratorios de Física y Química.</p>
          <div class="card-action" style="margin-top: 30px; color: #f97316; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">
            Entrar al área <i class="bi bi-arrow-right"></i>
          </div>
        </div>

        <!-- INFORMATICA -->
        <div (click)="selectArea('LAB INFORMATICA')" class="area-card" style="background: #FFF; border-radius: 40px; padding: 50px 40px; text-align: center; cursor: pointer; transition: 0.5s cubic-bezier(0.2, 1, 0.3, 1); border-bottom: 15px solid #000; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
          <div style="width: 90px; height: 90px; background: #f8f9fa; border-radius: 25px; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px;">
            <i class="bi bi-cpu-fill" style="font-size: 50px; color: #000;"></i>
          </div>
          <h2 style="color: #000; font-size: 32px; font-weight: 900; margin-bottom: 15px; letter-spacing: -1px;">INFORMÁTICA</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6; font-weight: 500;">Hardware, Redes y Desarrollo.</p>
          <div class="card-action" style="margin-top: 30px; color: #f97316; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">
            Entrar al área <i class="bi bi-arrow-right"></i>
          </div>
        </div>
      </div>

      <!-- PANEL DE LABORATORIOS ESPECIFICOS -->
      <section *ngIf="selectedArea()" style="max-width: 1300px; margin: 0 auto 100px; padding: 40px; background: rgba(255, 255, 255, 1); border-radius: 40px; border: 1px solid rgba(255,255,255,0.05); animate: slide-up 0.5s ease-out;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 50px; border-left: 12px solid #f97316; padding-left: 30px;">
          <div>
            <h3 style="font-size: 44px; font-weight: 950; margin: 0; text-transform: uppercase; letter-spacing: -2px;">{{ selectedArea() }}</h3>
            <p style="color: #f97316; font-weight: 800; text-transform: uppercase; letter-spacing: 4px; font-size: 12px;">Infraestructura Disponible para Investigación</p>
          </div>
          <button (click)="selectedArea.set('')" style="background: #fff; color: #000; border: none; padding: 15px 35px; border-radius: 18px; font-weight: 900; cursor: pointer; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">VOLVER AL MENU</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 320px)); gap: 25px; justify-content: center;">
          <article *ngFor="let lab of subLabs()" (click)="goToInventory(lab)" class="lab-item" style="background: #FFF; color: #000; padding: 40px; border-radius: 35px; cursor: pointer; text-align: center; transition: 0.4s; border: 4px solid transparent;">
            <div style="width: 70px; height: 70px; background: #f0f0f0; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
               <i [class]="'bi ' + getLabIcon(lab)" style="font-size: 30px; color: #000;"></i>
            </div>
            <h4 style="font-size: 22px; font-weight: 900; margin-bottom: 25px;">{{ lab }}</h4>
            <button style="width: 100%; padding: 15px; background: #000; color: #fff; border: none; border-radius: 15px; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 2px;">Panel de Control</button>
          </article>
        </div>
      </section>
    </div>

    <style>
      .area-card:hover { transform: translateY(-15px); border-bottom-color: #f97316 !important; }
      .area-card:hover .card-action { color: #000 !important; }
      .lab-item:hover { border-color: #f97316 !important; transform: scale(1.05); }
      @keyframes fade-in { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    </style>
  `
})
export class AreasComponent {
  dataService = inject(DataService);
  router = inject(Router);
  selectedArea = signal('');
  subLabs = signal<string[]>([]);
  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params['area']) this.selectArea(params['area']);
    });
  }
  selectArea(area: string) {
    this.selectedArea.set(area);
    this.subLabs.set(this.dataService.hierarchy[area] || []);
  }

  getLabIcon(labName: string): string {
    const icons: Record<string, string> = {
      'QUIMICA': 'bi-droplet-fill',
      'FISICA': 'bi-magnet-fill',
      'BIOMATERIALES': 'bi-flower1',
      'TEXTIL': 'bi-layers-fill',
      'FABRICACIÓN DIGITAL': 'bi-printer-fill',
      'HACKERLAB': 'bi-terminal-fill',
      'DESARROLLO TECNOLOGICO': 'bi-cpu-fill'
    };
    return icons[labName] || 'bi-box-seam';
  }

  goToInventory(lab: string) {
    this.router.navigate(['/inventory', this.selectedArea(), lab]);
  }
}
