<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use App\Models\Patient;
use App\Models\QueueTicket;
use App\Models\Visitor;
use App\Services\ActivityLogger;
use App\Services\ReportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports, private ActivityLogger $log) {}

    public function summary(): JsonResponse
    {
        $purposes = Visitor::query()
            ->selectRaw('purpose as label, COUNT(*) as value')
            ->whereNotNull('purpose')
            ->groupBy('purpose')
            ->orderByDesc('value')
            ->limit(6)
            ->get()
            ->map(fn ($row) => ['label' => $row->label, 'value' => (int) $row->value])
            ->all();

        $peak = QueueTicket::query()
            ->selectRaw('HOUR(created_at) as h, COUNT(*) as value')
            ->where('queue_date', '>=', today()->subDays(30))
            ->groupBy('h')
            ->orderBy('h')
            ->get()
            ->map(fn ($row) => ['hour' => Carbon::createFromTime((int) $row->h)->format('gA'), 'value' => (int) $row->value])
            ->all();

        return ApiResponse::data([
            'total_visitors' => Visitor::query()->count(),
            'total_patients' => Patient::query()->count(),
            'in_queue' => QueueTicket::query()->whereDate('queue_date', today())->whereIn('status', ['waiting', 'called', 'serving'])->count(),
            'beds_occupied' => Bed::query()->where('status', 'occupied')->count(),
            'beds_total' => Bed::query()->count(),
            'peak_hours' => $peak,
            'purposes' => $purposes,
        ]);
    }

    public function daily(Request $request): JsonResponse
    {
        return ApiResponse::data($this->reports->dailySummary($this->date($request)));
    }

    public function dailyPdf(Request $request, string $type): Response
    {
        abort_unless(in_array($type, ReportService::DAILY_REPORTS, true), 404);
        $date = $this->date($request);

        $pdf = $this->buildDailyPdf($type, $date, $request->user()?->name ?? 'System');
        $this->log->audit($request->user(), 'Report Generated', ucfirst($type).' daily report', $date->toDateString());

        return $pdf->download("lumc-{$type}-daily-{$date->toDateString()}.pdf");
    }

    public function exportCsv(Request $request, string $dataset): StreamedResponse
    {
        abort_unless(in_array($dataset, ReportService::DATASETS, true), 404);
        $from = $request->filled('from') ? Carbon::parse($request->query('from')) : today();
        $to = $request->filled('to') ? Carbon::parse($request->query('to')) : $from->copy();
        if ($to->lt($from)) {
            [$from, $to] = [$to, $from];
        }

        $data = $this->reports->dataset($dataset, $from, $to);
        $this->log->audit($request->user(), 'Data Exported', "{$data['title']} (CSV)", "{$from->toDateString()} to {$to->toDateString()}");

        $filename = "lumc-{$dataset}-{$from->toDateString()}".($to->eq($from) ? '' : "-to-{$to->toDateString()}").'.csv';

        return response()->streamDownload(function () use ($data) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $data['columns']);
            foreach ($data['rows'] as $row) {
                fputcsv($out, array_map([$this, 'safeCell'], $row));
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function buildDailyPdf(string $type, Carbon $date, string $generatedBy): \Barryvdh\DomPDF\PDF
    {
        $summary = $this->reports->dailySummary($date);

        [$title, $stats, $sections] = match ($type) {
            'patients' => [
                'Daily Patient Report',
                [
                    'New patients' => $summary['patients']['new_patients'],
                    'OPD arrivals' => $summary['patients']['opd_arrivals'],
                    'Seen by doctor' => $summary['patients']['seen_by_doctor'],
                    'Still waiting' => $summary['patients']['still_waiting'],
                    'Admitted today' => $summary['patients']['admitted'],
                    'Discharged today' => $summary['patients']['discharged'],
                    'Currently admitted' => $summary['patients']['currently_admitted'],
                    'Beds available' => collect($summary['census'])->sum('available').' / '.collect($summary['census'])->sum('total'),
                ],
                [
                    [
                        'title' => 'Bed Availability by Ward',
                        'columns' => ['Ward', 'Total', 'Occupied', 'Available', 'Reserved', 'Unavailable'],
                        'rows' => array_map('array_values', $summary['census']),
                    ],
                    $this->reports->dataset('opd', $date, $date),
                    $this->reports->dataset('admissions', $date, $date),
                    $this->reports->dataset('patients', $date, $date),
                ],
            ],
            'visitors' => [
                'Daily Visitor Report',
                [
                    'Registered' => $summary['visitors']['registered'],
                    'Office visits' => $summary['visitors']['office_visits'],
                    'Patient visits' => $summary['visitors']['patient_visits'],
                    'Approved' => $summary['visitors']['approved'],
                    'Rejected' => $summary['visitors']['rejected'],
                    'Entered' => $summary['visitors']['entered'],
                    'Exited' => $summary['visitors']['exited'],
                    'Still inside' => $summary['visitors']['still_inside'],
                    'Vehicles parked' => $summary['visitors']['vehicles_parked'],
                ],
                [
                    $this->reports->dataset('visitors', $date, $date),
                    $this->reports->dataset('vehicles', $date, $date),
                ],
            ],
            'audit' => [
                'Daily Audit Log',
                ['Entries' => $summary['audit_entries']],
                [$this->reports->dataset('audit', $date, $date)],
            ],
        };

        return \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.daily', [
            'hospital' => \App\Models\Setting::text('hospital_name', 'La Union Medical Center'),
            'title' => $title,
            'date' => $date,
            'generatedBy' => $generatedBy,
            'summary' => $stats,
            'sections' => $sections,
        ])->setPaper('a4', 'landscape');
    }

    public function safeCell(mixed $value): mixed
    {
        if (is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@'], true)) {
            return "'".$value;
        }

        return $value;
    }

    private function date(Request $request): Carbon
    {
        return $request->filled('date') ? Carbon::parse($request->query('date')) : today();
    }
}
