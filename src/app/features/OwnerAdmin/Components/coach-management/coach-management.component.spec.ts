import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CoachManagementComponent } from './coach-management.component';
import { UserService, CoachUser } from '../../services/user.service';
import { GymService } from '../../services/gym.service';
import { DialogService } from '../../../../core/Dialog/dialog.service';
import { of, throwError } from 'rxjs';

const mockCoaches: CoachUser[] = [
  { id: 'c1', email: 'coach@gym.com', firstName: 'Ana', lastName: 'Mora', gymId: null, gymName: null, status: 'Active' },
];

describe('CoachManagementComponent', () => {
  let fixture: ComponentFixture<CoachManagementComponent>;
  let component: CoachManagementComponent;
  let userService: jasmine.SpyObj<UserService>;
  let gymService: jasmine.SpyObj<GymService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    const userSpy = jasmine.createSpyObj('UserService', [
      'getCoaches', 'createCoach',
      'activateCoach', 'deactivateCoach', 'deleteCoach',
    ]);
    const gymSpy    = jasmine.createSpyObj('GymService', ['getAll', 'assignCoach']);
    const dialogSpy = jasmine.createSpyObj('DialogService', ['confirm']);

    userSpy.getCoaches.and.returnValue(of(mockCoaches));
    gymSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CoachManagementComponent],
      providers: [
        { provide: UserService,   useValue: userSpy },
        { provide: GymService,    useValue: gymSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    }).compileComponents();

    userService   = TestBed.inject(UserService)   as jasmine.SpyObj<UserService>;
    gymService    = TestBed.inject(GymService)    as jasmine.SpyObj<GymService>;
    dialogService = TestBed.inject(DialogService) as jasmine.SpyObj<DialogService>;

    fixture   = TestBed.createComponent(CoachManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads coaches on init', () => {
    expect(userService.getCoaches).toHaveBeenCalled();
    expect(component.coaches()).toEqual(mockCoaches);
    expect(component.isLoading()).toBeFalse();
  });

  it('shows error message when load fails', () => {
    userService.getCoaches.and.returnValue(throwError(() => ({ detail: 'Server error', status: 500 })));
    component['loadData']();
    expect(component.error()).toBe('Failed to load coaches.');
  });

  it('createCoach() — happy path reloads data', () => {
    userService.createCoach.and.returnValue(of(undefined));

    component.newFirstName = 'New';
    component.newLastName  = 'Coach';
    component.newEmail     = 'new@coach.com';
    component.newPassword  = 'pass1234';
    component.createCoach();

    expect(userService.createCoach).toHaveBeenCalled();
    expect(component.showCreateForm()).toBeFalse();
  });

  it('createCoach() — shows error when fields empty', () => {
    component.createCoach();
    expect(component.createError()).toBe('All fields are required.');
    expect(userService.createCoach).not.toHaveBeenCalled();
  });

  it('createCoach() — shows backend error detail on failure', () => {
    userService.createCoach.and.returnValue(throwError(() => ({ detail: 'Email already in use', status: 400 })));

    component.newFirstName = 'New';
    component.newLastName  = 'Coach';
    component.newEmail     = 'dup@coach.com';
    component.newPassword  = 'pass1234';
    component.createCoach();

    expect(component.createError()).toBe('Email already in use');
  });

  it('confirmAssign() — calls gymService.assignCoach and shows success', () => {
    gymService.assignCoach.and.returnValue(of(undefined));
    component.assigningCoachId.set('c1');
    component.assignGymValue = 'g1';
    component.confirmAssign('c1');

    expect(gymService.assignCoach).toHaveBeenCalledWith('g1', 'c1');
    expect(component.assigningCoachId()).toBeNull();
    expect(component.assignSuccess()).toBe('Gym assigned successfully.');
  });

  it('confirmAssign() — shows error on failure', () => {
    gymService.assignCoach.and.returnValue(throwError(() => ({ detail: 'Gym not found', status: 404 })));
    component.assigningCoachId.set('c1');
    component.assignGymValue = 'g1';
    component.confirmAssign('c1');

    expect(component.assignError()).toBe('Gym not found');
  });

  it('toggleActive() — calls deactivateCoach for active coach after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.deactivateCoach.and.returnValue(of(undefined));

    component.toggleActive(mockCoaches[0]);
    tick();

    expect(userService.deactivateCoach).toHaveBeenCalledWith('c1');
  }));

  it('toggleActive() — calls activateCoach for inactive coach after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.activateCoach.and.returnValue(of(undefined));
    const inactive: CoachUser = { ...mockCoaches[0], status: 'Inactive' };

    component.toggleActive(inactive);
    tick();

    expect(userService.activateCoach).toHaveBeenCalledWith('c1');
  }));

  it('toggleActive() — does nothing when user cancels confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(false));

    component.toggleActive(mockCoaches[0]);
    tick();

    expect(userService.deactivateCoach).not.toHaveBeenCalled();
  }));

  it('hardDelete() — calls deleteCoach after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.deleteCoach.and.returnValue(of(undefined));

    component.hardDelete(mockCoaches[0]);
    tick();

    expect(userService.deleteCoach).toHaveBeenCalledWith('c1');
  }));

  it('hardDelete() — does nothing when user cancels confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(false));

    component.hardDelete(mockCoaches[0]);
    tick();

    expect(userService.deleteCoach).not.toHaveBeenCalled();
  }));
});
