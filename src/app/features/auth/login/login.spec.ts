import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { importProvidersFrom } from '@angular/core';

import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenStorageService } from '../../../core/auth/token-storage.service';
import { SessionFacade } from '../../../core/auth/session-facade';

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

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let tokenStorageSpy: jasmine.SpyObj<TokenStorageService>;
  let sessionStub: { landingUrl: string };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', ['setTokens']);
    sessionStub = { landingUrl: '/my/training' };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
        { provide: SessionFacade, useValue: sessionStub },

        importProvidersFrom(
          LucideAngularModule.pick({
            Mail,
            Lock,
            Eye,
            EyeOff,
            AlertTriangle,
            Loader2,
            ShieldCheck,
          })
        ),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call login if form invalid', () => {
    component.submit();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('should call login if form valid', () => {
    authSpy.login.and.returnValue(of({ accessToken: 'a', refreshToken: 'b' }));

    component.form.setValue({
      email: 'test@test.com',
      password: 'Password123',
      rememberMe: true,
    });

    component.submit();

    expect(authSpy.login).toHaveBeenCalled();
  });

  it('navigates to the role-aware landing url on success', () => {
    authSpy.login.and.returnValue(of({ accessToken: 'a', refreshToken: 'b' }));

    component.form.setValue({
      email: 'test@test.com',
      password: 'Password123',
      rememberMe: true,
    });

    component.submit();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/my/training');
  });

  it('should set errorMessage on login error', () => {
    // ErrorInterceptor flattens HttpErrorResponse to { status, detail } before it
    // reaches the component, which reads err.detail.
    authSpy.login.and.returnValue(
      throwError(() => ({ detail: 'Invalid credentials' }))
    );

    component.form.setValue({
      email: 'test@test.com',
      password: 'Password123',
      rememberMe: true,
    });

    component.submit();

    expect(component.errorMessage).toBe('Invalid credentials');
  });
});
