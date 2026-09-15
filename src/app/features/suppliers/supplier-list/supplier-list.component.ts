import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupplierService } from '../../../core/services/supplier.service';
import { Supplier } from '../../../core/models/supplier.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.css']
})
export class SupplierListComponent implements OnInit {
  private supplierService = inject(SupplierService);
  private fb = inject(FormBuilder);

  suppliers = signal<Supplier[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modal state
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  selectedSupplierId: string | null = null;
  isSaving = signal<boolean>(false);

  supplierForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    contacto: ['', [Validators.maxLength(100)]],
    telefono: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email]],
    direccion: ['', [Validators.maxLength(200)]],
    activo: [true]
  });

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    this.supplierService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar proveedores');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedSupplierId = null;
    this.supplierForm.reset({
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      activo: true
    });
    this.showModal.set(true);
  }

  openEditModal(supplier: Supplier): void {
    this.isEditing.set(true);
    this.selectedSupplierId = supplier.id;
    this.supplierForm.patchValue({
      nombre: supplier.nombre,
      contacto: supplier.contacto || '',
      telefono: supplier.telefono || '',
      email: supplier.email || '',
      direccion: supplier.direccion || '',
      activo: supplier.activo
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedSupplierId = null;
    this.supplierForm.reset();
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formValue = this.supplierForm.value;

    if (this.isEditing() && this.selectedSupplierId) {
      this.supplierService.updateSupplier(this.selectedSupplierId, formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.successMessage.set('Proveedor actualizado exitosamente');
          this.loadSuppliers();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al actualizar proveedor');
        }
      });
    } else {
      this.supplierService.createSupplier(formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.successMessage.set('Proveedor registrado exitosamente');
          this.loadSuppliers();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al registrar proveedor');
        }
      });
    }
  }

  toggleActivo(supplier: Supplier): void {
    const action = supplier.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${action} el proveedor "${supplier.nombre}"?`)) return;

    this.supplierService.updateSupplier(supplier.id, { activo: !supplier.activo }).subscribe({
      next: () => {
        this.successMessage.set(`Proveedor ${supplier.nombre} actualizado.`);
        this.loadSuppliers();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || `Error al ${action} proveedor`);
      }
    });
  }
}
