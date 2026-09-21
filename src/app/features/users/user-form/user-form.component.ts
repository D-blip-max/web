import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User, UserAdminCreate, UserAdminUpdate } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit, OnChanges {
  @Input() user: User | null = null;
  @Input() roles: Role[] = [];
  @Input() currentUserId: string | null = null;

  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  isSelfEdit = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    role_id: ['', [Validators.required]],
    password: ['', [Validators.minLength(8)]],
    is_active: [true]
  });

  ngOnInit(): void {
    this.setupForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] || changes['currentUserId']) {
      this.setupForm();
    }
  }

  private setupForm(): void {
    const isSelf = !!(this.user && this.currentUserId && this.user.id === this.currentUserId);
    this.isSelfEdit.set(isSelf);

    if (this.user) {
      // Modo Edición
      this.form.patchValue({
        full_name: this.user.full_name,
        email: this.user.email,
        role_id: this.user.role?.id || '',
        password: '',
        is_active: this.user.is_active
      });

      // Contraseña opcional al editar
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.setValidators([Validators.minLength(8)]);
      this.form.get('password')?.updateValueAndValidity();

      if (isSelf) {
        this.form.get('role_id')?.disable();
        this.form.get('is_active')?.disable();
      } else {
        this.form.get('role_id')?.enable();
        this.form.get('is_active')?.enable();
      }
    } else {
      // Modo Creación
      this.form.reset({
        full_name: '',
        email: '',
        role_id: this.roles.length > 0 ? this.roles[0].id : '',
        password: '',
        is_active: true
      });

      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('role_id')?.enable();
      this.form.get('is_active')?.enable();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const rawValues = this.form.getRawValue();

    if (this.user) {
      // Actualizar usuario existente
      const payload: UserAdminUpdate = {
        full_name: rawValues.full_name,
        email: rawValues.email,
        role_id: rawValues.role_id || undefined,
        is_active: rawValues.is_active
      };

      if (rawValues.password && rawValues.password.trim().length > 0) {
        payload.password = rawValues.password.trim();
      }

      this.userService.updateUser(this.user.id, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.save.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al actualizar usuario');
        }
      });
    } else {
      // Crear nuevo usuario
      const payload: UserAdminCreate = {
        full_name: rawValues.full_name,
        email: rawValues.email,
        password: rawValues.password,
        role_id: rawValues.role_id || undefined,
        is_active: rawValues.is_active
      };

      this.userService.createUser(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.save.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al crear usuario');
        }
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
