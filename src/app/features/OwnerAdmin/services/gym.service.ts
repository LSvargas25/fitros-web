import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GymListItemResponse, CreateGymRequest, GymDetail, UpdateGymDto } from '../Models/gym.models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GymService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/gyms`;

  getAll(search?: string, isActive?: boolean): Observable<GymListItemResponse[]> {
    let params = new HttpParams();
    if (search)              params = params.set('search',   search);
    if (isActive !== undefined && isActive !== null)
                             params = params.set('isActive', String(isActive));
    return this.http.get<GymListItemResponse[]>(this.baseUrl, { params });
  }

  getById(gymId: string): Observable<GymDetail> {
    return this.http.get<GymDetail>(`${this.baseUrl}/${gymId}`);
  }

  create(body: CreateGymRequest): Observable<string> {
    return this.http.post<string>(this.baseUrl, body);
  }

  update(gymId: string, body: UpdateGymDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${gymId}`, body);
  }

  activate(gymId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${gymId}/activate`, {});
  }

  deactivate(gymId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${gymId}/deactivate`, {});
  }

  delete(gymId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${gymId}`);
  }

  assignAdmin(gymId: string, adminId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${gymId}/assign-admin`, { adminId });
  }

  assignCoach(gymId: string, coachId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${gymId}/assign-coach`, { coachId });
  }

  assignClient(gymId: string, clientId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${gymId}/assign-client`, { clientId });
  }
}
