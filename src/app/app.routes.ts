import { Routes } from '@angular/router';
import { Login } from './features/Auth/login/login';
import { DashboardPage } from './features/Dashboard/Pages/dashboard.page/dashboard.page';
import { authGuard } from './Core/Guards/auth.guard';
import { guestGuard } from './Core/Guards/guest.guard';
import { AppShell } from './Layout/app-shell/app-shell/app-shell';
import { roleGuard } from './Core/Guards/role.guard';
import { PERMISSIONS } from './Core/Auth/route-permissions';

export const routes: Routes = [
  // =========================================================
  // PUBLIC
  // =========================================================
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
        .then(c => c.ForgotPassword),
    data: { title: 'Forgot Password' },
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/Auth/reset-password/reset-password/reset-password')
        .then(c => c.ResetPassword),
    data: { title: 'Reset Password' },
  },

  // 🔐 pantalla global
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./Shared/Pages/unauthorized/unauthorized')
        .then(c => c.Unauthorized),
    data: { title: 'Unauthorized' },
  },

  // =========================================================
  // APP (AUTH REQUIRED)
  // =========================================================
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // =====================================================
      // DASHBOARD
      // =====================================================
      {
        path: 'dashboard',
        component: DashboardPage,
        data: { title: 'Dashboard' },
      },

      // =====================================================
      // 🧑‍💻 CLIENT PORTAL (SELF)
      // Lo que el CLIENT consume
      // =====================================================

      {
        path: 'my/training',
        canActivate: [roleGuard(PERMISSIONS.TRAINING_SELF)],
        loadComponent: () =>
          import('./features/Customer/pages/my-training.page/my-training-page/my-training-page')
            .then(c => c.MyTrainingPage),
        data: { title: 'My Training' },
      },
      {
        path: 'my/nutrition',
        canActivate: [roleGuard(PERMISSIONS.NUTRITION_SELF)],
        loadComponent: () =>
          import('./features/Customer/pages/my-nutrition.page/my-nutrition.page/my-nutrition.page')
            .then(c => c.MyNutritionPage),
        data: { title: 'My Nutrition' },
      },
      {
        path: 'my/progress',
        canActivate: [roleGuard(PERMISSIONS.PROGRESS_SELF)],
        loadComponent: () =>
          import('./features/Customer/pages/my-progress.page/my-progress.page/my-progress.page/my-progress.page')
            .then(c => c.MyProgressPage),
        data: { title: 'My Progress' },
      },

      // =====================================================
      // 🛠️ BACKOFFICE (MANAGE)
      // Admin / Coach / Owner
      // =====================================================

      // ----- Clients -----
      {
        path: 'clients',
        canActivate: [roleGuard(PERMISSIONS.CLIENTS)],
        loadComponent: () =>
          import('./features/Client/Pages/client-list.page/client-list.page')
            .then(c => c.ClientPage),
        data: { title: 'Clients' },
      },
      {
        path: 'clients/new',
        canActivate: [roleGuard(PERMISSIONS.CLIENTS)],
        loadComponent: () =>
          import('./features/Client/Pages/client-form.page/client-form.page/client-form.page')
            .then(c => c.ClientFormPage),
        data: { title: 'New Client' },
      },

      // ----- Training Manage -----
      {
        path: 'manage/training/routines',
        canActivate: [roleGuard(PERMISSIONS.TRAINING_MANAGE)],
        loadComponent: () =>
          import('./features/Training/Routines/Pages/routines.page/routines.page')
            .then(c => c.RoutinesPage),
        data: { title: 'Manage Routines' },
      },
      {
        path: 'manage/training/exercises',
        canActivate: [roleGuard(PERMISSIONS.TRAINING_MANAGE)],
        loadComponent: () =>
          import('./features/Training/Exercises/Pages/exercises.page/exercises.page')
            .then(c => c.ExercisesPage),
        data: { title: 'Manage Exercises' },
      },

      // ----- Nutrition Manage -----
      {
        path: 'manage/nutrition/foods',
        canActivate: [roleGuard(PERMISSIONS.NUTRITION_MANAGE)],
        loadComponent: () =>
          import('./features/Nutrition/Food/Pages/food.page/food.page')
            .then(c => c.FoodPage),
        data: { title: 'Manage Foods' },
      },
      {
        path: 'manage/nutrition/meal-plans',
        canActivate: [roleGuard(PERMISSIONS.NUTRITION_MANAGE)],
        loadComponent: () =>
          import('./features/Nutrition/MealPlan/Pages/nutritioplan.page/nutritioplan.page')
            .then(c => c.NutritioplanPage),
        data: { title: 'Manage Meal Plans' },
      },

      // ----- Progress Manage -----
      {
        path: 'manage/progress/measures',
        canActivate: [roleGuard(PERMISSIONS.PROGRESS_MANAGE)],
        loadComponent: () =>
          import('./features/Progress/Meansures/Pages/meansures.page/meansures.page')
            .then(c => c.MeansuresPage),
        data: { title: 'Manage Measures' },
      },
      {
        path: 'manage/progress/reports',
        canActivate: [roleGuard(PERMISSIONS.PROGRESS_MANAGE)],
        loadComponent: () =>
          import('./features/Progress/Reports/Pages/report.page/report.page')
            .then(c => c.ReportPage),
        data: { title: 'Manage Reports' },
      },

      // =====================================================
      // PROFILE (ALL AUTHENTICATED)
      // =====================================================
      {
        path: 'profile',
        canActivate: [roleGuard(PERMISSIONS.PROFILE)],
        loadComponent: () =>
          import('./features/Profile/Pages/profile.page/profile.page')
            .then(c => c.ProfilePage),
        data: { title: 'Profile' },
      },

      // =====================================================
      // OWNER ONLY
      // =====================================================
      {
        path: 'owner-admins',
        canActivate: [roleGuard(PERMISSIONS.OWNER_ADMINS)],
        loadComponent: () =>
          import('./features/OwnerAdmin/Pages/Principal-Page/principal-owner.page/principal-owner.page')
            .then(c => c.PrincipalOwnerPage),
        data: { title: 'Owner Admins' },
      },
      {
        path: 'owner/admin-management',
        canActivate: [roleGuard(PERMISSIONS.OWNER_ADMINS)],
        loadComponent: () =>
          import('./features/OwnerAdmin/Components/admin-management/admin-management.component')
            .then(c => c.AdminManagementComponent),
        data: { title: 'Admin Management' },
      },
    ],
  },

  // =========================================================
  // FALLBACK
  // =========================================================
  { path: '**', redirectTo: '' },
];
