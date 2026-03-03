import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyTrainingPage } from './my-training-page';

describe('MyTrainingPage', () => {
  let component: MyTrainingPage;
  let fixture: ComponentFixture<MyTrainingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyTrainingPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyTrainingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
