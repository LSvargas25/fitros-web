import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { importProvidersFrom } from '@angular/core';

import { Register } from './register';
import { AuthService } from '../../../core/auth/auth.service';

import {
  LucideAngularModule,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-angular';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const fillValidForm = () =>
    component.form.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['register']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },

        importProvidersFrom(
          LucideAngularModule.pick({
            Mail,
            Lock,
            Eye,
            EyeOff,
            AlertTriangle,
            Loader2,
            ShieldCheck,
          }),
        ),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call register when the form is invalid', () => {
    component.submit();
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('does not call register when the passwords do not match', () => {
    component.form.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Password123',
      confirmPassword: 'different',
    });

    component.submit();

    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('posts the trimmed field set when the form is valid', () => {
    authSpy.register.and.returnValue(of({ userId: 'u1', email: 'ada@example.com' }));

    fillValidForm();
    component.submit();

    expect(authSpy.register).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Password123',
    });
  });

  it('routes to the verify-email step with the email on success', () => {
    authSpy.register.and.returnValue(of({ userId: 'u1', email: 'ada@example.com' }));

    fillValidForm();
    component.submit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/verify-email'], {
      queryParams: { email: 'ada@example.com' },
    });
  });

  it('surfaces the backend detail message on error', () => {
    authSpy.register.and.returnValue(
      throwError(() => ({ detail: 'Email already exists.' })),
    );

    fillValidForm();
    component.submit();

    expect(component.errorMessage).toBe('Email already exists.');
  });
});
