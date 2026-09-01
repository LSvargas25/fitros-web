import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { NutritioplanPage } from './nutritioplan.page';
import { ClientProfileService } from '../../../../Progress/services/client-profile.service';
import { FoodService } from '../../../Food/services/food.service';
import { MealPlanService } from '../../services/meal-plan.service';
import { MealPlanDetail, MealPlanStatus, MealType } from '../../models/meal-plan.models';
import { provideTestIcons } from '../../../../../../testing/test-icons';

const plan: MealPlanDetail = {
  id: 'mp1', clientProfileId: 'cp1', coachId: 'co1', name: 'Plan A',
  status: MealPlanStatus.Draft, createdAt: '2026-08-01T00:00:00Z',
  totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
  entries: [
    { id: 'e2', order: 2, day: 1, meal: MealType.Breakfast, foodId: 'f2', foodName: 'Huevo', quantityGrams: 60, calories: 90, protein: 8, carbs: 1, fat: 6 },
    { id: 'e1', order: 1, day: 1, meal: MealType.Breakfast, foodId: 'f1', foodName: 'Avena', quantityGrams: 80, calories: 311, protein: 13, carbs: 53, fat: 6 },
  ],
};

describe('NutritioplanPage', () => {
  let component: NutritioplanPage;
  let fixture: ComponentFixture<NutritioplanPage>;
  let mealPlans: jasmine.SpyObj<MealPlanService>;
  let profiles: jasmine.SpyObj<ClientProfileService>;
  let foods: jasmine.SpyObj<FoodService>;

  beforeEach(async () => {
    profiles = jasmine.createSpyObj('ClientProfileService', ['getMyClients']);
    foods = jasmine.createSpyObj('FoodService', ['list']);
    mealPlans = jasmine.createSpyObj('MealPlanService', [
      'getClientPlans', 'getById', 'create', 'rename', 'activate', 'archive', 'addEntry', 'removeEntry', 'moveEntry',
    ]);
    profiles.getMyClients.and.returnValue(of([
      { clientProfileId: 'cp1', clientUserId: 'u1', email: 'a@b.c', firstName: 'Ana', lastName: 'R', clientProfileCreatedAtUtc: '', lastMeasureRecordedAtUtc: null, lastWeight: null },
    ]));
    foods.list.and.returnValue(of([]));
    mealPlans.getClientPlans.and.returnValue(of([]));
    mealPlans.getById.and.returnValue(of(plan));

    await TestBed.configureTestingModule({
      imports: [NutritioplanPage],
      providers: [
        { provide: ClientProfileService, useValue: profiles },
        { provide: FoodService, useValue: foods },
        { provide: MealPlanService, useValue: mealPlans },
        provideRouter([]),
        ...provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NutritioplanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load clients + foods', () => {
    expect(component).toBeTruthy();
    expect(profiles.getMyClients).toHaveBeenCalled();
    expect(foods.list).toHaveBeenCalled();
  });

  /** Drive the component into the "client selected + plan open" state where the add-entry form renders. */
  function openPlanView(): void {
    component.selectedClientId.set('cp1');
    component.onClientChange();
    component.selectPlan('mp1');
    fixture.detectChanges();
  }

  it('marks the catalogue as loaded-but-empty (no error) when the food list comes back empty', () => {
    // default beforeEach stubs foods.list -> of([])
    expect(component.foodsLoaded()).toBeTrue();
    expect(component.foods()).toEqual([]);
    expect(component.foodsError()).toBeNull();

    openPlanView();
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('Aún no hay alimentos en el catálogo');
  });

  it('sets a distinct error (not silently swallowed) when the food catalogue fails to load', () => {
    foods.list.and.returnValue(throwError(() => ({ detail: 'catálogo caído' })));

    const f = TestBed.createComponent(NutritioplanPage);
    f.detectChanges();
    const c = f.componentInstance;
    c.selectedClientId.set('cp1');
    c.onClientChange();
    c.selectPlan('mp1');
    f.detectChanges();

    expect(c.foodsLoaded()).toBeTrue();
    expect(c.foodsError()).toBe('catálogo caído');
    expect((f.nativeElement as HTMLElement).textContent).toContain('catálogo caído');
  });

  it('disables the add-entry button while the catalogue is empty', () => {
    openPlanView();

    const addBtn = Array.from(
      fixture.nativeElement.querySelectorAll('button.btn-brand') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Agregar'));
    expect(addBtn).withContext('add-entry button rendered').toBeTruthy();
    expect(addBtn!.disabled).toBeTrue();
  });

  it('loads plans when a client is chosen', () => {
    component.selectedClientId.set('cp1');
    component.onClientChange();
    expect(mealPlans.getClientPlans).toHaveBeenCalledWith('cp1');
  });

  it('creates a plan and opens it', () => {
    component.selectedClientId.set('cp1');
    mealPlans.create.and.returnValue(of({ id: 'mp1' }));
    component.newPlanName.set(' Plan A ');
    component.createPlan();
    expect(mealPlans.create).toHaveBeenCalledWith('cp1', 'Plan A');
    expect(mealPlans.getById).toHaveBeenCalledWith('mp1');
  });

  it('groups a selected plan by day then meal, ordering entries by `order`', () => {
    component.selectPlan('mp1');
    expect(component.days().length).toBe(1);
    expect(component.days()[0].meals[0].meal).toBe(MealType.Breakfast);
    expect(component.days()[0].meals[0].entries.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('moveEntry() sends the target slot position and reloads', () => {
    component.selectPlan('mp1');
    mealPlans.getById.calls.reset();
    mealPlans.moveEntry.and.returnValue(of(undefined));

    // e1 is first (order 1); move it down -> takes e2's position (order 2)
    component.moveEntry(plan.entries.find((e) => e.id === 'e1')!, 1);

    expect(mealPlans.moveEntry).toHaveBeenCalledWith('mp1', 'e1', 2);
    expect(mealPlans.getById).toHaveBeenCalledWith('mp1');
  });

  it('moveEntry() is a no-op at the slot boundary', () => {
    component.selectPlan('mp1');
    // e1 is already first in its slot
    component.moveEntry(plan.entries.find((e) => e.id === 'e1')!, -1);
    expect(mealPlans.moveEntry).not.toHaveBeenCalled();
  });

  it('moveEntry() surfaces the backend error', () => {
    component.selectPlan('mp1');
    mealPlans.moveEntry.and.returnValue(throwError(() => ({ detail: 'no se pudo' })));
    component.moveEntry(plan.entries.find((e) => e.id === 'e2')!, -1);
    expect(component.planError()).toBe('no se pudo');
    expect(component.movingEntryId()).toBeNull();
  });

  it('validates the add-entry form', () => {
    component.selectPlan('mp1');
    component.addEntry();
    expect(component.entryError()).toBeTruthy();
    expect(mealPlans.addEntry).not.toHaveBeenCalled();
  });

  it('adds an entry with the chosen day / meal / food / grams', () => {
    component.selectPlan('mp1');
    mealPlans.addEntry.and.returnValue(of(undefined));
    component.entryDay.set(2);
    component.entryMeal.set(MealType.Lunch);
    component.entryFoodId.set('f9');
    component.entryGrams.set(120);
    component.addEntry();
    expect(mealPlans.addEntry).toHaveBeenCalledWith('mp1', { day: 2, meal: MealType.Lunch, foodId: 'f9', quantityGrams: 120 });
  });

  it('shows the backend error when loading plans fails', () => {
    mealPlans.getClientPlans.and.returnValue(throwError(() => ({ detail: 'nope' })));
    component.selectedClientId.set('cp1');
    component.onClientChange();
    expect(component.plansError()).toBe('nope');
  });
});
