import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionFacade } from '../auth/session-facade';

export const authGuard: CanActivateFn = () => {
  const session = inject(SessionFacade);
  const router = inject(Router);

  // validateSession() also force-clears a token that is present but unusable
  // (unparseable, no known role, or expired).
  if (session.validateSession()) {
    return true;
  }

  return router.parseUrl('/login');
};
