'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/contexts/AuthContext';

export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
} 