import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { BranchService } from '../../../core/services/branch.service';
import { ProductService } from '../../../core/services/product.service';
import { Branch } from '../../../core/models/branch.model';
import { Product, ProductVariant } from '../../../core/models/product.model';

interface VariantOption {
  id: string;
  label: string;
  sku: string;
}

@Component({
  selector: 'app-inventory-reception',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './inventory-reception.component.html',
  styleUrls: ['./inventory-reception.component.css']
})
export class InventoryReceptionComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private branchService = inject(BranchService);
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  branches = signal<Branch[]>([]);
  variantOptions = signal<VariantOption[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  receptionForm: FormGroup = this.fb.group({
    sucursal_id: ['', [Validators.required]],
    factura: ['', [Validators.maxLength(100)]],
    nota: ['', [Validators.maxLength(300)]],
    productos: this.fb.array([])
  });

  get productosArray(): FormArray {
    return this.receptionForm.get('productos') as FormArray;
  }

  ngOnInit(): void {
    this.loadData();
    this.addItem(); // Start with 1 empty row
  }

  loadData(): void {
    this.isLoading.set(true);

    this.branchService.getBranches(true).subscribe({
      next: (bList) => {
        this.branches.set(bList);
        if (bList.length > 0) {
          this.receptionForm.patchValue({ sucursal_id: bList[0].id });
        }
      }
    });

    this.productService.getProducts().subscribe({
      next: (pList) => {
        const options: VariantOption[] = [];
        pList.forEach((p) => {
          if (p.variantes) {
            p.variantes.forEach((v) => {
              options.push({
                id: v.id,
                sku: v.sku,
                label: `${p.nombre} — Talla: ${v.talla}, Color: ${v.color} (${v.sku})`
              });
            });
          }
        });
        this.variantOptions.set(options);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  createItemRow(): FormGroup {
    return this.fb.group({
      variante_id: ['', [Validators.required]],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
  }

  addItem(): void {
    this.productosArray.push(this.createItemRow());
  }

  removeItem(index: number): void {
    if (this.productosArray.length > 1) {
      this.productosArray.removeAt(index);
    }
  }

  getTotalUnidades(): number {
    return this.productosArray.controls.reduce((sum, ctrl) => {
      const val = Number(ctrl.get('cantidad')?.value) || 0;
      return sum + val;
    }, 0);
  }

  onSubmit(): void {
    if (this.receptionForm.invalid || this.productosArray.length === 0) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formVal = this.receptionForm.value;

    this.inventoryService.receiveProducts({
      sucursal_id: formVal.sucursal_id,
      factura: formVal.factura || undefined,
      nota: formVal.nota || undefined,
      productos: formVal.productos.map((p: any) => ({
        variante_id: p.variante_id,
        cantidad: Number(p.cantidad)
      }))
    }).subscribe({
      next: (resp) => {
        this.isSubmitting.set(false);
        this.successMessage.set(resp.message || 'Mercadería ingresada exitosamente.');
        // Reset items array
        this.productosArray.clear();
        this.addItem();
        this.receptionForm.patchValue({ factura: '', nota: '' });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al procesar la recepción');
      }
    });
  }
}
