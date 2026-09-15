import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modal form state
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  selectedCategoryId: string | null = null;
  isSaving = signal<boolean>(false);

  categoryForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    descripcion: ['', [Validators.maxLength(200)]],
    activa: [true]
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar categorías');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedCategoryId = null;
    this.categoryForm.reset({
      nombre: '',
      descripcion: '',
      activa: true
    });
    this.showModal.set(true);
  }

  openEditModal(category: Category): void {
    this.isEditing.set(true);
    this.selectedCategoryId = category.id;
    this.categoryForm.patchValue({
      nombre: category.nombre,
      descripcion: category.descripcion || '',
      activa: category.activa
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedCategoryId = null;
    this.categoryForm.reset();
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formValue = this.categoryForm.value;

    if (this.isEditing() && this.selectedCategoryId) {
      this.categoryService.updateCategory(this.selectedCategoryId, formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.successMessage.set('Categoría actualizada exitosamente');
          this.loadCategories();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al actualizar categoría');
        }
      });
    } else {
      this.categoryService.createCategory(formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.successMessage.set('Categoría creada exitosamente');
          this.loadCategories();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al crear categoría');
        }
      });
    }
  }

  toggleActiva(category: Category): void {
    const action = category.activa ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${action} la categoría "${category.nombre}"?`)) return;

    this.categoryService.updateCategory(category.id, { activa: !category.activa }).subscribe({
      next: () => {
        this.successMessage.set(`Categoría ${category.nombre} actualizada.`);
        this.loadCategories();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || `Error al ${action} categoría`);
      }
    });
  }
}
