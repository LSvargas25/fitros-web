import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SessionFacade } from './session-facade';
import { TokenStorageService } from './token-storage.service';

/** Build a syntactically valid JWT (`header.payload.sig`) carrying `claims`. */
function jwt(claims: Record<string, unknown>): string {
  const body = btoa(JSON.stringify(claims));
  return `eyJhbGciOiJIUzI1NiJ9.${body}.sig`;
}

describe('SessionFacade', () => {
  let facade: SessionFacade;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;
  let router: jasmine.SpyObj<Router>;

  function withToken(token: string | null) {
    tokenStorage.getAccessToken.and.returnValue(token);
  }

  beforeEach(() => {
    tokenStorage = jasmine.createSpyObj('TokenStorageService', ['getAccessToken', 'clear']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        SessionFacade,
        { provide: TokenStorageService, useValue: tokenStorage },
        { provide: Router, useValue: router },
      ],
    });

    facade = TestBed.inject(SessionFacade);
  });

  it('reads the role from the JWT `role` claim', () => {
    withToken(jwt({ role: 'Admin' }));
    expect(facade.role).toBe('Admin');
  });

  it('accepts the long-form Microsoft role claim URI', () => {
    withToken(jwt({
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Coach',
    }));
    expect(facade.role).toBe('Coach');
  });

  it('falls back to Client for an unknown role value', () => {
    withToken(jwt({ role: 'Superuser' }));
    expect(facade.role).toBe('Client');
  });

  it('falls back to Client when there is no token', () => {
    withToken(null);
    expect(facade.role).toBe('Client');
  });

  it('falls back to Client for a malformed token instead of throwing', () => {
    withToken('not-a-jwt');
    expect(() => facade.role).not.toThrow();
    expect(facade.role).toBe('Client');
  });

  it('exposes userId / userEmail from the standard claims', () => {
    withToken(jwt({ sub: 'user-123', email: 'a@b.com', role: 'Client' }));
    expect(facade.userId).toBe('user-123');
    expect(facade.userEmail).toBe('a@b.com');
  });

  it('caches the decoded payload until the token changes', () => {
    withToken(jwt({ role: 'Admin' }));
    expect(facade.role).toBe('Admin');

    withToken(jwt({ role: 'Coach' }));
    expect(facade.role).toBe('Coach');
  });

  it('hasAnyRole() honours the permission lists', () => {
    withToken(jwt({ role: 'Coach' }));
    expect(facade.hasAnyRole(['OwnerApp', 'Admin', 'Coach'])).toBeTrue();
    expect(facade.hasAnyRole(['OwnerApp'])).toBeFalse();
    expect(facade.canManageTraining()).toBeTrue();
    expect(facade.canViewOwnerAdmins()).toBeFalse();
  });

  it('logout() clears storage, drops the cache and routes to /login', () => {
    withToken(jwt({ role: 'Admin' }));
    expect(facade.role).toBe('Admin');

    facade.logout();

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');

    withToken(null);
    expect(facade.role).toBe('Client');
  });

  describe('landingUrl', () => {
    it('is /my/training for a Client', () => {
      withToken(jwt({ role: 'Client' }));
      expect(facade.landingUrl).toBe('/my/training');
    });

    it('is /dashboard for staff', () => {
      for (const role of ['OwnerApp', 'Admin', 'Coach']) {
        withToken(jwt({ role }));
        expect(facade.landingUrl).toBe('/dashboard');
      }
    });
  });

  describe('isTokenExpired', () => {
    const inSeconds = (ms: number) => Math.floor((Date.now() + ms) / 1000);

    it('is false for a token whose exp is in the future', () => {
      withToken(jwt({ role: 'Admin', exp: inSeconds(60_000) }));
      expect(facade.isTokenExpired()).toBeFalse();
    });

    it('is true for a token whose exp is in the past', () => {
      withToken(jwt({ role: 'Admin', exp: inSeconds(-60_000) }));
      expect(facade.isTokenExpired()).toBeTrue();
    });

    it('is false when there is no exp claim', () => {
      withToken(jwt({ role: 'Admin' }));
      expect(facade.isTokenExpired()).toBeFalse();
    });
  });

  describe('validateSession', () => {
    const inSeconds = (ms: number) => Math.floor((Date.now() + ms) / 1000);

    it('returns false and does not touch storage when there is no token', () => {
      withToken(null);
      expect(facade.validateSession()).toBeFalse();
      expect(tokenStorage.clear).not.toHaveBeenCalled();
    });

    it('returns true for a well-formed, unexpired token with a known role', () => {
      withToken(jwt({ role: 'Coach', exp: inSeconds(60_000) }));
      expect(facade.validateSession()).toBeTrue();
      expect(tokenStorage.clear).not.toHaveBeenCalled();
    });

    it('force-clears the tokens when the JWT is malformed', () => {
      withToken('garbage.token');
      expect(facade.validateSession()).toBeFalse();
      expect(tokenStorage.clear).toHaveBeenCalled();
    });

    it('force-clears the tokens when the role claim is unrecognised', () => {
      withToken(jwt({ role: 'Superuser' }));
      expect(facade.validateSession()).toBeFalse();
      expect(tokenStorage.clear).toHaveBeenCalled();
    });

    it('force-clears the tokens when the token is expired', () => {
      withToken(jwt({ role: 'Admin', exp: inSeconds(-1_000) }));
      expect(facade.validateSession()).toBeFalse();
      expect(tokenStorage.clear).toHaveBeenCalled();
    });
  });
});
