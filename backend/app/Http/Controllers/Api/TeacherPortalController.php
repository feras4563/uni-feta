<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\TeacherSubject;
use App\Models\Subject;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\StudentSubjectEnrollment;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\AttendanceRecord;
use App\Models\TimetableEntry;
use App\Models\AppUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TeacherPortalController extends Controller
{
    /**
     * Get the authenticated teacher from the JWT user
     */
    private function getTeacher(Request $request): ?Teacher
    {
        $user = auth('api')->user();
        $appUser = AppUser::where('auth_user_id', $user->id)->first();
        
        if (!$appUser || !$appUser->teacher_id) {
            return null;
        }

        return Teacher::find($appUser->teacher_id);
    }

    /**
     * Get teacher's own profile/dashboard data
     */
    public function dashboard(Request $request)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $teacher->load('department:id,name,name_en');

        // Get active subject assignments
        $activeSubjects = TeacherSubject::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->with('subject:id,name,name_en,code,credits', 'department:id,name,name_en', 'semester:id,name,name_en')
            ->get();

        // Count unique students enrolled in teacher's subjects
        $subjectIds = $activeSubjects->pluck('subject_id')->unique();
        $totalStudents = StudentSubjectEnrollment::whereIn('subject_id', $subjectIds)
            ->whereIn('status', ['enrolled', 'active'])
            ->distinct('student_id')
            ->count('student_id');

        // Auto-generate class sessions for today from timetable entries
        $today = now()->toDateString();
        $this->ensureSessionsForDate($teacher, $today);

        // Today's timetable entries (from the weekly schedule)
        // day_of_week: 0=Sunday, 1=Monday, ... 6=Saturday
        $todayDayOfWeek = now()->dayOfWeek; // Carbon: 0=Sunday
        $todayTimetable = TimetableEntry::where('teacher_id', $teacher->id)
            ->where('day_of_week', $todayDayOfWeek)
            ->where('is_active', true)
            ->with([
                'subject:id,name,name_en,code',
                'room:id,name,code,building',
                'studentGroup:id,name',
            ])
            ->orderBy('start_time')
            ->get();

        // Also get any class sessions for today (includes auto-generated ones)
        $todaySessions = ClassSession::where('teacher_id', $teacher->id)
            ->whereDate('session_date', $today)
            ->where('status', '!=', 'cancelled')
            ->with('subject:id,name,code')
            ->orderBy('start_time')
            ->get();

        // Upcoming timetable: next 3 days of scheduled classes
        $upcomingEntries = collect();
        for ($i = 1; $i <= 6; $i++) {
            $futureDay = (now()->dayOfWeek + $i) % 7;
            $entries = TimetableEntry::where('teacher_id', $teacher->id)
                ->where('day_of_week', $futureDay)
                ->where('is_active', true)
                ->with([
                    'subject:id,name,name_en,code',
                    'room:id,name,code,building',
                    'studentGroup:id,name',
                ])
                ->orderBy('start_time')
                ->get()
                ->map(function ($entry) use ($futureDay, $i) {
                    $entry->upcoming_date = now()->addDays($i)->toDateString();
                    $entry->upcoming_day_name = $this->getDayName($futureDay);
                    return $entry;
                });
            $upcomingEntries = $upcomingEntries->merge($entries);
            if ($upcomingEntries->count() >= 5) break;
        }

        // Recent grades given
        $recentGrades = StudentGrade::where('teacher_id', $teacher->id)
            ->with('student:id,name,campus_id', 'subject:id,name,code')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'name_en' => $teacher->name_en,
                'campus_id' => $teacher->campus_id,
                'email' => $teacher->email,
                'department' => $teacher->department,
                'specialization' => $teacher->specialization,
                'photo_url' => $teacher->photo_url,
            ],
            'stats' => [
                'total_subjects' => $activeSubjects->count(),
                'total_students' => $totalStudents,
                'today_sessions' => max($todayTimetable->count(), $todaySessions->count()),
                'total_grades' => StudentGrade::where('teacher_id', $teacher->id)->count(),
            ],
            'today_timetable' => $todayTimetable,
            'today_sessions' => $todaySessions,
            'upcoming_classes' => $upcomingEntries->take(5)->values(),
            'recent_grades' => $recentGrades,
        ]);
    }

    private function getDayName(int $day): string
    {
        $days = [
            0 => 'الأحد',
            1 => 'الاثنين',
            2 => 'الثلاثاء',
            3 => 'الأربعاء',
            4 => 'الخميس',
            5 => 'الجمعة',
            6 => 'السبت',
        ];
        return $days[$day] ?? '';
    }

    /**
     * Get teacher's assigned subjects (only their own)
     */
    public function mySubjects(Request $request)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $subjects = TeacherSubject::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->with([
                'subject:id,name,name_en,code,credits,department_id,semester_number',
                'subject.department:id,name,name_en',
                'department:id,name,name_en',
                'semester:id,name,name_en',
                'studyYear:id,name,name_en',
            ])
            ->get();

        // Enrich with student count per subject
        $subjects->each(function ($ts) {
            $ts->student_count = StudentSubjectEnrollment::where('subject_id', $ts->subject_id)
                ->whereIn('status', ['enrolled', 'active'])
                ->count();
        });

        return response()->json($subjects);
    }

    /**
     * Get students enrolled in a specific subject taught by this teacher
     */
    public function myStudents(Request $request)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        // Get all subject IDs this teacher is assigned to
        $teacherSubjectIds = TeacherSubject::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->pluck('subject_id');

        // Also include subjects directly assigned via subjects.teacher_id
        $directSubjectIds = Subject::where('teacher_id', $teacher->id)->pluck('id');
        $allSubjectIds = $teacherSubjectIds->merge($directSubjectIds)->unique();

        $query = StudentSubjectEnrollment::whereIn('subject_id', $allSubjectIds)
            ->whereIn('status', ['enrolled', 'active', 'completed'])
            ->with([
                'student:id,name,name_en,email,phone,campus_id,photo_url,department_id,year',
                'student.department:id,name,name_en',
                'subject:id,name,name_en,code',
                'semester:id,name,name_en',
            ]);

        // Filter by subject
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        // Filter by semester
        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        $enrollments = $query->orderBy('created_at', 'desc')->get();

        // Group by subject for easier frontend consumption
        $grouped = $enrollments->groupBy('subject_id')->map(function ($group) {
            $subject = $group->first()->subject;
            return [
                'subject' => $subject,
                'students' => $group->map(function ($enrollment) {
                    return [
                        'enrollment_id' => $enrollment->id,
                        'student' => $enrollment->student,
                        'status' => $enrollment->status,
                        'attendance_allowed' => $enrollment->attendance_allowed,
                        'grade' => $enrollment->grade,
                        'grade_letter' => $enrollment->grade_letter,
                        'semester' => $enrollment->semester,
                    ];
                })->values(),
                'student_count' => $group->count(),
            ];
        })->values();

        return response()->json($grouped);
    }

    /**
     * Get teacher's schedule (timetable + class schedules)
     */
    public function mySchedule(Request $request)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        // Get timetable entries
        $timetableEntries = TimetableEntry::where('teacher_id', $teacher->id)
            ->with([
                'subject:id,name,name_en,code',
                'room:id,name,code,building',
                'timeSlot:id,code,label,start_time,end_time',
                'studentGroup:id,name',
            ])
            ->orderBy('day_of_week')
            ->get();

        // Get class schedules (availability + assigned classes)
        $classSchedules = ClassSchedule::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->with(['subject:id,name,name_en,code', 'department:id,name,name_en'])
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'timetable' => $timetableEntries,
            'schedules' => $classSchedules,
        ]);
    }

    /**
     * Get all grades for a subject taught by this teacher
     */
    public function subjectGrades(Request $request, $subjectId)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        // Verify teacher teaches this subject
        if (!$this->teachesSubject($teacher, $subjectId)) {
            return response()->json(['error' => 'You do not teach this subject'], 403);
        }

        $grades = StudentGrade::where('subject_id', $subjectId)
            ->where('teacher_id', $teacher->id)
            ->with('student:id,name,name_en,campus_id,photo_url')
            ->orderBy('student_id')
            ->orderBy('grade_type')
            ->get();

        // Get all enrolled students for this subject
        $enrolledStudents = StudentSubjectEnrollment::where('subject_id', $subjectId)
            ->whereIn('status', ['enrolled', 'active'])
            ->with('student:id,name,name_en,campus_id,photo_url')
            ->get()
            ->pluck('student')
            ->unique('id')
            ->values();

        return response()->json([
            'grades' => $grades,
            'students' => $enrolledStudents,
        ]);
    }

    /**
     * Store or update grades (batch) for a subject
     * Supports midterm, final, assignment, attendance marks
     */
    public function storeGrades(Request $request)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'subject_id' => 'required|exists:subjects,id',
            'grades' => 'required|array|min:1',
            'grades.*.student_id' => 'required|exists:students,id',
            'grades.*.grade_type' => 'required|in:midterm,final,assignment,quiz,project,participation,homework,classwork',
            'grades.*.grade_name' => 'required|string|max:255',
            'grades.*.grade_value' => 'required|numeric|min:0',
            'grades.*.max_grade' => 'required|numeric|min:0.01',
            'grades.*.weight' => 'nullable|numeric|min:0|max:1',
            'grades.*.description' => 'nullable|string',
            'grades.*.feedback' => 'nullable|string',
            'grades.*.is_published' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Ensure grade_value does not exceed max_grade for each entry
        foreach ($request->grades as $i => $g) {
            if (isset($g['grade_value'], $g['max_grade']) && $g['grade_value'] > $g['max_grade']) {
                return response()->json(['errors' => ["grades.{$i}.grade_value" => ['الدرجة لا يمكن أن تتجاوز الدرجة القصوى']]], 422);
            }
        }

        $subjectId = $request->subject_id;

        // Verify teacher teaches this subject
        if (!$this->teachesSubject($teacher, $subjectId)) {
            return response()->json(['error' => 'You do not teach this subject'], 403);
        }

        // Auto-resolve semester_id from teacher_subject assignment or current semester
        $semesterId = TeacherSubject::where('teacher_id', $teacher->id)
            ->where('subject_id', $subjectId)
            ->where('is_active', true)
            ->value('semester_id');

        if (!$semesterId) {
            $semesterId = \App\Models\Semester::where('is_current', true)->value('id');
        }

        // Batch-load existing grades for this subject/teacher (1 query instead of N)
        $studentIds = collect($request->grades)->pluck('student_id')->unique()->values()->all();
        $existingGrades = StudentGrade::where('subject_id', $subjectId)
            ->where('teacher_id', $teacher->id)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->keyBy(fn ($g) => $g->student_id . '|' . $g->grade_type . '|' . $g->grade_name);

        $created = [];
        $updated = [];

        foreach ($request->grades as $gradeData) {
            $lookupKey = $gradeData['student_id'] . '|' . $gradeData['grade_type'] . '|' . $gradeData['grade_name'];
            $existing = $existingGrades->get($lookupKey);

            $gradePayload = [
                'student_id' => $gradeData['student_id'],
                'subject_id' => $subjectId,
                'teacher_id' => $teacher->id,
                'semester_id' => $semesterId,
                'grade_type' => $gradeData['grade_type'],
                'grade_name' => $gradeData['grade_name'],
                'grade_value' => $gradeData['grade_value'],
                'max_grade' => $gradeData['max_grade'],
                'weight' => $gradeData['weight'] ?? 1.0,
                'grade_date' => now()->toDateString(),
                'description' => $gradeData['description'] ?? null,
                'feedback' => $gradeData['feedback'] ?? null,
                'is_published' => $gradeData['is_published'] ?? false,
            ];

            if ($existing) {
                $existing->update($gradePayload);
                $updated[] = $existing;
            } else {
                $grade = StudentGrade::create($gradePayload);
                $created[] = $grade;
            }
        }

        return response()->json([
            'message' => 'Grades saved successfully',
            'created' => count($created),
            'updated' => count($updated),
            'grades' => array_merge($created, $updated),
        ]);
    }

    /**
     * Update a single grade
     */
    public function updateGrade(Request $request, $gradeId)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $grade = StudentGrade::where('id', $gradeId)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$grade) {
            return response()->json(['error' => 'Grade not found or not yours'], 404);
        }

        $validator = Validator::make($request->all(), [
            'grade_value' => 'sometimes|numeric|min:0',
            'max_grade' => 'sometimes|numeric|min:0.01',
            'weight' => 'nullable|numeric|min:0|max:1',
            'description' => 'nullable|string',
            'feedback' => 'nullable|string',
            'is_published' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $grade->update($request->only([
            'grade_value', 'max_grade', 'weight', 'description', 'feedback', 'is_published'
        ]));

        return response()->json([
            'message' => 'Grade updated successfully',
            'grade' => $grade->fresh('student:id,name,campus_id'),
        ]);
    }

    /**
     * Bulk publish or unpublish grades for a subject
     */
    public function publishGrades(Request $request)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'grade_ids' => 'required|array|min:1',
            'grade_ids.*' => 'required|string',
            'is_published' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updated = StudentGrade::whereIn('id', $request->grade_ids)
            ->where('teacher_id', $teacher->id)
            ->update(['is_published' => $request->is_published]);

        return response()->json([
            'message' => $request->is_published ? 'تم نشر الدرجات بنجاح' : 'تم إلغاء نشر الدرجات',
            'updated' => $updated,
        ]);
    }

    /**
     * Delete a grade
     */
    public function deleteGrade(Request $request, $gradeId)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $grade = StudentGrade::where('id', $gradeId)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$grade) {
            return response()->json(['error' => 'Grade not found or not yours'], 404);
        }

        $grade->delete();

        return response()->json(['message' => 'Grade deleted successfully']);
    }

    // =========================================================================
    // SESSION & ATTENDANCE METHODS
    // =========================================================================

    /**
     * Get teacher's class sessions with attendance stats.
     * Supports ?date=YYYY-MM-DD (defaults to today), ?start_date & ?end_date for range,
     * ?status=scheduled|completed|cancelled, ?subject_id filter.
     *
     * Auto-generates class sessions from timetable entries for a single date
     * if none exist yet, so teachers can always take attendance.
     */
    public function mySessions(Request $request)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        // Determine the target date for auto-generation
        $targetDate = $request->has('date') ? $request->date : now()->toDateString();
        $isSingleDate = $request->has('date') || (!$request->has('start_date') && !$request->has('end_date'));

        // Auto-generate sessions from timetable entries for the target date if needed
        if ($isSingleDate) {
            $this->ensureSessionsForDate($teacher, $targetDate);
        }

        $query = ClassSession::where('teacher_id', $teacher->id)
            ->with([
                'subject:id,name,name_en,code',
                'department:id,name,name_en',
            ])
            ->withCount([
                'attendanceRecords',
                'attendanceRecords as present_count' => fn ($q) => $q->where('status', 'present'),
                'attendanceRecords as late_count' => fn ($q) => $q->where('status', 'late'),
                'attendanceRecords as absent_count' => fn ($q) => $q->where('status', 'absent'),
                'attendanceRecords as excused_count' => fn ($q) => $q->where('status', 'excused'),
            ]);

        // Date filtering
        if ($request->has('date')) {
            $query->whereDate('session_date', $request->date);
        } elseif ($request->has('start_date') || $request->has('end_date')) {
            if ($request->has('start_date')) $query->whereDate('session_date', '>=', $request->start_date);
            if ($request->has('end_date')) $query->whereDate('session_date', '<=', $request->end_date);
        } else {
            // Default: today's sessions
            $query->whereDate('session_date', now()->toDateString());
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        $sessions = $query->orderBy('session_date')
            ->orderBy('start_time')
            ->get();

        // Attach enrolled student count per subject (batch)
        $subjectIds = $sessions->pluck('subject_id')->unique()->values()->all();
        $enrolledCounts = [];
        if (!empty($subjectIds)) {
            $enrolledCounts = StudentSubjectEnrollment::whereIn('subject_id', $subjectIds)
                ->whereIn('status', ['enrolled', 'active'])
                ->selectRaw('subject_id, COUNT(DISTINCT student_id) as count')
                ->groupBy('subject_id')
                ->pluck('count', 'subject_id')
                ->all();
        }

        $sessions->each(function ($session) use ($enrolledCounts) {
            $session->enrolled_count = $enrolledCounts[$session->subject_id] ?? 0;
        });

        return response()->json($sessions);
    }

    /**
     * Auto-generate class sessions from timetable entries for a specific date.
     * Only creates sessions that don't already exist (idempotent).
     */
    private function ensureSessionsForDate(Teacher $teacher, string $dateString): void
    {
        $date = \Carbon\Carbon::parse($dateString);
        $dayOfWeek = $date->dayOfWeek; // 0=Sunday ... 6=Saturday

        // Find timetable entries for this teacher on this day of week
        $entries = TimetableEntry::where('teacher_id', $teacher->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->with(['subject:id,name,code', 'room:id,name,code,room_number'])
            ->get();

        if ($entries->isEmpty()) {
            return;
        }

        // Check which sessions already exist for this date
        $existingTimetableIds = ClassSession::where('teacher_id', $teacher->id)
            ->whereDate('session_date', $dateString)
            ->whereNotNull('timetable_id')
            ->pluck('timetable_id')
            ->all();

        // Check if date is a holiday
        $isHoliday = \App\Models\Holiday::where(function ($q) use ($dateString) {
            $q->where('start_date', '<=', $dateString)
              ->where('end_date', '>=', $dateString);
        })->exists();

        if ($isHoliday) {
            return;
        }

        foreach ($entries as $entry) {
            if (in_array($entry->id, $existingTimetableIds)) {
                continue; // Already has a session for this date
            }

            ClassSession::create([
                'timetable_id' => $entry->id,
                'teacher_id' => $entry->teacher_id,
                'subject_id' => $entry->subject_id,
                'department_id' => $entry->department_id,
                'session_name' => ($entry->subject?->name ?? 'Session') . ' - ' . $dateString,
                'session_date' => $dateString,
                'start_time' => $entry->start_time,
                'end_time' => $entry->end_time,
                'room' => $entry->room?->room_number ?? $entry->room?->name ?? $entry->room?->code,
                'status' => 'scheduled',
                'notes' => 'Auto-generated from timetable',
            ]);
        }
    }

    /**
     * Get full session detail with enrolled students and their attendance records.
     * This is the main endpoint for the attendance marking UI.
     */
    public function getSessionDetail(Request $request, string $sessionId)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $session = ClassSession::where('id', $sessionId)
            ->where('teacher_id', $teacher->id)
            ->with(['subject:id,name,name_en,code', 'department:id,name,name_en'])
            ->first();

        if (!$session) {
            return response()->json(['error' => 'Session not found or not yours'], 404);
        }

        // Get enrolled students for this subject
        $enrolledStudents = StudentSubjectEnrollment::where('subject_id', $session->subject_id)
            ->whereIn('status', ['enrolled', 'active'])
            ->with('student:id,name,name_en,campus_id,photo_url')
            ->get()
            ->pluck('student')
            ->unique('id')
            ->values();

        // Get existing attendance records for this session (keyed by student_id)
        $records = AttendanceRecord::where('session_id', $sessionId)
            ->with('markedBy:id,name,email')
            ->get()
            ->keyBy('student_id');

        // Merge: for each enrolled student, attach their attendance record (or null)
        $studentList = $enrolledStudents->map(function ($student) use ($records) {
            $record = $records->get($student->id);
            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'name_en' => $student->name_en,
                'campus_id' => $student->campus_id,
                'photo_url' => $student->photo_url,
                'attendance' => $record ? [
                    'id' => $record->id,
                    'status' => $record->status,
                    'scan_time' => $record->scan_time,
                    'notes' => $record->notes,
                    'is_manual_entry' => $record->is_manual_entry,
                    'is_override' => $record->is_override,
                    'marked_by' => $record->markedBy ? [
                        'id' => $record->markedBy->id,
                        'name' => $record->markedBy->name,
                    ] : null,
                ] : null,
            ];
        });

        return response()->json([
            'session' => $session,
            'students' => $studentList,
            'stats' => [
                'enrolled' => $enrolledStudents->count(),
                'marked' => $records->count(),
                'present' => $records->where('status', 'present')->count(),
                'late' => $records->where('status', 'late')->count(),
                'absent' => $records->where('status', 'absent')->count(),
                'excused' => $records->where('status', 'excused')->count(),
                'unmarked' => $enrolledStudents->count() - $records->count(),
            ],
        ]);
    }

    /**
     * Batch mark attendance for a session.
     * Accepts an array of { student_id, status, notes? } entries.
     * Creates or updates attendance records in bulk.
     */
    public function markSessionAttendance(Request $request, string $sessionId)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $session = ClassSession::where('id', $sessionId)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$session) {
            return response()->json(['error' => 'Session not found or not yours'], 404);
        }

        if ($session->status === 'cancelled') {
            return response()->json(['error' => 'Cannot mark attendance for a cancelled session'], 422);
        }

        $validator = Validator::make($request->all(), [
            'records' => 'required|array|min:1',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|in:present,late,absent,excused',
            'records.*.notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $authUserId = auth('api')->id();

        // Batch-load existing records for this session (1 query)
        $studentIds = collect($request->records)->pluck('student_id')->unique()->all();
        $existingRecords = AttendanceRecord::where('session_id', $sessionId)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->keyBy('student_id');

        $created = 0;
        $updated = 0;

        foreach ($request->records as $entry) {
            $existing = $existingRecords->get($entry['student_id']);

            $payload = [
                'session_id' => $sessionId,
                'student_id' => $entry['student_id'],
                'status' => $entry['status'],
                'scan_time' => now(),
                'marked_by_id' => $authUserId,
                'is_manual_entry' => true,
                'is_override' => false,
                'notes' => $entry['notes'] ?? null,
            ];

            if ($existing) {
                $existing->update($payload);
                $updated++;
            } else {
                AttendanceRecord::create($payload);
                $created++;
            }
        }

        // Auto-complete session if all enrolled students are marked
        $enrolledCount = StudentSubjectEnrollment::where('subject_id', $session->subject_id)
            ->whereIn('status', ['enrolled', 'active'])
            ->distinct('student_id')
            ->count('student_id');
        $markedCount = AttendanceRecord::where('session_id', $sessionId)->count();

        if ($markedCount >= $enrolledCount && $session->status === 'scheduled') {
            $session->update(['status' => 'completed']);
        }

        return response()->json([
            'message' => 'تم حفظ الحضور بنجاح',
            'created' => $created,
            'updated' => $updated,
            'session_status' => $session->fresh()->status,
        ]);
    }

    /**
     * Generate QR code for a session owned by this teacher.
     */
    public function generateSessionQR(Request $request, string $sessionId)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $session = ClassSession::where('id', $sessionId)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$session) {
            return response()->json(['error' => 'Session not found or not yours'], 404);
        }

        $expiresAt = \Carbon\Carbon::parse($session->session_date->toDateString() . ' ' . $session->end_time)->addHour();

        $payload = [
            'type' => 'class_session',
            'session_id' => $session->id,
            'teacher_id' => $session->teacher_id,
            'subject_id' => $session->subject_id,
            'session_date' => $session->session_date->toDateString(),
            'expires_at' => $expiresAt->toIso8601String(),
            'generated_at' => now()->toIso8601String(),
        ];

        $signature = hash_hmac('sha256', json_encode($payload), config('app.key'));
        $qrData = json_encode(array_merge($payload, ['signature' => $signature]));

        $session->update([
            'qr_code_data' => $qrData,
            'qr_signature' => $signature,
            'qr_generated_at' => now(),
            'qr_expires_at' => $expiresAt,
        ]);

        return response()->json([
            'session_id' => $session->id,
            'qrData' => $qrData,
            'expiresAt' => $expiresAt->toIso8601String(),
        ]);
    }

    /**
     * Legacy: Get attendance summary for teacher's subjects (kept for backward compat)
     */
    public function myAttendance(Request $request)
    {
        return $this->mySessions($request);
    }

    /**
     * Check if teacher teaches a given subject
     */
    private function teachesSubject(Teacher $teacher, string $subjectId): bool
    {
        $viaAssignment = TeacherSubject::where('teacher_id', $teacher->id)
            ->where('subject_id', $subjectId)
            ->where('is_active', true)
            ->exists();

        if ($viaAssignment) return true;

        return Subject::where('id', $subjectId)
            ->where('teacher_id', $teacher->id)
            ->exists();
    }
}
