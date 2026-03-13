import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { environment } from '../../../../environments/environment';

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/api/notifications`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(NotificationService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll() — GET /api/notifications', () => {
    const mock = [{ id: '1', title: 'T', message: 'M', type: 0, isRead: false, createdAt: '2026-01-01' }];
    service.getAll().subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getUnread() — GET /api/notifications/unread', () => {
    const mock = [{ id: '2', title: 'U', message: 'M', type: 1, isRead: false, createdAt: '2026-01-02' }];
    service.getUnread().subscribe(res => expect(res).toEqual(mock));
    const req = http.expectOne(`${base}/unread`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('markAsRead() — PATCH /api/notifications/{id}/read', () => {
    service.markAsRead('n1').subscribe();
    const req = http.expectOne(`${base}/n1/read`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('delete() — DELETE /api/notifications/{id}', () => {
    service.delete('n1').subscribe();
    const req = http.expectOne(`${base}/n1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
