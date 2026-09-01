import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router, provideRouter } from '@angular/router';

import { ClientFormPage } from './client-form.page';
import { UserService } from '../../../../OwnerAdmin/services/user.service';
import { GymService } from '../../../../OwnerAdmin/services/gym.service';
import { SessionFacade } from '../../../../../core/auth/session-facade';
import { provideTestIcons } from '../../../../../../testing/test-icons';

describe('ClientFormPage', () => {
  let component: ClientFormPage;
  let fixture: ComponentFixture<ClientFormPage>;
  let userService: jasmine.SpyObj<UserService>;
  let gymService: jasmine.SpyObj<GymService>;
  let router: Router;

  function setup(role: string) {
    TestBed.resetTestingModule();
    const userSpy = jasmine.createSpyObj('UserService', ['createClient']);
    const gymSpy = jasmine.createSpyObj('GymService', ['getAll']);
    gymSpy.getAll.and.returnValue(of([{ id: 'g1', name: 'Centro', isActive: true }]));

    TestBed.configureTestingModule({
      imports: [ClientFormPage],
      providers: [
        { provide: UserService, useValue: userSpy },
        { provide: GymService, useValue: gymSpy },
        { provide: SessionFacade, useValue: { role } },
        provideRouter([]),
        ...provideTestIcons(),
      ],
    });

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    gymService = TestBed.inject(GymService) as jasmine.SpyObj<GymService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ClientFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setup('Coach');
    expect(component).toBeTruthy();
  });

  it('does not ask for a gym when the creator is a Coach', () => {
    setup('Coach');
    expect(component.needsGym).toBeFalse();
    expect(gymService.getAll).not.toHaveBeenCalled();
  });

  it('loads active gyms when the creator is OwnerApp', () => {
    setup('OwnerApp');
    expect(component.needsGym).toBeTrue();
    expect(gymService.getAll).toHaveBeenCalledWith(undefined, true);
    expect(component.gyms().length).toBe(1);
  });

  it('validates required fields and password length', () => {
    setup('Coach');
    component.firstName = 'Carlos';
    component.lastName = 'Vega';
    component.email = 'bad';
    component.password = 'short';
    component.submit();
    expect(component.error()).toBeTruthy();
    expect(userService.createClient).not.toHaveBeenCalled();

    component.email = 'carlos@correo.com';
    component.submit();
    expect(component.error()).toContain('contraseña');
    expect(userService.createClient).not.toHaveBeenCalled();
  });

  it('requires a gym selection for OwnerApp', () => {
    setup('OwnerApp');
    component.firstName = 'Carlos';
    component.lastName = 'Vega';
    component.email = 'carlos@correo.com';
    component.password = 'password1';
    component.submit();
    expect(component.error()).toBeTruthy();
    expect(userService.createClient).not.toHaveBeenCalled();
  });

  it('creates the client and navigates to the list on success', () => {
    setup('Coach');
    userService.createClient.and.returnValue(of(undefined));
    component.firstName = ' Carlos ';
    component.lastName = ' Vega ';
    component.email = ' carlos@correo.com ';
    component.password = 'password1';
    component.submit();

    expect(userService.createClient).toHaveBeenCalledWith({
      email: 'carlos@correo.com',
      firstName: 'Carlos',
      lastName: 'Vega',
      password: 'password1',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/clients']);
  });

  it('surfaces the backend error detail on failure', () => {
    setup('Coach');
    userService.createClient.and.returnValue(throwError(() => ({ detail: 'Email already exists.', status: 400 })));
    component.firstName = 'Carlos';
    component.lastName = 'Vega';
    component.email = 'carlos@correo.com';
    component.password = 'password1';
    component.submit();
    expect(component.error()).toBe('Email already exists.');
    expect(component.isSaving()).toBeFalse();
  });
});
