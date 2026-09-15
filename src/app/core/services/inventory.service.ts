import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InventoryItem,
  InventoryUpdate,
  ReceptionCreate,
  ReceptionResponse,
  StockAdjustment,
  InventoryMovement,
  StockAlert,
  AvailabilityItem,
  MovementType,
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventario`;

  getStockByBranch(
    sucursalId: string,
    soloConStock: boolean = false
  ): Observable<InventoryItem[]> {
    let params = new HttpParams();
    if (soloConStock) {
      params = params.set('solo_con_stock', 'true');
    }
    return this.http.get<InventoryItem[]>(
      `${this.API_URL}/sucursal/${sucursalId}`,
      { params }
    );
  }

  updateInventorySettings(
    inventarioId: string,
    data: InventoryUpdate
  ): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(
      `${this.API_URL}/${inventarioId}`,
      data
    );
  }

  receiveProducts(data: ReceptionCreate): Observable<ReceptionResponse> {
    return this.http.post<ReceptionResponse>(
      `${this.API_URL}/recepcion`,
      data
    );
  }

  adjustStock(data: StockAdjustment): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.API_URL}/ajuste`, data);
  }

  getMovements(filters?: {
    sucursal_id?: string;
    tipo?: MovementType;
    limit?: number;
    offset?: number;
  }): Observable<InventoryMovement[]> {
    let params = new HttpParams();
    if (filters?.sucursal_id) {
      params = params.set('sucursal_id', filters.sucursal_id);
    }
    if (filters?.tipo) {
      params = params.set('tipo', filters.tipo);
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params = params.set('offset', filters.offset.toString());
    }
    return this.http.get<InventoryMovement[]>(`${this.API_URL}/movimientos`, {
      params,
    });
  }

  getAlerts(sucursalId?: string): Observable<StockAlert[]> {
    let params = new HttpParams();
    if (sucursalId) {
      params = params.set('sucursal_id', sucursalId);
    }
    return this.http.get<StockAlert[]>(`${this.API_URL}/alertas`, { params });
  }

  getAvailability(filters?: {
    producto_id?: string;
    sucursal_id?: string;
    categoria_id?: string;
    talla?: string;
    color?: string;
    ciudad?: string;
  }): Observable<AvailabilityItem[]> {
    let params = new HttpParams();
    if (filters?.producto_id) params = params.set('producto_id', filters.producto_id);
    if (filters?.sucursal_id) params = params.set('sucursal_id', filters.sucursal_id);
    if (filters?.categoria_id) params = params.set('categoria_id', filters.categoria_id);
    if (filters?.talla) params = params.set('talla', filters.talla);
    if (filters?.color) params = params.set('color', filters.color);
    if (filters?.ciudad) params = params.set('ciudad', filters.ciudad);
    return this.http.get<AvailabilityItem[]>(`${this.API_URL}/disponibilidad`, {
      params,
    });
  }
}
