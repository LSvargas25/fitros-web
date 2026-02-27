import { Routes } from '@angular/router';
import { Login } from './features/Auth/login/login';
import { DashboardPage } from './features/Dashboard/dashboard.page/dashboard.page';
import { authGuard } from './Core/Guards/auth.guard';
import { guestGuard } from './Core/Guards/guest.guard';
import { AppRole } from './Core/Auth/session-facade';
import { AppShell } from './Layout/app-shell/app-shell/app-shell';


export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
    data: { title: 'Login' },
  },
  {
       path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/Auth/forgot-password/forgot-password/forgot-password')
        .then(c => c.ForgotPassword) , data: { title: 'Forgot Password' },
  },
  {
     path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/Auth/reset-password/reset-password/reset-password')
        .then(c => c.ResetPassword),
  },

  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: DashboardPage,
        data: { title: 'Dashboard' },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/Users/users.page/users.page').then(c => c.UsersPage),
        data: { title: 'Users' },
      },
      {
        path: 'routines',
        loadComponent: () =>
          import('./features/Routines/routines.page/routines.page').then(c => c.RoutinesPage),
        data: { title: 'Routines' },
      },
      {
        path: 'exercises',
        loadComponent: () =>
          import('./features/Training/exercises/exercises.page').then(c => c.ExercisesPage),
        data: { title: 'Exercises' },
      },
    ],
  },

  { path: '**', redirectTo: '' },
];

