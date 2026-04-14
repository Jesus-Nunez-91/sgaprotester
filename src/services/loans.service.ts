import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Equipment {
  dellLaptops: number;
  macLaptops: number;
  dellChargers: number;
  macChargers: number;
  extensionCords: number;
}

export type TimeBlock = '08:30 - 09:50' | '10:00 - 11:20' | '11:30 - 12:50' | '13:00 - 14:20' | '14:30 - 15:50' | '16:00 - 17:20' | '17:30 - 18:50';
export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

export interface EquipmentLoan {
  id?: number;
  className: string;
  professor: string;
  day: DayOfWeek;
  timeBlock: TimeBlock;
  equipment: Equipment;
  colorTheme: 'blue' | 'pink' | 'yellow';
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface SpecialLoan {
  id?: number;
  applicantName: string;
  applicantRut: string;
  applicantType: string;
  startDate: string;
  endDate: string;
  reason: string;
  equipment: Equipment;
  detailedItems: any[];
  // Campos Acta UAH
  itemType?: string;
  itemModel?: string;
  itemId?: string;
  accessories?: string;
  deliveryCondition?: string;
  respDeliveryName?: string;
  respDeliveryRole?: string;
  respDiffusionName?: string;
  respDiffusionRole?: string;
  respDiffusionRut?: string;
  status: 'active' | 'returned';
  documentNumber: string;
}

export interface EquipmentInventory {
  id?: number;
  dellLaptops: number;
  macLaptops: number;
  dellChargers: number;
  macChargers: number;
  extensionCords: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoansService {
  private apiUrl = (window.hasOwnProperty('Capacitor'))
    ? 'http://10.10.0.20:3040' 
    : '';                        

  constructor(private http: HttpClient) {}

  getLoans(): Observable<EquipmentLoan[]> {
    return this.http.get<EquipmentLoan[]>(`${this.apiUrl}/api/loans`);
  }

  saveLoan(loan: EquipmentLoan): Observable<EquipmentLoan> {
    return this.http.post<EquipmentLoan>(`${this.apiUrl}/api/loans`, loan);
  }

  deleteLoan(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/loans/${id}`);
  }

  updateLoanStatus(id: number, status: string): Observable<EquipmentLoan> {
    return this.http.post<EquipmentLoan>(`${this.apiUrl}/api/loans/${id}/status`, { status });
  }

  getSpecialLoans(): Observable<SpecialLoan[]> {
    return this.http.get<SpecialLoan[]>(`${this.apiUrl}/api/special-loans`);
  }

  saveSpecialLoan(loan: SpecialLoan): Observable<SpecialLoan> {
    return this.http.post<SpecialLoan>(`${this.apiUrl}/api/special-loans`, loan);
  }

  deleteSpecialLoan(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/special-loans/${id}`);
  }

  getInventoryConfig(): Observable<EquipmentInventory> {
    return this.http.get<EquipmentInventory>(`${this.apiUrl}/api/equipment-inventory`);
  }

  updateInventoryConfig(config: EquipmentInventory): Observable<EquipmentInventory> {
    return this.http.post<EquipmentInventory>(`${this.apiUrl}/api/equipment-inventory`, config);
  }
}
