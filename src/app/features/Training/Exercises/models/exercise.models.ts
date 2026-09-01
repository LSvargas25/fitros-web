// The backend does not register a JsonStringEnumConverter (see FitRos.API/Program.cs), so
// C# enums serialize as their underlying numeric value. Keep these numbers in sync with
// FitRos.Domain.Entities.Enums.MuscleGroup.
export enum MuscleGroup {
  Chest = 1,
  Back = 2,
  Legs = 3,
  Shoulders = 4,
  Arms = 5,
  Core = 6,
  FullBody = 7,
}

export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  [MuscleGroup.Chest]: 'Pecho',
  [MuscleGroup.Back]: 'Espalda',
  [MuscleGroup.Legs]: 'Piernas',
  [MuscleGroup.Shoulders]: 'Hombros',
  [MuscleGroup.Arms]: 'Brazos',
  [MuscleGroup.Core]: 'Core',
  [MuscleGroup.FullBody]: 'Cuerpo completo',
};

/** Ordered list for <select> options and filter chips. */
export const MUSCLE_GROUP_OPTIONS: ReadonlyArray<{ value: MuscleGroup; label: string }> = [
  MuscleGroup.Chest,
  MuscleGroup.Back,
  MuscleGroup.Legs,
  MuscleGroup.Shoulders,
  MuscleGroup.Arms,
  MuscleGroup.Core,
  MuscleGroup.FullBody,
].map((value) => ({ value, label: MUSCLE_GROUP_LABEL[value] }));

/** Item shape returned by GET /api/exercises (ExerciseListItemDto). */
export interface ExerciseListItem {
  id: string;
  name: string;
  category: MuscleGroup;
}

/** Full shape returned by GET /api/exercises/{id} (ExerciseDto). */
export interface ExerciseDetail {
  id: string;
  name: string;
  description: string;
  category: MuscleGroup;
}

/** Body for POST /api/exercises (CreateExerciseCommand). */
export interface CreateExercisePayload {
  name: string;
  description: string;
  category: MuscleGroup;
}

/** Body for PUT /api/exercises/{id} (UpdateExerciseCommand) — id must match the route. */
export interface UpdateExercisePayload extends CreateExercisePayload {
  id: string;
}
