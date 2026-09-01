// Keep in sync with FitRos.Domain.Entities.Enums.FoodCategory. The backend has no
// JsonStringEnumConverter, so the enum crosses the wire as its numeric value.
export enum FoodCategory {
  Uncategorized = 0,
  Protein = 1,
  Carbohydrate = 2,
  Vegetable = 3,
  Fruit = 4,
  Dairy = 5,
  Fat = 6,
  Beverage = 7,
  Snack = 8,
  Supplement = 9,
}

export const FOOD_CATEGORY_LABEL: Record<FoodCategory, string> = {
  [FoodCategory.Uncategorized]: 'Sin categoría',
  [FoodCategory.Protein]: 'Proteína',
  [FoodCategory.Carbohydrate]: 'Carbohidrato',
  [FoodCategory.Vegetable]: 'Verdura',
  [FoodCategory.Fruit]: 'Fruta',
  [FoodCategory.Dairy]: 'Lácteo',
  [FoodCategory.Fat]: 'Grasa',
  [FoodCategory.Beverage]: 'Bebida',
  [FoodCategory.Snack]: 'Snack',
  [FoodCategory.Supplement]: 'Suplemento',
};

export const FOOD_CATEGORY_OPTIONS: ReadonlyArray<{ value: FoodCategory; label: string }> = [
  FoodCategory.Protein,
  FoodCategory.Carbohydrate,
  FoodCategory.Vegetable,
  FoodCategory.Fruit,
  FoodCategory.Dairy,
  FoodCategory.Fat,
  FoodCategory.Beverage,
  FoodCategory.Snack,
  FoodCategory.Supplement,
  FoodCategory.Uncategorized,
].map((value) => ({ value, label: FOOD_CATEGORY_LABEL[value] }));

/** GET /api/foods — FoodListItemDto (macros per 100 g). */
export interface FoodListItem {
  id: string;
  name: string;
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

/** GET /api/foods/{id} — FoodDto. */
export interface FoodDetail extends FoodListItem {
  servingSizeGrams: number | null;
  isArchived: boolean;
}

/** Body for POST /api/foods (CreateFoodCommand). */
export interface CreateFoodPayload {
  name: string;
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingSizeGrams: number | null;
}

/** Body for PUT /api/foods/{id} (UpdateFoodCommand) — id must match the route. */
export interface UpdateFoodPayload extends CreateFoodPayload {
  id: string;
}
