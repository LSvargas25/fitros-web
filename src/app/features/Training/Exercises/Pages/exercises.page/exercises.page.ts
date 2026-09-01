import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { LucideAngularModule, Dumbbell, Plus, Pencil, Archive, X, Search, AlertTriangle } from 'lucide-angular';

import { DialogService } from '../../../../../core/Dialog/dialog.service';
import { ExerciseService } from '../../services/exercise.service';
import {
  ExerciseListItem,
  MuscleGroup,
  MUSCLE_GROUP_LABEL,
  MUSCLE_GROUP_OPTIONS,
} from '../../models/exercise.models';

@Component({
  selector: 'app-exercises-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './exercises.page.html',
  styleUrl: './exercises.page.css',
})
export class ExercisesPage implements OnInit {
  private readonly exerciseService = inject(ExerciseService);
  private readonly dialog = inject(DialogService);

  readonly Dumbbell = Dumbbell;
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Archive = Archive;
  readonly X = X;
  readonly Search = Search;
  readonly AlertTriangle = AlertTriangle;

  readonly muscleGroupOptions = MUSCLE_GROUP_OPTIONS;

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly exercises = signal<ExerciseListItem[]>([]);

  // Filters — category is server-side (re-fetches), name search is client-side.
  categoryFilter: MuscleGroup | '' = '';
  search = '';

  /** Rows after the client-side name filter. A method (not a computed) because `search`
   *  is a plain ngModel property, not a signal. */
  filteredExercises(): ExerciseListItem[] {
    const term = this.search.trim().toLowerCase();
    const list = this.exercises();
    if (!term) return list;
    return list.filter((e) => e.name.toLowerCase().includes(term));
  }

  // Create / edit modal
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isFormLoading = signal(false);
  readonly isSaving = signal(false);
  readonly formError = signal<string | null>(null);
  formName = '';
  formDescription = '';
  formCategory: MuscleGroup | '' = '';

  // Row-level archive state
  readonly archivingId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.exerciseService.list(this.categoryFilter === '' ? undefined : this.categoryFilter).subscribe({
      next: (list) => {
        this.exercises.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.detail ?? 'No se pudieron cargar los ejercicios.');
        this.isLoading.set(false);
      },
    });
  }

  onCategoryFilterChange(): void {
    this.load();
  }

  categoryLabel(category: MuscleGroup): string {
    return MUSCLE_GROUP_LABEL[category] ?? '—';
  }

  // ── Create / edit ──────────────────────────────────────────────────────────
  openCreate(): void {
    this.editingId.set(null);
    this.formError.set(null);
    this.formName = '';
    this.formDescription = '';
    this.formCategory = '';
    this.showForm.set(true);
  }

  openEdit(item: ExerciseListItem): void {
    this.editingId.set(item.id);
    this.formError.set(null);
    // Prefill what we already have; the list DTO has no description, so fetch the full record.
    this.formName = item.name;
    this.formDescription = '';
    this.formCategory = item.category;
    this.showForm.set(true);
    this.isFormLoading.set(true);

    this.exerciseService.getById(item.id).subscribe({
      next: (detail) => {
        this.formName = detail.name;
        this.formDescription = detail.description ?? '';
        this.formCategory = detail.category;
        this.isFormLoading.set(false);
      },
      error: (err) => {
        this.isFormLoading.set(false);
        this.formError.set(err?.detail ?? 'No se pudo cargar el ejercicio.');
      },
    });
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.formError.set(null);

    const name = this.formName.trim();
    if (!name) {
      this.formError.set('El nombre es obligatorio.');
      return;
    }
    if (this.formCategory === '') {
      this.formError.set('Selecciona un grupo muscular.');
      return;
    }

    const base = {
      name,
      description: this.formDescription.trim(),
      category: this.formCategory,
    };

    this.isSaving.set(true);

    const editingId = this.editingId();
    const request$: Observable<unknown> = editingId
      ? this.exerciseService.update({ id: editingId, ...base })
      : this.exerciseService.create(base);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err: { detail?: string }) => {
        this.isSaving.set(false);
        this.formError.set(err?.detail ?? 'No se pudo guardar el ejercicio.');
      },
    });
  }

  // ── Archive ────────────────────────────────────────────────────────────────
  async archive(item: ExerciseListItem): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Archivar ejercicio',
      message: `¿Archivar "${item.name}"? Dejará de estar disponible para nuevas rutinas.`,
      confirmText: 'Archivar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

    this.actionError.set(null);
    this.archivingId.set(item.id);

    this.exerciseService.archive(item.id).subscribe({
      next: () => {
        // The list endpoint still returns archived rows, so drop it locally instead of refetching.
        this.exercises.update((list) => list.filter((e) => e.id !== item.id));
        this.archivingId.set(null);
      },
      error: (err) => {
        this.archivingId.set(null);
        this.actionError.set(err?.detail ?? 'No se pudo archivar el ejercicio.');
      },
    });
  }
}
