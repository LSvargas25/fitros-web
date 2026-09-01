import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ProfilePage } from './profile.page';
import { UserService, UserDetail } from '../../../OwnerAdmin/services/user.service';
import { SessionFacade } from '../../../../core/auth/session-facade';

const mockUser: UserDetail = {
  id: 'user-1',
  email: 'coach@gym.com',
  firstName: 'Ana',
  lastName: 'Ríos',
  role: 2,
  status: 1,
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: null,
};

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;
  let userService: jasmine.SpyObj<UserService>;
  let session: { userId: string | null; role: string };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('UserService', ['getUserById', 'updateUser']);
    spy.getUserById.and.returnValue(of(mockUser));
    session = { userId: 'user-1', role: 'Coach' };

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        { provide: UserService, useValue: spy },
        { provide: SessionFacade, useValue: session },
      ],
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the current user from the session id', () => {
    expect(userService.getUserById).toHaveBeenCalledWith('user-1');
    expect(component.user()).toEqual(mockUser);
    expect(component.isLoading()).toBeFalse();
  });

  it('errors out when the session has no user id', () => {
    session.userId = null;
    component.ngOnInit();
    expect(component.error()).toBeTruthy();
    expect(component.isLoading()).toBeFalse();
  });

  it('hides editing for Client role', () => {
    session.role = 'Client';
    expect(component.canEdit()).toBeFalse();
  });

  it('validates name and email before saving', () => {
    component.startEdit();

    component.firstName = '  ';
    component.save();
    expect(component.saveError()).toBeTruthy();
    expect(userService.updateUser).not.toHaveBeenCalled();

    component.firstName = 'Ana';
    component.email = 'not-an-email';
    component.save();
    expect(component.saveError()).toBeTruthy();
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('saves trimmed values and patches the local user on success', () => {
    userService.updateUser.and.returnValue(of(undefined));
    component.startEdit();
    component.firstName = ' Ana María ';
    component.lastName = ' Ríos ';
    component.email = ' ana@gym.com ';
    component.save();

    expect(userService.updateUser).toHaveBeenCalledWith('user-1', {
      firstName: 'Ana María',
      lastName: 'Ríos',
      email: 'ana@gym.com',
    });
    expect(component.isEditing()).toBeFalse();
    expect(component.saveSuccess()).toBeTrue();
    expect(component.user()?.firstName).toBe('Ana María');
  });

  it('shows the backend error detail when saving fails', () => {
    userService.updateUser.and.returnValue(throwError(() => ({ detail: 'Email en uso', status: 400 })));
    component.startEdit();
    component.save();
    expect(component.saveError()).toBe('Email en uso');
    expect(component.isSaving()).toBeFalse();
  });
});
