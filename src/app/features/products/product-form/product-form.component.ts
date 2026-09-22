import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { SeasonService } from '../../../core/services/season.service';
import { Category } from '../../../core/models/category.model';
import { Supplier } from '../../../core/models/supplier.model';
import { Season } from '../../../core/models/season.model';
import { ProductVariant, ProductVariantCreate } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  @Input() id?: string; // Route parameter binding for editing

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private supplierService = inject(SupplierService);
  private seasonService = inject(SeasonService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  suppliers = signal<Supplier[]>([]);
  seasons = signal<Season[]>([]);

  isEditing = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Variantes temporales (para creación) o existentes (para edición)
  variants = signal<Array<ProductVariantCreate | ProductVariant>>([]);

  // Formulario para agregar variante rápida
  newVariantTalla = 'M';
  newVariantColor = '';
  newVariantPrecioExtra = 0;
  newVariantSku = '';

  productForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    imagen_url: [''],
    precio_base: [0, [Validators.required, Validators.min(0.01)]],
    categoria_id: ['', [Validators.required]],
    temporada: [''],
    proveedor: [''],
    activo: [true]
  });

  imageLoadError = signal<boolean>(false);

  get currentImageUrl(): string {
    return (this.productForm.get('imagen_url')?.value || '').trim();
  }

  onImageUrlInput(): void {
    this.imageLoadError.set(false);
  }

  onImageLoadSuccess(): void {
    this.imageLoadError.set(false);
  }

  onImageLoadError(): void {
    this.imageLoadError.set(true);
  }

  clearImage(): void {
    this.productForm.patchValue({ imagen_url: '' });
    this.imageLoadError.set(false);
  }

  tallasDisponibles = ['S', 'M', 'L', 'XL', 'XXL', 'ESTANDAR'];

  ngOnInit(): void {
    this.loadDropdownData();
    if (this.id) {
      this.isEditing.set(true);
      this.loadProduct(this.id);
    }
  }

  loadDropdownData(): void {
    this.categoryService.getCategories(true).subscribe({
      next: (data) => this.categories.set(data),
      error: () => {}
    });
    this.supplierService.getSuppliers(true).subscribe({
      next: (data) => this.suppliers.set(data),
      error: () => {}
    });
    this.seasonService.getSeasons().subscribe({
      next: (data) => this.seasons.set(data),
      error: () => {}
    });
  }

  loadProduct(productId: string): void {
    this.isLoading.set(true);
    this.productService.getProductById(productId).subscribe({
      next: (prod) => {
        this.productForm.patchValue({
          nombre: prod.nombre,
          descripcion: prod.descripcion || '',
          imagen_url: prod.imagen_url || '',
          precio_base: prod.precio_base,
          categoria_id: prod.categoria_id,
          temporada: prod.temporada || '',
          proveedor: prod.proveedor || '',
          activo: prod.activo
        });
        this.variants.set(prod.variantes || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar producto');
        this.isLoading.set(false);
      }
    });
  }

  addVariantRow(): void {
    if (!this.newVariantColor.trim()) {
      alert('Debes ingresar un color para la variante');
      return;
    }

    const talla = this.newVariantTalla.trim().toUpperCase();
    const color = this.newVariantColor.trim();

    // Validar duplicado
    const exists = this.variants().some(
      (v) => v.talla.toUpperCase() === talla && v.color.toLowerCase() === color.toLowerCase()
    );
    if (exists) {
      alert(`Ya existe una variante con talla ${talla} y color ${color}`);
      return;
    }

    const newVar: ProductVariantCreate = {
      talla,
      color,
      precio_extra: Number(this.newVariantPrecioExtra) || 0,
      sku: this.newVariantSku.trim() || undefined,
      activo: true
    };

    if (this.isEditing() && this.id) {
      this.productService.addVariant(this.id, newVar).subscribe({
        next: (savedVar) => {
          this.variants.update((list) => [...list, savedVar]);
          this.resetNewVariantInputs();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.detail || 'Error al agregar variante');
        }
      });
    } else {
      this.variants.update((list) => [...list, newVar]);
      this.resetNewVariantInputs();
    }
  }

  removeVariant(index: number, variant: any): void {
    if (this.isEditing() && variant.id) {
      if (!confirm(`¿Eliminar la variante ${variant.talla} - ${variant.color}?`)) return;
      this.productService.deleteVariant(variant.id).subscribe({
        next: () => {
          this.variants.update((list) => list.filter((_, i) => i !== index));
        },
        error: (err) => {
          this.errorMessage.set(err.error?.detail || 'Error al eliminar variante');
        }
      });
    } else {
      this.variants.update((list) => list.filter((_, i) => i !== index));
    }
  }

  resetNewVariantInputs(): void {
    this.newVariantTalla = 'M';
    this.newVariantColor = '';
    this.newVariantPrecioExtra = 0;
    this.newVariantSku = '';
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formValue = this.productForm.value;

    if (this.isEditing() && this.id) {
      this.productService.updateProduct(this.id, formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/productos']);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al actualizar producto');
        }
      });
    } else {
      const payload = {
        ...formValue,
        variantes: this.variants() as ProductVariantCreate[]
      };

      this.productService.createProduct(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/productos']);
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al crear producto');
        }
      });
    }
  }
}
