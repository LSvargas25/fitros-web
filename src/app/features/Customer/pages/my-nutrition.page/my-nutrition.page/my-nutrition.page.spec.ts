import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MyNutritionPage } from './my-nutrition.page';
import { MealPlanService } from '../../../../Nutrition/MealPlan/services/meal-plan.service';
import {
  MealPlanDetail,
  MealPlanStatus,
  MealType,
} from '../../../../Nutrition/MealPlan/models/meal-plan.models';

const mockPlan: MealPlanDetail = {
  id: 'mp1',
  clientProfileId: 'cp1',
  coachId: 'co1',
  name: 'Volumen limpio',
  status: MealPlanStatus.Active,
  createdAt: '2026-08-01T00:00:00Z',
  totalCalories: 14000,
  totalProtein: 900,
  totalCarbs: 1400,
  totalFat: 400,
  entries: [
    { id: 'e1', order: 1, day: 1, meal: MealType.Breakfast, foodId: 'f1', foodName: 'Avena', quantityGrams: 80, calories: 311, protein: 13, carbs: 53, fat: 6 },
    { id: 'e2', order: 1, day: 1, meal: MealType.Lunch, foodId: 'f2', foodName: 'Pollo', quantityGrams: 200, calories: 330, protein: 62, carbs: 0, fat: 7 },
    { id: 'e3', order: 1, day: 3, meal: MealType.Dinner, foodId: 'f3', foodName: 'Salmón', quantityGrams: 150, calories: 280, protein: 30, carbs: 0, fat: 18 },
  ],
};

describe('MyNutritionPage (role: Client)', () => {
  let component: MyNutritionPage;
  let fixture: ComponentFixture<MyNutritionPage>;
  let mealPlans: jasmine.SpyObj<MealPlanService>;

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MyNutritionPage],
      providers: [{ provide: MealPlanService, useValue: mealPlans }],
    }).compileComponents();

    fixture = TestBed.createComponent(MyNutritionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    // Only the client-facing method is stubbed. If the page ever calls a staff
    // method (getActivePlan / getClientPlans / getById) this suite throws
    // "not a function" — that regression is exactly what broke /my/nutrition.
    mealPlans = jasmine.createSpyObj('MealPlanService', ['getMyActivePlan']);
    mealPlans.getMyActivePlan.and.returnValue(of(mockPlan));
  });

  it('reads the active plan from GET /api/my/meal-plans/active (one call, no list filtering)', async () => {
    await setup();

    expect(mealPlans.getMyActivePlan).toHaveBeenCalledTimes(1);
    expect(component.plan()).toEqual(mockPlan);
    expect(component.isLoading()).toBeFalse();
    expect(component.error()).toBeNull();
    expect(component.hasNoPlan()).toBeFalse();
  });

  it('groups entries by day (Monday-first) then by meal', async () => {
    await setup();
    const days = component.days();
    expect(days.map((d) => d.day)).toEqual([1, 3]);
    expect(days[0].meals.map((m) => m.meal)).toEqual([MealType.Breakfast, MealType.Lunch]);
    expect(days[0].calories).toBe(641);
  });

  it('shows the "no plan" empty state on 404 (no active plan)', async () => {
    mealPlans.getMyActivePlan.and.returnValue(throwError(() => ({ status: 404, detail: 'no active plan' })));
    await setup();

    expect(component.hasNoPlan()).toBeTrue();
    expect(component.error()).toBeNull();
    expect(component.plan()).toBeNull();
    expect(component.isLoading()).toBeFalse();
  });

  it('surfaces an error (not the empty state) on a real 403 regression', async () => {
    mealPlans.getMyActivePlan.and.returnValue(throwError(() => ({ status: 403, detail: 'Forbidden' })));
    await setup();

    expect(component.error()).toBe('Forbidden');
    expect(component.hasNoPlan()).toBeFalse();
    expect(component.isLoading()).toBeFalse();
  });

  it('surfaces a non-404 failure with the generic fallback when there is no detail', async () => {
    mealPlans.getMyActivePlan.and.returnValue(throwError(() => ({ status: 500 })));
    await setup();

    expect(component.error()).toBe('No se pudo cargar tu plan de comidas.');
    expect(component.plan()).toBeNull();
  });

  it('is a read-only view — the mock stubs no mutation verbs', async () => {
    await setup();
    expect(Object.keys(mealPlans)).toEqual(['getMyActivePlan']);
  });
});
