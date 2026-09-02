import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { importProvidersFrom } from '@angular/core';

import { VerifyEmail } from './verify-email';
import { AuthService } from '../../../core/auth/auth.service';

import {
  LucideAngularModule,
  AlertTriangle,
  Loader2,
} from 'lucide-angular';

describe('VerifyEmail', () => {
  let component: VerifyEmail;
  let fixture: ComponentFixture<VerifyEmail>;

  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let emailParam: string | null;

  const build = async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of({
              get: (key: string) => (key === 'email' ? emailParam : null),
            }),
          },
        },
        importProvidersFrom(
          LucideAngularModule.pick({ AlertTriangle, Loader2 }),
        ),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['verifyEmail', 'resendVerification']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    emailParam = 'ada@example.com';
  });

  it('reads the email from the query string', async () => {
    await build();
    expect(component.email).toBe('ada@example.com');
    expect(component.linkInvalid).toBeFalse();
  });

  it('flags a link with no email', async () => {
    emailParam = null;
    await build();
    expect(component.linkInvalid).toBeTrue();
  });

  it('does not verify when the code is not six digits', async () => {
    await build();
    component.form.setValue({ code: '123' });
    component.submit();
    expect(authSpy.verifyEmail).not.toHaveBeenCalled();
  });

  it('posts the email and code when the form is valid', async () => {
    await build();
    authSpy.verifyEmail.and.returnValue(of(undefined));

    component.form.setValue({ code: '123456' });
    component.submit();

    expect(authSpy.verifyEmail).toHaveBeenCalledWith({
      email: 'ada@example.com',
      code: '123456',
    });
    expect(component.success).toBeTrue();
  });

  it('surfaces the backend detail on a bad code', async () => {
    await build();
    authSpy.verifyEmail.and.returnValue(
      throwError(() => ({ detail: 'Invalid or expired verification code.' })),
    );

    component.form.setValue({ code: '000000' });
    component.submit();

    expect(component.errorMessage).toBe('Invalid or expired verification code.');
  });

  it('resend calls the endpoint and starts the cooldown', async () => {
    await build();
    authSpy.resendVerification.and.returnValue(of(undefined));

    component.resend();

    expect(authSpy.resendVerification).toHaveBeenCalledWith('ada@example.com');
    expect(component.resendCooldown).toBeGreaterThan(0);

    component.ngOnDestroy();
  });

  it('resend is a no-op while the cooldown is active', async () => {
    await build();
    authSpy.resendVerification.and.returnValue(of(undefined));

    component.resend();
    authSpy.resendVerification.calls.reset();
    component.resend();

    expect(authSpy.resendVerification).not.toHaveBeenCalled();

    component.ngOnDestroy();
  });

  it('maps a 429 to a wait message', async () => {
    await build();
    authSpy.resendVerification.and.returnValue(
      throwError(() => ({ status: 429 })),
    );

    component.resend();

    expect(component.errorMessage).toContain('Too many requests');
    expect(component.resendCooldown).toBe(0);
  });
});
