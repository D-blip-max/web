import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Sale,
  PresencialSaleCreate,
  DigitalSaleCreate,
  SaleType,
  SaleStatus,
  SalesSummaryReport,
  TopProductReport,
} from '../models/sale.model';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/ventas`;

  createPresencialSale(data: PresencialSaleCreate): Observable<Sale> {
    return this.http.post<Sale>(`${this.API_URL}/presencial`, data);
  }

  createDigitalSale(data: DigitalSaleCreate): Observable<Sale> {
    return this.http.post<Sale>(`${this.API_URL}/digital`, data);
  }

  getSales(filters?: {
    sucursal_id?: string;
    tipo?: SaleType;
    estado?: SaleStatus;
    cajero_id?: string;
    cliente_id?: string;
    limit?: number;
    offset?: number;
  }): Observable<Sale[]> {
    let params = new HttpParams();
    if (filters?.sucursal_id) params = params.set('sucursal_id', filters.sucursal_id);
    if (filters?.tipo) params = params.set('tipo', filters.tipo);
    if (filters?.estado) params = params.set('estado', filters.estado);
    if (filters?.cajero_id) params = params.set('cajero_id', filters.cajero_id);
    if (filters?.cliente_id) params = params.set('cliente_id', filters.cliente_id);
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    if (filters?.offset) params = params.set('offset', filters.offset.toString());
    return this.http.get<Sale[]>(this.API_URL, { params });
  }

  getSaleById(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.API_URL}/${id}`);
  }

  cancelSale(id: string, motivo: string): Observable<Sale> {
    return this.http.patch<Sale>(`${this.API_URL}/${id}/cancelar`, { motivo });
  }

  getSummaryReport(sucursalId?: string): Observable<SalesSummaryReport> {
    let params = new HttpParams();
    if (sucursalId) params = params.set('sucursal_id', sucursalId);
    return this.http.get<SalesSummaryReport>(`${this.API_URL}/reportes/resumen`, {
      params,
    });
  }

  getTopProducts(
    sucursalId?: string,
    limit: number = 10
  ): Observable<TopProductReport[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (sucursalId) params = params.set('sucursal_id', sucursalId);
    return this.http.get<TopProductReport[]>(
      `${this.API_URL}/reportes/top-productos`,
      { params }
    );
  }
}
