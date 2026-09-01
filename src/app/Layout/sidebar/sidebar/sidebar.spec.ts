import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Sidebar } from './sidebar';
import { SessionFacade, AppRole } from '../../../core/auth/session-facade';
import { DialogService } from '../../../core/Dialog/dialog.service';
import { provideTestIcons } from '../../../../testing/test-icons';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let component: Sidebar;
  let session: { role: AppRole };

  function build(role: AppRole) {
    // allow a test to rebuild with a different role in the same spec
    TestBed.resetTestingModule();
    session = { role };
    TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
        { provide: SessionFacade, useValue: session },
        { provide: DialogService, useValue: jasmine.createSpyObj('DialogService', ['confirm']) },
        ...provideTestIcons(),
      ],
    });
    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    build('Coach');
    expect(component).toBeTruthy();
  });

  it('hides every catalog / plan management area from a Client', () => {
    build('Client');
    expect(component.canSee('DASHBOARD')).toBeFalse();
    expect(component.canSee('TRAINING_MANAGE')).toBeFalse();
    expect(component.canSee('NUTRITION_MANAGE')).toBeFalse();
    expect(component.canSee('PROGRESS_MANAGE')).toBeFalse();
    expect(component.canSee('CLIENTS')).toBeFalse();
    expect(component.canSee('OWNER_ADMINS')).toBeFalse();
  });

  it('shows a Client its own self-service areas', () => {
    build('Client');
    expect(component.canSee('MY_AREA')).toBeTrue();
    expect(component.canSee('TRAINING_SELF')).toBeTrue();
    expect(component.canSee('NUTRITION_SELF')).toBeTrue();
    expect(component.canSee('PROGRESS_SELF')).toBeTrue();
    expect(component.canSee('PROFILE')).toBeTrue();
  });

  it('shows a Coach the management areas but not the Owner Panel', () => {
    build('Coach');
    expect(component.canSee('TRAINING_MANAGE')).toBeTrue();
    expect(component.canSee('NUTRITION_MANAGE')).toBeTrue();
    expect(component.canSee('OWNER_ADMINS')).toBeFalse();
  });

  // §5c: a hidden group (e.g. "My Area" for staff) must not leave two rules stacked.
  for (const role of ['OwnerApp', 'Admin', 'Coach', 'Client'] as AppRole[]) {
    it(`visibleItems has no leading / trailing / doubled divider for ${role}`, () => {
      build(role);
      const kinds = component.visibleItems.map((i) => i.kind);
      expect(kinds[0]).not.toBe('divider');
      expect(kinds[kinds.length - 1]).not.toBe('divider');
      expect(kinds.some((k, idx) => k === 'divider' && kinds[idx - 1] === 'divider')).toBeFalse();
    });
  }

  // "My Area" — personal screens. Visible for Coach + Client, hidden for OwnerApp + Admin.
  describe('"My Area" section visibility', () => {
    function myAreaHeaderRendered(): boolean {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      return text.includes('My Area');
    }

    for (const role of ['Coach', 'Client'] as AppRole[]) {
      it(`is shown for ${role}`, () => {
        build(role);
        expect(component.canSee('MY_AREA')).toBeTrue();
        expect(myAreaHeaderRendered()).withContext('My Area header in DOM').toBeTrue();
      });
    }

    for (const role of ['OwnerApp', 'Admin'] as AppRole[]) {
      it(`is hidden for ${role}`, () => {
        build(role);
        expect(component.canSee('MY_AREA')).toBeFalse();
        expect(component.canSee('TRAINING_SELF')).toBeFalse();
        expect(component.canSee('NUTRITION_SELF')).toBeFalse();
        expect(component.canSee('PROGRESS_SELF')).toBeFalse();
        expect(myAreaHeaderRendered()).withContext('My Area header not in DOM').toBeFalse();
      });
    }

    it('"My Weekly Plan" is Coach-only inside My Area', () => {
      build('Coach');
      expect(component.canSee('TRAINING_PLAN_SELF')).toBeTrue();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('My Weekly Plan');

      build('Client');
      expect(component.canSee('TRAINING_PLAN_SELF')).toBeFalse();
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('My Weekly Plan');
    });
  });
});
