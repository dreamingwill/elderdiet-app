import { useState, useEffect } from 'react';
import { authStorage } from '@/utils/authStorage';

interface AuthState {
  token: string | null;
  uid: string | null;
  role: string | null;
  phone: string | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    uid: null,
    role: null,
    phone: null,
    isLoading: true,
  });

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const [token, uid, role, phone] = await Promise.all([
        authStorage.getItem('userToken'),
        authStorage.getItem('userUid'),
        authStorage.getItem('userRole'),
        authStorage.getItem('userPhone'),
      ]);

      setAuthState({
        token,
        uid,
        role,
        phone,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load auth data:', error);
      setAuthState({
        token: null,
        uid: null,
        role: null,
        phone: null,
        isLoading: false,
      });
    }
  };

  const updateAuthData = async (newData: Partial<AuthState>) => {
    setAuthState(prev => ({
      ...prev,
      ...newData,
    }));
  };

  const clearAuthData = async () => {
    await authStorage.clearAuthData();
    setAuthState({
      token: null,
      uid: null,
      role: null,
      phone: null,
      isLoading: false,
    });
  };

  return {
    ...authState,
    updateAuthData,
    clearAuthData,
    refreshAuthData: loadAuthData,
  };
};

export default useAuth; 