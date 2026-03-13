export interface GymListItemResponse {
  id:          string;
  name:        string;
  phoneNumber: string;
  isActive:    boolean;
  clientCount: number;
  coachCount:  number;
  adminCount:  number;
}

export interface CreateGymRequest {
  name:        string;
  address:     string;
  phoneNumber: string;
  logoUrl?:    string;
}

export interface GymDetail {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  logoUrl?: string;
  isActive: boolean;
  clientCount: number;
  coachCount: number;
  adminCount: number;
}

export interface UpdateGymDto {
  name: string;
  address: string;
  phoneNumber: string;
  logoUrl?: string;
}
