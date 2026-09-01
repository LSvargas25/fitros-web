import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MyTrainingPage } from './my-training-page';
import { WorkoutSessionService } from '../../../services/workout-session.service';
import { WorkoutSessionDetails, WorkoutSessionStatus } from '../../../models/workout-session.models';
import { SessionFacade, AppRole } from '../../../../../core/auth/session-facade';
import { provideTestIcons } from '../../../../../../testing/test-icons';

const session: WorkoutSessionDetails = {
  id: 's1',
  routineId: 'r1',
  routineNameSnapshot: 'Full body',
  routineVersion: 1,
  scheduledDate: '2026-08-28',
  status: WorkoutSessionStatus.InProgress,
  sets: [],
  suggestedExercises: [
    { exerciseId: 'ex1', order: 1, suggestedSets: 3, suggestedReps: 10, suggestedRestSeconds: 60 },
  ],
};

describe('MyTrainingPage', () => {
  let component: MyTrainingPage;
  let fixture: ComponentFixture<MyTrainingPage>;
  let sessions: jasmine.SpyObj<WorkoutSessionService>;
  let role: AppRole;

  async function build(): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MyTrainingPage],
      providers: [
        { provide: WorkoutSessionService, useValue: sessions },
        { provide: SessionFacade, useValue: { role } },
        provideRouter([]),
        ...provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyTrainingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    role = 'Client';
    sessions = jasmine.createSpyObj('WorkoutSessionService', [
      'startToday', 'getById', 'getHistory', 'addSet', 'complete', 'skip',
      'getExercises', 'getMyAssignedRoutines',
    ]);
    sessions.startToday.and.returnValue(of(session));
    sessions.getExercises.and.returnValue(of([{ id: 'ex1', name: 'Sentadilla', category: 1 }]));
    sessions.getMyAssignedRoutines.and.returnValue(of([]));

    await build();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the "edit my weekly plan" link only for a Coach', async () => {
    // default build ran as Client
    expect(component.isCoach).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/my/training/plan"]')).toBeNull();

    role = 'Coach';
    await build();
    expect(component.isCoach).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/my/training/plan"]')).not.toBeNull();
  });

  it('loads the exercise catalogue and today’s session on init', () => {
    expect(sessions.getExercises).toHaveBeenCalled();
    expect(sessions.startToday).toHaveBeenCalled();
    expect(component.session()).toEqual(session);
    expect(component.exerciseName('ex1')).toBe('Sentadilla');
    expect(component.isLoading()).toBeFalse();
  });

  it('degrades gracefully when the exercise-catalogue read is forbidden (403)', () => {
    sessions.getExercises.and.returnValue(throwError(() => ({ status: 403, detail: 'Forbidden' })));
    expect(() => component['loadExerciseNames']()).not.toThrow();

    // no crash, no page-level error; unknown exercises just fall back to their id
    expect(component.error()).toBeNull();
    expect(component.exerciseName('unmapped-id')).toBe('unmapped-id');
  });

  it('shows the routine picker (sourced from the client’s own plan) when there is no session today', () => {
    sessions.startToday.and.returnValue(throwError(() => ({ status: 404 })));
    sessions.getMyAssignedRoutines.and.returnValue(of([{ id: 'r1', name: 'Piernas' }]));
    component.loadToday();

    expect(component.needsRoutinePicker()).toBeTrue();
    expect(sessions.getMyAssignedRoutines).toHaveBeenCalled();
    expect(component.routines()).toEqual([{ id: 'r1', name: 'Piernas' }]);
    expect(component.error()).toBeNull();
  });

  it('leaves the picker empty (no error) when the client has no active plan / the read fails', () => {
    sessions.startToday.and.returnValue(throwError(() => ({ status: 404 })));
    sessions.getMyAssignedRoutines.and.returnValue(throwError(() => ({ status: 500 })));
    component.loadToday();

    expect(component.routines()).toEqual([]);
    expect(component.error()).toBeNull();
  });

  it('surfaces a non-404 error from startToday', () => {
    sessions.startToday.and.returnValue(throwError(() => ({ status: 500, detail: 'boom' })));
    component.loadToday();
    expect(component.error()).toBe('boom');
  });

  it('confirming the routine pick re-runs start-today with the chosen routine', () => {
    sessions.startToday.and.returnValue(throwError(() => ({ status: 404 })));
    sessions.getMyAssignedRoutines.and.returnValue(of([{ id: 'r7', name: 'Piernas' }]));
    component.loadToday();

    component.selectedRoutineId.set('r7');
    sessions.startToday.calls.reset();
    sessions.startToday.and.returnValue(of(session));
    component.confirmRoutinePick();

    expect(sessions.startToday).toHaveBeenCalledWith('r7');
  });

  it('addSet() writes only to the client’s own session', () => {
    sessions.addSet.and.returnValue(of(undefined));
    sessions.getById.and.returnValue(of(session));
    component.draftReps['ex1'] = 8;
    component.draftWeight['ex1'] = 40;

    component.addSet('ex1');

    expect(sessions.addSet).toHaveBeenCalledWith('s1', {
      exerciseId: 'ex1', setNumber: 1, repsAchieved: 8, weightUsed: 40,
    });
  });
});
