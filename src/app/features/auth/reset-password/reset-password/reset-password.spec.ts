import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ResetPassword } from './reset-password';
import { AuthService } from '../../../../core/auth/auth.service';
import { vi } from 'vitest';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let authSpy: any;

  beforeEach(async () => {

    authSpy = {
      resetPassword: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        { provide: AuthService, useValue: authSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of({
              get: (key: string) => {
                if (key === 'email') return 'test@test.com';
                if (key === 'token') return 'valid-token';
                return null;
              }
            })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect valid link', () => {
    expect(component.linkInvalid).toBe(false);
  });

  it('should not call reset if form invalid', () => {
    component.submit();
    expect(authSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('should call resetPassword if form valid', () => {
    authSpy.resetPassword.mockReturnValue(of());

    component.form.setValue({
      newPassword: 'Password123',
      confirmPassword: 'Password123'
    });

    component.submit();

    expect(authSpy.resetPassword).toHaveBeenCalled();
  });

  it('should handle reset error', () => {
    authSpy.resetPassword.mockReturnValue(
      throwError(() => ({ error: { detail: 'Invalid token' } }))
    );

    component.form.setValue({
      newPassword: 'Password123',
      confirmPassword: 'Password123'
    });

    component.submit();

    expect(component.errorMessage).toBe('Invalid token');
  });
});
