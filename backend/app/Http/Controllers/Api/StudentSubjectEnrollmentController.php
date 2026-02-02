<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentSubjectEnrollment;
use Illuminate\Http\Request;

class StudentSubjectEnrollmentController extends Controller
{
    /**
     * Get all student subject enrollments
     */
    public function index(Request $request)
    {
        $query = StudentSubjectEnrollment::with([
            'student:id,name,email,national_id_passport',
            'subject:id,name,name_en,code,credits,cost_per_credit',
            'semester:id,name,name_en,code',
            'studyYear:id,name,name_en',
            'department:id,name,name_en'
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

        $enrollments = $query->orderBy('enrollment_date', 'desc')->get();

        return response()->json($enrollments);
    }

    /**
     * Get a single student subject enrollment by ID
     */
    public function show($id)
    {
        $enrollment = StudentSubjectEnrollment::with([
            'student:id,name,name_en,email,national_id_passport,phone,birth_date,gender,address,status',
            'subject:id,name,name_en,code,credits,cost_per_credit',
            'semester:id,name,name_en,code',
            'studyYear:id,name,name_en',
            'department:id,name,name_en'
        ])->findOrFail($id);

        return response()->json($enrollment);
    }
}
