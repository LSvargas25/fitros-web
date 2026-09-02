import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { DashboardPage } from './features/Dashboard/Pages/dashboard.page/dashboard.page';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { landingGuard } from './core/guards/landing.guard';
import { AppShell } from './Layout/app-shell/app-shell/app-shell';
import { roleGuard } from './core/guards/role.guard';
import { PERMISSIONS } from './core/auth/route-permissions';

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
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register')
        .then(c => c.Register),
    data: { title: 'Register' },
  },
  {
    path: 'verify-email',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email')
        .then(c => c.VerifyEmail),
    data: { title: 'Verify Email' },
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password/forgot-password')
        .then(c => c.ForgotPassword),
    data: { title: 'Forgot Password' },
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password/reset-password')
        .then(c => c.ResetPassword),
    data: { title: 'Reset Password' },
  },

  // 🔐 pantalla global
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/Pages/unauthorized/unauthorized')
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
      // Role-aware landing: staff -> /dashboard, client -> /my/training.
      { path: '', pathMatch: 'full', canActivate: [landingGuard], children: [] },

      // =====================================================
      // DASHBOARD (staff only)
      // =====================================================
      {
        path: 'dashboard',
        component: DashboardPage,
        canActivate: [roleGuard(PERMISSIONS.DASHBOARD)],
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
        // Coach-only: edit the weekly training plan on the coach's own CoachSelf profile.
        path: 'my/training/plan',
        canActivate: [roleGuard(PERMISSIONS.TRAINING_PLAN_SELF)],
        loadComponent: () =>
          import('./features/Training/WeeklyPlans/Pages/weekly-plans.page/weekly-plans.page')
            .then(c => c.WeeklyPlansPage),
        data: { title: 'My Weekly Plan', selfMode: true },
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
      {
        path: 'my/measures',
        canActivate: [roleGuard(PERMISSIONS.PROGRESS_SELF)],
        loadComponent: () =>
          import('./features/Progress/Meansures/Pages/meansures.page/meansures.page')
            .then(c => c.MeansuresPage),
        data: { title: 'My Measures' },
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
        path: 'manage/training/routines/:id',
        canActivate: [roleGuard(PERMISSIONS.TRAINING_MANAGE)],
        loadComponent: () =>
          import('./features/Training/Routines/Pages/routine-detail.page/routine-detail.page')
            .then(c => c.RoutineDetailPage),
        data: { title: 'Routine Detail' },
      },
      {
        path: 'manage/training/exercises',
        canActivate: [roleGuard(PERMISSIONS.TRAINING_MANAGE)],
        loadComponent: () =>
          import('./features/Training/Exercises/Pages/exercises.page/exercises.page')
            .then(c => c.ExercisesPage),
        data: { title: 'Manage Exercises' },
      },
      {
        path: 'manage/training/weekly-plans',
        canActivate: [roleGuard(PERMISSIONS.TRAINING_MANAGE)],
        loadComponent: () =>
          import('./features/Training/WeeklyPlans/Pages/weekly-plans.page/weekly-plans.page')
            .then(c => c.WeeklyPlansPage),
        data: { title: 'Weekly Training Plans' },
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
        path: 'manage/progress/reports',
        canActivate: [roleGuard(PERMISSIONS.PROGRESS_MANAGE)],
        loadComponent: () =>
          import('./features/Progress/Reports/Pages/report.page/report.page')
            .then(c => c.ReportPage),
        data: { title: 'Manage Reports' },
      },
      {
        path: 'manage/progress/measures',
        canActivate: [roleGuard(PERMISSIONS.PROGRESS_MANAGE)],
        loadComponent: () =>
          import('./features/Progress/Meansures/Pages/client-measures.page/client-measures.page')
            .then(c => c.ClientMeasuresPage),
        data: { title: 'Client Measures' },
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
      {
        path: 'owner/coach-management',
        canActivate: [roleGuard(PERMISSIONS.OWNER_ADMINS)],
        loadComponent: () =>
          import('./features/OwnerAdmin/Components/coach-management/coach-management.component')
            .then(c => c.CoachManagementComponent),
        data: { title: 'Coach Management' },
      },
      {
        path: 'owner/client-management',
        canActivate: [roleGuard(PERMISSIONS.OWNER_ADMINS)],
        loadComponent: () =>
          import('./features/OwnerAdmin/Components/client-management/client-management.component')
            .then(c => c.ClientManagementComponent),
        data: { title: 'Client Management' },
      },
    ],
  },

  // =========================================================
  // FALLBACK
  // =========================================================
  { path: '**', redirectTo: '' },
];
