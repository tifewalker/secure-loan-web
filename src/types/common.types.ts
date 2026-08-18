// ==================== COMMON/UTILITY TYPES ====================
import type React from 'react';

export interface ApiError {
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavItem[];
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface PermissionGuardProps {
  permission?: string;
  resource?: string;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}