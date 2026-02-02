<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_en' => $this->name_en,
            'email' => $this->email,
            'national_id_passport' => $this->national_id_passport,
            'phone' => $this->phone,
            'address' => $this->address,
            'department_id' => $this->department_id,
            'year' => $this->year,
            'status' => $this->status,
            'gender' => $this->gender,
            'nationality' => $this->nationality,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'enrollment_date' => $this->enrollment_date?->format('Y-m-d'),
            'sponsor_name' => $this->sponsor_name,
            'sponsor_contact' => $this->sponsor_contact,
            'academic_history' => $this->academic_history,
            'academic_score' => $this->academic_score,
            'transcript_file' => $this->transcript_file,
            'qr_code' => $this->qr_code,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'departments' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                    'name_en' => $this->department->name_en,
                ];
            }),
        ];
    }
}
