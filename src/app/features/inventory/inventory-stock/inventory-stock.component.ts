import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { BranchService } from '../../../core/services/branch.service';
import { ProductService } from '../../../core/services/product.service';
import { InventoryItem, StockAlert } from '../../../core/models/inventory.model';
import { Branch } from '../../../core/models/branch.model';
import { Product, ProductVariant } from '../../../core/models/product.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { RouterLink } from '@angular/router';

interface EnrichedInventoryItem extends InventoryItem {
  variantInfo?: {
    sku: string;
    talla: string;
    color: string;
    productoNombre: string;
  };
}

@Component({
  selector: 'app-inventory-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective, RouterLink],
  templateUrl: './inventory-stock.component.html',
  styleUrls: ['./inventory-stock.component.css']
})
export class InventoryStockComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private branchService = inject(BranchService);
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);

  branches = signal<Branch[]>([]);
  selectedBranchId = signal<string>('');
  soloConStock = signal<boolean>(false);
  inventoryItems = signal<EnrichedInventoryItem[]>([]);
  alerts = signal<StockAlert[]>([]);
  variantsMap = new Map<string, { sku: string; talla: string; color: string; productoNombre: string }>();

  searchQuery = signal<string>('');

  filteredInventory = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const items = this.inventoryItems();
    if (!q) return items;

    return items.filter(item => {
      const prodName = (item.variantInfo?.productoNombre || '').toLowerCase();
      const sku = (item.variantInfo?.sku || '').toLowerCase();
      const talla = (item.variantInfo?.talla || '').toLowerCase();
      const color = (item.variantInfo?.color || '').toLowerCase();
      const ubicacion = (item.ubicacion || '').toLowerCase();

      return prodName.includes(q) ||
             sku.includes(q) ||
             talla.includes(q) ||
             color.includes(q) ||
             ubicacion.includes(q);
    });
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Adjustment Modal
  showAdjustModal = signal<boolean>(false);
  selectedItemForAdjust: EnrichedInventoryItem | null = null;
  isAdjusting = signal<boolean>(false);
  adjustForm: FormGroup = this.fb.group({
    cantidad: [0, [Validators.required]],
    nota: ['', [Validators.maxLength(300)]]
  });

  // Settings Modal
  showSettingsModal = signal<boolean>(false);
  selectedItemForSettings: EnrichedInventoryItem | null = null;
  isSavingSettings = signal<boolean>(false);
  settingsForm: FormGroup = this.fb.group({
    stock_minimo: [5, [Validators.required, Validators.min(0)]],
    ubicacion: ['', [Validators.maxLength(50)]]
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading.set(true);
    // 1. Load products to build variant lookup map
    this.productService.getProducts().subscribe({
      next: (products) => {
        products.forEach((p) => {
          if (p.variantes) {
            p.variantes.forEach((v) => {
              this.variantsMap.set(v.id, {
                sku: v.sku,
                talla: v.talla,
                color: v.color,
                productoNombre: p.nombre
              });
            });
          }
        });

        // 2. Load branches
        this.branchService.getBranches(true).subscribe({
          next: (bList) => {
            this.branches.set(bList);
            if (bList.length > 0) {
              this.selectedBranchId.set(bList[0].id);
              this.loadStock();
              this.loadAlerts();
            } else {
              this.isLoading.set(false);
            }
          },
          error: (err) => {
            this.errorMessage.set(err.error?.detail || 'Error al cargar sucursales');
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onBranchChange(branchId: string): void {
    this.selectedBranchId.set(branchId);
    this.loadStock();
    this.loadAlerts();
  }

  toggleSoloConStock(): void {
    this.soloConStock.update((v) => !v);
    this.loadStock();
  }

  loadStock(): void {
    const bId = this.selectedBranchId();
    if (!bId) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.inventoryService.getStockByBranch(bId, this.soloConStock()).subscribe({
      next: (items) => {
        const enriched: EnrichedInventoryItem[] = items.map((item) => ({
          ...item,
          variantInfo: this.variantsMap.get(item.variante_id)
        }));
        this.inventoryItems.set(enriched);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al consultar stock');
        this.isLoading.set(false);
      }
    });
  }

  loadAlerts(): void {
    const bId = this.selectedBranchId();
    this.inventoryService.getAlerts(bId || undefined).subscribe({
      next: (data) => this.alerts.set(data),
      error: () => {}
    });
  }

  // Adjust Modal
  openAdjustModal(item: EnrichedInventoryItem): void {
    this.selectedItemForAdjust = item;
    this.adjustForm.reset({
      cantidad: 0,
      nota: ''
    });
    this.showAdjustModal.set(true);
  }

  closeAdjustModal(): void {
    this.showAdjustModal.set(false);
    this.selectedItemForAdjust = null;
    this.adjustForm.reset();
  }

  onAdjustSubmit(): void {
    if (this.adjustForm.invalid || !this.selectedItemForAdjust) return;
    const cantidad = Number(this.adjustForm.value.cantidad);
    if (cantidad === 0) {
      this.errorMessage.set('La cantidad de ajuste no puede ser 0');
      return;
    }

    this.isAdjusting.set(true);
    this.errorMessage.set(null);

    this.inventoryService.adjustStock({
      inventario_id: this.selectedItemForAdjust.id,
      cantidad: cantidad,
      nota: this.adjustForm.value.nota || undefined
    }).subscribe({
      next: () => {
        this.isAdjusting.set(false);
        this.closeAdjustModal();
        this.successMessage.set('Ajuste de stock registrado exitosamente');
        this.loadStock();
        this.loadAlerts();
      },
      error: (err) => {
        this.isAdjusting.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al registrar ajuste');
      }
    });
  }

  // Settings Modal
  openSettingsModal(item: EnrichedInventoryItem): void {
    this.selectedItemForSettings = item;
    this.settingsForm.patchValue({
      stock_minimo: item.stock_minimo,
      ubicacion: item.ubicacion || ''
    });
    this.showSettingsModal.set(true);
  }

  closeSettingsModal(): void {
    this.showSettingsModal.set(false);
    this.selectedItemForSettings = null;
    this.settingsForm.reset();
  }

  onSettingsSubmit(): void {
    if (this.settingsForm.invalid || !this.selectedItemForSettings) return;

    this.isSavingSettings.set(true);
    this.errorMessage.set(null);

    this.inventoryService.updateInventorySettings(this.selectedItemForSettings.id, {
      stock_minimo: Number(this.settingsForm.value.stock_minimo),
      ubicacion: this.settingsForm.value.ubicacion || undefined
    }).subscribe({
      next: () => {
        this.isSavingSettings.set(false);
        this.closeSettingsModal();
        this.successMessage.set('Configuración de inventario actualizada');
        this.loadStock();
        this.loadAlerts();
      },
      error: (err) => {
        this.isSavingSettings.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al actualizar configuración');
      }
    });
  }

  // Statistics helpers
  getTotalStock(): number {
    return this.inventoryItems().reduce((acc, i) => acc + i.stock_actual, 0);
  }

  getTotalReservado(): number {
    return this.inventoryItems().reduce((acc, i) => acc + i.stock_reservado, 0);
  }

  getTotalDisponible(): number {
    return this.inventoryItems().reduce((acc, i) => acc + i.stock_disponible, 0);
  }
}
