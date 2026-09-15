import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Branch, BranchCreate, BranchUpdate } from '../models/branch.model';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/sucursales`;

  getBranches(activaOnly: boolean = false): Observable<Branch[]> {
    let params = new HttpParams();
    if (activaOnly) {
      params = params.set('activa_only', 'true');
    }
    return this.http.get<Branch[]>(this.API_URL, { params });
  }

  getBranchById(id: string): Observable<Branch> {
    return this.http.get<Branch>(`${this.API_URL}/${id}`);
  }

  createBranch(data: BranchCreate): Observable<Branch> {
    return this.http.post<Branch>(this.API_URL, data);
  }

  updateBranch(id: string, data: BranchUpdate): Observable<Branch> {
    return this.http.put<Branch>(`${this.API_URL}/${id}`, data);
  }

  deleteBranch(id: string): Observable<Branch> {
    return this.http.delete<Branch>(`${this.API_URL}/${id}`);
  }
}
