import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { BranchService } from '../../../core/services/branch.service';
import { ProductService } from '../../../core/services/product.service';
import { Branch } from '../../../core/models/branch.model';
import { Product } from '../../../core/models/product.model';

interface VariantOption {
  id: string;
  label: string;
  sku: string;
  precio: number;
}

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private branchService = inject(BranchService);
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  branches = signal<Branch[]>([]);
  variantOptions = signal<VariantOption[]>([]);
  variantsMap = new Map<string, VariantOption>();

  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  reservationForm: FormGroup = this.fb.group({
    sucursal_id: ['', [Validators.required]],
    fecha_hora_esperada: ['', [Validators.required]],
    nota: ['', [Validators.maxLength(300)]],
    items: this.fb.array([])
  });

  get itemsArray(): FormArray {
    return this.reservationForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.initDefaultDate();
    this.loadData();
    this.addItem();
  }

  initDefaultDate(): void {
    // Default: tomorrow same hour
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    const localIso = tomorrow.toISOString().slice(0, 16);
    this.reservationForm.patchValue({ fecha_hora_esperada: localIso });
  }

  loadData(): void {
    this.isLoading.set(true);

    this.branchService.getBranches(true).subscribe({
      next: (bList) => {
        this.branches.set(bList);
        if (bList.length > 0) {
          this.reservationForm.patchValue({ sucursal_id: bList[0].id });
        }
      }
    });

    this.productService.getProducts().subscribe({
      next: (pList) => {
        const options: VariantOption[] = [];
        pList.forEach((p) => {
          if (p.variantes) {
            p.variantes.forEach((v) => {
              const precio = Number(p.precio_base) + Number(v.precio_extra || 0);
              const opt: VariantOption = {
                id: v.id,
                sku: v.sku,
                precio: precio,
                label: `${p.nombre} — Talla ${v.talla}, Color ${v.color} (${precio.toFixed(2)} Bs.)`
              };
              options.push(opt);
              this.variantsMap.set(v.id, opt);
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
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(3)]]
    });
  }

  addItem(): void {
    if (this.itemsArray.length < 10) {
      this.itemsArray.push(this.createItemRow());
    }
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  getItemPrice(varianteId: string): number {
    return this.variantsMap.get(varianteId)?.precio || 0;
  }

  getItemSubtotal(index: number): number {
    const ctrl = this.itemsArray.at(index);
    const varId = ctrl.get('variante_id')?.value;
    const qty = Number(ctrl.get('cantidad')?.value) || 0;
    return this.getItemPrice(varId) * qty;
  }

  getTotalEstimado(): number {
    return this.itemsArray.controls.reduce((sum, _, idx) => {
      return sum + this.getItemSubtotal(idx);
    }, 0);
  }

  onSubmit(): void {
    if (this.reservationForm.invalid || this.itemsArray.length === 0) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formVal = this.reservationForm.value;
    const expectedDate = new Date(formVal.fecha_hora_esperada).toISOString();

    this.reservationService.createReservation({
      sucursal_id: formVal.sucursal_id,
      fecha_hora_esperada: expectedDate,
      nota: formVal.nota || undefined,
      items: formVal.items.map((it: any) => ({
        variante_id: it.variante_id,
        cantidad: Number(it.cantidad)
      }))
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/reservas']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al procesar la reserva');
      }
    });
  }
}
