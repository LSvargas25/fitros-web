

import { PermissionKey } from '../../../Core/Auth/route-permissions';

export type NavItem =
  | {
      kind: 'link';
      label: string;
      route: string;
      permission?: PermissionKey;
      activeStartsWith?: string;
    }
  | {
      kind: 'group';
      key: string;
      label: string;
      permission?: PermissionKey;
      items: Array<{
        label: string;
        route: string;
        permission?: PermissionKey;
        activeStartsWith?: string;
        accent?: 'default' | 'success' | 'warning';
      }>;
    }
  | {
      kind: 'divider';
    };

export const NAV_ITEMS: NavItem[] = [
  {
    kind: 'link',
    label: 'Dashboard',
    route: '/dashboard',
  },

  { kind: 'divider' },

  // =========================
  // CLIENT SELF AREA
  // =========================
  {
    kind: 'group',
    key: 'self',
    label: 'My Area',
    items: [
      {
        label: 'My Training',
        route: '/my/training',
        permission: 'TRAINING_SELF',
      },
      {
        label: 'My Nutrition',
        route: '/my/nutrition',
        permission: 'NUTRITION_SELF',
      },
      {
        label: 'My Progress',
        route: '/my/progress',
        permission: 'PROGRESS_SELF',
      },
    ],
  },

  { kind: 'divider' },

  // =========================
  // BACKOFFICE
  // =========================
  {
    kind: 'group',
    key: 'clients',
    label: 'Clients',
    permission: 'CLIENTS',
    items: [
      {
        label: 'View Clients',
        route: '/clients',
        permission: 'CLIENTS',
      },
      {
        label: '+ Add New Client',
        route: '/clients/new',
        permission: 'CLIENTS',
        accent: 'success',
      },
    ],
  },

  {
    kind: 'group',
    key: 'training',
    label: 'Training (Manage)',
    permission: 'TRAINING_MANAGE',
    items: [
      {
        label: 'Routines',
        route: '/manage/training/routines',
        permission: 'TRAINING_MANAGE',
      },
      {
        label: 'Exercises',
        route: '/manage/training/exercises',
        permission: 'TRAINING_MANAGE',
      },
    ],
  },

  {
    kind: 'group',
    key: 'nutrition',
    label: 'Nutrition (Manage)',
    permission: 'NUTRITION_MANAGE',
    items: [
      {
        label: 'Foods',
        route: '/manage/nutrition/foods',
        permission: 'NUTRITION_MANAGE',
      },
      {
        label: 'Meal Plans',
        route: '/manage/nutrition/meal-plans',
        permission: 'NUTRITION_MANAGE',
      },
    ],
  },

  {
    kind: 'group',
    key: 'progress',
    label: 'Progress (Manage)',
    permission: 'PROGRESS_MANAGE',
    items: [
      {
        label: 'Measures',
        route: '/manage/progress/measures',
        permission: 'PROGRESS_MANAGE',
      },
      {
        label: 'Reports',
        route: '/manage/progress/reports',
        permission: 'PROGRESS_MANAGE',
      },
    ],
  },

  { kind: 'divider' },

  {
    kind: 'link',
    label: 'Profile',
    route: '/profile',
    permission: 'PROFILE',
  },

  {
    kind: 'group',
    key: 'owner',
    label: 'Owner Panel',
    permission: 'OWNER_ADMINS',
    items: [
      {
        label: 'Dashboard',
        route: '/owner-admins',
        permission: 'OWNER_ADMINS',
      },
      {
        label: 'Admin Management',
        route: '/owner/admin-management',
        permission: 'OWNER_ADMINS',
      },
    ],
  },
];
