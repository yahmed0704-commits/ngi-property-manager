import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { User, UserRole } from '@/types';

const DEMO_USERS: User[] = [
  { id: 'u1', name: 'Jordan Lee', email: 'jordan@nexusgrowth.com', password: 'ngi2024', role: 'Admin' },
  { id: 'u2', name: 'Marcus Kim', email: 'marcus@nexusgrowth.com', password: 'ngi2024', role: 'Partner' },
  { id: 'u3', name: 'Alex Rivera', email: 'alex@nexusgrowth.com', password: 'ngi2024', role: 'Project Manager' },
  { id: 'u4', name: 'Sam Torres', email: 'sam@nexusgrowth.com', password: 'ngi2024', role: 'Contractor' },
  { id: 'u5', name: 'Casey Morgan', email: 'casey@nexusgrowth.com', password: 'ngi2024', role: 'Accountant' },
];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('ngi_user').then((stored) => {
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const found = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!found) return { success: false, error: 'Invalid email or password.' };
    await AsyncStorage.setItem('ngi_user', JSON.stringify(found));
    setUser(found);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('ngi_user');
    setUser(null);
  }, []);

  const editRoles: UserRole[] = ['Admin', 'Partner', 'Project Manager', 'Accountant'];
  const deleteRoles: UserRole[] = ['Admin', 'Partner'];
  const approveRoles: UserRole[] = ['Admin', 'Partner', 'Accountant'];

  const canEdit = user ? editRoles.includes(user.role) : false;
  const canDelete = user ? deleteRoles.includes(user.role) : false;
  const canApprove = user ? approveRoles.includes(user.role) : false;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, canEdit, canDelete, canApprove }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
