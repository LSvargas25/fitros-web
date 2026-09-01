import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { guestGuard } from './guest.guard';
import { SessionFacade } from '../auth/session-facade';

describe('guestGuard', () => {
  let session: jasmine.SpyObj<SessionFacade>;
  let router: Router;

  const run = () =>
    TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

  beforeEach(() => {
    session = jasmine.createSpyObj('SessionFacade', ['validateSession'], { landingUrl: '/dashboard' });
    TestBed.configureTestingModule({
      providers: [{ provide: SessionFacade, useValue: session }],
    });
    router = TestBed.inject(Router);
  });

  it('lets a guest (no valid session) onto the public page', () => {
    session.validateSession.and.returnValue(false);
    expect(run()).toBeTrue();
  });

  it('bounces a signed-in user to their landing page', () => {
    session.validateSession.and.returnValue(true);

    const result = run();

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });
});
