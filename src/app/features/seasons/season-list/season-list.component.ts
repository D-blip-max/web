import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SeasonService } from '../../../core/services/season.service';
import { Season } from '../../../core/models/season.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-season-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  templateUrl: './season-list.component.html',
  styleUrls: ['./season-list.component.css']
})
export class SeasonListComponent implements OnInit {
  private seasonService = inject(SeasonService);
  private fb = inject(FormBuilder);

  seasons = signal<Season[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Year filter
  selectedYear: number | undefined = undefined;

  // Modal state
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  selectedSeasonId: string | null = null;
  isSaving = signal<boolean>(false);

  seasonForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    fecha_inicio: ['', [Validators.required]],
    fecha_fin: ['', [Validators.required]],
    activa: [false]
  });

  ngOnInit(): void {
    this.loadSeasons();
  }

  loadSeasons(): void {
    this.isLoading.set(true);
    this.seasonService.getSeasons(this.selectedYear).subscribe({
      next: (data) => {
        this.seasons.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cargar temporadas');
        this.isLoading.set(false);
      }
    });
  }

  onYearFilterChange(): void {
    this.loadSeasons();
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedSeasonId = null;
    const currentYear = new Date().getFullYear();
    this.seasonForm.reset({
      nombre: '',
      anio: currentYear,
      fecha_inicio: `${currentYear}-01-01`,
      fecha_fin: `${currentYear}-12-31`,
      activa: false
    });
    this.showModal.set(true);
  }

  openEditModal(season: Season): void {
    this.isEditing.set(true);
    this.selectedSeasonId = season.id;
    this.seasonForm.patchValue({
      nombre: season.nombre,
      anio: season.anio,
      fecha_inicio: season.fecha_inicio,
      fecha_fin: season.fecha_fin,
      activa: season.activa
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedSeasonId = null;
    this.seasonForm.reset();
  }

  onSubmit(): void {
    if (this.seasonForm.invalid) return;

    const formValue = this.seasonForm.value;
    if (formValue.fecha_fin <= formValue.fecha_inicio) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    if (this.isEditing() && this.selectedSeasonId) {
      this.seasonService.updateSeason(this.selectedSeasonId, formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.successMessage.set('Temporada actualizada exitosamente');
          this.loadSeasons();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al actualizar temporada');
        }
      });
    } else {
      this.seasonService.createSeason(formValue).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.successMessage.set('Temporada creada exitosamente');
          this.loadSeasons();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(err.error?.detail || 'Error al crear temporada');
        }
      });
    }
  }

  toggleActiva(season: Season): void {
    const newStatus = !season.activa;
    const msg = newStatus
      ? `¿Activar "${season.nombre}"? Esto desactivará cualquier otra temporada activa para el año ${season.anio}.`
      : `¿Desactivar la temporada "${season.nombre}"?`;

    if (!confirm(msg)) return;

    this.seasonService.updateSeason(season.id, { activa: newStatus }).subscribe({
      next: () => {
        this.successMessage.set(`Temporada "${season.nombre}" ${newStatus ? 'activada' : 'desactivada'}.`);
        this.loadSeasons();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al cambiar estado de temporada');
      }
    });
  }

  deleteSeason(season: Season): void {
    if (!confirm(`¿Estás seguro de eliminar la temporada "${season.nombre}"?`)) return;

    this.seasonService.deleteSeason(season.id).subscribe({
      next: () => {
        this.successMessage.set(`Temporada "${season.nombre}" eliminada.`);
        this.loadSeasons();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Error al eliminar temporada');
      }
    });
  }
}
