
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login.component';
import { AreasComponent } from './pages/areas.component';
import { InventoryComponent } from './pages/inventory.component';
import { DashboardComponent } from './pages/dashboard.component';
import { UsersComponent } from './pages/users.component';
import { AuditComponent } from './pages/audit.component';
import { MyRequestsComponent } from './pages/my-requests.component';
import { SupportComponent } from './pages/support.component';
import { MaintenanceComponent } from './pages/maintenance.component';
import { ScheduleComponent } from './pages/schedule.component';
import { ProcurementComponent } from './pages/procurement.component';
import { ProjectsComponent } from './pages/projects.component';
import { WikiComponent } from './pages/wiki.component';
import { BitacoraComponent } from './pages/bitacora.component';
import { NotFoundComponent } from './pages/not-found.component';
import { RoomsComponent } from './pages/rooms.component';
import { WelcomeComponent } from './pages/welcome.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'areas', component: AreasComponent },
  { path: 'inventory/:area/:lab', component: InventoryComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'users', component: UsersComponent },
  { path: 'audit', component: AuditComponent },
  { path: 'requests', component: MyRequestsComponent },
  { path: 'support', component: SupportComponent },
  { path: 'maintenance', component: MaintenanceComponent },
  { path: 'schedule', component: ScheduleComponent },
  { path: 'rooms', component: RoomsComponent },
  { path: 'procurement', component: ProcurementComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'wiki', component: WikiComponent },
  { path: 'bitacora', component: BitacoraComponent },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '404' }
];
