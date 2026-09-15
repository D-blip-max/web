import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Filters
  searchTerm = '';
  selectedCategoryId = '';
  selectedStatus = '';

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories(true).subscribe({
      next: (data) => this.categories.set(data),
      error: () => {}
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    const filters: any = {};
    if (this.searchTerm.trim()) filters.search = this.searchTerm.trim();
    if (this.selectedCategoryId) filters.categoria_id = this.selectedCategoryId;
    if (this.selectedStatus === 'active') filters.activo = true;
    if (this.selectedStatus === 'inactive') filters.activo = false;

    this.productService.getProducts(filters).subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar productos');
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = '';
    this.selectedStatus = '';
    this.loadProducts();
  }

  toggleActivo(product: Product): void {
    const action = product.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${action} el producto "${product.nombre}"?`)) return;

    this.productService.updateProduct(product.id, { activo: !product.activo }).subscribe({
      next: () => {
        this.successMessage.set(`Producto ${product.nombre} actualizado.`);
        this.loadProducts();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || `Error al ${action} producto`);
      }
    });
  }
}
