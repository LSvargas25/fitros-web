import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrincipalOwnerPage } from './principal-owner.page';

describe('PrincipalOwnerPage', () => {
  let component: PrincipalOwnerPage;
  let fixture: ComponentFixture<PrincipalOwnerPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalOwnerPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrincipalOwnerPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
