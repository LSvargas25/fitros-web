import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Building2, Users, UserCheck, Dumbbell, BarChart3 } from 'lucide-angular';
import { DashboardService } from '../../../OwnerAdmin/services/dashboard.service';
import { DashboardStatsResponse } from '../../../OwnerAdmin/Models/dashboard.models';

@Component({
  selector: 'app-dashboard.page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly Building2  = Building2;
  readonly Users      = Users;
  readonly UserCheck  = UserCheck;
  readonly Dumbbell   = Dumbbell;
  readonly BarChart3  = BarChart3;

  readonly isLoading = signal(true);
  readonly stats     = signal<DashboardStatsResponse | null>(null);
  readonly error     = signal<string | null>(null);

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.detail ?? 'Failed to load dashboard stats.');
        this.isLoading.set(false);
      },
    });
  }
}
