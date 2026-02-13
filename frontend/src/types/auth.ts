export type UserRole = 'manager' | 'staff' | 'teacher' | 'student';

export interface AppUser {
  id: string;
  authUserId: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  // Teacher-specific fields
  teacherId?: string;
  teacherName?: string;
  teacherCampusId?: string;
  departmentId?: string;
  departmentName?: string;
  // Student-specific fields
  studentId?: string;
  studentName?: string;
  studentCampusId?: string;
  studentYear?: number;
}

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}
