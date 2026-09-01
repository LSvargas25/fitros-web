import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ClientMeasuresPage } from './client-measures.page';
import { ClientProfileService, PhysicalMeasure } from '../../../services/client-profile.service';
import { provideTestIcons } from '../../../../../../testing/test-icons';

const measures: PhysicalMeasure[] = [
  { id: 'm2', weight: 79, bodyFatPercentage: 17, muscleMass: 35, waist: 82, chest: 99, arms: 35, recordedAt: '2026-02-10T08:00:00Z' },
  { id: 'm1', weight: 82, bodyFatPercentage: 20, muscleMass: 33, waist: 88, chest: 100, arms: 34, recordedAt: '2026-01-05T08:00:00Z' },
];

describe('ClientMeasuresPage', () => {
  let component: ClientMeasuresPage;
  let fixture: ComponentFixture<ClientMeasuresPage>;
  let profiles: jasmine.SpyObj<ClientProfileService>;

  beforeEach(async () => {
    profiles = jasmine.createSpyObj('ClientProfileService', ['getMyClients', 'getMeasures']);
    profiles.getMyClients.and.returnValue(of([
      { clientProfileId: 'cp1', clientUserId: 'u1', email: 'a@b.c', firstName: 'Ana', lastName: 'R', clientProfileCreatedAtUtc: '', lastMeasureRecordedAtUtc: null, lastWeight: null },
    ]));
    profiles.getMeasures.and.returnValue(of(measures));

    await TestBed.configureTestingModule({
      imports: [ClientMeasuresPage],
      providers: [{ provide: ClientProfileService, useValue: profiles }, ...provideTestIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientMeasuresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('loads the coach/admin client list on init, no measures until a client is picked', () => {
    expect(profiles.getMyClients).toHaveBeenCalled();
    expect(profiles.getMeasures).not.toHaveBeenCalled();
    expect(text()).toContain('Elige un cliente');
  });

  it('loads that client\'s measure history when one is chosen', () => {
    component.selectedClientId.set('cp1');
    component.onClientChange();
    expect(profiles.getMeasures).toHaveBeenCalledWith('cp1');
    expect(component.measures()).toEqual(measures);
    expect(component.isLoading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('exposes the most recent measure as `latest` (backend returns newest-first)', () => {
    component.selectedClientId.set('cp1');
    component.onClientChange();
    expect(component.latest()?.id).toBe('m2');
  });

  it('shows an empty state when the client has no measures', () => {
    profiles.getMeasures.and.returnValue(of([]));
    component.selectedClientId.set('cp1');
    component.onClientChange();
    fixture.detectChanges();
    expect(component.measures()).toEqual([]);
    expect(text()).toContain('Este cliente aún no tiene medidas registradas');
  });

  it('surfaces a load error (not a blank page)', () => {
    profiles.getMeasures.and.returnValue(throwError(() => ({ detail: 'no autorizado', status: 403 })));
    component.selectedClientId.set('cp1');
    component.onClientChange();
    expect(component.error()).toBe('no autorizado');
    expect(component.measures()).toEqual([]);
  });

  it('clearing the client selection resets the view', () => {
    component.selectedClientId.set('cp1');
    component.onClientChange();
    component.selectedClientId.set('');
    component.onClientChange();
    expect(component.measures()).toEqual([]);
    expect(text()).toContain('Elige un cliente');
  });

  it('never calls getMeasures with an empty id', () => {
    component.selectedClientId.set('');
    component.onClientChange();
    expect(profiles.getMeasures).not.toHaveBeenCalled();
  });
});
