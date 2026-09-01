import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle, CheckCircle2 } from 'lucide-angular';

import { ClientProfileService, MyClientListItem } from '../../../services/client-profile.service';
import { ProgressReportService } from '../../services/progress-report.service';
import { MONTH_LABEL, ProgressMetric, ProgressReport, ProgressReportSnapshot } from '../../models/progress-report.models';

interface MetricCard {
  key: string;
  label: string;
  unit: string;
  metric: ProgressMetric;
  lowerIsBetter: boolean;
}

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './report.page.html',
  styleUrl: './report.page.css',
})
export class ReportPage implements OnInit {
  private readonly clientProfiles = inject(ClientProfileService);
  private readonly reports = inject(ProgressReportService);

  readonly FileText = FileText;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly Minus = Minus;
  readonly Zap = Zap;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle2 = CheckCircle2;

  readonly monthLabels = MONTH_LABEL;

  readonly clients = signal<MyClientListItem[]>([]);
  readonly clientsError = signal<string | null>(null);
  // Signals, not plain fields: the app is zoneless, and the template gates whole
  // sections on these (`@if (!selectedClientId())`, `periodLabel` computed).
  readonly selectedClientId = signal('');

  private readonly now = new Date();
  readonly year = signal(this.now.getUTCFullYear());
  readonly month = signal(this.now.getUTCMonth() + 1); // 1-12

  readonly report = signal<ProgressReport | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly history = signal<ProgressReportSnapshot[]>([]);
  readonly historyError = signal<string | null>(null);

  readonly isGenerating = signal(false);
  readonly generateError = signal<string | null>(null);
  readonly generateSuccess = signal(false);

  readonly periodLabel = computed(() => `${MONTH_LABEL[this.month() - 1]} ${this.year()}`);

  get monthInput(): string {
    return `${this.year()}-${String(this.month()).padStart(2, '0')}`;
  }
  set monthInput(value: string) {
    const [y, m] = value.split('-').map(Number);
    if (y && m) {
      this.year.set(y);
      this.month.set(m);
      this.reload();
    }
  }

  readonly cards = computed<MetricCard[]>(() => {
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
    this.clientProfiles.getMyClients().subscribe({
      next: (list) => this.clients.set(list),
      error: (err) => this.clientsError.set(err?.detail ?? 'No se pudieron cargar los clientes.'),
    });
  }

  onClientChange(): void {
    this.report.set(null);
    this.error.set(null);
    this.historyError.set(null);
    this.generateSuccess.set(false);
    if (!this.selectedClientId()) {
      this.history.set([]);
      return;
    }
    this.reload();
    this.loadHistory();
  }

  shiftMonth(delta: number): void {
    const d = new Date(Date.UTC(this.year(), this.month() - 1 + delta, 1));
    this.year.set(d.getUTCFullYear());
    this.month.set(d.getUTCMonth() + 1);
    this.reload();
  }

  reload(): void {
    if (!this.selectedClientId()) return;
    this.isLoading.set(true);
    this.error.set(null);
    this.generateSuccess.set(false);

    this.reports.getReport(this.selectedClientId(), this.year(), this.month()).subscribe({
      next: (r) => {
        this.report.set(r);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.detail ?? 'No se pudo generar el reporte de este mes.');
        this.isLoading.set(false);
      },
    });
  }

  private loadHistory(): void {
    this.historyError.set(null);
    this.reports.getHistory(this.selectedClientId()).subscribe({
      next: (list) => this.history.set(list),
      error: (err) => {
        this.history.set([]);
        this.historyError.set(err?.detail ?? 'No se pudo cargar el historial de snapshots.');
      },
    });
  }

  generate(): void {
    if (!this.selectedClientId() || this.isGenerating()) return;
    this.generateError.set(null);
    this.generateSuccess.set(false);
    this.isGenerating.set(true);

    this.reports.generate(this.selectedClientId(), this.year(), this.month()).subscribe({
      next: (res) => {
        this.isGenerating.set(false);
        this.report.set(res.report);
        this.generateSuccess.set(true);
        this.loadHistory();
      },
      error: (err) => {
        this.isGenerating.set(false);
        this.generateError.set(err?.detail ?? 'No se pudo guardar el snapshot del reporte.');
      },
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
