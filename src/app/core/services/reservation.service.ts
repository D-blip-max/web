import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Reservation,
  ReservationCreate,
  ReservationStatus,
  ExpireReservationsResponse,
} from '../models/reservation.model';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/reservas`;

  createReservation(data: ReservationCreate): Observable<Reservation> {
    return this.http.post<Reservation>(this.API_URL, data);
  }

  getMyReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.API_URL}/mis-reservas`);
  }

  getReservations(filters?: {
    sucursal_id?: string;
    estado?: ReservationStatus;
    cliente_id?: string;
    limit?: number;
    offset?: number;
  }): Observable<Reservation[]> {
    let params = new HttpParams();
    if (filters?.sucursal_id) params = params.set('sucursal_id', filters.sucursal_id);
    if (filters?.estado) params = params.set('estado', filters.estado);
    if (filters?.cliente_id) params = params.set('cliente_id', filters.cliente_id);
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    if (filters?.offset) params = params.set('offset', filters.offset.toString());
    return this.http.get<Reservation[]>(this.API_URL, { params });
  }

  getReservationById(id: string): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.API_URL}/${id}`);
  }

  cancelReservation(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.API_URL}/${id}/cancelar`, {});
  }

  prepareReservation(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.API_URL}/${id}/preparar`, {});
  }

  pickupReservation(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.API_URL}/${id}/recoger`, {});
  }

  expireReservations(): Observable<ExpireReservationsResponse> {
    return this.http.post<ExpireReservationsResponse>(
      `${this.API_URL}/expirar-vencidas`,
      {}
    );
  }
}
