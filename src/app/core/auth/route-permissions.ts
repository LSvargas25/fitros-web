import { AppRole } from './session-facade';

export const PERMISSIONS = {
  OWNER_ADMINS: ['OwnerApp'] as AppRole[],

  // ADMIN / COACH AREA
  CLIENTS: ['OwnerApp', 'Admin', 'Coach'] as AppRole[],
  TRAINING_MANAGE: ['OwnerApp', 'Admin', 'Coach'] as AppRole[],
  NUTRITION_MANAGE: ['OwnerApp', 'Admin', 'Coach'] as AppRole[],
  PROGRESS_MANAGE: ['OwnerApp', 'Admin', 'Coach'] as AppRole[],

  // CLIENT SELF AREA
  TRAINING_SELF: ['OwnerApp', 'Admin', 'Coach', 'Client'] as AppRole[],
  NUTRITION_SELF: ['OwnerApp', 'Admin', 'Coach', 'Client'] as AppRole[],
  PROGRESS_SELF: ['OwnerApp', 'Admin', 'Coach', 'Client'] as AppRole[],

  PROFILE: ['OwnerApp', 'Admin', 'Coach', 'Client'] as AppRole[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
