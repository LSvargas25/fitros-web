import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { importProvidersFrom } from '@angular/core';

import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenStorageService } from '../../../core/auth/token-storage.service';
import { SessionFacade } from '../../../core/auth/session-facade';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';

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
  let googleSpy: jasmine.SpyObj<GoogleIdentityService>;
  let sessionStub: { landingUrl: string };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login', 'loginWithGoogle']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', ['setTokens']);
    googleSpy = jasmine.createSpyObj('GoogleIdentityService', ['requestIdToken']);
    sessionStub = { landingUrl: '/my/training' };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
        { provide: SessionFacade, useValue: sessionStub },
        { provide: GoogleIdentityService, useValue: googleSpy },

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

  it('exchanges the Google id_token and navigates on success', async () => {
    googleSpy.requestIdToken.and.resolveTo('google-jwt');
    authSpy.loginWithGoogle.and.returnValue(of({
      userId: 'u1',
      email: 'a@b.com',
      role: 3,
      accessToken: 'a',
      refreshToken: 'b',
    }));

    await component.loginWithGoogle();

    expect(authSpy.loginWithGoogle).toHaveBeenCalledWith('google-jwt', true);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/my/training');
  });

  it('shows the reason when the Google prompt is dismissed or unconfigured', async () => {
    googleSpy.requestIdToken.and.rejectWith(
      new Error('Google sign-in is not configured yet.'),
    );

    await component.loginWithGoogle();

    expect(authSpy.loginWithGoogle).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Google sign-in is not configured yet.');
    expect(component.isGoogleSubmitting).toBeFalse();
  });
});
