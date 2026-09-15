import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SaleService } from '../../../core/services/sale.service';
import { BranchService } from '../../../core/services/branch.service';
import { SalesSummaryReport, TopProductReport } from '../../../core/models/sale.model';
import { Branch } from '../../../core/models/branch.model';

@Component({
  selector: 'app-sale-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sale-reports.component.html',
  styleUrls: ['./sale-reports.component.css']
})
export class SaleReportsComponent implements OnInit {
  private saleService = inject(SaleService);
  private branchService = inject(BranchService);

  branches = signal<Branch[]>([]);
  selectedBranchId = signal<string>('');

  summary = signal<SalesSummaryReport>({
    total_ventas: 0,
    ingresos_totales: 0,
    ticket_promedio: 0,
    ventas_efectivo: 0,
    ventas_tarjeta: 0,
    ventas_qr: 0
  });

  topProducts = signal<TopProductReport[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadBranches();
    this.loadReports();
  }

  loadBranches(): void {
    this.branchService.getBranches(true).subscribe({
      next: (bList) => this.branches.set(bList),
      error: () => {}
    });
  }

  loadReports(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const bId = this.selectedBranchId() || undefined;

    this.saleService.getSummaryReport(bId).subscribe({
      next: (sumData) => {
        this.summary.set(sumData);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar resumen de ventas');
      }
    });

    this.saleService.getTopProducts(bId, 10).subscribe({
      next: (topData) => {
        this.topProducts.set(topData);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getPaymentPercentage(amount: number): number {
    const total = this.summary().ingresos_totales;
    if (total <= 0) return 0;
    return Math.round((amount / total) * 100);
  }
}
