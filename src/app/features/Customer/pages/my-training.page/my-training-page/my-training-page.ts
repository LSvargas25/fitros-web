import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Dumbbell, CheckCircle2, XCircle, Plus, Loader2, CalendarDays } from 'lucide-angular';

import { SessionFacade } from '../../../../../core/auth/session-facade';
import { WorkoutSessionService } from '../../../services/workout-session.service';
import {
  AssignedRoutineOption,
  ExerciseListItem,
  WorkoutSessionDetails,
  WorkoutSessionStatus,
  WORKOUT_SESSION_STATUS_LABEL,
} from '../../../models/workout-session.models';

@Component({
  selector: 'app-my-training-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './my-training-page.html',
  styleUrl: './my-training-page.css',
})
export class MyTrainingPage implements OnInit {
  private readonly workoutSessions = inject(WorkoutSessionService);
  private readonly session_ = inject(SessionFacade);

  readonly Dumbbell = Dumbbell;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Plus = Plus;
  readonly Loader2 = Loader2;
  readonly CalendarDays = CalendarDays;

  /** A Coach can build a weekly plan on their own CoachSelf profile; a Client's plan is set by their coach. */
  readonly isCoach = this.session_.role === 'Coach';

  readonly WorkoutSessionStatus = WorkoutSessionStatus;
  readonly statusLabel = WORKOUT_SESSION_STATUS_LABEL;

  readonly isLoading = signal(true);
  readonly isBusy = signal(false);
  readonly error = signal<string | null>(null);
  readonly session = signal<WorkoutSessionDetails | null>(null);
  readonly exerciseNames = signal<Record<string, string>>({});

  readonly needsRoutinePicker = signal(false);
  readonly routines = signal<AssignedRoutineOption[]>([]);
  readonly selectedRoutineId = signal<string | null>(null);

  // Draft inputs for the "add set" row of each exercise, keyed by exerciseId.
  draftReps: Record<string, number | null> = {};
  draftWeight: Record<string, number | null> = {};

  ngOnInit(): void {
    this.loadExerciseNames();
    this.loadToday();
  }

  private loadExerciseNames(): void {
    this.workoutSessions.getExercises().subscribe({
      next: (exercises: ExerciseListItem[]) => {
        const map: Record<string, string> = {};
        for (const ex of exercises) map[ex.id] = ex.name;
        this.exerciseNames.set(map);
      },
      error: () => {
        // Non-fatal: the page still works, exercises just show their id instead of a name.
      },
    });
  }

  exerciseName(exerciseId: string): string {
    return this.exerciseNames()[exerciseId] ?? exerciseId;
  }

  setsFor(exerciseId: string) {
    return (this.session()?.sets ?? []).filter((s) => s.exerciseId === exerciseId);
  }

  loadToday(routineId?: string | null): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.needsRoutinePicker.set(false);

    this.workoutSessions.startToday(routineId).subscribe({
      next: (session) => {
        this.session.set(session);
        this.isLoading.set(false);
      },
      error: (err) => {
        if (err?.status === 404) {
          this.needsRoutinePicker.set(true);
          this.loadRoutines();
        } else {
          this.error.set(err?.detail ?? 'No se pudo cargar el entrenamiento de hoy.');
        }
        this.isLoading.set(false);
      },
    });
  }

  private loadRoutines(): void {
    // Client-facing source: routines from the client's own active weekly plan.
    // (Was GET /api/workoutroutines?status=Published — staff-only, 403 for Client.)
    this.workoutSessions.getMyAssignedRoutines().subscribe({
      next: (routines) => this.routines.set(routines),
      error: () => this.routines.set([]),
    });
  }

  confirmRoutinePick(): void {
    const routineId = this.selectedRoutineId();
    if (!routineId) return;

    this.loadToday(routineId);
  }

  addSet(exerciseId: string): void {
    const session = this.session();
    if (!session || this.isBusy()) return;

    const reps = this.draftReps[exerciseId];
    const weight = this.draftWeight[exerciseId] ?? 0;

    if (reps === null || reps === undefined || reps < 0) return;

    const nextSetNumber = this.setsFor(exerciseId).length + 1;

    this.isBusy.set(true);

    this.workoutSessions
      .addSet(session.id, {
        exerciseId,
        setNumber: nextSetNumber,
        repsAchieved: reps,
        weightUsed: weight,
      })
      .subscribe({
        next: () => {
          this.draftReps[exerciseId] = null;
          this.draftWeight[exerciseId] = null;
          this.refreshSession(session.id);
        },
        error: (err) => {
          this.error.set(err?.detail ?? 'No se pudo registrar la serie.');
          this.isBusy.set(false);
        },
      });
  }

  private refreshSession(sessionId: string): void {
    this.workoutSessions.getById(sessionId).subscribe({
      next: (session) => {
        this.session.set(session);
        this.isBusy.set(false);
      },
      error: (err) => {
        this.error.set(err?.detail ?? 'No se pudo actualizar el entrenamiento.');
        this.isBusy.set(false);
      },
    });
  }

  completeSession(): void {
    const session = this.session();
    if (!session || this.isBusy()) return;

    this.isBusy.set(true);

    this.workoutSessions.complete(session.id).subscribe({
      next: () => this.refreshSession(session.id),
      error: (err) => {
        this.error.set(err?.detail ?? 'No se pudo completar el entrenamiento. ¿Registraste al menos una serie?');
        this.isBusy.set(false);
      },
    });
  }

  skipSession(): void {
    const session = this.session();
    if (!session || this.isBusy()) return;

    this.isBusy.set(true);

    this.workoutSessions.skip(session.id).subscribe({
      next: () => this.refreshSession(session.id),
      error: (err) => {
        this.error.set(err?.detail ?? 'No se pudo marcar como saltado.');
        this.isBusy.set(false);
      },
    });
  }
}
