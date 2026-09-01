import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MealPlanService } from './meal-plan.service';
import { MealType } from '../models/meal-plan.models';
import { environment } from '../../../../../environments/environment';

const BASE = `${environment.apiBaseUrl}/api/meal-plans`;

describe('MealPlanService', () => {
  let service: MealPlanService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MealPlanService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MealPlanService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getById / getClientPlans / getActivePlan (staff) hit the right URLs with GET', () => {
    service.getById('mp1').subscribe();
    const byId = http.expectOne(`${BASE}/mp1`);
    expect(byId.request.method).toBe('GET');
    byId.flush({});

    service.getClientPlans('cp1').subscribe();
    const clientPlans = http.expectOne(`${BASE}/client/cp1`);
    expect(clientPlans.request.method).toBe('GET');
    clientPlans.flush([]);

    service.getActivePlan('cp1').subscribe();
    const active = http.expectOne(`${BASE}/client/cp1/active`);
    expect(active.request.method).toBe('GET');
    active.flush({});
  });

  // Client self-service — MUST hit /api/my/meal-plans (MyPlansController), never the
  // staff /api/meal-plans/client/... routes (those 403 for a Client).
  const MY_BASE = `${environment.apiBaseUrl}/api/my/meal-plans`;

  it('getMyActivePlan() GETs /api/my/meal-plans/active and nothing on the staff route', () => {
    service.getMyActivePlan().subscribe();
    const req = http.expectOne(`${MY_BASE}/active`);
    expect(req.request.method).toBe('GET');
    req.flush({});
    http.expectNone((r) => r.url.startsWith(`${BASE}/client/`));
  });

  it('getMyPlans() GETs /api/my/meal-plans and nothing on the staff route', () => {
    service.getMyPlans().subscribe();
    const req = http.expectOne(MY_BASE);
    expect(req.request.method).toBe('GET');
    req.flush([]);
    http.expectNone((r) => r.url.startsWith(`${BASE}/client/`));
  });

  it('getMyPlanById() GETs /api/my/meal-plans/{id}', () => {
    service.getMyPlanById('mp9').subscribe();
    const req = http.expectOne(`${MY_BASE}/mp9`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() POSTs { clientProfileId, name }', () => {
    service.create('cp1', 'Cutting').subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ clientProfileId: 'cp1', name: 'Cutting' });
    req.flush({ id: 'mp9' });
  });

  it('rename() PATCHes /{id}/rename with { name }', () => {
    service.rename('mp1', 'Bulking').subscribe();
    const req = http.expectOne(`${BASE}/mp1/rename`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Bulking' });
    req.flush(null);
  });

  it('activate() PATCHes /{id}/activate', () => {
    service.activate('mp1').subscribe();
    const req = http.expectOne(`${BASE}/mp1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('archive() PATCHes /{id}/archive', () => {
    service.archive('mp1').subscribe();
    const req = http.expectOne(`${BASE}/mp1/archive`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('addEntry() POSTs the entry payload to /{id}/entries', () => {
    service.addEntry('mp1', { day: 2, meal: MealType.Lunch, foodId: 'f9', quantityGrams: 120 }).subscribe();
    const req = http.expectOne(`${BASE}/mp1/entries`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ day: 2, meal: MealType.Lunch, foodId: 'f9', quantityGrams: 120 });
    req.flush(null);
  });

  it('updateEntry() PUTs { quantityGrams } to /{id}/entries/{entryId}', () => {
    service.updateEntry('mp1', 'e1', 150).subscribe();
    const req = http.expectOne(`${BASE}/mp1/entries/e1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ quantityGrams: 150 });
    req.flush(null);
  });

  it('moveEntry() PUTs { newOrder } to /{id}/entries/{entryId}/move', () => {
    service.moveEntry('mp1', 'e1', 3).subscribe();
    const req = http.expectOne(`${BASE}/mp1/entries/e1/move`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ newOrder: 3 });
    req.flush(null);
  });

  it('removeEntry() DELETEs /{id}/entries/{entryId}', () => {
    service.removeEntry('mp1', 'e1').subscribe();
    const req = http.expectOne(`${BASE}/mp1/entries/e1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
