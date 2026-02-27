import { Routes } from '@angular/router';
import { Login } from './features/Auth/login/login';
import { DashboardPage } from './features/Dashboard/Pages/dashboard.page/dashboard.page';
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
      //Clients
      {
  path: 'clients',
  loadComponent: () =>
    import('./features/Client/Pages/client-list.page/client-list.page')
      .then(c => c.ClientPage),
  data: { title: 'Clients' },
},
{
  path: 'clients/new',
  loadComponent: () =>
    import('./features/Client/Pages/client-form.page/client-form.page/client-form.page')
      .then(c => c.ClientFormPage),
  data: { title: 'Clients' },
},



      //training
      {
        path: 'routines',
        loadComponent: () =>
          import('./features/Training/Routines/Pages/routines.page/routines.page').then(c => c.RoutinesPage),
        data: { title: 'Routines' },
      },
      {
        path: 'exercises',
        loadComponent: () =>
          import('./features/Training/Exercises/Pages/exercises.page/exercises.page').then(c => c.ExercisesPage),
        data: { title: 'Exercises' },
      },
      //nutrition
      {
        path: 'foods',
        loadComponent: () =>
          import('./features/Nutrition/Food/Pages/food.page/food.page').then(c => c.FoodPage),
        data: { title: 'Food' },
      },
      {
        path: 'meal-plans',
        loadComponent: () =>
          import('./features/Nutrition/MealPlan/Pages/nutritioplan.page/nutritioplan.page').then(c => c.NutritioplanPage),
        data: { title: 'Meals Plans' },
      },

      //Progress
       {
        path: 'measures',
        loadComponent:() =>
          import('./features/Progress/Meansures/Pages/meansures.page/meansures.page').then(c => c.MeansuresPage),
        data: { title: 'Measures' },
      },
       {
        path: 'reports',
        loadComponent: () =>
          import('./features/Progress/Reports/Pages/report.page/report.page').then(c => c.ReportPage),
        data: { title: 'Reports' },
      },

      //profile
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/Profile/Pages/profile.page/profile.page').then(c => c.ProfilePage),
        data: { title: 'Profile' },
      },
    ],
  },

  { path: '**', redirectTo: '' },
];

