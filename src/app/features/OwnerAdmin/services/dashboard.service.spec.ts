import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { environment } from '../../../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(DashboardService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getStats() — GET /api/dashboard', () => {
    const mock = {
      totalGyms: 5, totalClients: 100, totalCoaches: 10, totalRoutines: 25,
      gyms: [{ id: '1', name: 'FitZone', phoneNumber: '111', isActive: true, clientCount: 20, coachCount: 2, adminCount: 1 }]
    };
    service.getStats().subscribe(res => {
      expect(res.totalGyms).toBe(5);
      expect(res.totalClients).toBe(100);
      expect(res.gyms.length).toBe(1);
    });
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });
});
