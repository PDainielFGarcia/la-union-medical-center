<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\QueueTicket;
use App\Models\Vehicle;
use App\Models\Visitor;
use App\Services\ReportService;
use App\Services\VisitorService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private VisitorService $visitors, private ReportService $reports) {}

    public function show(Request $request): JsonResponse
    {
        $this->visitors->expireStale();
        $user = $request->user();
        $todayVisitors = Visitor::query()->whereDate('visit_date', today());
        if ($user->role === 'department_secretary') {
            $todayVisitors->where('visit_type', 'office')->where('department_id', $user->department_id);
        }

        $doctors = Doctor::query()->with('primaryClinic')->get()->map(fn (Doctor $d) => $this->doctorArray($d));

        return ApiResponse::data([
            'visitor_counts' => [
                'inside' => (clone $todayVisitors)->where('status', 'inside')->count(),
                'pending_approval' => (clone $todayVisitors)->where('status', 'pending_approval')->count(),
                'approved' => (clone $todayVisitors)->where('status', 'approved')->count(),
                'exited' => (clone $todayVisitors)->where('status', 'completed')->count(),
                'rejected' => (clone $todayVisitors)->where('status', 'rejected')->count(),
                'patient_visits' => (clone $todayVisitors)->where('visit_type', 'patient')->count(),
                'office_visits' => (clone $todayVisitors)->where('visit_type', 'office')->count(),
            ],
            'queue_counts' => [
                'waiting' => QueueTicket::query()->whereDate('queue_date', today())->whereIn('status', ['waiting', 'called'])->count(),
                'served' => QueueTicket::query()->whereDate('queue_date', today())->whereNotNull('served_at')->count(),
            ],
            'doctor_counts' => [
                'available' => Doctor::query()->where('status', 'available')->count(),
                'total' => Doctor::query()->count(),
            ],
            'bed_counts' => [
                'total' => Bed::query()->count(),
                'available' => Bed::query()->where('status', 'available')->count(),
                'occupied' => Bed::query()->where('status', 'occupied')->count(),
                'reserved' => Bed::query()->where('status', 'reserved')->count(),
                'cleaning' => Bed::query()->where('status', 'cleaning')->count(),
                'maintenance' => Bed::query()->where('status', 'maintenance')->count(),
            ],
            'ward_census' => $this->reports->wardCensus(),
            'vehicles_parked' => Vehicle::query()->where('status', 'parked')->count(),
            'doctors' => $doctors,
            'recent_activity' => QueueTicket::query()
                ->with(['doctor', 'clinic'])
                ->whereDate('queue_date', today())
                ->latest('id')
                ->limit(6)
                ->get()
                ->map(fn (QueueTicket $q) => $this->queueArray($q))
                ->values(),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if ($q === '') {
            return ApiResponse::data(['patients' => [], 'visitors' => [], 'queues' => []]);
        }

        $user = $request->user();
        $isAdmin = $user->role === 'administrator';
        $seesPatients = $isAdmin || in_array($user->role, ['opd_staff', 'nursing_staff', 'doctor'], true);
        $seesVisitors = $isAdmin || in_array($user->role, ['security_guard', 'department_secretary'], true);

        $patients = ! $seesPatients ? collect() : Patient::query()
            ->where(function ($query) use ($q) {
                $query->where('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('patient_id', 'like', "%{$q}%")
                    ->orWhere('contact_number', 'like', "%{$q}%");
            })
            ->limit(20)
            ->get()
            ->map->toApiArray();

        $visitors = ! $seesVisitors ? collect() : Visitor::query()
            ->where(function ($query) use ($q) {
                $query->where('full_name', 'like', "%{$q}%")
                    ->orWhere('pass_id', 'like', "%{$q}%");
            })
            ->when($user->role === 'department_secretary', fn ($query) => $query->where('visit_type', 'office')->where('department_id', $user->department_id))
            ->limit(20)
            ->get()
            ->map(fn ($v) => $this->visitors->toArray($v));

        $queues = ! $seesPatients ? collect() : QueueTicket::query()
            ->where(function ($query) use ($q) {
                $query->where('queue_number', 'like', "%{$q}%")
                    ->orWhere('patient_name', 'like', "%{$q}%");
            })
            ->limit(20)
            ->get()
            ->map(fn ($ticket) => $this->queueArray($ticket));

        return ApiResponse::data([
            'patients' => $patients,
            'visitors' => $visitors,
            'queues' => $queues,
        ]);
    }

    private function doctorArray(Doctor $doctor): array
    {
        return [
            'id' => $doctor->id,
            'name' => $doctor->name,
            'specialty' => $doctor->specialty,
            'clinic' => $doctor->primaryClinic?->name ?? $doctor->specialty,
            'primary_clinic_id' => $doctor->primary_clinic_id,
            'schedule' => $doctor->schedule,
            'weekly' => $doctor->weekly_json,
            'status' => $doctor->status,
            'is_on_duty' => (bool) $doctor->is_on_duty,
            'waiting_count' => QueueTicket::query()
                ->where('doctor_id', $doctor->id)
                ->whereDate('queue_date', today())
                ->where('status', 'waiting')
                ->count(),
        ];
    }

    private function queueArray(QueueTicket $ticket): array
    {
        $ticket->loadMissing(['doctor', 'clinic']);

        return [
            'id' => $ticket->id,
            'queue_number' => $ticket->queue_number,
            'queue_date' => $ticket->queue_date?->toDateString(),
            'clinic_id' => $ticket->clinic_id,
            'clinic' => $ticket->clinic?->name,
            'patient_id' => $ticket->patient_id,
            'patient_name' => $ticket->patient_name,
            'doctor_id' => $ticket->doctor_id,
            'doctor_name' => $ticket->doctor?->name,
            'status' => $ticket->status,
            'time' => $ticket->created_at?->format('g:i A'),
        ];
    }
}
