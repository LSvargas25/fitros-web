// Keep in sync with the FitRos backend enums. No JsonStringEnumConverter, so all of
// these cross the wire as numbers.

/** FitRos.Domain.Entities.Enums.MealPlanStatus */
export enum MealPlanStatus {
  Draft = 0,
  Active = 1,
  Archived = 2,
}

export const MEAL_PLAN_STATUS_LABEL: Record<MealPlanStatus, string> = {
  [MealPlanStatus.Draft]: 'Borrador',
  [MealPlanStatus.Active]: 'Activo',
  [MealPlanStatus.Archived]: 'Archivado',
};

/** FitRos.Domain.Entities.Enums.MealType */
export enum MealType {
  Breakfast = 1,
  Lunch = 2,
  Dinner = 3,
  Snack = 4,
}

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  [MealType.Breakfast]: 'Desayuno',
  [MealType.Lunch]: 'Almuerzo',
  [MealType.Dinner]: 'Cena',
  [MealType.Snack]: 'Snack',
};

export const MEAL_TYPE_ORDER: readonly MealType[] = [
  MealType.Breakfast,
  MealType.Lunch,
  MealType.Dinner,
  MealType.Snack,
];

export const MEAL_TYPE_OPTIONS = MEAL_TYPE_ORDER.map((value) => ({ value, label: MEAL_TYPE_LABEL[value] }));

/** The `Day` field is a System.DayOfWeek: Sunday = 0 … Saturday = 6. */
export const DAY_LABEL: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

/** Monday-first ordering for display. */
export const DAY_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

export const DAY_OPTIONS = DAY_ORDER.map((value) => ({ value, label: DAY_LABEL[value] }));

/** GET /api/meal-plans/client/{clientProfileId} — MealPlanListItemDto */
export interface MealPlanListItem {
  id: string;
  name: string;
  status: MealPlanStatus;
  entryCount: number;
  createdAt: string;
}

/** One food line inside a meal plan (MealPlanEntryDto) — macros already resolved for the quantity. */
export interface MealPlanEntry {
  id: string;
  /** 1-based position within its (day, meal) slot. Drives the reorder UI. */
  order: number;
  day: number;
  meal: MealType;
  foodId: string;
  foodName: string;
  quantityGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** GET /api/meal-plans/{id} (and .../active) — MealPlanDto */
export interface MealPlanDetail {
  id: string;
  clientProfileId: string;
  coachId: string;
  name: string;
  status: MealPlanStatus;
  createdAt: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entries: MealPlanEntry[];
}
