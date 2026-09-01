/** ProgressMetric — current-month value vs previous-month value and their delta. */
export interface ProgressMetric {
  current: number | null;
  previous: number | null;
  delta: number | null;
}

/**
 * GET/POST /api/client-profiles/{id}/progress-report — ProgressReportDto.
 * Computed live from PhysicalMeasure history + completed WorkoutSessions.
 */
export interface ProgressReport {
  clientProfileId: string;
  year: number;
  month: number;
  periodStartUtc: string;
  periodEndUtc: string;
  weight: ProgressMetric;
  bodyFatPercentage: ProgressMetric;
  waist: ProgressMetric;
  completedSets: ProgressMetric;
  generatedAtUtc: string;
}

/** POST response — the report plus the persisted snapshot id. */
export interface GenerateProgressReportResponse {
  snapshotId: string;
  physicalMeasureId: string;
  createdAtUtc: string;
  report: ProgressReport;
}

/** GET /api/client-profiles/{id}/progress-reports — ProgressReportSnapshotDto. */
export interface ProgressReportSnapshot {
  id: string;
  physicalMeasureId: string;
  createdAtUtc: string;
  reportJson: string;
}

export const MONTH_LABEL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
