import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GymService } from './gym.service';
import { environment } from '../../../../environments/environment';

describe('GymService', () => {
  let service: GymService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/gyms`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(GymService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll() — GET /api/gyms', () => {
    const mock = [{ id: '1', name: 'FitZone', phoneNumber: '123', isActive: true, clientCount: 5, coachCount: 2, adminCount: 1 }];
    service.getAll().subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getAll() with search — appends query params', () => {
    service.getAll('FitZone', true).subscribe();
    const req = http.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('FitZone');
    expect(req.request.params.get('isActive')).toBe('true');
    req.flush([]);
  });

  it('create() — POST /api/gyms', () => {
    const body = { name: 'Test', address: 'Addr', phoneNumber: '111', adminEmail: 'a@b.com', adminFirstName: 'A', adminLastName: 'B', adminPassword: 'pass123' };
    service.create(body).subscribe(res => expect(res).toBe('ok'));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush('ok');
  });

  it('activate() — PATCH /api/gyms/{id}/activate', () => {
    service.activate('abc').subscribe();
    const req = http.expectOne(`${base}/abc/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('deactivate() — PATCH /api/gyms/{id}/deactivate', () => {
    service.deactivate('abc').subscribe();
    const req = http.expectOne(`${base}/abc/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('delete() — DELETE /api/gyms/{id}', () => {
    service.delete('abc').subscribe();
    const req = http.expectOne(`${base}/abc`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('assignAdmin() — PATCH /api/gyms/{id}/assign-admin', () => {
    service.assignAdmin('g1', 'a1').subscribe();
    const req = http.expectOne(`${base}/g1/assign-admin`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ adminId: 'a1' });
    req.flush(null);
  });

  it('assignCoach() — PATCH /api/gyms/{id}/assign-coach', () => {
    service.assignCoach('g1', 'c1').subscribe();
    const req = http.expectOne(`${base}/g1/assign-coach`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ coachId: 'c1' });
    req.flush(null);
  });

  it('assignClient() — PATCH /api/gyms/{id}/assign-client', () => {
    service.assignClient('g1', 'cl1').subscribe();
    const req = http.expectOne(`${base}/g1/assign-client`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ clientId: 'cl1' });
    req.flush(null);
  });
});
