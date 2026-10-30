<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\User;
use App\Support\ApiResponse;
use App\Support\PasswordRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()->with('department')->orderBy('last_name')->orderBy('first_name')->get()
            ->map(fn (User $u) => $u->toApiArray())
            ->values();

        return ApiResponse::data($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'login' => ['required', 'string', 'max:80', 'alpha_dash', 'unique:users,login'],
            'contact_number' => ['nullable', 'string', 'regex:/^\d{11}$/'],
            'password' => PasswordRules::optional(),
            'role' => ['required', Rule::in(User::ROLES)],
            'department_id' => ['nullable', 'exists:departments,id'],
            'clinic_id' => ['nullable', 'exists:clinics,id'],
            'specialty' => ['nullable', 'string', 'max:80'],
        ]);

        if ($data['role'] === 'department_secretary' && empty($data['department_id'])) {
            return ApiResponse::message('An office is required for office secretaries.', 422);
        }
        if ($data['role'] === 'doctor' && empty($data['clinic_id'])) {
            return ApiResponse::message('A clinic is required for doctors.', 422);
        }
        if ($data['role'] !== 'department_secretary') {
            $data['department_id'] = null;
        }

        $user = new User([
            'login' => strtolower($data['login']),
            'contact_number' => $data['contact_number'] ?? null,
            'password' => $data['password'] ?? PasswordRules::default(),
            'role' => $data['role'],
            'department_id' => $data['department_id'] ?? null,
            'status' => 'active',
        ]);
        $user->applyNormalizedNames($data['first_name'], $data['middle_name'] ?? null, $data['last_name']);
        $user->save();

        if ($data['role'] === 'doctor') {
            $this->ensureDoctorRecord($user, (int) $data['clinic_id'], $data['specialty'] ?? null);
        }

        if ($data['role'] === 'department_secretary' && $user->department_id) {
            \App\Models\Department::query()->whereKey($user->department_id)
                ->update(['secretary_user_id' => $user->id]);
        }

        return ApiResponse::data($user->load('department')->toApiArray(), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['sometimes', 'string', 'max:80'],
            'login' => ['sometimes', 'string', 'max:80', 'alpha_dash', Rule::unique('users', 'login')->ignore($user->id)],
            'contact_number' => ['nullable', 'string', 'regex:/^\d{11}$/'],
            'password' => PasswordRules::optional(),
            'role' => ['sometimes', Rule::in(User::ROLES)],
            'department_id' => ['nullable', 'exists:departments,id'],
            'clinic_id' => ['nullable', 'exists:clinics,id'],
            'specialty' => ['nullable', 'string', 'max:80'],
            'status' => ['sometimes', 'in:active,inactive'],
            'admin_password' => ['nullable', 'string'],
        ]);

        $changingLogin = isset($data['login']) && strtolower($data['login']) !== $user->login;
        $changingPassword = ! empty($data['password']);
        if ($changingLogin || $changingPassword) {
            if (empty($data['admin_password']) || ! Hash::check($data['admin_password'], $request->user()->password)) {
                return ApiResponse::message('Enter your administrator password to change a login or password.', 422);
            }
        }

        if (isset($data['first_name']) || isset($data['last_name']) || array_key_exists('middle_name', $data)) {
            $user->applyNormalizedNames(
                $data['first_name'] ?? $user->first_name,
                array_key_exists('middle_name', $data) ? $data['middle_name'] : $user->middle_name,
                $data['last_name'] ?? $user->last_name,
            );
        }

        if (isset($data['login'])) {
            $user->login = strtolower($data['login']);
        }
        if (isset($data['contact_number'])) {
            $user->contact_number = $data['contact_number'];
        }
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        if (isset($data['role'])) {
            $user->role = $data['role'];
        }
        if (array_key_exists('department_id', $data)) {
            $user->department_id = ($user->role === 'department_secretary' || ($data['role'] ?? $user->role) === 'department_secretary')
                ? $data['department_id']
                : null;
        }
        if (isset($data['status'])) {
            $user->status = $data['status'];
        }

        $user->save();

        $role = $user->role;
        if ($role === 'doctor' && ! empty($data['clinic_id'])) {
            $this->ensureDoctorRecord($user, (int) $data['clinic_id'], $data['specialty'] ?? null);
        }

        return ApiResponse::data($user->fresh('department')->toApiArray());
    }

    private function ensureDoctorRecord(User $user, int $clinicId, ?string $specialty): void
    {
        Clinic::query()->findOrFail($clinicId);
        $name = 'Dr. '.$user->name;
        $doctor = Doctor::query()->where('user_id', $user->id)->first();
        if ($doctor) {
            $doctor->update([
                'name' => $name,
                'primary_clinic_id' => $clinicId,
                'specialty' => $specialty ?? $doctor->specialty ?? '',
            ]);

            return;
        }

        Doctor::query()->create([
            'user_id' => $user->id,
            'name' => $name,
            'specialty' => $specialty ?? '',
            'primary_clinic_id' => $clinicId,
            'schedule' => 'Mon–Fri 8:00–17:00',
            'status' => 'available',
            'is_on_duty' => true,
            'weekly_json' => [
                'mon' => true, 'tue' => true, 'wed' => true, 'thu' => true, 'fri' => true, 'sat' => false, 'sun' => false,
            ],
        ]);
    }
}
