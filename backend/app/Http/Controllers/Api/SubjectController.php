<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\SubjectDepartment;
use App\Models\SubjectPrerequisite;
use App\Traits\LogsUserActions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SubjectController extends Controller
{
    use LogsUserActions;
    /**
     * Display a listing of subjects
     */
    public function index(Request $request)
    {
        $query = Subject::with('department:id,name,name_en', 'teacher:id,name,name_en', 'semesterRelation:id,name,name_en', 'prerequisiteSubjects:id,name,code', 'subjectDepartments:id,subject_id,department_id');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by semester
        if ($request->has('semester_number')) {
            $query->where('semester_number', $request->semester_number);
        }

        // Filter by semester_id
        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        // Filter by required status
        if ($request->has('is_required')) {
            $query->where('is_required', $request->boolean('is_required'));
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Order by
        $query->orderBy('semester_number')->orderBy('name');

        return response()->json($query->get());
    }

    /**
     * Store a newly created subject
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'code' => 'required|string|unique:subjects,code',
            'description' => 'nullable|string',
            'credits' => 'required|integer|min:1|max:10',
            'department_id' => 'nullable|exists:departments,id',
            'department_ids' => 'nullable|array|min:1',
            'department_ids.*' => 'exists:departments,id',
            'primary_department_id' => 'nullable|exists:departments,id',
            'cost_per_credit' => 'required|numeric|min:0',
            'is_required' => 'nullable|boolean',
            'subject_type' => 'nullable|string|in:required,elective,university_requirement,department_requirement',
            'semester_number' => 'required|integer|min:1|max:12',
            'semester' => 'nullable|string|max:50',
            'semester_id' => 'nullable|exists:semesters,id',
            'prerequisites' => 'nullable|array',
            'prerequisite_ids' => 'nullable|array',
            'prerequisite_ids.*' => 'distinct|exists:subjects,id',
            'min_units_required' => 'nullable|integer|min:0',
            'theoretical_hours' => 'nullable|integer|min:0',
            'practical_hours' => 'nullable|integer|min:0',
            'teacher_id' => 'nullable|exists:teachers,id',
            'max_students' => 'nullable|integer|min:1',
            'pdf_file_url' => 'nullable|string|max:2048',
            'pdf_file_name' => 'nullable|string|max:255',
            'pdf_file_size' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $validator->after(function ($validator) use ($request) {
            $departmentIds = $request->input('department_ids', []);
            $departmentId = $request->input('department_id');

            if (empty($departmentIds) && empty($departmentId)) {
                $validator->errors()->add('department_ids', 'يجب اختيار قسم واحد على الأقل');
            }

            $primaryDepartmentId = $request->input('primary_department_id');
            if ($primaryDepartmentId && !empty($departmentIds) && !in_array($primaryDepartmentId, $departmentIds, true)) {
                $validator->errors()->add('primary_department_id', 'القسم الرئيسي يجب أن يكون من ضمن الأقسام المختارة');
            }
        });

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $departmentIds = $request->input('department_ids', []);
        if (empty($departmentIds) && $request->filled('department_id')) {
            $departmentIds = [$request->input('department_id')];
        }

        $primaryDepartmentId = $request->input('primary_department_id', $departmentIds[0] ?? $request->input('department_id'));

        $data = $request->except(['prerequisite_ids', 'department_ids', 'primary_department_id']);
        $data['department_id'] = $primaryDepartmentId;
        $subject = Subject::create($data);

        foreach ($departmentIds as $departmentId) {
            SubjectDepartment::create([
                'subject_id' => $subject->id,
                'department_id' => $departmentId,
                'is_primary_department' => $departmentId === $primaryDepartmentId,
                'is_active' => true,
            ]);
        }

        // Sync prerequisites
        if ($request->has('prerequisite_ids')) {
            $subject->prerequisiteSubjects()->sync($request->prerequisite_ids ?? []);
        }

        $subject->load('department:id,name,name_en', 'teacher:id,name,name_en', 'semesterRelation:id,name,name_en', 'prerequisiteSubjects:id,name,name_en,code', 'subjectDepartments.department');

        $this->logAction('create', 'subjects', $subject->id, [
            'subject_name' => $subject->name,
            'code' => $subject->code,
            'department_id' => $subject->department_id,
        ]);

        return response()->json($subject, 201);
    }

    /**
     * Display the specified subject
     */
    public function show($id)
    {
        $subject = Subject::with([
            'department:id,name,name_en',
            'teacher:id,name,name_en',
            'semesterRelation:id,name,name_en',
            'prerequisiteSubjects:id,name,name_en,code',
            'dependentSubjects:id,name,name_en,code',
            'subjectDepartments.department',
            'departmentSemesterSubjects',
            'teacherSubjects.teacher',
            'teacherSubjects.department',
            'teacherSubjects.semester',
            'teacherSubjects.studyYear',
            'titles',
        ])->findOrFail($id);

        return response()->json($subject);
    }

    /**
     * Update the specified subject
     */
    public function update(Request $request, $id)
    {
        $subject = Subject::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'code' => 'sometimes|required|string|unique:subjects,code,' . $id,
            'description' => 'nullable|string',
            'credits' => 'sometimes|required|integer|min:1|max:10',
            'department_id' => 'nullable|exists:departments,id',
            'department_ids' => 'nullable|array|min:1',
            'department_ids.*' => 'exists:departments,id',
            'primary_department_id' => 'nullable|exists:departments,id',
            'cost_per_credit' => 'nullable|numeric|min:0',
            'is_required' => 'nullable|boolean',
            'subject_type' => 'nullable|string|in:required,elective,university_requirement,department_requirement',
            'semester_number' => 'nullable|integer|min:1|max:12',
            'semester' => 'nullable|string|max:50',
            'semester_id' => 'nullable|exists:semesters,id',
            'prerequisites' => 'nullable|array',
            'prerequisite_ids' => 'nullable|array',
            'prerequisite_ids.*' => 'distinct|exists:subjects,id',
            'min_units_required' => 'nullable|integer|min:0',
            'theoretical_hours' => 'nullable|integer|min:0',
            'practical_hours' => 'nullable|integer|min:0',
            'teacher_id' => 'nullable|exists:teachers,id',
            'max_students' => 'nullable|integer|min:1',
            'pdf_file_url' => 'nullable|string|max:2048',
            'pdf_file_name' => 'nullable|string|max:255',
            'pdf_file_size' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $validator->after(function ($validator) use ($request, $id) {
            $departmentIds = $request->input('department_ids', []);
            $primaryDepartmentId = $request->input('primary_department_id');

            if ($primaryDepartmentId && !empty($departmentIds) && !in_array($primaryDepartmentId, $departmentIds, true)) {
                $validator->errors()->add('primary_department_id', 'القسم الرئيسي يجب أن يكون من ضمن الأقسام المختارة');
            }

            if (in_array($id, $request->input('prerequisite_ids', []), true)) {
                $validator->errors()->add('prerequisite_ids', 'لا يمكن للمقرر أن يكون متطلباً سابقاً لنفسه');
            }
        });

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except(['prerequisite_ids', 'department_ids', 'primary_department_id']);
        $subject->update($data);

        // Sync prerequisites if provided
        if ($request->has('prerequisite_ids')) {
            $subject->prerequisiteSubjects()->sync($request->prerequisite_ids ?? []);
        }

        // Sync department relationships if provided
        if ($request->has('department_ids')) {
            $departmentIds = $request->input('department_ids', []);
            $primaryDepartmentId = $request->input('primary_department_id', $departmentIds[0] ?? null);

            // Delete existing subject_departments
            SubjectDepartment::where('subject_id', $subject->id)->delete();

            // Create new subject_departments
            foreach ($departmentIds as $deptId) {
                SubjectDepartment::create([
                    'subject_id' => $subject->id,
                    'department_id' => $deptId,
                    'is_primary_department' => $deptId === $primaryDepartmentId,
                    'is_active' => true,
                ]);
            }

            // Update the subject's primary department_id
            if ($primaryDepartmentId) {
                $subject->update(['department_id' => $primaryDepartmentId]);
            }
        }

        $subject->load('department:id,name,name_en', 'teacher:id,name,name_en', 'semesterRelation:id,name,name_en', 'prerequisiteSubjects:id,name,name_en,code', 'subjectDepartments.department');

        $this->logAction('update', 'subjects', $subject->id, [
            'subject_name' => $subject->name,
            'updated_fields' => array_keys($request->except(['prerequisite_ids', 'department_ids', 'primary_department_id'])),
        ]);

        return response()->json($subject);
    }

    /**
     * Remove the specified subject
     */
    public function destroy($id)
    {
        $subject = Subject::findOrFail($id);

        $this->logAction('delete', 'subjects', $subject->id, [
            'subject_name' => $subject->name,
            'code' => $subject->code,
        ]);

        if (!empty($subject->pdf_file_url)) {
            $oldPath = str_replace('/storage/', '', $subject->pdf_file_url);
            Storage::disk('public')->delete($oldPath);
        }

        $subject->delete();

        return response()->json(['message' => 'Subject deleted successfully'], 200);
    }

    public function uploadPdf(Request $request, $id)
    {
        $subject = Subject::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'pdf' => 'required|file|mimes:pdf|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!empty($subject->pdf_file_url)) {
            $oldPath = str_replace('/storage/', '', $subject->pdf_file_url);
            Storage::disk('public')->delete($oldPath);
        }

        $file = $request->file('pdf');
        $path = $file->store('subject-pdfs', 'public');

        return response()->json([
            'url' => '/storage/' . $path,
            'fileName' => $file->getClientOriginalName(),
            'fileSize' => $file->getSize(),
        ]);
    }

    public function deletePdf($id)
    {
        $subject = Subject::findOrFail($id);

        if (!empty($subject->pdf_file_url)) {
            $oldPath = str_replace('/storage/', '', $subject->pdf_file_url);
            Storage::disk('public')->delete($oldPath);
        }

        $subject->update([
            'pdf_file_url' => null,
            'pdf_file_name' => null,
            'pdf_file_size' => null,
        ]);

        return response()->json(['message' => 'Subject PDF deleted successfully'], 200);
    }

    /**
     * Get subjects by department
     */
    public function byDepartment($departmentId)
    {
        $subjects = Subject::with('teacher:id,name,name_en')
            ->where('department_id', $departmentId)
            ->orderBy('semester_number')
            ->orderBy('name')
            ->get();

        return response()->json($subjects);
    }

    /**
     * Get subjects by semester
     */
    public function bySemester($semesterNumber)
    {
        $subjects = Subject::with('department:id,name,name_en', 'teacher:id,name,name_en', 'prerequisiteSubjects:id,name,code')
            ->where('semester_number', $semesterNumber)
            ->orderBy('name')
            ->get();

        return response()->json($subjects);
    }

    /**
     * Check if a student meets prerequisites for a subject
     */
    public function checkPrerequisites(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subject = Subject::with('prerequisiteSubjects:id,name,code')->findOrFail($id);
        $prerequisites = $subject->prerequisiteSubjects;

        // Get completed subjects for this student (passed enrollments)
        $completedSubjectIds = \App\Models\StudentSubjectEnrollment::where('student_id', $request->student_id)
            ->where('status', 'completed')
            ->pluck('subject_id')
            ->toArray();

        $canEnroll = true;
        $messages = [];

        // Check subject prerequisites
        $missingPrerequisites = collect();
        if ($prerequisites->isNotEmpty()) {
            $missingPrerequisites = $prerequisites->filter(function ($prereq) use ($completedSubjectIds) {
                return !in_array($prereq->id, $completedSubjectIds);
            });

            if ($missingPrerequisites->isNotEmpty()) {
                $canEnroll = false;
                $messages[] = 'الطالب لم يكمل المتطلبات السابقة التالية: ' . $missingPrerequisites->pluck('name')->join('، ');
            }
        }

        // Check minimum units required (e.g., "100 units completed")
        $unitsCheck = null;
        if ($subject->min_units_required) {
            $completedUnits = \App\Models\StudentSubjectEnrollment::where('student_id', $request->student_id)
                ->where('status', 'completed')
                ->join('subjects', 'student_subject_enrollments.subject_id', '=', 'subjects.id')
                ->sum('subjects.credits');

            $unitsCheck = [
                'required' => $subject->min_units_required,
                'completed' => (int) $completedUnits,
                'met' => $completedUnits >= $subject->min_units_required,
            ];

            if (!$unitsCheck['met']) {
                $canEnroll = false;
                $messages[] = "يجب إكمال {$subject->min_units_required} وحدة دراسية على الأقل (مكتمل: {$completedUnits})";
            }
        }

        if (empty($messages)) {
            $messages[] = $prerequisites->isEmpty() && !$subject->min_units_required
                ? 'لا توجد متطلبات سابقة لهذا المقرر'
                : 'الطالب مستوفي لجميع المتطلبات السابقة';
        }

        return response()->json([
            'can_enroll' => $canEnroll,
            'prerequisites' => $prerequisites->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'code' => $p->code,
                'completed' => in_array($p->id, $completedSubjectIds),
            ]),
            'missing_prerequisites' => $missingPrerequisites->values()->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'code' => $p->code,
            ]),
            'units_check' => $unitsCheck,
            'message' => implode(' | ', $messages),
        ]);
    }
}
