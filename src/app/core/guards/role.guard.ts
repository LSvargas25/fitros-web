import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionFacade } from '../auth/session-facade';
import { AppRole } from '../auth/session-facade';

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
