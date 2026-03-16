<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'grade_type' => 'sometimes|required|in:classwork,midterm,final',
            'grade_name' => 'sometimes|required|string',
            'grade_value' => 'sometimes|required|numeric|min:0',
            'max_grade' => 'sometimes|required|numeric|min:0.01',
            'weight' => 'nullable|numeric|min:0|max:1',
            'grade_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string',
            'feedback' => 'nullable|string',
            'is_published' => 'nullable|boolean',
        ];
    }
}
