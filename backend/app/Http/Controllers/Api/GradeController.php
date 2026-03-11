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
        $query = StudentGrade::with('student', 'subject', 'teacher', 'semester');

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

        if ($request->has('semester_id')) {
            $query->where('semester_id', $request->semester_id);
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
            'semester_id' => 'nullable|exists:semesters,id',
            'grade_type' => 'required|in:midterm,final,assignment,quiz,project,participation,homework,classwork',
            'grade_name' => 'required|string',
            'grade_value' => 'required|numeric|min:0',
            'max_grade' => 'required|numeric|min:0.01',
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

        if ($request->grade_value > $request->max_grade) {
            return response()->json(['errors' => ['grade_value' => ['الدرجة لا يمكن أن تتجاوز الدرجة القصوى']]], 422);
        }

        $data = $request->all();
        if (empty($data['semester_id'])) {
            $data['semester_id'] = \App\Models\Semester::where('is_current', true)->value('id');
        }
        $grade = StudentGrade::create($data);
        $grade->load('student', 'subject', 'teacher', 'semester');

        return response()->json($grade, 201);
    }

    public function show($id)
    {
        $grade = StudentGrade::with('student', 'subject', 'teacher', 'semester')->findOrFail($id);
        return response()->json($grade);
    }

    public function update(Request $request, $id)
    {
        $grade = StudentGrade::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'grade_type' => 'sometimes|required|in:midterm,final,assignment,quiz,project,participation,homework,classwork',
            'grade_name' => 'sometimes|required|string',
            'grade_value' => 'sometimes|required|numeric|min:0',
            'max_grade' => 'sometimes|required|numeric|min:0.01',
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

        $finalValue = $request->grade_value ?? $grade->grade_value;
        $finalMax = $request->max_grade ?? $grade->max_grade;
        if ($finalValue > $finalMax) {
            return response()->json(['errors' => ['grade_value' => ['الدرجة لا يمكن أن تتجاوز الدرجة القصوى']]], 422);
        }

        $grade->update($request->only([
            'grade_type', 'grade_name', 'grade_value', 'max_grade', 'weight',
            'grade_date', 'due_date', 'description', 'feedback', 'is_published'
        ]));
        $grade->load('student', 'subject', 'teacher', 'semester');

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
        $grades = StudentGrade::with('subject', 'teacher', 'semester')
            ->where('student_id', $studentId)
            ->where('is_published', true)
            ->orderBy('grade_date', 'desc')
            ->get();

        return response()->json($grades);
    }

    public function bySubject($subjectId)
    {
        $grades = StudentGrade::with('student', 'teacher', 'semester')
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

        $totalValue = $grades->sum('grade_value');
        $totalMax = $grades->sum('max_grade');
        $percentage = $totalMax > 0 ? round(($totalValue / $totalMax) * 100, 1) : 0;
        $letterGrade = $this->getLetterGrade($percentage);
        $gpa = $this->getGPA($percentage);

        return response()->json([
            'grades' => $grades,
            'total_value' => round($totalValue, 2),
            'total_max' => round($totalMax, 2),
            'percentage' => $percentage,
            'letter_grade' => $letterGrade,
            'gpa' => $gpa,
            'status' => $percentage < 50 ? 'failed' : 'passed',
            'needs_retake' => $percentage < 50,
        ]);
    }

    private function getLetterGrade(float $percentage): array
    {
        if ($percentage >= 90) return ['letter' => 'A', 'label' => 'ممتاز', 'label_en' => 'Excellent'];
        if ($percentage >= 80) return ['letter' => 'B', 'label' => 'جيد جداً', 'label_en' => 'Very Good'];
        if ($percentage >= 70) return ['letter' => 'C', 'label' => 'جيد', 'label_en' => 'Good'];
        if ($percentage >= 60) return ['letter' => 'D', 'label' => 'مقبول', 'label_en' => 'Acceptable'];
        if ($percentage >= 50) return ['letter' => 'D-', 'label' => 'مقبول ضعيف', 'label_en' => 'Weak Pass'];
        return ['letter' => 'F', 'label' => 'راسب', 'label_en' => 'Fail'];
    }

    private function getGPA(float $percentage): float
    {
        if ($percentage >= 90) return 4.0;
        if ($percentage >= 85) return 3.7;
        if ($percentage >= 80) return 3.3;
        if ($percentage >= 75) return 3.0;
        if ($percentage >= 70) return 2.7;
        if ($percentage >= 65) return 2.3;
        if ($percentage >= 60) return 2.0;
        if ($percentage >= 55) return 1.7;
        if ($percentage >= 50) return 1.0;
        return 0.0;
    }
}
