<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentGrade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GradeController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentGrade::with('student', 'subject', 'teacher');

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

        $query->orderBy('grade_date', 'desc');

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'grade_type' => 'required|in:midterm,final,assignment,quiz,project,participation,homework,classwork',
            'grade_name' => 'required|string',
            'grade_value' => 'required|numeric|min:0',
            'max_grade' => 'required|numeric|min:0',
            'weight' => 'nullable|numeric|min:0|max:1',
            'grade_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string',
            'feedback' => 'nullable|string',
            'is_published' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $grade = StudentGrade::create($request->all());
        $grade->load('student', 'subject', 'teacher');

        return response()->json($grade, 201);
    }

    public function show($id)
    {
        $grade = StudentGrade::with('student', 'subject', 'teacher')->findOrFail($id);
        return response()->json($grade);
    }

    public function update(Request $request, $id)
    {
        $grade = StudentGrade::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'grade_type' => 'sometimes|required|in:midterm,final,assignment,quiz,project,participation,homework,classwork',
            'grade_name' => 'sometimes|required|string',
            'grade_value' => 'sometimes|required|numeric|min:0',
            'max_grade' => 'sometimes|required|numeric|min:0',
            'weight' => 'nullable|numeric|min:0|max:1',
            'grade_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string',
            'feedback' => 'nullable|string',
            'is_published' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $grade->update($request->all());
        $grade->load('student', 'subject', 'teacher');

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
        $grades = StudentGrade::with('subject', 'teacher')
            ->where('student_id', $studentId)
            ->where('is_published', true)
            ->orderBy('grade_date', 'desc')
            ->get();

        return response()->json($grades);
    }

    public function bySubject($subjectId)
    {
        $grades = StudentGrade::with('student', 'teacher')
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

        $average = $grades->avg('grade_value');
        $total = $grades->sum('grade_value');

        return response()->json([
            'grades' => $grades,
            'average' => round($average, 2),
            'total' => round($total, 2),
        ]);
    }
}
