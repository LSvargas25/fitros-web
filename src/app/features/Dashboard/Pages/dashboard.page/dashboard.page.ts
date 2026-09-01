import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Building2, Users, UserCheck, Dumbbell, BarChart3 } from 'lucide-angular';
import { DashboardService } from '../../../OwnerAdmin/services/dashboard.service';
import { DashboardStatsResponse } from '../../../OwnerAdmin/Models/dashboard.models';
import { SessionFacade } from '../../../../core/auth/session-facade';

@Component({
  selector: 'app-dashboard.page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly session = inject(SessionFacade);

  /**
   * `GET /api/dashboard` returns the same shape for every role, but the numbers mean
   * different things: platform-wide for OwnerApp, scoped to a single gym for Admin/Coach.
   * Only the Owner sees the multi-gym framing (the "Gyms" stat card + the gyms table);
   * for staff those would just restate their own gym, so they get a "your gym" heading
   * and the four scoped cards. Product decision, 2026-08-31 (FRONTEND_AUDIT.md §5a).
   */
  readonly isOwner = this.session.role === 'OwnerApp';

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
        this.stats.set(normalizeStats(data));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.detail ?? 'Failed to load dashboard stats.');
        this.isLoading.set(false);
      },
    });
  }
}

/**
 * `GET /api/dashboard` returns the SAME shape for every role (confirmed with the
 * backend): Owner gets platform-wide totals, Admin/Coach get the same fields scoped
 * to their one gym, and an Admin/Coach with no gym gets all-zero totals + `gyms: []`
 * (200, not 403). This coercion is therefore only a guard against future contract
 * drift / a partial deserialization — every field the template dereferences gets a
 * safe default so the page renders zeros / an empty gyms table instead of throwing.
 */
function normalizeStats(data: Partial<DashboardStatsResponse> | null | undefined): DashboardStatsResponse {
  return {
    totalGyms: data?.totalGyms ?? 0,
    totalAdmins: data?.totalAdmins ?? 0,
    totalClients: data?.totalClients ?? 0,
    totalCoaches: data?.totalCoaches ?? 0,
    totalRoutines: data?.totalRoutines ?? 0,
    gyms: data?.gyms ?? [],
  };
}
