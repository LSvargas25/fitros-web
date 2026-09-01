import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MeansuresPage } from './meansures.page';
import { ClientProfileService, PhysicalMeasure } from '../../../services/client-profile.service';
import { provideTestIcons } from '../../../../../../testing/test-icons';

const mockMeasures: PhysicalMeasure[] = [
  { id: 'm1', weight: 80, bodyFatPercentage: 18, muscleMass: 35, waist: 85, chest: 100, arms: 35, recordedAt: '2026-02-01T00:00:00Z' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

describe('MeansuresPage', () => {
  let component: MeansuresPage;
  let fixture: ComponentFixture<MeansuresPage>;
  let svc: jasmine.SpyObj<ClientProfileService>;

  beforeEach(async () => {
    svc = jasmine.createSpyObj('ClientProfileService', ['getMyMeasurements', 'addMyMeasurement']);
    svc.getMyMeasurements.and.returnValue(of(mockMeasures));

    await TestBed.configureTestingModule({
      imports: [MeansuresPage],
      providers: [{ provide: ClientProfileService, useValue: svc }, ...provideTestIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(MeansuresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the measure history via GET /api/my/measurements — no /me hop', () => {
    expect(svc.getMyMeasurements).toHaveBeenCalled();
    expect(component.measures()).toEqual(mockMeasures);
    expect(component.isLoading()).toBeFalse();
  });

  it('surfaces a history load failure', () => {
    svc.getMyMeasurements.and.returnValue(throwError(() => ({ detail: 'No autorizado', status: 403 })));
    component['loadMeasures']();
    expect(component.error()).toBe('No autorizado');
    expect(component.isLoading()).toBeFalse();
  });

  it('requires a positive weight below 500', () => {
    component.weight.set(null);
    component.addMeasure();
    expect(component.saveError()).toBeTruthy();

    component.weight.set(600);
    component.addMeasure();
    expect(component.saveError()).toContain('500');
    expect(svc.addMyMeasurement).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range body-fat %', () => {
    component.weight.set(80);
    component.bodyFatPercentage.set(120);
    component.addMeasure();
    expect(component.saveError()).toContain('100');
    expect(svc.addMyMeasurement).not.toHaveBeenCalled();
  });

  it('rejects a future date', () => {
    component.weight.set(80);
    component.recordedOn.set('2099-01-01');
    component.addMeasure();
    expect(component.saveError()).toContain('futura');
    expect(svc.addMyMeasurement).not.toHaveBeenCalled();
  });

  it('for today\'s date: POSTs without recordedAt (server stamps now) and reloads', () => {
    svc.addMyMeasurement.and.returnValue(of(undefined));
    component.weight.set(79);
    component.recordedOn.set(todayIso());
    component.addMeasure();

    const dto = svc.addMyMeasurement.calls.mostRecent().args[0];
    expect(dto).toEqual({ weight: 79, bodyFatPercentage: 0, muscleMass: 0, waist: 0, chest: 0, arms: 0 });
    expect('recordedAt' in dto).toBeFalse();
    expect(svc.getMyMeasurements).toHaveBeenCalledTimes(2);
  });

  it('for a past date: POSTs recordedAt as an ISO-8601 UTC instant', () => {
    svc.addMyMeasurement.and.returnValue(of(undefined));
    component.weight.set(79);
    component.recordedOn.set('2026-08-20');
    component.addMeasure();

    const dto = svc.addMyMeasurement.calls.mostRecent().args[0];
    expect(dto.recordedAt).toBe('2026-08-20T12:00:00Z');
  });

  it('shows the backend error detail when saving fails', () => {
    svc.addMyMeasurement.and.returnValue(throwError(() => ({ detail: 'Fecha demasiado antigua', status: 400 })));
    component.weight.set(79);
    component.addMeasure();
    expect(component.saveError()).toBe('Fecha demasiado antigua');
    expect(component.isSaving()).toBeFalse();
  });
});
