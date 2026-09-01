import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { LucideAngularModule, ListChecks, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, AlertTriangle, GitBranch } from 'lucide-angular';

import { DialogService } from '../../../../../core/Dialog/dialog.service';
import { RoutineService } from '../../services/routine.service';
import { RoutineDetail, RoutineExercise, RoutineStatus, RoutineVersionListItem, ROUTINE_STATUS_LABEL } from '../../models/routine.models';
import { ExerciseService } from '../../../Exercises/services/exercise.service';
import { ExerciseListItem } from '../../../Exercises/models/exercise.models';

@Component({
  selector: 'app-routine-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './routine-detail.page.html',
  styleUrl: './routine-detail.page.css',
})
export class RoutineDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routineService = inject(RoutineService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly dialog = inject(DialogService);

  readonly ListChecks = ListChecks;
  readonly ArrowLeft = ArrowLeft;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly ChevronUp = ChevronUp;
  readonly ChevronDown = ChevronDown;
  readonly AlertTriangle = AlertTriangle;
  readonly GitBranch = GitBranch;

  readonly RoutineStatus = RoutineStatus;
  readonly routineStatusLabel = ROUTINE_STATUS_LABEL;

  private routineId = '';

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly routine = signal<RoutineDetail | null>(null);
  readonly catalog = signal<ExerciseListItem[]>([]);

  readonly actionError = signal<string | null>(null);
  readonly busyExerciseId = signal<string | null>(null);

  // ── Versioning ────────────────────────────────────────────────────────────
  readonly versions = signal<RoutineVersionListItem[]>([]);
  readonly versionsError = signal<string | null>(null);
  readonly isCreatingVersion = signal(false);
  readonly createVersionError = signal<string | null>(null);

  /** A new Draft version can only be forked from a Published routine (backend rule). */
  readonly canCreateVersion = computed(() => this.routine()?.status === RoutineStatus.Published);

  // add-exercise form
  addExerciseId = '';
  addSets: number | null = 3;
  addReps: number | null = 10;
  addRest: number | null = 60;
  readonly isAdding = signal(false);
  readonly addError = signal<string | null>(null);

  readonly isDraft = computed(() => this.routine()?.status === RoutineStatus.Draft);
  readonly statusLabel = computed(() => {
    const s = this.routine()?.status;
    return s != null ? ROUTINE_STATUS_LABEL[s as RoutineStatus] ?? String(s) : '';
  });

  /** Ordered exercises (the API already sorts by `order`, kept defensive). */
  readonly exercises = computed<RoutineExercise[]>(() =>
    [...(this.routine()?.exercises ?? [])].sort((a, b) => a.order - b.order),
  );

  /** Catalogue entries not already in the routine. */
  readonly availableToAdd = computed<ExerciseListItem[]>(() => {
    const used = new Set(this.exercises().map((e) => e.exerciseId));
    return this.catalog().filter((e) => !used.has(e.id));
  });

  exerciseName(id: string): string {
    return this.catalog().find((e) => e.id === id)?.name ?? id;
  }

  ngOnInit(): void {
    this.routineId = this.route.snapshot.paramMap.get('id') ?? '';
    this.exerciseService.list().subscribe({
      next: (list) => this.catalog.set(list),
      error: () => {},
    });
    this.load();
  }

  load(): void {
    if (!this.routineId) {
      this.isLoading.set(false);
      this.error.set('Ruta inválida.');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    this.routineService.getById(this.routineId).subscribe({
      next: (r) => {
        this.routine.set(r);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.detail ?? 'No se pudo cargar la rutina.');
        this.isLoading.set(false);
      },
    });
    this.loadVersions();
  }

  private loadVersions(): void {
    this.versionsError.set(null);
    this.routineService.getVersions(this.routineId).subscribe({
      next: (list) => this.versions.set(list),
      error: (err) => this.versionsError.set(err?.detail ?? 'No se pudo cargar el historial de versiones.'),
    });
  }

  /** Fork a new Draft from this Published routine and open it. */
  createVersion(): void {
    if (!this.canCreateVersion() || this.isCreatingVersion()) return;
    this.createVersionError.set(null);
    this.isCreatingVersion.set(true);
    this.routineService.createVersion(this.routineId).subscribe({
      next: (res) => {
        this.isCreatingVersion.set(false);
        this.router.navigate(['/manage/training/routines', res.id]);
      },
      error: (err) => {
        this.isCreatingVersion.set(false);
        this.createVersionError.set(err?.detail ?? 'No se pudo crear una nueva versión.');
      },
    });
  }

  private reload(): void {
    this.routineService.getById(this.routineId).subscribe({
      next: (r) => this.routine.set(r),
      error: (err) => this.actionError.set(err?.detail ?? 'No se pudo recargar la rutina.'),
    });
  }

  // ── Add ────────────────────────────────────────────────────────────────────
  addExercise(): void {
    this.addError.set(null);
    if (!this.addExerciseId) {
      this.addError.set('Elige un ejercicio del catálogo.');
      return;
    }
    if (!this.addSets || this.addSets < 1 || !this.addReps || this.addReps < 1) {
      this.addError.set('Series y repeticiones deben ser al menos 1.');
      return;
    }
    if (this.addRest == null || this.addRest < 0) {
      this.addError.set('El descanso no puede ser negativo.');
      return;
    }

    this.isAdding.set(true);
    this.routineService
      .addExercise(this.routineId, {
        exerciseId: this.addExerciseId,
        order: this.exercises().length + 1,
        suggestedSets: this.addSets,
        suggestedReps: this.addReps,
        suggestedRestSeconds: this.addRest,
      })
      .subscribe({
        next: () => {
          this.isAdding.set(false);
          this.addExerciseId = '';
          this.reload();
        },
        error: (err) => {
          this.isAdding.set(false);
          this.addError.set(err?.detail ?? 'No se pudo agregar el ejercicio.');
        },
      });
  }

  // ── Remove ─────────────────────────────────────────────────────────────────
  async remove(ex: RoutineExercise): Promise<void> {
    if (this.busyExerciseId()) return;
    const confirmed = await this.dialog.confirm({
      title: 'Quitar ejercicio',
      message: `¿Quitar "${this.exerciseName(ex.exerciseId)}" de la rutina?`,
      confirmText: 'Quitar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    this.runRowAction(ex.exerciseId, () =>
      this.routineService.removeExercise(this.routineId, ex.exerciseId),
    );
  }

  // ── Reorder ────────────────────────────────────────────────────────────────
  moveUp(ex: RoutineExercise): void {
    if (ex.order <= 1) return;
    this.runRowAction(ex.exerciseId, () =>
      this.routineService.moveExercise(this.routineId, ex.exerciseId, ex.order - 1),
    );
  }

  moveDown(ex: RoutineExercise): void {
    if (ex.order >= this.exercises().length) return;
    this.runRowAction(ex.exerciseId, () =>
      this.routineService.moveExercise(this.routineId, ex.exerciseId, ex.order + 1),
    );
  }

  private runRowAction(exerciseId: string, request: () => Observable<void>): void {
    if (this.busyExerciseId()) return;
    this.actionError.set(null);
    this.busyExerciseId.set(exerciseId);
    request().subscribe({
      next: () => {
        this.busyExerciseId.set(null);
        this.reload();
      },
      error: (err) => {
        this.busyExerciseId.set(null);
        this.actionError.set(err?.detail ?? 'No se pudo completar la acción.');
      },
    });
  }
}
