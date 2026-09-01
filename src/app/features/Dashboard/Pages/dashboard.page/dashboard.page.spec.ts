import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DashboardPage } from './dashboard.page';
import { DashboardService } from '../../../OwnerAdmin/services/dashboard.service';
import { DashboardStatsResponse } from '../../../OwnerAdmin/Models/dashboard.models';
import { SessionFacade, AppRole } from '../../../../core/auth/session-facade';

const ownerStats: DashboardStatsResponse = {
  totalGyms: 3,
  totalAdmins: 4,
  totalClients: 120,
  totalCoaches: 9,
  totalRoutines: 40,
  gyms: [
    { id: 'g1', name: 'FitZone', phoneNumber: '111', isActive: true, clientCount: 60, coachCount: 4, adminCount: 2 },
    { id: 'g2', name: 'IronHouse', phoneNumber: '222', isActive: false, clientCount: 60, coachCount: 5, adminCount: 2 },
  ],
};

/**
 * Confirmed contract (backend session, commit f4de004, verified live):
 * `GET /api/dashboard` returns the SAME `DashboardStatsResponse` shape for every role.
 * For Admin/Coach every number is scoped to their single gym and `gyms` holds exactly
 * that one gym; `totalGyms` is 1 (or 0). Owner stays global.
 */
const gymScopedStats: DashboardStatsResponse = {
  totalGyms: 1,
  totalAdmins: 1,
  totalClients: 22,
  totalCoaches: 2,
  totalRoutines: 7,
  gyms: [
    { id: 'g1', name: 'FitZone', phoneNumber: '111', isActive: true, clientCount: 22, coachCount: 2, adminCount: 1 },
  ],
};

/** Admin/Coach with no gym assigned: 200 OK, all totals 0, `gyms: []` (never 403). */
const noGymStats: DashboardStatsResponse = {
  totalGyms: 0, totalAdmins: 0, totalClients: 0, totalCoaches: 0, totalRoutines: 0, gyms: [],
};

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let dashboard: jasmine.SpyObj<DashboardService>;
  let role: AppRole;

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: DashboardService, useValue: dashboard },
        { provide: SessionFacade, useValue: { role } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function bodyText(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  beforeEach(() => {
    role = 'OwnerApp';
    dashboard = jasmine.createSpyObj('DashboardService', ['getStats']);
    dashboard.getStats.and.returnValue(of(ownerStats));
  });

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('as Owner: renders the full platform stats and every gym row', async () => {
    await setup();

    expect(component.isLoading()).toBeFalse();
    expect(component.error()).toBeNull();
    expect(component.stats()).toEqual(ownerStats);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('FitZone');
    expect(text).toContain('IronHouse');
  });

  it('as Admin: renders a gym-scoped payload (1 gym) without breaking', async () => {
    role = 'Admin';
    dashboard.getStats.and.returnValue(of(gymScopedStats));
    await setup();

    expect(component.error()).toBeNull();
    expect(component.stats()!.totalGyms).toBe(1);
    expect(component.stats()!.gyms.length).toBe(1);
    // Scoped numbers still render (Clients card shows the gym's 22).
    expect(bodyText()).toContain('22');
  });

  it('as Coach: renders the same gym-scoped shape (data layer does not branch on role)', async () => {
    role = 'Coach';
    // A coach with 0 admins visible in their scope — totalAdmins may legitimately be 0.
    dashboard.getStats.and.returnValue(of({ ...gymScopedStats, totalAdmins: 0 }));
    await setup();

    expect(component.error()).toBeNull();
    expect(component.stats()!.totalAdmins).toBe(0);
    expect(component.stats()!.gyms.length).toBe(1);
    expect(bodyText()).toContain('Clients');
  });

  describe('role-aware copy (product decision 2026-08-31)', () => {
    it('as Owner: keeps the platform-wide subtitle, the Gyms stat card and the gyms table', async () => {
      role = 'OwnerApp';
      await setup();

      expect(component.isOwner).toBeTrue();
      expect(bodyText()).toContain('Platform statistics at a glance');
      expect(bodyText()).not.toContain('Your gym at a glance');
      // "Gyms" appears both on the stat card and the table heading.
      expect(bodyText()).toContain('Gyms');
      expect((fixture.nativeElement as HTMLElement).querySelector('table')).not.toBeNull();
      expect(bodyText()).toContain('FitZone');
    });

    for (const staffRole of ['Admin', 'Coach'] as AppRole[]) {
      it(`as ${staffRole}: gym-scoped subtitle, no Gyms card, no gyms table`, async () => {
        role = staffRole;
        dashboard.getStats.and.returnValue(of(gymScopedStats));
        await setup();

        expect(component.isOwner).toBeFalse();
        expect(bodyText()).toContain('Your gym at a glance');
        expect(bodyText()).not.toContain('Platform statistics at a glance');
        // The one-row gyms table (and its "Gyms N total" heading) is gone.
        expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
        expect(bodyText()).not.toContain('FitZone');
        expect(bodyText()).not.toContain('No gyms registered yet.');
        // The four scoped stat cards remain.
        expect(bodyText()).toContain('Clients');
        expect(bodyText()).toContain('Coaches');
        expect(bodyText()).toContain('Admins');
        expect(bodyText()).toContain('Routines');
      });
    }
  });

  it('as Owner with no gyms yet: all-zero totals + "no gyms" table state, no error', async () => {
    role = 'OwnerApp';
    dashboard.getStats.and.returnValue(of(noGymStats));
    await setup();

    expect(component.error()).toBeNull();
    expect(component.stats()!.totalGyms).toBe(0);
    expect(component.stats()!.gyms).toEqual([]);
    expect(bodyText()).toContain('No gyms registered yet.');
  });

  it('as Admin with no gym assigned: all-zero cards, no table, no error', async () => {
    role = 'Admin';
    dashboard.getStats.and.returnValue(of(noGymStats));
    await setup();

    expect(component.error()).toBeNull();
    expect(component.stats()!.gyms).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
    expect(bodyText()).not.toContain('No gyms registered yet.');
    expect(bodyText()).toContain('Your gym at a glance');
  });

  it('defensive: a malformed/partial payload is coerced (no crash) even though the contract never sends one', async () => {
    // Not a real server response — guards against future contract drift / partial deserialization.
    dashboard.getStats.and.returnValue(of({ totalClients: 22 } as DashboardStatsResponse));
    await setup();

    expect(component.error()).toBeNull();
    expect(component.stats()!.gyms).toEqual([]);
    expect(component.stats()!.totalGyms).toBe(0);
    expect(component.stats()!.totalClients).toBe(22);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No gyms registered yet.');
  });

  it('surfaces a 403 as a visible error instead of swallowing it', async () => {
    dashboard.getStats.and.returnValue(throwError(() => ({ status: 403, detail: 'You are not authorized.' })));
    await setup();

    expect(component.isLoading()).toBeFalse();
    expect(component.stats()).toBeNull();
    expect(component.error()).toBe('You are not authorized.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('You are not authorized.');
  });

  it('falls back to a generic message when a failed load carries no detail', async () => {
    dashboard.getStats.and.returnValue(throwError(() => ({ status: 403 })));
    await setup();

    expect(component.error()).toBe('Failed to load dashboard stats.');
  });
});
