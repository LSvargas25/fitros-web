import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, UtensilsCrossed, Plus, Trash2, Check, Archive, Pencil, X, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-angular';

import { DialogService } from '../../../../../core/Dialog/dialog.service';
import { ClientProfileService, MyClientListItem } from '../../../../Progress/services/client-profile.service';
import { FoodService } from '../../../Food/services/food.service';
import { FoodListItem } from '../../../Food/models/food.models';
import { MealPlanService } from '../../services/meal-plan.service';
import {
  DAY_LABEL,
  DAY_OPTIONS,
  DAY_ORDER,
  MEAL_PLAN_STATUS_LABEL,
  MEAL_TYPE_LABEL,
  MEAL_TYPE_OPTIONS,
  MEAL_TYPE_ORDER,
  MealPlanDetail,
  MealPlanListItem,
  MealPlanStatus,
  MealPlanEntry,
  MealType,
} from '../../models/meal-plan.models';

interface MealGroup { meal: MealType; label: string; entries: MealPlanEntry[]; }
interface DayGroup { day: number; label: string; meals: MealGroup[]; }

@Component({
  selector: 'app-nutritioplan-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './nutritioplan.page.html',
  styleUrl: './nutritioplan.page.css',
})
export class NutritioplanPage implements OnInit {
  private readonly clientProfiles = inject(ClientProfileService);
  private readonly mealPlans = inject(MealPlanService);
  private readonly foodService = inject(FoodService);
  private readonly dialog = inject(DialogService);

  readonly UtensilsCrossed = UtensilsCrossed;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly Check = Check;
  readonly Archive = Archive;
  readonly Pencil = Pencil;
  readonly X = X;
  readonly AlertTriangle = AlertTriangle;
  readonly ChevronUp = ChevronUp;
  readonly ChevronDown = ChevronDown;

  readonly MealPlanStatus = MealPlanStatus;
  readonly statusLabel = MEAL_PLAN_STATUS_LABEL;
  readonly dayOptions = DAY_OPTIONS;
  readonly mealOptions = MEAL_TYPE_OPTIONS;

  readonly clients = signal<MyClientListItem[]>([]);
  readonly foods = signal<FoodListItem[]>([]);
  /** false until the catalogue GET resolves, so the UI can tell "still loading" from "loaded, empty". */
  readonly foodsLoaded = signal(false);
  /** Set only when the catalogue GET fails — distinguishes a load error from a genuinely empty catalogue. */
  readonly foodsError = signal<string | null>(null);
  readonly clientsError = signal<string | null>(null);
  // Signals (zoneless app): `selectedClientId` gates a structural `@if`, and the
  // form fields below are reset inside async success callbacks — a plain field
  // there is invisible to change detection.
  readonly selectedClientId = signal('');

  readonly plans = signal<MealPlanListItem[]>([]);
  readonly isLoadingPlans = signal(false);
  readonly plansError = signal<string | null>(null);

  readonly newPlanName = signal('');
  readonly isCreatingPlan = signal(false);
  readonly createError = signal<string | null>(null);

  readonly selectedPlan = signal<MealPlanDetail | null>(null);
  readonly isLoadingPlan = signal(false);
  readonly planError = signal<string | null>(null);
  readonly busyPlan = signal(false);

  readonly isRenaming = signal(false);
  readonly renameValue = signal('');

  // add-entry form
  readonly entryDay = signal<number | ''>('');
  readonly entryMeal = signal<MealType | ''>('');
  readonly entryFoodId = signal('');
  readonly entryGrams = signal<number | null>(null);
  readonly isAddingEntry = signal(false);
  readonly entryError = signal<string | null>(null);
  readonly removingEntryId = signal<string | null>(null);
  readonly movingEntryId = signal<string | null>(null);

  readonly days = computed<DayGroup[]>(() => {
    const p = this.selectedPlan();
    if (!p) return [];
    return DAY_ORDER.map((day) => {
      const dayEntries = p.entries.filter((e) => e.day === day);
      if (dayEntries.length === 0) return null;
      const meals = MEAL_TYPE_ORDER.map((meal) => {
        const entries = dayEntries
          .filter((e) => e.meal === meal)
          .sort((a, b) => a.order - b.order);
        return entries.length ? { meal, label: MEAL_TYPE_LABEL[meal], entries } : null;
      }).filter((m): m is MealGroup => m !== null);
      return { day, label: DAY_LABEL[day], meals };
    }).filter((d): d is DayGroup => d !== null);
  });

  ngOnInit(): void {
    this.clientProfiles.getMyClients().subscribe({
      next: (list) => this.clients.set(list),
      error: (err) => this.clientsError.set(err?.detail ?? 'No se pudieron cargar los clientes.'),
    });
    this.foodService.list().subscribe({
      next: (list) => {
        this.foods.set(list);
        this.foodsLoaded.set(true);
      },
      error: (err) => {
        this.foodsLoaded.set(true);
        this.foodsError.set(err?.detail ?? 'No se pudo cargar el catálogo de alimentos.');
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
    this.mealPlans.getClientPlans(this.selectedClientId()).subscribe({
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
    const name = this.newPlanName().trim();
    if (name.length < 2) {
      this.createError.set('Escribe un nombre para el plan.');
      return;
    }
    this.isCreatingPlan.set(true);
    this.mealPlans.create(this.selectedClientId(), name).subscribe({
      next: ({ id }) => {
        this.isCreatingPlan.set(false);
        this.newPlanName.set('');
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
    this.mealPlans.getById(id).subscribe({
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
    this.mealPlans.activate(p.id).subscribe({
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
    this.mealPlans.archive(p.id).subscribe({
      next: () => { this.busyPlan.set(false); this.selectedPlan.set(null); this.loadPlans(); },
      error: (err) => { this.busyPlan.set(false); this.planError.set(err?.detail ?? 'No se pudo archivar el plan.'); },
    });
  }

  startRename(): void {
    const p = this.selectedPlan();
    if (!p) return;
    this.renameValue.set(p.name);
    this.isRenaming.set(true);
  }

  confirmRename(): void {
    const p = this.selectedPlan();
    const name = this.renameValue().trim();
    if (!p || name.length < 2) return;
    this.busyPlan.set(true);
    this.mealPlans.rename(p.id, name).subscribe({
      next: () => { this.busyPlan.set(false); this.isRenaming.set(false); this.refreshSelected(); },
      error: (err) => { this.busyPlan.set(false); this.planError.set(err?.detail ?? 'No se pudo renombrar.'); },
    });
  }

  addEntry(): void {
    const p = this.selectedPlan();
    if (!p) return;
    this.entryError.set(null);
    const day = this.entryDay();
    const meal = this.entryMeal();
    const foodId = this.entryFoodId();
    const grams = this.entryGrams();
    if (day === '' || meal === '' || !foodId) {
      this.entryError.set('Elige día, comida y alimento.');
      return;
    }
    if (grams == null || grams <= 0) {
      this.entryError.set('Indica la cantidad en gramos.');
      return;
    }
    this.isAddingEntry.set(true);
    this.mealPlans
      .addEntry(p.id, {
        day,
        meal,
        foodId,
        quantityGrams: grams,
      })
      .subscribe({
        next: () => {
          this.isAddingEntry.set(false);
          this.entryFoodId.set('');
          this.entryGrams.set(null);
          this.refreshSelected();
        },
        error: (err) => {
          this.isAddingEntry.set(false);
          this.entryError.set(err?.detail ?? 'No se pudo agregar el alimento.');
        },
      });
  }

  removeEntry(entry: MealPlanEntry): void {
    const p = this.selectedPlan();
    if (!p || this.removingEntryId()) return;
    this.removingEntryId.set(entry.id);
    this.mealPlans.removeEntry(p.id, entry.id).subscribe({
      next: () => { this.removingEntryId.set(null); this.refreshSelected(); },
      error: (err) => { this.removingEntryId.set(null); this.planError.set(err?.detail ?? 'No se pudo quitar el alimento.'); },
    });
  }

  /** Reorder `entry` one slot up (dir = -1) or down (dir = +1) within its (day, meal). */
  moveEntry(entry: MealPlanEntry, dir: -1 | 1): void {
    const p = this.selectedPlan();
    if (!p || this.movingEntryId()) return;

    const slot = p.entries
      .filter((e) => e.day === entry.day && e.meal === entry.meal)
      .sort((a, b) => a.order - b.order);
    const idx = slot.findIndex((e) => e.id === entry.id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= slot.length) return;

    this.movingEntryId.set(entry.id);
    this.planError.set(null);
    this.mealPlans.moveEntry(p.id, entry.id, slot[target].order).subscribe({
      next: () => { this.movingEntryId.set(null); this.refreshSelected(); },
      error: (err) => {
        this.movingEntryId.set(null);
        this.planError.set(err?.detail ?? 'No se pudo reordenar el alimento.');
      },
    });
  }
}
