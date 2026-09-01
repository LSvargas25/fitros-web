import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

import { RoutineDetailPage } from './routine-detail.page';
import { RoutineService } from '../../services/routine.service';
import { RoutineDetail, RoutineStatus, RoutineVersionListItem } from '../../models/routine.models';
import { ExerciseService } from '../../../Exercises/services/exercise.service';
import { MuscleGroup } from '../../../Exercises/models/exercise.models';

const versions: RoutineVersionListItem[] = [
  { id: 'r1', routineGroupId: 'g1', version: 1, status: RoutineStatus.Draft, createdAt: '2026-08-01T00:00:00Z' },
];

const detail: RoutineDetail = {
  id: 'r1', name: 'Full body', description: '', status: RoutineStatus.Draft, version: 1,
  exercises: [
    { exerciseId: 'e1', order: 1, suggestedSets: 3, suggestedReps: 10, suggestedRestSeconds: 60 },
    { exerciseId: 'e2', order: 2, suggestedSets: 4, suggestedReps: 8, suggestedRestSeconds: 90 },
  ],
};

describe('RoutineDetailPage', () => {
  let component: RoutineDetailPage;
  let fixture: ComponentFixture<RoutineDetailPage>;
  let routineService: jasmine.SpyObj<RoutineService>;
  let exerciseService: jasmine.SpyObj<ExerciseService>;

  let router: Router;

  beforeEach(async () => {
    routineService = jasmine.createSpyObj('RoutineService', [
      'getById', 'addExercise', 'removeExercise', 'moveExercise', 'getVersions', 'createVersion',
    ]);
    exerciseService = jasmine.createSpyObj('ExerciseService', ['list']);
    routineService.getById.and.returnValue(of(detail));
    routineService.getVersions.and.returnValue(of(versions));
    exerciseService.list.and.returnValue(of([
      { id: 'e1', name: 'Sentadilla', category: MuscleGroup.Legs },
      { id: 'e2', name: 'Press banca', category: MuscleGroup.Chest },
      { id: 'e3', name: 'Remo', category: MuscleGroup.Back },
    ]));

    await TestBed.configureTestingModule({
      imports: [RoutineDetailPage],
      providers: [
        { provide: RoutineService, useValue: routineService },
        { provide: ExerciseService, useValue: exerciseService },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'r1']]) } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RoutineDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the routine and the catalogue', () => {
    expect(routineService.getById).toHaveBeenCalledWith('r1');
    expect(component.routine()).toEqual(detail);
    expect(component.exercises().map((e) => e.order)).toEqual([1, 2]);
  });

  it('offers only catalogue exercises not already in the routine', () => {
    expect(component.availableToAdd().map((e) => e.id)).toEqual(['e3']);
  });

  it('resolves exercise names from the catalogue', () => {
    expect(component.exerciseName('e1')).toBe('Sentadilla');
  });

  it('validates the add form', () => {
    component.addExerciseId = '';
    component.addExercise();
    expect(component.addError()).toBeTruthy();
    expect(routineService.addExercise).not.toHaveBeenCalled();

    component.addExerciseId = 'e3';
    component.addSets = 0;
    component.addExercise();
    expect(component.addError()).toContain('al menos 1');
  });

  it('adds an exercise at the next order and reloads', () => {
    routineService.addExercise.and.returnValue(of(undefined));
    component.addExerciseId = 'e3';
    component.addSets = 3;
    component.addReps = 12;
    component.addRest = 45;
    component.addExercise();
    expect(routineService.addExercise).toHaveBeenCalledWith('r1', {
      exerciseId: 'e3', order: 3, suggestedSets: 3, suggestedReps: 12, suggestedRestSeconds: 45,
    });
    expect(routineService.getById).toHaveBeenCalledTimes(2);
  });

  it('moves an exercise up by decrementing its order', () => {
    routineService.moveExercise.and.returnValue(of(undefined));
    component.moveUp(detail.exercises[1]); // order 2 -> 1
    expect(routineService.moveExercise).toHaveBeenCalledWith('r1', 'e2', 1);
  });

  it('does not move the first exercise up', () => {
    component.moveUp(detail.exercises[0]);
    expect(routineService.moveExercise).not.toHaveBeenCalled();
  });

  it('removes an exercise after confirmation', async () => {
    routineService.removeExercise.and.returnValue(of(undefined));
    spyOn(component['dialog'], 'confirm').and.resolveTo(true);
    await component.remove(detail.exercises[0]);
    expect(routineService.removeExercise).toHaveBeenCalledWith('r1', 'e1');
  });

  it('surfaces the backend error on load failure', () => {
    routineService.getById.and.returnValue(throwError(() => ({ detail: 'nope' })));
    component.load();
    expect(component.error()).toBe('nope');
  });

  describe('versioning', () => {
    it('loads the routine group\'s versions on init', () => {
      expect(routineService.getVersions).toHaveBeenCalledWith('r1');
      expect(component.versions()).toEqual(versions);
    });

    it('surfaces a version-list load failure', () => {
      routineService.getVersions.and.returnValue(throwError(() => ({ detail: 'sin versiones' })));
      component['loadVersions']();
      expect(component.versionsError()).toBe('sin versiones');
    });

    it('offers "new version" only for a Published routine', () => {
      // default fixture routine is Draft
      expect(component.canCreateVersion()).toBeFalse();

      routineService.getById.and.returnValue(of({ ...detail, status: RoutineStatus.Published }));
      component.load();
      expect(component.canCreateVersion()).toBeTrue();
    });

    it('createVersion() forks a draft and navigates to it', () => {
      const nav = spyOn(router, 'navigate');
      routineService.getById.and.returnValue(of({ ...detail, status: RoutineStatus.Published }));
      component.load();
      routineService.createVersion.and.returnValue(
        of({ id: 'r2', routineGroupId: 'g1', version: 2, status: RoutineStatus.Draft }),
      );

      component.createVersion();

      expect(routineService.createVersion).toHaveBeenCalledWith('r1');
      expect(nav).toHaveBeenCalledWith(['/manage/training/routines', 'r2']);
    });

    it('createVersion() is a no-op for a Draft routine', () => {
      component.createVersion();
      expect(routineService.createVersion).not.toHaveBeenCalled();
    });

    it('createVersion() surfaces a backend error', () => {
      routineService.getById.and.returnValue(of({ ...detail, status: RoutineStatus.Published }));
      component.load();
      routineService.createVersion.and.returnValue(throwError(() => ({ detail: 'no se pudo forkear' })));
      component.createVersion();
      expect(component.createVersionError()).toBe('no se pudo forkear');
      expect(component.isCreatingVersion()).toBeFalse();
    });
  });
});
