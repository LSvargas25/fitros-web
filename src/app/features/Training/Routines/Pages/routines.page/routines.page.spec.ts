import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RoutinesPage } from './routines.page';
import { RoutineService } from '../../services/routine.service';
import { RoutineListItem, RoutineStatus } from '../../models/routine.models';
import { provideTestIcons } from '../../../../../../testing/test-icons';

const mockRoutines: RoutineListItem[] = [
  { id: 'r1', name: 'Full body', version: 1, status: 'Draft' },
  { id: 'r2', name: 'Push Pull Legs', version: 2, status: 'Published' },
];

describe('RoutinesPage', () => {
  let component: RoutinesPage;
  let fixture: ComponentFixture<RoutinesPage>;
  let routineService: jasmine.SpyObj<RoutineService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('RoutineService', [
      'list',
      'getById',
      'create',
      'update',
      'publish',
      'archive',
    ]);
    spy.list.and.returnValue(of(mockRoutines));

    await TestBed.configureTestingModule({
      imports: [RoutinesPage],
      providers: [
        { provide: RoutineService, useValue: spy },
        provideRouter([]),
        ...provideTestIcons(),
      ],
    }).compileComponents();

    routineService = TestBed.inject(RoutineService) as jasmine.SpyObj<RoutineService>;
    fixture = TestBed.createComponent(RoutinesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads routines on init', () => {
    expect(routineService.list).toHaveBeenCalledWith(undefined);
    expect(component.routines()).toEqual(mockRoutines);
    expect(component.isLoading()).toBeFalse();
  });

  it('passes the status filter to the service', () => {
    component.statusFilter = RoutineStatus.Published;
    component.onStatusFilterChange();
    expect(routineService.list).toHaveBeenCalledWith(RoutineStatus.Published);
  });

  it('filters visible rows by name', () => {
    component.search = 'push';
    expect(component.filteredRoutines()).toEqual([mockRoutines[1]]);
  });

  it('recognises draft vs archived from the string status', () => {
    expect(component.isDraft('Draft')).toBeTrue();
    expect(component.isArchived('Archived')).toBeTrue();
    expect(component.isDraft('Published')).toBeFalse();
  });

  it('requires a name of at least 3 chars before saving', () => {
    component.openCreate();
    component.formName = 'ab';
    component.save();
    expect(component.formError()).toBeTruthy();
    expect(routineService.create).not.toHaveBeenCalled();
  });

  it('creates a routine and reloads', () => {
    routineService.create.and.returnValue(of({ id: 'r3', name: 'Nueva', version: 1 }));
    component.openCreate();
    component.formName = ' Nueva rutina ';
    component.formDescription = ' 3 dias ';
    component.save();

    expect(routineService.create).toHaveBeenCalledWith({ name: 'Nueva rutina', description: '3 dias' });
    expect(component.showForm()).toBeFalse();
    expect(routineService.list).toHaveBeenCalledTimes(2);
  });

  it('publishes a routine after confirmation and reloads', async () => {
    routineService.publish.and.returnValue(of(undefined));
    spyOn(component['dialog'], 'confirm').and.resolveTo(true);

    await component.publish(mockRoutines[0]);

    expect(routineService.publish).toHaveBeenCalledWith('r1');
    expect(routineService.list).toHaveBeenCalledTimes(2);
  });

  it('does nothing when archive confirmation is declined', async () => {
    spyOn(component['dialog'], 'confirm').and.resolveTo(false);
    await component.archive(mockRoutines[1]);
    expect(routineService.archive).not.toHaveBeenCalled();
  });

  it('shows the backend error detail when a row action fails', async () => {
    routineService.publish.and.returnValue(throwError(() => ({ detail: 'Ya está publicada', status: 400 })));
    spyOn(component['dialog'], 'confirm').and.resolveTo(true);

    await component.publish(mockRoutines[0]);

    expect(component.actionError()).toBe('Ya está publicada');
    expect(component.busyId()).toBeNull();
  });
});
