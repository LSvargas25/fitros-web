import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGymModalComponent } from './create-gym-modal.component';

describe('CreateGymModalComponent', () => {
  let component: CreateGymModalComponent;
  let fixture: ComponentFixture<CreateGymModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGymModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGymModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
