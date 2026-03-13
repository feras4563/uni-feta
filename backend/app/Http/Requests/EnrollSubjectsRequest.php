<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnrollSubjectsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject_ids' => 'required|array',
            'subject_ids.*' => 'exists:subjects,id',
            'semester_id' => 'required|exists:semesters,id',
            'study_year_id' => 'required|exists:study_years,id',
            'department_id' => 'required|exists:departments,id',
            'semester_number' => 'required|integer|min:1',
            'specialization_track' => 'nullable|in:fine_arts_media,advertising_design,photography_cinema,multimedia_media',
            'is_paying' => 'nullable|boolean',
        ];
    }
}
