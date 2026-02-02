// Database Schema Documentation
// This file contains the complete database schema for the University Management System

export interface DatabaseSchema {
  // Core Tables
  students: {
    id: string; // PRIMARY KEY
    name: string;
    name_en?: string;
    department_id?: string; // FOREIGN KEY -> departments(id)
    year?: number;
    email?: string; // UNIQUE
    phone?: string;
    status?: string; // DEFAULT 'active'
    nationality?: string;
    gender?: string;
    birth_date?: string;
    enrollment_date?: string;
    address?: string;
    national_id_passport?: string; // UNIQUE
    academic_history?: string;
    qr_code?: string;
    // academic_history_type?: string; // Removed due to database constraint issues
    academic_score?: string;
    transcript_file?: string;
    sponsor_name?: string;
    sponsor_contact?: string;
    created_at?: string;
    updated_at?: string;
  };

  teachers: {
    id: string; // PRIMARY KEY
    name: string;
    name_en?: string;
    department_id?: string; // FOREIGN KEY -> departments(id) [DEPRECATED - use teacher_departments]
    email?: string; // UNIQUE
    phone?: string;
    qualification?: string;
    specialization?: string;
    years_experience?: number;
    availability?: any; // jsonb
    specializations?: string[]; // ARRAY
    teaching_hours?: number;
    hourly_rate?: number;
    basic_salary?: number;
    education_level?: string;
    created_at?: string;
    updated_at?: string;
  };

  teacher_departments: {
    id: string; // PRIMARY KEY
    teacher_id: string; // FOREIGN KEY -> teachers(id)
    department_id: string; // FOREIGN KEY -> departments(id)
    is_primary_department?: boolean; // DEFAULT false
    is_active?: boolean; // DEFAULT true
    start_date?: string;
    end_date?: string;
    created_at?: string;
    updated_at?: string;
  };

  departments: {
    id: string; // PRIMARY KEY
    name: string;
    name_en?: string;
    head?: string; // DEPRECATED - use head_teacher_id instead
    head_teacher_id?: string; // FOREIGN KEY -> teachers(id)
    semester_count?: number; // DEFAULT 2 - number of semesters in the department
    is_locked?: boolean;
    created_at?: string;
    updated_at?: string;
  };

  subjects: {
    id: string; // PRIMARY KEY
    code: string; // UNIQUE
    name: string;
    name_en?: string;
    department_id?: string; // FOREIGN KEY -> departments(id) [DEPRECATED: Use subject_departments table]
    credits?: number;
    teacher_id?: string; // FOREIGN KEY -> teachers(id)
    semester?: string;
    max_students?: number;
    created_at?: string;
    updated_at?: string;
  };

  subject_departments: {
    id: string; // PRIMARY KEY
    subject_id: string; // FOREIGN KEY -> subjects(id)
    department_id: string; // FOREIGN KEY -> departments(id)
    is_primary_department?: boolean; // DEFAULT false
    is_active?: boolean; // DEFAULT true
    created_at?: string;
    updated_at?: string;
  };

  // Attendance System
  attendance_sessions: {
    id: string; // PRIMARY KEY
    class_id: string;
    subject: string;
    teacher_id: string;
    teacher_name: string;
    location: string;
    start_time: string;
    end_time: string;
    qr_code_id?: string; // FOREIGN KEY -> qr_codes(id)
    total_students?: number;
    present_students?: number;
    status: string; // DEFAULT 'active'
    created_at?: string;
    updated_at?: string;
  };

  student_attendance: {
    id: string; // PRIMARY KEY
    session_id: string; // FOREIGN KEY -> attendance_sessions(id)
    student_id: string; // FOREIGN KEY -> students(id)
    student_name: string;
    scan_time: string;
    qr_code_id: string; // FOREIGN KEY -> qr_codes(id)
    ip_address?: string;
    device_info?: string;
    status: string; // DEFAULT 'present'
    created_at?: string;
  };

  attendance: {
    id: number; // PRIMARY KEY
    student_id?: string; // FOREIGN KEY -> students(id)
    subject_id?: string; // FOREIGN KEY -> subjects(id)
    date: string;
    status: string;
    created_at?: string;
    updated_at?: string;
  };

  // Fee Management System
  fees: {
    id: number; // PRIMARY KEY
    student_id?: string; // FOREIGN KEY -> students(id)
    amount: number;
    due_date?: string;
    status?: string; // DEFAULT 'pending'
    paid_date?: string;
    semester?: string;
    type?: string;
    receipt_no?: string; // UNIQUE
    fee_type_id?: number; // FOREIGN KEY -> fee_types(id)
    payment_plan_id?: number; // FOREIGN KEY -> payment_plans(id)
    academic_year?: string;
    installment_count?: number;
    paid_amount?: number;
    payment_notes?: string;
    created_at?: string;
    updated_at?: string;
  };

  fee_types: {
    id: number; // PRIMARY KEY
    code: string; // UNIQUE
    name: string;
    name_en?: string;
    description?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };

  payment_plans: {
    id: number; // PRIMARY KEY
    code: string; // UNIQUE
    name: string;
    name_en?: string;
    description?: string;
    installments_count?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };

  fee_installments: {
    id: number; // PRIMARY KEY
    fee_id?: number; // FOREIGN KEY -> fees(id)
    installment_number: number;
    amount: number;
    due_date: string;
    status?: string; // DEFAULT 'pending'
    paid_amount?: number;
    paid_date?: string;
    created_at?: string;
    updated_at?: string;
  };

  fee_payments: {
    id: number; // PRIMARY KEY
    fee_id?: number; // FOREIGN KEY -> fees(id)
    installment_id?: number; // FOREIGN KEY -> fee_installments(id)
    amount: number;
    payment_method?: string;
    payment_date: string;
    receipt_number?: string; // UNIQUE
    reference_number?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
  };

  fee_structure: {
    id: number; // PRIMARY KEY
    department_id?: string; // FOREIGN KEY -> departments(id)
    fee_type_id?: number; // FOREIGN KEY -> fee_types(id)
    payment_plan_id?: number; // FOREIGN KEY -> payment_plans(id)
    amount: number;
    academic_year?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };

  // Academic System
  grades: {
    id: number; // PRIMARY KEY
    student_id?: string; // FOREIGN KEY -> students(id)
    subject_id?: string; // FOREIGN KEY -> subjects(id)
    midterm?: number;
    final?: number;
    assignments?: number;
    total?: number;
    created_at?: string;
    updated_at?: string;
  };

  teacher_subjects: {
    id: string; // PRIMARY KEY
    teacher_id: string; // FOREIGN KEY -> teachers(id)
    subject_id: string; // FOREIGN KEY -> subjects(id)
    department_id: string; // FOREIGN KEY -> departments(id)
    academic_year: string;
    semester: string;
    is_primary_teacher?: boolean; // DEFAULT true
    can_edit_grades?: boolean; // DEFAULT true
    can_take_attendance?: boolean; // DEFAULT true
    is_active?: boolean; // DEFAULT true
    start_date?: string;
    end_date?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
  };

  // Timetable System
  timetable: {
    id: number; // PRIMARY KEY
    day_of_week: string;
    time_slot: string;
    subject_id?: string; // FOREIGN KEY -> subjects(id)
    room?: string;
    teacher_id?: string; // FOREIGN KEY -> teachers(id)
    department_id?: string; // FOREIGN KEY -> departments(id)
    semester?: string;
    academic_year?: string;
    max_students?: number;
    current_enrollment?: number;
    status?: string; // DEFAULT 'scheduled'
    created_at?: string;
    updated_at?: string;
  };

  // QR Code System
  qr_codes: {
    id: string; // PRIMARY KEY
    qr_type: string;
    qr_data: any; // jsonb
    generated_by?: string;
    generated_for?: string;
    scanned_by?: string;
    scanned_at?: string;
    expires_at?: string;
    status: string; // DEFAULT 'active'
    ip_address?: string;
    user_agent?: string;
    created_at?: string;
    updated_at?: string;
  };

  // Academic Years and Semesters
  study_years: {
    id: string; // PRIMARY KEY
    name: string; // UNIQUE, e.g., "2024-2025"
    name_en?: string; // e.g., "2024-2025"
    start_date: string; // DATE
    end_date: string; // DATE
    is_current?: boolean; // DEFAULT false, only one can be current
    is_active?: boolean; // DEFAULT true
    description?: string;
    created_at?: string;
    updated_at?: string;
  };

  semesters: {
    id: string; // PRIMARY KEY
    name: string; // e.g., "الفصل الأول", "الفصل الثاني"
    name_en?: string; // e.g., "Fall Semester", "Spring Semester"
    code: string; // e.g., "F24", "S25"
    study_year_id: string; // FOREIGN KEY -> study_years(id)
    start_date: string; // DATE
    end_date: string; // DATE
    is_current?: boolean; // DEFAULT false, only one can be current
    is_active?: boolean; // DEFAULT true
    description?: string;
    created_at?: string;
    updated_at?: string;
  };

  department_semester_subjects: {
    id: string; // PRIMARY KEY
    department_id: string; // FOREIGN KEY -> departments(id)
    semester_id: string; // FOREIGN KEY -> semesters(id)
    subject_id: string; // FOREIGN KEY -> subjects(id)
    is_active?: boolean; // DEFAULT true
    created_at?: string;
    updated_at?: string;
  };

  // System Configuration
  system_settings: {
    id: string; // PRIMARY KEY, DEFAULT 'main'
    settings: any; // jsonb, DEFAULT '{}'
    created_at?: string;
    updated_at?: string;
  };

  scheduling_constraints: {
    id: number; // PRIMARY KEY
    constraint_type: string;
    constraint_value?: any; // jsonb
    priority?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
}

// Status Enums
export const StudentStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  GRADUATED: 'graduated',
  SUSPENDED: 'suspended'
} as const;

export const TeacherStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

export const FeeStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial'
} as const;

export const AttendanceStatus = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused'
} as const;

export const SessionStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const QRCodeStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  USED: 'used'
} as const;

export const TimetableStatus = {
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
} as const;

// Helper Types
export type StudentStatusType = typeof StudentStatus[keyof typeof StudentStatus];
export type TeacherStatusType = typeof TeacherStatus[keyof typeof TeacherStatus];
export type FeeStatusType = typeof FeeStatus[keyof typeof FeeStatus];
export type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus];
export type SessionStatusType = typeof SessionStatus[keyof typeof SessionStatus];
export type QRCodeStatusType = typeof QRCodeStatus[keyof typeof QRCodeStatus];
export type TimetableStatusType = typeof TimetableStatus[keyof typeof TimetableStatus];
