import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeansuresPage } from './meansures.page';

describe('MeansuresPage', () => {
  let component: MeansuresPage;
  let fixture: ComponentFixture<MeansuresPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeansuresPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeansuresPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
