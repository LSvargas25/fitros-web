import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NutritioplanPage } from './nutritioplan.page';

describe('NutritioplanPage', () => {
  let component: NutritioplanPage;
  let fixture: ComponentFixture<NutritioplanPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutritioplanPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NutritioplanPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
