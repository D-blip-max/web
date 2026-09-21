import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../core/services/audit-log.service';
import { AuditLog } from '../../core/models/audit-log.model';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bitacora.component.html',
  styleUrls: ['./bitacora.component.css']
})
export class BitacoraComponent implements OnInit {
  private auditLogService = inject(AuditLogService);

  logs = signal<AuditLog[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Filtros
  searchQuery = signal<string>('');
  selectedModule = signal<string>('all');
  selectedRole = signal<string>('all');

  modulesList = [
    'Autenticación',
    'Usuarios',
    'Ventas',
    'Inventario',
    'Reservas',
    'Roles'
  ];

  rolesList = [
    'admin',
    'cajero',
    'encargado',
    'cliente'
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auditLogService.getLogs(
      this.searchQuery(),
      this.selectedModule(),
      this.selectedRole()
    ).subscribe({
      next: (data) => {
        this.logs.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar los registros de la bitácora');
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadLogs();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedModule.set('all');
    this.selectedRole.set('all');
    this.loadLogs();
  }

  getRoleBadgeClass(role?: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'badge-role-admin';
      case 'cajero':
        return 'badge-role-cajero';
      case 'encargado':
        return 'badge-role-encargado';
      case 'cliente':
        return 'badge-role-cliente';
      default:
        return 'badge-role-default';
    }
  }

  getModuleBadgeClass(module?: string): string {
    switch (module?.toLowerCase()) {
      case 'autenticación':
      case 'autenticacion':
        return 'badge-module-auth';
      case 'usuarios':
        return 'badge-module-users';
      case 'ventas':
        return 'badge-module-sales';
      case 'inventario':
        return 'badge-module-inventory';
      case 'reservas':
        return 'badge-module-reservations';
      default:
        return 'badge-module-default';
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
