import type { AppUser, LoginCredentials, Permission } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Token management
export const TOKEN_KEY = 'jwt_token';
export const USER_KEY = 'jwt_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AppUser | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setStoredUser(user: AppUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// API request helper with JWT
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge with any custom headers from options
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const url = `${API_URL}${endpoint}`;
  console.log('🌐 API Request:', url);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('📡 API Response:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      console.error('❌ API Error:', error);
      
      if (response.status === 401) {
        // For login endpoint, don't redirect - just throw the error
        if (endpoint === '/auth/login') {
          throw new Error(error.error || error.message || 'بيانات الدخول غير صحيحة');
        }
        // For other endpoints, token expired or invalid
        removeToken();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('❌ Network Error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please ensure the backend is running at ' + API_URL);
    }
    throw error;
  }
}

// Authentication functions
export async function signIn(credentials: LoginCredentials): Promise<AppUser> {
  console.log('🔍 JWT: Signing in:', credentials.email);
  console.log('🔍 JWT: Credentials object:', credentials);
  console.log('🔍 JWT: Stringified body:', JSON.stringify(credentials));
  
  const response = await apiRequest<{
    access_token: string;
    user: any;
    app_user: any;
    permissions: Record<string, string[]>;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  console.log('✅ JWT: Login response received:', response);
  console.log('✅ JWT: Token:', response.access_token ? 'Present' : 'Missing');
  console.log('✅ JWT: User:', response.user);
  console.log('✅ JWT: App User:', response.app_user);

  // Store token
  setToken(response.access_token);
  console.log('✅ JWT: Token stored');

  // Create AppUser object
  const user: AppUser = {
    id: response.app_user?.id || response.user.id,
    authUserId: response.user.id,
    email: response.user.email,
    fullName: response.app_user?.full_name || response.user.name,
    role: response.app_user?.role || 'staff',
    status: response.app_user?.status || 'active',
    createdAt: response.app_user?.created_at || new Date().toISOString(),
    updatedAt: response.app_user?.updated_at || new Date().toISOString(),
    lastLogin: response.app_user?.last_login,
    // Teacher-specific fields
    teacherId: response.app_user?.teacher_id,
    teacherName: response.app_user?.teacher_name,
    teacherCampusId: response.app_user?.teacher_campus_id,
    departmentId: response.app_user?.department_id,
    departmentName: response.app_user?.department_name,
  };

  console.log('✅ JWT: User object created:', user);

  // Store user data
  setStoredUser(user);
  console.log('✅ JWT: User stored in localStorage');

  return user;
}

export async function signOut(): Promise<void> {
  console.log('🔍 JWT: Signing out');
  
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    removeToken();
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await apiRequest<{
      user: any;
      app_user: any;
      permissions: Record<string, string[]>;
    }>('/auth/me');

    const user: AppUser = {
      id: response.app_user?.id || response.user.id,
      authUserId: response.user.id,
      email: response.user.email,
      fullName: response.app_user?.full_name || response.user.name,
      role: response.app_user?.role || 'staff',
      status: response.app_user?.status || 'active',
      createdAt: response.app_user?.created_at || new Date().toISOString(),
      updatedAt: response.app_user?.updated_at || new Date().toISOString(),
      lastLogin: response.app_user?.last_login,
      // Teacher-specific fields
      teacherId: response.app_user?.teacher_id,
      teacherName: response.app_user?.teacher_name,
      teacherCampusId: response.app_user?.teacher_campus_id,
      departmentId: response.app_user?.department_id,
      departmentName: response.app_user?.department_name,
    };

    setStoredUser(user);
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    removeToken();
    return null;
  }
}

export async function refreshToken(): Promise<string | null> {
  try {
    const response = await apiRequest<{
      access_token: string;
    }>('/auth/refresh', {
      method: 'POST',
    });

    setToken(response.access_token);
    return response.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    removeToken();
    return null;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    }),
  });
}

export async function updateProfile(data: {
  name?: string;
  email?: string;
}): Promise<AppUser> {
  const response = await apiRequest<{
    user: any;
    app_user: any;
  }>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  const user: AppUser = {
    id: response.app_user?.id || response.user.id,
    authUserId: response.user.id,
    email: response.user.email,
    fullName: response.app_user?.full_name || response.user.name,
    role: response.app_user?.role || 'staff',
    status: response.app_user?.status || 'active',
    createdAt: response.app_user?.created_at || new Date().toISOString(),
    updatedAt: response.app_user?.updated_at || new Date().toISOString(),
    lastLogin: response.app_user?.last_login,
  };

  setStoredUser(user);
  return user;
}

// Permission functions (same as before)
export function hasPermission(
  permissions: Permission[],
  resource: string,
  action: string
): boolean {
  const permission = permissions.find(p => p.resource === resource);
  return permission ? permission.actions.includes(action) : false;
}

// Permission matrix (for quick client-side checks)
export const PERMISSIONS = {
  manager: {
    students: ['view', 'create', 'edit', 'delete'],
    fees: ['view', 'create', 'edit', 'delete'],
    teachers: ['view', 'create', 'edit', 'delete'],
    departments: ['view', 'create', 'edit', 'delete'],
    subjects: ['view', 'create', 'edit', 'delete'],
    finance: ['view', 'create', 'edit', 'delete'],
    users: ['view', 'create', 'edit', 'delete'],
    sessions: ['view', 'create', 'edit', 'delete'],
    attendance: ['view', 'create', 'edit', 'delete'],
    grades: ['view', 'create', 'edit', 'delete'],
    schedule: ['view', 'create', 'edit', 'delete'],
    receipts: ['view', 'create', 'edit', 'delete'],
    reports: ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'create', 'edit', 'delete'],
    study_materials: ['view', 'create', 'edit', 'delete'],
    qr_codes: ['view', 'create', 'edit', 'delete'],
    notifications: ['view', 'create', 'edit', 'delete'],
    logs: ['view', 'create', 'edit', 'delete'],
  },
  staff: {
    students: ['view', 'create'],
    fees: ['view'],
    'student-registration': ['view', 'create'],
    'student-enrollments': ['view', 'create'],
  },
  teacher: {
    sessions: ['view', 'create', 'edit', 'delete'],
    attendance: ['view', 'create', 'edit'],
    grades: ['view', 'create', 'edit', 'delete'],
    students: ['view'],
    subjects: ['view'],
    schedule: ['view', 'edit'],
    departments: ['view'],
  },
} as const;

export function hasClientPermission(
  role: string,
  resource: string,
  action: string
): boolean {
  if (role === 'manager') {
    return true;
  }
  
  const rolePermissions = PERMISSIONS[role as keyof typeof PERMISSIONS];
  if (!rolePermissions) return false;
  
  const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
  if (!resourcePermissions) return false;
  
  return resourcePermissions.includes(action as any);
}

// Action logging (optional - can be implemented later)
export async function logUserAction(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  // This can be implemented as a backend endpoint if needed
  console.log('User action:', { userId, action, resource, resourceId, details });
}
