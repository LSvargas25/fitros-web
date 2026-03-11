export interface DashboardStatsResponse {
  totalGyms: number;
  totalClients: number;
  totalCoaches: number;
  totalRoutines: number;
  gyms: GymSummaryDto[];
}

export interface GymSummaryDto {
  id: string;
  name: string;
  phoneNumber: string;
  isActive: boolean;
  clientCount: number;
  coachCount: number;
  adminCount: number;
}
