'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { staffAPI } from '@/lib/api/staff';
import type { Staff, LoginRequest } from '@/types/staff';
import { StaffRole } from '@/types/staff';

interface AuthContextType {
  staff: Staff | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isSuperAdmin: boolean;
  isDepartmentHead: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch current staff profile
  const fetchProfile = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        setIsLoading(false);
        return;
      }

      const profile = await staffAPI.getMe();
      setStaff(profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      apiClient.clearTokens();
      setStaff(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (data: LoginRequest) => {
    try {
      const response = await staffAPI.login(data);
      apiClient.setTokens(response.accessToken, response.refreshToken);
      setStaff(response.staff);

      // Redirect based on mustChangePassword
      if (response.staff.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    apiClient.clearTokens();
    setStaff(null);
    router.push('/login');
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  // Permission checks
  const hasPermission = (permission: string): boolean => {
    if (!staff) return false;
    if (staff.role === StaffRole.SUPER_ADMIN) return true; // Super admin has all permissions

    // Check department permissions
    const departmentPermissions = staff.departmentPermissions || [];
    return departmentPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  };

  const isSuperAdmin = staff?.role === StaffRole.SUPER_ADMIN;
  const isDepartmentHead = staff?.role === StaffRole.DEPARTMENT_HEAD;

  const value: AuthContextType = {
    staff,
    isLoading,
    isAuthenticated: !!staff,
    login,
    logout,
    refreshProfile,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isDepartmentHead,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
