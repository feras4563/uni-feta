import { api } from './api-client';
import type {
  Student,
  StudentCreateData,
  Teacher,
  Department,
  DepartmentWithStats,
  Subject,
  SubjectDepartment,
  Semester,
  StudyYear,
  Room,
  StudentGroup,
  StudentSemesterRegistration,
  StudentSubjectEnrollment,
  TimetableEntry,
  TimeSlot,
  StudentInvoice,
  StudentGrade,
  FeeDefinition,
  FeeRule,
  Holiday,
  HolidaySyncResult,
  DashboardStats,
  SystemSettings,
  InvoiceStatistics,
  ApiMessage,
  TeacherSubject,
  ClassSession,
  AttendanceRecord,
  SchedulingResources,
  ScheduleEntry,
  AutoGenerationConstraints,
} from '../types/api';

// Re-export types for consumers
export type {
  Student,
  Teacher,
  Department,
  Subject,
  Semester,
  StudyYear,
  Room,
  StudentGroup,
  StudentSemesterRegistration,
  StudentSubjectEnrollment,
  TimetableEntry,
  TimeSlot,
  StudentInvoice,
  StudentGrade,
  FeeDefinition,
  FeeRule,
  Holiday,
  HolidaySyncResult,
  DashboardStats,
  SystemSettings,
  InvoiceStatistics,
  TeacherSubject,
  ClassSession,
  AttendanceRecord,
  SchedulingResources,
  ScheduleEntry,
  AutoGenerationConstraints,
};

// ============================================
// STUDENTS API
// ============================================

export async function fetchStudents(search?: string) {
  const params: Record<string, string> = { paginate: 'false' };
  if (search) params.search = search.trim();
  return api.get<Student[]>('/students', params);
}

export async function getStudent(id: string | number) {
  return api.get<Student>(`/students/${id}`);
}

export async function fetchNextStudentId() {
  return api.get<{ id: string }>('/students/next-id');
}

export async function createStudent(data: StudentCreateData) {
  return api.post<Student>('/students', data);
}

export async function updateStudent(id: string | number, data: Partial<StudentCreateData>) {
  return api.put<Student>(`/students/${id}`, data);
}

export async function deleteStudent(id: string | number) {
  return api.delete<ApiMessage>(`/students/${id}`);
}

export async function uploadStudentPhoto(id: string | number, file: File) {
  const formData = new FormData();
  formData.append('photo', file);
  return api.upload<{ message: string; photo_url: string }>(`/students/${id}/upload-photo`, formData);
}

export async function uploadTeacherPhoto(id: string | number, file: File) {
  const formData = new FormData();
  formData.append('photo', file);
  return api.upload<{ message: string; photo_url: string }>(`/teachers/${id}/upload-photo`, formData);
}

// ============================================
// TEACHERS API
// ============================================

export async function fetchTeachers(search?: string, activeOnly: boolean = true, departmentId?: string) {
  const params: Record<string, string | boolean> = { paginate: 'false' };
  if (search) params.search = search.trim();
  if (activeOnly) params.is_active = true;
  if (departmentId) params.department_id = departmentId;
  return api.get<Teacher[]>('/teachers', params);
}

export async function getTeacher(id: string | number) {
  return api.get<Teacher>(`/teachers/${id}`);
}

export async function createTeacher(data: Partial<Teacher>) {
  return api.post<Teacher>('/teachers', data);
}

export async function updateTeacher(id: string | number, data: Partial<Teacher>, departmentIds?: string[], primaryDepartmentId?: string) {
  const payload: Record<string, unknown> = { ...data };
  if (departmentIds && departmentIds.length > 0) {
    payload.department_id = primaryDepartmentId || departmentIds[0];
  }
  return api.put<Teacher>(`/teachers/${id}`, payload);
}

export async function deleteTeacher(id: string | number) {
  return api.delete<ApiMessage>(`/teachers/${id}`);
}

export async function createTeacherWithDepartments(teacherData: Partial<Teacher>, departmentIds: string[], primaryDepartmentId?: string) {
  return api.post<Teacher>('/teachers/with-departments', {
    teacher: teacherData,
    department_ids: departmentIds,
    primary_department_id: primaryDepartmentId || departmentIds[0]
  });
}

export async function getTeacherDepartments(teacherId: string | number) {
  return api.get<Department[]>(`/teachers/${teacherId}/departments`);
}

// ============================================
// DEPARTMENTS API
// ============================================

export async function fetchDepartments() {
  return api.get<Department[]>('/departments', { paginate: 'false' });
}

export async function getDepartment(id: string | number) {
  return api.get<Department>(`/departments/${id}`);
}

export async function createDepartment(data: Partial<Department>) {
  return api.post<Department>('/departments', data);
}

export async function updateDepartment(id: string | number, data: Partial<Department>) {
  return api.put<Department>(`/departments/${id}`, data);
}

export async function deleteDepartment(id: string | number) {
  return api.delete<ApiMessage>(`/departments/${id}`);
}

export async function fetchDepartmentWithStats(id: string | number) {
  return api.get<DepartmentWithStats>(`/departments/${id}/details`);
}

export async function fetchDepartmentSemesterSubjects(departmentId: string | number, semesterId: number) {
  return api.get<Subject[]>(`/departments/${departmentId}/semesters/${semesterId}/subjects`);
}

export async function updateDepartmentSemesterSubjects(
  departmentId: string | number,
  semesterId: number,
  subjectIds: string[]
) {
  return api.put<ApiMessage>(`/departments/${departmentId}/semesters/${semesterId}/subjects`, {
    subject_ids: subjectIds
  });
}

// ============================================
// SUBJECTS API
// ============================================

export async function fetchSubjects(search?: string, departmentId?: string) {
  const params: Record<string, string> = { paginate: 'false' };
  if (search) params.search = search.trim();
  if (departmentId) params.department_id = departmentId;
  return api.get<Subject[]>('/subjects', params);
}

export async function getSubject(id: string | number) {
  return api.get<Subject>(`/subjects/${id}`);
}

export async function createSubject(data: Partial<Subject>) {
  return api.post<Subject>('/subjects', data);
}

export async function updateSubject(id: string | number, data: Partial<Subject>) {
  return api.put<Subject>(`/subjects/${id}`, data);
}

export async function deleteSubject(id: string | number) {
  return api.delete<ApiMessage>(`/subjects/${id}`);
}

export async function checkSubjectPrerequisites(subjectId: string | number, studentId: string | number) {
  return api.post<{ met: boolean; missing?: Subject[] }>(`/subjects/${subjectId}/check-prerequisites`, { student_id: studentId });
}

// ============================================
// SEMESTERS API
// ============================================

export async function fetchSemesters() {
  return api.get<Semester[]>('/semesters', { paginate: 'false' });
}

export async function getSemester(id: string | number) {
  return api.get<Semester>(`/semesters/${id}`);
}

export async function createSemester(data: Partial<Semester>) {
  return api.post<Semester>('/semesters', data);
}

export async function updateSemester(id: string | number, data: Partial<Semester>) {
  return api.put<Semester>(`/semesters/${id}`, data);
}

export async function deleteSemester(id: string | number) {
  return api.delete<ApiMessage>(`/semesters/${id}`);
}

// ============================================
// STUDY YEARS API
// ============================================

export async function fetchStudyYears() {
  return api.get<StudyYear[]>('/study-years', { paginate: 'false' });
}

export async function getStudyYear(id: string | number) {
  return api.get<StudyYear>(`/study-years/${id}`);
}

export async function createStudyYear(data: Partial<StudyYear>) {
  return api.post<StudyYear>('/study-years', data);
}

export async function updateStudyYear(id: string | number, data: Partial<StudyYear>) {
  return api.put<StudyYear>(`/study-years/${id}`, data);
}

export async function deleteStudyYear(id: string | number) {
  return api.delete<ApiMessage>(`/study-years/${id}`);
}

export async function toggleStudyYearActive(id: string | number) {
  return api.post<Record<string, unknown>>(`/study-years/${id}/toggle-active`);
}

export async function toggleSemesterActive(id: string | number) {
  return api.post<Record<string, unknown>>(`/semesters/${id}/toggle-active`);
}

// ============================================
// ROOMS API
// ============================================

export async function fetchRooms() {
  return api.get<Room[]>('/rooms', { paginate: 'false' });
}

export async function getRoom(id: string | number) {
  return api.get<Room>(`/rooms/${id}`);
}

export async function createRoom(data: Partial<Room>) {
  return api.post<Room>('/rooms', data);
}

export async function updateRoom(id: string | number, data: Partial<Room>) {
  return api.put<Room>(`/rooms/${id}`, data);
}

export async function deleteRoom(id: string | number) {
  return api.delete<ApiMessage>(`/rooms/${id}`);
}

// ============================================
// STUDENT GROUPS API
// ============================================

export async function fetchStudentGroups(departmentId?: string | number) {
  const params: Record<string, string> = { paginate: 'false' };
  if (departmentId) params.department_id = String(departmentId);
  return api.get<StudentGroup[]>('/student-groups', params);
}

export async function getStudentGroup(id: string | number) {
  return api.get<StudentGroup>(`/student-groups/${id}`);
}

export async function createStudentGroup(data: Partial<StudentGroup>) {
  return api.post<StudentGroup>('/student-groups', data);
}

export async function updateStudentGroup(id: string | number, data: Partial<StudentGroup>) {
  return api.put<StudentGroup>(`/student-groups/${id}`, data);
}

export async function deleteStudentGroup(id: string | number) {
  return api.delete<ApiMessage>(`/student-groups/${id}`);
}

export async function getRegisteredStudentsBySemester(departmentId: string, semesterId: string) {
  return api.get<Student[]>(`/semesters/${semesterId}/registered-students`, { department_id: departmentId });
}

export async function createGroupsForRegisteredStudents(departmentId: string, semesterId: string, maxStudentsPerGroup: number) {
  return api.post<StudentGroup[]>(`/student-groups/create-from-registrations`, {
    department_id: departmentId,
    semester_id: semesterId,
    max_students_per_group: maxStudentsPerGroup
  });
}

// ============================================
// STUDENT REGISTRATIONS API
// ============================================

export async function fetchStudentRegistrations() {
  return api.get<StudentSemesterRegistration[]>('/student-registrations');
}

export async function getStudentRegistration(id: string | number) {
  return api.get<StudentSemesterRegistration>(`/student-registrations/${id}`);
}

export async function createStudentRegistration(data: Partial<StudentSemesterRegistration>) {
  return api.post<StudentSemesterRegistration>('/student-registrations', data);
}

export async function updateStudentRegistration(id: string | number, data: Partial<StudentSemesterRegistration>) {
  return api.put<StudentSemesterRegistration>(`/student-registrations/${id}`, data);
}

export async function deleteStudentRegistration(id: string | number) {
  return api.delete<ApiMessage>(`/student-registrations/${id}`);
}

// ============================================
// TEACHER SUBJECTS API
// ============================================

export async function fetchTeacherSubjects(teacherId?: string | number) {
  const params = teacherId ? { teacher_id: teacherId } : undefined;
  return api.get<TeacherSubject[]>('/teacher-subjects', params);
}

export async function createTeacherSubjectAssignment(data: Partial<TeacherSubject>) {
  return api.post<TeacherSubject>('/teacher-subjects', data);
}

export async function deleteTeacherSubjectAssignment(id: string | number) {
  return api.delete<ApiMessage>(`/teacher-subjects/${id}`);
}

// ============================================
// TIMETABLE API
// ============================================

export async function fetchTimetable(params?: Record<string, string | number | boolean>) {
  return api.get<TimetableEntry[]>('/timetable/entries', params);
}

export async function createTimetableEntry(data: Partial<TimetableEntry>) {
  return api.post<TimetableEntry>('/timetable/entries', data);
}

export async function updateTimetableEntry(id: string | number, data: Partial<TimetableEntry>) {
  return api.put<TimetableEntry>(`/timetable/entries/${id}`, data);
}

export async function deleteTimetableEntry(id: string | number) {
  return api.delete<ApiMessage>(`/timetable/entries/${id}`);
}

export async function generateTimetable(data: Record<string, unknown>) {
  return api.post<TimetableEntry[]>('/timetable/auto-generate', data);
}

export async function fetchScheduleOverview(params?: {
  department_id?: string;
  teacher_id?: string;
  study_year_id?: string;
  semester_id?: string;
  include_inactive?: boolean;
}) {
  return api.get<Record<string, unknown>>('/schedule/overview', params);
}

// ============================================
// FEES API
// ============================================

export async function fetchFees() {
  return api.get<FeeDefinition[]>('/fees');
}

export async function getFee(id: string | number) {
  return api.get<StudentInvoice>(`/fees/${id}`);
}

export async function createFee(data: Record<string, unknown>) {
  return api.post<StudentInvoice>('/fees', data);
}

export async function updateFee(id: string | number, data: Record<string, unknown>) {
  return api.put<StudentInvoice>(`/fees/${id}`, data);
}

export async function deleteFee(id: string | number) {
  return api.delete<ApiMessage>(`/fees/${id}`);
}

// ============================================
// INVOICES API
// ============================================

export async function fetchInvoices(params?: Record<string, string>) {
  return api.get<StudentInvoice[]>('/invoices', params);
}

export async function getInvoice(id: string | number) {
  return api.get<StudentInvoice>(`/invoices/${id}`);
}

export async function createInvoice(data: Partial<StudentInvoice>) {
  return api.post<StudentInvoice>('/invoices', data);
}

export async function updateInvoice(id: string | number, data: Partial<StudentInvoice>) {
  return api.put<StudentInvoice>(`/invoices/${id}`, data);
}

export async function deleteInvoice(id: string | number) {
  return api.delete<ApiMessage>(`/invoices/${id}`);
}

// ============================================
// SYSTEM SETTINGS API
// ============================================

export async function getSystemSettings() {
  return api.get<SystemSettings>('/system-settings');
}

export async function updateSystemSettings(data: Partial<SystemSettings>) {
  return api.put<SystemSettings>('/system-settings', data);
}

// ============================================
// ATTENDANCE API
// ============================================

export async function fetchAttendance(params?: Record<string, string>) {
  return api.get<AttendanceRecord[]>('/attendance', params);
}

export async function createAttendance(data: Partial<AttendanceRecord>) {
  return api.post<AttendanceRecord>('/attendance', data);
}

export async function updateAttendance(id: string | number, data: Partial<AttendanceRecord>) {
  return api.put<AttendanceRecord>(`/attendance/${id}`, data);
}

// ============================================
// GRADES API
// ============================================

export async function fetchGrades(params?: Record<string, string>) {
  return api.get<StudentGrade[]>('/grades', params);
}

export async function fetchGradeSummary(semesterId: string, departmentId?: string, studentId?: string) {
  const params: Record<string, string> = { semester_id: semesterId };
  if (departmentId) params.department_id = departmentId;
  if (studentId) params.student_id = studentId;
  return api.get<Record<string, unknown>>('/grades/summary', params);
}

export async function createGrade(data: Partial<StudentGrade>) {
  return api.post<StudentGrade>('/grades', data);
}

export async function updateGrade(id: string | number, data: Partial<StudentGrade>) {
  return api.put<StudentGrade>(`/grades/${id}`, data);
}

// ============================================
// TEACHER DASHBOARD API
// ============================================

export async function getTeacherSessions(
  teacherId: string | number,
  params?: { status?: string; start_date?: string; end_date?: string }
) {
  return api.get<ClassSession[]>(`/teachers/${teacherId}/sessions`, params);
}

export async function getTeacherSubjectGroups(teacherId?: string | number, academicYear?: string) {
  if (!teacherId) {
    return [] as TeacherSubject[];
  }

  const params: Record<string, string> = {};
  if (academicYear) params.academic_year = academicYear;

  return api.get<TeacherSubject[]>(`/teachers/${teacherId}/subject-groups`, params);
}

export async function createClassSession(data: Partial<ClassSession>) {
  return api.post<ClassSession>('/class-sessions', data);
}

export async function updateClassSession(sessionId: string | number, data: Partial<ClassSession>) {
  return api.put<ClassSession>(`/class-sessions/${sessionId}`, data);
}

export async function deleteClassSession(sessionId: string | number) {
  return api.delete<ApiMessage>(`/class-sessions/${sessionId}`);
}

export async function generateSessionQR(sessionId: string | number) {
  return api.post<ClassSession>(`/teacher-portal/sessions/${sessionId}/generate-qr`);
}

export async function fetchSessionAttendance(sessionId: string | number) {
  return api.get<AttendanceRecord[]>(`/class-sessions/${sessionId}/attendance`);
}

// ============================================
// HOLIDAYS API
// ============================================

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
  return api.delete<ApiMessage>(`/holidays/${id}`);
}

export async function syncHolidaySchedule(semesterId: string) {
  return api.post<HolidaySyncResult>('/holidays/sync-schedule', { semester_id: semesterId });
}

// ============================================
// DASHBOARD API
// ============================================

export async function fetchDashboardStats() {
  return api.get<DashboardStats>('/dashboard/stats');
}

// ============================================
// ADDITIONAL API FUNCTIONS
// ============================================

// Student Groups
export async function addStudentToGroup(studentId: string, groupId: string, semesterId?: string, departmentId?: string, semesterNumber?: number) {
  return api.post<ApiMessage>(`/student-groups/${groupId}/students`, {
    student_id: studentId,
    semester_id: semesterId,
    department_id: departmentId,
    semester_number: semesterNumber
  });
}

export async function removeStudentFromGroup(registrationId: string, groupId: string) {
  return api.delete<ApiMessage>(`/student-groups/${groupId}/students/${registrationId}`);
}

export async function getStudentsInGroup(groupId: string) {
  return api.get<Student[]>(`/student-groups/${groupId}/students`);
}

export async function getAvailableStudentsForGroup(groupId: string, departmentId?: string, semesterId?: string) {
  return api.get<Student[]>(`/student-groups/${groupId}/available-students`);
}

export async function getStudentsWithoutGroups(departmentId?: string, semesterId?: string) {
  const params: Record<string, string> = {};
  if (departmentId) params.department_id = departmentId;
  if (semesterId) params.semester_id = semesterId;
  return api.get<Student[]>('/students/without-groups', params);
}

export async function assignStudentsToGroupsAutomatically(departmentId: string, semesterId: string) {
  return api.post<ApiMessage>('/student-groups/auto-assign', {
    department_id: departmentId,
    semester_id: semesterId
  });
}

export async function createAutoGroupsForDepartment(departmentId: string, semesterId: string, groupsPerSemester: number, maxStudents: number) {
  return api.post<StudentGroup[]>(`/student-groups/auto-create`, {
    department_id: departmentId,
    semester_id: semesterId,
    groups_per_semester: groupsPerSemester,
    max_students: maxStudents
  });
}

// Subject Management
export async function createSubjectWithDepartments(subjectData: Partial<Subject>, departmentIds: Array<number | string>, primaryDepartmentId?: number | string) {
  return api.post<Subject>('/subjects', {
    ...subjectData,
    department_ids: departmentIds,
    primary_department_id: primaryDepartmentId || departmentIds[0]
  });
}

export async function getSubjectDepartments(subjectId: string): Promise<SubjectDepartment[]> {
  const subject = await api.get<Subject>(`/subjects/${subjectId}`);

  if (Array.isArray(subject.subject_departments) && subject.subject_departments.length > 0) {
    return subject.subject_departments;
  }

  const subjectAny = subject as unknown as Record<string, SubjectDepartment[]>;
  if (Array.isArray(subjectAny.subjectDepartments) && subjectAny.subjectDepartments.length > 0) {
    return subjectAny.subjectDepartments;
  }

  if (Array.isArray(subject.departments) && subject.departments.length > 0) {
    return subject.departments.map((department: Department) => ({
      id: `${subjectId}-${department.id}`,
      subject_id: Number(subjectId),
      department_id: department.id,
      is_primary_department: subject.department_id === department.id,
      department,
    }));
  }

  return [];
}

export async function updateSubjectDepartments(subjectId: string, departmentIds: number[] | string[], primaryDepartmentId?: string) {
  return api.put<Subject>(`/subjects/${subjectId}`, { 
    department_ids: departmentIds,
    ...(primaryDepartmentId ? { primary_department_id: primaryDepartmentId } : {})
  });
}

export async function fetchSubjectWithStats(subjectId: string) {
  const subject = await api.get<Subject>(`/subjects/${subjectId}`);
  return { subject, stats: {} };
}

export async function fetchSubjectTeachers(subjectId: string) {
  return api.get<TeacherSubject[]>('/teacher-subjects', { subject_id: subjectId });
}

// Subject Titles & PDFs
export async function createSubjectTitle(data: Record<string, unknown>) {
  return api.post<Record<string, unknown>>('/subject-titles', data);
}

export async function updateSubjectTitle(id: number, data: Record<string, unknown>) {
  return api.put<Record<string, unknown>>(`/subject-titles/${id}`, data);
}

export async function deleteSubjectTitle(id: string | number) {
  return api.delete<ApiMessage>(`/subject-titles/${id}`);
}

export async function uploadSubjectPDF(subjectId: string | number, file: File) {
  const formData = new FormData();
  formData.append('pdf', file);
  return api.upload<{ message: string; pdf_url: string }>(`/subjects/${subjectId}/pdf`, formData);
}

export async function deleteSubjectPDF(subjectId: string | number) {
  return api.delete<ApiMessage>(`/subjects/${subjectId}/pdf`);
}

// Department Curriculum
export async function fetchDepartmentCurriculum(departmentId: string | number) {
  return api.get<Record<string, unknown>>(`/departments/${departmentId}/curriculum`);
}

export async function fetchDepartmentCurriculumBySemesterNumber(departmentId: string | number, semesterNumber: number) {
  return api.get<Record<string, unknown>>(`/departments/${departmentId}/curriculum/semester/${semesterNumber}`);
}

/** @deprecated Use fetchDepartmentWithStats instead */
export const fetchDepartmentDetails = fetchDepartmentWithStats;

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
  return api.post<Record<string, unknown>>(`/students/${studentId}/enroll-subjects`, {
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
  return api.get<StudentSubjectEnrollment[]>(`/students/${studentId}/subject-enrollments`);
}

export async function fetchAllStudentSubjectEnrollments() {
  return api.get<StudentSubjectEnrollment[]>('/student-subject-enrollments');
}

export async function fetchStudentSubjectEnrollmentById(enrollmentId: string) {
  return api.get<StudentSubjectEnrollment>(`/student-subject-enrollments/${enrollmentId}`);
}

// Student Registration
export async function registerStudentForSemester(data: Record<string, unknown>) {
  return api.post<StudentSemesterRegistration>('/student-registrations/register', data);
}

// Teacher Subject Assignments
export async function fetchAllTeacherSubjectAssignments() {
  return api.get<TeacherSubject[]>('/teacher-subjects/all');
}

export async function updateTeacherSubjectAssignment(id: number, data: Partial<TeacherSubject>) {
  return api.put<TeacherSubject>(`/teacher-subjects/${id}`, data);
}

// Time Slots
export async function fetchTimeSlots() {
  return api.get<TimeSlot[]>('/time-slots');
}

// Timetable
export async function fetchTimetableEntries(
  paramsOrSemester?: Record<string, unknown> | string | number | null,
  departmentId?: string | number,
  groupId?: string | number
) {
  let params: Record<string, unknown> = {};

  if (
    typeof paramsOrSemester !== 'object' ||
    paramsOrSemester === null ||
    Array.isArray(paramsOrSemester)
  ) {
    if (paramsOrSemester) params.semester_id = paramsOrSemester;
    if (departmentId) params.department_id = departmentId;
    if (groupId) params.group_id = groupId;
  } else {
    params = paramsOrSemester;
  }

  return api.get<TimetableEntry[]>('/timetable/entries', params);
}

// Attendance
export async function createAttendanceSession(data: Record<string, unknown>) {
  return api.post<ClassSession>('/attendance/sessions', data);
}

export async function getAttendanceSession(sessionId: number) {
  return api.get<ClassSession>(`/attendance/sessions/${sessionId}`);
}

export async function getSessionAttendance(sessionId: number) {
  return api.get<AttendanceRecord[]>(`/attendance/sessions/${sessionId}/attendance`);
}

// Invoices
export async function fetchAllInvoices(params?: Record<string, string>) {
  return api.get<StudentInvoice[]>('/invoices/all', params);
}

export async function fetchBasicInvoices(params?: Record<string, string>) {
  return api.get<StudentInvoice[]>('/invoices/basic', params);
}

export async function fetchStudentInvoices(studentId: string | number) {
  return api.get<StudentInvoice[]>(`/students/${studentId}/invoices`);
}

export async function fetchApplicableFees(departmentId: string, semesterNumber: number, totalCredits: number = 0, studentYear: number = 1, nationality: string = '') {
  return api.get<FeeRule[]>('/fee-rules/applicable', {
    department_id: departmentId,
    semester_number: String(semesterNumber),
    total_credits: String(totalCredits),
    student_year: String(studentYear),
    nationality,
  });
}

export async function fetchStudentFeeSummary(studentId: string, semesterId: string) {
  return api.get<Record<string, unknown>>(`/students/${studentId}/fee-summary`, { semester_id: semesterId });
}

export async function applyPendingFees(studentId: string, semesterId: string) {
  return api.post<ApiMessage>('/fees/apply-pending', { student_id: studentId, semester_id: semesterId });
}

export async function updateInvoiceStatus(invoiceId: string | number, status: string, paymentData?: Record<string, unknown>) {
  return api.put<StudentInvoice>(`/invoices/${invoiceId}/status`, {
    status,
    ...(paymentData || {}),
  });
}

export async function getInvoiceStatistics() {
  return api.get<InvoiceStatistics>('/invoices/statistics');
}

// Current Academic Period
export async function setCurrentSemester(semesterId: string | number) {
  return api.post<ApiMessage>('/semesters/set-current', { semester_id: semesterId });
}

export async function setCurrentStudyYear(yearId: string | number) {
  return api.post<ApiMessage>('/study-years/set-current', { year_id: yearId });
}

// ============================================
// TEACHER PORTAL API (scoped to logged-in teacher)
// ============================================

export async function fetchTeacherPortalDashboard() {
  return api.get<Record<string, unknown>>('/teacher-portal/dashboard');
}

export async function fetchMySubjects() {
  return api.get<Subject[]>('/teacher-portal/my-subjects');
}

export async function fetchMyStudents(params?: { subject_id?: string; semester_id?: string }) {
  return api.get<Student[]>('/teacher-portal/my-students', params);
}

export async function fetchMySchedule() {
  return api.get<Record<string, unknown>>('/teacher-portal/my-schedule');
}

export async function fetchMyAttendance() {
  return api.get<AttendanceRecord[]>('/teacher-portal/my-attendance');
}

export async function fetchSubjectGrades(subjectId: string) {
  return api.get<Record<string, unknown>>(`/teacher-portal/subjects/${subjectId}/grades`);
}

export async function storeTeacherGrades(subjectId: string, grades: Partial<StudentGrade>[]) {
  return api.post<ApiMessage>('/teacher-portal/grades', {
    subject_id: subjectId,
    grades,
  });
}

export async function updateTeacherGrade(gradeId: string, data: Partial<StudentGrade>) {
  return api.put<StudentGrade>(`/teacher-portal/grades/${gradeId}`, data);
}

export async function publishTeacherGrades(gradeIds: string[], isPublished: boolean) {
  return api.post<ApiMessage>('/teacher-portal/grades/publish', {
    grade_ids: gradeIds,
    is_published: isPublished,
  });
}

export async function deleteTeacherGrade(gradeId: string) {
  return api.delete<ApiMessage>(`/teacher-portal/grades/${gradeId}`);
}

export async function fetchMySessions(params?: { date?: string; start_date?: string; end_date?: string; status?: string; subject_id?: string }) {
  return api.get<ClassSession[]>('/teacher-portal/my-sessions', params);
}

export async function fetchSessionDetail(sessionId: string) {
  return api.get<ClassSession>(`/teacher-portal/sessions/${sessionId}`);
}

export async function markSessionAttendance(sessionId: string, records: { student_id: string; status: string; notes?: string }[]) {
  return api.post<ApiMessage>(`/teacher-portal/sessions/${sessionId}/attendance`, { records });
}

// ============================================
// STUDENT PORTAL API (scoped to logged-in student)
// ============================================

export async function fetchStudentPortalDashboard() {
  return api.get<Record<string, unknown>>('/student-portal/dashboard');
}

export async function fetchStudentMySubjects(params?: { semester_id?: string; status?: string }) {
  return api.get<Subject[]>('/student-portal/my-subjects', params);
}

export async function fetchStudentMySubjectDetail(subjectId: string) {
  return api.get<Record<string, unknown>>(`/student-portal/my-subjects/${subjectId}`);
}

export async function fetchStudentMyTeachers() {
  return api.get<Record<string, unknown>>('/student-portal/my-teachers');
}

export async function fetchStudentMyFees(params?: { semester_id?: string; status?: string }) {
  return api.get<Record<string, unknown>>('/student-portal/my-fees', params);
}

export async function fetchStudentMySchedule() {
  return api.get<Record<string, unknown>>('/student-portal/my-schedule');
}

export async function fetchStudentMyGrades(params?: { subject_id?: string }) {
  return api.get<Record<string, unknown>>('/student-portal/my-grades', params);
}

export async function fetchStudentMyAttendance(params?: { subject_id?: string }) {
  return api.get<Record<string, unknown>>('/student-portal/my-attendance', params);
}

export async function fetchStudentMyProfile() {
  return api.get<Student>('/student-portal/my-profile');
}

// ============================================
// ACADEMIC PROGRESSION API
// ============================================

export async function evaluateStudent(studentId: string, studyYearId?: string) {
  const params: Record<string, string> = {};
  if (studyYearId) params.study_year_id = studyYearId;
  return api.get<Record<string, unknown>>(`/academic-progression/student/${studentId}/evaluate`, params);
}

export async function promoteStudent(studentId: string, studyYearId?: string) {
  return api.post<Record<string, unknown>>(`/academic-progression/student/${studentId}/promote`, {
    study_year_id: studyYearId,
  });
}

export async function fetchRetakeableSubjects(studentId: string) {
  return api.get<Record<string, unknown>[]>(`/academic-progression/student/${studentId}/retakeable-subjects`);
}

export async function enrollRetakeSubjects(
  studentId: string,
  subjectIds: string[],
  semesterId: string,
  studyYearId: string,
  departmentId: string,
  semesterNumber: number,
  isPaying: boolean = false
) {
  return api.post<Record<string, unknown>>(`/academic-progression/student/${studentId}/enroll-retake`, {
    subject_ids: subjectIds,
    semester_id: semesterId,
    study_year_id: studyYearId,
    department_id: departmentId,
    semester_number: semesterNumber,
    is_paying: isPaying,
  });
}

export async function bulkEvaluateStudents(departmentId?: string, studyYearId?: string) {
  return api.post<Record<string, unknown>>('/academic-progression/bulk-evaluate', {
    department_id: departmentId,
    study_year_id: studyYearId,
  });
}

export async function transitionSemesterStatus(semesterId: string, status: string) {
  return api.post<Record<string, unknown>>(`/semesters/${semesterId}/transition-status`, { status });
}

export async function bulkPromoteStudents(departmentId?: string, studyYearId?: string) {
  return api.post<Record<string, unknown>>('/academic-progression/bulk-promote', {
    department_id: departmentId,
    study_year_id: studyYearId,
  });
}

// ============================================
// DEPARTMENT TRANSFER API
// ============================================

export async function fetchDepartmentTransfers(params?: Record<string, string>) {
  return api.get<Record<string, unknown>[]>('/department-transfers', params);
}

export async function initiateDepartmentTransfer(studentId: string, toDepartmentId: string, reason?: string) {
  return api.post<Record<string, unknown>>('/department-transfers/initiate', {
    student_id: studentId,
    to_department_id: toDepartmentId,
    reason,
  });
}

export async function executeDepartmentTransfer(transferId: string, adminNotes?: string) {
  return api.post<Record<string, unknown>>(`/department-transfers/${transferId}/execute`, { admin_notes: adminNotes });
}

export async function rejectDepartmentTransfer(transferId: string, adminNotes?: string) {
  return api.post<Record<string, unknown>>(`/department-transfers/${transferId}/reject`, { admin_notes: adminNotes });
}

export async function fetchStudentTransfers(studentId: string) {
  return api.get<Record<string, unknown>[]>(`/department-transfers/student/${studentId}`);
}

// ============================================
// NOTIFICATIONS API
// ============================================

export async function fetchNotifications(params?: Record<string, string>) {
  return api.get<Record<string, unknown>>('/notifications', params);
}

export async function fetchUnreadNotificationCount() {
  return api.get<{ unread_count: number }>('/notifications/unread-count');
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  return api.post<Record<string, unknown>>('/notifications/mark-read', { notification_ids: notificationIds });
}

export async function markAllNotificationsAsRead() {
  return api.post<Record<string, unknown>>('/notifications/mark-all-read', {});
}

// ============================================
// DATA EXPORT API (CSV Downloads)
// ============================================

export async function exportStudents(params?: Record<string, string>) {
  return api.download('/export/students', params, `student_list_${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportTeachers(params?: Record<string, string>) {
  return api.download('/export/teachers', params, `teacher_list_${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportSubjects(params?: Record<string, string>) {
  return api.download('/export/subjects', params, `subject_list_${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportGrades(params?: Record<string, string>) {
  return api.download('/export/grades', params, `grade_sheet_${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportAttendance(params?: Record<string, string>) {
  return api.download('/export/attendance', params, `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportInvoices(params?: Record<string, string>) {
  return api.download('/export/invoices', params, `invoice_report_${new Date().toISOString().slice(0, 10)}.csv`);
}
