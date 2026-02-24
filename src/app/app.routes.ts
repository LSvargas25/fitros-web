import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { authGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
{
  path: 'forgot-password',
  loadComponent: () =>
    import('./features/auth/forgot-password/forgot-password/forgot-password')
      .then(c => c.ForgotPassword),
},
];
