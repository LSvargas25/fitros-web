import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard] },

  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password/forgot-password')
        .then(c => c.ForgotPassword),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password/reset-password')
        .then(c => c.ResetPassword),
  },

  { path: '**', redirectTo: 'login' },
];
