import { AppRole } from './session-facade';

export const PERMISSIONS = {
  OWNER_ADMINS: ['OwnerApp'] as AppRole[],

  // ADMIN / COACH AREA
  DASHBOARD: ['OwnerApp', 'Admin', 'Coach'] as AppRole[],
  CLIENTS: ['OwnerApp', 'Admin', 'Coach'] as AppRole[],
  TRAINING_MANAGE: ['OwnerApp', 'Admin', 'Coach'] as AppRole[],
  NUTRITION_MANAGE: ['OwnerApp', 'Admin', 'Coach'] as AppRole[],
  PROGRESS_MANAGE: ['OwnerApp', 'Admin', 'Coach'] as AppRole[],

  // "MY AREA" — personal self-service screens (My Training / Nutrition / Progress /
  // Measures). Only roles that own a personal ClientProfile in the data model:
  // Client always, and Coach (the backend gives each Coach their own personal
  // ClientProfile, separate from the clients they manage). OwnerApp / Admin have
  // no personal profile, so these screens are meaningless for them — kept off both
  // the sidebar and the router.
  MY_AREA: ['Coach', 'Client'] as AppRole[],
  TRAINING_SELF: ['Coach', 'Client'] as AppRole[],
  NUTRITION_SELF: ['Coach', 'Client'] as AppRole[],
  PROGRESS_SELF: ['Coach', 'Client'] as AppRole[],

  // A Coach building / editing the weekly training plan on their OWN CoachSelf
  // profile (same /api/training-plans endpoints, clientProfileId = their own
  // profile id). A Client's weekly plan is assigned *by* their coach — a Client
  // never self-assigns — so this is Coach-only.
  TRAINING_PLAN_SELF: ['Coach'] as AppRole[],

  // Every authenticated user has a User record, so Profile stays open to all roles.
  PROFILE: ['OwnerApp', 'Admin', 'Coach', 'Client'] as AppRole[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
