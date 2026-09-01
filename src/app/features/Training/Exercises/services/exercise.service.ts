import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  CreateExercisePayload,
  ExerciseDetail,
  ExerciseListItem,
  MuscleGroup,
  UpdateExercisePayload,
} from '../models/exercise.models';

/**
 * Talks to FitRos.API/Controllers/ExercisesController.
 *
 * Note: the list endpoint (`GET /api/exercises`) currently returns archived exercises too
 * — the backend only applies a tenant (GymId) query filter, not an IsArchived one, and the
 * list DTO does not expose the flag. Until that changes, an archived exercise is removed
 * from the table optimistically on the client and would reappear on a hard reload.
 */
@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/exercises`;

  /** GET /api/exercises — optionally filtered by muscle group. */
  list(category?: MuscleGroup): Observable<ExerciseListItem[]> {
    let params = new HttpParams();
    if (category != null) {
      params = params.set('category', category);
    }
    return this.http.get<ExerciseListItem[]>(this.baseUrl, { params });
  }

  /** GET /api/exercises/{id}. */
  getById(id: string): Observable<ExerciseDetail> {
    return this.http.get<ExerciseDetail>(`${this.baseUrl}/${id}`);
  }

  /** POST /api/exercises — 201 Created, returns { id }. */
  create(payload: CreateExercisePayload): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.baseUrl, payload);
  }

  /** PUT /api/exercises/{id} — 204 No Content. */
  update(payload: UpdateExercisePayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${payload.id}`, payload);
  }

  /** DELETE /api/exercises/{id} — archives (soft delete), 204 No Content. */
  archive(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
