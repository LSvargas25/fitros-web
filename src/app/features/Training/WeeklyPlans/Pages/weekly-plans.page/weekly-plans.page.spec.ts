import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { WeeklyPlansPage } from './weekly-plans.page';
import { DialogService } from '../../../../../core/Dialog/dialog.service';
import { ClientProfileService } from '../../../../Progress/services/client-profile.service';
import { RoutineService } from '../../../Routines/services/routine.service';
import { RoutineStatus } from '../../../Routines/models/routine.models';
import { TrainingPlanService } from '../../services/training-plan.service';
import {
  TrainingPlanStatus,
  WeeklyTrainingPlanDetail,
} from '../../models/training-plan.models';
import { provideTestIcons } from '../../../../../../testing/test-icons';

const publishedRoutines = [
  { id: 'r1', name: 'Empuje', version: 1, status: 'Published' },
  { id: 'r2', name: 'Tirón', version: 1, status: 'Published' },
];

const planWithMonday: WeeklyTrainingPlanDetail = {
  id: 'tp1',
  clientProfileId: 'cp1',
  coachId: 'co1',
  name: 'Bloque 1',
  status: TrainingPlanStatus.Draft,
  createdAt: '2026-08-01T00:00:00Z',
  days: [
    { id: 'd1', day: 1, workoutRoutineId: 'r1', workoutRoutineName: 'Empuje', notes: 'técnica' },
  ],
};

describe('WeeklyPlansPage', () => {
  let component: WeeklyPlansPage;
  let fixture: ComponentFixture<WeeklyPlansPage>;
  let plans: jasmine.SpyObj<TrainingPlanService>;
  let profiles: jasmine.SpyObj<ClientProfileService>;
  let routines: jasmine.SpyObj<RoutineService>;
  let dialog: jasmine.SpyObj<DialogService>;

  async function setup(routeData: Record<string, unknown> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [WeeklyPlansPage],
      providers: [
        { provide: TrainingPlanService, useValue: plans },
        { provide: ClientProfileService, useValue: profiles },
        { provide: RoutineService, useValue: routines },
        { provide: DialogService, useValue: dialog },
        provideRouter([]),
        // after provideRouter so this stub wins as the injected ActivatedRoute
        { provide: ActivatedRoute, useValue: { snapshot: { data: routeData } } },
        ...provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyPlansPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    profiles = jasmine.createSpyObj('ClientProfileService', ['getMyClients', 'getMyProfile']);
    routines = jasmine.createSpyObj('RoutineService', ['list']);
    dialog = jasmine.createSpyObj('DialogService', ['confirm']);
    plans = jasmine.createSpyObj('TrainingPlanService', [
      'getClientPlans', 'getById', 'getClientActivePlan', 'create',
      'rename', 'activate', 'archive', 'assignDay', 'clearDay',
    ]);

    profiles.getMyClients.and.returnValue(of([
      { clientProfileId: 'cp1', clientUserId: 'u1', email: 'a@b.c', firstName: 'Ana', lastName: 'R', clientProfileCreatedAtUtc: '', lastMeasureRecordedAtUtc: null, lastWeight: null },
    ]));
    profiles.getMyProfile.and.returnValue(of(
      { id: 'coach-self-1', userId: 'u9', status: 1, createdAt: '', measures: [] },
    ));
    routines.list.and.returnValue(of(publishedRoutines));
    plans.getClientPlans.and.returnValue(of([]));
    plans.getById.and.returnValue(of(planWithMonday));
    plans.create.and.returnValue(of({ id: 'tp1' }));
    plans.assignDay.and.returnValue(of(undefined));
    plans.clearDay.and.returnValue(of(undefined));
    plans.activate.and.returnValue(of(undefined));
    plans.archive.and.returnValue(of(undefined));
    plans.rename.and.returnValue(of(undefined));
  });

  it('loads clients and only the Published routines', async () => {
    await setup();
    expect(component).toBeTruthy();
    expect(profiles.getMyClients).toHaveBeenCalled();
    expect(routines.list).toHaveBeenCalledWith(RoutineStatus.Published);
    expect(component.selfMode()).toBeFalse();
    expect(profiles.getMyProfile).not.toHaveBeenCalled();
  });

  describe('self mode (Coach editing their own CoachSelf plan)', () => {
    it('resolves the client from GET /api/client-profiles/me and skips the client picker', async () => {
      await setup({ selfMode: true });

      expect(component.selfMode()).toBeTrue();
      expect(profiles.getMyProfile).toHaveBeenCalled();
      expect(profiles.getMyClients).not.toHaveBeenCalled();
      expect(component.selectedClientId()).toBe('coach-self-1');
      // onClientChange() ran -> that profile's plans were loaded
      expect(plans.getClientPlans).toHaveBeenCalledWith('coach-self-1');
      // picker hidden
      expect((fixture.nativeElement as HTMLElement).querySelector('#wp-client')).toBeNull();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Mi plan');
    });

    it('surfaces a profile-load failure', async () => {
      profiles.getMyProfile.and.returnValue(throwError(() => ({ detail: 'sin perfil' })));
      await setup({ selfMode: true });

      expect(component.selfError()).toBe('sin perfil');
      expect(plans.getClientPlans).not.toHaveBeenCalled();
    });

    it('creates and assigns days exactly like staff mode, against the coach\'s own profile id', async () => {
      await setup({ selfMode: true });
      component.selectPlan('tp1');
      component.changeDayRoutine(2, 'r2');
      expect(plans.assignDay).toHaveBeenCalledWith('tp1', 2, { workoutRoutineId: 'r2', notes: null });
    });
  });

  it('flags "no published routines" (not an error) when the routine list is empty', async () => {
    routines.list.and.returnValue(of([]));
    await setup();

    expect(component.routinesLoaded()).toBeTrue();
    expect(component.routinesError()).toBeNull();
    expect(component.hasNoPublishedRoutines()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('No hay rutinas publicadas para asignar');
  });

  it('surfaces a routine-list load failure instead of swallowing it', async () => {
    routines.list.and.returnValue(throwError(() => ({ detail: 'catálogo caído' })));
    await setup();

    expect(component.routinesLoaded()).toBeTrue();
    expect(component.routinesError()).toBe('catálogo caído');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('catálogo caído');
  });

  it('loads that client\'s plans when a client is chosen', async () => {
    await setup();
    component.selectedClientId.set('cp1');
    component.onClientChange();
    expect(plans.getClientPlans).toHaveBeenCalledWith('cp1');
  });

  it('shows the backend error when loading plans fails', async () => {
    await setup();
    plans.getClientPlans.and.returnValue(throwError(() => ({ detail: 'nope' })));
    component.selectedClientId.set('cp1');
    component.onClientChange();
    expect(component.plansError()).toBe('nope');
  });

  it('creates a plan (name only) and opens it', async () => {
    await setup();
    component.selectedClientId.set('cp1');
    component.newPlanName = '  Bloque 1  ';
    component.createPlan();
    expect(plans.create).toHaveBeenCalledWith('cp1', 'Bloque 1');
    expect(plans.getById).toHaveBeenCalledWith('tp1');
  });

  it('rejects a too-short plan name', async () => {
    await setup();
    component.selectedClientId.set('cp1');
    component.newPlanName = 'x';
    component.createPlan();
    expect(component.createError()).toBeTruthy();
    expect(plans.create).not.toHaveBeenCalled();
  });

  describe('week grid', () => {
    beforeEach(async () => {
      await setup();
      component.selectPlan('tp1');
    });

    it('renders 7 rows, Monday-first, mapping assigned days onto the wire day int', () => {
      const rows = component.weekRows();
      expect(rows.map((r) => r.day)).toEqual([1, 2, 3, 4, 5, 6, 0]);
      expect(rows[0].label).toBe('Lunes');
      expect(rows[0].assigned?.workoutRoutineId).toBe('r1');
      // every other day is a rest day
      expect(rows.slice(1).every((r) => r.assigned === null)).toBeTrue();
    });

    it('assigning a routine to a rest day PUTs that one day and reloads', () => {
      plans.getById.calls.reset();
      component.changeDayRoutine(3, 'r2'); // Wednesday, was rest
      expect(plans.assignDay).toHaveBeenCalledWith('tp1', 3, { workoutRoutineId: 'r2', notes: null });
      expect(plans.getById).toHaveBeenCalledWith('tp1');
      expect(component.savingDay()).toBeNull();
    });

    it('changing an already-assigned day keeps its existing note', () => {
      component.changeDayRoutine(1, 'r2'); // Monday had r1 + note "técnica"
      expect(plans.assignDay).toHaveBeenCalledWith('tp1', 1, { workoutRoutineId: 'r2', notes: 'técnica' });
    });

    it('selecting "Descanso" on an assigned day DELETEs the day', () => {
      component.changeDayRoutine(1, '');
      expect(plans.clearDay).toHaveBeenCalledWith('tp1', 1);
      expect(plans.assignDay).not.toHaveBeenCalled();
    });

    it('is a no-op when the day\'s routine did not actually change', () => {
      component.changeDayRoutine(1, 'r1'); // already r1
      expect(plans.assignDay).not.toHaveBeenCalled();
      expect(plans.clearDay).not.toHaveBeenCalled();
    });

    it('surfaces a per-day save error and clears the saving flag', () => {
      plans.assignDay.and.returnValue(throwError(() => ({ detail: 'rutina no publicada' })));
      component.changeDayRoutine(2, 'r1');
      expect(component.planError()).toBe('rutina no publicada');
      expect(component.savingDay()).toBeNull();
    });

    it('saveDayNotes persists the note against the day\'s current routine', () => {
      component.saveDayNotes(1, '  pausa larga  ');
      expect(plans.assignDay).toHaveBeenCalledWith('tp1', 1, { workoutRoutineId: 'r1', notes: 'pausa larga' });
    });

    it('saveDayNotes is a no-op on a rest day and when the note is unchanged', () => {
      component.saveDayNotes(4, 'algo'); // Thursday = rest
      component.saveDayNotes(1, 'técnica'); // unchanged
      expect(plans.assignDay).not.toHaveBeenCalled();
    });
  });

  describe('plan lifecycle', () => {
    beforeEach(async () => {
      await setup();
      component.selectPlan('tp1');
    });

    it('activate() calls the service and reloads', () => {
      plans.getById.calls.reset();
      component.activatePlan();
      expect(plans.activate).toHaveBeenCalledWith('tp1');
      expect(plans.getById).toHaveBeenCalledWith('tp1');
    });

    it('archive() confirms first, then archives and closes the panel', async () => {
      dialog.confirm.and.resolveTo(true);
      await component.archivePlan();
      expect(dialog.confirm).toHaveBeenCalled();
      expect(plans.archive).toHaveBeenCalledWith('tp1');
      expect(component.selectedPlan()).toBeNull();
    });

    it('archive() does nothing when the confirm is dismissed', async () => {
      dialog.confirm.and.resolveTo(false);
      await component.archivePlan();
      expect(plans.archive).not.toHaveBeenCalled();
    });

    it('rename() sends the trimmed name', () => {
      component.startRename();
      component.renameValue = '  Bloque 2  ';
      component.confirmRename();
      expect(plans.rename).toHaveBeenCalledWith('tp1', 'Bloque 2');
    });
  });
});
