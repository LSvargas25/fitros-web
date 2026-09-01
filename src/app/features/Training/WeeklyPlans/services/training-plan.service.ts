import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  AssignTrainingPlanDayPayload,
  TrainingPlanListItem,
  WeeklyTrainingPlanDetail,
} from '../models/training-plan.models';

/**
 * Talks to FitRos.API `TrainingPlansController` (route base `/api/training-plans`).
 * STAFF only (OwnerApp / Admin / Coach), gym-scoped. Used by the weekly-plan
 * management screen and by a Coach editing a plan on their own CoachSelf profile
 * (same endpoints, `clientProfileId` = the coach's own profile id).
 *
 * The client-facing read path is `MyPlansController` (`/api/my/training-plans`) —
 * see `WorkoutSessionService`.
 */
@Injectable({ providedIn: 'root' })
export class TrainingPlanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/training-plans`;

  /** GET /api/training-plans/client/{clientProfileId} — that client's plans (list, newest first). */
  getClientPlans(clientProfileId: string): Observable<TrainingPlanListItem[]> {
    return this.http.get<TrainingPlanListItem[]>(`${this.baseUrl}/client/${clientProfileId}`);
  }

  /** GET /api/training-plans/{id} — full detail incl. assigned days. */
  getById(id: string): Observable<WeeklyTrainingPlanDetail> {
    return this.http.get<WeeklyTrainingPlanDetail>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/training-plans/client/{clientProfileId}/active — 404 when the client
   * has no active plan. With the "one active plan" rule this returns 0 or 1.
   */
  getClientActivePlan(clientProfileId: string): Observable<WeeklyTrainingPlanDetail> {
    return this.http.get<WeeklyTrainingPlanDetail>(`${this.baseUrl}/client/${clientProfileId}/active`);
  }

  /** POST /api/training-plans — creates a Draft plan for the client, returns { id }. Days are added separately. */
  create(clientProfileId: string, name: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.baseUrl, { clientProfileId, name });
  }

  /** PATCH /api/training-plans/{id}/rename. */
  rename(id: string, name: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/rename`, { name });
  }

  /**
   * PATCH /api/training-plans/{id}/activate — makes this the client's active plan.
   * The backend auto-archives the client's previously-active training plan (one-active rule).
   */
  activate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/activate`, {});
  }

  /** PATCH /api/training-plans/{id}/archive. */
  archive(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/archive`, {});
  }

  /**
   * PUT /api/training-plans/{id}/days/{day} — assigns (or replaces) the routine for
   * one day. `day` is a System.DayOfWeek int (Sun 0…Sat 6). Idempotent. Only a
   * Published routine is accepted (400 otherwise).
   */
  assignDay(id: string, day: number, payload: AssignTrainingPlanDayPayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/days/${day}`, payload);
  }

  /** DELETE /api/training-plans/{id}/days/{day} — turns that day back into a rest day. */
  clearDay(id: string, day: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/days/${day}`);
  }
}
