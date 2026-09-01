import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MyProgressPage } from './my-progress.page';
import { ClientProfileService, PhysicalMeasure } from '../../../../../Progress/services/client-profile.service';
import { ProgressReportService } from '../../../../../Progress/Reports/services/progress-report.service';
import { ProgressReport } from '../../../../../Progress/Reports/models/progress-report.models';
import { provideTestIcons } from '../../../../../../../testing/test-icons';

const mockMeasures: PhysicalMeasure[] = [
  { id: 'm1', weight: 82, bodyFatPercentage: 20, muscleMass: 33, waist: 88, chest: 100, arms: 34, recordedAt: '2026-01-15T00:00:00Z' },
  { id: 'm2', weight: 79, bodyFatPercentage: 18, muscleMass: 34, waist: 85, chest: 100, arms: 35, recordedAt: '2026-02-01T00:00:00Z' },
];

const mockReport: ProgressReport = {
  clientProfileId: 'c1', year: 2026, month: 2,
  periodStartUtc: '2026-02-01T00:00:00Z', periodEndUtc: '2026-03-01T00:00:00Z',
  weight: { current: 79, previous: 82, delta: -3 },
  bodyFatPercentage: { current: 18, previous: 20, delta: -2 },
  waist: { current: 85, previous: 88, delta: -3 },
  completedSets: { current: 40, previous: 30, delta: 10 },
  generatedAtUtc: '2026-02-15T00:00:00Z',
};

describe('MyProgressPage', () => {
  let component: MyProgressPage;
  let fixture: ComponentFixture<MyProgressPage>;
  let profiles: jasmine.SpyObj<ClientProfileService>;
  let reports: jasmine.SpyObj<ProgressReportService>;

  beforeEach(async () => {
    profiles = jasmine.createSpyObj('ClientProfileService', ['getMyMeasurements']);
    reports = jasmine.createSpyObj('ProgressReportService', ['getMyReport']);
    profiles.getMyMeasurements.and.returnValue(of(mockMeasures));
    reports.getMyReport.and.returnValue(of(mockReport));

    await TestBed.configureTestingModule({
      imports: [MyProgressPage],
      providers: [
        { provide: ClientProfileService, useValue: profiles },
        { provide: ProgressReportService, useValue: reports },
        ...provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('loads measures (/api/my/measurements) and the live report (/api/my/progress-report) — no /me hop', () => {
    expect(profiles.getMyMeasurements).toHaveBeenCalled();
    expect(reports.getMyReport).toHaveBeenCalled();
    expect(component.isLoading()).toBeFalse();
  });

  it('builds a weight-trend chart from the measure history', () => {
    const chart = component.chartData();
    expect(chart).not.toBeNull();
    expect(chart!.points.length).toBe(2);
    expect(chart!.minWeight).toBe(79);
    expect(chart!.maxWeight).toBe(82);
  });

  it('no chart when there is no measure history', () => {
    profiles.getMyMeasurements.and.returnValue(of([]));
    component['loadData']();
    expect(component.chartData()).toBeNull();
  });

  it('shows the month-vs-previous report cards from the live report', () => {
    const cards = component.cards();
    expect(cards.map((c) => c.key)).toEqual(['weight', 'bodyFat', 'waist', 'sets']);
    expect(cards[0].metric.current).toBe(79);
    expect(cards[0].metric.delta).toBe(-3);
    expect(text()).toContain('Peso');
  });

  it('surfaces a measure-history load failure', () => {
    profiles.getMyMeasurements.and.returnValue(throwError(() => ({ detail: 'medidas 403', status: 403 })));
    component['loadData']();
    expect(component.error()).toBe('medidas 403');
    expect(component.isLoading()).toBeFalse();
  });

  it('surfaces a report load failure without blanking the whole page', () => {
    reports.getMyReport.and.returnValue(throwError(() => ({ detail: 'report caído', status: 500 })));
    component['loadData']();
    expect(component.reportError()).toBe('report caído');
    // the measures still loaded, so the chart section is unaffected
    expect(component.error()).toBeNull();
  });

  it('has no KPI-snapshot generate action (that is staff-only now)', () => {
    expect((component as unknown as Record<string, unknown>)['generateSnapshot']).toBeUndefined();
    expect(text()).not.toContain('Generar snapshot');
  });
});
