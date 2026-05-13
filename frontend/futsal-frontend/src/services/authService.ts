import api from './api';
import type { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User 
} from '../types';

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  LOGOUT_ALL: '/auth/logout-all',
  ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/change-password',
};

export const authService = {
  /**
   * Login with phone and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<{ data: AuthResponse } | AuthResponse>(
      AUTH_ENDPOINTS.LOGIN, 
      credentials
    );
    // Handle both wrapped and unwrapped response formats
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as AuthResponse;
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<{ data: AuthResponse } | AuthResponse>(
      AUTH_ENDPOINTS.REGISTER, 
      data
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as AuthResponse;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await api.post<{ data: { accessToken: string; refreshToken?: string } }>(
      AUTH_ENDPOINTS.REFRESH, 
      { refreshToken }
    );
    return response.data.data || response.data;
  },

  /**
   * Logout current session
   */
  async logout(refreshToken: string): Promise<void> {
    await api.post(AUTH_ENDPOINTS.LOGOUT, { refreshToken });
  },

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    await api.post(AUTH_ENDPOINTS.LOGOUT_ALL);
  },

  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    const response = await api.get<{ data: User } | User>(AUTH_ENDPOINTS.ME);
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as User;
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
  },
};
