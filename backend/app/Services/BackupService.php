<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;

class BackupService
{
    public function directory(): string
    {
        $dir = config('backup.path');
        File::ensureDirectoryExists($dir);

        return $dir;
    }

    /**
     * Dumps the database with mysqldump and gzips it.
     *
     * @return array{name: string, size: int, created_at: string}
     */
    public function run(): array
    {
        $db = config('database.connections.mysql');
        $name = 'lumc-'.now()->format('Y-m-d_His').'.sql.gz';
        $sqlPath = $this->directory().DIRECTORY_SEPARATOR.substr($name, 0, -3);

        $process = new Process([
            config('backup.mysqldump'),
            '--host='.$db['host'],
            '--port='.$db['port'],
            '--user='.$db['username'],
            '--single-transaction',
            '--routines',
            '--triggers',
            '--default-character-set=utf8mb4',
            '--result-file='.$sqlPath,
            $db['database'],
        ], null, [
            'MYSQL_PWD' => (string) $db['password'],
            // Winsock cannot initialise without SystemRoot; `artisan serve` workers do not inherit it.
            'SystemRoot' => getenv('SystemRoot') ?: 'C:\\Windows',
        ]);
        $process->setTimeout(600);
        $process->run();

        if (! $process->isSuccessful() || ! is_file($sqlPath)) {
            @unlink($sqlPath);
            throw new RuntimeException('mysqldump failed: '.trim($process->getErrorOutput() ?: $process->getOutput()));
        }

        $gzPath = $sqlPath.'.gz';
        $in = fopen($sqlPath, 'rb');
        $out = gzopen($gzPath, 'wb6');
        while (! feof($in)) {
            gzwrite($out, fread($in, 1024 * 512));
        }
        fclose($in);
        gzclose($out);
        unlink($sqlPath);

        $this->copyOffsite($gzPath);

        return $this->describe($gzPath);
    }

    public function prune(): int
    {
        $days = (int) (Setting::get('backup_retention_days')['days'] ?? 30);
        $cutoff = now()->subDays($days)->getTimestamp();
        $deleted = 0;

        foreach ($this->files() as $file) {
            if (filemtime($file) < $cutoff) {
                unlink($file);
                $deleted++;
            }
        }

        return $deleted;
    }

    public function list(): array
    {
        return collect($this->files())
            ->sortByDesc(fn ($f) => filemtime($f))
            ->map(fn ($f) => $this->describe($f))
            ->values()
            ->all();
    }

    public function path(string $name): ?string
    {
        if (! preg_match('/^lumc-[0-9_\-]+\.sql\.gz$/', $name)) {
            return null;
        }
        $path = $this->directory().DIRECTORY_SEPARATOR.$name;

        return is_file($path) ? $path : null;
    }

    private function copyOffsite(string $path): void
    {
        $target = config('backup.offsite_path');
        if (! $target) {
            return;
        }
        File::ensureDirectoryExists($target);
        File::copy($path, rtrim($target, '\\/').DIRECTORY_SEPARATOR.basename($path));
    }

    private function files(): array
    {
        return glob($this->directory().DIRECTORY_SEPARATOR.'lumc-*.sql.gz') ?: [];
    }

    private function describe(string $path): array
    {
        return [
            'name' => basename($path),
            'size' => filesize($path),
            'created_at' => Carbon::createFromTimestamp(filemtime($path), config('app.timezone'))->toIso8601String(),
        ];
    }
}
