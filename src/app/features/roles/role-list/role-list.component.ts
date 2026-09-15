import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { Role } from '../../../core/models/role.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { RoleFormComponent } from '../role-form/role-form.component';
import { RolePermissionsComponent } from '../role-permissions/role-permissions.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HasPermissionDirective,
    RoleFormComponent,
    RolePermissionsComponent
  ],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.css']
})
export class RoleListComponent implements OnInit {
  private roleService = inject(RoleService);

  roles = signal<Role[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modal / Selection state
  showFormModal = signal<boolean>(false);
  selectedRoleForEdit = signal<Role | null>(null);

  showPermissionsModal = signal<boolean>(false);
  selectedRoleForPermissions = signal<Role | null>(null);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading.set(true);
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.roles.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar roles');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.selectedRoleForEdit.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(role: Role): void {
    this.selectedRoleForEdit.set(role);
    this.showFormModal.set(true);
  }

  openPermissionsModal(role: Role): void {
    this.selectedRoleForPermissions.set(role);
    this.showPermissionsModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.selectedRoleForEdit.set(null);
  }

  closePermissionsModal(): void {
    this.showPermissionsModal.set(false);
    this.selectedRoleForPermissions.set(null);
  }

  onRoleSaved(): void {
    this.closeFormModal();
    this.successMessage.set('Rol guardado exitosamente');
    this.loadRoles();
  }

  onPermissionsSaved(): void {
    this.closePermissionsModal();
    this.successMessage.set('Permisos actualizados exitosamente');
    this.loadRoles();
  }

  deleteRole(role: Role): void {
    if (!confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) return;

    this.roleService.deleteRole(role.id).subscribe({
      next: () => {
        this.successMessage.set(`Rol "${role.name}" eliminado.`);
        this.loadRoles();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al eliminar rol');
      }
    });
  }
}
