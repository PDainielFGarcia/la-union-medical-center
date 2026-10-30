<?php

namespace App\Services;

use App\Models\Admission;
use App\Models\Guardian;
use App\Models\User;
use App\Models\Visitor;
use Illuminate\Support\Carbon;

class VisitorService
{
    public const OPEN_STATUSES = ['pending_approval', 'approved', 'inside'];

    public function expireIfNeeded(Visitor $visitor): Visitor
    {
        if (in_array($visitor->status, ['pending_approval', 'approved'], true)
            && $visitor->visit_date
            && $visitor->visit_date->lt(Carbon::today())) {
            $visitor->update(['status' => 'expired']);
        }

        return $visitor;
    }

    public function expireStale(): void
    {
        Visitor::query()
            ->whereIn('status', ['pending_approval', 'approved'])
            ->whereDate('visit_date', '<', Carbon::today())
            ->update(['status' => 'expired']);
    }

    public const ROOM_TYPE_LABELS = ['private' => 'Private Room', 'ward' => 'Ward', 'charity' => 'Charity'];

    public function canReview(User $user, Visitor $visitor): bool
    {
        if ($user->role === 'administrator') {
            return true;
        }

        if ($visitor->visit_type === 'patient') {
            return $user->role === 'security_guard';
        }

        return $user->role === 'department_secretary'
            && $visitor->department_id !== null
            && $visitor->department_id === $user->department_id;
    }

    /** Currently admitted patient with a bed, or null if the patient is not listed in any ward. */
    public function activeInpatient(int $admissionId): ?Admission
    {
        return Admission::query()
            ->with(['patient', 'bed.ward'])
            ->whereKey($admissionId)
            ->where('status', 'admitted')
            ->whereNotNull('bed_id')
            ->first();
    }

    public function locationLabel(Admission $admission): string
    {
        $bed = $admission->bed;
        $type = self::ROOM_TYPE_LABELS[$bed?->room_type] ?? ucfirst((string) $bed?->room_type);
        $room = $bed?->room_type === 'private' ? $bed->room : $type;

        return trim("{$bed?->ward?->name} · {$room} · {$bed?->bed_number}", ' ·');
    }

    public function nextPassId(): string
    {
        $prefix = 'V'.now()->format('ymd').'-';
        $count = Visitor::query()->where('pass_id', 'like', $prefix.'%')->count() + 1;

        return $prefix.str_pad((string) $count, 3, '0', STR_PAD_LEFT);
    }

    public function issueQrPass(Visitor $visitor): Visitor
    {
        if ($visitor->qr_token) {
            return $visitor;
        }

        do {
            $token = bin2hex(random_bytes(24));
        } while (Visitor::query()->where('qr_token', $token)->exists());

        $visitor->update([
            'qr_token' => $token,
            'qr_generated_at' => now(),
            'qr_expires_at' => Carbon::parse($visitor->visit_date)->endOfDay(),
        ]);

        return $visitor;
    }

    public function parseQrToken(?string $raw): ?string
    {
        if (! $raw) {
            return null;
        }
        $raw = trim($raw);

        return str_starts_with($raw, 'VISIT-PASS:') ? substr($raw, strlen('VISIT-PASS:')) : $raw;
    }

    public function guardianFor(Visitor $visitor): ?Guardian
    {
        return Guardian::query()
            ->join('guardianables', 'guardianables.guardian_id', '=', 'guardians.id')
            ->where('guardianables.guardianable_type', 'visitor')
            ->where('guardianables.guardianable_id', $visitor->id)
            ->select('guardians.*')
            ->first();
    }

    public function toArray(Visitor $visitor): array
    {
        $this->expireIfNeeded($visitor);
        $visitor->loadMissing(['department', 'ward', 'rejectionReason', 'reviewer', 'vehicle.parkingArea']);
        $isPatientVisit = $visitor->visit_type === 'patient';
        $destination = $isPatientVisit ? "Patient visit · {$visitor->visit_location}" : $visitor->department?->name;

        return [
            'id' => $visitor->id,
            'pass_id' => $visitor->pass_id,
            'first_name' => $visitor->first_name,
            'middle_name' => $visitor->middle_name,
            'last_name' => $visitor->last_name,
            'full_name' => $visitor->full_name,
            'age' => $visitor->age,
            'address' => $visitor->address,
            'contact_number' => $visitor->contact_number,
            'id_type' => $visitor->id_type,
            'id_number' => $visitor->id_number,
            'purpose' => $visitor->purpose,
            'visit_type' => $visitor->visit_type,
            'department_id' => $visitor->department_id,
            'department' => $destination,
            'facility' => $destination,
            'person_to_visit' => $visitor->person_to_visit,
            'admission_id' => $visitor->admission_id,
            'patient_id' => $visitor->patient_id,
            'ward_id' => $visitor->ward_id,
            'ward' => $visitor->ward?->name,
            'visit_location' => $visitor->visit_location,
            'visit_date' => $visitor->visit_date?->toDateString(),
            'status' => $visitor->status,
            'reviewed_by' => $visitor->reviewer?->name,
            'reviewed_at' => $visitor->reviewed_at?->toIso8601String(),
            'review_remarks' => $visitor->review_remarks,
            'rejection_reason' => $visitor->rejectionReason?->label,
            'rejection_notes' => $visitor->rejection_notes,
            'qr_token' => $visitor->qr_token,
            'qr_expires_at' => $visitor->qr_expires_at?->toIso8601String(),
            'entry_time' => $visitor->entry_scanned_at?->format('g:i A'),
            'exit_time' => $visitor->exit_scanned_at?->format('g:i A'),
            'entry_at' => $visitor->entry_scanned_at?->toIso8601String(),
            'exit_at' => $visitor->exit_scanned_at?->toIso8601String(),
            'guardian_name' => null,
            'guardian_relationship' => null,
            'vehicle_plate' => $visitor->vehicle?->plate_number,
            'parking_area' => $visitor->vehicle?->parkingArea?->name,
            'parking_slot' => $visitor->vehicle?->slot_number,
            'created_at' => $visitor->created_at?->toIso8601String(),
        ];
    }
}
