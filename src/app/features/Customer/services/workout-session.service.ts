import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AddSetRequest,
  AssignedRoutineOption,
  ExerciseListItem,
  MyTrainingPlanDetail,
  WorkoutSessionDetails,
  WorkoutSessionListItem,
} from '../models/workout-session.models';

@Injectable({ providedIn: 'root' })
export class WorkoutSessionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/workout-sessions`;

  startToday(routineId?: string | null): Observable<WorkoutSessionDetails> {
    return this.http.post<WorkoutSessionDetails>(`${this.baseUrl}/start-today`, {
      routineId: routineId ?? null,
    });
  }

  getById(sessionId: string): Observable<WorkoutSessionDetails> {
    return this.http.get<WorkoutSessionDetails>(`${this.baseUrl}/${sessionId}`);
  }

  getHistory(from?: string, to?: string): Observable<WorkoutSessionListItem[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http.get<WorkoutSessionListItem[]>(`${this.baseUrl}/history`, { params });
  }

  addSet(sessionId: string, request: AddSetRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${sessionId}/sets`, request);
  }

  complete(sessionId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${sessionId}/complete`, {});
  }

  skip(sessionId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${sessionId}/skip`, {});
  }

  /**
   * The exercise catalogue is a per-gym reference list any authenticated user (Client
   * included) may read — `GET /api/exercises` is `[Authorize]` with no role restriction.
   */
  getExercises(): Observable<ExerciseListItem[]> {
    return this.http.get<ExerciseListItem[]>(`${environment.apiBaseUrl}/api/exercises`);
  }

  /**
   * Routines the Client may start a session from when `start-today` has no routine for
   * today: the distinct routines assigned across the days of their ACTIVE weekly plan.
   *
   * Sourced from `GET /api/my/training-plans/active` (client-facing `MyPlansController`),
   * NOT from `GET /api/workoutroutines?status=Published` — that route is
   * `[Authorize(Roles="OwnerApp,Admin,Coach")]` and 403s for a Client (this was the bug).
   * A `404` (no active weekly plan) resolves to `[]`.
   */
  getMyAssignedRoutines(): Observable<AssignedRoutineOption[]> {
    return this.http
      .get<MyTrainingPlanDetail>(`${environment.apiBaseUrl}/api/my/training-plans/active`)
      .pipe(
        map((plan) => {
          const seen = new Set<string>();
          const options: AssignedRoutineOption[] = [];
          for (const d of plan.days ?? []) {
            if (seen.has(d.workoutRoutineId)) continue;
            seen.add(d.workoutRoutineId);
            options.push({ id: d.workoutRoutineId, name: d.workoutRoutineName });
          }
          return options;
        }),
        catchError((err) => {
          if (err?.status === 404) return of<AssignedRoutineOption[]>([]);
          throw err;
        }),
      );
  }
}
