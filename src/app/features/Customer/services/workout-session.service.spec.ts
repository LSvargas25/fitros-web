import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { WorkoutSessionService } from './workout-session.service';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiBaseUrl}/api/workout-sessions`;

describe('WorkoutSessionService', () => {
  let service: WorkoutSessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkoutSessionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WorkoutSessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('startToday() POSTs { routineId } (null when omitted)', () => {
    service.startToday().subscribe();
    const a = http.expectOne(`${BASE}/start-today`);
    expect(a.request.method).toBe('POST');
    expect(a.request.body).toEqual({ routineId: null });
    a.flush({});

    service.startToday('r1').subscribe();
    const b = http.expectOne(`${BASE}/start-today`);
    expect(b.request.body).toEqual({ routineId: 'r1' });
    b.flush({});
  });

  it('getById() GETs /{sessionId}', () => {
    service.getById('s1').subscribe();
    const req = http.expectOne(`${BASE}/s1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getHistory() sends from/to only when provided', () => {
    service.getHistory().subscribe();
    const noParams = http.expectOne((r) => r.url === `${BASE}/history`);
    expect(noParams.request.params.keys().length).toBe(0);
    noParams.flush([]);

    service.getHistory('2026-01-01', '2026-02-01').subscribe();
    const withParams = http.expectOne((r) => r.url === `${BASE}/history`);
    expect(withParams.request.params.get('from')).toBe('2026-01-01');
    expect(withParams.request.params.get('to')).toBe('2026-02-01');
    withParams.flush([]);
  });

  it('addSet() POSTs the request to /{sessionId}/sets', () => {
    const body = { routineExerciseId: 're1', reps: 10, weightKg: 40 } as never;
    service.addSet('s1', body).subscribe();
    const req = http.expectOne(`${BASE}/s1/sets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(null);
  });

  it('complete() and skip() PATCH their endpoints', () => {
    service.complete('s1').subscribe();
    const c = http.expectOne(`${BASE}/s1/complete`);
    expect(c.request.method).toBe('PATCH');
    c.flush(null);

    service.skip('s1').subscribe();
    const s = http.expectOne(`${BASE}/s1/skip`);
    expect(s.request.method).toBe('PATCH');
    s.flush(null);
  });

  it('getMyAssignedRoutines() GETs /api/my/training-plans/active and maps the plan\'s days to distinct routine options', () => {
    let result: unknown;
    service.getMyAssignedRoutines().subscribe((r) => (result = r));

    const req = http.expectOne(`${environment.apiBaseUrl}/api/my/training-plans/active`);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'tp1', clientProfileId: 'cp1', coachId: 'co1', name: 'Active plan', status: 2, createdAt: '',
      days: [
        { id: 'd1', day: 1, workoutRoutineId: 'r1', workoutRoutineName: 'Piernas', notes: null },
        { id: 'd2', day: 3, workoutRoutineId: 'r2', workoutRoutineName: 'Empuje', notes: null },
        { id: 'd3', day: 5, workoutRoutineId: 'r1', workoutRoutineName: 'Piernas', notes: null },
      ],
    });

    // distinct routines only, in first-seen order
    expect(result).toEqual([
      { id: 'r1', name: 'Piernas' },
      { id: 'r2', name: 'Empuje' },
    ]);
  });

  it('getMyAssignedRoutines() resolves to [] on 404 (no active weekly plan)', () => {
    let result: unknown = 'unset';
    let errored = false;
    service.getMyAssignedRoutines().subscribe({ next: (r) => (result = r), error: () => (errored = true) });

    http.expectOne(`${environment.apiBaseUrl}/api/my/training-plans/active`)
      .flush({ detail: 'no active plan' }, { status: 404, statusText: 'Not Found' });

    expect(errored).toBeFalse();
    expect(result).toEqual([]);
  });

  it('getMyAssignedRoutines() propagates a non-404 failure', () => {
    let errorStatus: number | undefined;
    service.getMyAssignedRoutines().subscribe({ next: () => {}, error: (e) => (errorStatus = e?.status) });

    http.expectOne(`${environment.apiBaseUrl}/api/my/training-plans/active`)
      .flush({ detail: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(errorStatus).toBe(500);
  });

  it('getMyAssignedRoutines() never touches the staff routines endpoint', () => {
    service.getMyAssignedRoutines().subscribe({ next: () => {}, error: () => {} });
    http.expectOne(`${environment.apiBaseUrl}/api/my/training-plans/active`).flush({ days: [] });
    // The staff catalogue (403 for a Client) and the list endpoint must not be hit.
    expect(() => http.expectNone((r) => r.url === `${environment.apiBaseUrl}/api/workoutroutines`)).not.toThrow();
    expect(() => http.expectNone((r) => r.url === `${environment.apiBaseUrl}/api/my/training-plans`)).not.toThrow();
  });

  it('getExercises() GETs the exercises catalogue', () => {
    service.getExercises().subscribe();
    const req = http.expectOne(`${environment.apiBaseUrl}/api/exercises`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
