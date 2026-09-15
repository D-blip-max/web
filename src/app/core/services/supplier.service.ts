import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Supplier, SupplierCreate, SupplierUpdate } from '../models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/proveedores`;

  getSuppliers(activoOnly: boolean = false): Observable<Supplier[]> {
    let params = new HttpParams();
    if (activoOnly) {
      params = params.set('activo_only', 'true');
    }
    return this.http.get<Supplier[]>(this.API_URL, { params });
  }

  getSupplierById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.API_URL}/${id}`);
  }

  createSupplier(data: SupplierCreate): Observable<Supplier> {
    return this.http.post<Supplier>(this.API_URL, data);
  }

  updateSupplier(id: string, data: SupplierUpdate): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.API_URL}/${id}`, data);
  }

  deleteSupplier(id: string): Observable<Supplier> {
    return this.http.delete<Supplier>(`${this.API_URL}/${id}`);
  }
}
