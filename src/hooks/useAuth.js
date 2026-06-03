import { useMutation, useQuery } from '@tanstack/react-query';
import client from '../api/client';

// Login hook
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials) => {
      // FastAPI OAuth2PasswordRequestForm expects form data with 'username' field
      console.log('🔍 LOGIN DEBUG - Sending to:', '/auth/login');
      console.log('🔍 LOGIN DEBUG - Credentials:', credentials);

      const formData = new URLSearchParams();
      formData.append('username', credentials.email); // Backend expects 'username' not 'email'
      formData.append('password', credentials.password);

      console.log('🔍 LOGIN DEBUG - Form data:', formData.toString());

      const response = await client.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.access_token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify({
          id: response.data.user_id,
          email: response.data.email,
          fullName: response.data.full_name
        }));
        localStorage.setItem('userName', response.data.full_name);
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Login successful:', data);

      // Save user data to localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userName', data.full_name);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userId', data.user_id);

      // Decode JWT as backup in case direct fields change
      try {
        const decoded = JSON.parse(atob(data.access_token.split('.')[1]));
        if (!data.full_name && decoded.name) {
          localStorage.setItem('userName', decoded.name);
        }
      } catch (e) { }
    },
    onError: (error) => {
      console.error('❌ Login failed:', error);
      if (error.response?.data) {
        console.error('❌ API error:', error.response.data);
      }
    },
  });
};

// Register hook
export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData) => {
      console.log('🔍 REGISTER DEBUG - Sending to:', '/auth/register');
      console.log('🔍 REGISTER DEBUG - User data:', userData);
      console.log('🔍 REGISTER DEBUG - User data JSON:', JSON.stringify(userData));

      const response = await client.post('/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.user) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify({
          id: response.data.user.id,
          email: response.data.user.email,
          fullName: response.data.user.full_name
        }));
        localStorage.setItem('userName', response.data.user.full_name);
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Registration successful:', data);

      // Save user data after signup
      localStorage.setItem('userName', data.full_name || data.user?.full_name);
      localStorage.setItem('userEmail', data.email || data.user?.email);
    },
    onError: (error) => {
      console.error('❌ Registration failed:', error);
      if (error.response?.data) {
        console.error('❌ API error:', error.response.data);
      }
    },
  });
};

// Get current user hook
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      try {
        const response = await client.get('/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error) {
        console.error('❌ Failed to get current user:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Logout hook
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          await client.post('/auth/logout', {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.error('❌ Logout API call failed:', error);
        }
      }

      // Clear localStorage regardless of API call success
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('authToken');

      return { success: true };
    },
    onSuccess: () => {
      console.log('✅ Logout successful');
    },
    onError: (error) => {
      console.error('❌ Logout failed:', error);
    },
  });
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken');

  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('authToken');
  return !!token;
};

// Helper function to get current user from localStorage
export const getCurrentUserFromStorage = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};
