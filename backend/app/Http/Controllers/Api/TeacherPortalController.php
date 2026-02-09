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

        // Also get any manually-created class sessions for today
        $today = now()->toDateString();
        $todayManualSessions = ClassSession::where('teacher_id', $teacher->id)
            ->where('session_date', $today)
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
                'today_sessions' => $todayTimetable->count() + $todayManualSessions->count(),
                'total_grades' => StudentGrade::where('teacher_id', $teacher->id)->count(),
            ],
            'today_timetable' => $todayTimetable,
            'today_sessions' => $todayManualSessions,
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

        $subjectId = $request->subject_id;

        // Verify teacher teaches this subject
        if (!$this->teachesSubject($teacher, $subjectId)) {
            return response()->json(['error' => 'You do not teach this subject'], 403);
        }

        $created = [];
        $updated = [];

        foreach ($request->grades as $gradeData) {
            // Check if grade already exists for this student/subject/type/name
            $existing = StudentGrade::where('student_id', $gradeData['student_id'])
                ->where('subject_id', $subjectId)
                ->where('teacher_id', $teacher->id)
                ->where('grade_type', $gradeData['grade_type'])
                ->where('grade_name', $gradeData['grade_name'])
                ->first();

            $gradePayload = [
                'student_id' => $gradeData['student_id'],
                'subject_id' => $subjectId,
                'teacher_id' => $teacher->id,
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
                $updated[] = $existing->fresh();
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

    /**
     * Get attendance summary for teacher's subjects
     */
    public function myAttendance(Request $request)
    {
        $teacher = $this->getTeacher($request);
        if (!$teacher) {
            return response()->json(['error' => 'Teacher profile not found'], 404);
        }

        $sessions = ClassSession::where('teacher_id', $teacher->id)
            ->with([
                'subject:id,name,name_en,code',
                'department:id,name,name_en',
            ])
            ->withCount('attendanceRecords')
            ->orderBy('session_date', 'desc')
            ->get();

        return response()->json($sessions);
    }

    /**
     * Check if teacher teaches a given subject
     */
    private function teachesSubject(Teacher $teacher, string $subjectId): bool
    {
        // Check via teacher_subjects table
        $viaAssignment = TeacherSubject::where('teacher_id', $teacher->id)
            ->where('subject_id', $subjectId)
            ->where('is_active', true)
            ->exists();

        if ($viaAssignment) return true;

        // Check via subjects.teacher_id
        return Subject::where('id', $subjectId)
            ->where('teacher_id', $teacher->id)
            ->exists();
    }
}
