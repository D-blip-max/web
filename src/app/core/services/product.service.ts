import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductVariant,
  ProductVariantCreate,
  ProductVariantUpdate
} from '../models/product.model';

export interface ProductFilterParams {
  categoria_id?: string;
  temporada?: string;
  proveedor?: string;
  search?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/productos`;
  private readonly VARIANTS_URL = `${environment.apiUrl}/variantes`;

  getProducts(filters?: ProductFilterParams): Observable<Product[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.categoria_id) params = params.set('categoria_id', filters.categoria_id);
      if (filters.temporada) params = params.set('temporada', filters.temporada);
      if (filters.proveedor) params = params.set('proveedor', filters.proveedor);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.activo !== undefined) params = params.set('activo', String(filters.activo));
    }
    return this.http.get<Product[]>(this.API_URL, { params });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/${id}`);
  }

  createProduct(data: ProductCreate): Observable<Product> {
    return this.http.post<Product>(this.API_URL, data);
  }

  updateProduct(id: string, data: ProductUpdate): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/${id}`, data);
  }

  deleteProduct(id: string): Observable<Product> {
    return this.http.delete<Product>(`${this.API_URL}/${id}`);
  }

  // Variantes
  getProductVariants(productId: string): Observable<ProductVariant[]> {
    return this.http.get<ProductVariant[]>(`${this.API_URL}/${productId}/variantes`);
  }

  addVariant(productId: string, data: ProductVariantCreate): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.API_URL}/${productId}/variantes`, data);
  }

  updateVariant(variantId: string, data: ProductVariantUpdate): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(`${this.VARIANTS_URL}/${variantId}`, data);
  }

  deleteVariant(variantId: string): Observable<ProductVariant> {
    return this.http.delete<ProductVariant>(`${this.VARIANTS_URL}/${variantId}`);
  }
}
