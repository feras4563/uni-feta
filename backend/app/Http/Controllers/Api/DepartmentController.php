<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectDepartment;
use App\Models\Teacher;
use App\Traits\LogsUserActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DepartmentController extends Controller
{
    use LogsUserActions;
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
            'location' => 'nullable|string|max:255',
            'structure' => 'nullable|string|max:255',
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

        $this->logAction('create', 'departments', $department->id, [
            'department_name' => $department->name,
        ]);

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

        // Get all subjects for this department with prerequisites
        $allSubjects = Subject::where(function ($query) use ($id) {
                $query->where('department_id', $id)
                    ->orWhereHas('subjectDepartments', function ($subjectDepartmentsQuery) use ($id) {
                        $subjectDepartmentsQuery->where('department_id', $id)
                            ->where('is_active', true);
                    });
            })
            ->with('prerequisiteSubjects:id,name,name_en,code')
            ->distinct()
            ->select('id', 'name', 'name_en', 'code', 'credits', 'semester_number', 'is_required',
                     'subject_type', 'theoretical_hours', 'practical_hours', 'min_units_required')
            ->orderBy('semester_number')
            ->orderBy('name')
            ->get();

        $students = Student::where('department_id', $id)
            ->select('id', 'name', 'name_en', 'department_id', 'status', 'year', 'email', 'created_at')
            ->orderBy('name')
            ->get();

        $teachers = Teacher::where('department_id', $id)
            ->select('id', 'name', 'name_en', 'department_id', 'specialization', 'email', 'is_active', 'created_at')
            ->orderBy('name')
            ->get();

        // Group subjects by semester
        $subjectsBySemester = $allSubjects->groupBy('semester_number');

        // Calculate total units for the department curriculum
        $totalUnits = $allSubjects->sum('credits');

        $semesters = $subjectsBySemester->map(function($semesterSubjects, $semesterNumber) {
            return [
                'name' => "الفصل {$semesterNumber}",
                'semesterNumber' => $semesterNumber,
                'subjects' => $semesterSubjects,
                'totalCredits' => $semesterSubjects->sum('credits'),
                'totalSubjects' => $semesterSubjects->count(),
            ];
        })->sortKeys()->values();

        // Format subjects data for frontend
        $subjectsData = [
            'total' => $allSubjects->count(),
            'totalUnits' => $totalUnits,
            'data' => $allSubjects->toArray(),
            'bySemester' => []
        ];

        // Build bySemester structure (sorted by semester number)
        $sortedSemesters = $subjectsBySemester->sortKeys();
        foreach ($sortedSemesters as $semesterNumber => $semesterSubjects) {
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
        $totalStudents = $students->count();
        $activeStudents = $students->where('status', 'active')->count();

        return response()->json([
            'department' => $department,
            'semesters' => $semesters,
            'students' => [
                'total' => $students->count(),
                'data' => $students->values(),
            ],
            'teachers' => [
                'total' => $teachers->count(),
                'data' => $teachers->values(),
            ],
            'subjects' => $subjectsData,
            'totalSubjects' => $allSubjects->count(),
            'totalUnits' => $totalUnits,
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
            'location' => 'nullable|string|max:255',
            'structure' => 'nullable|string|max:255',
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

        $this->logAction('update', 'departments', $department->id, [
            'department_name' => $department->name,
            'updated_fields' => array_keys($request->all()),
        ]);

        return response()->json($department);
    }

    /**
     * Remove the specified department
     */
    public function destroy($id)
    {
        $department = Department::findOrFail($id);

        $deletedCounts = [
            'students' => 0,
            'teachers' => 0,
            'subjects_deleted' => 0,
            'subjects_detached' => 0,
        ];

        DB::transaction(function () use ($department, &$deletedCounts) {
            $departmentId = $department->id;

            $studentIds = Student::where('department_id', $departmentId)->pluck('id');
            $teacherIds = Teacher::where('department_id', $departmentId)->pluck('id');

            $mappedSubjectIds = SubjectDepartment::where('department_id', $departmentId)
                ->pluck('subject_id');
            $primarySubjectIds = Subject::where('department_id', $departmentId)
                ->pluck('id');

            $departmentSubjectIds = $mappedSubjectIds
                ->merge($primarySubjectIds)
                ->unique()
                ->values();

            $subjectIdsWithOtherDepartments = SubjectDepartment::whereIn('subject_id', $departmentSubjectIds)
                ->where('department_id', '!=', $departmentId)
                ->pluck('subject_id')
                ->unique();

            $sharedSubjectIds = $departmentSubjectIds
                ->intersect($subjectIdsWithOtherDepartments)
                ->values();
            $exclusiveSubjectIds = $departmentSubjectIds
                ->diff($subjectIdsWithOtherDepartments)
                ->values();

            if ($teacherIds->isNotEmpty()) {
                Subject::whereIn('teacher_id', $teacherIds)
                    ->whereNotIn('id', $exclusiveSubjectIds)
                    ->update(['teacher_id' => null]);
            }

            if ($sharedSubjectIds->isNotEmpty()) {
                $sharedSubjects = Subject::whereIn('id', $sharedSubjectIds)->get(['id', 'department_id']);

                foreach ($sharedSubjects as $sharedSubject) {
                    if ($sharedSubject->department_id !== $departmentId) {
                        continue;
                    }

                    $replacementDepartmentId = SubjectDepartment::where('subject_id', $sharedSubject->id)
                        ->where('department_id', '!=', $departmentId)
                        ->orderByDesc('is_primary_department')
                        ->value('department_id');

                    $sharedSubject->update([
                        'department_id' => $replacementDepartmentId,
                    ]);
                }

                SubjectDepartment::where('department_id', $departmentId)
                    ->whereIn('subject_id', $sharedSubjectIds)
                    ->delete();

                $deletedCounts['subjects_detached'] = $sharedSubjectIds->count();
            }

            if ($exclusiveSubjectIds->isNotEmpty()) {
                SubjectDepartment::where('department_id', $departmentId)
                    ->whereIn('subject_id', $exclusiveSubjectIds)
                    ->delete();

                $deletedCounts['subjects_deleted'] = Subject::whereIn('id', $exclusiveSubjectIds)->delete();
            }

            if ($studentIds->isNotEmpty()) {
                $deletedCounts['students'] = Student::whereIn('id', $studentIds)->delete();
            }

            if ($teacherIds->isNotEmpty()) {
                $deletedCounts['teachers'] = Teacher::whereIn('id', $teacherIds)->delete();
            }

            $department->delete();
        });

        $this->logAction('delete', 'departments', $department->id, [
            'department_name' => $department->name,
            'deleted_counts' => $deletedCounts,
        ]);

        return response()->json([
            'message' => 'Department deleted successfully',
            'deleted_counts' => $deletedCounts,
        ], 200);
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
