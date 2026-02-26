import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { importProvidersFrom } from '@angular/core';

import { Login } from './login';
import { AuthService } from '../../../Core/Auth/auth.service';
import { TokenStorageService } from '../../../Core/Auth/token-storage.service';

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

import { vi } from 'vitest';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  let authSpy: any;
  let routerSpy: any;
  let tokenStorageSpy: any;

  beforeEach(async () => {

    authSpy = { login: vi.fn() };
    routerSpy = { navigateByUrl: vi.fn() };
    tokenStorageSpy = { setTokens: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy },


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
      ]
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
    authSpy.login.mockReturnValue(
      of({ accessToken: 'a', refreshToken: 'b' })
    );

    component.form.setValue({
      email: 'test@test.com',
      password: 'Password123',
      rememberMe: true
    });

    component.submit();

    expect(authSpy.login).toHaveBeenCalled();
  });

  it('should navigate to dashboard on success', () => {
    authSpy.login.mockReturnValue(
      of({ accessToken: 'a', refreshToken: 'b' })
    );

    component.form.setValue({
      email: 'test@test.com',
      password: 'Password123',
      rememberMe: true
    });

    component.submit();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should set errorMessage on login error', () => {
    authSpy.login.mockReturnValue(
      throwError(() => ({
        error: { detail: 'Invalid credentials' }
      }))
    );

    component.form.setValue({
      email: 'test@test.com',
      password: 'Password123',
      rememberMe: true
    });

    component.submit();

    expect(component.errorMessage).toBe('Invalid credentials');
  });

});
