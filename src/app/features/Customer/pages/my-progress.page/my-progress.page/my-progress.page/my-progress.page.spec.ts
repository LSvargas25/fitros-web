import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProgressPage } from './my-progress.page';

describe('MyProgressPage', () => {
  let component: MyProgressPage;
  let fixture: ComponentFixture<MyProgressPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyProgressPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyProgressPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
