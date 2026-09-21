import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { UserFormComponent } from '../user-form/user-form.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HasPermissionDirective,
    UserFormComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private authService = inject(AuthService);

  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Filtros
  searchQuery = signal<string>('');
  roleFilter = signal<string>('all');
  statusFilter = signal<string>('all');

  // Modales
  showFormModal = signal<boolean>(false);
  selectedUserForEdit = signal<User | null>(null);

  // ID del usuario logueado actualmente (para evitar auto-bloqueo)
  currentUserId = computed(() => this.authService.currentUser()?.id || null);

  // Métricas calculadas
  totalUsers = computed(() => this.users().length);
  totalAdmins = computed(() => 
    this.users().filter(u => u.role?.name?.toLowerCase() === 'admin').length
  );
  totalStaff = computed(() => 
    this.users().filter(u => ['cajero', 'almacenero'].includes(u.role?.name?.toLowerCase() || '')).length
  );
  totalClients = computed(() => 
    this.users().filter(u => u.role?.name?.toLowerCase() === 'cliente').length
  );

  // Lista filtrada reactiva
  filteredUsers = computed(() => {
    let result = this.users();
    const query = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();
    const status = this.statusFilter();

    if (query) {
      result = result.filter(u =>
        (u.full_name?.toLowerCase().includes(query)) ||
        (u.email?.toLowerCase().includes(query))
      );
    }

    if (role !== 'all') {
      result = result.filter(u => u.role?.name?.toLowerCase() === role.toLowerCase());
    }

    if (status === 'active') {
      result = result.filter(u => u.is_active);
    } else if (status === 'inactive') {
      result = result.filter(u => !u.is_active);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Cargar usuarios y roles en paralelo
    this.roleService.getRoles().subscribe({
      next: (roleData) => {
        this.roles.set(roleData);
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
      }
    });

    this.userService.getUsers().subscribe({
      next: (userData) => {
        this.users.set(userData);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar usuarios');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.selectedUserForEdit.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(user: User): void {
    this.selectedUserForEdit.set(user);
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.selectedUserForEdit.set(null);
  }

  onUserSaved(): void {
    const isEdit = !!this.selectedUserForEdit();
    this.closeFormModal();
    this.successMessage.set(isEdit ? 'Usuario actualizado correctamente.' : 'Usuario creado exitosamente.');
    setTimeout(() => this.successMessage.set(null), 5000);
    this.loadData();
  }

  toggleUserActive(user: User): void {
    if (user.id === this.currentUserId()) {
      this.errorMessage.set('No puedes desactivar tu propia cuenta de administrador.');
      setTimeout(() => this.errorMessage.set(null), 4000);
      return;
    }

    const action = user.is_active ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de que deseas ${action} la cuenta de "${user.full_name}"?`)) {
      return;
    }

    this.userService.toggleActive(user.id).subscribe({
      next: (updatedUser) => {
        this.users.update(list => list.map(u => u.id === updatedUser.id ? updatedUser : u));
        this.successMessage.set(`Usuario "${updatedUser.full_name}" ${updatedUser.is_active ? 'activado' : 'desactivado'} con éxito.`);
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || `Error al ${action} usuario`);
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getRoleBadgeClass(roleName?: string): string {
    switch (roleName?.toLowerCase()) {
      case 'admin':
        return 'badge-role-admin';
      case 'cajero':
        return 'badge-role-cajero';
      case 'almacenero':
        return 'badge-role-almacenero';
      case 'cliente':
        return 'badge-role-cliente';
      default:
        return 'badge-role-default';
    }
  }
}
