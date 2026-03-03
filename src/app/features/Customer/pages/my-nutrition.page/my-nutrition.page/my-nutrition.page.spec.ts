import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyNutritionPage } from './my-nutrition.page';

describe('MyNutritionPage', () => {
  let component: MyNutritionPage;
  let fixture: ComponentFixture<MyNutritionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyNutritionPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyNutritionPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
