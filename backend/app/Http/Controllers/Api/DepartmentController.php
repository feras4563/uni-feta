<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments
     */
    public function index(Request $request)
    {
        $query = Department::with('headTeacher:id,name,name_en');

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%");
            });
        }

        $query->orderBy('name');

        return response()->json($query->get());
    }

    /**
     * Store a newly created department
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'head' => 'nullable|string|max:255',
            'head_teacher_id' => 'nullable|exists:teachers,id',
            'semester_count' => 'nullable|integer|min:1|max:10',
            'is_locked' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department = Department::create($request->all());
        $department->load('headTeacher:id,name,name_en');

        return response()->json($department, 201);
    }

    /**
     * Display the specified department
     */
    public function show($id)
    {
        $department = Department::with([
            'headTeacher:id,name,name_en',
            'students' => function($q) {
                $q->select('id', 'name', 'department_id', 'status', 'year');
            },
            'subjects' => function($q) {
                $q->select('id', 'name', 'code', 'credits', 'department_id', 'semester_number');
            },
            'teachers' => function($q) {
                $q->select('id', 'name', 'department_id', 'specialization');
            }
        ])->findOrFail($id);

        return response()->json($department);
    }

    /**
     * Get department details with statistics
     */
    public function details($id)
    {
        $department = Department::with('headTeacher:id,name,name_en')->findOrFail($id);

        // Get all subjects for this department
        $allSubjects = Subject::where('department_id', $id)
            ->select('id', 'name', 'name_en', 'code', 'credits', 'semester_number', 'is_required')
            ->orderBy('semester_number')
            ->orderBy('name')
            ->get();

        // Group subjects by semester
        $subjectsBySemester = $allSubjects->groupBy('semester_number');

        $semesters = $subjectsBySemester->map(function($semesterSubjects, $semesterNumber) {
            return [
                'name' => "الفصل {$semesterNumber}",
                'semesterNumber' => $semesterNumber,
                'subjects' => $semesterSubjects,
                'totalCredits' => $semesterSubjects->sum('credits'),
                'totalSubjects' => $semesterSubjects->count(),
            ];
        })->values();

        // Format subjects data for frontend
        $subjectsData = [
            'total' => $allSubjects->count(),
            'data' => $allSubjects->toArray(),
            'bySemester' => []
        ];

        // Build bySemester structure
        foreach ($subjectsBySemester as $semesterNumber => $semesterSubjects) {
            $semesterKey = "الفصل {$semesterNumber}";
            $subjectsData['bySemester'][$semesterKey] = [
                'name' => $semesterKey,
                'semesterNumber' => $semesterNumber,
                'subjects' => $semesterSubjects->toArray(),
                'totalCredits' => $semesterSubjects->sum('credits'),
                'totalSubjects' => $semesterSubjects->count(),
            ];
        }

        // Get student counts
        $totalStudents = Student::where('department_id', $id)->count();
        $activeStudents = Student::where('department_id', $id)->where('status', 'active')->count();

        return response()->json([
            'department' => $department,
            'semesters' => $semesters,
            'subjects' => $subjectsData,
            'totalSubjects' => $allSubjects->count(),
            'totalStudents' => $totalStudents,
            'activeStudents' => $activeStudents,
            'totalSemesters' => $semesters->count(),
        ]);
    }

    /**
     * Update the specified department
     */
    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'head' => 'nullable|string|max:255',
            'head_teacher_id' => 'nullable|exists:teachers,id',
            'semester_count' => 'nullable|integer|min:1|max:10',
            'is_locked' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $department->update($request->all());
        $department->load('headTeacher:id,name,name_en');

        return response()->json($department);
    }

    /**
     * Remove the specified department
     */
    public function destroy($id)
    {
        $department = Department::findOrFail($id);
        
        // Check if department has students
        if ($department->students()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete department with enrolled students'
            ], 422);
        }

        $department->delete();

        return response()->json(['message' => 'Department deleted successfully'], 200);
    }

    /**
     * Get department statistics
     */
    public function statistics($id)
    {
        $department = Department::findOrFail($id);

        $stats = [
            'total_students' => $department->students()->count(),
            'active_students' => $department->students()->where('status', 'active')->count(),
            'total_subjects' => $department->subjects()->count(),
            'total_teachers' => $department->teachers()->count(),
            'students_by_year' => $department->students()
                ->selectRaw('year, count(*) as count')
                ->groupBy('year')
                ->orderBy('year')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Get subjects for a specific semester in a department
     */
    public function getSemesterSubjects($id, $semesterNumber)
    {
        $department = Department::findOrFail($id);

        $subjects = Subject::where('department_id', $id)
            ->where('semester_number', $semesterNumber)
            ->with('teacher:id,name')
            ->select('id', 'name', 'name_en', 'code', 'credits', 'cost_per_credit', 'semester_number', 'is_required', 'teacher_id', 'department_id')
            ->orderBy('name')
            ->get();

        \Log::info("Getting subjects for department {$id}, semester {$semesterNumber}: " . $subjects->count() . " subjects found");

        return response()->json($subjects);
    }

    /**
     * Update subjects for a specific semester in a department
     */
    public function updateSemesterSubjects(Request $request, $id, $semesterNumber)
    {
        $department = Department::findOrFail($id);

        \Log::info("Received request data: " . json_encode($request->all()));
        \Log::info("Subject IDs received: " . json_encode($request->subject_ids));

        // Check if the subjects exist
        if ($request->subject_ids) {
            foreach ($request->subject_ids as $subjectId) {
                $exists = Subject::where('id', $subjectId)->exists();
                \Log::info("Subject {$subjectId} exists: " . ($exists ? 'yes' : 'no'));
            }
        }

        $validator = Validator::make($request->all(), [
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'string|exists:subjects,id',
        ]);

        if ($validator->fails()) {
            \Log::error("Validation failed: " . json_encode($validator->errors()));
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subjectIds = $request->subject_ids ?? [];

        \Log::info("Updating semester subjects for department {$id}, semester {$semesterNumber}");
        \Log::info("Subject IDs to assign: " . json_encode($subjectIds));

        // Simply update all subjects for this semester
        // This approach: assign the subjects to this semester, don't worry about clearing others
        if (!empty($subjectIds)) {
            $updatedCount = Subject::whereIn('id', $subjectIds)
                ->update([
                    'semester_number' => $semesterNumber,
                    'department_id' => $id
                ]);
            
            \Log::info("Updated {$updatedCount} subjects to semester {$semesterNumber}");
        }

        // Verify the update
        $verifyCount = Subject::where('department_id', $id)
            ->where('semester_number', $semesterNumber)
            ->count();
        
        \Log::info("Verification: {$verifyCount} subjects now in department {$id}, semester {$semesterNumber}");

        return response()->json([
            'message' => 'Semester subjects updated successfully',
            'semester_number' => $semesterNumber,
            'subject_count' => count($subjectIds),
            'verified_count' => $verifyCount
        ]);
    }
}
