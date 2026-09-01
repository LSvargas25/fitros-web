import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Ruler, History, AlertTriangle } from 'lucide-angular';

import { ClientProfileService, MyClientListItem, PhysicalMeasure } from '../../../services/client-profile.service';

/**
 * Staff view (Admin / Coach) of a client's raw physical-measure history —
 * read-only. Pairs with the month-vs-month `ReportPage`. Client authors their
 * own measures on `MeansuresPage`.
 *
 * `GET /api/client-profiles/{id}/measures` — the backend lets Owner/Admin read
 * any client in their gym and a Coach read their own clients.
 */
@Component({
  selector: 'app-client-measures-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './client-measures.page.html',
  styleUrl: './client-measures.page.css',
})
export class ClientMeasuresPage implements OnInit {
  private readonly clientProfiles = inject(ClientProfileService);

  readonly Ruler = Ruler;
  readonly History = History;
  readonly AlertTriangle = AlertTriangle;

  readonly clients = signal<MyClientListItem[]>([]);
  readonly clientsError = signal<string | null>(null);
  readonly selectedClientId = signal('');

  readonly measures = signal<PhysicalMeasure[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /** Most recent measure (the backend returns the list newest-first). */
  readonly latest = computed<PhysicalMeasure | null>(() => this.measures()[0] ?? null);

  ngOnInit(): void {
    this.clientProfiles.getMyClients().subscribe({
      next: (list) => this.clients.set(list),
      error: (err) => this.clientsError.set(err?.detail ?? 'No se pudieron cargar los clientes.'),
    });
  }

  onClientChange(): void {
    this.measures.set([]);
    this.error.set(null);
    const id = this.selectedClientId();
    if (!id) return;

    this.isLoading.set(true);
    this.clientProfiles.getMeasures(id).subscribe({
      next: (list) => {
        this.measures.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err?.detail ?? 'No se pudo cargar el historial de medidas.');
      },
    });
  }
}
