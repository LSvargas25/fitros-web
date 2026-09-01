import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { MealPlanDetail, MealPlanListItem, MealType } from '../models/meal-plan.models';

export interface AddMealPlanEntryPayload {
  day: number;
  meal: MealType;
  foodId: string;
  quantityGrams: number;
}

/**
 * Talks to two backend controllers:
 *  - `MealPlansController` (`/api/meal-plans`) — STAFF only (OwnerApp/Admin/Coach).
 *    Used by the coach/admin meal-plan management page.
 *  - `MyPlansController` (`/api/my/meal-plans`) — CLIENT only. Scoped to the caller's
 *    own ClientProfile from the JWT, no id in the URL. Used by the client's
 *    "My Nutrition" page. A Client calling the staff routes gets a 403.
 */
@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/meal-plans`;
  private readonly myBaseUrl = `${environment.apiBaseUrl}/api/my/meal-plans`;

  // ── Client self-service (MyPlansController) ────────────────────────────────

  /**
   * GET /api/my/meal-plans/active — the authenticated Client's single active plan,
   * fully resolved. 404 when there is no active plan (the "one active plan" rule
   * guarantees 0 or 1). Preferred over `getMyPlans()` + client-side status filtering.
   */
  getMyActivePlan(): Observable<MealPlanDetail> {
    return this.http.get<MealPlanDetail>(`${this.myBaseUrl}/active`);
  }

  /** GET /api/my/meal-plans — the authenticated Client's own plans (list, newest first). History view. */
  getMyPlans(): Observable<MealPlanListItem[]> {
    return this.http.get<MealPlanListItem[]>(this.myBaseUrl);
  }

  /** GET /api/my/meal-plans/{id} — full detail of one of the Client's own plans. */
  getMyPlanById(id: string): Observable<MealPlanDetail> {
    return this.http.get<MealPlanDetail>(`${this.myBaseUrl}/${id}`);
  }

  // ── Staff management (MealPlansController) ─────────────────────────────────

  /** GET /api/meal-plans/{id}. */
  getById(id: string): Observable<MealPlanDetail> {
    return this.http.get<MealPlanDetail>(`${this.baseUrl}/${id}`);
  }

  /** GET /api/meal-plans/client/{clientProfileId}. */
  getClientPlans(clientProfileId: string): Observable<MealPlanListItem[]> {
    return this.http.get<MealPlanListItem[]>(`${this.baseUrl}/client/${clientProfileId}`);
  }

  /** GET /api/meal-plans/client/{clientProfileId}/active — 404 when there is no active plan. */
  getActivePlan(clientProfileId: string): Observable<MealPlanDetail> {
    return this.http.get<MealPlanDetail>(`${this.baseUrl}/client/${clientProfileId}/active`);
  }

  /** POST /api/meal-plans — creates a plan assigned to the client, returns { id }. */
  create(clientProfileId: string, name: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.baseUrl, { clientProfileId, name });
  }

  /** PATCH /api/meal-plans/{id}/rename. */
  rename(id: string, name: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/rename`, { name });
  }

  /** PATCH /api/meal-plans/{id}/activate — makes this the client's active plan. */
  activate(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/activate`, {});
  }

  /** PATCH /api/meal-plans/{id}/archive. */
  archive(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/archive`, {});
  }

  /** POST /api/meal-plans/{id}/entries. */
  addEntry(id: string, payload: AddMealPlanEntryPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/entries`, payload);
  }

  /** PUT /api/meal-plans/{id}/entries/{entryId}. */
  updateEntry(id: string, entryId: string, quantityGrams: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/entries/${entryId}`, { quantityGrams });
  }

  /**
   * PUT /api/meal-plans/{id}/entries/{entryId}/move — reorders the entry inside
   * its (day, meal) slot. `newOrder` is the target 1-based position in that slot;
   * the backend shifts the rest.
   */
  moveEntry(id: string, entryId: string, newOrder: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/entries/${entryId}/move`, { newOrder });
  }

  /** DELETE /api/meal-plans/{id}/entries/{entryId}. */
  removeEntry(id: string, entryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/entries/${entryId}`);
  }
}
