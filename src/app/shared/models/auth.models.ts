export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds?: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds?: number;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface GoogleLoginResponse {
  userId: string;
  email: string;
  role: number;
  accessToken: string;
  refreshToken: string;
}
