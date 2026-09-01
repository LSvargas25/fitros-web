import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  ClientProfileService,
  PhysicalMeasure,
} from '../../../../../Progress/services/client-profile.service';
import { ProgressReportService } from '../../../../../Progress/Reports/services/progress-report.service';
import { ProgressMetric, ProgressReport } from '../../../../../Progress/Reports/models/progress-report.models';

interface ChartPoint {
  x: number;
  y: number;
  weight: number;
  recordedAt: string;
}

interface WeightChartData {
  path: string;
  points: ChartPoint[];
  width: number;
  height: number;
  minWeight: number;
  maxWeight: number;
}

interface ReportCard {
  key: string;
  label: string;
  unit: string;
  metric: ProgressMetric;
  lowerIsBetter: boolean;
}

@Component({
  selector: 'app-my-progress.page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './my-progress.page.html',
  styleUrl: './my-progress.page.css',
})
export class MyProgressPage implements OnInit {
  private readonly clientProfileService = inject(ClientProfileService);
  private readonly progressReports = inject(ProgressReportService);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly measures = signal<PhysicalMeasure[]>([]);

  readonly report = signal<ProgressReport | null>(null);
  readonly reportError = signal<string | null>(null);

  readonly chartData = computed<WeightChartData | null>(() => {
    const sorted = [...this.measures()].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    if (sorted.length === 0) return null;

    const width = 560;
    const height = 180;
    const padX = 16;
    const padY = 16;

    const weights = sorted.map((m) => m.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = maxWeight - minWeight || 1;

    const points: ChartPoint[] = sorted.map((m, i) => {
      const x =
        sorted.length === 1
          ? width / 2
          : padX + (i / (sorted.length - 1)) * (width - padX * 2);
      const y = height - padY - ((m.weight - minWeight) / range) * (height - padY * 2);
      return { x, y, weight: m.weight, recordedAt: m.recordedAt };
    });

    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');

    return { path, points, width, height, minWeight, maxWeight };
  });

  readonly cards = computed<ReportCard[]>(() => {
    const r = this.report();
    if (!r) return [];
    return [
      { key: 'weight', label: 'Peso', unit: 'kg', metric: r.weight, lowerIsBetter: true },
      { key: 'bodyFat', label: '% Grasa', unit: '%', metric: r.bodyFatPercentage, lowerIsBetter: true },
      { key: 'waist', label: 'Cintura', unit: 'cm', metric: r.waist, lowerIsBetter: true },
      { key: 'sets', label: 'Series completadas', unit: '', metric: r.completedSets, lowerIsBetter: false },
    ];
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.reportError.set(null);

    // JWT-resolved — no GET /client-profiles/me first.
    this.clientProfileService.getMyMeasurements().subscribe({
      next: (measures) => {
        this.measures.set(measures);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err?.detail ?? 'No se pudo cargar tu historial de medidas.');
      },
    });

    this.progressReports.getMyReport().subscribe({
      next: (report) => this.report.set(report),
      error: (err) => this.reportError.set(err?.detail ?? 'No se pudo cargar tu reporte del mes.'),
    });
  }

  /** 'good' | 'bad' | 'flat' — direction of the change, coloured by whether lower is better. */
  tone(metric: ProgressMetric, lowerIsBetter: boolean): 'good' | 'bad' | 'flat' {
    const d = metric.delta;
    if (d == null || d === 0) return 'flat';
    const improved = lowerIsBetter ? d < 0 : d > 0;
    return improved ? 'good' : 'bad';
  }

  format(value: number | null): string {
    return value == null ? '—' : `${Math.round(value * 10) / 10}`;
  }

  formatDelta(value: number | null): string {
    if (value == null) return '—';
    const rounded = Math.round(value * 10) / 10;
    return `${rounded > 0 ? '+' : ''}${rounded}`;
  }
}
