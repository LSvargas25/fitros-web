import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutinesPage } from './routines.page';

describe('RoutinesPage', () => {
  let component: RoutinesPage;
  let fixture: ComponentFixture<RoutinesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutinesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutinesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
