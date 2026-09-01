import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  AddPhysicalMeasureDto,
  ClientProfileService,
  PhysicalMeasure,
} from '../../../services/client-profile.service';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-meansures.page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './meansures.page.html',
  styleUrl: './meansures.page.css',
})
export class MeansuresPage implements OnInit {
  private readonly clientProfileService = inject(ClientProfileService);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly measures = signal<PhysicalMeasure[]>([]);

  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);

  // Form fields as signals (zoneless app; `resetForm()` runs off any DOM event).
  readonly weight = signal<number | null>(null);
  readonly bodyFatPercentage = signal<number | null>(null);
  readonly muscleMass = signal<number | null>(null);
  readonly waist = signal<number | null>(null);
  readonly chest = signal<number | null>(null);
  readonly arms = signal<number | null>(null);

  /** `<input type="date">` value (YYYY-MM-DD). Defaults to today. */
  readonly recordedOn = signal(isoDate(new Date()));
  /** UX bounds for the date input — the server also enforces "not future / ≤ 60 days old". */
  readonly maxDate = isoDate(new Date());
  readonly minDate = isoDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));

  ngOnInit(): void {
    this.loadMeasures();
  }

  private loadMeasures(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // JWT-resolved — no GET /client-profiles/me first (MyProgressController).
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
  }

  addMeasure(): void {
    this.saveError.set(null);

    const weight = this.weight();
    if (weight == null || weight <= 0 || weight >= 500) {
      this.saveError.set('El peso es obligatorio y debe estar entre 0 y 500 kg.');
      return;
    }
    const bodyFat = this.bodyFatPercentage() ?? 0;
    if (bodyFat < 0 || bodyFat > 100) {
      this.saveError.set('El % de grasa debe estar entre 0 y 100.');
      return;
    }
    if ([this.muscleMass(), this.waist(), this.chest(), this.arms()].some((v) => (v ?? 0) < 0)) {
      this.saveError.set('Las medidas no pueden ser negativas.');
      return;
    }

    const date = this.recordedOn();
    if (date && date > this.maxDate) {
      this.saveError.set('La fecha no puede ser futura.');
      return;
    }

    const dto: AddPhysicalMeasureDto = {
      weight,
      bodyFatPercentage: bodyFat,
      muscleMass: this.muscleMass() ?? 0,
      waist: this.waist() ?? 0,
      chest: this.chest() ?? 0,
      arms: this.arms() ?? 0,
    };
    // Only send `recordedAt` for a past date. For "today" let the server stamp
    // now — a fixed noon-UTC could read as future depending on the current hour,
    // tripping the server's not-future check. Older-than-60-days is left to the
    // server (its 400 detail is shown).
    if (date && date < this.maxDate) {
      dto.recordedAt = `${date}T12:00:00Z`;
    }

    this.isSaving.set(true);
    this.clientProfileService.addMyMeasurement(dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.resetForm();
        this.loadMeasures();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err?.detail ?? 'No se pudo registrar la medida.');
      },
    });
  }

  private resetForm(): void {
    this.weight.set(null);
    this.bodyFatPercentage.set(null);
    this.muscleMass.set(null);
    this.waist.set(null);
    this.chest.set(null);
    this.arms.set(null);
    this.recordedOn.set(isoDate(new Date()));
  }
}
