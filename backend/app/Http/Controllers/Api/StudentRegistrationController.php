<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentSemesterRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentRegistrationController extends Controller
{
    /**
     * Get all student registrations
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

        // Apply filters
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

        $registrations = $query->orderBy('registration_date', 'desc')->get();

        return response()->json($registrations);
    }

    /**
     * Get a specific registration
     */
    public function show($id)
    {
        $registration = StudentSemesterRegistration::with([
            'student',
            'semester',
            'studyYear',
            'department',
            'group'
        ])->find($id);

        if (!$registration) {
            return response()->json([
                'message' => 'Registration not found'
            ], 404);
        }

        return response()->json($registration);
    }

    /**
     * Register a student for a semester
     */
    public function register(Request $request)
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

        // Check if student is already registered for this semester
        $exists = StudentSemesterRegistration::where('student_id', $request->student_id)
            ->where('semester_id', $request->semester_id)
            ->where('status', 'active')
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Student is already registered for this semester'
            ], 409);
        }

        $registration = StudentSemesterRegistration::create($request->all());
        $registration->load(['student', 'semester', 'studyYear', 'department', 'group']);

        return response()->json($registration, 201);
    }

    /**
     * Create a new registration
     */
    public function store(Request $request)
    {
        return $this->register($request);
    }

    /**
     * Update a registration
     */
    public function update(Request $request, $id)
    {
        $registration = StudentSemesterRegistration::find($id);

        if (!$registration) {
            return response()->json([
                'message' => 'Registration not found'
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

        $registration->update($request->all());
        $registration->load(['student', 'semester', 'studyYear', 'department', 'group']);

        return response()->json($registration);
    }

    /**
     * Delete a registration
     */
    public function destroy($id)
    {
        $registration = StudentSemesterRegistration::find($id);

        if (!$registration) {
            return response()->json([
                'message' => 'Registration not found'
            ], 404);
        }

        $registration->delete();

        return response()->json([
            'message' => 'Registration deleted successfully'
        ]);
    }
}
