import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { LucideAngularModule, Apple, Plus, Pencil, Archive, X, Search, AlertTriangle } from 'lucide-angular';

import { DialogService } from '../../../../../core/Dialog/dialog.service';
import { FoodService } from '../../services/food.service';
import {
  FoodListItem,
  FoodCategory,
  FOOD_CATEGORY_LABEL,
  FOOD_CATEGORY_OPTIONS,
} from '../../models/food.models';

@Component({
  selector: 'app-food-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './food.page.html',
  styleUrl: './food.page.css',
})
export class FoodPage implements OnInit {
  private readonly foodService = inject(FoodService);
  private readonly dialog = inject(DialogService);

  readonly Apple = Apple;
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Archive = Archive;
  readonly X = X;
  readonly Search = Search;
  readonly AlertTriangle = AlertTriangle;

  readonly categoryOptions = FOOD_CATEGORY_OPTIONS;

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly foods = signal<FoodListItem[]>([]);

  categoryFilter: FoodCategory | '' = '';
  search = '';

  filteredFoods(): FoodListItem[] {
    const term = this.search.trim().toLowerCase();
    const list = this.foods();
    if (!term) return list;
    return list.filter((f) => f.name.toLowerCase().includes(term));
  }

  // Create / edit modal
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly isFormLoading = signal(false);
  readonly isSaving = signal(false);
  readonly formError = signal<string | null>(null);
  formName = '';
  formCategory: FoodCategory | '' = '';
  formCalories: number | null = null;
  formProtein: number | null = null;
  formCarbs: number | null = null;
  formFat: number | null = null;
  formServing: number | null = null;

  readonly archivingId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  categoryLabel(category: FoodCategory): string {
    return FOOD_CATEGORY_LABEL[category] ?? '—';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.foodService.list(this.categoryFilter === '' ? undefined : this.categoryFilter).subscribe({
      next: (list) => {
        this.foods.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.detail ?? 'No se pudieron cargar los alimentos.');
        this.isLoading.set(false);
      },
    });
  }

  onCategoryFilterChange(): void {
    this.load();
  }

  // ── Create / edit ──────────────────────────────────────────────────────────
  private resetForm(): void {
    this.formName = '';
    this.formCategory = '';
    this.formCalories = null;
    this.formProtein = null;
    this.formCarbs = null;
    this.formFat = null;
    this.formServing = null;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.formError.set(null);
    this.resetForm();
    this.showForm.set(true);
  }

  openEdit(item: FoodListItem): void {
    this.editingId.set(item.id);
    this.formError.set(null);
    this.formName = item.name;
    this.formCategory = item.category;
    this.formCalories = item.caloriesPer100g;
    this.formProtein = item.proteinPer100g;
    this.formCarbs = item.carbsPer100g;
    this.formFat = item.fatPer100g;
    this.formServing = null;
    this.showForm.set(true);
    this.isFormLoading.set(true);

    this.foodService.getById(item.id).subscribe({
      next: (detail) => {
        this.formName = detail.name;
        this.formCategory = detail.category;
        this.formCalories = detail.caloriesPer100g;
        this.formProtein = detail.proteinPer100g;
        this.formCarbs = detail.carbsPer100g;
        this.formFat = detail.fatPer100g;
        this.formServing = detail.servingSizeGrams;
        this.isFormLoading.set(false);
      },
      error: (err) => {
        this.isFormLoading.set(false);
        this.formError.set(err?.detail ?? 'No se pudo cargar el alimento.');
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
    if (!name) {
      this.formError.set('El nombre es obligatorio.');
      return;
    }
    if (this.formCategory === '') {
      this.formError.set('Selecciona una categoría.');
      return;
    }
    const macros = [this.formCalories, this.formProtein, this.formCarbs, this.formFat];
    if (macros.some((m) => m == null || m < 0)) {
      this.formError.set('Los macros (por 100 g) son obligatorios y no pueden ser negativos.');
      return;
    }
    if (this.formServing != null && this.formServing <= 0) {
      this.formError.set('La ración debe ser mayor que 0 g.');
      return;
    }

    const base = {
      name,
      category: this.formCategory,
      caloriesPer100g: this.formCalories as number,
      proteinPer100g: this.formProtein as number,
      carbsPer100g: this.formCarbs as number,
      fatPer100g: this.formFat as number,
      servingSizeGrams: this.formServing,
    };

    this.isSaving.set(true);

    const editingId = this.editingId();
    const request$: Observable<unknown> = editingId
      ? this.foodService.update({ id: editingId, ...base })
      : this.foodService.create(base);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err: { detail?: string }) => {
        this.isSaving.set(false);
        this.formError.set(err?.detail ?? 'No se pudo guardar el alimento.');
      },
    });
  }

  // ── Archive ────────────────────────────────────────────────────────────────
  async archive(item: FoodListItem): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Archivar alimento',
      message: `¿Archivar "${item.name}"? Dejará de estar disponible para nuevos planes.`,
      confirmText: 'Archivar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

    this.actionError.set(null);
    this.archivingId.set(item.id);

    this.foodService.archive(item.id).subscribe({
      next: () => {
        this.foods.update((list) => list.filter((f) => f.id !== item.id));
        this.archivingId.set(null);
      },
      error: (err) => {
        this.archivingId.set(null);
        this.actionError.set(err?.detail ?? 'No se pudo archivar el alimento.');
      },
    });
  }
}
