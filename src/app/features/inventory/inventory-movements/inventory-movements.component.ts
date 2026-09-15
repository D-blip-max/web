import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { BranchService } from '../../../core/services/branch.service';
import { InventoryMovement, MovementType } from '../../../core/models/inventory.model';
import { Branch } from '../../../core/models/branch.model';

@Component({
  selector: 'app-inventory-movements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventory-movements.component.html',
  styleUrls: ['./inventory-movements.component.css']
})
export class InventoryMovementsComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private branchService = inject(BranchService);

  branches = signal<Branch[]>([]);
  movements = signal<InventoryMovement[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Filters
  selectedBranchId = signal<string>('');
  selectedType = signal<string>('');

  movementTypes: { value: MovementType; label: string }[] = [
    { value: 'ENTRADA', label: 'Entrada / Recepción' },
    { value: 'SALIDA_VENTA', label: 'Salida por Venta' },
    { value: 'SALIDA_RESERVA', label: 'Salida por Reserva' },
    { value: 'LIBERACION_RESERVA', label: 'Liberación Reserva' },
    { value: 'AJUSTE', label: 'Ajuste Manual' },
    { value: 'DEVOLUCION', label: 'Devolución' },
  ];

  ngOnInit(): void {
    this.loadBranches();
    this.loadMovements();
  }

  loadBranches(): void {
    this.branchService.getBranches(true).subscribe({
      next: (bList) => this.branches.set(bList),
      error: () => {}
    });
  }

  loadMovements(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const bId = this.selectedBranchId();
    const mType = this.selectedType() as MovementType;

    this.inventoryService.getMovements({
      sucursal_id: bId || undefined,
      tipo: mType || undefined,
      limit: 100
    }).subscribe({
      next: (data) => {
        this.movements.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar movimientos');
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadMovements();
  }

  getBadgeClass(type: MovementType): string {
    switch (type) {
      case 'ENTRADA':
        return 'badge-success';
      case 'SALIDA_VENTA':
        return 'badge-danger';
      case 'SALIDA_RESERVA':
        return 'badge-warning';
      case 'LIBERACION_RESERVA':
        return 'badge-info';
      case 'AJUSTE':
        return 'badge-secondary';
      case 'DEVOLUCION':
        return 'badge-purple';
      default:
        return 'badge-secondary';
    }
  }
}
