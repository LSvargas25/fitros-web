import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ClientManagementComponent } from './client-management.component';
import { UserService, ClientListItem } from '../../services/user.service';
import { GymService } from '../../services/gym.service';
import { DialogService } from '../../../../core/Dialog/dialog.service';
import { of, throwError } from 'rxjs';

const mockClients: ClientListItem[] = [
  { id: 'cl1', email: 'client@gym.com', firstName: 'Luis', lastName: 'Fernández', status: 'Active', gymId: null, gymName: null },
];

describe('ClientManagementComponent', () => {
  let fixture: ComponentFixture<ClientManagementComponent>;
  let component: ClientManagementComponent;
  let userService: jasmine.SpyObj<UserService>;
  let gymService: jasmine.SpyObj<GymService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    const userSpy = jasmine.createSpyObj('UserService', [
      'getClients', 'createClient',
      'activateClient', 'deactivateClient', 'deleteClient',
    ]);
    const gymSpy    = jasmine.createSpyObj('GymService', ['getAll']);
    const dialogSpy = jasmine.createSpyObj('DialogService', ['confirm']);

    userSpy.getClients.and.returnValue(of(mockClients));
    gymSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ClientManagementComponent],
      providers: [
        { provide: UserService,   useValue: userSpy },
        { provide: GymService,    useValue: gymSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    }).compileComponents();

    userService   = TestBed.inject(UserService)   as jasmine.SpyObj<UserService>;
    gymService    = TestBed.inject(GymService)    as jasmine.SpyObj<GymService>;
    dialogService = TestBed.inject(DialogService) as jasmine.SpyObj<DialogService>;

    fixture   = TestBed.createComponent(ClientManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads clients on init', () => {
    expect(userService.getClients).toHaveBeenCalled();
    expect(component.clients()).toEqual(mockClients);
    expect(component.isLoading()).toBeFalse();
  });

  it('shows error message when load fails', () => {
    userService.getClients.and.returnValue(throwError(() => ({ detail: 'Server error', status: 500 })));
    component['loadData']();
    expect(component.error()).toBe('Failed to load clients.');
  });

  it('createClient() — happy path reloads data', () => {
    userService.createClient.and.returnValue(of(undefined));

    component.newFirstName = 'Luis';
    component.newLastName  = 'Fernández';
    component.newEmail     = 'luis@client.com';
    component.newPassword  = 'pass1234';
    component.createClient();

    expect(userService.createClient).toHaveBeenCalled();
    expect(component.showCreateForm()).toBeFalse();
  });

  it('createClient() — shows error when required fields empty', () => {
    component.createClient();
    expect(component.createError()).toBeTruthy();
    expect(userService.createClient).not.toHaveBeenCalled();
  });

  it('createClient() — shows backend error detail on failure', () => {
    userService.createClient.and.returnValue(throwError(() => ({ detail: 'Email already in use', status: 400 })));

    component.newFirstName = 'Luis';
    component.newLastName  = 'Fernández';
    component.newEmail     = 'dup@client.com';
    component.newPassword  = 'pass1234';
    component.createClient();

    expect(component.createError()).toBe('Email already in use');
  });

  it('toggleActive() — calls deactivateClient for active client after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.deactivateClient.and.returnValue(of(undefined));

    component.toggleActive(mockClients[0]);
    tick();

    expect(userService.deactivateClient).toHaveBeenCalledWith('cl1');
  }));

  it('toggleActive() — calls activateClient for inactive client after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.activateClient.and.returnValue(of(undefined));
    const inactive: ClientListItem = { ...mockClients[0], status: 'Inactive' };

    component.toggleActive(inactive);
    tick();

    expect(userService.activateClient).toHaveBeenCalledWith('cl1');
  }));

  it('toggleActive() — does nothing when user cancels confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(false));

    component.toggleActive(mockClients[0]);
    tick();

    expect(userService.deactivateClient).not.toHaveBeenCalled();
  }));

  it('hardDelete() — calls deleteClient after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.deleteClient.and.returnValue(of(undefined));

    component.hardDelete(mockClients[0]);
    tick();

    expect(userService.deleteClient).toHaveBeenCalledWith('cl1');
  }));

  it('hardDelete() — does nothing when user cancels confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(false));

    component.hardDelete(mockClients[0]);
    tick();

    expect(userService.deleteClient).not.toHaveBeenCalled();
  }));
});
