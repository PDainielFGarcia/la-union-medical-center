<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVisitorRequest;
use App\Models\Admission;
use App\Models\Department;
use App\Models\Visitor;
use App\Models\VisitorScanEvent;
use App\Models\Ward;
use App\Services\ActivityLogger;
use App\Services\ParkingService;
use App\Services\VisitorService;
use App\Support\ApiResponse;
use App\Support\NameNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VisitorController extends Controller
{
    public function __construct(
        private VisitorService $visitors,
        private ActivityLogger $log,
        private ParkingService $parking,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->visitors->expireStale();
        $user = $request->user();
        $query = Visitor::query()->latest('id');

        if ($user->role === 'department_secretary') {
            $query->where('visit_type', 'office')->where('department_id', $user->department_id);
        }
        if ($request->filled('visit_type') && $request->query('visit_type') !== 'all') {
            $query->where('visit_type', $request->query('visit_type'));
        }
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('date')) {
            $query->whereDate('visit_date', $request->query('date'));
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('full_name', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('pass_id', 'like', "%{$q}%")
                    ->orWhere('person_to_visit', 'like', "%{$q}%")
                    ->orWhere('contact_number', 'like', "%{$q}%");
            });
        }

        return ApiResponse::data($query->limit(500)->get()->map(fn (Visitor $v) => $this->visitors->toArray($v))->values());
    }

    /** Admitted patients with a bed, for the guard to confirm a patient visit. Name, ward and bed only. */
    public function inpatients(Request $request): JsonResponse
    {
        $query = Admission::query()
            ->with(['patient', 'bed.ward'])
            ->where('status', 'admitted')
            ->whereNotNull('bed_id');

        if ($request->filled('ward_id')) {
            $query->whereHas('bed', fn ($b) => $b->where('ward_id', $request->query('ward_id')));
        }
        if ($request->filled('room_type')) {
            $query->whereHas('bed', fn ($b) => $b->where('room_type', $request->query('room_type')));
        }
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->whereHas('patient', fn ($p) => $p->where(fn ($w) => $w->where('first_name', 'like', "%{$q}%")
                ->orWhere('middle_name', 'like', "%{$q}%")
                ->orWhere('last_name', 'like', "%{$q}%")
                ->orWhereRaw("CONCAT_WS(' ', first_name, middle_name, last_name) LIKE ?", ["%{$q}%"])));
        }

        $rows = $query->limit(100)->get()
            ->sortBy(fn (Admission $a) => [$a->bed?->ward?->sort_order, $a->bed?->bed_number])
            ->map(fn (Admission $a) => [
                'admission_id' => $a->id,
                'patient_name' => $a->patient?->fullName(),
                'ward_id' => $a->bed?->ward_id,
                'ward' => $a->bed?->ward?->name,
                'room_type' => $a->bed?->room_type,
                'room' => $a->bed?->room,
                'bed_number' => $a->bed?->bed_number,
                'location' => $this->visitors->locationLabel($a),
            ])
            ->values();

        return ApiResponse::data([
            'wards' => Ward::query()->orderBy('sort_order')->get(['id', 'name', 'code']),
            'patients' => $rows,
        ]);
    }

    public function store(StoreVisitorRequest $request): JsonResponse
    {
        $this->authorize('create', Visitor::class);
        $data = $request->validated();

        $isPatientVisit = ($data['visit_type'] ?? 'office') === 'patient';
        $admission = null;
        if ($isPatientVisit) {
            $admission = $this->visitors->activeInpatient((int) $data['admission_id']);
            if (! $admission) {
                return ApiResponse::message('This patient is not currently admitted in any ward. The visit cannot be approved.', 422);
            }
        }

        $first = NameNormalizer::personName($data['first_name']);
        $middleRaw = trim((string) ($data['middle_name'] ?? ''));
        $middle = $middleRaw !== '' ? NameNormalizer::personName($middleRaw) : null;
        $last = NameNormalizer::personName($data['last_name']);
        $fullName = NameNormalizer::fullName($first, $middle, $last);
        $contact = ! empty($data['contact_number']) ? $data['contact_number'] : null;

        $duplicate = Visitor::query()
            ->whereIn('status', VisitorService::OPEN_STATUSES)
            ->whereDate('visit_date', today())
            ->when($isPatientVisit,
                fn ($q) => $q->where('admission_id', $admission->id),
                fn ($q) => $q->where('department_id', $data['department_id']))
            ->where(function ($q) use ($contact, $first, $last) {
                if ($contact) {
                    $q->where('contact_number', $contact);
                } else {
                    $q->where('first_name', $first)->where('last_name', $last);
                }
            })
            ->exists();
        if ($duplicate) {
            return ApiResponse::message($isPatientVisit
                ? 'This visitor already has an open visit to this patient today.'
                : 'This visitor already has an open visit to this office today.', 409);
        }

        $visitor = DB::transaction(function () use ($data, $request, $isPatientVisit, $admission, $first, $middle, $last, $fullName, $contact) {
            $visitor = Visitor::query()->create([
                'pass_id' => $this->visitors->nextPassId(),
                'first_name' => $first,
                'middle_name' => $middle,
                'last_name' => $last,
                'full_name' => $fullName,
                'age' => $data['age'] ?? null,
                'address' => $data['address'],
                'contact_number' => $contact,
                'id_type' => $data['id_type'] ?? null,
                'id_number' => $data['id_number'] ?? null,
                'purpose' => $data['purpose'],
                'visit_type' => $isPatientVisit ? 'patient' : 'office',
                'department_id' => $isPatientVisit ? null : $data['department_id'],
                'person_to_visit' => $isPatientVisit ? $admission->patient?->fullName() : ($data['person_to_visit'] ?? null),
                'admission_id' => $admission?->id,
                'patient_id' => $admission?->patient_id,
                'ward_id' => $admission?->bed?->ward_id,
                'visit_location' => $admission ? $this->visitors->locationLabel($admission) : null,
                'visit_date' => today(),
                'status' => $isPatientVisit ? 'approved' : 'pending_approval',
                'registered_by' => $request->user()->id,
                'reviewed_by' => $isPatientVisit ? $request->user()->id : null,
                'reviewed_at' => $isPatientVisit ? now() : null,
            ]);

            if ($isPatientVisit) {
                $this->visitors->issueQrPass($visitor);
            }

            if (! empty($data['vehicle']['plate_number'])) {
                $this->parking->park($data['vehicle'], 'visitor', $visitor->full_name, $request->user(), visitorId: $visitor->id);
            }

            return $visitor;
        });

        if ($isPatientVisit) {
            $this->log->audit(
                $request->user(),
                'Visitor Approved',
                "{$visitor->pass_id} - {$visitor->full_name}",
                "Patient visit to {$visitor->person_to_visit} ({$visitor->visit_location})"
            );

            return ApiResponse::data($this->visitors->toArray($visitor->fresh()), 201);
        }

        $department = Department::query()->find($visitor->department_id);
        $this->log->notifyUser(
            $department?->secretary_user_id,
            'Visitor waiting for approval',
            "{$visitor->full_name} ({$visitor->pass_id}) is at reception to visit {$department?->name}.",
            '/visitor-approvals'
        );
        $this->log->audit($request->user(), 'Visitor Registered', "{$visitor->pass_id} - {$visitor->full_name}", "Same-day visit to {$department?->name}");

        return ApiResponse::data($this->visitors->toArray($visitor), 201);
    }

    public function pass(Visitor $visitor): JsonResponse
    {
        return ApiResponse::data($this->visitors->toArray($visitor));
    }

    public function approve(Request $request, Visitor $visitor): JsonResponse
    {
        if (! $this->visitors->canReview($request->user(), $visitor)) {
            return ApiResponse::message('Only the secretary of this office can approve this visit.', 403);
        }
        $this->visitors->expireIfNeeded($visitor);
        if ($visitor->status !== 'pending_approval') {
            return ApiResponse::message('Only pending visits can be approved.', 422);
        }

        $visitor->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_remarks' => $request->input('remarks'),
        ]);
        $this->visitors->issueQrPass($visitor);

        $this->log->notifyRole('security_guard', 'Visitor approved', "{$visitor->full_name} ({$visitor->pass_id}) was approved. Issue the QR pass.", '/current-visitors');
        $this->log->audit($request->user(), 'Visitor Approved', "{$visitor->pass_id} - {$visitor->full_name}", 'QR pass issued');

        return ApiResponse::data($this->visitors->toArray($visitor->fresh()));
    }

    public function reject(Request $request, Visitor $visitor): JsonResponse
    {
        if (! $this->visitors->canReview($request->user(), $visitor)) {
            return ApiResponse::message('Only the secretary of this office can reject this visit.', 403);
        }
        if ($visitor->status !== 'pending_approval') {
            return ApiResponse::message('Only pending visits can be rejected.', 422);
        }

        $data = $request->validate([
            'rejection_reason_id' => ['nullable', 'exists:rejection_reasons,id'],
            'rejection_notes' => ['nullable', 'string', 'max:255'],
        ]);

        $visitor->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason_id' => $data['rejection_reason_id'] ?? null,
            'rejection_notes' => $data['rejection_notes'] ?? null,
        ]);

        $this->log->notifyRole('security_guard', 'Visitor rejected', "{$visitor->full_name} ({$visitor->pass_id}) was not approved.", '/current-visitors');
        $this->log->audit($request->user(), 'Visitor Rejected', "{$visitor->pass_id} - {$visitor->full_name}", 'Rejected by department');

        return ApiResponse::data($this->visitors->toArray($visitor->fresh()));
    }

    public function scanToken(Request $request): JsonResponse
    {
        $token = $this->visitors->parseQrToken($request->input('token'));
        $visitor = $token ? Visitor::query()->where('qr_token', $token)->first() : null;
        if (! $visitor) {
            return ApiResponse::message('QR code not recognized.', 404);
        }

        return $this->recordScan($request, $visitor);
    }

    public function manualScan(Request $request, Visitor $visitor): JsonResponse
    {
        return $this->recordScan($request, $visitor);
    }

    public function gateReject(Request $request, Visitor $visitor): JsonResponse
    {
        $data = $request->validate([
            'rejection_reason_id' => ['nullable', 'exists:rejection_reasons,id'],
            'rejection_notes' => ['nullable', 'string', 'max:255'],
        ]);

        if (! in_array($visitor->status, ['pending_approval', 'approved'], true)) {
            return ApiResponse::message('Only visitors who have not entered can be turned away at the gate.', 422);
        }

        DB::transaction(function () use ($request, $visitor, $data) {
            $visitor->update([
                'status' => 'rejected',
                'rejection_reason_id' => $data['rejection_reason_id'] ?? null,
                'rejection_notes' => $data['rejection_notes'] ?? null,
            ]);
            VisitorScanEvent::query()->create([
                'visitor_id' => $visitor->id,
                'scan_type' => 'entry',
                'scanned_by' => $request->user()->id,
                'result' => 'rejected',
                'rejection_reason_id' => $data['rejection_reason_id'] ?? null,
                'rejection_notes' => $data['rejection_notes'] ?? null,
                'scanned_at' => now(),
            ]);
        });

        $this->log->audit($request->user(), 'Visitor Turned Away', "{$visitor->pass_id} - {$visitor->full_name}", 'Rejected at gate');

        return ApiResponse::data($this->visitors->toArray($visitor->fresh()));
    }

    public function cancel(Request $request, Visitor $visitor): JsonResponse
    {
        if (! in_array($visitor->status, ['pending_approval', 'approved'], true)) {
            return ApiResponse::message('This visit can no longer be cancelled.', 422);
        }

        $visitor->update(['status' => 'cancelled']);
        $this->log->audit($request->user(), 'Visitor Cancelled', $visitor->pass_id, 'Visit cancelled');

        return ApiResponse::data($this->visitors->toArray($visitor->fresh()));
    }

    public function scans(Visitor $visitor): JsonResponse
    {
        return ApiResponse::data($visitor->scanEvents()->latest('scanned_at')->get());
    }

    private function recordScan(Request $request, Visitor $visitor): JsonResponse
    {
        $this->visitors->expireIfNeeded($visitor);

        $type = match ($visitor->status) {
            'approved' => 'entry',
            'inside' => 'exit',
            default => null,
        };

        if (! $type) {
            $messages = [
                'pending_approval' => 'This visit is still waiting for office approval.',
                'completed' => 'This pass was already used. The visitor has exited.',
                'expired' => 'This pass has expired. Passes are valid for the visit day only.',
                'rejected' => 'This visit was rejected.',
                'cancelled' => 'This visit was cancelled.',
            ];

            return response()->json([
                'message' => $messages[$visitor->status] ?? 'This pass cannot be used.',
                'code' => strtoupper($visitor->status),
                'visit' => $this->visitors->toArray($visitor),
            ], 422);
        }

        DB::transaction(function () use ($request, $visitor, $type) {
            $visitor->update($type === 'entry'
                ? ['status' => 'inside', 'entry_scanned_at' => now()]
                : ['status' => 'completed', 'exit_scanned_at' => now()]);

            VisitorScanEvent::query()->create([
                'visitor_id' => $visitor->id,
                'scan_type' => $type,
                'scanned_by' => $request->user()->id,
                'result' => 'allowed',
                'scanned_at' => now(),
            ]);
        });

        $this->log->audit($request->user(), $type === 'entry' ? 'Visitor Entry' : 'Visitor Exit', "{$visitor->pass_id} - {$visitor->full_name}", ucfirst($type).' scan');

        return ApiResponse::data([
            'action' => $type,
            'message' => $type === 'entry' ? 'Entry recorded. Visitor may proceed.' : 'Exit recorded. Pass is now closed.',
            'visit' => $this->visitors->toArray($visitor->fresh()),
        ]);
    }
}
