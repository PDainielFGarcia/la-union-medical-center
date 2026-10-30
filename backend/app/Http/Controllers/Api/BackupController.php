<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use App\Services\BackupService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class BackupController extends Controller
{
    public function __construct(private BackupService $backups, private ActivityLogger $log) {}

    public function index(): JsonResponse
    {
        return ApiResponse::data($this->backups->list());
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $file = $this->backups->run();
        } catch (Throwable $e) {
            $this->log->audit($request->user(), 'Backup Failed', 'Database backup', $e->getMessage(), 'Failed');

            return ApiResponse::message('Backup failed: '.$e->getMessage(), 500);
        }

        $this->backups->prune();
        $this->log->audit($request->user(), 'Backup Created', $file['name'], 'Manual backup');

        return ApiResponse::data($file, 201);
    }

    public function download(Request $request, string $name): BinaryFileResponse|JsonResponse
    {
        $path = $this->backups->path($name);
        if (! $path) {
            return ApiResponse::message('Backup not found.', 404);
        }

        $this->log->audit($request->user(), 'Backup Downloaded', $name);

        return response()->download($path, $name, ['Content-Type' => 'application/gzip']);
    }
}
