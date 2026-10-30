<?php

return [
    'mysqldump' => env('BACKUP_MYSQLDUMP_PATH', 'mysqldump'),

    'path' => env('BACKUP_PATH', storage_path('app/backups')),

    // Second copy (external drive, NAS share, or a synced Google Drive folder).
    'offsite_path' => env('BACKUP_OFFSITE_PATH'),

    'schedule_time' => env('BACKUP_TIME', '02:00'),
];
