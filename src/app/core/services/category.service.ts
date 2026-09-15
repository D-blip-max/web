import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CategoryCreate, CategoryUpdate } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/categorias`;

  getCategories(activaOnly: boolean = false): Observable<Category[]> {
    let params = new HttpParams();
    if (activaOnly) {
      params = params.set('activa_only', 'true');
    }
    return this.http.get<Category[]>(this.API_URL, { params });
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.API_URL}/${id}`);
  }

  createCategory(data: CategoryCreate): Observable<Category> {
    return this.http.post<Category>(this.API_URL, data);
  }

  updateCategory(id: string, data: CategoryUpdate): Observable<Category> {
    return this.http.put<Category>(`${this.API_URL}/${id}`, data);
  }

  deleteCategory(id: string): Observable<Category> {
    return this.http.delete<Category>(`${this.API_URL}/${id}`);
  }
}
