import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Role,
  RoleCreate,
  RoleUpdate,
  GroupedPermissions,
  RolePermissionAssign
} from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  private readonly ROLES_URL = `${environment.apiUrl}/roles`;
  private readonly PERMISSIONS_URL = `${environment.apiUrl}/permissions`;

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.ROLES_URL);
  }

  getRoleById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.ROLES_URL}/${id}`);
  }

  createRole(role: RoleCreate): Observable<Role> {
    return this.http.post<Role>(this.ROLES_URL, role);
  }

  updateRole(id: string, role: RoleUpdate): Observable<Role> {
    return this.http.put<Role>(`${this.ROLES_URL}/${id}`, role);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.ROLES_URL}/${id}`);
  }

  getGroupedPermissions(): Observable<GroupedPermissions[]> {
    return this.http.get<GroupedPermissions[]>(this.PERMISSIONS_URL);
  }

  assignPermissions(roleId: string, permissionIds: string[]): Observable<Role> {
    const payload: RolePermissionAssign = { permission_ids: permissionIds };
    return this.http.put<Role>(`${this.ROLES_URL}/${roleId}/permissions`, payload);
  }
}
