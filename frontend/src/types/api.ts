// ============================================
// SHARED / COMMON TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ApiMessage {
  message: string;
}

export interface ApiError {
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// ============================================
// DEPARTMENT
// ============================================

export interface Department {
  id: number;
  name: string;
  name_en?: string;
  code?: string;
  description?: string;
  location?: string;
  structure?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  [key: string]: unknown;
}

export interface DepartmentWithStats extends Department {
  students_count?: number;
  teachers_count?: number;
  subjects_count?: number;
  semesters?: Semester[];
  [key: string]: unknown;
}

// ============================================
// STUDENT
// ============================================

export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';
export type Gender = 'male' | 'female';
export type SpecializationTrack = 'fine_arts_media' | 'advertising_design' | 'photography_cinema' | 'multimedia_media';

export interface Student {
  id: string;
  campus_id?: string;
  name: string;
  name_en?: string;
  email?: string;
  national_id_passport?: string;
  phone?: string;
  address?: string;
  department_id?: number;
  specialization_track?: SpecializationTrack | null;
  year?: number;
  status?: StudentStatus;
  gender?: Gender;
  nationality?: string;
  birth_date?: string;
  enrollment_date?: string;
  sponsor_name?: string;
  sponsor_contact?: string;
  academic_history?: string;
  academic_score?: number | string;
  transcript_file?: string;
  qr_code?: string;
  photo_url?: string;
  birth_place?: string;
  certification_type?: string;
  certification_date?: string;
  certification_school?: string;
  certification_specialization?: string;
  port_of_entry?: string;
  visa_type?: string;
  mother_name?: string;
  mother_nationality?: string;
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  passport_place_of_issue?: string;
  auth_user_id?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // Relations
  department?: Pick<Department, 'id' | 'name' | 'name_en'>;
  semesterRegistrations?: StudentSemesterRegistration[];
  grades?: StudentGrade[];
  attendanceRecords?: AttendanceRecord[];
  academicProgress?: StudentAcademicProgress | null;
  // Only on create response
  login_credentials?: { email: string; password: string };
  [key: string]: unknown;
}

export interface StudentCreateData {
  name: string;
  name_en?: string;
  email?: string;
  national_id_passport: string;
  phone?: string;
  address?: string;
  department_id?: number | string;
  specialization_track?: SpecializationTrack;
  year?: number;
  status?: StudentStatus;
  gender?: Gender;
  nationality?: string;
  birth_date?: string;
  enrollment_date?: string;
  sponsor_name?: string;
  sponsor_contact?: string;
  academic_history?: string;
  academic_score?: number;
  birth_place?: string;
  certification_type?: string;
  certification_date?: string;
  certification_school?: string;
  certification_specialization?: string;
  port_of_entry?: string;
  visa_type?: string;
  mother_name?: string;
  mother_nationality?: string;
  passport_number?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  passport_place_of_issue?: string;
  password?: string;
}

// ============================================
// TEACHER
// ============================================

export interface Teacher {
  id: number;
  campus_id?: string;
  name: string;
  name_en?: string;
  email?: string;
  phone?: string;
  department_id?: number;
  is_active?: boolean;
  specialization?: string;
  qualification?: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  department?: Pick<Department, 'id' | 'name' | 'name_en'>;
  departments?: Department[];
  subjects?: Subject[];
  [key: string]: unknown;
}

// ============================================
// SUBJECT
// ============================================

export interface Subject {
  id: number;
  code?: string;
  name: string;
  name_en?: string;
  description?: string;
  credit_hours?: number;
  department_id?: number;
  semester_number?: number;
  is_practical?: boolean;
  is_active?: boolean;
  pdf_url?: string;
  min_units?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  department?: Pick<Department, 'id' | 'name' | 'name_en'>;
  departments?: Department[];
  subject_departments?: SubjectDepartment[];
  prerequisites?: Subject[];
  titles?: SubjectTitle[];
  [key: string]: unknown;
}

export interface SubjectDepartment {
  id: string;
  subject_id: number;
  department_id: number;
  is_primary_department?: boolean;
  department?: Department;
}

export interface SubjectTitle {
  id: number;
  subject_id: number;
  title: string;
  description?: string;
}

// ============================================
// SEMESTER & STUDY YEAR
// ============================================

export interface Semester {
  id: number;
  name: string;
  name_en?: string;
  study_year_id?: number;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  created_at?: string;
  updated_at?: string;
  study_year?: StudyYear;
  [key: string]: unknown;
}

export interface StudyYear {
  id: number;
  name: string;
  name_en?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ============================================
// ROOM
// ============================================

export interface Room {
  id: number;
  name: string;
  code?: string;
  building?: string;
  capacity?: number;
  room_type?: string;
  equipment?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

// ============================================
// STUDENT GROUP
// ============================================

export interface StudentGroup {
  id: number;
  name: string;
  department_id?: number;
  semester_id?: number;
  semester_number?: number;
  max_students?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  department?: Pick<Department, 'id' | 'name' | 'name_en'>;
  semester?: Semester;
  students_count?: number;
  [key: string]: unknown;
}

// ============================================
// REGISTRATIONS & ENROLLMENTS
// ============================================

export interface StudentSemesterRegistration {
  id: number;
  student_id: string;
  semester_id: number;
  study_year_id?: number;
  department_id?: number;
  group_id?: number | null;
  semester_number?: number;
  status?: string;
  tuition_paid?: boolean;
  admin_override?: boolean;
  attendance_allowed?: boolean;
  created_at?: string;
  updated_at?: string;
  student?: Student;
  semester?: Semester;
  studyYear?: StudyYear;
  department?: Department;
  group?: StudentGroup;
  [key: string]: unknown;
}

export interface StudentSubjectEnrollment {
  id: number;
  student_id: string;
  subject_id: number;
  semester_id: number;
  department_id?: number;
  study_year_id?: number;
  status?: string;
  is_paid?: boolean;
  created_at?: string;
  updated_at?: string;
  student?: Student;
  subject?: Subject;
  semester?: Semester;
  [key: string]: unknown;
}

// ============================================
// TIMETABLE
// ============================================

export interface TimetableEntry {
  id: number;
  semester_id?: number;
  department_id?: number;
  group_id?: number;
  subject_id?: number;
  teacher_id?: number;
  room_id?: number;
  time_slot_id?: number;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  subject?: Subject;
  teacher?: Teacher;
  room?: Room;
  group?: StudentGroup;
  semester?: Semester;
  department?: Department;
  time_slot?: TimeSlot;
  [key: string]: unknown;
}

export interface TimeSlot {
  id: number;
  code?: string;
  label?: string;
  start_time?: string;
  end_time?: string;
  day_of_week?: string;
}

// ============================================
// FEES & INVOICES
// ============================================

export interface StudentInvoice {
  id: number;
  student_id: string;
  semester_id?: number;
  invoice_number?: string;
  total_amount: number;
  paid_amount?: number;
  discount_amount?: number;
  waiver_amount?: number;
  balance?: number;
  status?: string;
  due_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  student?: Student;
  semester?: Semester;
  items?: InvoiceItem[];
  [key: string]: unknown;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  subject_id?: number | null;
  fee_definition_id?: string | null;
  description?: string;
  amount: number;
  created_at?: string;
  subject?: Subject;
  feeDefinition?: FeeDefinition;
}

export interface FeeDefinition {
  id: string;
  name_ar: string;
  name_en?: string;
  default_amount: number;
  is_refundable?: boolean;
  frequency?: 'one_time' | 'per_semester' | 'per_credit' | 'annual';
  is_active?: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface FeeRule {
  id: string;
  fee_definition_id: string;
  department_id?: number | null;
  target_semester?: number | null;
  override_amount?: number | null;
  condition_type?: 'total_credits_gt' | 'total_credits_lt' | 'student_year_eq' | 'nationality_eq' | 'none';
  condition_value?: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  fee_definition?: FeeDefinition;
  department?: Department;
  [key: string]: unknown;
}

// ============================================
// GRADES
// ============================================

export interface StudentGrade {
  id: number;
  student_id: string;
  subject_id: number;
  teacher_id?: number;
  semester_id?: number;
  midterm_grade?: number;
  final_grade?: number;
  coursework_grade?: number;
  total_grade?: number;
  letter_grade?: string;
  gpa_points?: number;
  needs_retake?: boolean;
  is_published?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  student?: Student;
  subject?: Subject;
  teacher?: Teacher;
  semester?: Semester;
  [key: string]: unknown;
}

// ============================================
// ATTENDANCE
// ============================================

export interface ClassSession {
  id: string | number;
  timetable_id?: string | null;
  teacher_id?: string | number;
  subject_id: string | number;
  session_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  room?: string;
  notes?: string;
  qr_code_data?: string;
  qr_signature?: string;
  qr_generated_at?: string;
  qr_expires_at?: string;
  status?: string;
  max_students?: number;
  subject?: Subject;
  [key: string]: unknown;
}

export interface AttendanceRecord {
  id: string | number;
  session_id: string | number;
  student_id: string | number;
  marked_by_id?: number | null;
  status: string;
  scan_time?: string;
  notes?: string;
  is_override?: boolean;
  student?: Student;
  markedBy?: { id: number; name: string; email: string };
  [key: string]: unknown;
}

// ============================================
// HOLIDAY
// ============================================

export interface Holiday {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// TEACHER SUBJECT ASSIGNMENT
// ============================================

export interface TeacherSubject {
  id: string | number;
  subject_id: string | number;
  teacher_id: string | number;
  department_id?: string;
  subject?: Subject;
  teacher?: Teacher;
  name?: string;
  [key: string]: unknown;
}

// ============================================
// SCHEDULING
// ============================================

export interface SchedulingResources {
  teachers: { id: number; name: string; subjects: Subject[]; teaching_hours?: number }[];
  rooms: { id: number; name: string; capacity: number; room_type: string; code?: string; building?: string; equipment?: string[] }[];
  subjects: { id: number; name: string; hours_per_week?: number }[];
  students: { id: number; name: string; count: number }[];
  timeSlots: { id: number; code: string; label: string }[];
}

export interface ScheduleEntry {
  id: number;
  day_of_week: string;
  time_slot: string;
  subject_name: string;
  teacher_name: string;
  teacher_id: number;
  room_name: string;
  room_id: number;
  current_enrollment?: number;
  max_students?: number;
}

export interface AutoGenerationConstraints {
  maxHoursPerDay: number;
  minBreakBetweenClasses: number;
  preferredTimeSlots: string[];
  avoidTimeSlots: string[];
  roomPreferences: Record<string, unknown>;
  teacherPreferences: Record<string, unknown>;
}

// ============================================
// STUDENT ACADEMIC PROGRESS
// ============================================

export interface StudentAcademicProgress {
  id: number;
  student_id: string;
  total_credits?: number;
  completed_credits?: number;
  cumulative_gpa?: number;
  academic_standing?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardStats {
  total_students?: number;
  total_teachers?: number;
  total_departments?: number;
  total_subjects?: number;
  active_students?: number;
  active_semesters?: number;
  [key: string]: unknown;
}

// ============================================
// SYSTEM SETTINGS
// ============================================

export interface SystemSettings {
  [key: string]: string | number | boolean | null;
}

// ============================================
// INVOICE STATISTICS
// ============================================

export interface InvoiceStatistics {
  total_invoices?: number;
  total_amount?: number;
  paid_amount?: number;
  outstanding_amount?: number;
  [key: string]: unknown;
}

// ============================================
// HOLIDAY SYNC RESULT
// ============================================

export interface HolidaySyncResult {
  message: string;
  result: {
    created: number;
    updated: number;
    cancelled: number;
    skipped_holidays: number;
    total_entries: number;
  };
}
