import { Component, Input, Output, EventEmitter, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NAV_MODULES, NavModule } from '../../config/nav-modules.config';
import { AuthService } from '../../services/auth.service';
import { ReservationService } from '../../services/reservation.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeNav = new EventEmitter<void>();

  private authService = inject(AuthService);
  private reservationService = inject(ReservationService);

  pendingReservations = signal<number>(0);
  private pollSub?: Subscription;

  // Filter modules based on user permissions
  visibleModules = computed<NavModule[]>(() => {
    return NAV_MODULES.filter((module) => {
      if (!module.permission) return true;
      return this.authService.hasPermission(module.permission);
    });
  });

  ngOnInit(): void {
    if (this.authService.hasPermission('reservas.list')) {
      this._loadPendingCount();
      // Refresh every 60 seconds
      this.pollSub = interval(60_000).subscribe(() => this._loadPendingCount());
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private _loadPendingCount(): void {
    this.reservationService.getReservations({ estado: 'PENDIENTE' as any, limit: 500 }).subscribe({
      next: (list) => this.pendingReservations.set(list.length),
      error: () => {} // silent
    });
  }

  onModuleClick(): void {
    this.closeNav.emit();
  }

  onClose(): void {
    this.closeNav.emit();
  }
}
