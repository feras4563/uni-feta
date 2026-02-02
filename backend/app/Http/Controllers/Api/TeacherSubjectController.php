<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeacherSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TeacherSubjectController extends Controller
{
    /**
     * Get all teacher-subject assignments
     */
    public function index(Request $request)
    {
        $query = TeacherSubject::with(['teacher', 'subject', 'department', 'semester', 'studyYear']);

        // Filter by teacher
        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        // Filter by subject
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by semester
        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }

        // Filter by academic year
        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === true);
        }

        $assignments = $query->get();

        return response()->json($assignments);
    }

    /**
     * Get all teacher-subject assignments (alias for index)
     */
    public function all(Request $request)
    {
        return $this->index($request);
    }

    /**
     * Get a specific teacher-subject assignment
     */
    public function show($id)
    {
        $assignment = TeacherSubject::with(['teacher', 'subject', 'department', 'semester', 'studyYear'])->find($id);

        if (!$assignment) {
            return response()->json([
                'message' => 'Teacher-subject assignment not found'
            ], 404);
        }

        return response()->json($assignment);
    }

    /**
     * Create a new teacher-subject assignment
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|exists:teachers,id',
            'subject_id' => 'required|exists:subjects,id',
            'department_id' => 'required|exists:departments,id',
            'study_year_id' => 'nullable|exists:study_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'academic_year' => 'nullable|string|max:20',
            'semester' => 'nullable|in:fall,spring,summer',
            'is_primary_teacher' => 'boolean',
            'can_edit_grades' => 'boolean',
            'can_take_attendance' => 'boolean',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Prepare data for creation
        $data = $request->all();
        
        // Set academic_year from study_year if provided
        if ($request->has('study_year_id') && $request->study_year_id) {
            $studyYear = \App\Models\StudyYear::find($request->study_year_id);
            if ($studyYear) {
                $data['academic_year'] = $studyYear->name;
            }
        }

        // Check for duplicate assignment (same teacher, subject, semester, and department)
        $exists = TeacherSubject::where('teacher_id', $request->teacher_id)
            ->where('subject_id', $request->subject_id)
            ->where('semester_id', $request->semester_id)
            ->where('department_id', $request->department_id)
            ->where('is_active', true)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This teacher is already assigned to this subject in this department and semester'
            ], 409);
        }

        $assignment = TeacherSubject::create($data);
        $assignment->load(['teacher', 'subject', 'department', 'semester', 'studyYear']);

        return response()->json($assignment, 201);
    }

    /**
     * Update a teacher-subject assignment
     */
    public function update(Request $request, $id)
    {
        $assignment = TeacherSubject::find($id);

        if (!$assignment) {
            return response()->json([
                'message' => 'Teacher-subject assignment not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'teacher_id' => 'sometimes|exists:teachers,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'department_id' => 'sometimes|exists:departments,id',
            'study_year_id' => 'nullable|exists:study_years,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'academic_year' => 'nullable|string|max:20',
            'semester' => 'nullable|in:fall,spring,summer',
            'is_primary_teacher' => 'boolean',
            'can_edit_grades' => 'boolean',
            'can_take_attendance' => 'boolean',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Prepare data for update
        $data = $request->all();
        
        // Set academic_year from study_year if provided
        if ($request->has('study_year_id') && $request->study_year_id) {
            $studyYear = \App\Models\StudyYear::find($request->study_year_id);
            if ($studyYear) {
                $data['academic_year'] = $studyYear->name;
            }
        }

        $assignment->update($data);
        $assignment->load(['teacher', 'subject', 'department', 'semester', 'studyYear']);

        return response()->json($assignment);
    }

    /**
     * Delete a teacher-subject assignment
     */
    public function destroy($id)
    {
        $assignment = TeacherSubject::find($id);

        if (!$assignment) {
            return response()->json([
                'message' => 'Teacher-subject assignment not found'
            ], 404);
        }

        $assignment->delete();

        return response()->json([
            'message' => 'Teacher-subject assignment deleted successfully'
        ]);
    }
}
