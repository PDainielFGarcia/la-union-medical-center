<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Support\PasswordRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private ActivityLogger $log) {}

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'login' => ['required', 'string', 'max:80'],
            'password' => ['required', 'string'],
        ]);

        /** @var User|null $user */
        $user = User::query()
            ->with(['department', 'doctor.primaryClinic'])
            ->where('login', $credentials['login'])
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'Account is inactive.'], 403);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->toApiArray(includeLogin: true),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function user(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->loadMissing(['department', 'doctor.primaryClinic']);

        return response()->json($user->toApiArray(includeLogin: true));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'login' => ['required', 'string', 'max:80', 'alpha_dash', 'unique:users,login,'.$user->id],
            'contact_number' => ['nullable', 'string', 'regex:/^\d{11}$/'],
            'password' => PasswordRules::optional(),
        ]);

        $beforeLogin = $user->login;
        $changingPassword = ! empty($data['password']);
        $changingLogin = strtolower($data['login']) !== $user->login;

        $user->applyNormalizedNames($data['first_name'], $data['middle_name'] ?? null, $data['last_name']);
        $user->login = strtolower($data['login']);
        $user->contact_number = $data['contact_number'];
        if ($changingPassword) {
            $user->password = $data['password'];
        }
        $user->save();

        $changes = ['profile updated'];
        if ($changingLogin) {
            $changes[] = "login {$beforeLogin} → {$user->login}";
        }
        if ($changingPassword) {
            $changes[] = 'password changed';
        }

        $this->log->audit(
            $user,
            'Profile Updated',
            "{$user->name} ({$user->login})",
            implode('; ', $changes),
        );

        return response()->json($user->fresh('department')->toApiArray(includeLogin: true));
    }
}
