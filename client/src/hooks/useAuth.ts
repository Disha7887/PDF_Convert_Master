import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  plan: string;
  limits: {
    daily: number;
    monthly: number;
  };
  usage: {
    daily: number;
    monthly: number;
  };
  subscription: {
    status: string;
    stripeCustomerId: string | null;
  };
  createdAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Set up default authorization header
    const originalFetch = window.fetch;
    window.fetch = (input, init = {}) => {
      return originalFetch(input, {
        ...init,
        headers: {
          ...init.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
    };

    // Fetch user profile
    apiRequest('GET', '/api/auth/profile')
      .then((data) => {
        // Handle both old and new response formats for backwards compatibility
        setUser(data.user || data);
      })
      .catch((error) => {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    window.location.href = '/';
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}