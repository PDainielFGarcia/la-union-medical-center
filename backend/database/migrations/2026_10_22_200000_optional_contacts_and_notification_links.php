<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE users MODIFY contact_number VARCHAR(11) NULL');
        DB::statement('ALTER TABLE visitors MODIFY middle_name VARCHAR(80) NULL');
        DB::statement('ALTER TABLE visitors MODIFY contact_number VARCHAR(11) NULL');

        if (! Schema::hasColumn('notifications', 'link')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->string('link', 160)->nullable()->after('body');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('notifications', 'link')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropColumn('link');
            });
        }

        DB::statement('ALTER TABLE visitors MODIFY middle_name VARCHAR(80) NOT NULL');
        DB::statement('ALTER TABLE visitors MODIFY contact_number VARCHAR(11) NOT NULL');
        DB::statement('ALTER TABLE users MODIFY contact_number VARCHAR(11) NOT NULL');
    }
};
