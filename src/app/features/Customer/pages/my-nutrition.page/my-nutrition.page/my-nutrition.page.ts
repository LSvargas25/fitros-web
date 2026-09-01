import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Salad, UtensilsCrossed, AlertTriangle } from 'lucide-angular';

import { MealPlanService } from '../../../../Nutrition/MealPlan/services/meal-plan.service';
import {
  DAY_LABEL,
  DAY_ORDER,
  MEAL_TYPE_LABEL,
  MEAL_TYPE_ORDER,
  MealPlanDetail,
  MealPlanEntry,
  MealType,
} from '../../../../Nutrition/MealPlan/models/meal-plan.models';

interface MealGroup {
  meal: MealType;
  label: string;
  entries: MealPlanEntry[];
  calories: number;
}

interface DayGroup {
  day: number;
  label: string;
  meals: MealGroup[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-my-nutrition-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './my-nutrition.page.html',
  styleUrl: './my-nutrition.page.css',
})
export class MyNutritionPage implements OnInit {
  private readonly mealPlans = inject(MealPlanService);

  readonly Salad = Salad;
  readonly UtensilsCrossed = UtensilsCrossed;
  readonly AlertTriangle = AlertTriangle;

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly hasNoPlan = signal(false);
  readonly plan = signal<MealPlanDetail | null>(null);

  readonly days = computed<DayGroup[]>(() => {
    const p = this.plan();
    if (!p) return [];

    return DAY_ORDER.map((day) => {
      const dayEntries = p.entries.filter((e) => e.day === day);
      if (dayEntries.length === 0) return null;

      const meals: MealGroup[] = MEAL_TYPE_ORDER.map((meal) => {
        const entries = dayEntries.filter((e) => e.meal === meal);
        if (entries.length === 0) return null;
        return {
          meal,
          label: MEAL_TYPE_LABEL[meal],
          entries,
          calories: round(entries.reduce((sum, e) => sum + e.calories, 0)),
        };
      }).filter((m): m is MealGroup => m !== null);

      return {
        day,
        label: DAY_LABEL[day],
        meals,
        calories: round(dayEntries.reduce((s, e) => s + e.calories, 0)),
        protein: round(dayEntries.reduce((s, e) => s + e.protein, 0)),
        carbs: round(dayEntries.reduce((s, e) => s + e.carbs, 0)),
        fat: round(dayEntries.reduce((s, e) => s + e.fat, 0)),
      };
    }).filter((d): d is DayGroup => d !== null);
  });

  ngOnInit(): void {
    this.loadActivePlan();
  }

  /**
   * Client self-service: `GET /api/my/meal-plans/active` (JWT-scoped, no id needed) —
   * one request for the single active plan, fully resolved. `404` means the client
   * has no active plan (the "one active plan" rule guarantees 0 or 1). The staff route
   * `/api/meal-plans/client/{id}/active` 403s for a Client — see MealPlanService.
   */
  private loadActivePlan(): void {
    this.mealPlans.getMyActivePlan().subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 404) {
          this.hasNoPlan.set(true);
        } else {
          this.error.set(err?.detail ?? 'No se pudo cargar tu plan de comidas.');
        }
      },
    });
  }
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
