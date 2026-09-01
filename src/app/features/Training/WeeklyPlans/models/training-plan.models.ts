// Staff-facing weekly training plan DTOs — talks to FitRos.API `TrainingPlansController`
// (`/api/training-plans`). The client-facing shape lives in
// `features/Customer/models/workout-session.models.ts` (`My*` types); keep the two aligned.
//
// The backend has no JsonStringEnumConverter, so enums cross the wire as numbers.

/** Keep in sync with FitRos.Domain.Entities.Enums.TrainingPlanStatus. */
export enum TrainingPlanStatus {
  Draft = 1,
  Active = 2,
  Archived = 3,
}

export const TRAINING_PLAN_STATUS_LABEL: Record<TrainingPlanStatus, string> = {
  [TrainingPlanStatus.Draft]: 'Borrador',
  [TrainingPlanStatus.Active]: 'Activo',
  [TrainingPlanStatus.Archived]: 'Archivado',
};

/** `day` is a System.DayOfWeek: Sunday = 0 … Saturday = 6. */
export const DAY_LABEL: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

/** Monday-first ordering for display; the wire values stay Sun=0..Sat=6. */
export const DAY_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

/** GET /api/training-plans/client/{clientProfileId} — TrainingPlanListItemDto */
export interface TrainingPlanListItem {
  id: string;
  name: string;
  status: TrainingPlanStatus;
  dayCount: number;
  createdAt: string;
}

/**
 * One assigned day of a weekly plan (TrainingPlanDayDto). Backend returns the
 * SAME shape on the staff (`/api/training-plans/{id}`) and client
 * (`/api/my/training-plans/{id}`) reads — see `MyTrainingPlanDay` in
 * `features/Customer/models/workout-session.models.ts`.
 * A day with no entry = rest; there is no "rest" sentinel.
 */
export interface TrainingPlanDay {
  id: string;
  day: number;
  workoutRoutineId: string;
  workoutRoutineName: string;
  notes: string | null;
}

/** GET /api/training-plans/{id} — WeeklyTrainingPlanDto */
export interface WeeklyTrainingPlanDetail {
  id: string;
  clientProfileId: string;
  coachId: string;
  name: string;
  status: TrainingPlanStatus;
  createdAt: string;
  days: TrainingPlanDay[];
}

/** Body for PUT /api/training-plans/{id}/days/{day}. */
export interface AssignTrainingPlanDayPayload {
  workoutRoutineId: string;
  notes: string | null;
}
