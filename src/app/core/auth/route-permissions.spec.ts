import { PERMISSIONS } from './route-permissions';

/**
 * Locks the role matrix:
 *  - a Client can never reach a catalog / plan management area;
 *  - the personal "My Area" screens (My Training / Nutrition / Progress / Measures)
 *    are Coach + Client only — OwnerApp / Admin have no personal ClientProfile;
 *  - Profile stays open to every authenticated role.
 */
describe('PERMISSIONS matrix', () => {
  const staffOnly = [
    'DASHBOARD',
    'CLIENTS',
    'TRAINING_MANAGE',
    'NUTRITION_MANAGE',
    'PROGRESS_MANAGE',
  ] as const;

  const myArea = ['MY_AREA', 'TRAINING_SELF', 'NUTRITION_SELF', 'PROGRESS_SELF'] as const;

  for (const key of staffOnly) {
    it(`${key} excludes Client`, () => {
      expect(PERMISSIONS[key]).not.toContain('Client');
    });
  }

  it('OWNER_ADMINS is OwnerApp only', () => {
    expect(PERMISSIONS.OWNER_ADMINS).toEqual(['OwnerApp']);
  });

  for (const key of myArea) {
    it(`${key} is Coach + Client only (no OwnerApp / Admin)`, () => {
      expect(PERMISSIONS[key]).toEqual(jasmine.arrayWithExactContents(['Coach', 'Client']));
    });
  }

  it('PROFILE includes every role', () => {
    expect(PERMISSIONS.PROFILE).toEqual(
      jasmine.arrayWithExactContents(['OwnerApp', 'Admin', 'Coach', 'Client']),
    );
  });

  it('TRAINING_PLAN_SELF is Coach only (a Client never self-assigns a weekly plan)', () => {
    expect(PERMISSIONS.TRAINING_PLAN_SELF).toEqual(['Coach']);
  });
});
