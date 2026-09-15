import { Component, Input, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { Role, GroupedPermissions, Permission } from '../../../core/models/role.model';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-permissions.component.html',
  styleUrls: ['./role-permissions.component.css']
})
export class RolePermissionsComponent implements OnInit {
  @Input() role: Role | null = null;
  @Input() id?: string; // For route parameter binding /roles/:id/permissions

  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private router = inject(Router);

  roleData = signal<Role | null>(null);
  groupedPermissions = signal<GroupedPermissions[]>([]);
  selectedPermissionIds = signal<Set<string>>(new Set());
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isStandaloneRoute = signal<boolean>(false);

  ngOnInit(): void {
    if (this.id) {
      this.isStandaloneRoute.set(true);
      this.loadRoleAndPermissions(this.id);
    } else if (this.role) {
      this.roleData.set(this.role);
      if (this.role.permissions) {
        const initialSet = new Set<string>(this.role.permissions.map((p) => p.id));
        this.selectedPermissionIds.set(initialSet);
      }
      this.loadPermissions();
    }
  }

  private loadRoleAndPermissions(roleId: string): void {
    this.isLoading.set(true);
    this.roleService.getRoleById(roleId).subscribe({
      next: (role) => {
        this.roleData.set(role);
        if (role.permissions) {
          const initialSet = new Set<string>(role.permissions.map((p) => p.id));
          this.selectedPermissionIds.set(initialSet);
        }
        this.loadPermissions();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar el rol');
        this.isLoading.set(false);
      }
    });
  }

  loadPermissions(): void {
    this.roleService.getGroupedPermissions().subscribe({
      next: (groups) => {
        this.groupedPermissions.set(groups);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar permisos');
        this.isLoading.set(false);
      }
    });
  }

  isPermissionSelected(permId: string): boolean {
    return this.selectedPermissionIds().has(permId);
  }

  togglePermission(perm: Permission): void {
    const currentRole = this.roleData();
    if (currentRole?.name === 'admin' && perm.code === 'roles.update') {
      return;
    }

    const current = new Set(this.selectedPermissionIds());
    if (current.has(perm.id)) {
      current.delete(perm.id);
    } else {
      current.add(perm.id);
    }
    this.selectedPermissionIds.set(current);
  }

  isModuleAllSelected(group: GroupedPermissions): boolean {
    return group.permissions.every((p) => this.selectedPermissionIds().has(p.id));
  }

  toggleModule(group: GroupedPermissions): void {
    const currentRole = this.roleData();
    const current = new Set(this.selectedPermissionIds());
    const allSelected = this.isModuleAllSelected(group);

    group.permissions.forEach((p) => {
      if (allSelected) {
        if (!(currentRole?.name === 'admin' && p.code === 'roles.update')) {
          current.delete(p.id);
        }
      } else {
        current.add(p.id);
      }
    });
    this.selectedPermissionIds.set(current);
  }

  onSave(): void {
    const currentRole = this.roleData();
    if (!currentRole) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const permissionIds = Array.from(this.selectedPermissionIds());
    this.roleService.assignPermissions(currentRole.id, permissionIds).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.authService.fetchCurrentUser().subscribe({ error: () => {} });
        this.save.emit();
        if (this.isStandaloneRoute()) {
          this.router.navigate(['/roles']);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al guardar permisos');
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
    if (this.isStandaloneRoute()) {
      this.router.navigate(['/roles']);
    }
  }
}
