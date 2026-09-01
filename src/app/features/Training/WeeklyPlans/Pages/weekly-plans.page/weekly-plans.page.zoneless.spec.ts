/**
 * Production runs WITHOUT zone.js (angular.json `build` has no polyfills; only
 * `build:test` adds zone.js). The zone.js-backed specs therefore hide any bug
 * where change detection is only reached by a plain-property mutation inside an
 * async callback. These specs reproduce the production model with
 * `provideZonelessChangeDetection()` and a real (deferred) `getMyProfile`.
 *
 * Regression (2026-08-31): WeeklyPlansPage in `selfMode` rendered only its
 * header — the plan selector / "Nuevo plan" box / 7-day grid never appeared, and
 * the console showed NG0100 ExpressionChangedAfterItHasBeenCheckedError at
 * `@if (selectedClientId)` (template line 62). Root cause: `selectedClientId`
 * was a plain field feeding a structural `@if`; in selfMode it is set from an
 * async `getMyProfile()` callback, invisible to the zoneless change detector and
 * able to flip the `@if` condition mid-cycle. Fix: make it a signal.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';

import { WeeklyPlansPage } from './weekly-plans.page';
import { DialogService } from '../../../../../core/Dialog/dialog.service';
import { ClientProfileService, ClientProfileDetail } from '../../../../Progress/services/client-profile.service';
import { RoutineService } from '../../../Routines/services/routine.service';
import { TrainingPlanService } from '../../services/training-plan.service';
import { TrainingPlanStatus, WeeklyTrainingPlanDetail } from '../../models/training-plan.models';
import { provideTestIcons } from '../../../../../../testing/test-icons';

const coachProfile: ClientProfileDetail = {
  id: 'coach-self-1', userId: 'u9', status: 1, createdAt: '', measures: [],
};

const draftPlan: WeeklyTrainingPlanDetail = {
  id: 'tp1', clientProfileId: 'coach-self-1', coachId: 'c9', name: 'Mi bloque',
  status: TrainingPlanStatus.Draft, createdAt: '', days: [],
};

describe('WeeklyPlansPage — zoneless (production change-detection model)', () => {
  let fixture: ComponentFixture<WeeklyPlansPage>;
  let component: WeeklyPlansPage;
  let profiles: jasmine.SpyObj<ClientProfileService>;
  let plans: jasmine.SpyObj<TrainingPlanService>;
  let routines: jasmine.SpyObj<RoutineService>;
  let profile$: Subject<ClientProfileDetail>;

  beforeEach(async () => {
    profile$ = new Subject<ClientProfileDetail>();

    profiles = jasmine.createSpyObj('ClientProfileService', ['getMyProfile', 'getMyClients']);
    profiles.getMyProfile.and.returnValue(profile$.asObservable());

    plans = jasmine.createSpyObj('TrainingPlanService', [
      'getClientPlans', 'getById', 'getClientActivePlan', 'create',
      'rename', 'activate', 'archive', 'assignDay', 'clearDay',
    ]);
    plans.getClientPlans.and.returnValue(of([]));
    plans.create.and.returnValue(of({ id: 'tp1' }));
    plans.getById.and.returnValue(of(draftPlan));
    plans.assignDay.and.returnValue(of(undefined));
    plans.activate.and.returnValue(of(undefined));

    routines = jasmine.createSpyObj('RoutineService', ['list']);
    routines.list.and.returnValue(of([
      { id: 'r1', name: 'Empuje', version: 1, status: 'Published' },
      { id: 'r2', name: 'Tirón', version: 1, status: 'Published' },
    ]));

    await TestBed.configureTestingModule({
      imports: [WeeklyPlansPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ClientProfileService, useValue: profiles },
        { provide: TrainingPlanService, useValue: plans },
        { provide: RoutineService, useValue: routines },
        { provide: DialogService, useValue: jasmine.createSpyObj('DialogService', ['confirm']) },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { selfMode: true } } } },
        ...provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyPlansPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function html(): string {
    return (fixture.nativeElement as HTMLElement).innerHTML;
  }
  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('before the profile resolves: only the header (baseline)', () => {
    expect(text()).toContain('Mi plan semanal');
    expect(text()).not.toContain('Nuevo plan');
  });

  it('after getMyProfile() resolves: the plan editor actually renders (no NG0100, no blank page)', async () => {
    let thrown: unknown = null;
    try {
      profile$.next(coachProfile);
      profile$.complete();
      await settle();
    } catch (e) {
      thrown = e;
    }

    expect(thrown).withContext('NG0100 while rendering self mode').toBeNull();
    expect(component.selectedClientId()).toBe('coach-self-1');
    // the @if (selectedClientId()) block is in the rendered DOM
    expect(text()).withContext('"Nuevo plan" create box rendered').toContain('Nuevo plan');
    expect((fixture.nativeElement as HTMLElement).querySelector('#wp-new-plan')).not.toBeNull();
    expect(text()).toContain('Este cliente aún no tiene planes semanales');
  });

  it('full self-mode cycle: create a plan → assign a Published routine to a day → activate (real DOM)', async () => {
    profile$.next(coachProfile);
    profile$.complete();
    await settle();

    // create
    component.newPlanName = 'Mi bloque';
    component.createPlan();
    await settle();
    expect(plans.create).toHaveBeenCalledWith('coach-self-1', 'Mi bloque');
    expect(component.selectedPlan()?.id).toBe('tp1');
    // the 7-day grid is now in the DOM
    const dayRows = (fixture.nativeElement as HTMLElement).querySelectorAll('[id^="wp-day-"]');
    expect(dayRows.length).withContext('7 day selects rendered').toBe(7);
    expect(text()).toContain('Lunes');
    expect(text()).toContain('Domingo');

    // assign a Published routine to Monday (day 1)
    plans.getById.and.returnValue(of({
      ...draftPlan,
      days: [{ id: 'd1', day: 1, workoutRoutineId: 'r1', workoutRoutineName: 'Empuje', notes: null }],
    }));
    component.changeDayRoutine(1, 'r1');
    await settle();
    expect(plans.assignDay).toHaveBeenCalledWith('tp1', 1, { workoutRoutineId: 'r1', notes: null });
    expect(text()).withContext('assigned routine name shown / options present').toContain('Empuje');

    // activate
    plans.getById.and.returnValue(of({
      ...draftPlan,
      status: TrainingPlanStatus.Active,
      days: [{ id: 'd1', day: 1, workoutRoutineId: 'r1', workoutRoutineName: 'Empuje', notes: null }],
    }));
    component.activatePlan();
    await settle();
    expect(plans.activate).toHaveBeenCalledWith('tp1');
    expect(component.selectedPlan()?.status).toBe(TrainingPlanStatus.Active);
    expect(html()).not.toContain('NG0100');
  });
});
