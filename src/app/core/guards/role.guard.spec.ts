import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { roleGuard } from './role.guard';
import { SessionFacade, AppRole } from '../auth/session-facade';
import { PERMISSIONS } from '../auth/route-permissions';

describe('roleGuard', () => {
  let session: { role: AppRole };
  let router: Router;

  function run(allowed: AppRole[]) {
    return TestBed.runInInjectionContext(() =>
      roleGuard(allowed)({} as never, {} as never),
    );
  }

  beforeEach(() => {
    session = { role: 'Client' };
    TestBed.configureTestingModule({
      providers: [{ provide: SessionFacade, useValue: session }],
    });
    router = TestBed.inject(Router);
  });

  it('allows a role that is on the list', () => {
    session.role = 'Coach';
    expect(run(PERMISSIONS.TRAINING_MANAGE as AppRole[])).toBeTrue();
  });

  it('redirects to /unauthorized (as a UrlTree) for a role that is not on the list', () => {
    session.role = 'Client';

    const result = run(PERMISSIONS.TRAINING_MANAGE as AppRole[]);

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/unauthorized');
  });

  it('keeps OwnerApp-only areas closed to Admin and Coach', () => {
    session.role = 'Admin';
    expect(run(PERMISSIONS.OWNER_ADMINS as AppRole[]) instanceof UrlTree).toBeTrue();

    session.role = 'Coach';
    expect(run(PERMISSIONS.OWNER_ADMINS as AppRole[]) instanceof UrlTree).toBeTrue();

    session.role = 'OwnerApp';
    expect(run(PERMISSIONS.OWNER_ADMINS as AppRole[])).toBeTrue();
  });

  it('lets Coach and Client into "My Area" but blocks OwnerApp and Admin (URL-typed too)', () => {
    const myAreaPerms = [
      PERMISSIONS.MY_AREA,
      PERMISSIONS.TRAINING_SELF,
      PERMISSIONS.NUTRITION_SELF,
      PERMISSIONS.PROGRESS_SELF,
    ];

    for (const role of ['Coach', 'Client'] as AppRole[]) {
      session.role = role;
      for (const perm of myAreaPerms) {
        expect(run(perm as AppRole[])).withContext(`${role} allowed`).toBeTrue();
      }
    }

    for (const role of ['OwnerApp', 'Admin'] as AppRole[]) {
      session.role = role;
      for (const perm of myAreaPerms) {
        const result = run(perm as AppRole[]);
        expect(result instanceof UrlTree).withContext(`${role} blocked`).toBeTrue();
        expect(router.serializeUrl(result as UrlTree)).toBe('/unauthorized');
      }
    }
  });

  it('lets only Coach into the self weekly-plan editor (TRAINING_PLAN_SELF)', () => {
    session.role = 'Coach';
    expect(run(PERMISSIONS.TRAINING_PLAN_SELF as AppRole[])).toBeTrue();

    for (const role of ['Client', 'Admin', 'OwnerApp'] as AppRole[]) {
      session.role = role;
      const result = run(PERMISSIONS.TRAINING_PLAN_SELF as AppRole[]);
      expect(result instanceof UrlTree).withContext(`${role} blocked`).toBeTrue();
      expect(router.serializeUrl(result as UrlTree)).toBe('/unauthorized');
    }
  });

  it('keeps Profile open to every role', () => {
    for (const role of ['OwnerApp', 'Admin', 'Coach', 'Client'] as AppRole[]) {
      session.role = role;
      expect(run(PERMISSIONS.PROFILE as AppRole[])).toBeTrue();
    }
  });

  it('denies a Client every catalog / plan management area', () => {
    session.role = 'Client';
    const managed = [
      PERMISSIONS.DASHBOARD,
      PERMISSIONS.CLIENTS,
      PERMISSIONS.TRAINING_MANAGE,
      PERMISSIONS.NUTRITION_MANAGE,
      PERMISSIONS.PROGRESS_MANAGE,
      PERMISSIONS.OWNER_ADMINS,
    ];
    for (const perm of managed) {
      const result = run(perm as AppRole[]);
      expect(result instanceof UrlTree).toBeTrue();
      expect(router.serializeUrl(result as UrlTree)).toBe('/unauthorized');
    }
  });
});
