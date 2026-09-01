import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { LucideAngularModule, ListChecks, Plus, Pencil, Archive, Rocket, Search, X, AlertTriangle } from 'lucide-angular';

import { DialogService } from '../../../../../core/Dialog/dialog.service';
import { RoutineService } from '../../services/routine.service';
import {
  RoutineListItem,
  RoutineStatus,
  ROUTINE_STATUS_LABEL,
  ROUTINE_STATUS_OPTIONS,
  routineStatusFromName,
} from '../../models/routine.models';

@Component({
  selector: 'app-routines-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './routines.page.html',
  styleUrl: './routines.page.css',
})
export class RoutinesPage implements OnInit {
  private readonly routineService = inject(RoutineService);
  private readonly dialog = inject(DialogService);

  readonly ListChecks = ListChecks;
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Archive = Archive;
  readonly Rocket = Rocket;
  readonly Search = Search;
  readonly X = X;
  readonly AlertTriangle = AlertTriangle;

  readonly RoutineStatus = RoutineStatus;
  readonly statusOptions = ROUTINE_STATUS_OPTIONS;

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly routines = signal<RoutineListItem[]>([]);

  statusFilter: RoutineStatus | '' = '';
  search = '';

  filteredRoutines(): RoutineListItem[] {
    const term = this.search.trim().toLowerCase();
    const list = Array.isArray(this.routines()) ? this.routines() : [];
    if (!term) return list;
    return list.filter((r) => r.name.toLowerCase().includes(term));
  }

  // Create / edit modal
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isFormLoading = signal(false);
  readonly isSaving = signal(false);
  readonly formError = signal<string | null>(null);
  formName = '';
  formDescription = '';

  // Row-level action state
  readonly busyId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.routineService.list(this.statusFilter === '' ? undefined : this.statusFilter).subscribe({
      next: (list) => {
        this.routines.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.detail ?? 'No se pudieron cargar las rutinas.');
        this.isLoading.set(false);
      },
    });
  }

  onStatusFilterChange(): void {
    this.load();
  }

  statusLabel(status: string): string {
    const key = routineStatusFromName(status);
    return key != null ? ROUTINE_STATUS_LABEL[key] : status;
  }

  isDraft(status: string): boolean {
    return routineStatusFromName(status) === RoutineStatus.Draft;
  }

  isArchived(status: string): boolean {
    return routineStatusFromName(status) === RoutineStatus.Archived;
  }

  // ── Create / edit ──────────────────────────────────────────────────────────
  openCreate(): void {
    this.editingId.set(null);
    this.formError.set(null);
    this.formName = '';
    this.formDescription = '';
    this.showForm.set(true);
  }

  openEdit(item: RoutineListItem): void {
    this.editingId.set(item.id);
    this.formError.set(null);
    this.formName = item.name;
    this.formDescription = '';
    this.showForm.set(true);
    this.isFormLoading.set(true);

    this.routineService.getById(item.id).subscribe({
      next: (detail) => {
        this.formName = detail.name;
        this.formDescription = detail.description ?? '';
        this.isFormLoading.set(false);
      },
      error: (err) => {
        this.isFormLoading.set(false);
        this.formError.set(err?.detail ?? 'No se pudo cargar la rutina.');
      },
    });
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.formError.set(null);

    const name = this.formName.trim();
    if (name.length < 3) {
      this.formError.set('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    const payload = { name, description: this.formDescription.trim() };
    this.isSaving.set(true);

    const editingId = this.editingId();
    const request$: Observable<unknown> = editingId
      ? this.routineService.update(editingId, payload)
      : this.routineService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err: { detail?: string }) => {
        this.isSaving.set(false);
        this.formError.set(err?.detail ?? 'No se pudo guardar la rutina.');
      },
    });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  async publish(item: RoutineListItem): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Publicar rutina',
      message: `¿Publicar "${item.name}"? Quedará disponible para asignarse a clientes.`,
      confirmText: 'Publicar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

    this.runRowAction(item.id, this.routineService.publish(item.id), 'No se pudo publicar la rutina.');
  }

  async archive(item: RoutineListItem): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Archivar rutina',
      message: `¿Archivar "${item.name}"?`,
      confirmText: 'Archivar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

    this.runRowAction(item.id, this.routineService.archive(item.id), 'No se pudo archivar la rutina.');
  }

  private runRowAction(id: string, request$: Observable<void>, fallbackError: string): void {
    this.actionError.set(null);
    this.busyId.set(id);

    request$.subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: (err: { detail?: string }) => {
        this.busyId.set(null);
        this.actionError.set(err?.detail ?? fallbackError);
      },
    });
  }
}
