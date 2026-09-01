import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ExerciseService } from './exercise.service';
import { MuscleGroup } from '../models/exercise.models';
import { environment } from '../../../../../environments/environment';

const BASE = `${environment.apiBaseUrl}/api/exercises`;

describe('ExerciseService', () => {
  let service: ExerciseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExerciseService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExerciseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() GETs the collection with no params by default', () => {
    service.list().subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('list(category) sends the category query param', () => {
    service.list(MuscleGroup.Legs).subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('category')).toBe(String(MuscleGroup.Legs));
    req.flush([]);
  });

  it('getById() GETs /{id}', () => {
    service.getById('x1').subscribe();
    const req = http.expectOne(`${BASE}/x1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() POSTs the payload', () => {
    const payload = { name: 'Sentadilla', category: MuscleGroup.Legs } as never;
    service.create(payload).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'x9' });
  });

  it('update() PUTs to /{payload.id} with the payload as body', () => {
    const payload = { id: 'x1', name: 'Sentadilla frontal', category: MuscleGroup.Legs } as never;
    service.update(payload).subscribe();
    const req = http.expectOne(`${BASE}/x1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(null);
  });

  it('archive() DELETEs /{id}', () => {
    service.archive('x1').subscribe();
    const req = http.expectOne(`${BASE}/x1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
