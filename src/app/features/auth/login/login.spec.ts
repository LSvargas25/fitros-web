import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { importProvidersFrom } from '@angular/core';

import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';
import { TokenStorageService } from '../../../core/auth/token-storage.service';
import { SessionFacade } from '../../../core/auth/session-facade';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from './demo-accounts';

import {
  LucideAngularModule,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Sparkles,
  Crown,
  Building2,
  Dumbbell,
  User,
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
            Sparkles,
            Crown,
            Building2,
            Dumbbell,
            User,
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

  describe('Probar demo', () => {
    const el = (): HTMLElement => fixture.nativeElement;
    const demoButton = (key: string): HTMLButtonElement =>
      el().querySelector(`[data-testid="demo-login-${key}"]`) as HTMLButtonElement;

    it('shows one "Entrar como …" button per role', () => {
      const labels = Array.from(el().querySelectorAll('[data-testid^="demo-login-"]'))
        .map(b => b.textContent!.replace(/\s+/g, ' ').trim());

      expect(el().querySelector('#demo-title')?.textContent).toContain('Probar demo');
      expect(labels.length).toBe(4);
      expect(labels[0]).toContain('Entrar como Dueño');
      expect(labels[1]).toContain('Entrar como Admin');
      expect(labels[2]).toContain('Entrar como Coach');
      expect(labels[3]).toContain('Entrar como Cliente');
    });

    it('is placed above the email/password form, as the primary option', () => {
      const demo = el().querySelector('[data-testid="demo-section"]')!;
      const form = el().querySelector('[data-testid="login-form"]')!;

      expect(demo.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('signs in with the matching demo account in one click and lands on the role page', () => {
      authSpy.login.and.returnValue(of({ accessToken: 'a', refreshToken: 'b' }));

      demoButton('coach').click();

      expect(authSpy.login).toHaveBeenCalledOnceWith(
        { email: 'coach@fitros.demo', password: DEMO_PASSWORD },
        false,
      );
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/my/training');
    });

    it("uses each role's own account", () => {
      authSpy.login.and.returnValue(of({ accessToken: 'a', refreshToken: 'b' }));

      for (const account of DEMO_ACCOUNTS) {
        demoButton(account.key).click();
        expect(authSpy.login.calls.mostRecent().args[0]).toEqual({
          email: account.email,
          password: DEMO_PASSWORD,
        });
      }

      expect(DEMO_ACCOUNTS.map(a => a.email)).toEqual([
        'owner@fitros.demo',
        'admin@fitros.demo',
        'coach@fitros.demo',
        'client@fitros.demo',
      ]);
    });

    it('does not need the email/password form to be filled', () => {
      authSpy.login.and.returnValue(of({ accessToken: 'a', refreshToken: 'b' }));
      expect(component.form.invalid).toBeTrue();

      demoButton('owner').click();

      expect(authSpy.login).toHaveBeenCalled();
    });

    it('disables every sign-in button while a demo login is in flight', () => {
      const pending = new Subject<any>();
      authSpy.login.and.returnValue(pending.asObservable());

      demoButton('admin').click();
      fixture.detectChanges();

      expect(demoButton('admin').textContent).toContain('Entrando');
      for (const account of DEMO_ACCOUNTS) {
        expect(demoButton(account.key).disabled).toBeTrue();
      }

      demoButton('client').click();
      expect(authSpy.login).toHaveBeenCalledTimes(1);

      pending.next({ accessToken: 'a', refreshToken: 'b' });
      pending.complete();
      fixture.detectChanges();

      expect(component.demoInFlight).toBeNull();
    });

    it('shows an error and re-enables the buttons when the demo login fails', () => {
      authSpy.login.and.returnValue(throwError(() => ({ status: 0 })));

      demoButton('client').click();
      fixture.detectChanges();

      expect(component.errorMessage).toContain('No se pudo entrar a la demo');
      expect(demoButton('client').disabled).toBeFalse();
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });
  });
});
