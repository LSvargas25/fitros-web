import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ReportPage } from './report.page';
import { ClientProfileService } from '../../../services/client-profile.service';
import { ProgressReportService } from '../../services/progress-report.service';
import { ProgressReport } from '../../models/progress-report.models';

const report: ProgressReport = {
  clientProfileId: 'cp1',
  year: 2026,
  month: 8,
  periodStartUtc: '2026-08-01T00:00:00Z',
  periodEndUtc: '2026-09-01T00:00:00Z',
  weight: { current: 80, previous: 82, delta: -2 },
  bodyFatPercentage: { current: 18, previous: 18, delta: 0 },
  waist: { current: 85, previous: 84, delta: 1 },
  completedSets: { current: 40, previous: 30, delta: 10 },
  generatedAtUtc: '2026-08-27T00:00:00Z',
};

describe('ReportPage', () => {
  let component: ReportPage;
  let fixture: ComponentFixture<ReportPage>;
  let reports: jasmine.SpyObj<ProgressReportService>;
  let profiles: jasmine.SpyObj<ClientProfileService>;

  beforeEach(async () => {
    profiles = jasmine.createSpyObj('ClientProfileService', ['getMyClients']);
    reports = jasmine.createSpyObj('ProgressReportService', ['getReport', 'generate', 'getHistory']);
    profiles.getMyClients.and.returnValue(of([
      { clientProfileId: 'cp1', clientUserId: 'u1', email: 'a@b.c', firstName: 'Ana', lastName: 'R', clientProfileCreatedAtUtc: '', lastMeasureRecordedAtUtc: null, lastWeight: null },
    ]));
    reports.getReport.and.returnValue(of(report));
    reports.getHistory.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ReportPage],
      providers: [
        { provide: ClientProfileService, useValue: profiles },
        { provide: ProgressReportService, useValue: reports },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load clients', () => {
    expect(component).toBeTruthy();
    expect(profiles.getMyClients).toHaveBeenCalled();
  });

  it('loads the report + history when a client is chosen', () => {
    component.selectedClientId.set('cp1');
    component.onClientChange();
    expect(reports.getReport).toHaveBeenCalledWith('cp1', component.year(), component.month());
    expect(reports.getHistory).toHaveBeenCalledWith('cp1');
    expect(component.report()).toEqual(report);
  });

  it('shifts the month and reloads', () => {
    component.selectedClientId.set('cp1');
    component.year.set(2026);
    component.month.set(1);
    reports.getReport.calls.reset();
    component.shiftMonth(-1);
    expect(component.year()).toBe(2025);
    expect(component.month()).toBe(12);
    expect(reports.getReport).toHaveBeenCalledWith('cp1', 2025, 12);
  });

  it('parses the <input type="month"> value', () => {
    component.selectedClientId.set('cp1');
    component.monthInput = '2026-03';
    expect(component.year()).toBe(2026);
    expect(component.month()).toBe(3);
  });

  it('classifies a metric as good when it improved in the better direction', () => {
    expect(component.tone(report.weight, true)).toBe('good');   // weight down
    expect(component.tone(report.waist, true)).toBe('bad');     // waist up
    expect(component.tone(report.completedSets, false)).toBe('good'); // sets up
    expect(component.tone(report.bodyFatPercentage, true)).toBe('flat'); // no change
  });

  it('generates a snapshot and refreshes history', () => {
    component.selectedClientId.set('cp1');
    reports.generate.and.returnValue(of({ snapshotId: 's1', physicalMeasureId: 'm1', createdAtUtc: '', report }));
    reports.getHistory.calls.reset();
    component.generate();
    expect(reports.generate).toHaveBeenCalledWith('cp1', component.year(), component.month());
    expect(component.generateSuccess()).toBeTrue();
    expect(reports.getHistory).toHaveBeenCalled();
  });

  it('surfaces a report error in a role="alert" region (screen readers announce it)', () => {
    reports.getReport.and.returnValue(throwError(() => ({ detail: 'no measures' })));
    component.selectedClientId.set('cp1');
    component.reload();
    fixture.detectChanges();
    expect(component.error()).toBe('no measures');
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('no measures');
  });

  it('surfaces a snapshot-history load failure instead of swallowing it', () => {
    reports.getHistory.and.returnValue(throwError(() => ({ detail: 'historial caído' })));
    component.selectedClientId.set('cp1');
    component.onClientChange();
    expect(component.historyError()).toBe('historial caído');
    expect(component.history()).toEqual([]);
  });
});
