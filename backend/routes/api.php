<?php

use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\BedController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ParkingAreaController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VisitorController;
use Illuminate\Support\Facades\Route;

// The "role" middleware always lets administrators through.

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    Route::get('/dashboard', [DashboardController::class, 'show']);
    Route::get('/search', [DashboardController::class, 'search']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markOneRead']);

    Route::get('/departments', [CatalogController::class, 'departments']);
    Route::get('/clinics', [CatalogController::class, 'clinics']);
    Route::get('/rejection-reasons', [CatalogController::class, 'rejectionReasons']);
    Route::get('/parking-areas', [ParkingAreaController::class, 'index']);

    // Visitors: guard registers and scans; department secretary approves or rejects.
    Route::middleware('role:security_guard,department_secretary')->group(function () {
        Route::get('/visitors', [VisitorController::class, 'index']);
        Route::get('/visitors/{visitor}/pass', [VisitorController::class, 'pass']);
        Route::get('/visitors/{visitor}/scans', [VisitorController::class, 'scans']);
    });
    Route::middleware('role:security_guard')->group(function () {
        Route::get('/inpatients', [VisitorController::class, 'inpatients']);
        Route::post('/visitors', [VisitorController::class, 'store']);
        Route::post('/visitor-passes/scan', [VisitorController::class, 'scanToken']);
        Route::post('/visitors/{visitor}/scan', [VisitorController::class, 'manualScan']);
        Route::post('/visitors/{visitor}/gate-reject', [VisitorController::class, 'gateReject']);
        Route::post('/visitors/{visitor}/cancel', [VisitorController::class, 'cancel']);
    });
    // Office visits: that office's secretary. Patient visits: the guard (checked in VisitorService::canReview).
    Route::middleware('role:department_secretary,security_guard')->group(function () {
        Route::post('/visitors/{visitor}/approve', [VisitorController::class, 'approve']);
        Route::post('/visitors/{visitor}/reject', [VisitorController::class, 'reject']);
    });

    // Patients and OPD
    // opd_staff covers both OPD registration and admissions.
    Route::middleware('role:opd_staff,nursing_staff,doctor')->group(function () {
        Route::get('/patients', [PatientController::class, 'index']);
        Route::get('/patients/{patient}', [PatientController::class, 'show']);
        Route::get('/opd-registrations', [PatientController::class, 'opdList']);
        Route::get('/queues', [QueueController::class, 'index']);
        Route::get('/doctors', [DoctorController::class, 'index']);
    });
    Route::middleware('role:opd_staff')->group(function () {
        Route::post('/patients', [PatientController::class, 'store']);
        Route::put('/patients/{patient}', [PatientController::class, 'update']);
        Route::post('/opd-registrations', [PatientController::class, 'registerOpd']);
        Route::post('/queues/{queue}/cancel', [QueueController::class, 'cancel']);
    });
    Route::middleware('role:opd_staff,nursing_staff')->group(function () {
        Route::post('/opd-encounters/{opdEncounter}/triage', [PatientController::class, 'triage']);
    });
    Route::middleware('role:opd_staff,doctor,nursing_staff')->group(function () {
        Route::post('/queues/{queue}/call', [QueueController::class, 'call']);
        Route::post('/queues/{queue}/serve', [QueueController::class, 'serve']);
        Route::post('/queues/{queue}/done', [QueueController::class, 'done']);
        Route::post('/queues/{queue}/skip', [QueueController::class, 'skip']);
        Route::post('/queues/{queue}/undo', [QueueController::class, 'undo']);
    });
    // OPD & Admission (and admin) assign/reassign doctors to clinics.
    Route::get('/doctors/assignable-users', [DoctorController::class, 'assignableUsers'])->middleware('role:opd_staff');
    Route::post('/doctors', [DoctorController::class, 'store'])->middleware('role:opd_staff');
    Route::put('/doctors/{doctor}', [DoctorController::class, 'update'])->middleware('role:opd_staff,doctor');

    // Beds and admissions: nurses and doctors can view; only OPD & admission staff change them.
    Route::middleware('role:opd_staff,nursing_staff,doctor')->group(function () {
        Route::get('/beds', [BedController::class, 'index']);
        Route::get('/wards', [BedController::class, 'wards']);
        Route::get('/admissions', [AdmissionController::class, 'index']);
        Route::get('/bed-events', [BedController::class, 'events']);
    });
    Route::middleware('role:opd_staff')->group(function () {
        Route::post('/beds/{bed}/reserve', [BedController::class, 'reserve']);
        Route::post('/beds/{bed}/status', [BedController::class, 'updateStatus']);
        Route::post('/admissions', [AdmissionController::class, 'store']);
        Route::post('/admissions/{admission}/assign', [AdmissionController::class, 'assign']);
        Route::post('/admissions/{admission}/discharge', [AdmissionController::class, 'discharge']);
        Route::post('/admissions/{admission}/undo', [AdmissionController::class, 'undo']);
    });

    // Guards only see visitor and vehicle entries (filtered in the controller).
    Route::get('/audit-logs', [AuditController::class, 'index'])->middleware('role:security_guard');

    // Parking
    Route::middleware('role:security_guard,opd_staff')->group(function () {
        Route::get('/vehicles', [VehicleController::class, 'index']);
        Route::post('/vehicles', [VehicleController::class, 'store']);
        Route::post('/vehicles/{vehicle}/exit', [VehicleController::class, 'exit']);
    });

    // Administration, reports, exports, backups
    Route::middleware('role:administrator')->group(function () {
        Route::post('/parking-areas', [ParkingAreaController::class, 'store']);
        Route::put('/parking-areas/{parkingArea}', [ParkingAreaController::class, 'update']);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);

        Route::get('/reports/summary', [ReportController::class, 'summary']);
        Route::get('/reports/daily', [ReportController::class, 'daily']);
        Route::get('/reports/daily/{type}.pdf', [ReportController::class, 'dailyPdf']);
        Route::get('/exports/{dataset}.csv', [ReportController::class, 'exportCsv']);

        Route::get('/backups', [BackupController::class, 'index']);
        Route::post('/backups', [BackupController::class, 'store']);
        Route::get('/backups/{name}', [BackupController::class, 'download'])->where('name', '[A-Za-z0-9_\-\.]+');

        Route::put('/settings', [SettingsController::class, 'update']);
    });
    Route::get('/settings', [SettingsController::class, 'show']);
});
