import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ClientProfileService, AddPhysicalMeasureDto } from './client-profile.service';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiBaseUrl}/api/client-profiles`;

describe('ClientProfileService', () => {
  let service: ClientProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClientProfileService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getMyProfile() GETs /me', () => {
    service.getMyProfile().subscribe();
    const req = http.expectOne(`${BASE}/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'c1', userId: 'u1', status: 0, createdAt: '', measures: [] });
  });

  it('getMyClients() GETs the collection root', () => {
    service.getMyClients().subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMeasures() GETs the client-scoped measures', () => {
    let result: unknown;
    service.getMeasures('c1').subscribe((r) => (result = r));
    const req = http.expectOne(`${BASE}/c1/measures`);
    req.flush([{ id: 'm1' }]);
    expect(result).toEqual([{ id: 'm1' } as never]);
  });

  it('addMeasure() POSTs the DTO to the client-scoped collection', () => {
    const dto: AddPhysicalMeasureDto = {
      weight: 80, bodyFatPercentage: 18, muscleMass: 34, waist: 85, chest: 100, arms: 35,
    };
    service.addMeasure('c1', dto).subscribe();
    const req = http.expectOne(`${BASE}/c1/measures`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('generateKpiSnapshot() POSTs to /{id}/kpi-snapshot', () => {
    service.generateKpiSnapshot('c1').subscribe();
    const req = http.expectOne(`${BASE}/c1/kpi-snapshot`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 's1', physicalMeasureId: 'm1', weightDelta: -1, bodyFatDelta: null, waistDelta: null, createdAtUtc: '' });
  });

  it('getKpiSnapshots() GETs /{id}/kpi-snapshots', () => {
    service.getKpiSnapshots('c1').subscribe();
    const req = http.expectOne(`${BASE}/c1/kpi-snapshots`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  // Client self-service — JWT-resolved /api/my/measurements (MyProgressController),
  // NOT the staff /api/client-profiles/{id}/measures route.
  const MY = `${environment.apiBaseUrl}/api/my/measurements`;

  it('getMyMeasurements() GETs /api/my/measurements and nothing on the staff route', () => {
    service.getMyMeasurements().subscribe();
    const req = http.expectOne(MY);
    expect(req.request.method).toBe('GET');
    req.flush([]);
    http.expectNone((r) => r.url.includes('/api/client-profiles/'));
  });

  it('addMyMeasurement() POSTs the DTO (incl. optional recordedAt) to /api/my/measurements', () => {
    const dto: AddPhysicalMeasureDto = {
      weight: 79.5, bodyFatPercentage: 17, muscleMass: 35, waist: 81, chest: 101, arms: 39,
      recordedAt: '2026-08-25T10:00:00Z',
    };
    service.addMyMeasurement(dto).subscribe();
    const req = http.expectOne(MY);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('addMyMeasurement() omits recordedAt when not given', () => {
    service.addMyMeasurement({ weight: 80, bodyFatPercentage: 18, muscleMass: 34, waist: 85, chest: 100, arms: 35 }).subscribe();
    const req = http.expectOne(MY);
    expect('recordedAt' in (req.request.body as object)).toBeFalse();
    req.flush(null);
  });
});
