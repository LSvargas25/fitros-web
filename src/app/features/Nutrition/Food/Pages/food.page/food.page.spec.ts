import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { FoodPage } from './food.page';
import { FoodService } from '../../services/food.service';
import { FoodCategory, FoodListItem } from '../../models/food.models';

const mockFoods: FoodListItem[] = [
  { id: 'f1', name: 'Pollo', category: FoodCategory.Protein, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { id: 'f2', name: 'Arroz', category: FoodCategory.Carbohydrate, caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
];

describe('FoodPage', () => {
  let component: FoodPage;
  let fixture: ComponentFixture<FoodPage>;
  let foodService: jasmine.SpyObj<FoodService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('FoodService', ['list', 'getById', 'create', 'update', 'archive']);
    spy.list.and.returnValue(of(mockFoods));

    await TestBed.configureTestingModule({
      imports: [FoodPage],
      providers: [{ provide: FoodService, useValue: spy }],
    }).compileComponents();

    foodService = TestBed.inject(FoodService) as jasmine.SpyObj<FoodService>;
    fixture = TestBed.createComponent(FoodPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the catalogue on init', () => {
    expect(foodService.list).toHaveBeenCalledWith(undefined);
    expect(component.foods()).toEqual(mockFoods);
    expect(component.isLoading()).toBeFalse();
  });

  it('passes the category filter to the service', () => {
    component.categoryFilter = FoodCategory.Carbohydrate;
    component.onCategoryFilterChange();
    expect(foodService.list).toHaveBeenCalledWith(FoodCategory.Carbohydrate);
  });

  it('filters visible rows by name', () => {
    component.search = 'arr';
    expect(component.filteredFoods()).toEqual([mockFoods[1]]);
  });

  it('requires name, category and non-negative macros', () => {
    component.openCreate();
    component.formName = 'Avena';
    component.save();
    expect(component.formError()).toBeTruthy();
    expect(foodService.create).not.toHaveBeenCalled();

    component.formCategory = FoodCategory.Carbohydrate;
    component.save();
    expect(component.formError()).toContain('macros');
    expect(foodService.create).not.toHaveBeenCalled();
  });

  it('creates a food with the macro payload and reloads', () => {
    foodService.create.and.returnValue(of({ id: 'f3' }));
    component.openCreate();
    component.formName = ' Avena ';
    component.formCategory = FoodCategory.Carbohydrate;
    component.formCalories = 389;
    component.formProtein = 17;
    component.formCarbs = 66;
    component.formFat = 7;
    component.save();

    expect(foodService.create).toHaveBeenCalledWith({
      name: 'Avena',
      category: FoodCategory.Carbohydrate,
      caloriesPer100g: 389,
      proteinPer100g: 17,
      carbsPer100g: 66,
      fatPer100g: 7,
      servingSizeGrams: null,
    });
    expect(foodService.list).toHaveBeenCalledTimes(2);
  });

  it('sends the route id in the body when updating', () => {
    foodService.getById.and.returnValue(of({ ...mockFoods[0], servingSizeGrams: 150, isArchived: false }));
    foodService.update.and.returnValue(of(undefined));
    component.openEdit(mockFoods[0]);
    component.formName = 'Pollo a la plancha';
    component.save();

    expect(foodService.update.calls.mostRecent().args[0].id).toBe('f1');
    expect(foodService.update.calls.mostRecent().args[0].name).toBe('Pollo a la plancha');
  });

  it('drops an archived food from the table', async () => {
    foodService.archive.and.returnValue(of(undefined));
    spyOn(component['dialog'], 'confirm').and.resolveTo(true);
    await component.archive(mockFoods[0]);
    expect(foodService.archive).toHaveBeenCalledWith('f1');
    expect(component.foods()).toEqual([mockFoods[1]]);
  });
});
