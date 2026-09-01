import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { SessionFacade } from '../auth/session-facade';

describe('authGuard', () => {
  let session: jasmine.SpyObj<SessionFacade>;
  let router: Router;

  const run = () =>
    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

  beforeEach(() => {
    session = jasmine.createSpyObj('SessionFacade', ['validateSession']);
    TestBed.configureTestingModule({
      providers: [{ provide: SessionFacade, useValue: session }],
    });
    router = TestBed.inject(Router);
  });

  it('allows activation when the session is valid', () => {
    session.validateSession.and.returnValue(true);
    expect(run()).toBeTrue();
  });

  it('redirects to /login (UrlTree) when validateSession() fails', () => {
    session.validateSession.and.returnValue(false);

    const result = run();

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('delegates the expiry / malformed-token check to validateSession()', () => {
    session.validateSession.and.returnValue(false);
    run();
    expect(session.validateSession).toHaveBeenCalled();
  });
});
