<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Bed;
use App\Models\BedEvent;
use App\Models\Patient;
use App\Models\Setting;
use App\Services\ActivityLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdmissionController extends Controller
{
    public function __construct(private ActivityLogger $log) {}

    public function index(Request $request): JsonResponse
    {
        $query = Admission::query()->with(['patient', 'bed.ward'])->latest('id');
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->query('patient_id'));
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->query('date'));
        }

        return ApiResponse::data($query->limit(500)->get()->map->toApiArray()->values());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id' => ['required', 'exists:patients,id'],
            'opd_encounter_id' => ['nullable', 'exists:opd_encounters,id'],
            'priority' => ['nullable', 'in:Normal,Urgent,Emergency'],
            'reason' => ['nullable', 'string', 'max:255'],
            'bed_id' => ['nullable', 'exists:beds,id'],
        ]);

        $alreadyAdmitted = Admission::query()
            ->where('patient_id', $data['patient_id'])
            ->whereIn('status', ['waiting_for_bed', 'admitted'])
            ->exists();
        if ($alreadyAdmitted) {
            return ApiResponse::message('This patient already has an active admission.', 409);
        }

        $patient = Patient::query()->find($data['patient_id']);
        $minorAge = (int) (Setting::get('minor_age_threshold')['years'] ?? 18);
        if ($patient?->birthday && $patient->birthday->age < $minorAge) {
            $hasGuardian = DB::table('guardianables')
                ->where('guardianable_type', 'patient')
                ->where('guardianable_id', $patient->id)
                ->exists();
            if (! $hasGuardian) {
                return ApiResponse::message('A linked guardian is required to admit a minor patient.', 422);
            }
        }

        $bed = ! empty($data['bed_id']) ? Bed::query()->find($data['bed_id']) : null;
        if ($bed && ! in_array($bed->status, ['available', 'reserved'], true)) {
            return ApiResponse::message('Selected bed is not available.', 422);
        }

        $admission = Admission::query()->create([
            'admission_number' => $this->nextNumber(),
            'patient_id' => $data['patient_id'],
            'opd_encounter_id' => $data['opd_encounter_id'] ?? null,
            'priority' => $data['priority'] ?? 'Normal',
            'reason' => $data['reason'] ?? null,
            'status' => 'waiting_for_bed',
        ]);
        $this->log->audit($request->user(), 'Admission Created', $admission->admission_number, 'Waiting for bed');

        if ($bed) {
            $this->placeInBed($request, $admission, $bed);
        }

        return ApiResponse::data($admission->fresh()->toApiArray(), 201);
    }

    public function assign(Request $request, Admission $admission): JsonResponse
    {
        $data = $request->validate([
            'bed_id' => ['nullable', 'exists:beds,id'],
            'bed_number' => ['nullable', 'string'],
        ]);

        if (! in_array($admission->status, ['waiting_for_bed', 'admitted'], true)) {
            return ApiResponse::message('Discharged admissions cannot be assigned a bed.', 422);
        }

        $bed = ! empty($data['bed_id'])
            ? Bed::query()->find($data['bed_id'])
            : Bed::query()->where('bed_number', $data['bed_number'] ?? '')->first();

        return $this->placeInBed($request, $admission, $bed)
            ?? ApiResponse::data($admission->fresh()->toApiArray());
    }

    public function discharge(Request $request, Admission $admission): JsonResponse
    {
        $data = $request->validate(['discharge_notes' => ['nullable', 'string', 'max:255']]);

        if ($admission->status === 'discharged') {
            return ApiResponse::message('Patient is already discharged.', 422);
        }

        DB::transaction(function () use ($request, $admission, $data) {
            $admission->update([
                'previous_bed_id' => null,
                'previous_status' => 'admitted',
                'undo_used' => false,
                'status' => 'discharged',
                'discharged_at' => now(),
                'discharged_by' => $request->user()->id,
                'discharge_notes' => $data['discharge_notes'] ?? null,
            ]);
            if ($admission->bed_id) {
                $this->releaseBed($request, $admission, Bed::query()->find($admission->bed_id), 'Patient discharged');
            }
        });

        $this->log->audit($request->user(), 'Patient Discharged', $admission->admission_number, $data['discharge_notes'] ?? '');

        return ApiResponse::data($admission->fresh()->toApiArray());
    }

    public function undo(Request $request, Admission $admission): JsonResponse
    {
        if ($admission->undo_used) {
            return ApiResponse::message('Undo has already been used for this admission.', 422);
        }

        if ($admission->status === 'discharged') {
            return $this->undoDischarge($request, $admission);
        }
        if ($admission->status === 'admitted' && $admission->previous_bed_id) {
            return $this->undoTransfer($request, $admission);
        }
        if ($admission->status === 'admitted' && $admission->previous_status === 'waiting_for_bed') {
            return $this->undoAssign($request, $admission);
        }

        return ApiResponse::message('There is nothing to undo for this admission.', 422);
    }

    private function undoDischarge(Request $request, Admission $admission): JsonResponse
    {
        $otherActive = Admission::query()
            ->where('patient_id', $admission->patient_id)
            ->whereKeyNot($admission->id)
            ->whereIn('status', ['waiting_for_bed', 'admitted'])
            ->exists();
        if ($otherActive) {
            return ApiResponse::message('This patient already has another active admission.', 409);
        }

        $bed = $admission->bed_id ? Bed::query()->find($admission->bed_id) : null;
        if ($bed && ! in_array($bed->status, ['available', 'cleaning'], true)) {
            return ApiResponse::message('The previous bed is no longer free, so the discharge cannot be undone.', 422);
        }

        DB::transaction(function () use ($request, $admission, $bed) {
            if ($bed) {
                $bed->update(['status' => 'occupied', 'current_patient_id' => $admission->patient_id, 'reserved_for' => null]);
                BedEvent::query()->create([
                    'bed_id' => $bed->id,
                    'event_type' => 'undo_discharge',
                    'patient_id' => $admission->patient_id,
                    'admission_id' => $admission->id,
                    'performed_by' => $request->user()->id,
                    'notes' => 'Discharge undone',
                ]);
            }
            $admission->update([
                'status' => $bed ? 'admitted' : 'waiting_for_bed',
                'discharged_at' => null,
                'discharged_by' => null,
                'discharge_notes' => null,
                'undo_used' => true,
            ]);
        });

        $this->log->audit($request->user(), 'Discharge Undone', $admission->admission_number, $bed?->bed_number ?? '');

        return ApiResponse::data($admission->fresh()->toApiArray());
    }

    private function undoTransfer(Request $request, Admission $admission): JsonResponse
    {
        $previous = Bed::query()->find($admission->previous_bed_id);
        if (! $previous || ! in_array($previous->status, ['available', 'cleaning'], true)) {
            return ApiResponse::message('The previous bed is no longer free, so the transfer cannot be undone.', 422);
        }
        $current = $admission->bed_id ? Bed::query()->find($admission->bed_id) : null;

        DB::transaction(function () use ($request, $admission, $previous, $current) {
            if ($current) {
                $current->update(['status' => 'available', 'current_patient_id' => null]);
                BedEvent::query()->create([
                    'bed_id' => $current->id,
                    'event_type' => 'undo_transfer',
                    'patient_id' => $admission->patient_id,
                    'admission_id' => $admission->id,
                    'performed_by' => $request->user()->id,
                    'notes' => "Transfer undone, returned to {$previous->bed_number}",
                ]);
            }
            $previous->update(['status' => 'occupied', 'current_patient_id' => $admission->patient_id, 'reserved_for' => null]);
            BedEvent::query()->create([
                'bed_id' => $previous->id,
                'event_type' => 'undo_transfer',
                'patient_id' => $admission->patient_id,
                'admission_id' => $admission->id,
                'performed_by' => $request->user()->id,
                'notes' => 'Transfer undone',
            ]);
            $admission->update([
                'bed_id' => $previous->id,
                'previous_bed_id' => $current?->id,
                'undo_used' => true,
            ]);
        });

        $this->log->audit($request->user(), 'Transfer Undone', $admission->admission_number, $previous->bed_number);

        return ApiResponse::data($admission->fresh()->toApiArray());
    }

    private function undoAssign(Request $request, Admission $admission): JsonResponse
    {
        $current = $admission->bed_id ? Bed::query()->find($admission->bed_id) : null;

        DB::transaction(function () use ($request, $admission, $current) {
            if ($current) {
                $current->update(['status' => 'available', 'current_patient_id' => null]);
                BedEvent::query()->create([
                    'bed_id' => $current->id,
                    'event_type' => 'undo_assign',
                    'patient_id' => $admission->patient_id,
                    'admission_id' => $admission->id,
                    'performed_by' => $request->user()->id,
                    'notes' => 'Bed assignment undone',
                ]);
            }
            $admission->update([
                'bed_id' => null,
                'status' => 'waiting_for_bed',
                'admitted_at' => null,
                'admitted_by' => null,
                'undo_used' => true,
            ]);
        });

        $this->log->audit($request->user(), 'Bed Assignment Undone', $admission->admission_number, $current?->bed_number ?? '');

        return ApiResponse::data($admission->fresh()->toApiArray());
    }

    private function placeInBed(Request $request, Admission $admission, ?Bed $bed): ?JsonResponse
    {
        if (! $bed || ! in_array($bed->status, ['available', 'reserved'], true)) {
            return ApiResponse::message('Selected bed is not available.', 422);
        }
        if ($bed->id === $admission->bed_id) {
            return null;
        }

        DB::transaction(function () use ($request, $admission, $bed) {
            $previous = $admission->bed_id ? Bed::query()->find($admission->bed_id) : null;
            if ($previous) {
                $this->releaseBed($request, $admission, $previous, "Transferred to {$bed->bed_number}");
            }

            $bed->update(['status' => 'occupied', 'current_patient_id' => $admission->patient_id, 'reserved_for' => null]);
            $admission->update([
                'previous_bed_id' => $previous?->id,
                'previous_status' => $admission->status,
                'undo_used' => false,
                'bed_id' => $bed->id,
                'status' => 'admitted',
                'admitted_at' => $admission->admitted_at ?? now(),
                'admitted_by' => $admission->admitted_by ?? $request->user()->id,
            ]);
            BedEvent::query()->create([
                'bed_id' => $bed->id,
                'event_type' => $previous ? 'transfer_in' : 'assign',
                'patient_id' => $admission->patient_id,
                'admission_id' => $admission->id,
                'performed_by' => $request->user()->id,
            ]);
            $this->log->audit($request->user(), $previous ? 'Bed Transfer' : 'Bed Assigned', $admission->admission_number, $bed->bed_number);
        });

        return null;
    }

    private function releaseBed(Request $request, Admission $admission, ?Bed $bed, string $notes): void
    {
        if (! $bed) {
            return;
        }
        $bed->update(['status' => 'cleaning', 'current_patient_id' => null]);
        BedEvent::query()->create([
            'bed_id' => $bed->id,
            'event_type' => 'release',
            'patient_id' => $admission->patient_id,
            'admission_id' => $admission->id,
            'performed_by' => $request->user()->id,
            'notes' => $notes,
        ]);
    }

    private function nextNumber(): string
    {
        $prefix = 'ADM'.now()->format('ymd').'-';
        $count = Admission::query()->where('admission_number', 'like', $prefix.'%')->count() + 1;

        return $prefix.str_pad((string) $count, 3, '0', STR_PAD_LEFT);
    }
}
