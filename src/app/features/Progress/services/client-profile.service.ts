import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PhysicalMeasure {
  id: string;
  weight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  waist: number;
  chest: number;
  arms: number;
  recordedAt: string;
}

export interface ClientProfileDetail {
  id: string;
  userId: string;
  status: number;
  createdAt: string;
  measures: PhysicalMeasure[];
}

export interface AddPhysicalMeasureDto {
  weight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  waist: number;
  chest: number;
  arms: number;
  /** ISO-8601 UTC. Optional — omit for "now". Backend: not future, not > 60 days old. */
  recordedAt?: string;
}

export interface ClientKpiSnapshot {
  id: string;
  physicalMeasureId: string;
  weightDelta: number | null;
  bodyFatDelta: number | null;
  waistDelta: number | null;
  createdAtUtc: string;
}

/** GET /api/client-profiles — MyClientListItemResponse (coach: own clients; admin/owner: all). */
export interface MyClientListItem {
  clientProfileId: string;
  clientUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  clientProfileCreatedAtUtc: string;
  lastMeasureRecordedAtUtc: string | null;
  lastWeight: number | null;
}

@Injectable({ providedIn: 'root' })
export class ClientProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/client-profiles`;
  private readonly myMeasurementsUrl = `${environment.apiBaseUrl}/api/my/measurements`;

  getMyProfile(): Observable<ClientProfileDetail> {
    return this.http.get<ClientProfileDetail>(`${this.baseUrl}/me`);
  }

  // ── Client self-service (MyProgressController, JWT-resolved, no id in URL) ──

  /** GET /api/my/measurements — the authenticated Client/Coach's own measures, newest first. */
  getMyMeasurements(): Observable<PhysicalMeasure[]> {
    return this.http.get<PhysicalMeasure[]>(this.myMeasurementsUrl);
  }

  /** POST /api/my/measurements — logs a measure for the authenticated user. */
  addMyMeasurement(dto: AddPhysicalMeasureDto): Observable<void> {
    return this.http.post<void>(this.myMeasurementsUrl, dto);
  }

  // ── Staff (managing a real client, id in URL) ─────────────────────────────

  /** GET /api/client-profiles — the caller's manageable clients (coach: own; admin/owner: all). */
  getMyClients(): Observable<MyClientListItem[]> {
    return this.http.get<MyClientListItem[]>(this.baseUrl);
  }

  getMeasures(clientId: string): Observable<PhysicalMeasure[]> {
    return this.http.get<PhysicalMeasure[]>(`${this.baseUrl}/${clientId}/measures`);
  }

  addMeasure(clientId: string, dto: AddPhysicalMeasureDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${clientId}/measures`, dto);
  }

  generateKpiSnapshot(clientId: string): Observable<ClientKpiSnapshot> {
    return this.http.post<ClientKpiSnapshot>(`${this.baseUrl}/${clientId}/kpi-snapshot`, {});
  }

  getKpiSnapshots(clientId: string): Observable<ClientKpiSnapshot[]> {
    return this.http.get<ClientKpiSnapshot[]>(`${this.baseUrl}/${clientId}/kpi-snapshots`);
  }
}
