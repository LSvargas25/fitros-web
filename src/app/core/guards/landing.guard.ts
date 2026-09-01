import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionFacade } from '../auth/session-facade';

/**
 * Role-aware redirect for the empty path. Staff land on `/dashboard`, clients on
 * `/my/training`. `authGuard` on the parent route has already run, so a session
 * is guaranteed here.
 */
export const landingGuard: CanActivateFn = () => {
  const session = inject(SessionFacade);
  return inject(Router).parseUrl(session.landingUrl);
};
