import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(UserService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('createAdmin() — POST /api/users/admins', () => {
    const dto = { email: 'a@b.com', firstName: 'A', lastName: 'B', password: 'pass' };
    const mock = { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', status: 'Active' };
    service.createAdmin(dto).subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(`${base}/admins`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mock);
  });

  it('getAdmins() — GET /api/users/admins', () => {
    const mock = [{ id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', gymId: null, status: 'Active' }];
    service.getAdmins().subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(`${base}/admins`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('assignAdminToGym() — PUT /api/users/admins/{id}/gym', () => {
    service.assignAdminToGym('admin1', 'gym1').subscribe();
    const req = http.expectOne(`${base}/admins/admin1/gym`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ gymId: 'gym1' });
    req.flush(null);
  });
});
