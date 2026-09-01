import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { CreateFoodPayload, FoodCategory, FoodDetail, FoodListItem, UpdateFoodPayload } from '../models/food.models';

/** Talks to FitRos.API/Controllers/FoodsController. */
@Injectable({ providedIn: 'root' })
export class FoodService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/foods`;

  /** GET /api/foods — optional category filter; archived excluded unless includeArchived. */
  list(category?: FoodCategory, includeArchived = false): Observable<FoodListItem[]> {
    let params = new HttpParams();
    if (category != null) params = params.set('category', category);
    if (includeArchived) params = params.set('includeArchived', true);
    return this.http.get<FoodListItem[]>(this.baseUrl, { params });
  }

  /** GET /api/foods/{id}. */
  getById(id: string): Observable<FoodDetail> {
    return this.http.get<FoodDetail>(`${this.baseUrl}/${id}`);
  }

  /** POST /api/foods — 201, returns { id }. */
  create(payload: CreateFoodPayload): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.baseUrl, payload);
  }

  /** PUT /api/foods/{id} — 204. */
  update(payload: UpdateFoodPayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${payload.id}`, payload);
  }

  /** DELETE /api/foods/{id} — archives (soft delete), 204. */
  archive(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
