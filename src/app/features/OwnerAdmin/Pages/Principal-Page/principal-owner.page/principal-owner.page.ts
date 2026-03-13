import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardService } from '../../../services/dashboard.service';
import { DashboardStatsResponse, GymSummaryDto } from '../../../Models/dashboard.models';
import {
  Home, Users, UserRound, TrendingUp, CreditCard,
  Building2, LayoutGrid, Clock, Receipt,
  UserCircle, Phone, Heart, Star, Activity,
  MessageSquare, Briefcase, FileBarChart,
  UsersRound, Settings, BarChart3, Wallet,
  Plus, TrendingDown, Pencil, Trash2, UserCheck,
} from 'lucide-angular';

import { CreateGymModalComponent }    from '../../../Components/create-gym-modal/create-gym-modal.component/create-gym-modal.component';
import { EditGymModalComponent }      from '../../../Components/edit-gym-modal/edit-gym-modal.component/edit-gym-modal.component';
import { AssignAdminModalComponent }  from '../../../Components/assign-admin-modal/assign-admin-modal.component';
import { GymService }                 from '../../../services/gym.service';
import { GymListItemResponse }        from '../../../Models/gym.models';
import { DialogService }              from '../../../../../Core/Dialog/dialog.service';




export interface PlanRow {
  readonly name:     string;
  readonly widthPct: number;
  readonly color:    string;
  readonly count:    string;
}

export interface ActivityItem {
  readonly dot:    'coffee' | 'navy' | 'gold' | 'muted';
  readonly text:   string;
  readonly strong: string;
  readonly suffix: string;
  readonly time:   string;
}

export interface ActionItem {
  readonly label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly icon: any;
}

export interface RevenueBar {
  readonly month:  string;
  readonly pct:    number;
  readonly active: boolean;
}

export interface SignupAvatar {
  readonly initials: string;
  readonly color:    string;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector:    'app-principal-owner-page',
  standalone:  true,
  imports:     [CommonModule, LucideAngularModule, CreateGymModalComponent, EditGymModalComponent, AssignAdminModalComponent],
  templateUrl: './principal-owner.page.html',
})
export class PrincipalOwnerPage implements OnInit {

  private readonly dashboardService = inject(DashboardService);
  private readonly gymService       = inject(GymService);
  private readonly dialogService    = inject(DialogService);

  // ── Icon refs ─────────────────────────────────────────────────────────────
  readonly Home          = Home;
  readonly Users         = Users;
  readonly UserRound     = UserRound;
  readonly TrendingUp    = TrendingUp;
  readonly TrendingDown  = TrendingDown;
  readonly CreditCard    = CreditCard;
  readonly Building2     = Building2;
  readonly LayoutGrid    = LayoutGrid;
  readonly Clock         = Clock;
  readonly Receipt       = Receipt;
  readonly UserCircle    = UserCircle;
  readonly Phone         = Phone;
  readonly Heart         = Heart;
  readonly Star          = Star;
  readonly Activity      = Activity;
  readonly MessageSquare = MessageSquare;
  readonly Briefcase     = Briefcase;
  readonly FileBarChart  = FileBarChart;
  readonly UsersRound    = UsersRound;
  readonly Settings      = Settings;
  readonly BarChart3     = BarChart3;
  readonly Wallet        = Wallet;
  readonly Plus          = Plus;
  readonly Pencil        = Pencil;
  readonly Trash2        = Trash2;
  readonly UserCheck     = UserCheck;

  // ── Remote state ──────────────────────────────────────────────────────────
  readonly isLoading       = signal<boolean>(true);
  readonly error           = signal<string | null>(null);
  readonly stats           = signal<DashboardStatsResponse | null>(null);
  readonly showCreateModal = signal<boolean>(false);

  // ── Edit modal state ──────────────────────────────────────────────────────
  readonly showEditModal  = signal(false);
  readonly editingGymId   = signal<string | null>(null);

  // ── Assign Admin modal state ───────────────────────────────────────────────
  readonly showAssignModal   = signal(false);
  readonly assigningGymId    = signal<string | null>(null);
  readonly assigningGymName  = signal('');

  // ── Computed — numbers ────────────────────────────────────────────────────
  readonly totalGyms     = computed(() => this.stats()?.totalGyms     ?? 0);
  readonly totalClients  = computed(() => this.stats()?.totalClients  ?? 0);
  readonly totalCoaches  = computed(() => this.stats()?.totalCoaches  ?? 0);
  readonly totalRoutines = computed(() => this.stats()?.totalRoutines ?? 0);
  readonly gyms          = computed(() => this.stats()?.gyms          ?? []);

  readonly totalAdmins = computed(() =>
    this.gyms().reduce((sum, g) => sum + g.adminCount, 0)
  );

  readonly totalPeople = computed(() =>
    this.totalClients() + this.totalCoaches() + this.totalAdmins()
  );

  // ── Computed — donut percentages ──────────────────────────────────────────
  readonly clientsPct = computed(() =>
    this.totalPeople() > 0
      ? Math.round((this.totalClients() / this.totalPeople()) * 100)
      : 0
  );

  readonly coachesPct = computed(() =>
    this.totalPeople() > 0
      ? Math.round((this.totalCoaches() / this.totalPeople()) * 100)
      : 0
  );

  readonly adminsPct = computed(() =>
    this.totalPeople() > 0
      ? Math.round((this.totalAdmins() / this.totalPeople()) * 100)
      : 0
  );

  // ── Computed — avatars ────────────────────────────────────────────────────
  private readonly _avatarColors = ['#8B7355', '#1e3d59', '#2a5278', '#C6A969', '#8B7355'];

  readonly recentSignups = computed<SignupAvatar[]>(() =>
    this.gyms().slice(0, 5).map((g, i) => ({
      initials: g.name.substring(0, 2).toUpperCase(),
      color:    this._avatarColors[i % this._avatarColors.length],
    }))
  );

  // ── Date ──────────────────────────────────────────────────────────────────
  private readonly _now = signal<Date>(new Date());

  readonly currentMonthYear = computed<string>(() =>
    this._now().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  // ── Static data ───────────────────────────────────────────────────────────
  readonly plans: readonly PlanRow[] = [
    { name: 'Enterprise', widthPct: 35, color: '#1e3d59', count: '8 gyms'  },
    { name: 'Pro',        widthPct: 54, color: '#8B7355', count: '13 gyms' },
    { name: 'Starter',    widthPct: 12, color: '#C6A969', count: '3 gyms'  },
    { name: 'Trial',      widthPct: 8,  color: '#d6d3d1', count: '2 gyms'  },
  ] as const;

  readonly activities: readonly ActivityItem[] = [
    { dot: 'coffee', text: 'New gym',    strong: 'IronFit Liberia', suffix: 'signed up',               time: '2 min ago'  },
    { dot: 'navy',   text: 'Coach',      strong: 'Ana Mora',        suffix: 'assigned to 12 clients',  time: '15 min ago' },
    { dot: 'gold',   text: '',           strong: 'PowerHouse SJ',   suffix: 'trial expires in 3 days', time: '1 hr ago'   },
    { dot: 'navy',   text: 'Routine at', strong: "Gold's CR",       suffix: 'published',               time: '3 hrs ago'  },
    { dot: 'coffee', text: '',           strong: 'Xcellence Gym',   suffix: 'subscription cancelled',  time: 'Yesterday'  },
    { dot: 'gold',   text: '',           strong: 'EliteBody',       suffix: 'upgraded to Enterprise',  time: 'Yesterday'  },
  ] as const;

  readonly actions: readonly ActionItem[] = [
    { label: 'Manage Users',     icon: UsersRound },
    { label: 'System Settings',  icon: Settings   },
    { label: 'View Reports',     icon: BarChart3  },
    { label: 'Billing Overview', icon: Wallet     },
  ] as const;

  readonly revenueBars: readonly RevenueBar[] = [
    { month: 'Aug', pct: 55,  active: false },
    { month: 'Sep', pct: 62,  active: false },
    { month: 'Oct', pct: 48,  active: false },
    { month: 'Nov', pct: 71,  active: false },
    { month: 'Dec', pct: 66,  active: false },
    { month: 'Jan', pct: 79,  active: false },
    { month: 'Feb', pct: 84,  active: false },
    { month: 'Mar', pct: 100, active: true  },
  ] as const;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDashboard();
  }

  // ── Create Modal ──────────────────────────────────────────────────────────
  openCreateModal(): void  { this.showCreateModal.set(true);  }
  closeCreateModal(): void { this.showCreateModal.set(false); }

  onGymCreated(): void {
    this.showCreateModal.set(false);
    this.loadDashboard();
  }

  // ── Edit Modal ────────────────────────────────────────────────────────────
  editGym(gymId: string): void {
    this.editingGymId.set(gymId);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.editingGymId.set(null);
    this.showEditModal.set(false);
  }

  onGymUpdated(): void {
    this.closeEditModal();
    this.loadDashboard();
  }

  // ── Assign Admin ──────────────────────────────────────────────────────────
  openAssignAdmin(gymId: string, gymName: string): void {
    this.assigningGymId.set(gymId);
    this.assigningGymName.set(gymName);
    this.showAssignModal.set(true);
  }

  closeAssignAdmin(): void {
    this.showAssignModal.set(false);
    this.assigningGymId.set(null);
    this.assigningGymName.set('');
  }

  onAdminAssigned(): void {
    this.closeAssignAdmin();
    this.loadDashboard();
  }

  // ── Gym Actions ───────────────────────────────────────────────────────────
  activateGym(gymId: string): void {
    this.gymService.activate(gymId).subscribe({
      next: () => this.loadDashboard(),
    });
  }

  deactivateGym(gymId: string): void {
    this.gymService.deactivate(gymId).subscribe({
      next: () => this.loadDashboard(),
    });
  }

  async deleteGym(gymId: string, gymName: string): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title:       'Delete Gym',
      message:     `Are you sure you want to delete "${gymName}"?`,
      confirmText: 'Delete',
      cancelText:  'Cancel',
    });

    if (confirmed) {
      this.gymService.delete(gymId).subscribe({
        next: () => this.loadDashboard(),
      });
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private loadDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[Dashboard] Failed to load stats', err);
        this.error.set('Failed to load dashboard data. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  getStatus(gym: GymSummaryDto): 'active' | 'inactive' {
    return gym.isActive ? 'active' : 'inactive';
  }

  getAvatarColor(name: string): string {
    const colors = ['#1e3d59', '#8B7355', '#C6A969', '#2a5278', '#a8a29e'];
    return colors[name.charCodeAt(0) % colors.length];
  }

  dotColor(dot: ActivityItem['dot']): string {
    const map: Record<ActivityItem['dot'], string> = {
      coffee: 'bg-[#8B7355]',
      navy:   'bg-[#1e3d59]',
      gold:   'bg-[#C6A969]',
      muted:  'bg-stone-300',
    };
    return map[dot];
  }

  badgeClasses(status: 'active' | 'inactive' | 'trial'): string {
    const map: Record<'active' | 'inactive' | 'trial', string> = {
      active:   'bg-[#8B7355]/10 text-[#8B7355]',
      trial:    'bg-[#C6A969]/20 text-[#a87800]',
      inactive: 'bg-stone-100 text-stone-400',
    };
    return map[status];
  }

  accentBorder(status: 'active' | 'inactive' | 'trial'): string {
    const map: Record<'active' | 'inactive' | 'trial', string> = {
      active:   'bg-gradient-to-r from-[#8B7355] to-[#C6A969]',
      trial:    'bg-[#C6A969]',
      inactive: 'bg-stone-300',
    };
    return map[status];
  }
}
