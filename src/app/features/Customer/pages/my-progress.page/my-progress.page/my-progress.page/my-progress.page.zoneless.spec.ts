/**
 * Production runs WITHOUT zone.js (only `build:test` adds it). This spec renders
 * MyProgressPage under the production model — `provideZonelessChangeDetection()` +
 * two independently-deferred sources (`getMyMeasurements`, `getMyReport`) — and
 * asserts the real DOM ends up with both the weight chart and the month-vs-month
 * cards, with no NG0100.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Subject } from 'rxjs';

import { MyProgressPage } from './my-progress.page';
import { ClientProfileService, PhysicalMeasure } from '../../../../../Progress/services/client-profile.service';
import { ProgressReportService } from '../../../../../Progress/Reports/services/progress-report.service';
import { ProgressReport } from '../../../../../Progress/Reports/models/progress-report.models';
import { provideTestIcons } from '../../../../../../../testing/test-icons';

const measures: PhysicalMeasure[] = [
  { id: 'm1', weight: 82, bodyFatPercentage: 20, muscleMass: 33, waist: 88, chest: 100, arms: 34, recordedAt: '2026-07-01T00:00:00Z' },
  { id: 'm2', weight: 78, bodyFatPercentage: 17, muscleMass: 35, waist: 84, chest: 100, arms: 35, recordedAt: '2026-08-01T00:00:00Z' },
];

const report: ProgressReport = {
  clientProfileId: 'c1', year: 2026, month: 8,
  periodStartUtc: '2026-08-01T00:00:00Z', periodEndUtc: '2026-09-01T00:00:00Z',
  weight: { current: 78, previous: 82, delta: -4 },
  bodyFatPercentage: { current: 17, previous: 20, delta: -3 },
  waist: { current: 84, previous: 88, delta: -4 },
  completedSets: { current: 44, previous: 30, delta: 14 },
  generatedAtUtc: '2026-08-15T00:00:00Z',
};

describe('MyProgressPage — zoneless (production change-detection model)', () => {
  let fixture: ComponentFixture<MyProgressPage>;
  let component: MyProgressPage;
  let measures$: Subject<PhysicalMeasure[]>;
  let report$: Subject<ProgressReport>;

  beforeEach(async () => {
    measures$ = new Subject();
    report$ = new Subject();

    const profiles = jasmine.createSpyObj('ClientProfileService', ['getMyMeasurements']);
    profiles.getMyMeasurements.and.returnValue(measures$.asObservable());
    const reports = jasmine.createSpyObj('ProgressReportService', ['getMyReport']);
    reports.getMyReport.and.returnValue(report$.asObservable());

    await TestBed.configureTestingModule({
      imports: [MyProgressPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ClientProfileService, useValue: profiles },
        { provide: ProgressReportService, useValue: reports },
        ...provideTestIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyProgressPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }
  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('renders the chart and the month-vs-month cards once both sources resolve (no NG0100)', async () => {
    let thrown: unknown = null;
    try {
      measures$.next(measures); measures$.complete();
      report$.next(report); report$.complete();
      await settle();
    } catch (e) {
      thrown = e;
    }

    expect(thrown).withContext('NG0100 during render').toBeNull();
    expect(component.isLoading()).toBeFalse();
    // chart
    expect((fixture.nativeElement as HTMLElement).querySelector('svg path')).not.toBeNull();
    expect(text()).toContain('Tendencia de peso');
    // report cards
    expect(text()).toContain('Este mes vs. el anterior');
    expect(text()).toContain('Peso');
    expect(text()).toContain('Series completadas');
    expect(text()).toContain('-4'); // weight delta
  });

  it('a report failure shows its error but the chart still renders', async () => {
    measures$.next(measures); measures$.complete();
    report$.error({ detail: 'reporte caído', status: 500 });
    await settle();

    expect(text()).toContain('reporte caído');
    expect((fixture.nativeElement as HTMLElement).querySelector('svg path')).not.toBeNull();
    expect(component.error()).toBeNull();
  });
});
