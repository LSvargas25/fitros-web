import { Component, computed, signal } from '@angular/core';
import { CommonModule }                from '@angular/common';
import { LucideAngularModule }         from 'lucide-angular';
import {
  // Summary strip
  Home, Users, UserRound, TrendingUp, CreditCard,
  // Card headers
  Building2, LayoutGrid, Clock, Receipt,
  // Gym cards
  UserCircle, Phone,
  // Modules
  Heart, Star, Activity, MessageSquare, Briefcase, FileBarChart,
  // Actions — global admin oriented
  UsersRound, Settings, BarChart3, Wallet,
  // Misc
  Plus, TrendingDown,
} from 'lucide-angular';

// ── Strict types ────────────────────────────────────────────────

export interface KpiTile {
  readonly value:   string;
  readonly label:   string;
  readonly trend:   string;
  readonly trendUp: boolean;
  readonly accent:  string;   // Tailwind arbitrary color class for icon bg / border
}

export interface GymCard {
  readonly initial:   string;
  readonly name:      string;
  readonly admin:     string;
  readonly clients:   number;
  readonly coaches:   number;
  readonly admins:    number;
  readonly phone:     string;
  readonly mrr:       string;
  readonly status:    'active' | 'trial' | 'inactive';
  readonly avatarBg:  string;   // inline style only — not a token
}

export interface PlanRow {
  readonly name:    string;
  readonly widthPct: number;
  readonly color:   string;   // inline hex — Tailwind JIT can't handle runtime widths
  readonly count:   string;
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
  readonly icon:  any;
}

// ── Component ───────────────────────────────────────────────────

@Component({
  selector:    'app-principal-owner-page',
  standalone:  true,
  imports:     [CommonModule, LucideAngularModule],
  templateUrl: './principal-owner.page.html',
})
export class PrincipalOwnerPage {

  // ── Icon refs (required for [img] binding) ──────────────────
  readonly Home         = Home;
  readonly Users        = Users;
  readonly UserRound    = UserRound;
  readonly TrendingUp   = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly CreditCard   = CreditCard;
  readonly Building2    = Building2;
  readonly LayoutGrid   = LayoutGrid;
  readonly Clock        = Clock;
  readonly Receipt      = Receipt;
  readonly UserCircle   = UserCircle;
  readonly Phone        = Phone;
  readonly Heart        = Heart;
  readonly Star         = Star;
  readonly Activity     = Activity;
  readonly MessageSquare = MessageSquare;
  readonly Briefcase    = Briefcase;
  readonly FileBarChart = FileBarChart;
  readonly UsersRound   = UsersRound;
  readonly Settings     = Settings;
  readonly BarChart3    = BarChart3;
  readonly Wallet       = Wallet;
  readonly Plus         = Plus;

  // ── Dynamic date — Angular signal ───────────────────────────
  private readonly _now = signal<Date>(new Date());

  readonly currentMonthYear = computed<string>(() =>
    this._now().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  // ── Summary KPI tiles ────────────────────────────────────────
  readonly kpiTiles: readonly KpiTile[] = [
    { value: '24',     label: 'Active Gyms',    trend: '▲ 3 this month',  trendUp: true,  accent: 'bg-[#8B7355]/10' },
    { value: '962',    label: 'Total Clients',  trend: '▲ 48 this month', trendUp: true,  accent: 'bg-[#1e3d59]/8'  },
    { value: '196',    label: 'Coaches',        trend: '▲ 12 this month', trendUp: true,  accent: 'bg-[#C6A969]/15' },
    { value: '$48.2k', label: 'MRR',            trend: '▲ 12.4%',         trendUp: true,  accent: 'bg-emerald-50'   },
    { value: '$578k',  label: 'Total ARR',      trend: '▲ 18.2%',         trendUp: true,  accent: 'bg-stone-100'    },
  ] as const;

  // ── Gym cards ────────────────────────────────────────────────
  readonly gyms: readonly GymCard[] = [
    { initial: 'G', name: "Gold's Gym CR",     admin: 'Carlos Vega',  clients: 142, coaches: 3, admins: 1, phone: '+506 8800-1234', mrr: '$1,200/mo', status: 'active',   avatarBg: '#1e3d59'  },
    { initial: 'F', name: 'FitZone Heredia',   admin: 'Lucía Torres', clients: 210, coaches: 5, admins: 2, phone: '+506 7711-5566', mrr: '$2,100/mo', status: 'active',   avatarBg: '#8B7355'  },
    { initial: 'P', name: 'PowerHouse SJ',     admin: 'Marcos Ríos',  clients: 88,  coaches: 2, admins: 1, phone: '+506 6644-2299', mrr: '$800/mo',   status: 'trial',    avatarBg: '#C6A969'  },
    { initial: 'E', name: 'EliteBody Alajuela',admin: 'Sofia Mena',   clients: 175, coaches: 4, admins: 1, phone: '+506 8833-4477', mrr: '$1,750/mo', status: 'active',   avatarBg: '#2a5278'  },
    { initial: 'X', name: 'Xcellence Gym',     admin: 'Pablo Cruz',   clients: 34,  coaches: 1, admins: 1, phone: '+506 7799-0011', mrr: '$0/mo',     status: 'inactive', avatarBg: '#a8a29e'  },
  ] as const;

  // ── Subscription plans ───────────────────────────────────────
  readonly plans: readonly PlanRow[] = [
    { name: 'Enterprise', widthPct: 35, color: '#1e3d59', count: '8 gyms'  },
    { name: 'Pro',        widthPct: 54, color: '#8B7355', count: '13 gyms' },
    { name: 'Starter',    widthPct: 12, color: '#C6A969', count: '3 gyms'  },
    { name: 'Trial',      widthPct: 8,  color: '#d6d3d1', count: '2 gyms'  },
  ] as const;

  // ── Activity feed ────────────────────────────────────────────
  readonly activities: readonly ActivityItem[] = [
    { dot: 'coffee', text: 'New gym',    strong: 'IronFit Liberia',  suffix: 'signed up',                  time: '2 min ago'  },
    { dot: 'navy',   text: 'Coach',      strong: 'Ana Mora',         suffix: 'assigned to 12 clients',     time: '15 min ago' },
    { dot: 'gold',   text: '',           strong: 'PowerHouse SJ',    suffix: 'trial expires in 3 days',    time: '1 hr ago'   },
    { dot: 'navy',   text: 'Routine published at', strong: "Gold's CR", suffix: '',                        time: '3 hrs ago'  },
    { dot: 'coffee', text: '',           strong: 'Xcellence Gym',    suffix: 'subscription cancelled',     time: 'Yesterday'  },
    { dot: 'gold',   text: '',           strong: 'EliteBody',        suffix: 'upgraded to Enterprise',     time: 'Yesterday'  },
  ] as const;

  // ── Quick Actions — global admin oriented ────────────────────
  readonly actions: readonly ActionItem[] = [
    { label: 'Manage Users',    icon: UsersRound  },
    { label: 'System Settings', icon: Settings    },
    { label: 'View Reports',    icon: BarChart3   },
    { label: 'Billing Overview',icon: Wallet      },
  ] as const;

  // ── Revenue bars ─────────────────────────────────────────────
  readonly revenueBars = [
    { month: 'Aug', pct: 55,  active: false },
    { month: 'Sep', pct: 62,  active: false },
    { month: 'Oct', pct: 48,  active: false },
    { month: 'Nov', pct: 71,  active: false },
    { month: 'Dec', pct: 66,  active: false },
    { month: 'Jan', pct: 79,  active: false },
    { month: 'Feb', pct: 84,  active: false },
    { month: 'Mar', pct: 100, active: true  },
  ] as const;

  // ── Helpers ──────────────────────────────────────────────────
  dotColor(dot: ActivityItem['dot']): string {
    const map: Record<ActivityItem['dot'], string> = {
      coffee: 'bg-[#8B7355]',
      navy:   'bg-[#1e3d59]',
      gold:   'bg-[#C6A969]',
      muted:  'bg-stone-300',
    };
    return map[dot];
  }

  badgeClasses(status: GymCard['status']): string {
    const map: Record<GymCard['status'], string> = {
      active:   'bg-[#8B7355]/10 text-[#8B7355]',
      trial:    'bg-[#C6A969]/20 text-[#a87800]',
      inactive: 'bg-stone-100 text-stone-400',
    };
    return map[status];
  }

  accentBorder(status: GymCard['status']): string {
    const map: Record<GymCard['status'], string> = {
      active:   'group-hover:bg-gradient-to-r group-hover:from-[#8B7355] group-hover:to-[#C6A969]',
      trial:    'group-hover:bg-[#C6A969]',
      inactive: 'group-hover:bg-stone-300',
    };
    return map[status];
  }
}
