// The backend does not register a JsonStringEnumConverter, so C# enums serialize as their
// underlying numeric value (see FitRos.API/Program.cs). Keep these numbers in sync with
// FitRos.Domain.Enums.WorkoutSessionStatus.
export enum WorkoutSessionStatus {
  Scheduled = 1,
  InProgress = 2,
  Completed = 3,
  Skipped = 4,
}

export const WORKOUT_SESSION_STATUS_LABEL: Record<WorkoutSessionStatus, string> = {
  [WorkoutSessionStatus.Scheduled]: 'Programado',
  [WorkoutSessionStatus.InProgress]: 'En progreso',
  [WorkoutSessionStatus.Completed]: 'Completado',
  [WorkoutSessionStatus.Skipped]: 'Saltado',
};

export interface ExerciseSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  repsAchieved: number;
  weightUsed: number;
}

export interface SuggestedExercise {
  exerciseId: string;
  order: number;
  suggestedSets: number;
  suggestedReps: number;
  suggestedRestSeconds: number;
}

export interface WorkoutSessionDetails {
  id: string;
  routineId: string;
  routineNameSnapshot: string;
  routineVersion: number;
  scheduledDate: string;
  status: WorkoutSessionStatus;
  sets: ExerciseSet[];
  suggestedExercises: SuggestedExercise[];
}

export interface WorkoutSessionListItem {
  id: string;
  scheduledDate: string;
  routineNameSnapshot: string;
  status: WorkoutSessionStatus;
  totalSets: number;
}

export interface AddSetRequest {
  exerciseId: string;
  setNumber: number;
  repsAchieved: number;
  weightUsed: number;
}

export interface ExerciseListItem {
  id: string;
  name: string;
  category: number;
}

export interface RoutineListItem {
  id: string;
  name: string;
  version: number;
  status: string;
}

// ── Client's own weekly training plan (GET /api/my/training-plans) ───────────
// Keep TrainingPlanStatus in sync with FitRos.Domain.Entities.Enums.TrainingPlanStatus.
export enum TrainingPlanStatus {
  Draft = 1,
  Active = 2,
  Archived = 3,
}

/** GET /api/my/training-plans — TrainingPlanListItemDto */
export interface MyTrainingPlanListItem {
  id: string;
  name: string;
  status: TrainingPlanStatus;
  dayCount: number;
  createdAt: string;
}

/** One day of a weekly plan (TrainingPlanDayDto). `day` is a System.DayOfWeek: Sun 0…Sat 6. */
export interface MyTrainingPlanDay {
  id: string;
  day: number;
  workoutRoutineId: string;
  workoutRoutineName: string;
  notes: string | null;
}

/** GET /api/my/training-plans/{id} — WeeklyTrainingPlanDto */
export interface MyTrainingPlanDetail {
  id: string;
  clientProfileId: string;
  coachId: string;
  name: string;
  status: TrainingPlanStatus;
  createdAt: string;
  days: MyTrainingPlanDay[];
}

/** A routine the client can start a session from, sourced from their assigned plan. */
export interface AssignedRoutineOption {
  id: string;
  name: string;
}
