<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('code', 40)->nullable()->unique();
            $table->foreignId('secretary_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('role')->constrained('departments')->nullOnDelete();
        });

        Schema::create('clinics', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('code', 20)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('rejection_reasons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('label', 160);
            $table->string('applies_to', 30)->default('both');
            $table->boolean('allows_custom_text')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 120);
            $table->string('specialty', 80);
            $table->foreignId('primary_clinic_id')->nullable()->constrained('clinics')->nullOnDelete();
            $table->string('schedule', 120)->nullable();
            $table->json('weekly_json')->nullable();
            $table->string('status', 30)->default('available');
            $table->boolean('is_on_duty')->default(false);
            $table->timestamps();

            $table->index(['is_on_duty', 'status']);
        });

        Schema::create('guardians', function (Blueprint $table) {
            $table->id();
            $table->string('full_name', 160);
            $table->string('relationship', 80)->nullable();
            $table->string('contact_number', 11)->nullable();
            $table->string('id_type', 80)->nullable();
            $table->string('id_number', 80)->nullable();
            $table->string('address', 255)->nullable();
            $table->timestamps();

            $table->index('full_name');
        });

        Schema::create('guardianables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->string('guardianable_type', 40);
            $table->unsignedBigInteger('guardianable_id');
            $table->boolean('is_primary')->default(true);
            $table->timestamps();

            $table->unique(['guardian_id', 'guardianable_type', 'guardianable_id'], 'guardianables_unique');
            $table->index(['guardianable_type', 'guardianable_id']);
        });

        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id', 40)->unique();
            $table->string('last_name', 80);
            $table->string('first_name', 80);
            $table->string('middle_name', 80)->nullable();
            $table->date('birthday');
            $table->string('sex', 20);
            $table->string('complete_address', 255);
            $table->string('contact_number', 11)->nullable();
            $table->string('civil_status', 40)->nullable();
            $table->string('nationality', 80)->nullable();
            $table->string('religion', 80)->nullable();
            $table->string('philhealth_number', 40)->nullable();
            $table->string('spouse_name', 160)->nullable();
            $table->string('father_name', 160)->nullable();
            $table->string('mother_name', 160)->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();

            $table->index(['last_name', 'first_name']);
            $table->index('contact_number');
            $table->index('birthday');
            $table->index('philhealth_number');
        });

        Schema::create('opd_encounters', function (Blueprint $table) {
            $table->id();
            $table->string('encounter_number', 30)->unique();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('clinic_id')->constrained('clinics');
            $table->string('registration_type', 20)->default('existing');
            $table->string('chief_complaint', 255)->nullable();
            $table->string('status', 30)->default('registered');
            $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('seen_by_doctor_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
        });

        Schema::create('triage_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opd_encounter_id')->unique()->constrained('opd_encounters')->cascadeOnDelete();
            $table->foreignId('nurse_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('cough')->default(false);
            $table->boolean('fever')->default(false);
            $table->boolean('runny_nose')->default(false);
            $table->boolean('vomiting_diarrhea')->default(false);
            $table->boolean('loss_taste_smell')->default(false);
            $table->boolean('body_aches')->default(false);
            $table->boolean('difficulty_breathing')->default(false);
            $table->boolean('sore_throat')->default(false);
            $table->string('symptom_duration', 80)->nullable();
            $table->boolean('covid_exposure')->default(false);
            $table->string('notes', 500)->nullable();
            $table->timestamp('screened_at')->nullable();
            $table->timestamps();
        });

        Schema::create('doctor_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opd_encounter_id')->constrained('opd_encounters')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->boolean('is_current')->default(true);
            $table->timestamps();

            $table->index(['opd_encounter_id', 'is_current']);
        });

        Schema::create('queues', function (Blueprint $table) {
            $table->id();
            $table->string('queue_number', 30);
            $table->date('queue_date');
            $table->foreignId('opd_encounter_id')->nullable()->constrained('opd_encounters')->nullOnDelete();
            $table->foreignId('clinic_id')->constrained('clinics');
            $table->foreignId('patient_id')->nullable()->constrained('patients')->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->nullOnDelete();
            $table->string('patient_name', 160);
            $table->string('status', 30)->default('waiting');
            $table->string('previous_status', 30)->nullable();
            $table->boolean('undo_used')->default(false);
            $table->timestamp('called_at')->nullable();
            $table->timestamp('served_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('wait_seconds')->nullable();
            $table->timestamps();

            $table->unique(['clinic_id', 'queue_date', 'queue_number'], 'queues_clinic_date_number_unique');
            $table->index(['clinic_id', 'status', 'queue_date']);
        });

        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->string('pass_id', 20)->unique();
            $table->string('first_name', 80);
            $table->string('middle_name', 80);
            $table->string('last_name', 80);
            $table->string('full_name', 160);
            $table->integer('age')->nullable();
            $table->string('address', 255)->nullable();
            $table->string('contact_number', 11)->nullable();
            $table->string('id_type', 80)->nullable();
            $table->string('id_number', 80)->nullable();
            $table->string('purpose', 120)->nullable();
            $table->string('visit_type', 20)->default('office');
            $table->foreignId('department_id')->nullable()->constrained('departments');
            $table->string('person_to_visit', 160)->nullable();
            $table->date('visit_date');
            $table->string('status', 30)->default('pending_approval');
            $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('review_remarks', 255)->nullable();
            $table->foreignId('rejection_reason_id')->nullable()->constrained('rejection_reasons')->nullOnDelete();
            $table->string('rejection_notes', 255)->nullable();
            $table->char('qr_token', 48)->nullable()->unique();
            $table->timestamp('qr_generated_at')->nullable();
            $table->dateTime('qr_expires_at')->nullable();
            $table->timestamp('entry_scanned_at')->nullable();
            $table->timestamp('exit_scanned_at')->nullable();
            $table->timestamps();

            $table->index(['department_id', 'status']);
            $table->index(['visit_date', 'status']);
        });

        Schema::create('visitor_scan_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visitor_id')->constrained('visitors')->cascadeOnDelete();
            $table->string('scan_type', 10);
            $table->foreignId('scanned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('result', 20)->default('allowed');
            $table->foreignId('rejection_reason_id')->nullable()->constrained('rejection_reasons')->nullOnDelete();
            $table->string('rejection_notes', 255)->nullable();
            $table->timestamp('scanned_at')->useCurrent();
            $table->timestamps();

            $table->index(['visitor_id', 'scan_type']);
            $table->index('scanned_at');
        });

        Schema::create('wards', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('code', 20)->unique();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('beds', function (Blueprint $table) {
            $table->id();
            $table->string('bed_number', 30)->unique();
            $table->foreignId('ward_id')->constrained('wards');
            $table->string('room', 40);
            $table->string('room_type', 20);
            $table->string('status', 30)->default('available');
            $table->foreignId('current_patient_id')->nullable()->constrained('patients')->nullOnDelete();
            $table->string('reserved_for', 160)->nullable();
            $table->timestamps();

            $table->index(['ward_id', 'status']);
        });

        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->string('admission_number', 30)->unique();
            $table->foreignId('patient_id')->constrained('patients');
            $table->foreignId('opd_encounter_id')->nullable()->constrained('opd_encounters')->nullOnDelete();
            $table->foreignId('bed_id')->nullable()->constrained('beds')->nullOnDelete();
            $table->foreignId('previous_bed_id')->nullable()->constrained('beds')->nullOnDelete();
            $table->string('priority', 20)->default('Normal');
            $table->string('reason', 255)->nullable();
            $table->string('status', 30)->default('waiting_for_bed');
            $table->string('previous_status', 30)->nullable();
            $table->boolean('undo_used')->default(false);
            $table->timestamp('admitted_at')->nullable();
            $table->timestamp('discharged_at')->nullable();
            $table->foreignId('admitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('discharged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('discharge_notes', 255)->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('admitted_at');
            $table->index('discharged_at');
        });

        Schema::create('bed_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bed_id')->constrained('beds')->cascadeOnDelete();
            $table->string('event_type', 40);
            $table->foreignId('patient_id')->nullable()->constrained('patients')->nullOnDelete();
            $table->foreignId('admission_id')->nullable()->constrained('admissions')->nullOnDelete();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->index(['bed_id', 'created_at']);
        });

        // Patient visits: the guard checks the patient is admitted and approves at the gate.
        Schema::table('visitors', function (Blueprint $table) {
            $table->foreignId('admission_id')->nullable()->after('person_to_visit')->constrained('admissions')->nullOnDelete();
            $table->foreignId('patient_id')->nullable()->after('admission_id')->constrained('patients')->nullOnDelete();
            $table->foreignId('ward_id')->nullable()->after('patient_id')->constrained('wards')->nullOnDelete();
            $table->string('visit_location', 120)->nullable()->after('ward_id');
            $table->index(['visit_type', 'visit_date']);
        });

        Schema::create('parking_areas', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('code', 20)->unique();
            $table->unsignedInteger('capacity')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('vehicle_number', 20)->unique();
            $table->string('plate_number', 30);
            $table->string('type', 40)->nullable();
            $table->string('color', 40)->nullable();
            $table->string('owner', 160)->nullable();
            $table->string('owner_type', 20)->default('visitor');
            $table->foreignId('visitor_id')->nullable()->constrained('visitors')->nullOnDelete();
            $table->foreignId('patient_id')->nullable()->constrained('patients')->nullOnDelete();
            $table->foreignId('parking_area_id')->nullable()->constrained('parking_areas')->nullOnDelete();
            $table->string('slot_number', 20)->nullable();
            $table->dateTime('entry_time')->nullable();
            $table->dateTime('exit_time')->nullable();
            $table->string('status', 20)->default('parked');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('plate_number');
            $table->index(['parking_area_id', 'status']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('role', 40)->nullable();
            $table->string('title', 160);
            $table->string('body', 255);
            $table->string('link', 160)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name', 160)->nullable();
            $table->string('role', 40)->nullable();
            $table->string('action', 80);
            $table->string('record_label', 190)->nullable();
            $table->string('status', 40)->nullable();
            $table->string('details', 255)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('created_at');
            $table->index('action');
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('setting_key', 80)->primary();
            $table->json('setting_value')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('parking_areas');
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropConstrainedForeignId('admission_id');
            $table->dropConstrainedForeignId('patient_id');
            $table->dropConstrainedForeignId('ward_id');
        });
        Schema::dropIfExists('bed_events');
        Schema::dropIfExists('admissions');
        Schema::dropIfExists('beds');
        Schema::dropIfExists('wards');
        Schema::dropIfExists('visitor_scan_events');
        Schema::dropIfExists('visitors');
        Schema::dropIfExists('queues');
        Schema::dropIfExists('doctor_assignments');
        Schema::dropIfExists('triage_records');
        Schema::dropIfExists('opd_encounters');
        Schema::dropIfExists('patients');
        Schema::dropIfExists('guardianables');
        Schema::dropIfExists('guardians');
        Schema::dropIfExists('doctors');
        Schema::dropIfExists('rejection_reasons');
        Schema::dropIfExists('clinics');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
        });
        Schema::dropIfExists('departments');
    }
};
