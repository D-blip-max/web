import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BranchService } from '../../../core/services/branch.service';
import { Branch } from '../../../core/models/branch.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.css']
})
export class BranchListComponent implements OnInit {
  private branchService = inject(BranchService);
  private fb = inject(FormBuilder);

  branches = signal<Branch[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modal form state
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  selectedBranchId: string | null = null;
  isSaving = signal<boolean>(false);

  branchForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    ciudad: ['', [Validators.required, Validators.maxLength(50)]],
    direccion: ['', [Validators.required, Validators.maxLength(200)]],
    telefono: ['', [Validators.maxLength(20)]],
    activa: [true]
  });

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.isLoading.set(true);
    this.branchService.getBranches().subscribe({
      next: (data) => {
        this.branches.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar sucursales');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedBranchId = null;
    this.branchForm.reset({
      nombre: '',
      ciudad: '',
      direccion: '',
      telefono: '',
      activa: true
    });
    this.showModal.set(true);
  }

  openEditModal(branch: Branch): void {
    this.isEditing.set(true);
    this.selectedBranchId = branch.id;
    this.branchForm.patchValue({
      nombre: branch.nombre,
      ciudad: branch.ciudad,
      direccion: branch.direccion,
      telefono: branch.telefono || '',
      activa: branch.activa
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedBranchId = null;
    this.branchForm.reset();
  }

  onSubmit(): void {
    if (this.branchForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formValue = this.branchForm.value;

    if (this.isEditing() && this.selectedBranchId) {
      this.branchService.updateBranch(this.selectedBranchId, formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.successMessage.set('Sucursal actualizada exitosamente');
          this.loadBranches();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al actualizar sucursal');
        }
      });
    } else {
      this.branchService.createBranch(formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.successMessage.set('Sucursal creada exitosamente');
          this.loadBranches();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al crear sucursal');
        }
      });
    }
  }

  toggleActiva(branch: Branch): void {
    const action = branch.activa ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${action} la sucursal "${branch.nombre}"?`)) return;

    this.branchService.updateBranch(branch.id, { activa: !branch.activa }).subscribe({
      next: () => {
        this.successMessage.set(`Sucursal ${branch.nombre} actualizada.`);
        this.loadBranches();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || `Error al ${action} sucursal`);
      }
    });
  }
}
