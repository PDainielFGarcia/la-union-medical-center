<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\ActivityLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    private const EDITABLE = ['hospital_name', 'minor_age_threshold', 'backup_retention_days'];

    public function __construct(private ActivityLogger $log) {}

    public function show(): JsonResponse
    {
        return ApiResponse::data($this->settingsMap());
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'hospital_name' => ['sometimes', 'string', 'max:160'],
            'minor_age_threshold.years' => ['sometimes', 'integer', 'min:1', 'max:21'],
            'backup_retention_days.days' => ['sometimes', 'integer', 'min:1', 'max:365'],
        ]);

        foreach ($request->only(self::EDITABLE) as $key => $value) {
            Setting::query()->updateOrCreate(
                ['setting_key' => $key],
                ['setting_value' => $value, 'updated_at' => now()]
            );
        }
        $this->log->audit($request->user(), 'Settings Updated', implode(', ', array_keys($request->only(self::EDITABLE))));

        return ApiResponse::data($this->settingsMap());
    }

    private function settingsMap(): array
    {
        return Setting::query()->get()->mapWithKeys(fn (Setting $s) => [$s->setting_key => $s->setting_value])->all();
    }
}
