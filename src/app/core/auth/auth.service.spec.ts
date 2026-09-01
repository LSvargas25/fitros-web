import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment';

const AUTH = `${environment.apiBaseUrl}/api/Auth`;

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    tokenStorage = jasmine.createSpyObj('TokenStorageService', [
      'setTokens',
      'getRefreshToken',
      'getAccessToken',
      'clear',
    ]);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: tokenStorage },
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login() posts credentials and persists the returned tokens with the rememberMe flag', () => {
    service.login({ email: 'a@b.com', password: 'pw' }, false).subscribe();

    const req = http.expectOne(`${AUTH}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'pw' });

    req.flush({ accessToken: 'acc', refreshToken: 'ref' });

    expect(tokenStorage.setTokens).toHaveBeenCalledWith('acc', 'ref', false);
  });

  it('login() does not store tokens when the request fails', () => {
    service.login({ email: 'a@b.com', password: 'bad' }, true).subscribe({
      next: () => fail('expected an error'),
      error: () => {},
    });

    http.expectOne(`${AUTH}/login`).flush(
      { detail: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(tokenStorage.setTokens).not.toHaveBeenCalled();
  });

  it('refresh() short-circuits with an error when there is no stored refresh token', (done) => {
    tokenStorage.getRefreshToken.and.returnValue(null);

    service.refresh().subscribe({
      next: () => fail('expected an error'),
      error: (err) => {
        expect(err.message).toContain('No refresh token');
        done();
      },
    });

    http.expectNone(`${AUTH}/refresh`);
  });

  it('refresh() posts the stored refresh token and re-persists the rotated pair', () => {
    tokenStorage.getRefreshToken.and.returnValue('old-refresh');

    service.refresh().subscribe();

    const req = http.expectOne(`${AUTH}/refresh`);
    expect(req.request.body).toEqual({ refreshToken: 'old-refresh' });
    req.flush({ accessToken: 'new-acc', refreshToken: 'new-ref' });

    expect(tokenStorage.setTokens).toHaveBeenCalledWith('new-acc', 'new-ref');
  });

  it('logout() clears storage and routes to /login', () => {
    service.logout();

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('isAuthenticated() reflects the presence of an access token', () => {
    tokenStorage.getAccessToken.and.returnValue('tok');
    expect(service.isAuthenticated()).toBeTrue();

    tokenStorage.getAccessToken.and.returnValue(null);
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('forgotPassword() and resetPassword() hit their endpoints', () => {
    service.forgotPassword('a@b.com').subscribe();
    http.expectOne(`${AUTH}/forgot-password`).flush(null);

    service.resetPassword({ email: 'a@b.com', token: 't', newPassword: 'pw' }).subscribe();
    const req = http.expectOne(`${AUTH}/reset-password`);
    expect(req.request.body).toEqual({ email: 'a@b.com', token: 't', newPassword: 'pw' });
    req.flush(null);
  });
});
