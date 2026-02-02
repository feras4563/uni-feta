<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubjectController extends Controller
{
    /**
     * Display a listing of subjects
     */
    public function index(Request $request)
    {
        $query = Subject::with('department:id,name,name_en', 'teacher:id,name,name_en');

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
            'cost_per_credit' => 'nullable|numeric|min:0',
            'is_required' => 'nullable|boolean',
            'semester_number' => 'nullable|integer|min:1|max:12',
            'semester' => 'nullable|string|max:50',
            'prerequisites' => 'nullable|array',
            'teacher_id' => 'nullable|exists:teachers,id',
            'max_students' => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subject = Subject::create($request->all());
        $subject->load('department:id,name,name_en', 'teacher:id,name,name_en');

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
            'subjectDepartments.department',
            'departmentSemesterSubjects',
            'teacherSubjects.teacher',
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
            'cost_per_credit' => 'nullable|numeric|min:0',
            'is_required' => 'nullable|boolean',
            'semester_number' => 'nullable|integer|min:1|max:12',
            'semester' => 'nullable|string|max:50',
            'prerequisites' => 'nullable|array',
            'teacher_id' => 'nullable|exists:teachers,id',
            'max_students' => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subject->update($request->all());
        $subject->load('department:id,name,name_en', 'teacher:id,name,name_en');

        return response()->json($subject);
    }

    /**
     * Remove the specified subject
     */
    public function destroy($id)
    {
        $subject = Subject::findOrFail($id);
        $subject->delete();

        return response()->json(['message' => 'Subject deleted successfully'], 200);
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
        $subjects = Subject::with('department:id,name,name_en', 'teacher:id,name,name_en')
            ->where('semester_number', $semesterNumber)
            ->orderBy('name')
            ->get();

        return response()->json($subjects);
    }
}
