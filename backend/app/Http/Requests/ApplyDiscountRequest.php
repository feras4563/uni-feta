<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApplyDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'discount_type' => 'required|in:none,percentage,fixed,full_waiver',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_reason' => 'nullable|string|max:500',
        ];
    }
}
