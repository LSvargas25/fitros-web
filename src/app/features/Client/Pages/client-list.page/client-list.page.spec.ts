import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ClientPage } from './client-list.page';
import { UserService, ClientListItem } from '../../../OwnerAdmin/services/user.service';
import { GymService } from '../../../OwnerAdmin/services/gym.service';
import { DialogService } from '../../../../core/Dialog/dialog.service';

const mockClients: ClientListItem[] = [
  { id: 'c1', email: 'ana@b.com', firstName: 'Ana', lastName: 'López', gymId: 'g1', gymName: 'FitGym', coachId: null, coachName: null, status: 'Active' },
  { id: 'c2', email: 'bob@y.com', firstName: 'Bob', lastName: 'Smith', gymId: null, gymName: null, coachId: null, coachName: null, status: 'Inactive' },
];

const mockGyms = [
  { id: 'g1', name: 'FitGym', isActive: true },
  { id: 'g2', name: 'Old Gym', isActive: false },
];

describe('ClientPage', () => {
  let fixture: ComponentFixture<ClientPage>;
  let component: ClientPage;
  let userService: jasmine.SpyObj<UserService>;
  let gymService: jasmine.SpyObj<GymService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    const userSpy = jasmine.createSpyObj('UserService', [
      'getClients', 'activateUser', 'deactivateUser', 'hardDeleteUser',
    ]);
    const gymSpy    = jasmine.createSpyObj('GymService', ['getAll']);
    const dialogSpy = jasmine.createSpyObj('DialogService', ['confirm']);

    userSpy.getClients.and.returnValue(of(mockClients));
    gymSpy.getAll.and.returnValue(of(mockGyms));

    await TestBed.configureTestingModule({
      imports: [ClientPage],
      providers: [
        { provide: UserService,   useValue: userSpy },
        { provide: GymService,    useValue: gymSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    }).compileComponents();

    userService   = TestBed.inject(UserService)   as jasmine.SpyObj<UserService>;
    gymService    = TestBed.inject(GymService)    as jasmine.SpyObj<GymService>;
    dialogService = TestBed.inject(DialogService) as jasmine.SpyObj<DialogService>;

    fixture   = TestBed.createComponent(ClientPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads clients and gyms on init', () => {
    expect(userService.getClients).toHaveBeenCalled();
    expect(gymService.getAll).toHaveBeenCalled();
    expect(component.clients()).toEqual(mockClients);
    expect(component.isLoading()).toBeFalse();
  });

  it('surfaces an error when the client load fails', () => {
    userService.getClients.and.returnValue(throwError(() => ({ status: 500 })));
    component.loadClients();
    expect(component.error()).toBe('Failed to load clients.');
    expect(component.isLoading()).toBeFalse();
  });

  it('filteredClients narrows rows by name/email search', () => {
    component.searchValue.set('ana');
    expect(component.filteredClients).toEqual([mockClients[0]]);

    component.searchValue.set('bob@y.com');
    expect(component.filteredClients).toEqual([mockClients[1]]);
  });

  it('filteredClients narrows rows by gym and status filters', () => {
    component.gymFilter.set('g1');
    expect(component.filteredClients).toEqual([mockClients[0]]);

    component.gymFilter.set('');
    component.statusFilter.set('Inactive');
    expect(component.filteredClients).toEqual([mockClients[1]]);
  });

  it('openEdit() / closeEdit() toggle editingClient', () => {
    component.openEdit(mockClients[0]);
    expect(component.editingClient()).toEqual(mockClients[0]);
    component.closeEdit();
    expect(component.editingClient()).toBeNull();
  });

  it('openCreate() / closeCreate() toggle showCreateModal', () => {
    component.openCreate();
    expect(component.showCreateModal()).toBeTrue();
    component.closeCreate();
    expect(component.showCreateModal()).toBeFalse();
  });

  it('onClientCreated() closes the modal and reloads', () => {
    userService.getClients.calls.reset();
    component.openCreate();
    component.onClientCreated();
    expect(component.showCreateModal()).toBeFalse();
    expect(userService.getClients).toHaveBeenCalledTimes(1);
  });

  it('onClientUpdated() clears the edit target and reloads', () => {
    userService.getClients.calls.reset();
    component.openEdit(mockClients[0]);
    component.onClientUpdated();
    expect(component.editingClient()).toBeNull();
    expect(userService.getClients).toHaveBeenCalledTimes(1);
  });

  it('toggleActive() deactivates an active client after confirm', fakeAsync(() => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.deactivateUser.and.returnValue(of(undefined));

    component.toggleActive(mockClients[0]);
    tick();

    expect(userService.deactivateUser).toHaveBeenCalledWith('c1');
  }));

  it('toggleActive() activates an inactive client after confirm', fakeAsync(() => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.activateUser.and.returnValue(of(undefined));

    component.toggleActive(mockClients[1]);
    tick();

    expect(userService.activateUser).toHaveBeenCalledWith('c2');
  }));

  it('toggleActive() does nothing when the confirm is declined', fakeAsync(() => {
    dialogService.confirm.and.returnValue(Promise.resolve(false));

    component.toggleActive(mockClients[0]);
    tick();

    expect(userService.deactivateUser).not.toHaveBeenCalled();
    expect(userService.activateUser).not.toHaveBeenCalled();
  }));

  it('toggleActive() surfaces the backend error detail on failure', fakeAsync(() => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.deactivateUser.and.returnValue(throwError(() => ({ error: { detail: 'No se pudo' } })));

    component.toggleActive(mockClients[0]);
    tick();

    expect(component.actionError()).toBe('No se pudo');
  }));

  it('hardDelete() calls hardDeleteUser after confirm', fakeAsync(() => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.hardDeleteUser.and.returnValue(of(undefined));

    component.hardDelete(mockClients[0]);
    tick();

    expect(userService.hardDeleteUser).toHaveBeenCalledWith('c1');
  }));

  it('hardDelete() does nothing when the confirm is declined', fakeAsync(() => {
    dialogService.confirm.and.returnValue(Promise.resolve(false));

    component.hardDelete(mockClients[0]);
    tick();

    expect(userService.hardDeleteUser).not.toHaveBeenCalled();
  }));

  it('getGymName() resolves a gym id to its name and falls back to a dash', () => {
    expect(component.getGymName('g1')).toBe('FitGym');
    expect(component.getGymName(null)).toBe('—');
  });
});
