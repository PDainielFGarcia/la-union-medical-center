<?php

namespace App\Http\Requests;

use App\Services\ParkingService;
use Illuminate\Foundation\Http\FormRequest;

class StoreVisitorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'visit_type' => ['nullable', 'in:office,patient'],
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'address' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'regex:/^\d{11}$/'],
            'purpose' => ['required', 'string', 'max:120'],
            'department_id' => ['required_unless:visit_type,patient', 'nullable', 'exists:departments,id'],
            'admission_id' => ['required_if:visit_type,patient', 'nullable', 'integer'],
            'person_to_visit' => ['nullable', 'string', 'max:160'],
            'age' => ['nullable', 'integer', 'min:0', 'max:130'],
            'id_type' => ['nullable', 'string', 'max:80'],
            'id_number' => ['nullable', 'string', 'max:80'],
            ...ParkingService::RULES,
        ];
    }
}
