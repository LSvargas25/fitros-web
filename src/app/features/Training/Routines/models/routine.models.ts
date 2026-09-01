// Keep in sync with FitRos.Domain.Enums.RoutineStatus. The backend has no
// JsonStringEnumConverter, but note the two DTOs disagree: the *list* endpoint
// returns Status as a string ("Draft" | "Published" | "Archived"), while the
// *detail* endpoint returns it as this numeric value.
export enum RoutineStatus {
  Draft = 1,
  Published = 2,
  Archived = 3,
}

export const ROUTINE_STATUS_LABEL: Record<RoutineStatus, string> = {
  [RoutineStatus.Draft]: 'Borrador',
  [RoutineStatus.Published]: 'Publicada',
  [RoutineStatus.Archived]: 'Archivada',
};

export const ROUTINE_STATUS_OPTIONS: ReadonlyArray<{ value: RoutineStatus; label: string }> = [
  RoutineStatus.Draft,
  RoutineStatus.Published,
  RoutineStatus.Archived,
].map((value) => ({ value, label: ROUTINE_STATUS_LABEL[value] }));

/** Maps the list endpoint's string status onto the enum. */
export function routineStatusFromName(name: string): RoutineStatus | null {
  switch (name) {
    case 'Draft':
      return RoutineStatus.Draft;
    case 'Published':
      return RoutineStatus.Published;
    case 'Archived':
      return RoutineStatus.Archived;
    default:
      return null;
  }
}

/** GET /api/workoutroutines — WorkoutRoutineListItem (status is a STRING here). */
export interface RoutineListItem {
  id: string;
  name: string;
  version: number;
  status: string;
}

/**
 * GET /api/workoutroutines/{id}/versions — WorkoutRoutineVersionListItem, one row
 * per version in the routine group, newest version first. `status` is the numeric
 * `RoutineStatus` here (the detail endpoint's convention, not the list's string).
 */
export interface RoutineVersionListItem {
  id: string;
  routineGroupId: string;
  version: number;
  status: RoutineStatus;
  createdAt: string;
}

/**
 * One exercise slot inside a routine (WorkoutRoutineExerciseDetailsDto).
 * The routine holds a flat, `order`-sorted list — there is no per-day grouping
 * on the routine model (day-partitioning lives in WeeklyTrainingPlan).
 */
export interface RoutineExercise {
  exerciseId: string;
  order: number;
  suggestedSets: number;
  suggestedReps: number;
  suggestedRestSeconds: number;
}

/** GET /api/workoutroutines/{id} — WorkoutRoutineDetailsDto (status is an INT here). */
export interface RoutineDetail {
  id: string;
  name: string;
  description: string;
  status: number;
  version: number;
  exercises: RoutineExercise[];
}

/** Body for POST and PUT /api/workoutroutines (CreateWorkoutRoutineCommand / UpdateWorkoutRoutineCommand). */
export interface RoutinePayload {
  name: string;
  description: string;
}

/** Body for POST /api/workoutroutines/{id}/exercises (AddExerciseToWorkoutRoutineCommand). */
export interface AddRoutineExercisePayload {
  workoutRoutineId: string;
  exerciseId: string;
  order: number;
  suggestedSets: number;
  suggestedReps: number;
  suggestedRestSeconds: number;
}
