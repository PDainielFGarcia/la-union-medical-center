-- Generated from MySQL `lumc` after migrate:fresh --seed.
-- Regenerate: mysqldump -uroot --no-data --compact lumc > database/schema.sql
-- Source of truth: backend/database/migrations/
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admission_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_id` bigint unsigned NOT NULL,
  `opd_encounter_id` bigint unsigned DEFAULT NULL,
  `bed_id` bigint unsigned DEFAULT NULL,
  `previous_bed_id` bigint unsigned DEFAULT NULL,
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Normal',
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'waiting_for_bed',
  `previous_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `undo_used` tinyint(1) NOT NULL DEFAULT '0',
  `admitted_at` timestamp NULL DEFAULT NULL,
  `discharged_at` timestamp NULL DEFAULT NULL,
  `admitted_by` bigint unsigned DEFAULT NULL,
  `discharged_by` bigint unsigned DEFAULT NULL,
  `discharge_notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admissions_admission_number_unique` (`admission_number`),
  KEY `admissions_patient_id_foreign` (`patient_id`),
  KEY `admissions_opd_encounter_id_foreign` (`opd_encounter_id`),
  KEY `admissions_bed_id_foreign` (`bed_id`),
  KEY `admissions_previous_bed_id_foreign` (`previous_bed_id`),
  KEY `admissions_admitted_by_foreign` (`admitted_by`),
  KEY `admissions_discharged_by_foreign` (`discharged_by`),
  KEY `admissions_status_index` (`status`),
  KEY `admissions_admitted_at_index` (`admitted_at`),
  KEY `admissions_discharged_at_index` (`discharged_at`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `user_name` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_label` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_foreign` (`user_id`),
  KEY `audit_logs_created_at_index` (`created_at`),
  KEY `audit_logs_action_index` (`action`)
) ENGINE=MyISAM AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bed_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `bed_id` bigint unsigned NOT NULL,
  `event_type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_id` bigint unsigned DEFAULT NULL,
  `admission_id` bigint unsigned DEFAULT NULL,
  `performed_by` bigint unsigned DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bed_events_patient_id_foreign` (`patient_id`),
  KEY `bed_events_admission_id_foreign` (`admission_id`),
  KEY `bed_events_performed_by_foreign` (`performed_by`),
  KEY `bed_events_bed_id_created_at_index` (`bed_id`,`created_at`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `beds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `bed_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ward_id` bigint unsigned NOT NULL,
  `room` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `current_patient_id` bigint unsigned DEFAULT NULL,
  `reserved_for` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `beds_bed_number_unique` (`bed_number`),
  KEY `beds_current_patient_id_foreign` (`current_patient_id`),
  KEY `beds_ward_id_status_index` (`ward_id`,`status`)
) ENGINE=MyISAM AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clinics` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clinics_name_unique` (`name`),
  UNIQUE KEY `clinics_code_unique` (`code`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secretary_user_id` bigint unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_name_unique` (`name`),
  UNIQUE KEY `departments_code_unique` (`code`),
  KEY `departments_secretary_user_id_foreign` (`secretary_user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `opd_encounter_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `assigned_by` bigint unsigned DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `doctor_assignments_doctor_id_foreign` (`doctor_id`),
  KEY `doctor_assignments_assigned_by_foreign` (`assigned_by`),
  KEY `doctor_assignments_opd_encounter_id_is_current_index` (`opd_encounter_id`,`is_current`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specialty` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `primary_clinic_id` bigint unsigned DEFAULT NULL,
  `schedule` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weekly_json` json DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `is_on_duty` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `doctors_user_id_foreign` (`user_id`),
  KEY `doctors_primary_clinic_id_foreign` (`primary_clinic_id`),
  KEY `doctors_is_on_duty_status_index` (`is_on_duty`,`status`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_queue_index` (`queue`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guardianables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `guardian_id` bigint unsigned NOT NULL,
  `guardianable_type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guardianable_id` bigint unsigned NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `guardianables_unique` (`guardian_id`,`guardianable_type`,`guardianable_id`),
  KEY `guardianables_guardianable_type_guardianable_id_index` (`guardianable_type`,`guardianable_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guardians` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_type` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_number` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `guardians_full_name_index` (`full_name`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `role` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_foreign` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opd_encounters` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `encounter_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_id` bigint unsigned NOT NULL,
  `clinic_id` bigint unsigned NOT NULL,
  `registration_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'existing',
  `chief_complaint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'registered',
  `registered_by` bigint unsigned DEFAULT NULL,
  `seen_by_doctor_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `opd_encounters_encounter_number_unique` (`encounter_number`),
  KEY `opd_encounters_patient_id_foreign` (`patient_id`),
  KEY `opd_encounters_clinic_id_foreign` (`clinic_id`),
  KEY `opd_encounters_registered_by_foreign` (`registered_by`),
  KEY `opd_encounters_status_index` (`status`),
  KEY `opd_encounters_created_at_index` (`created_at`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parking_areas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `parking_areas_name_unique` (`name`),
  UNIQUE KEY `parking_areas_code_unique` (`code`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `login` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`login`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthday` date NOT NULL,
  `sex` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `complete_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_number` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `civil_status` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `religion` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `philhealth_number` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spouse_name` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_name` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_name` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patients_patient_id_unique` (`patient_id`),
  KEY `patients_last_name_first_name_index` (`last_name`,`first_name`),
  KEY `patients_contact_number_index` (`contact_number`),
  KEY `patients_birthday_index` (`birthday`),
  KEY `patients_philhealth_number_index` (`philhealth_number`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queues` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue_date` date NOT NULL,
  `opd_encounter_id` bigint unsigned DEFAULT NULL,
  `clinic_id` bigint unsigned NOT NULL,
  `patient_id` bigint unsigned DEFAULT NULL,
  `doctor_id` bigint unsigned DEFAULT NULL,
  `patient_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'waiting',
  `previous_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `undo_used` tinyint(1) NOT NULL DEFAULT '0',
  `called_at` timestamp NULL DEFAULT NULL,
  `served_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `wait_seconds` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `queues_clinic_date_number_unique` (`clinic_id`,`queue_date`,`queue_number`),
  KEY `queues_opd_encounter_id_foreign` (`opd_encounter_id`),
  KEY `queues_patient_id_foreign` (`patient_id`),
  KEY `queues_doctor_id_foreign` (`doctor_id`),
  KEY `queues_clinic_id_status_queue_date_index` (`clinic_id`,`status`,`queue_date`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rejection_reasons` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applies_to` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'both',
  `allows_custom_text` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rejection_reasons_code_unique` (`code`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `setting_key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` json DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `triage_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `opd_encounter_id` bigint unsigned NOT NULL,
  `nurse_user_id` bigint unsigned DEFAULT NULL,
  `cough` tinyint(1) NOT NULL DEFAULT '0',
  `fever` tinyint(1) NOT NULL DEFAULT '0',
  `runny_nose` tinyint(1) NOT NULL DEFAULT '0',
  `vomiting_diarrhea` tinyint(1) NOT NULL DEFAULT '0',
  `loss_taste_smell` tinyint(1) NOT NULL DEFAULT '0',
  `body_aches` tinyint(1) NOT NULL DEFAULT '0',
  `difficulty_breathing` tinyint(1) NOT NULL DEFAULT '0',
  `sore_throat` tinyint(1) NOT NULL DEFAULT '0',
  `symptom_duration` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `covid_exposure` tinyint(1) NOT NULL DEFAULT '0',
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `screened_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `triage_records_opd_encounter_id_unique` (`opd_encounter_id`),
  KEY `triage_records_nurse_user_id_foreign` (`nurse_user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `login` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_number` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_login_unique` (`login`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_status_index` (`role`,`status`),
  KEY `users_contact_number_index` (`contact_number`),
  KEY `users_department_id_foreign` (`department_id`)
) ENGINE=MyISAM AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `vehicle_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plate_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'visitor',
  `visitor_id` bigint unsigned DEFAULT NULL,
  `patient_id` bigint unsigned DEFAULT NULL,
  `parking_area_id` bigint unsigned DEFAULT NULL,
  `slot_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entry_time` datetime DEFAULT NULL,
  `exit_time` datetime DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'parked',
  `recorded_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicles_vehicle_number_unique` (`vehicle_number`),
  KEY `vehicles_visitor_id_foreign` (`visitor_id`),
  KEY `vehicles_patient_id_foreign` (`patient_id`),
  KEY `vehicles_recorded_by_foreign` (`recorded_by`),
  KEY `vehicles_plate_number_index` (`plate_number`),
  KEY `vehicles_parking_area_id_status_index` (`parking_area_id`,`status`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitor_scan_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `visitor_id` bigint unsigned NOT NULL,
  `scan_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_by` bigint unsigned DEFAULT NULL,
  `result` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'allowed',
  `rejection_reason_id` bigint unsigned DEFAULT NULL,
  `rejection_notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scanned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `visitor_scan_events_scanned_by_foreign` (`scanned_by`),
  KEY `visitor_scan_events_rejection_reason_id_foreign` (`rejection_reason_id`),
  KEY `visitor_scan_events_visitor_id_scan_type_index` (`visitor_id`,`scan_type`),
  KEY `visitor_scan_events_scanned_at_index` (`scanned_at`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `pass_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` int DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_number` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_type` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_number` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purpose` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visit_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'office',
  `department_id` bigint unsigned DEFAULT NULL,
  `person_to_visit` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admission_id` bigint unsigned DEFAULT NULL,
  `patient_id` bigint unsigned DEFAULT NULL,
  `ward_id` bigint unsigned DEFAULT NULL,
  `visit_location` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visit_date` date NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_approval',
  `registered_by` bigint unsigned DEFAULT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_remarks` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_reason_id` bigint unsigned DEFAULT NULL,
  `rejection_notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_token` char(48) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_generated_at` timestamp NULL DEFAULT NULL,
  `qr_expires_at` datetime DEFAULT NULL,
  `entry_scanned_at` timestamp NULL DEFAULT NULL,
  `exit_scanned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `visitors_pass_id_unique` (`pass_id`),
  UNIQUE KEY `visitors_qr_token_unique` (`qr_token`),
  KEY `visitors_registered_by_foreign` (`registered_by`),
  KEY `visitors_reviewed_by_foreign` (`reviewed_by`),
  KEY `visitors_rejection_reason_id_foreign` (`rejection_reason_id`),
  KEY `visitors_department_id_status_index` (`department_id`,`status`),
  KEY `visitors_visit_date_status_index` (`visit_date`,`status`),
  KEY `visitors_admission_id_foreign` (`admission_id`),
  KEY `visitors_patient_id_foreign` (`patient_id`),
  KEY `visitors_ward_id_foreign` (`ward_id`),
  KEY `visitors_visit_type_visit_date_index` (`visit_type`,`visit_date`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wards_name_unique` (`name`),
  UNIQUE KEY `wards_code_unique` (`code`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

