import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/bitacora`;

  getLogs(query?: string, module?: string, role?: string, limit: number = 100): Observable<AuditLog[]> {
    let params = new HttpParams().set('limit', limit.toString());

    if (query && query.trim()) {
      params = params.set('query', query.trim());
    }

    if (module && module !== 'all') {
      params = params.set('module', module);
    }

    if (role && role !== 'all') {
      params = params.set('role', role);
    }

    return this.http.get<AuditLog[]>(this.API_URL, { params });
  }
}
