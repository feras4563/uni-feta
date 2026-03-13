<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
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
        ];
    }
}
