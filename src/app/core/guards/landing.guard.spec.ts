import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { landingGuard } from './landing.guard';
import { SessionFacade } from '../auth/session-facade';

describe('landingGuard', () => {
  let session: { landingUrl: string };
  let router: Router;

  const run = () =>
    TestBed.runInInjectionContext(() => landingGuard({} as never, {} as never));

  beforeEach(() => {
    session = { landingUrl: '/dashboard' };
    TestBed.configureTestingModule({
      providers: [{ provide: SessionFacade, useValue: session }],
    });
    router = TestBed.inject(Router);
  });

  it('redirects to the session landing url for staff', () => {
    session.landingUrl = '/dashboard';
    const result = run();
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });

  it('redirects a client to /my/training', () => {
    session.landingUrl = '/my/training';
    expect(router.serializeUrl(run() as UrlTree)).toBe('/my/training');
  });
});
