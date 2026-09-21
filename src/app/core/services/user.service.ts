import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserAdminCreate, UserAdminUpdate } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`);
  }

  createUser(user: UserAdminCreate): Observable<User> {
    return this.http.post<User>(this.API_URL, user);
  }

  updateUser(id: string, user: UserAdminUpdate): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, user);
  }

  toggleActive(id: string): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}/toggle-active`, {});
  }
}
