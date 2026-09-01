import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProgressReportService } from './progress-report.service';
import { environment } from '../../../../../environments/environment';

const BASE = `${environment.apiBaseUrl}/api/client-profiles`;

describe('ProgressReportService', () => {
  let service: ProgressReportService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProgressReportService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProgressReportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getReport() without a month GETs the live report with no params', () => {
    service.getReport('cp1').subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/cp1/progress-report`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({});
  });

  it('getReport(year, month) sends both params together', () => {
    service.getReport('cp1', 2026, 8).subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/cp1/progress-report`);
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('8');
    req.flush({});
  });

  it('getReport() ignores a year with no month', () => {
    service.getReport('cp1', 2026).subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/cp1/progress-report`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush({});
  });

  it('generate() POSTs an empty body to the same path, with the month params', () => {
    service.generate('cp1', 2026, 8).subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/cp1/progress-report`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('8');
    req.flush({});
  });

  it('getHistory() GETs .../progress-reports', () => {
    service.getHistory('cp1').subscribe();
    const req = http.expectOne(`${BASE}/cp1/progress-reports`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // Client self-service — JWT-resolved, no client id in the URL.
  const MY = `${environment.apiBaseUrl}/api/my/progress-report`;

  it('getMyReport() GETs /api/my/progress-report with no params by default', () => {
    service.getMyReport().subscribe();
    const req = http.expectOne((r) => r.url === MY);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({});
  });

  it('getMyReport(year, month) sends both params together', () => {
    service.getMyReport(2026, 8).subscribe();
    const req = http.expectOne((r) => r.url === MY);
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('8');
    req.flush({});
  });

  it('getMyReport() never hits the staff /api/client-profiles route', () => {
    service.getMyReport().subscribe();
    http.expectOne((r) => r.url === MY).flush({});
    expect(() => http.expectNone((r) => r.url.includes('/api/client-profiles/'))).not.toThrow();
  });
});
