import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { FoodService } from './food.service';
import { FoodCategory } from '../models/food.models';
import { environment } from '../../../../../environments/environment';

const BASE = `${environment.apiBaseUrl}/api/foods`;

describe('FoodService', () => {
  let service: FoodService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FoodService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FoodService);
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

  it('list(category, includeArchived) sends both query params', () => {
    service.list(FoodCategory.Protein, true).subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('category')).toBe(String(FoodCategory.Protein));
    expect(req.request.params.get('includeArchived')).toBe('true');
    req.flush([]);
  });

  it('does not send includeArchived when false', () => {
    service.list(FoodCategory.Protein).subscribe();
    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.has('includeArchived')).toBeFalse();
    req.flush([]);
  });

  it('create() POSTs the payload and returns { id }', () => {
    const payload = { name: 'Avena', category: FoodCategory.Carbohydrate } as never;
    let result: unknown;
    service.create(payload).subscribe((r) => (result = r));
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'f9' });
    expect(result).toEqual({ id: 'f9' });
  });

  it('update() PUTs to /{payload.id}', () => {
    const payload = { id: 'f1', name: 'Avena integral', category: FoodCategory.Carbohydrate } as never;
    service.update(payload).subscribe();
    const req = http.expectOne(`${BASE}/f1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(null);
  });

  it('archive() DELETEs /{id}', () => {
    service.archive('f1').subscribe();
    const req = http.expectOne(`${BASE}/f1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
