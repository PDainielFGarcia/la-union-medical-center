<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Clinic;
use App\Models\Guardian;
use App\Models\OpdEncounter;
use App\Models\Patient;
use App\Models\QueueTicket;
use App\Models\Setting;
use App\Models\TriageRecord;
use App\Services\ActivityLogger;
use App\Services\ParkingService;
use App\Support\ApiResponse;
use App\Support\NameNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller
{
    public function __construct(private ActivityLogger $log, private ParkingService $parking) {}

    public function index(Request $request): JsonResponse
    {
        $query = Patient::query()->latest('id');
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhereRaw("CONCAT_WS(' ', first_name, middle_name, last_name) LIKE ?", ["%{$q}%"])
                    ->orWhere('patient_id', 'like', "%{$q}%")
                    ->orWhere('philhealth_number', 'like', "%{$q}%")
                    ->orWhere('contact_number', 'like', "%{$q}%");
            });
        }

        return ApiResponse::data($query->limit(500)->get()->map->toApiArray()->values());
    }

    public function show(Patient $patient): JsonResponse
    {
        $payload = $patient->toApiArray();
        $active = Admission::query()
            ->where('patient_id', $patient->id)
            ->whereIn('status', ['waiting_for_bed', 'admitted'])
            ->latest('id')
            ->first();
        $payload['current_admission'] = $active?->toApiArray();
        $payload['admissions'] = Admission::query()
            ->where('patient_id', $patient->id)
            ->latest('id')
            ->limit(50)
            ->get()
            ->map->toApiArray()
            ->values();
        $visits = QueueTicket::query()
            ->with(['clinic', 'doctor', 'encounter.triageRecord'])
            ->where('patient_id', $patient->id)
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(function (QueueTicket $item) {
                $triage = $item->encounter?->triageRecord;
                $positives = $triage
                    ? collect(TriageRecord::SYMPTOMS)->filter(fn ($s) => (bool) $triage->{$s})->values()->all()
                    : [];

                return [
                    'id' => $item->id,
                    'queue_number' => $item->queue_number,
                    'queue_date' => $item->queue_date?->toDateString(),
                    'clinic' => $item->clinic?->name,
                    'doctor_name' => $item->doctor?->name,
                    'reason' => $item->encounter?->chief_complaint,
                    'status' => $item->status,
                    'time' => $item->created_at?->format('g:i A'),
                    'screened' => (bool) $triage,
                    'screening' => $triage ? [
                        'symptoms' => $positives,
                        'symptom_duration' => $triage->symptom_duration,
                        'covid_exposure' => (bool) $triage->covid_exposure,
                        'notes' => $triage->notes,
                        'screened_at' => $triage->screened_at?->toIso8601String(),
                    ] : null,
                ];
            })
            ->values();
        $payload['hospital_visits'] = $visits;
        $payload['opd_visits'] = $visits; // backward-compatible alias
        $payload['guardians'] = $patient->guardians()->map(fn (Guardian $g) => [
            'id' => $g->id,
            'full_name' => $g->full_name,
            'relationship' => $g->relationship,
            'contact_number' => $g->contact_number,
        ])->values();

        return ApiResponse::data($payload);
    }

    public function update(Request $request, Patient $patient): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:80'],
            'last_name' => ['sometimes', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'birthday' => ['sometimes', 'date', 'before_or_equal:today'],
            'sex' => ['sometimes', 'string', 'max:20'],
            'complete_address' => ['sometimes', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'regex:/^\d{11}$/'],
            'civil_status' => ['nullable', 'string', 'max:40'],
            'nationality' => ['nullable', 'string', 'max:80'],
            'religion' => ['nullable', 'string', 'max:80'],
            'philhealth_number' => ['nullable', 'string', 'max:40'],
            'spouse_name' => ['nullable', 'string', 'max:160'],
            'father_name' => ['nullable', 'string', 'max:160'],
            'mother_name' => ['nullable', 'string', 'max:160'],
        ]);

        foreach (['first_name', 'last_name', 'middle_name', 'spouse_name', 'father_name', 'mother_name'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== null && $data[$field] !== '') {
                $data[$field] = NameNormalizer::personName($data[$field]);
            }
        }

        $patient->update($data);
        $this->log->audit(
            $request->user(),
            'Patient Updated',
            "{$patient->patient_id} - {$patient->fresh()->fullName()}",
            'Patient information updated'
        );

        return ApiResponse::data($patient->fresh()->toApiArray());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'birthday' => ['nullable', 'date', 'before_or_equal:today'],
            'date_of_birth' => ['nullable', 'date', 'before_or_equal:today'],
            'sex' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'string', 'max:20'],
            'complete_address' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'regex:/^\d{11}$/'],
            'civil_status' => ['nullable', 'string', 'max:40'],
            'nationality' => ['nullable', 'string', 'max:80'],
            'religion' => ['nullable', 'string', 'max:80'],
            'philhealth_number' => ['nullable', 'string', 'max:40'],
            'spouse_name' => ['nullable', 'string', 'max:160'],
            'father_name' => ['nullable', 'string', 'max:160'],
            'mother_name' => ['nullable', 'string', 'max:160'],
            'id_type' => ['nullable', 'string', 'max:80'],
            'id_number' => ['nullable', 'string', 'max:80'],
            'guardian.full_name' => ['nullable', 'string', 'max:160'],
            'guardian.relationship' => ['nullable', 'string', 'max:80'],
            'guardian.contact_number' => ['nullable', 'string', 'regex:/^\d{11}$/'],
        ]);

        $birthday = $data['birthday'] ?? $data['date_of_birth'] ?? null;
        $sex = $data['sex'] ?? $data['gender'] ?? null;
        $address = $data['complete_address'] ?? $data['address'] ?? null;

        if (! $birthday || ! $sex || ! $address) {
            return ApiResponse::message('Birthday, sex, and complete address are required.', 422);
        }

        $age = \Illuminate\Support\Carbon::parse($birthday)->age;
        $minorAge = Setting::get('minor_age_threshold')['years'] ?? 18;
        $isMinor = $age < $minorAge;
        if ($isMinor && empty($data['guardian']['full_name'])) {
            return ApiResponse::message("Patients under {$minorAge} must have a guardian recorded.", 422);
        }
        if ($isMinor && empty($data['guardian']['relationship'])) {
            return ApiResponse::message('Guardian relationship is required for minor patients.', 422);
        }
        if ($isMinor && empty($data['guardian']['contact_number'])) {
            return ApiResponse::message('Guardian contact number (11 digits) is required for minor patients.', 422);
        }

        $patient = DB::transaction(function () use ($data, $birthday, $sex, $address, $isMinor) {
            $patient = Patient::query()->create([
                'patient_id' => $this->nextPatientId(),
                'first_name' => NameNormalizer::personName($data['first_name']),
                'last_name' => NameNormalizer::personName($data['last_name']),
                'middle_name' => ! empty($data['middle_name']) ? NameNormalizer::personName($data['middle_name']) : null,
                'birthday' => $birthday,
                'sex' => $sex,
                'complete_address' => $address,
                'contact_number' => $data['contact_number'] ?? null,
                'civil_status' => $data['civil_status'] ?? null,
                'nationality' => $data['nationality'] ?? 'Filipino',
                'religion' => $data['religion'] ?? null,
                'philhealth_number' => $data['philhealth_number'] ?? null,
                'spouse_name' => isset($data['spouse_name']) ? NameNormalizer::personName($data['spouse_name']) : null,
                'father_name' => isset($data['father_name']) ? NameNormalizer::personName($data['father_name']) : null,
                'mother_name' => isset($data['mother_name']) ? NameNormalizer::personName($data['mother_name']) : null,
                'status' => 'active',
            ]);

            if ($isMinor) {
                $guardian = Guardian::query()->create([
                    'full_name' => NameNormalizer::personName($data['guardian']['full_name']),
                    'relationship' => $data['guardian']['relationship'],
                    'contact_number' => $data['guardian']['contact_number'],
                ]);
                $guardian->link('patient', $patient->id);
            }

            return $patient;
        });

        $this->log->audit($request->user(), 'Patient Registration', "{$patient->patient_id} - {$patient->fullName()}", 'New patient registered');

        return ApiResponse::data($patient->toApiArray(), 201);
    }

    public function opdList(Request $request): JsonResponse
    {
        $query = QueueTicket::query()->with(['doctor', 'clinic', 'patient', 'encounter.triageRecord'])->latest('id');

        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('clinic_id')) {
            $query->where('clinic_id', $request->query('clinic_id'));
        }
        $query->whereDate('queue_date', $request->query('date', today()->toDateString()));
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('patient_name', 'like', "%{$q}%")
                    ->orWhere('queue_number', 'like', "%{$q}%");
            });
        }

        $items = $query->get()->map(fn (QueueTicket $item) => [
            'id' => $item->id,
            'queue_number' => $item->queue_number,
            'opd_encounter_id' => $item->opd_encounter_id,
            'patient_id' => $item->patient_id,
            'patient_name' => $item->patient_name,
            'patient_number' => $item->patient?->patient_id,
            'age' => $item->patient?->birthday?->age,
            'clinic' => $item->clinic?->name,
            'clinic_id' => $item->clinic_id,
            'doctor_id' => $item->doctor_id,
            'doctor_name' => $item->doctor?->name,
            'reason' => $item->encounter?->chief_complaint,
            'triaged' => (bool) $item->encounter?->triageRecord,
            'status' => $item->status,
            'time' => $item->created_at?->format('g:i A'),
        ]);

        return ApiResponse::data($items->values());
    }

    public function registerOpd(Request $request): JsonResponse
    {
        $symptomRules = collect(TriageRecord::SYMPTOMS)->mapWithKeys(fn ($s) => [$s => ['boolean']])->all();
        $data = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'clinic_id' => ['required', 'exists:clinics,id'],
            'reason' => ['nullable', 'string', 'max:255'],
            'registration_type' => ['nullable', 'in:new,existing'],
            'symptom_duration' => ['nullable', 'string', 'max:80'],
            'covid_exposure' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
            ...$symptomRules,
            ...ParkingService::RULES,
        ]);

        $clinic = Clinic::query()->findOrFail($data['clinic_id']);
        $patient = Patient::query()->findOrFail($data['patient_id']);

        $alreadyQueued = QueueTicket::query()
            ->where('patient_id', $patient->id)
            ->where('clinic_id', $clinic->id)
            ->whereDate('queue_date', today())
            ->whereIn('status', ['waiting', 'called', 'serving'])
            ->exists();
        if ($alreadyQueued) {
            return ApiResponse::message('This patient is already in the queue for this clinic today.', 409);
        }

        $ticket = DB::transaction(function () use ($request, $data, $clinic, $patient) {
            $encounter = OpdEncounter::query()->create([
                'encounter_number' => 'ENC-'.now()->format('Ymd').'-'.str_pad((string) (OpdEncounter::query()->whereDate('created_at', today())->count() + 1), 4, '0', STR_PAD_LEFT),
                'patient_id' => $patient->id,
                'clinic_id' => $clinic->id,
                'registration_type' => $data['registration_type'] ?? 'existing',
                'chief_complaint' => $data['reason'] ?? null,
                'status' => 'triaged',
                'registered_by' => $request->user()->id,
            ]);

            $triagePayload = collect(TriageRecord::SYMPTOMS)
                ->mapWithKeys(fn ($s) => [$s => (bool) ($data[$s] ?? false)])
                ->all();
            TriageRecord::query()->create($triagePayload + [
                'opd_encounter_id' => $encounter->id,
                'nurse_user_id' => $request->user()->id,
                'symptom_duration' => $data['symptom_duration'] ?? null,
                'covid_exposure' => (bool) ($data['covid_exposure'] ?? false),
                'notes' => $data['notes'] ?? null,
                'screened_at' => now(),
            ]);

            if (! empty($data['vehicle']['plate_number'])) {
                $this->parking->park($data['vehicle'], 'patient', $patient->fullName(), $request->user(), patientId: $patient->id);
            }

            $count = QueueTicket::query()->where('clinic_id', $clinic->id)->whereDate('queue_date', today())->count() + 1;

            return QueueTicket::query()->create([
                'queue_number' => $clinic->code.'-'.str_pad((string) $count, 3, '0', STR_PAD_LEFT),
                'queue_date' => today(),
                'opd_encounter_id' => $encounter->id,
                'clinic_id' => $clinic->id,
                'patient_id' => $patient->id,
                'doctor_id' => null,
                'patient_name' => $patient->fullName(),
                'status' => 'waiting',
            ]);
        });

        $ticket->load(['clinic']);
        $this->log->audit($request->user(), 'Hospital Visit Registration', "{$ticket->queue_number} - {$ticket->patient_name}", "Queued at {$clinic->name} with initial screening");
        $this->log->notifyRole(
            'nursing_staff',
            'New hospital visit',
            "{$ticket->queue_number} queued at {$clinic->name} with initial screening.",
            '/screening'
        );
        $this->log->notifyRole(
            'doctor',
            'New hospital visit',
            "{$ticket->queue_number} waiting at {$clinic->name}.",
            '/clinic-queues'
        );

        return ApiResponse::data([
            'id' => $ticket->id,
            'queue_number' => $ticket->queue_number,
            'opd_encounter_id' => $ticket->opd_encounter_id,
            'patient_name' => $ticket->patient_name,
            'patient_id' => $ticket->patient_id,
            'doctor_id' => null,
            'doctor_name' => null,
            'clinic' => $ticket->clinic?->name,
            'clinic_id' => $ticket->clinic_id,
            'reason' => $data['reason'] ?? 'Consultation',
            'time' => $ticket->created_at?->format('g:i A'),
            'status' => $ticket->status,
            'screened' => true,
        ], 201);
    }

    public function triage(Request $request, OpdEncounter $opdEncounter): JsonResponse
    {
        $rules = collect(TriageRecord::SYMPTOMS)->mapWithKeys(fn ($s) => [$s => ['boolean']])->all();
        $data = $request->validate($rules + [
            'symptom_duration' => ['nullable', 'string', 'max:80'],
            'covid_exposure' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
            'doctor_id' => ['nullable', 'exists:doctors,id'],
        ]);

        $doctorId = $data['doctor_id'] ?? null;
        unset($data['doctor_id']);

        $record = TriageRecord::query()->updateOrCreate(
            ['opd_encounter_id' => $opdEncounter->id],
            $data + ['nurse_user_id' => $request->user()->id, 'screened_at' => now()]
        );

        $opdEncounter->update(['status' => 'triaged']);

        if ($doctorId) {
            $this->assignDoctor($opdEncounter->id, $doctorId, $request->user()->id);
            QueueTicket::query()->where('opd_encounter_id', $opdEncounter->id)->update(['doctor_id' => $doctorId]);
        }

        $this->log->audit($request->user(), 'Triage Recorded', $opdEncounter->encounter_number, 'Initial symptom checklist');

        return ApiResponse::data($record);
    }

    private function assignDoctor(int $encounterId, int $doctorId, int $userId): void
    {
        DB::table('doctor_assignments')->where('opd_encounter_id', $encounterId)->update(['is_current' => false]);
        DB::table('doctor_assignments')->insert([
            'opd_encounter_id' => $encounterId,
            'doctor_id' => $doctorId,
            'assigned_by' => $userId,
            'assigned_at' => now(),
            'is_current' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function nextPatientId(): string
    {
        $last = Patient::query()->where('patient_id', 'like', 'LUMC-%')->lockForUpdate()->orderByDesc('id')->value('patient_id');
        $next = $last ? ((int) substr($last, 5)) + 1 : 1;

        return 'LUMC-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
