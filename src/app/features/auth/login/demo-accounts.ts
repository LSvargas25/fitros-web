/**
 * Public demo logins, created on the API by DemoDataSeeder when the deploy
 * runs with Seed__Demo=true. They are meant to be public (shown in the
 * README too), so the password living in the bundle is fine.
 */
export const DEMO_PASSWORD = 'FitRos#2026';

export interface DemoAccount {
  /** Stable id for tests and analytics. */
  key: 'owner' | 'admin' | 'coach' | 'client';
  /** Shown as "Entrar como {label}". */
  label: string;
  /** One-line hint of what this role sees. */
  hint: string;
  /** Lucide icon name (registered in app.config.ts). */
  icon: string;
  email: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { key: 'owner', label: 'Dueño', hint: 'Toda la plataforma', icon: 'crown', email: 'owner@fitros.demo' },
  { key: 'admin', label: 'Admin', hint: 'Gestiona el gimnasio', icon: 'building-2', email: 'admin@fitros.demo' },
  { key: 'coach', label: 'Coach', hint: 'Clientes y rutinas', icon: 'dumbbell', email: 'coach@fitros.demo' },
  { key: 'client', label: 'Cliente', hint: 'Su entrenamiento', icon: 'user', email: 'client@fitros.demo' },
];
