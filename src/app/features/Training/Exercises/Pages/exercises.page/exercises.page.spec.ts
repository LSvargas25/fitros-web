import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExercisesPage } from './exercises.page';

describe('ExercisesPage', () => {
  let component: ExercisesPage;
  let fixture: ComponentFixture<ExercisesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExercisesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExercisesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
