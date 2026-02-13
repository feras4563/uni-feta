<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentSubjectEnrollment;
use App\Models\StudentInvoice;
use App\Models\StudentGrade;
use App\Models\AttendanceRecord;
use App\Models\TimetableEntry;
use App\Models\AppUser;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    /**
     * Get the authenticated student from the JWT user
     */
    private function getStudent(Request $request): ?Student
    {
        $user = auth('api')->user();
        $appUser = AppUser::where('auth_user_id', $user->id)->first();

        if (!$appUser || !$appUser->student_id) {
            return null;
        }

        return Student::find($appUser->student_id);
    }

    /**
     * Student dashboard - overview of everything
     */
    public function dashboard(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $student->load('department:id,name,name_en');

        // Current semester enrollments
        $currentEnrollments = StudentSubjectEnrollment::where('student_id', $student->id)
            ->whereIn('status', ['enrolled', 'active'])
            ->with('subject:id,name,name_en,code,credits', 'semester:id,name,name_en')
            ->get();

        // Fee summary
        $invoices = StudentInvoice::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalFees = $invoices->sum('total_amount');
        $totalPaid = $invoices->sum('paid_amount');
        $totalBalance = $invoices->sum('balance');

        // Grades count
        $totalGrades = StudentGrade::where('student_id', $student->id)->count();
        $publishedGrades = StudentGrade::where('student_id', $student->id)
            ->where('is_published', true)
            ->count();

        // Today's timetable
        $todayDayOfWeek = now()->dayOfWeek;
        $studentGroupIds = \DB::table('student_group_members')
            ->where('student_id', $student->id)
            ->pluck('student_group_id');

        $todayTimetable = collect();
        if ($studentGroupIds->isNotEmpty()) {
            $todayTimetable = TimetableEntry::whereIn('student_group_id', $studentGroupIds)
                ->where('day_of_week', $todayDayOfWeek)
                ->where('is_active', true)
                ->with([
                    'subject:id,name,name_en,code',
                    'teacher:id,name,name_en',
                    'room:id,name,code,building',
                ])
                ->orderBy('start_time')
                ->get();
        }

        // Attendance stats
        $attendanceRecords = AttendanceRecord::where('student_id', $student->id)->get();
        $totalAttendance = $attendanceRecords->count();
        $presentCount = $attendanceRecords->where('status', 'present')->count();
        $attendanceRate = $totalAttendance > 0 ? round(($presentCount / $totalAttendance) * 100, 1) : 0;

        return response()->json([
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'name_en' => $student->name_en,
                'campus_id' => $student->campus_id,
                'email' => $student->email,
                'department' => $student->department,
                'year' => $student->year,
                'status' => $student->status,
                'photo_url' => $student->photo_url,
            ],
            'stats' => [
                'enrolled_subjects' => $currentEnrollments->count(),
                'total_credits' => $currentEnrollments->sum(fn($e) => $e->subject?->credits ?? 0),
                'total_fees' => $totalFees,
                'total_paid' => $totalPaid,
                'total_balance' => $totalBalance,
                'total_grades' => $totalGrades,
                'published_grades' => $publishedGrades,
                'attendance_rate' => $attendanceRate,
                'today_classes' => $todayTimetable->count(),
            ],
            'current_enrollments' => $currentEnrollments,
            'today_timetable' => $todayTimetable,
            'recent_invoice' => $invoices->first(),
        ]);
    }

    /**
     * Get student's enrolled subjects
     */
    public function mySubjects(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $query = StudentSubjectEnrollment::where('student_id', $student->id)
            ->with([
                'subject:id,name,name_en,code,credits,department_id,semester_number',
                'subject.department:id,name,name_en',
                'semester:id,name,name_en',
                'studyYear:id,name,name_en',
            ]);

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $enrollments = $query->orderBy('created_at', 'desc')->get();

        return response()->json($enrollments);
    }

    /**
     * Get student's fees/invoices
     */
    public function myFees(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $query = StudentInvoice::where('student_id', $student->id)
            ->with([
                'semester:id,name,name_en',
                'studyYear:id,name,name_en',
                'department:id,name,name_en',
                'items.subject:id,name,name_en,code',
                'items.feeDefinition:id,name_ar,name_en',
            ]);

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->orderBy('created_at', 'desc')->get();

        // Summary
        $totalFees = $invoices->sum('total_amount');
        $totalPaid = $invoices->sum('paid_amount');
        $totalBalance = $invoices->sum('balance');

        return response()->json([
            'invoices' => $invoices,
            'summary' => [
                'total_fees' => $totalFees,
                'total_paid' => $totalPaid,
                'total_balance' => $totalBalance,
                'invoice_count' => $invoices->count(),
            ],
        ]);
    }

    /**
     * Get student's schedule (timetable)
     */
    public function mySchedule(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        // Get student's groups
        $studentGroupIds = \DB::table('student_group_members')
            ->where('student_id', $student->id)
            ->pluck('student_group_id');

        $timetable = collect();
        if ($studentGroupIds->isNotEmpty()) {
            $timetable = TimetableEntry::whereIn('student_group_id', $studentGroupIds)
                ->where('is_active', true)
                ->with([
                    'subject:id,name,name_en,code',
                    'teacher:id,name,name_en',
                    'room:id,name,code,building',
                    'timeSlot:id,code,label,start_time,end_time',
                    'studentGroup:id,name',
                ])
                ->orderBy('day_of_week')
                ->orderBy('start_time')
                ->get();
        }

        return response()->json([
            'timetable' => $timetable,
        ]);
    }

    /**
     * Get student's grades
     */
    public function myGrades(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $query = StudentGrade::where('student_id', $student->id)
            ->where('is_published', true)
            ->with([
                'subject:id,name,name_en,code',
                'teacher:id,name,name_en',
            ]);

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        $grades = $query->orderBy('grade_date', 'desc')->get();

        // Group by subject
        $grouped = $grades->groupBy('subject_id')->map(function ($subjectGrades) {
            $subject = $subjectGrades->first()->subject;
            $totalWeighted = 0;
            $totalWeight = 0;

            foreach ($subjectGrades as $grade) {
                $percentage = ($grade->grade_value / $grade->max_grade) * 100;
                $weight = $grade->weight ?? 1;
                $totalWeighted += $percentage * $weight;
                $totalWeight += $weight;
            }

            $average = $totalWeight > 0 ? round($totalWeighted / $totalWeight, 1) : 0;

            return [
                'subject' => $subject,
                'grades' => $subjectGrades->values(),
                'average' => $average,
                'grade_count' => $subjectGrades->count(),
            ];
        })->values();

        return response()->json([
            'grades' => $grades,
            'by_subject' => $grouped,
        ]);
    }

    /**
     * Get student's attendance records
     */
    public function myAttendance(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $query = AttendanceRecord::where('student_id', $student->id)
            ->with([
                'classSession:id,subject_id,session_name,session_date,start_time,end_time',
                'classSession.subject:id,name,name_en,code',
            ]);

        if ($request->has('subject_id')) {
            $query->whereHas('classSession', function ($q) use ($request) {
                $q->where('subject_id', $request->subject_id);
            });
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        // Stats
        $total = $records->count();
        $present = $records->where('status', 'present')->count();
        $absent = $records->where('status', 'absent')->count();
        $late = $records->where('status', 'late')->count();
        $excused = $records->where('status', 'excused')->count();
        $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0;

        return response()->json([
            'records' => $records,
            'stats' => [
                'total' => $total,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
                'attendance_rate' => $rate,
            ],
        ]);
    }

    /**
     * Get student's profile info
     */
    public function myProfile(Request $request)
    {
        $student = $this->getStudent($request);
        if (!$student) {
            return response()->json(['error' => 'Student profile not found'], 404);
        }

        $student->load([
            'department:id,name,name_en',
            'academicProgress',
        ]);

        return response()->json($student);
    }
}
