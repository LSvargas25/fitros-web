import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TrainingPlanService } from './training-plan.service';
import { environment } from '../../../../../environments/environment';

const BASE = `${environment.apiBaseUrl}/api/training-plans`;

describe('TrainingPlanService', () => {
  let service: TrainingPlanService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrainingPlanService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TrainingPlanService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getClientPlans() GETs /api/training-plans/client/{clientProfileId}', () => {
    service.getClientPlans('cp1').subscribe();
    const req = http.expectOne(`${BASE}/client/cp1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById() GETs /api/training-plans/{id}', () => {
    service.getById('tp1').subscribe();
    const req = http.expectOne(`${BASE}/tp1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getClientActivePlan() GETs /api/training-plans/client/{clientProfileId}/active', () => {
    service.getClientActivePlan('cp1').subscribe();
    const req = http.expectOne(`${BASE}/client/cp1/active`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() POSTs exactly { clientProfileId, name } (no days in the body)', () => {
    service.create('cp1', 'Bloque 1').subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ clientProfileId: 'cp1', name: 'Bloque 1' });
    req.flush({ id: 'tp9' });
  });

  it('rename() PATCHes /{id}/rename with { name }', () => {
    service.rename('tp1', 'Bloque 2').subscribe();
    const req = http.expectOne(`${BASE}/tp1/rename`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Bloque 2' });
    req.flush(null);
  });

  it('activate() PATCHes /{id}/activate', () => {
    service.activate('tp1').subscribe();
    const req = http.expectOne(`${BASE}/tp1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('archive() PATCHes /{id}/archive', () => {
    service.archive('tp1').subscribe();
    const req = http.expectOne(`${BASE}/tp1/archive`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('assignDay() PUTs { workoutRoutineId, notes } to /{id}/days/{day} (day is the int)', () => {
    service.assignDay('tp1', 1, { workoutRoutineId: 'r5', notes: 'técnica' }).subscribe();
    const req = http.expectOne(`${BASE}/tp1/days/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ workoutRoutineId: 'r5', notes: 'técnica' });
    req.flush(null);
  });

  it('assignDay() sends notes: null when there is no note', () => {
    service.assignDay('tp1', 0, { workoutRoutineId: 'r5', notes: null }).subscribe();
    const req = http.expectOne(`${BASE}/tp1/days/0`);
    expect(req.request.body).toEqual({ workoutRoutineId: 'r5', notes: null });
    req.flush(null);
  });

  it('clearDay() DELETEs /{id}/days/{day}', () => {
    service.clearDay('tp1', 6).subscribe();
    const req = http.expectOne(`${BASE}/tp1/days/6`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('never calls the client-facing /api/my/training-plans routes', () => {
    service.getClientPlans('cp1').subscribe();
    http.expectOne(`${BASE}/client/cp1`).flush([]);
    expect(() => http.expectNone((r) => r.url.includes('/api/my/'))).not.toThrow();
  });
});
