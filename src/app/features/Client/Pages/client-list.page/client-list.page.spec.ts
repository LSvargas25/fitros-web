import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ClientPage } from './client-list.page';
import { UserService, ClientListItem, PagedResponse } from '../../../OwnerAdmin/services/user.service';
import { GymService } from '../../../OwnerAdmin/services/gym.service';
import { DialogService } from '../../../../Core/Dialog/dialog.service';
import { of } from 'rxjs';

const mockClients: ClientListItem[] = [
  { id: 'c1', email: 'a@b.com', firstName: 'Ana', lastName: 'López', gymId: 'g1', gymName: 'FitGym', coachId: null, coachName: null, status: 'Active' },
  { id: 'c2', email: 'x@y.com', firstName: 'Bob', lastName: 'Smith', gymId: null, gymName: null, coachId: null, coachName: null, status: 'Inactive' },
];

const mockPage: PagedResponse<ClientListItem> = { items: mockClients, hasMore: false, nextCursor: null };

describe('ClientPage', () => {
  let fixture: ComponentFixture<ClientPage>;
  let component: ClientPage;
  let userService: jasmine.SpyObj<UserService>;
  let gymService: jasmine.SpyObj<GymService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    const userSpy   = jasmine.createSpyObj('UserService', [
      'getClients', 'updateUser', 'activateUser', 'deactivateUser', 'hardDeleteUser',
    ]);
    const gymSpy    = jasmine.createSpyObj('GymService', ['getAll']);
    const dialogSpy = jasmine.createSpyObj('DialogService', ['confirm']);

    userSpy.getClients.and.returnValue(of(mockPage));
    gymSpy.getAll.and.returnValue(of([]));

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

  it('loads clients on init', () => {
    expect(userService.getClients).toHaveBeenCalled();
    expect(component.clients()).toEqual(mockClients);
    expect(component.isLoading()).toBeFalse();
  });

  it('onFilterChange() reloads clients with current gym filter', () => {
    userService.getClients.calls.reset();
    userService.getClients.and.returnValue(of(mockPage));
    component.gymFilter = 'g1';
    component.onFilterChange();

    expect(userService.getClients).toHaveBeenCalledWith(
      jasmine.objectContaining({ gymId: 'g1' })
    );
  });

  it('onSearchChange() debounces and reloads', fakeAsync(() => {
    userService.getClients.calls.reset();
    userService.getClients.and.returnValue(of(mockPage));
    component.searchValue = 'ana';
    component.onSearchChange();
    tick(350);

    expect(userService.getClients).toHaveBeenCalledWith(
      jasmine.objectContaining({ search: 'ana' })
    );
  }));

  it('openEdit() sets editingClient', () => {
    component.openEdit(mockClients[0]);
    expect(component.editingClient()).toEqual(mockClients[0]);
  });

  it('closeEdit() clears editingClient', () => {
    component.openEdit(mockClients[0]);
    component.closeEdit();
    expect(component.editingClient()).toBeNull();
  });

  it('openCreate() / closeCreate() toggle showCreateModal', () => {
    component.openCreate();
    expect(component.showCreateModal()).toBeTrue();
    component.closeCreate();
    expect(component.showCreateModal()).toBeFalse();
  });

  it('toggleActive() — deactivates active client after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.deactivateUser.and.returnValue(of(undefined));
    userService.getClients.and.returnValue(of(mockPage));

    component.toggleActive(mockClients[0]);
    tick();

    expect(userService.deactivateUser).toHaveBeenCalledWith('c1');
  }));

  it('toggleActive() — activates inactive client after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.activateUser.and.returnValue(of(undefined));
    userService.getClients.and.returnValue(of(mockPage));

    component.toggleActive(mockClients[1]);
    tick();

    expect(userService.activateUser).toHaveBeenCalledWith('c2');
  }));

  it('hardDelete() — calls hardDeleteUser after confirm', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(true));
    userService.hardDeleteUser.and.returnValue(of(undefined));
    userService.getClients.and.returnValue(of(mockPage));

    component.hardDelete(mockClients[0]);
    tick();

    expect(userService.hardDeleteUser).toHaveBeenCalledWith('c1');
  }));

  it('hardDelete() — does nothing when user cancels', fakeAsync(async () => {
    dialogService.confirm.and.returnValue(Promise.resolve(false));

    component.hardDelete(mockClients[0]);
    tick();

    expect(userService.hardDeleteUser).not.toHaveBeenCalled();
  }));
});
