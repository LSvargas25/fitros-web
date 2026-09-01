import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { RoutineService } from './routine.service';
import { RoutineStatus } from '../models/routine.models';
import { environment } from '../../../../../environments/environment';

const BASE = `${environment.apiBaseUrl}/api/workoutroutines`;

describe('RoutineService', () => {
  let service: RoutineService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoutineService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RoutineService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() unwraps a paged envelope { items: [...] } into an array', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('pageSize')).toBe('200');
    req.flush({ page: 1, pageSize: 200, totalCount: 2, items: [{ id: 'r1' }, { id: 'r2' }] });

    expect(result).toEqual([{ id: 'r1' }, { id: 'r2' } as never]);
  });

  it('list() also accepts a bare array response', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));
    http.expectOne((r) => r.url === BASE).flush([{ id: 'r1' }]);
    expect(result).toEqual([{ id: 'r1' } as never]);
  });

  it('list() yields [] for a null / empty envelope instead of throwing', () => {
    let result: unknown = 'unset';
    service.list().subscribe((r) => (result = r));
    http.expectOne((r) => r.url === BASE).flush(null);
    expect(result).toEqual([]);
  });

  it('list(status) forwards the status filter as a query param', () => {
    service.list(RoutineStatus.Published).subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('status')).toBe(String(RoutineStatus.Published));
    req.flush([]);
  });

  it('create() POSTs { name, description } to the collection URL', () => {
    service.create({ name: 'Push Day', description: '3 días' }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Push Day', description: '3 días' });
    req.flush({ id: 'r9', name: 'Push Day', version: 1 });
  });

  it('update() PUTs { name, description } to /{id}', () => {
    service.update('r1', { name: 'Push Day v2', description: '' }).subscribe();
    const req = http.expectOne(`${BASE}/r1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Push Day v2', description: '' });
    req.flush(null);
  });

  it('publish() PUTs to /{id}/publish', () => {
    service.publish('r1').subscribe();
    const req = http.expectOne(`${BASE}/r1/publish`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('archive() DELETEs /{id}', () => {
    service.archive('r1').subscribe();
    const req = http.expectOne(`${BASE}/r1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('addExercise() echoes the routine id into the body', () => {
    service.addExercise('r1', { exerciseId: 'e9', order: 3, suggestedSets: 3, suggestedReps: 10, suggestedRestSeconds: 60 }).subscribe();
    const req = http.expectOne(`${BASE}/r1/exercises`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      workoutRoutineId: 'r1',
      exerciseId: 'e9',
      order: 3,
      suggestedSets: 3,
      suggestedReps: 10,
      suggestedRestSeconds: 60,
    });
    req.flush(null);
  });

  it('moveExercise() PUTs the 1-based newOrder', () => {
    service.moveExercise('r1', 'e9', 2).subscribe();
    const req = http.expectOne(`${BASE}/r1/exercises/e9/move`);
    expect(req.request.body).toEqual({ newOrder: 2 });
    req.flush(null);
  });

  it('getVersions() GETs /{id}/versions', () => {
    service.getVersions('r1').subscribe();
    const req = http.expectOne(`${BASE}/r1/versions`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createVersion() POSTs an empty body to /{id}/versions', () => {
    let result: unknown;
    service.createVersion('r1').subscribe((r) => (result = r));
    const req = http.expectOne(`${BASE}/r1/versions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ id: 'r2', routineGroupId: 'g1', version: 2, status: 1 });
    expect(result).toEqual({ id: 'r2', routineGroupId: 'g1', version: 2, status: 1 } as never);
  });

  it('removeExercise() DELETEs the nested exercise resource', () => {
    service.removeExercise('r1', 'e9').subscribe();
    const req = http.expectOne(`${BASE}/r1/exercises/e9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
