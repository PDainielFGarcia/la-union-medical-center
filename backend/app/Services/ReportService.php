<?php

namespace App\Services;

use App\Models\Admission;
use App\Models\AuditLog;
use App\Models\Patient;
use App\Models\QueueTicket;
use App\Models\Vehicle;
use App\Models\Visitor;
use App\Models\Ward;
use Illuminate\Support\Carbon;

class ReportService
{
    public const DATASETS = ['patients', 'opd', 'admissions', 'census', 'visitors', 'vehicles', 'audit'];

    public const DAILY_REPORTS = ['patients', 'visitors', 'audit'];

    /**
     * @return array{title: string, columns: array<int, string>, rows: array<int, array<int, mixed>>}
     */
    public function dataset(string $key, Carbon $from, Carbon $to): array
    {
        $from = $from->copy()->startOfDay();
        $to = $to->copy()->endOfDay();

        return match ($key) {
            'patients' => $this->patients($from, $to),
            'opd' => $this->opd($from, $to),
            'admissions' => $this->admissions($from, $to),
            'census' => $this->census(),
            'visitors' => $this->visitors($from, $to),
            'vehicles' => $this->vehicles($from, $to),
            'audit' => $this->audit($from, $to),
        };
    }

    public function dailySummary(Carbon $date): array
    {
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();
        $tickets = QueueTicket::query()->whereDate('queue_date', $date);
        $visitors = Visitor::query()->whereDate('visit_date', $date);

        return [
            'date' => $date->toDateString(),
            'patients' => [
                'new_patients' => Patient::query()->whereBetween('created_at', [$start, $end])->count(),
                'opd_arrivals' => (clone $tickets)->count(),
                'seen_by_doctor' => (clone $tickets)->whereNotNull('served_at')->count(),
                'still_waiting' => (clone $tickets)->whereIn('status', ['waiting', 'called'])->count(),
                'admitted' => Admission::query()->whereBetween('admitted_at', [$start, $end])->count(),
                'discharged' => Admission::query()->whereBetween('discharged_at', [$start, $end])->count(),
                'currently_admitted' => Admission::query()->where('status', 'admitted')->count(),
            ],
            'visitors' => [
                'registered' => (clone $visitors)->count(),
                'office_visits' => (clone $visitors)->where('visit_type', 'office')->count(),
                'patient_visits' => (clone $visitors)->where('visit_type', 'patient')->count(),
                'approved' => (clone $visitors)->whereNotNull('qr_token')->count(),
                'rejected' => (clone $visitors)->where('status', 'rejected')->count(),
                'entered' => (clone $visitors)->whereNotNull('entry_scanned_at')->count(),
                'exited' => (clone $visitors)->whereNotNull('exit_scanned_at')->count(),
                'still_inside' => Visitor::query()->where('status', 'inside')->count(),
                'vehicles_parked' => Vehicle::query()->whereBetween('entry_time', [$start, $end])->count(),
            ],
            'census' => $this->wardCensus(),
            'audit_entries' => AuditLog::query()->whereBetween('created_at', [$start, $end])->count(),
        ];
    }

    public function wardCensus(): array
    {
        return Ward::query()->with('beds')->orderBy('sort_order')->get()->map(fn (Ward $ward) => [
            'ward' => $ward->name,
            'total' => $ward->beds->count(),
            'occupied' => $ward->beds->where('status', 'occupied')->count(),
            'available' => $ward->beds->where('status', 'available')->count(),
            'reserved' => $ward->beds->where('status', 'reserved')->count(),
            'unavailable' => $ward->beds->whereIn('status', ['cleaning', 'maintenance', 'unavailable'])->count(),
        ])->all();
    }

    private function patients(Carbon $from, Carbon $to): array
    {
        $rows = Patient::query()->whereBetween('created_at', [$from, $to])->orderBy('id')->get()->map(fn (Patient $p) => [
            $p->patient_id, $p->last_name, $p->first_name, $p->middle_name, $p->birthday?->toDateString(), $p->birthday?->age,
            $p->sex, $p->complete_address, $p->contact_number, $p->philhealth_number, $p->created_at?->format('Y-m-d H:i'),
        ])->all();

        return [
            'title' => 'Patients Registered',
            'columns' => ['Patient ID', 'Last Name', 'First Name', 'Middle Name', 'Birthday', 'Age', 'Sex', 'Address', 'Contact', 'PhilHealth No.', 'Registered At'],
            'rows' => $rows,
        ];
    }

    private function opd(Carbon $from, Carbon $to): array
    {
        $rows = QueueTicket::query()->with(['clinic', 'doctor', 'patient'])
            ->whereBetween('queue_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('queue_date')->orderBy('id')->get()
            ->map(fn (QueueTicket $q) => [
                $q->queue_date?->toDateString(), $q->queue_number, $q->patient?->patient_id, $q->patient_name, $q->clinic?->name,
                $q->doctor?->name, $q->status, $q->created_at?->format('H:i'), $q->served_at?->format('H:i'), $q->completed_at?->format('H:i'),
            ])->all();

        return [
            'title' => 'OPD Arrivals and Consultations',
            'columns' => ['Date', 'Queue No.', 'Patient ID', 'Patient', 'Clinic', 'Doctor', 'Status', 'Arrived', 'Seen by Doctor', 'Completed'],
            'rows' => $rows,
        ];
    }

    private function admissions(Carbon $from, Carbon $to): array
    {
        $rows = Admission::query()->with(['patient', 'bed.ward'])
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('created_at', [$from, $to])
                    ->orWhereBetween('admitted_at', [$from, $to])
                    ->orWhereBetween('discharged_at', [$from, $to]);
            })
            ->orderBy('id')->get()
            ->map(fn (Admission $a) => [
                $a->admission_number, $a->patient?->patient_id, $a->patient?->fullName(), $a->bed?->ward?->name, $a->bed?->room,
                $a->bed?->bed_number, $a->priority, $a->status, $a->admitted_at?->format('Y-m-d H:i'), $a->discharged_at?->format('Y-m-d H:i'),
            ])->all();

        return [
            'title' => 'Admissions and Discharges',
            'columns' => ['Admission No.', 'Patient ID', 'Patient', 'Ward', 'Room', 'Bed', 'Priority', 'Status', 'Admitted At', 'Discharged At'],
            'rows' => $rows,
        ];
    }

    private function census(): array
    {
        $rows = Ward::query()->with(['beds.currentPatient'])->orderBy('sort_order')->get()
            ->flatMap(fn (Ward $ward) => $ward->beds->map(fn ($bed) => [
                $ward->name, $bed->room, $bed->bed_number, ucfirst($bed->room_type), $bed->status,
                $bed->currentPatient?->patient_id, $bed->currentPatient?->fullName(), $bed->reserved_for,
            ]))->all();

        return [
            'title' => 'Bed Census (current)',
            'columns' => ['Ward', 'Room', 'Bed', 'Room Type', 'Status', 'Patient ID', 'Patient', 'Reserved For'],
            'rows' => $rows,
        ];
    }

    private function visitors(Carbon $from, Carbon $to): array
    {
        $rows = Visitor::query()->with(['department', 'rejectionReason', 'reviewer', 'vehicle.parkingArea'])
            ->whereBetween('visit_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('visit_date')->orderBy('id')->get()
            ->map(fn (Visitor $v) => [
                $v->visit_date?->toDateString(), $v->pass_id, $v->full_name, $v->age, $v->contact_number, $v->purpose,
                $v->visit_type === 'patient' ? 'Patient visit' : 'Office',
                $v->visit_type === 'patient' ? $v->visit_location : $v->department?->name,
                $v->person_to_visit, $v->status, $v->reviewer?->name, $v->rejectionReason?->label,
                $v->entry_scanned_at?->format('H:i'), $v->exit_scanned_at?->format('H:i'), $v->vehicle?->plate_number,
                $v->vehicle?->parkingArea?->name,
            ])->all();

        return [
            'title' => 'Visitors',
            'columns' => ['Date', 'Pass ID', 'Visitor', 'Age', 'Contact', 'Purpose', 'Visit Type', 'Office / Patient Location', 'Person to Visit', 'Status', 'Approved By', 'Rejection Reason', 'Entry', 'Exit', 'Plate No.', 'Parking'],
            'rows' => $rows,
        ];
    }

    private function vehicles(Carbon $from, Carbon $to): array
    {
        $rows = Vehicle::query()->with('parkingArea')
            ->whereBetween('entry_time', [$from, $to])
            ->orderBy('id')->get()
            ->map(fn (Vehicle $v) => [
                $v->entry_time?->toDateString(), $v->plate_number, $v->type, $v->color, $v->owner, $v->owner_type,
                $v->parkingArea?->name, $v->slot_number, $v->entry_time?->format('H:i'), $v->exit_time?->format('H:i'), $v->status,
            ])->all();

        return [
            'title' => 'Vehicles and Parking',
            'columns' => ['Date', 'Plate No.', 'Type', 'Color', 'Owner', 'Owner Type', 'Parking Area', 'Slot', 'Entry', 'Exit', 'Status'],
            'rows' => $rows,
        ];
    }

    private function audit(Carbon $from, Carbon $to): array
    {
        $rows = AuditLog::query()->whereBetween('created_at', [$from, $to])->orderBy('id')->get()
            ->map(fn (AuditLog $log) => [
                $log->created_at?->format('Y-m-d H:i:s'), $log->user_name, $log->role, $log->action, $log->record_label, $log->status, $log->details,
            ])->all();

        return [
            'title' => 'Audit Log',
            'columns' => ['Timestamp', 'User', 'Role', 'Action', 'Record', 'Status', 'Details'],
            'rows' => $rows,
        ];
    }
}
