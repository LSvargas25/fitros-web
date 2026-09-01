import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionFacade } from '../auth/session-facade';

export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionFacade);
  const router = inject(Router);

  // Already signed in with a usable token: send them to their landing page.
  // A present-but-unusable token is cleared by validateSession(), so the guest
  // page then loads normally.
  if (session.validateSession()) {
    return router.parseUrl(session.landingUrl);
  }

  return true;
};
