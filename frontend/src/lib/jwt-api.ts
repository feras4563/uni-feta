import { api } from './api-client';

// ============================================
// STUDENTS API
// ============================================

export async function fetchStudents(search?: string) {
  const params: any = { paginate: 'false' };
  if (search) params.search = search.trim();
  return api.get<any[]>('/students', params);
}

export async function getStudent(id: string | number) {
  return api.get<any>(`/students/${id}`);
}

export async function fetchNextStudentId() {
  return api.get<{ id: string }>('/students/next-id');
}

export async function createStudent(data: any) {
  return api.post<any>('/students', data);
}

export async function updateStudent(id: string | number, data: any) {
  return api.put<any>(`/students/${id}`, data);
}

export async function deleteStudent(id: string | number) {
  return api.delete<any>(`/students/${id}`);
}

export async function uploadStudentPhoto(id: string | number, file: File) {
  const formData = new FormData();
  formData.append('photo', file);
  return api.upload<any>(`/students/${id}/upload-photo`, formData);
}

export async function uploadTeacherPhoto(id: string | number, file: File) {
  const formData = new FormData();
  formData.append('photo', file);
  return api.upload<any>(`/teachers/${id}/upload-photo`, formData);
}

// ============================================
// TEACHERS API
// ============================================

export async function fetchTeachers(search?: string, activeOnly: boolean = true) {
  const params: any = { paginate: 'false' };
  if (search) params.search = search.trim();
  if (activeOnly) params.active_only = true;
  return api.get<any[]>('/teachers', params);
}

export async function getTeacher(id: string | number) {
  return api.get<any>(`/teachers/${id}`);
}

export async function createTeacher(data: any) {
  return api.post<any>('/teachers', data);
}

export async function updateTeacher(id: string | number, data: any, departmentIds?: string[], primaryDepartmentId?: string) {
  const payload = { ...data };
  if (departmentIds && departmentIds.length > 0) {
    payload.department_id = primaryDepartmentId || departmentIds[0];
  }
  return api.put<any>(`/teachers/${id}`, payload);
}

export async function deleteTeacher(id: string | number) {
  return api.delete<any>(`/teachers/${id}`);
}

export async function createTeacherWithDepartments(teacherData: any, departmentIds: string[], primaryDepartmentId?: string) {
  return api.post<any>('/teachers/with-departments', {
    teacher: teacherData,
    department_ids: departmentIds,
    primary_department_id: primaryDepartmentId || departmentIds[0]
  });
}

export async function getTeacherDepartments(teacherId: string | number) {
  return api.get<any[]>(`/teachers/${teacherId}/departments`);
}

// ============================================
// DEPARTMENTS API
// ============================================

export async function fetchDepartments() {
  return api.get<any[]>('/departments', { paginate: 'false' });
}

export async function getDepartment(id: string | number) {
  return api.get<any>(`/departments/${id}`);
}

export async function createDepartment(data: any) {
  return api.post<any>('/departments', data);
}

export async function updateDepartment(id: string | number, data: any) {
  return api.put<any>(`/departments/${id}`, data);
}

export async function deleteDepartment(id: string | number) {
  return api.delete<any>(`/departments/${id}`);
}

export async function fetchDepartmentWithStats(id: string | number) {
  return api.get<any>(`/departments/${id}/details`);
}

export async function fetchDepartmentSemesterSubjects(departmentId: string | number, semesterId: number) {
  return api.get<any[]>(`/departments/${departmentId}/semesters/${semesterId}/subjects`);
}

export async function updateDepartmentSemesterSubjects(
  departmentId: string | number,
  semesterId: number,
  subjectIds: string[]
) {
  return api.put<any>(`/departments/${departmentId}/semesters/${semesterId}/subjects`, {
    subject_ids: subjectIds
  });
}

// ============================================
// SUBJECTS API
// ============================================

export async function fetchSubjects(search?: string, departmentId?: string) {
  const params: any = { paginate: 'false' };
  if (search) params.search = search.trim();
  if (departmentId) params.department_id = departmentId;
  return api.get<any[]>('/subjects', params);
}

export async function getSubject(id: string | number) {
  return api.get<any>(`/subjects/${id}`);
}

export async function createSubject(data: any) {
  return api.post<any>('/subjects', data);
}

export async function updateSubject(id: string | number, data: any) {
  return api.put<any>(`/subjects/${id}`, data);
}

export async function deleteSubject(id: string | number) {
  return api.delete<any>(`/subjects/${id}`);
}

export async function checkSubjectPrerequisites(subjectId: string | number, studentId: string | number) {
  return api.post<any>(`/subjects/${subjectId}/check-prerequisites`, { student_id: studentId });
}

// ============================================
// SEMESTERS API
// ============================================

export async function fetchSemesters() {
  return api.get<any[]>('/semesters', { paginate: 'false' });
}

export async function getSemester(id: string | number) {
  return api.get<any>(`/semesters/${id}`);
}

export async function createSemester(data: any) {
  return api.post<any>('/semesters', data);
}

export async function updateSemester(id: string | number, data: any) {
  return api.put<any>(`/semesters/${id}`, data);
}

export async function deleteSemester(id: string | number) {
  return api.delete<any>(`/semesters/${id}`);
}

// ============================================
// STUDY YEARS API
// ============================================

export async function fetchStudyYears() {
  return api.get<any[]>('/study-years', { paginate: 'false' });
}

export async function getStudyYear(id: string | number) {
  return api.get<any>(`/study-years/${id}`);
}

export async function createStudyYear(data: any) {
  return api.post<any>('/study-years', data);
}

export async function updateStudyYear(id: string | number, data: any) {
  return api.put<any>(`/study-years/${id}`, data);
}

export async function deleteStudyYear(id: string | number) {
  return api.delete<any>(`/study-years/${id}`);
}

// ============================================
// ROOMS API
// ============================================

export async function fetchRooms() {
  return api.get<any[]>('/rooms', { paginate: 'false' });
}

export async function getRoom(id: string | number) {
  return api.get<any>(`/rooms/${id}`);
}

export async function createRoom(data: any) {
  return api.post<any>('/rooms', data);
}

export async function updateRoom(id: string | number, data: any) {
  return api.put<any>(`/rooms/${id}`, data);
}

export async function deleteRoom(id: string | number) {
  return api.delete<any>(`/rooms/${id}`);
}

// ============================================
// STUDENT GROUPS API
// ============================================

export async function fetchStudentGroups() {
  return api.get<any[]>('/student-groups', { paginate: 'false' });
}

export async function getStudentGroup(id: string | number) {
  return api.get<any>(`/student-groups/${id}`);
}

export async function createStudentGroup(data: any) {
  return api.post<any>('/student-groups', data);
}

export async function updateStudentGroup(id: string | number, data: any) {
  return api.put<any>(`/student-groups/${id}`, data);
}

export async function deleteStudentGroup(id: string | number) {
  return api.delete<any>(`/student-groups/${id}`);
}

export async function getRegisteredStudentsBySemester(departmentId: string, semesterId: string) {
  return api.get<any[]>(`/semesters/${semesterId}/registered-students`, { department_id: departmentId });
}

export async function createGroupsForRegisteredStudents(departmentId: string, semesterId: string, maxStudentsPerGroup: number) {
  return api.post<any>(`/student-groups/create-from-registrations`, {
    department_id: departmentId,
    semester_id: semesterId,
    max_students_per_group: maxStudentsPerGroup
  });
}

// ============================================
// STUDENT REGISTRATIONS API
// ============================================

export async function fetchStudentRegistrations() {
  return api.get<any[]>('/student-registrations');
}

export async function getStudentRegistration(id: string | number) {
  return api.get<any>(`/student-registrations/${id}`);
}

export async function createStudentRegistration(data: any) {
  return api.post<any>('/student-registrations', data);
}

export async function updateStudentRegistration(id: string | number, data: any) {
  return api.put<any>(`/student-registrations/${id}`, data);
}

export async function deleteStudentRegistration(id: string | number) {
  return api.delete<any>(`/student-registrations/${id}`);
}

// ============================================
// TEACHER SUBJECTS API
// ============================================

export async function fetchTeacherSubjects(teacherId?: string | number) {
  const params = teacherId ? { teacher_id: teacherId } : undefined;
  return api.get<any[]>('/teacher-subjects', params);
}

export async function createTeacherSubjectAssignment(data: any) {
  return api.post<any>('/teacher-subjects', data);
}

export async function deleteTeacherSubjectAssignment(id: string | number) {
  return api.delete<any>(`/teacher-subjects/${id}`);
}

// ============================================
// TIMETABLE API
// ============================================

export async function fetchTimetable(params?: any) {
  return api.get<any[]>('/timetable/entries', params);
}

export async function createTimetableEntry(data: any) {
  return api.post<any>('/timetable/entries', data);
}

export async function updateTimetableEntry(id: string | number, data: any) {
  return api.put<any>(`/timetable/entries/${id}`, data);
}

export async function deleteTimetableEntry(id: string | number) {
  return api.delete<any>(`/timetable/entries/${id}`);
}

export async function generateTimetable(data: any) {
  return api.post<any>('/timetable/auto-generate', data);
}

export async function fetchScheduleOverview(params?: {
  department_id?: string;
  teacher_id?: string;
  study_year_id?: string;
  semester_id?: string;
  include_inactive?: boolean;
}) {
  return api.get<any>('/schedule/overview', params);
}

// ============================================
// FEES API
// ============================================

export async function fetchFees() {
  return api.get<any[]>('/fees');
}

export async function getFee(id: string | number) {
  return api.get<any>(`/fees/${id}`);
}

export async function createFee(data: any) {
  return api.post<any>('/fees', data);
}

export async function updateFee(id: string | number, data: any) {
  return api.put<any>(`/fees/${id}`, data);
}

export async function deleteFee(id: string | number) {
  return api.delete<any>(`/fees/${id}`);
}

// ============================================
// INVOICES API
// ============================================

export async function fetchInvoices(params?: any) {
  return api.get<any[]>('/invoices', params);
}

export async function getInvoice(id: string | number) {
  return api.get<any>(`/invoices/${id}`);
}

export async function createInvoice(data: any) {
  return api.post<any>('/invoices', data);
}

export async function updateInvoice(id: string | number, data: any) {
  return api.put<any>(`/invoices/${id}`, data);
}

export async function deleteInvoice(id: string | number) {
  return api.delete<any>(`/invoices/${id}`);
}

// ============================================
// PAYMENTS API
// ============================================

export async function fetchPayments(params?: any) {
  return api.get<any[]>('/payments', params);
}

export async function createPayment(data: any) {
  return api.post<any>('/payments', data);
}

// ============================================
// QR CODES API
// ============================================

export async function getQRCode(id: string) {
  return api.get<any>(`/qr-codes/${id}`);
}

export async function createQRCode(data: any) {
  return api.post<any>('/qr-codes', data);
}

export async function updateQRCode(id: string, data: any) {
  return api.put<any>(`/qr-codes/${id}`, data);
}

// ============================================
// SYSTEM SETTINGS API
// ============================================

export async function getSystemSettings() {
  return api.get<any>('/system-settings');
}

export async function updateSystemSettings(data: any) {
  return api.put<any>('/system-settings', data);
}

// ============================================
// ATTENDANCE API
// ============================================

export async function fetchAttendance(params?: any) {
  return api.get<any[]>('/attendance', params);
}

export async function createAttendance(data: any) {
  return api.post<any>('/attendance', data);
}

export async function updateAttendance(id: string | number, data: any) {
  return api.put<any>(`/attendance/${id}`, data);
}

// ============================================
// GRADES API
// ============================================

export async function fetchGrades(params?: any) {
  return api.get<any[]>('/grades', params);
}

export async function createGrade(data: any) {
  return api.post<any>('/grades', data);
}

export async function updateGrade(id: string | number, data: any) {
  return api.put<any>(`/grades/${id}`, data);
}

// ============================================
// TEACHER DASHBOARD API
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
  subject?: any;
}

export interface TeacherSubject {
  id: string | number;
  subject_id: string | number;
  teacher_id: string | number;
  department_id?: string;
  subject?: any;
  name?: string;
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
  student?: any;
  markedBy?: { id: number; name: string; email: string };
}

export async function getTeacherDashboard(teacherId: number) {
  return api.get<any>(`/teachers/${teacherId}/dashboard`);
}

export async function getTeacherSessions(
  teacherId: string | number,
  params?: { status?: string; start_date?: string; end_date?: string }
) {
  return api.get<ClassSession[]>(`/teachers/${teacherId}/sessions`, params);
}

export async function getTeacherSubjectGroups(teacherId: number) {
  return api.get<any[]>(`/teachers/${teacherId}/subject-groups`);
}

export async function fetchTeacherStats(teacherId: number) {
  return api.get<any>(`/teachers/${teacherId}/stats`);
}

export async function fetchTeacherSessions(
  teacherId: string | number,
  params?: { status?: string; start_date?: string; end_date?: string }
) {
  return api.get<ClassSession[]>(`/teachers/${teacherId}/sessions`, params);
}

export async function createClassSession(data: any) {
  return api.post<any>('/class-sessions', data);
}

export async function updateClassSession(sessionId: string | number, data: any) {
  return api.put<any>(`/class-sessions/${sessionId}`, data);
}

export async function deleteClassSession(sessionId: string | number) {
  return api.delete<any>(`/class-sessions/${sessionId}`);
}

export async function generateSessionQR(sessionId: string | number) {
  return api.post<any>(`/teacher-portal/sessions/${sessionId}/generate-qr`);
}

export async function fetchSessionAttendance(sessionId: string | number) {
  return api.get<any[]>(`/class-sessions/${sessionId}/attendance`);
}

// ============================================
// HOLIDAYS API
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

export async function fetchHolidays() {
  return api.get<Holiday[]>('/holidays');
}

export async function createHoliday(data: {
  name: string;
  start_date: string;
  end_date: string;
  is_recurring?: boolean;
}) {
  return api.post<Holiday>('/holidays', data);
}

export async function deleteHoliday(id: string) {
  return api.delete<{ message: string }>(`/holidays/${id}`);
}

export async function syncHolidaySchedule(semesterId: string) {
  return api.post<{
    message: string;
    result: {
      created: number;
      updated: number;
      cancelled: number;
      skipped_holidays: number;
      total_entries: number;
    };
  }>('/holidays/sync-schedule', { semester_id: semesterId });
}

// ============================================
// DASHBOARD API
// ============================================

export async function fetchDashboardStats() {
  return api.get<any>('/dashboard/stats');
}

// ============================================
// ADDITIONAL API FUNCTIONS
// ============================================

// Student Groups
export async function addStudentToGroup(studentId: string, groupId: string, semesterId?: string, departmentId?: string, semesterNumber?: number) {
  return api.post<any>(`/student-groups/${groupId}/students`, {
    student_id: studentId,
    semester_id: semesterId,
    department_id: departmentId,
    semester_number: semesterNumber
  });
}

export async function removeStudentFromGroup(registrationId: string, groupId: string) {
  return api.delete<any>(`/student-groups/${groupId}/students/${registrationId}`);
}

export async function getStudentsInGroup(groupId: string) {
  return api.get<any[]>(`/student-groups/${groupId}/students`);
}

export async function getAvailableStudentsForGroup(groupId: string, departmentId?: string, semesterId?: string) {
  return api.get<any[]>(`/student-groups/${groupId}/available-students`);
}

export async function getStudentsWithoutGroups(departmentId?: string, semesterId?: string) {
  const params: any = {};
  if (departmentId) params.department_id = departmentId;
  if (semesterId) params.semester_id = semesterId;
  return api.get<any[]>('/students/without-groups', params);
}

export async function assignStudentsToGroupsAutomatically(departmentId: string, semesterId: string) {
  return api.post<any>('/student-groups/auto-assign', {
    department_id: departmentId,
    semester_id: semesterId
  });
}

export async function createAutoGroupsForDepartment(departmentId: string, semesterId: string, groupsPerSemester: number, maxStudents: number) {
  return api.post<any>(`/student-groups/auto-create`, {
    department_id: departmentId,
    semester_id: semesterId,
    groups_per_semester: groupsPerSemester,
    max_students: maxStudents
  });
}

// Subject Management
export async function createSubjectWithDepartments(subjectData: any, departmentIds: number[], primaryDepartmentId?: number) {
  return api.post<any>('/subjects', {
    ...subjectData,
    department_ids: departmentIds,
    primary_department_id: primaryDepartmentId || departmentIds[0]
  });
}

export async function getSubjectDepartments(subjectId: string) {
  // Get subject details which includes departments
  const subject = await api.get<any>(`/subjects/${subjectId}`);
  return subject.departments || [];
}

export async function updateSubjectDepartments(subjectId: string, departmentIds: number[] | string[], primaryDepartmentId?: string) {
  return api.put<any>(`/subjects/${subjectId}`, { 
    department_ids: departmentIds,
    ...(primaryDepartmentId ? { primary_department_id: primaryDepartmentId } : {})
  });
}

export async function fetchSubjectWithStats(subjectId: string) {
  // Get subject with all related data
  const subject = await api.get<any>(`/subjects/${subjectId}`);
  return { subject, stats: {} }; // Backend doesn't have separate stats endpoint
}

export async function fetchSubjectTeachers(subjectId: string) {
  // Get teacher-subject assignments for this subject
  return api.get<any[]>('/teacher-subjects', { subject_id: subjectId });
}

// Subject Titles & PDFs
export async function createSubjectTitle(data: any) {
  return api.post<any>('/subject-titles', data);
}

export async function updateSubjectTitle(id: number, data: any) {
  return api.put<any>(`/subject-titles/${id}`, data);
}

export async function deleteSubjectTitle(id: number) {
  return api.delete<any>(`/subject-titles/${id}`);
}

export async function uploadSubjectPDF(subjectId: number, file: File) {
  const formData = new FormData();
  formData.append('pdf', file);
  return api.post<any>(`/subjects/${subjectId}/pdf`, formData);
}

export async function deleteSubjectPDF(subjectId: number) {
  return api.delete<any>(`/subjects/${subjectId}/pdf`);
}

// Department Curriculum
export async function fetchDepartmentCurriculum(departmentId: string | number) {
  return api.get<any>(`/departments/${departmentId}/curriculum`);
}

export async function fetchDepartmentCurriculumBySemesterNumber(departmentId: string | number, semesterNumber: number) {
  return api.get<any>(`/departments/${departmentId}/curriculum/semester/${semesterNumber}`);
}

export async function fetchDepartmentDetails(departmentId: number) {
  return api.get<any>(`/departments/${departmentId}/details`);
}

// Student Enrollments
export async function enrollStudentInSubjects(
  studentId: string,
  subjectIds: string[],
  semesterId: string,
  studyYearId: string,
  departmentId: string,
  semesterNumber: number,
  isPaying: boolean = false,
  specializationTrack?: 'fine_arts_media' | 'advertising_design' | 'photography_cinema' | 'multimedia_media'
) {
  return api.post<any>(`/students/${studentId}/enroll-subjects`, {
    subject_ids: subjectIds,
    semester_id: semesterId,
    study_year_id: studyYearId,
    department_id: departmentId,
    semester_number: semesterNumber,
    is_paying: isPaying,
    specialization_track: specializationTrack,
  });
}

export async function fetchStudentSubjectEnrollments(studentId: string) {
  return api.get<any[]>(`/students/${studentId}/subject-enrollments`);
}

export async function fetchAllStudentSubjectEnrollments() {
  return api.get<any[]>('/student-subject-enrollments');
}

export async function fetchStudentSubjectEnrollmentById(enrollmentId: string) {
  return api.get<any>(`/student-subject-enrollments/${enrollmentId}`);
}

// Student Registration
export async function registerStudentForSemester(data: any) {
  return api.post<any>('/student-registrations/register', data);
}

// Teacher Subject Assignments
export async function fetchAllTeacherSubjectAssignments() {
  return api.get<any[]>('/teacher-subjects/all');
}

export async function updateTeacherSubjectAssignment(id: number, data: any) {
  return api.put<any>(`/teacher-subjects/${id}`, data);
}

// Time Slots
export async function fetchTimeSlots() {
  return api.get<any[]>('/time-slots');
}

// Timetable
export async function fetchTimetableEntries(params?: any) {
  return api.get<any[]>('/timetable/entries', params);
}

// Attendance
export async function createAttendanceSession(data: any) {
  return api.post<any>('/attendance/sessions', data);
}

export async function getAttendanceSession(sessionId: number) {
  return api.get<any>(`/attendance/sessions/${sessionId}`);
}

export async function getSessionAttendance(sessionId: number) {
  return api.get<any[]>(`/attendance/sessions/${sessionId}/attendance`);
}

// Invoices
export async function fetchAllInvoices(params?: any) {
  return api.get<any[]>('/invoices/all', params);
}

export async function fetchBasicInvoices(params?: any) {
  return api.get<any[]>('/invoices/basic', params);
}

export async function fetchStudentInvoices(studentId: string | number) {
  return api.get<any[]>(`/students/${studentId}/invoices`);
}

export async function fetchApplicableFees(departmentId: string, semesterNumber: number, totalCredits: number = 0, studentYear: number = 1, nationality: string = '') {
  return api.get<any[]>('/fee-rules/applicable', {
    department_id: departmentId,
    semester_number: String(semesterNumber),
    total_credits: String(totalCredits),
    student_year: String(studentYear),
    nationality,
  });
}

export async function fetchStudentFeeSummary(studentId: string, semesterId: string) {
  return api.get<any>(`/students/${studentId}/fee-summary`, { semester_id: semesterId });
}

export async function applyPendingFees(studentId: string, semesterId: string) {
  return api.post<any>('/fees/apply-pending', { student_id: studentId, semester_id: semesterId });
}

export async function updateInvoiceStatus(invoiceId: number, status: string) {
  return api.put<any>(`/invoices/${invoiceId}/status`, { status });
}

export async function getInvoiceStatistics() {
  return api.get<any>('/invoices/statistics');
}

// Current Academic Period
export async function setCurrentSemester(semesterId: number) {
  return api.post<any>('/semesters/set-current', { semester_id: semesterId });
}

export async function setCurrentStudyYear(yearId: number) {
  return api.post<any>('/study-years/set-current', { year_id: yearId });
}

// Testing/Debug Functions
export async function testSupabaseConnection() {
  return api.get<any>('/test/connection');
}

export async function testTablesExist() {
  return api.get<any>('/test/tables');
}

export async function testBasicInvoiceQuery() {
  return api.get<any>('/test/invoice-query');
}

// ============================================
// SCHEDULING API
// ============================================

export interface SchedulingResources {
  teachers: { id: number; name: string; subjects: any[]; teaching_hours?: number }[];
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
  roomPreferences: Record<string, any>;
  teacherPreferences: Record<string, any>;
}

export async function fetchSchedulingResources(departmentId: string | number) {
  return api.get<any>(`/departments/${departmentId}/scheduling-resources`);
}

export async function fetchDepartmentSchedule(departmentId: string | number, semester: string) {
  return api.get<any>(`/departments/${departmentId}/schedule`, { semester });
}

export async function generateAutoSchedule(departmentId: string | number, semester: string, constraints: any) {
  return api.post<any>(`/departments/${departmentId}/schedule/auto-generate`, {
    semester,
    constraints
  });
}

// ============================================
// TEACHER PORTAL API (scoped to logged-in teacher)
// ============================================

export async function fetchTeacherPortalDashboard() {
  return api.get<any>('/teacher-portal/dashboard');
}

export async function fetchMySubjects() {
  return api.get<any[]>('/teacher-portal/my-subjects');
}

export async function fetchMyStudents(params?: { subject_id?: string; semester_id?: string }) {
  return api.get<any[]>('/teacher-portal/my-students', params);
}

export async function fetchMySchedule() {
  return api.get<any>('/teacher-portal/my-schedule');
}

export async function fetchMyAttendance() {
  return api.get<any[]>('/teacher-portal/my-attendance');
}

export async function fetchSubjectGrades(subjectId: string) {
  return api.get<any>(`/teacher-portal/subjects/${subjectId}/grades`);
}

export async function storeTeacherGrades(subjectId: string, grades: any[]) {
  return api.post<any>('/teacher-portal/grades', {
    subject_id: subjectId,
    grades,
  });
}

export async function updateTeacherGrade(gradeId: string, data: any) {
  return api.put<any>(`/teacher-portal/grades/${gradeId}`, data);
}

export async function publishTeacherGrades(gradeIds: string[], isPublished: boolean) {
  return api.post<any>('/teacher-portal/grades/publish', {
    grade_ids: gradeIds,
    is_published: isPublished,
  });
}

export async function deleteTeacherGrade(gradeId: string) {
  return api.delete<any>(`/teacher-portal/grades/${gradeId}`);
}

export async function fetchMySessions(params?: { date?: string; start_date?: string; end_date?: string; status?: string; subject_id?: string }) {
  return api.get<any[]>('/teacher-portal/my-sessions', params);
}

export async function fetchSessionDetail(sessionId: string) {
  return api.get<any>(`/teacher-portal/sessions/${sessionId}`);
}

export async function markSessionAttendance(sessionId: string, records: { student_id: string; status: string; notes?: string }[]) {
  return api.post<any>(`/teacher-portal/sessions/${sessionId}/attendance`, { records });
}

// ============================================
// STUDENT PORTAL API (scoped to logged-in student)
// ============================================

export async function fetchStudentPortalDashboard() {
  return api.get<any>('/student-portal/dashboard');
}

export async function fetchStudentMySubjects(params?: { semester_id?: string; status?: string }) {
  return api.get<any[]>('/student-portal/my-subjects', params);
}

export async function fetchStudentMyTeachers() {
  return api.get<any>('/student-portal/my-teachers');
}

export async function fetchStudentMyFees(params?: { semester_id?: string; status?: string }) {
  return api.get<any>('/student-portal/my-fees', params);
}

export async function fetchStudentMySchedule() {
  return api.get<any>('/student-portal/my-schedule');
}

export async function fetchStudentMyGrades(params?: { subject_id?: string }) {
  return api.get<any>('/student-portal/my-grades', params);
}

export async function fetchStudentMyAttendance(params?: { subject_id?: string }) {
  return api.get<any>('/student-portal/my-attendance', params);
}

export async function fetchStudentMyProfile() {
  return api.get<any>('/student-portal/my-profile');
}
