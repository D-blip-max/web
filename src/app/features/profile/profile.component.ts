import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('new_password')?.value;
  const confirmPassword = control.get('confirm_password')?.value;
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordsMismatch: true };
  }
  return null;
}

function passwordDifferentValidator(control: AbstractControl): ValidationErrors | null {
  const currentPassword = control.get('current_password')?.value;
  const newPassword = control.get('new_password')?.value;
  if (currentPassword && newPassword && currentPassword === newPassword) {
    return { samePassword: true };
  }
  return null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // UI States
  isSavingProfile = signal<boolean>(false);
  isChangingPassword = signal<boolean>(false);
  profileSuccess = signal<string | null>(null);
  profileError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  // Password visibility toggles
  showCurrent = signal<boolean>(false);
  showNew = signal<boolean>(false);
  showConfirm = signal<boolean>(false);

  ngOnInit(): void {
    const user = this.currentUser();

    this.profileForm = this.fb.group({
      full_name: [user?.full_name || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirm_password: ['', [Validators.required]]
    }, {
      validators: [passwordsMatchValidator, passwordDifferentValidator]
    });
  }

  toggleCurrent(): void {
    this.showCurrent.update(v => !v);
  }

  toggleNew(): void {
    this.showNew.update(v => !v);
  }

  toggleConfirm(): void {
    this.showConfirm.update(v => !v);
  }

  getUserInitials(): string {
    const name = this.currentUser()?.full_name || 'U';
    return name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getRoleBadgeClass(roleName: string): string {
    switch (roleName.toLowerCase()) {
      case 'admin':
      case 'administrador':
        return 'badge-admin';
      case 'cajero':
        return 'badge-cajero';
      case 'almacenero':
        return 'badge-almacenero';
      default:
        return 'badge-cliente';
    }
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSavingProfile.set(true);
    this.profileSuccess.set(null);
    this.profileError.set(null);

    const { full_name } = this.profileForm.value;

    this.authService.updateProfile({ full_name }).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.profileSuccess.set('Perfil actualizado exitosamente.');
        setTimeout(() => this.profileSuccess.set(null), 4000);
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        this.profileError.set(err.error?.detail || 'Error al actualizar el perfil.');
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isChangingPassword.set(true);
    this.passwordSuccess.set(null);
    this.passwordError.set(null);

    const { current_password, new_password } = this.passwordForm.value;

    this.authService.changePassword({ current_password, new_password }).subscribe({
      next: (res) => {
        this.isChangingPassword.set(false);
        this.passwordSuccess.set(res.message || '¡Contraseña actualizada exitosamente!');
        this.passwordForm.reset();
        setTimeout(() => this.passwordSuccess.set(null), 5000);
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.passwordError.set(err.error?.detail || 'Error al cambiar la contraseña. Verifica tu clave actual.');
      }
    });
  }
}
