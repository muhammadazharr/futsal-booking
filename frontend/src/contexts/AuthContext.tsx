import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types';
import { authService, getErrorMessage } from '../services';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!accessToken && !!user;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify token is still valid by fetching user profile
          try {
            const currentUser = await authService.getMe();
            setUser(currentUser);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
          } catch {
            // Token might be expired, try to refresh
            const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshTokenValue) {
              try {
                const tokens = await authService.refreshToken(refreshTokenValue);
                setAccessToken(tokens.accessToken);
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
                if (tokens.refreshToken) {
                  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
                }
                
                // Fetch user again with new token
                const currentUser = await authService.getMe();
                setUser(currentUser);
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
              } catch {
                // Refresh failed, clear everything
                clearAuthState();
              }
            } else {
              clearAuthState();
            }
          }
        }
      } catch {
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearAuthState = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);

      setUser(response.user);
      setAccessToken(response.accessToken);

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(data);

      setUser(response.user);
      setAccessToken(response.accessToken);

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshTokenValue) {
        await authService.logout(refreshTokenValue);
      }
    } catch {
      // Ignore logout errors, just clear local state
    } finally {
      clearAuthState();
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshTokenValue) {
      clearAuthState();
      return null;
    }

    try {
      const tokens = await authService.refreshToken(refreshTokenValue);
      
      setAccessToken(tokens.accessToken);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      
      if (tokens.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      }

      return tokens.accessToken;
    } catch {
      clearAuthState();
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
