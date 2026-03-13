<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');
        $student = \App\Models\Student::find($id);
        $authUserId = $student?->auth_user_id ?? 'NULL';

        return [
            'name' => 'sometimes|required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'email' => 'sometimes|required|email|unique:students,email,' . $id . '|unique:users,email,' . $authUserId,
            'national_id_passport' => 'sometimes|required|string|unique:students,national_id_passport,' . $id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'specialization_track' => 'nullable|in:fine_arts_media,advertising_design,photography_cinema,multimedia_media',
            'year' => 'nullable|integer|min:1|max:10',
            'status' => 'nullable|in:active,inactive,graduated,suspended',
            'gender' => 'nullable|in:male,female',
            'nationality' => 'nullable|string|max:100',
            'birth_date' => 'nullable|date',
            'enrollment_date' => 'nullable|date',
            'sponsor_name' => 'nullable|string|max:255',
            'sponsor_contact' => 'nullable|string|max:255',
            'academic_history' => 'nullable|string',
            'academic_score' => 'nullable|numeric|min:0|max:100',
            'transcript_file' => 'nullable|string',
            'qr_code' => 'nullable|string',
            'birth_place' => 'nullable|string|max:255',
            'certification_type' => 'nullable|string|max:255',
            'certification_date' => 'nullable|date',
            'certification_school' => 'nullable|string|max:255',
            'certification_specialization' => 'nullable|string|max:255',
            'port_of_entry' => 'nullable|string|max:255',
            'visa_type' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'mother_nationality' => 'nullable|string|max:255',
            'passport_number' => 'nullable|string|max:100',
            'passport_issue_date' => 'nullable|date',
            'passport_expiry_date' => 'nullable|date',
            'passport_place_of_issue' => 'nullable|string|max:255',
        ];
    }
}
