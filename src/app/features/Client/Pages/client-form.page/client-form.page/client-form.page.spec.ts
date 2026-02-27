import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientFormPage } from './client-form.page';

describe('ClientFormPage', () => {
  let component: ClientFormPage;
  let fixture: ComponentFixture<ClientFormPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientFormPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientFormPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
