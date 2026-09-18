import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { SaleService } from '../../core/services/sale.service';
import { InventoryService } from '../../core/services/inventory.service';
import { ReservationService } from '../../core/services/reservation.service';
import { BranchService } from '../../core/services/branch.service';

import { SalesSummaryReport, TopProductReport, Sale } from '../../core/models/sale.model';
import { StockAlert, InventoryMovement } from '../../core/models/inventory.model';
import { Reservation } from '../../core/models/reservation.model';
import { Branch } from '../../core/models/branch.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private saleService = inject(SaleService);
  private inventoryService = inject(InventoryService);
  private reservationService = inject(ReservationService);
  private branchService = inject(BranchService);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  userRole = computed(() => this.currentUser()?.role?.name?.toLowerCase() || 'cliente');

  // Filtros & Estado
  branches = signal<Branch[]>([]);
  selectedBranchId = signal<string>('');
  isLoading = signal<boolean>(true);
  isRefreshing = signal<boolean>(false);
  lastUpdated = signal<Date>(new Date());

  // Datos del Dashboard
  summary = signal<SalesSummaryReport | null>(null);
  topProducts = signal<TopProductReport[]>([]);
  stockAlerts = signal<StockAlert[]>([]);
  recentReservations = signal<Reservation[]>([]);
  recentSales = signal<Sale[]>([]);
  recentMovements = signal<InventoryMovement[]>([]);

  // Modal / Edición de Perfil
  showProfileModal = signal<boolean>(false);
  isSavingProfile = signal<boolean>(false);
  profileSuccess = signal<string | null>(null);
  profileError = signal<string | null>(null);

  profileForm: FormGroup = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]]
  });

  // Métricas calculadas para gráficos / barras
  paymentBreakdown = computed(() => {
    const s = this.summary();
    if (!s || s.ingresos_totales === 0) {
      return { efectivoPct: 0, qrPct: 0, tarjetaPct: 0, efectivoTotal: 0, qrTotal: 0, tarjetaTotal: 0 };
    }
    const total = s.ingresos_totales;
    return {
      efectivoPct: Math.round((s.ventas_efectivo / total) * 100),
      qrPct: Math.round((s.ventas_qr / total) * 100),
      tarjetaPct: Math.round((s.ventas_tarjeta / total) * 100),
      efectivoTotal: s.ventas_efectivo,
      qrTotal: s.ventas_qr,
      tarjetaTotal: s.ventas_tarjeta
    };
  });

  criticalStockCount = computed(() => {
    return this.stockAlerts().filter(a => a.nivel === 'CRITICO').length;
  });

  pendingReservationsCount = computed(() => {
    return this.recentReservations().filter(r => r.estado === 'PENDIENTE').length;
  });

  readyReservationsCount = computed(() => {
    return this.recentReservations().filter(r => r.estado === 'PREPARADA').length;
  });

  ngOnInit(): void {
    this.loadBranches();
    this.loadDashboardData();
  }

  loadBranches(): void {
    this.branchService.getBranches(true).subscribe({
      next: (data) => this.branches.set(data),
      error: () => console.error('Error al cargar sucursales')
    });
  }

  onBranchFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedBranchId.set(target.value);
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const branchId = this.selectedBranchId() || undefined;
    this.isRefreshing.set(true);

    forkJoin({
      summary: this.saleService.getSummaryReport(branchId).pipe(catchError(() => of(null))),
      topProducts: this.saleService.getTopProducts(branchId, 5).pipe(catchError(() => of([]))),
      alerts: this.inventoryService.getAlerts(branchId).pipe(catchError(() => of([]))),
      reservations: this.reservationService.getReservations({ sucursal_id: branchId, limit: 6 }).pipe(catchError(() => of([]))),
      sales: this.saleService.getSales({ sucursal_id: branchId, limit: 6 }).pipe(catchError(() => of([]))),
      movements: this.inventoryService.getMovements({ sucursal_id: branchId, limit: 6 }).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.summary.set(res.summary);
        this.topProducts.set(res.topProducts);
        this.stockAlerts.set(res.alerts);
        this.recentReservations.set(res.reservations);
        this.recentSales.set(res.sales);
        this.recentMovements.set(res.movements);
        this.isLoading.set(false);
        this.isRefreshing.set(false);
        this.lastUpdated.set(new Date());
      },
      error: () => {
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      }
    });
  }

  prepareReservation(id: string): void {
    this.reservationService.prepareReservation(id).subscribe({
      next: () => this.loadDashboardData(),
      error: (err) => console.error('Error al preparar reserva', err)
    });
  }

  openProfileModal(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({ full_name: user.full_name });
    }
    this.profileSuccess.set(null);
    this.profileError.set(null);
    this.showProfileModal.set(true);
  }

  closeProfileModal(): void {
    this.showProfileModal.set(false);
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSavingProfile.set(true);
    this.profileSuccess.set(null);
    this.profileError.set(null);

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.profileSuccess.set('Perfil actualizado exitosamente');
        setTimeout(() => this.closeProfileModal(), 1200);
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        this.profileError.set(err.error?.detail || 'Error al actualizar perfil');
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getRoleBadgeClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin': return 'badge-role-admin';
      case 'encargado': return 'badge-role-encargado';
      case 'cajero': return 'badge-role-cajero';
      default: return 'badge-role-cliente';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETADA':
      case 'RECOGIDA':
        return 'status-success';
      case 'PENDIENTE':
      case 'PENDIENTE_PAGO':
        return 'status-warning';
      case 'PREPARADA':
        return 'status-info';
      case 'CANCELADA':
      case 'EXPIRADA':
        return 'status-danger';
      default:
        return 'status-neutral';
    }
  }
}
