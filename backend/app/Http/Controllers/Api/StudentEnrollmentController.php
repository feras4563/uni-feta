<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentSemesterRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentEnrollmentController extends Controller
{
    /**
     * Get all student enrollments
     */
    public function index(Request $request)
    {
        $query = StudentSemesterRegistration::with([
            'student',
            'semester',
            'studyYear',
            'department',
            'group'
        ]);

        // Apply filters if provided
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $enrollments = $query->orderBy('registration_date', 'desc')->get();

        return response()->json($enrollments);
    }

    /**
     * Get a specific enrollment by ID
     */
    public function show($id)
    {
        $enrollment = StudentSemesterRegistration::with([
            'student',
            'semester',
            'studyYear',
            'department',
            'group'
        ])->find($id);

        if (!$enrollment) {
            return response()->json([
                'message' => 'Enrollment not found'
            ], 404);
        }

        return response()->json($enrollment);
    }

    /**
     * Get enrollments for a specific student
     */
    public function byStudent($studentId)
    {
        $enrollments = StudentSemesterRegistration::with([
            'semester',
            'studyYear',
            'department',
            'group'
        ])
        ->where('student_id', $studentId)
        ->orderBy('registration_date', 'desc')
        ->get();

        return response()->json($enrollments);
    }

    /**
     * Create a new enrollment
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'semester_id' => 'required|exists:semesters,id',
            'study_year_id' => 'required|exists:study_years,id',
            'department_id' => 'required|exists:departments,id',
            'semester_number' => 'required|integer|min:1',
            'registration_date' => 'required|date',
            'status' => 'required|in:active,completed,withdrawn,suspended',
            'tuition_paid' => 'boolean',
            'group_id' => 'nullable|exists:student_groups,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $enrollment = StudentSemesterRegistration::create($request->all());

        return response()->json($enrollment, 201);
    }

    /**
     * Update an enrollment
     */
    public function update(Request $request, $id)
    {
        $enrollment = StudentSemesterRegistration::find($id);

        if (!$enrollment) {
            return response()->json([
                'message' => 'Enrollment not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'semester_id' => 'sometimes|exists:semesters,id',
            'study_year_id' => 'sometimes|exists:study_years,id',
            'department_id' => 'sometimes|exists:departments,id',
            'semester_number' => 'sometimes|integer|min:1',
            'registration_date' => 'sometimes|date',
            'status' => 'sometimes|in:active,completed,withdrawn,suspended',
            'tuition_paid' => 'boolean',
            'group_id' => 'nullable|exists:student_groups,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $enrollment->update($request->all());

        return response()->json($enrollment);
    }

    /**
     * Delete an enrollment
     */
    public function destroy($id)
    {
        $enrollment = StudentSemesterRegistration::find($id);

        if (!$enrollment) {
            return response()->json([
                'message' => 'Enrollment not found'
            ], 404);
        }

        $enrollment->delete();

        return response()->json([
            'message' => 'Enrollment deleted successfully'
        ]);
    }
}
