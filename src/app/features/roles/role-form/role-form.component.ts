import { Component, Input, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.css']
})
export class RoleFormComponent implements OnInit {
  @Input() role: Role | null = null;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);

  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    if (this.role) {
      this.form.patchValue({
        name: this.role.name,
        description: this.role.description || ''
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const payload = this.form.value;

    if (this.role) {
      this.roleService.updateRole(this.role.id, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.save.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al actualizar el rol');
        }
      });
    } else {
      this.roleService.createRole(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.save.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al crear el rol');
        }
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
