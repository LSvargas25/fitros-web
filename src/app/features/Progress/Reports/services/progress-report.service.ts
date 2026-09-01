import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { GenerateProgressReportResponse, ProgressReport, ProgressReportSnapshot } from '../models/progress-report.models';

/**
 * Talks to the progress-report endpoints on
 * FitRos.API/Controllers/ClientProfilesController (route base
 * `/api/client-profiles/{clientProfileId}`).
 */
@Injectable({ providedIn: 'root' })
export class ProgressReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/client-profiles`;

  /** GET .../progress-report — live monthly report; year+month go together or both omitted. */
  getReport(clientProfileId: string, year?: number, month?: number): Observable<ProgressReport> {
    let params = new HttpParams();
    if (year != null && month != null) {
      params = params.set('year', year).set('month', month);
    }
    return this.http.get<ProgressReport>(`${this.baseUrl}/${clientProfileId}/progress-report`, { params });
  }

  /**
   * GET /api/my/progress-report — the authenticated Client/Coach's own live
   * monthly report (JWT-resolved, no id in the URL). Same shape as `getReport`.
   */
  getMyReport(year?: number, month?: number): Observable<ProgressReport> {
    let params = new HttpParams();
    if (year != null && month != null) {
      params = params.set('year', year).set('month', month);
    }
    return this.http.get<ProgressReport>(`${environment.apiBaseUrl}/api/my/progress-report`, { params });
  }

  /** POST .../progress-report — freezes the month's report into a ClientProgressReportSnapshot. */
  generate(clientProfileId: string, year?: number, month?: number): Observable<GenerateProgressReportResponse> {
    let params = new HttpParams();
    if (year != null && month != null) {
      params = params.set('year', year).set('month', month);
    }
    return this.http.post<GenerateProgressReportResponse>(
      `${this.baseUrl}/${clientProfileId}/progress-report`,
      {},
      { params },
    );
  }

  /** GET .../progress-reports — persisted snapshot history, most recent first. */
  getHistory(clientProfileId: string): Observable<ProgressReportSnapshot[]> {
    return this.http.get<ProgressReportSnapshot[]>(`${this.baseUrl}/${clientProfileId}/progress-reports`);
  }
}
