import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditUserModalComponent } from './edit-user-modal.component';
import { UserService } from '../../services/user.service';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('EditUserModalComponent', () => {
  let fixture: ComponentFixture<EditUserModalComponent>;
  let component: EditUserModalComponent;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('UserService', ['updateUser']);

    await TestBed.configureTestingModule({
      imports: [EditUserModalComponent],
      providers: [{ provide: UserService, useValue: spy }],
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    fixture = TestBed.createComponent(EditUserModalComponent);
    component = fixture.componentInstance;

    component.userId           = 'user-1';
    component.initialFirstName = 'John';
    component.initialLastName  = 'Doe';
    component.initialEmail     = 'john@doe.com';

    fixture.detectChanges();
  });

  it('should initialize fields from inputs', () => {
    expect(component.firstName).toBe('John');
    expect(component.lastName).toBe('Doe');
    expect(component.email).toBe('john@doe.com');
  });

  it('submit() — calls updateUser and emits updated on success', () => {
    userService.updateUser.and.returnValue(of(undefined));
    const spy = jasmine.createSpy('updated');
    component.updated.subscribe(spy);

    component.firstName = 'Jane';
    component.submit();

    expect(userService.updateUser).toHaveBeenCalledWith('user-1', {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'john@doe.com',
    });
    expect(spy).toHaveBeenCalled();
  });

  it('submit() — sets error when fields are empty', () => {
    component.firstName = '';
    component.submit();
    expect(component.error()).toBe('All fields are required.');
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('submit() — sets error message on service failure', () => {
    userService.updateUser.and.returnValue(
      throwError(() => ({ error: { detail: 'Email taken' } }))
    );

    component.submit();

    expect(component.error()).toBe('Email taken');
  });

  it('cancel() — emits cancelled', () => {
    const spy = jasmine.createSpy('cancelled');
    component.cancelled.subscribe(spy);
    component.cancel();
    expect(spy).toHaveBeenCalled();
  });
});
