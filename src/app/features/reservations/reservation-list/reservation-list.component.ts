import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { BranchService } from '../../../core/services/branch.service';
import { Reservation, ReservationStatus } from '../../../core/models/reservation.model';
import { Branch } from '../../../core/models/branch.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HasPermissionDirective],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css']
})
export class ReservationListComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private branchService = inject(BranchService);

  activeTab = signal<'PENDIENTES' | 'PREPARADAS' | 'TODAS'>('PENDIENTES');
  branches = signal<Branch[]>([]);
  selectedBranchId = signal<string>('');
  reservations = signal<Reservation[]>([]);

  searchQuery = signal<string>('');

  filteredReservations = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.reservations();
    if (!q) return list;

    return list.filter(r => {
      const codigo = (r.codigo || '').toLowerCase();
      const cliente = (r.cliente_nombre || '').toLowerCase();
      const sucursal = (r.sucursal_nombre || '').toLowerCase();

      return codigo.includes(q) || cliente.includes(q) || sucursal.includes(q);
    });
  });

  isLoading = signal<boolean>(false);
  isActionLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Detail Modal
  showDetailModal = signal<boolean>(false);
  selectedReservation = signal<Reservation | null>(null);

  ngOnInit(): void {
    this.loadBranches();
    this.loadReservations();
  }

  loadBranches(): void {
    this.branchService.getBranches(true).subscribe({
      next: (bList) => this.branches.set(bList),
      error: () => {}
    });
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const bId = this.selectedBranchId();
    let estadoFilter: ReservationStatus | undefined = undefined;

    if (this.activeTab() === 'PENDIENTES') {
      estadoFilter = 'PENDIENTE';
    } else if (this.activeTab() === 'PREPARADAS') {
      estadoFilter = 'PREPARADA';
    }

    this.reservationService.getReservations({
      sucursal_id: bId || undefined,
      estado: estadoFilter,
      limit: 100
    }).subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar reservas');
        this.isLoading.set(false);
      }
    });
  }

  setTab(tab: 'PENDIENTES' | 'PREPARADAS' | 'TODAS'): void {
    this.activeTab.set(tab);
    this.loadReservations();
  }

  openDetailModal(res: Reservation): void {
    this.selectedReservation.set(res);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedReservation.set(null);
  }

  prepareReservation(res: Reservation): void {
    if (!confirm(`¿Marcar la reserva ${res.codigo} como PREPARADA?`)) return;

    this.isActionLoading.set(true);
    this.reservationService.prepareReservation(res.id).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.successMessage.set(`Reserva ${res.codigo} marcada como PREPARADA.`);
        this.loadReservations();
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al preparar reserva');
      }
    });
  }

  pickupReservation(res: Reservation): void {
    if (!confirm(`¿Confirmar entrega y recogida de la reserva ${res.codigo}?`)) return;

    this.isActionLoading.set(true);
    this.reservationService.pickupReservation(res.id).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.successMessage.set(`Reserva ${res.codigo} marcada como RECOGIDA.`);
        this.loadReservations();
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al entregar reserva');
      }
    });
  }

  cancelReservation(res: Reservation): void {
    if (!confirm(`¿Estás seguro de CANCELAR la reserva ${res.codigo}? Se liberará el stock reservado.`)) return;

    this.isActionLoading.set(true);
    this.reservationService.cancelReservation(res.id).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.successMessage.set(`Reserva ${res.codigo} cancelada y stock liberado.`);
        this.loadReservations();
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al cancelar reserva');
      }
    });
  }

  expirePending(): void {
    this.isActionLoading.set(true);
    this.reservationService.expireReservations().subscribe({
      next: (resp) => {
        this.isActionLoading.set(false);
        this.successMessage.set(resp.message);
        this.loadReservations();
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al procesar vencimientos');
      }
    });
  }

  getStatusBadgeClass(status: ReservationStatus): string {
    switch (status) {
      case 'PENDIENTE': return 'badge-warning';
      case 'PREPARADA': return 'badge-info';
      case 'RECOGIDA': return 'badge-success';
      case 'COMPLETADA': return 'badge-success';
      case 'CANCELADA': return 'badge-danger';
      case 'EXPIRADA': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }
}
