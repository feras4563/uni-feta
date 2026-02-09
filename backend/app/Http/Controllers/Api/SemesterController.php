<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SemesterController extends Controller
{
    public function index(Request $request)
    {
        $query = Semester::with('studyYear:id,name,name_en');

        if ($request->has('study_year_id')) {
            $query->where('study_year_id', $request->study_year_id);
        }

        if ($request->has('is_current')) {
            $query->where('is_current', $request->boolean('is_current'));
        }

        $query->orderBy('start_date', 'desc');

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'name_en' => 'nullable|string',
            'code' => 'required|string',
            'study_year_id' => 'required|exists:study_years,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $semester = Semester::create($request->all());
        $semester->load('studyYear');
        return response()->json($semester, 201);
    }

    public function show($id)
    {
        $semester = Semester::with('studyYear', 'studentGroups', 'departmentSemesterSubjects')->findOrFail($id);
        return response()->json($semester);
    }

    public function update(Request $request, $id)
    {
        $semester = Semester::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string',
            'name_en' => 'nullable|string',
            'code' => 'sometimes|required|string',
            'study_year_id' => 'sometimes|required|exists:study_years,id',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'is_current' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $semester->update($request->all());
        $semester->load('studyYear');
        return response()->json($semester);
    }

    public function destroy($id)
    {
        $semester = Semester::findOrFail($id);
        $semester->delete();
        return response()->json(['message' => 'Semester deleted successfully'], 200);
    }

    public function current()
    {
        $current = Semester::with('studyYear')->where('is_current', true)->first();
        return response()->json($current);
    }

    public function setCurrent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'semester_id' => 'required|exists:semesters,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Set all semesters to not current
        Semester::query()->update(['is_current' => false]);

        // Set the specified semester as current
        $semester = Semester::with('studyYear')->findOrFail($request->semester_id);
        $semester->update(['is_current' => true]);

        return response()->json([
            'message' => 'Current semester updated successfully',
            'semester' => $semester
        ]);
    }

    /**
     * Get all students registered in a specific semester
     */
    public function getRegisteredStudents(Request $request, $id)
    {
        $query = \App\Models\StudentSemesterRegistration::with([
            'student:id,name,email,national_id_passport,phone',
            'department:id,name'
        ])
        ->where('semester_id', $id);

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $registrations = $query->get();

        $students = $registrations->map(function ($reg) {
            return [
                'id' => $reg->student->id ?? null,
                'name' => $reg->student->name ?? '-',
                'email' => $reg->student->email ?? '-',
                'national_id_passport' => $reg->student->national_id_passport ?? '-',
                'phone' => $reg->student->phone ?? '-',
                'department' => $reg->department,
                'registration_id' => $reg->id,
                'group_id' => $reg->group_id,
                'has_group' => !is_null($reg->group_id),
            ];
        })->filter(fn($s) => $s['id'] !== null)->values();

        return response()->json($students);
    }
}
