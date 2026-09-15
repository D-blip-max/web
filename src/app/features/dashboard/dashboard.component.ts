import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { User } from '../../core/models/user.model';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  authService = inject(AuthService);
  tokenService = inject(TokenService);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  profileForm: FormGroup = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({ full_name: user.full_name });
    } else {
      this.authService.fetchCurrentUser().subscribe({
        next: (u) => this.profileForm.patchValue({ full_name: u.full_name })
      });
    }
  }

  toggleEdit(): void {
    this.isEditing.update((v) => !v);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({ full_name: user.full_name });
    }
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.successMessage.set('¡Perfil actualizado con éxito!');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al actualizar perfil');
      }
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe();
  }

  getTokenInfo(): any {
    return this.tokenService.getTokenPayload();
  }
}
