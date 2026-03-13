<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGradeRequest;
use App\Http\Requests\UpdateGradeRequest;
use App\Models\StudentGrade;
use App\Models\Semester;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    /**
     * Check if the semester is finalized. Returns error response if finalized and user is not a manager.
     */
    private function checkSemesterFinalized(?string $semesterId): ?\Illuminate\Http\JsonResponse
    {
        if (!$semesterId) return null;

        $semester = Semester::find($semesterId);
        if (!$semester || !$semester->isFinalized()) return null;

        // Allow managers to override
        $user = auth()->user();
        $appUser = $user ? \App\Models\AppUser::where('user_id', $user->id)->first() : null;
        $role = $appUser->role ?? ($appUser->roleModel->name ?? null);

        if ($role === 'manager') return null;

        return response()->json([
            'message' => 'الفصل الدراسي مغلق. لا يمكن تعديل الدرجات بعد إغلاق الفصل. يرجى التواصل مع الإدارة.',
            'semester_status' => 'finalized',
        ], 403);
    }

    public function index(Request $request)
    {
        $query = StudentGrade::with('student', 'subject', 'teacher', 'semester');

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->has('grade_type')) {
            $query->where('grade_type', $request->grade_type);
        }

        if ($request->has('is_published')) {
            $query->where('is_published', $request->boolean('is_published'));
        }

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        $query->orderBy('grade_date', 'desc');

        return response()->json($query->get());
    }

    public function store(StoreGradeRequest $request)
    {
        $semesterId = $request->semester_id ?: Semester::where('is_current', true)->value('id');
        if ($blocked = $this->checkSemesterFinalized($semesterId)) return $blocked;

        if ($request->grade_value > $request->max_grade) {
            return response()->json(['errors' => ['grade_value' => ['الدرجة لا يمكن أن تتجاوز الدرجة القصوى']]], 422);
        }

        $data = $request->all();
        if (empty($data['semester_id'])) {
            $data['semester_id'] = \App\Models\Semester::where('is_current', true)->value('id');
        }
        $grade = StudentGrade::create($data);
        $grade->load('student', 'subject', 'teacher', 'semester');

        return response()->json($grade, 201);
    }

    public function show($id)
    {
        $grade = StudentGrade::with('student', 'subject', 'teacher', 'semester')->findOrFail($id);
        return response()->json($grade);
    }

    public function update(UpdateGradeRequest $request, $id)
    {
        $grade = StudentGrade::findOrFail($id);

        if ($blocked = $this->checkSemesterFinalized($grade->semester_id)) return $blocked;

        $finalValue = $request->grade_value ?? $grade->grade_value;
        $finalMax = $request->max_grade ?? $grade->max_grade;
        if ($finalValue > $finalMax) {
            return response()->json(['errors' => ['grade_value' => ['الدرجة لا يمكن أن تتجاوز الدرجة القصوى']]], 422);
        }

        $grade->update($request->only([
            'grade_type', 'grade_name', 'grade_value', 'max_grade', 'weight',
            'grade_date', 'due_date', 'description', 'feedback', 'is_published'
        ]));
        $grade->load('student', 'subject', 'teacher', 'semester');

        return response()->json($grade);
    }

    public function destroy($id)
    {
        $grade = StudentGrade::findOrFail($id);
        $grade->delete();
        return response()->json(['message' => 'Grade deleted successfully'], 200);
    }

    public function byStudent($studentId)
    {
        $grades = StudentGrade::with('subject', 'teacher', 'semester')
            ->where('student_id', $studentId)
            ->where('is_published', true)
            ->orderBy('grade_date', 'desc')
            ->get();

        return response()->json($grades);
    }

    public function bySubject($subjectId)
    {
        $grades = StudentGrade::with('student', 'teacher', 'semester')
            ->where('subject_id', $subjectId)
            ->orderBy('grade_date', 'desc')
            ->get();

        return response()->json($grades);
    }

    public function studentSubjectGrades($studentId, $subjectId)
    {
        $grades = StudentGrade::with('teacher')
            ->where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->where('is_published', true)
            ->orderBy('grade_date', 'desc')
            ->get();

        $totalValue = $grades->sum('grade_value');
        $totalMax = $grades->sum('max_grade');
        $percentage = $totalMax > 0 ? round(($totalValue / $totalMax) * 100, 1) : 0;
        $letterGrade = $this->getLetterGrade($percentage);
        $gpa = $this->getGPA($percentage);

        return response()->json([
            'grades' => $grades,
            'total_value' => round($totalValue, 2),
            'total_max' => round($totalMax, 2),
            'percentage' => $percentage,
            'letter_grade' => $letterGrade,
            'gpa' => $gpa,
            'status' => $percentage < 50 ? 'failed' : 'passed',
            'needs_retake' => $percentage < 50,
        ]);
    }

    /**
     * Manager-facing summary: per-student per-subject aggregated grades.
     * Filters: semester_id (required), department_id (optional), student_id (optional).
     */
    public function summary(Request $request)
    {
        $request->validate([
            'semester_id' => 'required|string|exists:semesters,id',
            'department_id' => 'nullable|string|exists:departments,id',
            'student_id' => 'nullable|string|exists:students,id',
        ]);

        $semesterId = $request->input('semester_id');
        $departmentId = $request->input('department_id');
        $studentId = $request->input('student_id');

        // Get enrollments for this semester (optionally filtered)
        $enrollmentQuery = \App\Models\StudentSubjectEnrollment::where('semester_id', $semesterId)
            ->with([
                'student:id,name,campus_id,department_id,year,status',
                'subject:id,name,name_en,code,credits,semester_number',
            ]);

        if ($departmentId) {
            $enrollmentQuery->where('department_id', $departmentId);
        }
        if ($studentId) {
            $enrollmentQuery->where('student_id', $studentId);
        }

        $enrollments = $enrollmentQuery->get();

        // Get all grades for these student+subject+semester combos
        $studentIds = $enrollments->pluck('student_id')->unique()->values();
        $subjectIds = $enrollments->pluck('subject_id')->unique()->values();

        $grades = StudentGrade::where('semester_id', $semesterId)
            ->whereIn('student_id', $studentIds)
            ->whereIn('subject_id', $subjectIds)
            ->get()
            ->groupBy(fn($g) => $g->student_id . '|' . $g->subject_id);

        // Build summary rows
        $rows = [];
        foreach ($enrollments as $enrollment) {
            $key = $enrollment->student_id . '|' . $enrollment->subject_id;
            $subjectGrades = $grades->get($key, collect());

            $totalValue = $subjectGrades->sum('grade_value');
            $totalMax = $subjectGrades->sum('max_grade');
            $percentage = $totalMax > 0 ? round(($totalValue / $totalMax) * 100, 1) : null;
            $letterGrade = $percentage !== null ? $this->getLetterGrade($percentage) : null;
            $gpa = $percentage !== null ? $this->getGPA($percentage) : null;
            $isFailing = $percentage !== null && $percentage < 50;
            $publishedCount = $subjectGrades->where('is_published', true)->count();

            $rows[] = [
                'enrollment_id' => $enrollment->id,
                'student_id' => $enrollment->student_id,
                'student_name' => $enrollment->student?->name,
                'student_campus_id' => $enrollment->student?->campus_id,
                'student_year' => $enrollment->student?->year,
                'student_status' => $enrollment->student?->status,
                'subject_id' => $enrollment->subject_id,
                'subject_name' => $enrollment->subject?->name,
                'subject_code' => $enrollment->subject?->code,
                'subject_credits' => $enrollment->subject?->credits,
                'semester_number' => $enrollment->semester_number,
                'enrollment_status' => $enrollment->status,
                'is_retake' => $enrollment->is_retake ?? false,
                'grade_count' => $subjectGrades->count(),
                'published_count' => $publishedCount,
                'total_value' => round($totalValue, 2),
                'total_max' => round($totalMax, 2),
                'percentage' => $percentage,
                'letter_grade' => $letterGrade,
                'gpa' => $gpa,
                'status' => $percentage === null ? 'no_grades' : ($isFailing ? 'failed' : 'passed'),
                'needs_retake' => $isFailing,
                'enrollment_passed' => $enrollment->passed,
            ];
        }

        // Compute department-level stats
        $withGrades = collect($rows)->where('percentage', '!=', null);
        $stats = [
            'total_enrollments' => count($rows),
            'graded' => $withGrades->count(),
            'ungraded' => count($rows) - $withGrades->count(),
            'passed' => $withGrades->where('status', 'passed')->count(),
            'failed' => $withGrades->where('status', 'failed')->count(),
            'retake_count' => collect($rows)->where('is_retake', true)->count(),
            'avg_percentage' => $withGrades->count() > 0 ? round($withGrades->avg('percentage'), 1) : null,
            'avg_gpa' => $withGrades->count() > 0 ? round($withGrades->avg('gpa'), 2) : null,
        ];

        return response()->json([
            'rows' => $rows,
            'stats' => $stats,
        ]);
    }

    private function getLetterGrade(float $percentage): array
    {
        if ($percentage >= 90) return ['letter' => 'A', 'label' => 'ممتاز', 'label_en' => 'Excellent'];
        if ($percentage >= 80) return ['letter' => 'B', 'label' => 'جيد جداً', 'label_en' => 'Very Good'];
        if ($percentage >= 70) return ['letter' => 'C', 'label' => 'جيد', 'label_en' => 'Good'];
        if ($percentage >= 60) return ['letter' => 'D', 'label' => 'مقبول', 'label_en' => 'Acceptable'];
        if ($percentage >= 50) return ['letter' => 'D-', 'label' => 'مقبول ضعيف', 'label_en' => 'Weak Pass'];
        return ['letter' => 'F', 'label' => 'راسب', 'label_en' => 'Fail'];
    }

    private function getGPA(float $percentage): float
    {
        if ($percentage >= 90) return 4.0;
        if ($percentage >= 85) return 3.7;
        if ($percentage >= 80) return 3.3;
        if ($percentage >= 75) return 3.0;
        if ($percentage >= 70) return 2.7;
        if ($percentage >= 65) return 2.3;
        if ($percentage >= 60) return 2.0;
        if ($percentage >= 55) return 1.7;
        if ($percentage >= 50) return 1.0;
        return 0.0;
    }
}
