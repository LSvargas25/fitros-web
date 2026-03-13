import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdminManagementComponent } from './admin-management.component';
import { UserService, AdminUser } from '../../services/user.service';
import { GymService } from '../../services/gym.service';
import { DialogService } from '../../../../Core/Dialog/dialog.service';
import { of, throwError } from 'rxjs';

const mockAdmins: AdminUser[] = [
  { id: 'a1', email: 'admin@gym.com', firstName: 'Carlos', lastName: 'Vega', gymId: null, gymName: null, status: 'Active' },
];

describe('AdminManagementComponent', () => {
  let fixture: ComponentFixture<AdminManagementComponent>;
  let component: AdminManagementComponent;
  let userService: jasmine.SpyObj<UserService>;
  let gymService: jasmine.SpyObj<GymService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    const userSpy = jasmine.createSpyObj('UserService', [
      'getAdmins', 'createAdmin',
      'activateAdmin', 'deactivateAdmin', 'deleteAdmin',
    ]);
    const gymSpy    = jasmine.createSpyObj('GymService', ['getAll', 'assignAdmin']);
    const dialogSpy = jasmine.createSpyObj('DialogService', ['confirm']);

    userSpy.getAdmins.and.returnValue(of(mockAdmins));
    gymSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AdminManagementComponent],
      providers: [
        { provide: UserService,   useValue: userSpy },
        { provide: GymService,    useValue: gymSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    }).compileComponents();

    userService   = TestBed.inject(UserService)   as jasmine.SpyObj<UserService>;
    gymService    = TestBed.inject(GymService)    as jasmine.SpyObj<GymService>;
    dialogService = TestBed.inject(DialogService) as jasmine.SpyObj<DialogService>;

    fixture   = TestBed.createComponent(AdminManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads admins on init', () => {
    expect(userService.getAdmins).toHaveBeenCalled();
    expect(component.admins()).toEqual(mockAdmins);
    expect(component.isLoading()).toBeFalse();
  });

  it('shows error message when load fails', () => {
    userService.getAdmins.and.returnValue(throwError(() => ({ detail: 'Server error', status: 500 })));
    component['loadData']();
    expect(component.error()).toBe('Failed to load admins.');
  });

  it('createAdmin() — happy path reloads data', () => {
    userService.createAdmin.and.returnValue(of(mockAdmins[0]));

    component.newFirstName = 'New';
    component.newLastName  = 'Admin';
    component.newEmail     = 'new@admin.com';
    component.newPassword  = 'pass1234';
    component.createAdmin();

    expect(userService.createAdmin).toHaveBeenCalled();
    expect(component.showCreateForm()).toBeFalse();
  });

  it('createAdmin() — shows error when fields empty', () => {
    component.createAdmin();
    expect(component.createError()).toBe('All fields are required.');
    expect(userService.createAdmin).not.toHaveBeenCalled();
  });

  it('createAdmin() — shows backend error detail on failure', () => {
    userService.createAdmin.and.returnValue(throwError(() => ({ detail: 'Email already in use', status: 400 })));

    component.newFirstName = 'New';
    component.newLastName  = 'Admin';
    component.newEmail     = 'dup@admin.com';
    component.newPassword  = 'pass1234';
    component.createAdmin();

    expect(component.createError()).toBe('Email already in use');
  });

  it('confirmAssign() — calls gymService.assignAdmin and reloads', () => {
    gymService.assignAdmin.and.returnValue(of(undefined));
    component.assigningAdminId.set('a1');
    component.assignGymValue = 'g1';
    component.confirmAssign('a1');

    expect(gymService.assignAdmin).toHaveBeenCalledWith('g1', 'a1');
    expect(component.assigningAdminId()).toBeNull();
    expect(component.assignSuccess()).toBe('Gym assigned successfully.');
  });

  it('confirmAssign() — shows error on failure', () => {
    gymService.assignAdmin.and.returnValue(throwError(() => ({ detail: 'Gym not found', status: 404 })));
    component.assigningAdminId.set('a1');
    component.assignGymValue = 'g1';
    component.confirmAssign('a1');

    expect(component.assignError()).toBe('Gym not found');
  });

  it('toggleActive() — calls deactivateAdmin for active admin after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.deactivateAdmin.and.returnValue(of(undefined));

    component.toggleActive(mockAdmins[0]);
    tick();

    expect(userService.deactivateAdmin).toHaveBeenCalledWith('a1');
  }));

  it('toggleActive() — calls activateAdmin for inactive admin after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.activateAdmin.and.returnValue(of(undefined));
    const inactive: AdminUser = { ...mockAdmins[0], status: 'Inactive' };

    component.toggleActive(inactive);
    tick();

    expect(userService.activateAdmin).toHaveBeenCalledWith('a1');
  }));

  it('toggleActive() — does nothing when user cancels confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(false));

    component.toggleActive(mockAdmins[0]);
    tick();

    expect(userService.deactivateAdmin).not.toHaveBeenCalled();
  }));

  it('hardDelete() — calls deleteAdmin after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.deleteAdmin.and.returnValue(of(undefined));

    component.hardDelete(mockAdmins[0]);
    tick();

    expect(userService.deleteAdmin).toHaveBeenCalledWith('a1');
  }));

  it('hardDelete() — does nothing when user cancels confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(false));

    component.hardDelete(mockAdmins[0]);
    tick();

    expect(userService.deleteAdmin).not.toHaveBeenCalled();
  }));
});
