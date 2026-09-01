import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(UserService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ── Admins ─────────────────────────────────────────────────────────────────
  it('getAdmins() — GET /api/admins', () => {
    const mock = [{ id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', gymId: null, gymName: null, status: 'Active' }];
    service.getAdmins().subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(`${base}/admins`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getAdminById() — GET /api/admins/{id}', () => {
    const mock = { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', gymId: null, gymName: null, status: 'Active' };
    service.getAdminById('1').subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(`${base}/admins/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('createAdmin() — POST /api/admins', () => {
    const dto  = { email: 'a@b.com', firstName: 'A', lastName: 'B', password: 'pass' };
    const mock = { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', gymId: null, gymName: null, status: 'Active' };
    service.createAdmin(dto).subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(`${base}/admins`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mock);
  });

  it('updateAdmin() — PUT /api/admins/{id}', () => {
    const dto = { firstName: 'A', lastName: 'B', email: 'a@b.com' };
    service.updateAdmin('1', dto).subscribe();
    const req = http.expectOne(`${base}/admins/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('activateAdmin() — PATCH /api/admins/{id}/activate', () => {
    service.activateAdmin('1').subscribe();
    const req = http.expectOne(`${base}/admins/1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('deactivateAdmin() — PATCH /api/admins/{id}/deactivate', () => {
    service.deactivateAdmin('1').subscribe();
    const req = http.expectOne(`${base}/admins/1/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('deleteAdmin() — DELETE /api/admins/{id}/permanent', () => {
    service.deleteAdmin('1').subscribe();
    const req = http.expectOne(`${base}/admins/1/permanent`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Coaches ────────────────────────────────────────────────────────────────
  it('getCoaches() — GET /api/coaches', () => {
    const mock = [{ id: 'c1', email: 'c@gym.com', firstName: 'C', lastName: 'D', gymId: null, gymName: null, status: 'Active' }];
    service.getCoaches().subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(`${base}/coaches`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('createCoach() — POST /api/coaches', () => {
    const dto = { email: 'c@gym.com', firstName: 'C', lastName: 'D', password: 'pass' };
    service.createCoach(dto).subscribe();
    const req = http.expectOne(`${base}/coaches`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('activateCoach() — PATCH /api/coaches/{id}/activate', () => {
    service.activateCoach('c1').subscribe();
    const req = http.expectOne(`${base}/coaches/c1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('deactivateCoach() — PATCH /api/coaches/{id}/deactivate', () => {
    service.deactivateCoach('c1').subscribe();
    const req = http.expectOne(`${base}/coaches/c1/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('deleteCoach() — DELETE /api/coaches/{id}', () => {
    service.deleteCoach('c1').subscribe();
    const req = http.expectOne(`${base}/coaches/c1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Clients ────────────────────────────────────────────────────────────────
  it('getClients() — GET /api/clients', () => {
    const mock = [{ id: 'cl1', email: 'cl@gym.com', firstName: 'L', lastName: 'F', status: 'Active', gymId: null, gymName: null }];
    service.getClients().subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(`${base}/clients`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('createClient() — POST /api/clients', () => {
    const dto = { email: 'cl@gym.com', firstName: 'L', lastName: 'F', password: 'pass', gymId: 'g1' };
    service.createClient(dto).subscribe();
    const req = http.expectOne(`${base}/clients`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('activateClient() — PATCH /api/clients/{id}/activate', () => {
    service.activateClient('cl1').subscribe();
    const req = http.expectOne(`${base}/clients/cl1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('deactivateClient() — PATCH /api/clients/{id}/deactivate', () => {
    service.deactivateClient('cl1').subscribe();
    const req = http.expectOne(`${base}/clients/cl1/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('deleteClient() — DELETE /api/clients/{id}', () => {
    service.deleteClient('cl1').subscribe();
    const req = http.expectOne(`${base}/clients/cl1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Generic user operations ────────────────────────────────────────────────
  it('updateUser() — PUT /api/users/{id}', () => {
    const dto = { firstName: 'John', lastName: 'Doe', email: 'j@d.com' };
    service.updateUser('u1', dto).subscribe();
    const req = http.expectOne(`${base}/users/u1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('activateUser() — PATCH /api/users/{id}/activate', () => {
    service.activateUser('u1').subscribe();
    const req = http.expectOne(`${base}/users/u1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('deactivateUser() — DELETE /api/users/{id}', () => {
    service.deactivateUser('u1').subscribe();
    const req = http.expectOne(`${base}/users/u1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('hardDeleteUser() — DELETE /api/users/{id}/permanent', () => {
    service.hardDeleteUser('u1').subscribe();
    const req = http.expectOne(`${base}/users/u1/permanent`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
