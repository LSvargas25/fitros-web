import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  AddRoutineExercisePayload,
  RoutineDetail,
  RoutineListItem,
  RoutinePayload,
  RoutineStatus,
  RoutineVersionListItem,
} from '../models/routine.models';

/**
 * `GET /api/workoutroutines` returns a paged envelope (`PagedResult<T>` =
 * `{ page, pageSize, totalCount, items }`), not a bare array — the controller's
 * `List<...>` response annotation is wrong. Normalise both shapes to an array.
 */
interface PagedResult<T> {
  items?: T[];
}
function toArray<T>(res: PagedResult<T> | T[] | null | undefined): T[] {
  if (Array.isArray(res)) return res;
  return res?.items ?? [];
}

/**
 * Talks to FitRos.API/Controllers/WorkoutRoutinesController.
 *
 * Covers routine-level management (list / create / edit basic info / publish /
 * archive) and the per-routine exercise editor (add / move / remove exercises).
 * Version-history endpoints are not wired up.
 */
@Injectable({ providedIn: 'root' })
export class RoutineService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/workoutroutines`;

  /** GET /api/workoutroutines — optionally filtered by status. Always resolves to an array. */
  list(status?: RoutineStatus): Observable<RoutineListItem[]> {
    let params = new HttpParams().set('pageSize', 200);
    if (status != null) {
      params = params.set('status', status);
    }
    return this.http
      .get<PagedResult<RoutineListItem> | RoutineListItem[]>(this.baseUrl, { params })
      .pipe(map(toArray));
  }

  /** GET /api/workoutroutines/{id}. */
  getById(id: string): Observable<RoutineDetail> {
    return this.http.get<RoutineDetail>(`${this.baseUrl}/${id}`);
  }

  /** POST /api/workoutroutines — creates a Draft, returns { id, name, version }. */
  create(payload: RoutinePayload): Observable<{ id: string; name: string; version: number }> {
    return this.http.post<{ id: string; name: string; version: number }>(this.baseUrl, payload);
  }

  /** PUT /api/workoutroutines/{id} — updates name/description, 204. */
  update(id: string, payload: RoutinePayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  /** PUT /api/workoutroutines/{id}/publish — Draft -> Published, 204. */
  publish(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/publish`, {});
  }

  /** DELETE /api/workoutroutines/{id} — archives the routine, 204. */
  archive(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ── Versioning ────────────────────────────────────────────────────────────

  /** GET /api/workoutroutines/{id}/versions — every version in the group, newest first. */
  getVersions(id: string): Observable<RoutineVersionListItem[]> {
    return this.http.get<RoutineVersionListItem[]>(`${this.baseUrl}/${id}/versions`);
  }

  /**
   * POST /api/workoutroutines/{id}/versions — forks a new Draft version from a
   * Published routine. Returns the new draft `{ id, routineGroupId, version, status }`.
   */
  createVersion(id: string): Observable<{ id: string; routineGroupId: string; version: number; status: RoutineStatus }> {
    return this.http.post<{ id: string; routineGroupId: string; version: number; status: RoutineStatus }>(
      `${this.baseUrl}/${id}/versions`, {},
    );
  }

  // ── Exercise composition (Draft routines only, enforced server-side) ────────

  /** POST /api/workoutroutines/{id}/exercises — 204. Body id must match the route. */
  addExercise(routineId: string, payload: Omit<AddRoutineExercisePayload, 'workoutRoutineId'>): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${routineId}/exercises`, {
      workoutRoutineId: routineId,
      ...payload,
    });
  }

  /** DELETE /api/workoutroutines/{routineId}/exercises/{exerciseId} — 204. */
  removeExercise(routineId: string, exerciseId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${routineId}/exercises/${exerciseId}`);
  }

  /** PUT /api/workoutroutines/{routineId}/exercises/{exerciseId}/move — 204. `newOrder` is 1-based. */
  moveExercise(routineId: string, exerciseId: string, newOrder: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${routineId}/exercises/${exerciseId}/move`, { newOrder });
  }
}
