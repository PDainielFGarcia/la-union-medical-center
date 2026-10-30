<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OpdEncounter;
use App\Models\QueueTicket;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = QueueTicket::query()->with(['doctor', 'clinic'])->latest('id');

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->query('doctor_id'));
        }
        if ($request->filled('clinic_id')) {
            $query->where('clinic_id', $request->query('clinic_id'));
        }
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        $query->whereDate('queue_date', $request->query('queue_date', today()->toDateString()));
        if ($request->filled('q')) {
            $q = $request->query('q');
            $query->where(function ($builder) use ($q) {
                $builder->where('queue_number', 'like', "%{$q}%")
                    ->orWhere('patient_name', 'like', "%{$q}%");
            });
        }

        $items = $query->get()->map(fn (QueueTicket $ticket) => $this->toArray($ticket, $request->user()))->values();

        return ApiResponse::data($items);
    }

    public function call(Request $request, QueueTicket $queue): JsonResponse
    {
        if ($denied = $this->authorizeQueueAction($request, $queue)) {
            return $denied;
        }

        return $this->transition($request, $queue, 'called', ['called_at' => now()]);
    }

    public function serve(Request $request, QueueTicket $queue): JsonResponse
    {
        if ($denied = $this->authorizeQueueAction($request, $queue)) {
            return $denied;
        }

        OpdEncounter::query()->whereKey($queue->opd_encounter_id)->whereNull('seen_by_doctor_at')
            ->update(['seen_by_doctor_at' => now(), 'status' => 'with_doctor']);

        return $this->transition($request, $queue, 'serving', ['served_at' => now()]);
    }

    public function done(Request $request, QueueTicket $queue): JsonResponse
    {
        if ($denied = $this->authorizeQueueAction($request, $queue)) {
            return $denied;
        }

        $wait = $queue->created_at ? (int) $queue->created_at->diffInSeconds($queue->served_at ?? now()) : null;
        OpdEncounter::query()->whereKey($queue->opd_encounter_id)->update([
            'status' => 'completed',
            'seen_by_doctor_at' => $queue->served_at ?? now(),
        ]);

        return $this->transition($request, $queue, 'completed', [
            'completed_at' => now(),
            'wait_seconds' => $wait,
        ]);
    }

    public function skip(Request $request, QueueTicket $queue): JsonResponse
    {
        if ($denied = $this->authorizeQueueAction($request, $queue)) {
            return $denied;
        }

        return $this->transition($request, $queue, 'skipped');
    }

    public function cancel(Request $request, QueueTicket $queue): JsonResponse
    {
        if ($denied = $this->authorizeQueueAction($request, $queue)) {
            return $denied;
        }

        return $this->transition($request, $queue, 'cancelled');
    }

    public function undo(Request $request, QueueTicket $queue): JsonResponse
    {
        if ($denied = $this->authorizeQueueAction($request, $queue)) {
            return $denied;
        }

        if ($queue->undo_used) {
            return ApiResponse::message('Undo has already been used for this ticket.', 422);
        }
        if ($queue->status === 'cancelled') {
            return ApiResponse::message('Cancelled tickets cannot be undone.', 422);
        }
        if (! $queue->queue_date?->isToday()) {
            return ApiResponse::message('Only today\'s queue tickets can be undone.', 422);
        }

        $changes = match ($queue->status) {
            'serving' => ['status' => 'called', 'served_at' => null],
            'called' => ['status' => 'waiting', 'called_at' => null],
            'completed' => ['status' => 'serving', 'completed_at' => null, 'wait_seconds' => null],
            'skipped' => ['status' => $queue->previous_status && $queue->previous_status !== 'skipped'
                ? $queue->previous_status
                : 'waiting'],
            default => null,
        };
        if ($changes === null) {
            return ApiResponse::message('There is nothing to undo for this ticket.', 422);
        }

        if ($queue->status === 'completed') {
            OpdEncounter::query()->whereKey($queue->opd_encounter_id)->update(['status' => 'with_doctor']);
        }

        $queue->update(array_merge($changes, ['undo_used' => true]));

        return ApiResponse::data($this->toArray($queue->fresh(['doctor', 'clinic']), $request->user()));
    }

    private function authorizeQueueAction(Request $request, QueueTicket $queue): ?JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->loadMissing('doctor');

        if (in_array($user->role, ['administrator', 'opd_staff', 'nursing_staff'], true)) {
            return null;
        }

        if ($user->role === 'doctor') {
            $clinicId = $user->doctor?->primary_clinic_id;
            if ($clinicId && (int) $queue->clinic_id === (int) $clinicId) {
                return null;
            }

            return ApiResponse::message('You can only manage patients in your assigned clinic.', 403);
        }

        return ApiResponse::message('You do not have permission to perform this action.', 403);
    }

    private function transition(Request $request, QueueTicket $queue, string $status, array $extra = []): JsonResponse
    {
        $queue->update(array_merge([
            'previous_status' => $queue->status,
            'undo_used' => false,
            'status' => $status,
        ], $extra));

        return ApiResponse::data($this->toArray($queue->fresh(['doctor', 'clinic']), $request->user()));
    }

    private function toArray(QueueTicket $ticket, ?User $user = null): array
    {
        $canInteract = true;
        if ($user?->role === 'doctor') {
            $user->loadMissing('doctor');
            $canInteract = $user->doctor?->primary_clinic_id
                && (int) $ticket->clinic_id === (int) $user->doctor->primary_clinic_id;
        }

        return [
            'id' => $ticket->id,
            'queue_number' => $ticket->queue_number,
            'queue_date' => $ticket->queue_date?->toDateString(),
            'patient_id' => $ticket->patient_id,
            'patient_name' => $ticket->patient_name,
            'doctor_id' => $ticket->doctor_id,
            'doctor_name' => $ticket->doctor?->name,
            'clinic_id' => $ticket->clinic_id,
            'clinic' => $ticket->clinic?->name,
            'status' => $ticket->status,
            'previous_status' => $ticket->previous_status,
            'undo_used' => (bool) $ticket->undo_used,
            'can_undo' => ! $ticket->undo_used
                && $ticket->status !== 'cancelled'
                && $ticket->status !== 'waiting'
                && (bool) $ticket->queue_date?->isToday(),
            'can_interact' => $canInteract,
            'time' => $ticket->created_at?->format('g:i A'),
        ];
    }
}
