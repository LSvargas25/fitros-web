import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  CalendarDays,
  Plus,
  Check,
  Archive,
  Pencil,
  X,
  AlertTriangle,
  Moon,
} from 'lucide-angular';

import { DialogService } from '../../../../../core/Dialog/dialog.service';
import { ClientProfileService, MyClientListItem } from '../../../../Progress/services/client-profile.service';
import { RoutineService } from '../../../Routines/services/routine.service';
import { RoutineListItem, RoutineStatus } from '../../../Routines/models/routine.models';
import { TrainingPlanService } from '../../services/training-plan.service';
import {
  DAY_LABEL,
  DAY_ORDER,
  TRAINING_PLAN_STATUS_LABEL,
  TrainingPlanDay,
  TrainingPlanListItem,
  TrainingPlanStatus,
  WeeklyTrainingPlanDetail,
} from '../../models/training-plan.models';

interface WeekRow {
  day: number;
  label: string;
  assigned: TrainingPlanDay | null;
}

@Component({
  selector: 'app-weekly-plans-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './weekly-plans.page.html',
  styleUrl: './weekly-plans.page.css',
})
export class WeeklyPlansPage implements OnInit {
  private readonly clientProfiles = inject(ClientProfileService);
  private readonly routineService = inject(RoutineService);
  private readonly trainingPlans = inject(TrainingPlanService);
  private readonly dialog = inject(DialogService);
  private readonly route = inject(ActivatedRoute);

  /**
   * "Self" mode (route data `selfMode: true`) — a Coach editing the weekly plan on
   * their OWN CoachSelf profile. The client picker is hidden and `selectedClientId`
   * is resolved from `GET /api/client-profiles/me`. Same `/api/training-plans`
   * endpoints; the backend authorises a Coach to manage a plan on their own profile.
   */
  readonly selfMode = signal(false);
  readonly selfError = signal<string | null>(null);

  readonly CalendarDays = CalendarDays;
  readonly Plus = Plus;
  readonly Check = Check;
  readonly Archive = Archive;
  readonly Pencil = Pencil;
  readonly X = X;
  readonly AlertTriangle = AlertTriangle;
  readonly Moon = Moon;

  readonly TrainingPlanStatus = TrainingPlanStatus;
  readonly statusLabel = TRAINING_PLAN_STATUS_LABEL;

  readonly clients = signal<MyClientListItem[]>([]);
  readonly clientsError = signal<string | null>(null);
  /**
   * The chosen client's profile id. MUST be a signal, not a plain field: in
   * `selfMode` it is set from an async `getMyProfile()` callback with no
   * accompanying DOM event, and the template's `@if (selectedClientId())` is a
   * structural condition. As a plain field that write is invisible to the
   * (zoneless) change detector until some *other* signal happens to schedule a
   * pass, and can land mid-cycle → `ExpressionChangedAfterItHasBeenCheckedError`
   * on the `@if`, which aborts the whole editor render (blank page below the
   * header). A signal makes the write reactive and glitch-free.
   */
  readonly selectedClientId = signal('');

  /** Published routines only — a day can only be assigned a Published routine (backend 400s otherwise). */
  readonly routines = signal<RoutineListItem[]>([]);
  /** false until the routines GET resolves, so the UI can tell "still loading" from "loaded, empty". */
  readonly routinesLoaded = signal(false);
  readonly routinesError = signal<string | null>(null);

  readonly plans = signal<TrainingPlanListItem[]>([]);
  readonly isLoadingPlans = signal(false);
  readonly plansError = signal<string | null>(null);

  newPlanName = '';
  readonly isCreatingPlan = signal(false);
  readonly createError = signal<string | null>(null);

  readonly selectedPlan = signal<WeeklyTrainingPlanDetail | null>(null);
  readonly isLoadingPlan = signal(false);
  readonly planError = signal<string | null>(null);
  readonly busyPlan = signal(false);

  readonly isRenaming = signal(false);
  renameValue = '';

  /** The day int (Sun 0…Sat 6) whose assignment is currently being persisted, or null. */
  readonly savingDay = signal<number | null>(null);

  readonly weekRows = computed<WeekRow[]>(() => {
    const plan = this.selectedPlan();
    return DAY_ORDER.map((day) => ({
      day,
      label: DAY_LABEL[day],
      assigned: plan?.days.find((d) => d.day === day) ?? null,
    }));
  });

  ngOnInit(): void {
    if (this.route.snapshot.data['selfMode']) {
      this.selfMode.set(true);
      this.clientProfiles.getMyProfile().subscribe({
        next: (profile) => {
          this.selectedClientId.set(profile.id);
          this.onClientChange();
        },
        error: (err) => this.selfError.set(err?.detail ?? 'No se pudo cargar tu perfil.'),
      });
    } else {
      this.clientProfiles.getMyClients().subscribe({
        next: (list) => this.clients.set(list),
        error: (err) => this.clientsError.set(err?.detail ?? 'No se pudieron cargar los clientes.'),
      });
    }

    this.routineService.list(RoutineStatus.Published).subscribe({
      next: (list) => {
        this.routines.set(list);
        this.routinesLoaded.set(true);
      },
      error: (err) => {
        this.routinesLoaded.set(true);
        this.routinesError.set(err?.detail ?? 'No se pudo cargar el catálogo de rutinas.');
      },
    });
  }

  onClientChange(): void {
    this.selectedPlan.set(null);
    this.plans.set([]);
    this.createError.set(null);
    if (!this.selectedClientId()) return;
    this.loadPlans();
  }

  private loadPlans(): void {
    this.isLoadingPlans.set(true);
    this.plansError.set(null);
    this.trainingPlans.getClientPlans(this.selectedClientId()).subscribe({
      next: (list) => {
        this.plans.set(list);
        this.isLoadingPlans.set(false);
      },
      error: (err) => {
        this.plansError.set(err?.detail ?? 'No se pudieron cargar los planes.');
        this.isLoadingPlans.set(false);
      },
    });
  }

  createPlan(): void {
    this.createError.set(null);
    const name = this.newPlanName.trim();
    if (name.length < 2) {
      this.createError.set('Escribe un nombre para el plan.');
      return;
    }
    this.isCreatingPlan.set(true);
    this.trainingPlans.create(this.selectedClientId(), name).subscribe({
      next: ({ id }) => {
        this.isCreatingPlan.set(false);
        this.newPlanName = '';
        this.loadPlans();
        this.selectPlan(id);
      },
      error: (err) => {
        this.isCreatingPlan.set(false);
        this.createError.set(err?.detail ?? 'No se pudo crear el plan.');
      },
    });
  }

  selectPlan(id: string): void {
    this.isLoadingPlan.set(true);
    this.planError.set(null);
    this.isRenaming.set(false);
    this.trainingPlans.getById(id).subscribe({
      next: (plan) => {
        this.selectedPlan.set(plan);
        this.isLoadingPlan.set(false);
      },
      error: (err) => {
        this.planError.set(err?.detail ?? 'No se pudo cargar el plan.');
        this.isLoadingPlan.set(false);
      },
    });
  }

  private refreshSelected(): void {
    const p = this.selectedPlan();
    if (p) this.selectPlan(p.id);
    this.loadPlans();
  }

  activatePlan(): void {
    const p = this.selectedPlan();
    if (!p || this.busyPlan()) return;
    this.busyPlan.set(true);
    this.planError.set(null);
    this.trainingPlans.activate(p.id).subscribe({
      next: () => { this.busyPlan.set(false); this.refreshSelected(); },
      error: (err) => { this.busyPlan.set(false); this.planError.set(err?.detail ?? 'No se pudo activar el plan.'); },
    });
  }

  async archivePlan(): Promise<void> {
    const p = this.selectedPlan();
    if (!p || this.busyPlan()) return;
    const ok = await this.dialog.confirm({
      title: 'Archivar plan',
      message: `¿Archivar "${p.name}"?`,
      confirmText: 'Archivar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    this.busyPlan.set(true);
    this.planError.set(null);
    this.trainingPlans.archive(p.id).subscribe({
      next: () => { this.busyPlan.set(false); this.selectedPlan.set(null); this.loadPlans(); },
      error: (err) => { this.busyPlan.set(false); this.planError.set(err?.detail ?? 'No se pudo archivar el plan.'); },
    });
  }

  startRename(): void {
    const p = this.selectedPlan();
    if (!p) return;
    this.renameValue = p.name;
    this.isRenaming.set(true);
  }

  confirmRename(): void {
    const p = this.selectedPlan();
    const name = this.renameValue.trim();
    if (!p || name.length < 2) return;
    this.busyPlan.set(true);
    this.trainingPlans.rename(p.id, name).subscribe({
      next: () => { this.busyPlan.set(false); this.isRenaming.set(false); this.refreshSelected(); },
      error: (err) => { this.busyPlan.set(false); this.planError.set(err?.detail ?? 'No se pudo renombrar.'); },
    });
  }

  /**
   * Assign `routineId` to `day`, or clear the day (rest) when `routineId` is empty.
   * Persists immediately, then reloads the plan. Notes on an already-assigned day
   * are preserved on a routine change.
   */
  changeDayRoutine(day: number, routineId: string): void {
    const p = this.selectedPlan();
    if (!p || this.savingDay() !== null) return;

    const current = p.days.find((d) => d.day === day) ?? null;
    if ((current?.workoutRoutineId ?? '') === routineId) return;

    this.savingDay.set(day);
    this.planError.set(null);

    const done = {
      next: () => { this.savingDay.set(null); this.refreshSelected(); },
      error: (err: any) => {
        this.savingDay.set(null);
        this.planError.set(err?.detail ?? 'No se pudo actualizar el día.');
      },
    };

    if (!routineId) {
      this.trainingPlans.clearDay(p.id, day).subscribe(done);
    } else {
      this.trainingPlans.assignDay(p.id, day, { workoutRoutineId: routineId, notes: current?.notes ?? null }).subscribe(done);
    }
  }

  /** Persist a note edit for a day that already has a routine assigned. */
  saveDayNotes(day: number, notes: string): void {
    const p = this.selectedPlan();
    if (!p || this.savingDay() !== null) return;
    const current = p.days.find((d) => d.day === day);
    if (!current) return;
    const trimmed = notes.trim();
    if ((current.notes ?? '') === trimmed) return;

    this.savingDay.set(day);
    this.planError.set(null);
    this.trainingPlans
      .assignDay(p.id, day, { workoutRoutineId: current.workoutRoutineId, notes: trimmed || null })
      .subscribe({
        next: () => { this.savingDay.set(null); this.refreshSelected(); },
        error: (err) => {
          this.savingDay.set(null);
          this.planError.set(err?.detail ?? 'No se pudo guardar la nota.');
        },
      });
  }

  readonly hasNoPublishedRoutines = computed(() => this.routinesLoaded() && this.routines().length === 0);

  /**
   * Whether `routineId` is one of the currently-Published routines. A day can stay
   * assigned to a routine that was later unpublished/archived; the template uses this
   * to keep showing that routine as a (disabled-looking) extra option rather than
   * letting the `<select>` fall back to "Descanso" for an assigned day.
   */
  isKnownRoutine(routineId: string): boolean {
    return this.routines().some((r) => r.id === routineId);
  }
}
