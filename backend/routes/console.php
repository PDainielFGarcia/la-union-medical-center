<?php

use App\Http\Controllers\Api\ReportController;
use App\Services\ActivityLogger;
use App\Services\BackupService;
use App\Services\ReportService;
use App\Services\VisitorService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schedule;

Artisan::command('lumc:backup', function (BackupService $backups, ActivityLogger $log) {
    try {
        $file = $backups->run();
    } catch (Throwable $e) {
        $log->audit(null, 'Backup Failed', 'Database backup', $e->getMessage(), 'Failed');
        $this->error($e->getMessage());

        return 1;
    }

    $pruned = $backups->prune();
    $log->audit(null, 'Backup Created', $file['name'], "Pruned {$pruned} old backup(s)");
    $this->info("Backup written: {$file['name']} ({$file['size']} bytes). Pruned {$pruned} old file(s).");

    return 0;
})->purpose('Dump the LUMC database to storage/app/backups (gzipped) and prune old backups');

Artisan::command('lumc:daily-reports {date?}', function (?string $date = null) {
    $day = $date ? Carbon::parse($date) : Carbon::yesterday();
    $dir = storage_path('app/reports/'.$day->toDateString());
    File::ensureDirectoryExists($dir);

    $controller = app(ReportController::class);
    foreach (ReportService::DAILY_REPORTS as $type) {
        $path = "{$dir}/lumc-{$type}-daily-{$day->toDateString()}.pdf";
        $controller->buildDailyPdf($type, $day, 'Scheduled job')->save($path);
        $this->info("Saved {$path}");
    }
})->purpose('Generate the daily patient, visitor, and audit PDF reports');

Artisan::command('lumc:expire-visits', function (VisitorService $visitors) {
    $visitors->expireStale();
})->purpose('Expire unused visitor passes from previous days');

Schedule::command('lumc:expire-visits')->dailyAt('00:05');
Schedule::command('lumc:daily-reports')->dailyAt('00:15');
Schedule::command('lumc:backup')->dailyAt(config('backup.schedule_time'));
