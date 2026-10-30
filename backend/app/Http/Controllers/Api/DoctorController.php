<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\QueueTicket;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Doctor::query()->with(['primaryClinic', 'user']);
        if ($request->filled('clinic_id')) {
            $query->where('primary_clinic_id', $request->query('clinic_id'));
        }
        if ($request->boolean('on_duty')) {
            $query->where('is_on_duty', true);
        }

        $items = $query->get()->map(fn (Doctor $doctor) => $this->toArray($doctor))->values();

        return ApiResponse::data($items);
    }

    /** Doctor-role users that can be linked or reassigned to a clinic (OPD / admin). */
    public function assignableUsers(): JsonResponse
    {
        $linked = Doctor::query()->whereNotNull('user_id')->pluck('user_id')->all();
        $users = User::query()
            ->where('role', 'doctor')
            ->where('status', 'active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'login_masked' => '••••••••',
                'already_linked' => in_array($u->id, $linked, true),
                'doctor_id' => Doctor::query()->where('user_id', $u->id)->value('id'),
                'clinic_id' => Doctor::query()->where('user_id', $u->id)->value('primary_clinic_id'),
            ])
            ->values();

        return ApiResponse::data($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'primary_clinic_id' => ['required', 'exists:clinics,id'],
            'specialty' => ['nullable', 'string', 'max:80'],
            'schedule' => ['nullable', 'string', 'max:120'],
        ]);

        $user = User::query()->findOrFail($data['user_id']);
        if ($user->role !== 'doctor') {
            return ApiResponse::message('Only accounts with the Doctor role can be assigned to a clinic.', 422);
        }

        Clinic::query()->findOrFail($data['primary_clinic_id']);
        $name = str_starts_with($user->name, 'Dr.') ? $user->name : 'Dr. '.$user->name;

        $doctor = Doctor::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $name,
                'specialty' => $data['specialty'] ?? '',
                'primary_clinic_id' => $data['primary_clinic_id'],
                'schedule' => $data['schedule'] ?? 'Mon–Fri 8:00–17:00',
                'status' => 'available',
                'is_on_duty' => true,
                'weekly_json' => [
                    'mon' => true, 'tue' => true, 'wed' => true, 'thu' => true, 'fri' => true, 'sat' => false, 'sun' => false,
                ],
            ]
        );

        return ApiResponse::data($this->toArray($doctor->load('primaryClinic')), 201);
    }

    public function update(Request $request, Doctor $doctor): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'nursing_staff') {
            return ApiResponse::message('Nursing staff cannot change doctor availability.', 403);
        }

        if ($user->role === 'doctor' && (int) $doctor->user_id !== (int) $user->id) {
            return ApiResponse::message('You can only change your own availability.', 403);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string'],
            'specialty' => ['nullable', 'string', 'max:80'],
            'primary_clinic_id' => ['nullable', 'exists:clinics,id'],
            'schedule' => ['nullable', 'string'],
            'weekly' => ['nullable', 'array'],
            'status' => ['nullable', 'in:available,unavailable'],
            'is_on_duty' => ['nullable', 'boolean'],
        ]);

        // Doctors may only toggle their own availability status.
        if ($user->role === 'doctor') {
            $data = array_intersect_key($data, array_flip(['status', 'is_on_duty']));
        }

        if (array_key_exists('weekly', $data)) {
            $data['weekly_json'] = $data['weekly'];
            unset($data['weekly']);
        }

        if (isset($data['status'])) {
            $data['is_on_duty'] = $data['status'] === 'available';
        }

        // Only OPD/admission and administrators may change clinic assignment.
        if (isset($data['primary_clinic_id']) && ! in_array($user->role, ['administrator', 'opd_staff'], true)) {
            unset($data['primary_clinic_id']);
        }

        if ($data === []) {
            return ApiResponse::message('No permitted fields to update.', 422);
        }

        $doctor->update($data);

        return ApiResponse::data($this->toArray($doctor->fresh('primaryClinic')));
    }

    private function toArray(Doctor $doctor): array
    {
        return [
            'id' => $doctor->id,
            'user_id' => $doctor->user_id,
            'name' => $doctor->name,
            'specialty' => $doctor->specialty,
            'clinic' => $doctor->primaryClinic?->name ?? '',
            'primary_clinic_id' => $doctor->primary_clinic_id,
            'schedule' => $doctor->schedule,
            'weekly' => $doctor->weekly_json,
            'status' => $doctor->status,
            'is_on_duty' => (bool) $doctor->is_on_duty,
            'waiting_count' => QueueTicket::query()
                ->where('status', 'waiting')
                ->where(function ($q) use ($doctor) {
                    $q->where('doctor_id', $doctor->id);
                    if ($doctor->primary_clinic_id) {
                        $q->orWhere('clinic_id', $doctor->primary_clinic_id);
                    }
                })
                ->count(),
        ];
    }
}
