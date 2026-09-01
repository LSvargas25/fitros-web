import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ExercisesPage } from './exercises.page';
import { ExerciseService } from '../../services/exercise.service';
import { ExerciseListItem, MuscleGroup } from '../../models/exercise.models';

const mockExercises: ExerciseListItem[] = [
  { id: 'e1', name: 'Press de banca', category: MuscleGroup.Chest },
  { id: 'e2', name: 'Sentadilla', category: MuscleGroup.Legs },
];

describe('ExercisesPage', () => {
  let component: ExercisesPage;
  let fixture: ComponentFixture<ExercisesPage>;
  let exerciseService: jasmine.SpyObj<ExerciseService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ExerciseService', [
      'list',
      'getById',
      'create',
      'update',
      'archive',
    ]);
    spy.list.and.returnValue(of(mockExercises));

    await TestBed.configureTestingModule({
      imports: [ExercisesPage],
      providers: [{ provide: ExerciseService, useValue: spy }],
    }).compileComponents();

    exerciseService = TestBed.inject(ExerciseService) as jasmine.SpyObj<ExerciseService>;

    fixture = TestBed.createComponent(ExercisesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the catalogue on init', () => {
    expect(exerciseService.list).toHaveBeenCalledWith(undefined);
    expect(component.exercises()).toEqual(mockExercises);
    expect(component.isLoading()).toBeFalse();
  });

  it('passes the selected muscle group to the service when filtering', () => {
    component.categoryFilter = MuscleGroup.Legs;
    component.onCategoryFilterChange();
    expect(exerciseService.list).toHaveBeenCalledWith(MuscleGroup.Legs);
  });

  it('filters the visible rows by name on the client', () => {
    component.search = 'sentad';
    expect(component.filteredExercises()).toEqual([mockExercises[1]]);
  });

  it('surfaces the backend error detail when the list fails', () => {
    exerciseService.list.and.returnValue(throwError(() => ({ detail: 'Sin permisos', status: 403 })));
    component.load();
    expect(component.error()).toBe('Sin permisos');
    expect(component.isLoading()).toBeFalse();
  });

  it('requires a name and a category before saving', () => {
    component.openCreate();

    component.formName = '   ';
    component.save();
    expect(component.formError()).toBeTruthy();
    expect(exerciseService.create).not.toHaveBeenCalled();

    component.formName = 'Peso muerto';
    component.formCategory = '';
    component.save();
    expect(component.formError()).toBeTruthy();
    expect(exerciseService.create).not.toHaveBeenCalled();
  });

  it('creates an exercise and reloads on success', () => {
    exerciseService.create.and.returnValue(of({ id: 'e3' }));
    component.openCreate();
    component.formName = 'Peso muerto';
    component.formCategory = MuscleGroup.Back;
    component.formDescription = ' desde el suelo ';
    component.save();

    expect(exerciseService.create).toHaveBeenCalledWith({
      name: 'Peso muerto',
      description: 'desde el suelo',
      category: MuscleGroup.Back,
    });
    expect(component.showForm()).toBeFalse();
    expect(exerciseService.list).toHaveBeenCalledTimes(2);
  });

  it('sends the route id in the body when updating', () => {
    exerciseService.getById.and.returnValue(
      of({ id: 'e1', name: 'Press de banca', description: 'plano', category: MuscleGroup.Chest }),
    );
    exerciseService.update.and.returnValue(of(undefined));

    component.openEdit(mockExercises[0]);
    component.formName = 'Press inclinado';
    component.save();

    expect(exerciseService.update).toHaveBeenCalledWith({
      id: 'e1',
      name: 'Press inclinado',
      description: 'plano',
      category: MuscleGroup.Chest,
    });
  });

  it('drops an archived exercise from the table without refetching', async () => {
    exerciseService.archive.and.returnValue(of(undefined));
    spyOn(component['dialog'], 'confirm').and.resolveTo(true);

    await component.archive(mockExercises[0]);

    expect(exerciseService.archive).toHaveBeenCalledWith('e1');
    expect(component.exercises()).toEqual([mockExercises[1]]);
    expect(exerciseService.list).toHaveBeenCalledTimes(1);
  });
});
