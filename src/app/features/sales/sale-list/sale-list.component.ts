import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SaleService } from '../../../core/services/sale.service';
import { BranchService } from '../../../core/services/branch.service';
import { Sale, SaleType, SaleStatus } from '../../../core/models/sale.model';
import { Branch } from '../../../core/models/branch.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HasPermissionDirective],
  templateUrl: './sale-list.component.html',
  styleUrls: ['./sale-list.component.css']
})
export class SaleListComponent implements OnInit {
  private saleService = inject(SaleService);
  private branchService = inject(BranchService);

  branches = signal<Branch[]>([]);
  sales = signal<Sale[]>([]);

  // Filters
  selectedBranchId = signal<string>('');
  selectedType = signal<string>('');
  selectedStatus = signal<string>('');

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Detail / Receipt Modal
  showDetailModal = signal<boolean>(false);
  selectedSale = signal<Sale | null>(null);

  // Cancel Modal
  showCancelModal = signal<boolean>(false);
  saleToCancel = signal<Sale | null>(null);
  cancelReason: string = '';
  isCancelling = signal<boolean>(false);

  ngOnInit(): void {
    this.loadBranches();
    this.loadSales();
  }

  loadBranches(): void {
    this.branchService.getBranches(true).subscribe({
      next: (bList) => this.branches.set(bList),
      error: () => {}
    });
  }

  loadSales(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const bId = this.selectedBranchId();
    const sType = this.selectedType() as SaleType;
    const sStatus = this.selectedStatus() as SaleStatus;

    this.saleService.getSales({
      sucursal_id: bId || undefined,
      tipo: sType || undefined,
      estado: sStatus || undefined,
      limit: 100
    }).subscribe({
      next: (data) => {
        this.sales.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar ventas');
        this.isLoading.set(false);
      }
    });
  }

  openDetailModal(sale: Sale): void {
    this.selectedSale.set(sale);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedSale.set(null);
  }

  openCancelModal(sale: Sale): void {
    this.saleToCancel.set(sale);
    this.cancelReason = '';
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.saleToCancel.set(null);
  }

  confirmCancelSale(): void {
    const sale = this.saleToCancel();
    if (!sale || !this.cancelReason.trim()) return;

    this.isCancelling.set(true);
    this.errorMessage.set(null);

    this.saleService.cancelSale(sale.id, this.cancelReason).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.closeCancelModal();
        this.successMessage.set(`Venta ${sale.numero_recibo} anulada y stock revertido correctamente.`);
        this.loadSales();
      },
      error: (err) => {
        this.isCancelling.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al anular la venta');
      }
    });
  }

  printReceipt(): void {
    window.print();
  }
}
