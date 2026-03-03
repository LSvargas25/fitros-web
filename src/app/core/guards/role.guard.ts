import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionFacade } from '../Auth/session-facade';
import { AppRole } from '../Auth/session-facade';

export const roleGuard =
  (allowedRoles: AppRole[]): CanActivateFn =>
  () => {

    const session = inject(SessionFacade);
    const router = inject(Router);

    const userRole = session.role;

    const allowed = allowedRoles.includes(userRole);

    if (!allowed) {
      return router.parseUrl('/unauthorized');
    }

    return true;
  };
