import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Season, SeasonCreate, SeasonUpdate } from '../models/season.model';

/** Mapeo API → modelo TS: la API usa "año", el template Angular necesita "anio" */
function mapSeason(raw: any): Season {
  return {
    id: raw.id,
    nombre: raw.nombre,
    anio: raw['año'] ?? raw.anio,
    fecha_inicio: raw.fecha_inicio,
    fecha_fin: raw.fecha_fin,
    activa: raw.activa,
    created_at: raw.created_at,
    updated_at: raw.updated_at
  };
}

/** Mapeo modelo TS → API: convierte "anio" de vuelta a "año" */
function toApiPayload(data: SeasonCreate | SeasonUpdate): any {
  const { anio, ...rest } = data as any;
  const payload: any = { ...rest };
  if (anio !== undefined) {
    payload['año'] = anio;
  }
  return payload;
}

@Injectable({
  providedIn: 'root'
})
export class SeasonService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/temporadas`;

  getSeasons(anio?: number, activaOnly: boolean = false): Observable<Season[]> {
    let params = new HttpParams();
    if (anio !== undefined && anio !== null) {
      params = params.set('año', String(anio));
    }
    if (activaOnly) {
      params = params.set('activa_only', 'true');
    }
    return this.http.get<any[]>(this.API_URL, { params }).pipe(
      map(seasons => seasons.map(mapSeason))
    );
  }

  getSeasonById(id: string): Observable<Season> {
    return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
      map(mapSeason)
    );
  }

  createSeason(data: SeasonCreate): Observable<Season> {
    return this.http.post<any>(this.API_URL, toApiPayload(data)).pipe(
      map(mapSeason)
    );
  }

  updateSeason(id: string, data: SeasonUpdate): Observable<Season> {
    return this.http.put<any>(`${this.API_URL}/${id}`, toApiPayload(data)).pipe(
      map(mapSeason)
    );
  }

  deleteSeason(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
