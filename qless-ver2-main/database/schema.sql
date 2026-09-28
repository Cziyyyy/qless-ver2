-- Q-LESS: Digital Queueing and Appointment System for Mapúa
-- Database Schema for Turso / LibSQL / SQLite

DROP TABLE IF EXISTS `ratings`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `queue_events`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `queue_tickets`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `professors`;
DROP TABLE IF EXISTS `service_offices`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `users`;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT NOT NULL,
  `code` TEXT NOT NULL UNIQUE,
  `description` TEXT NULL,
  `status` TEXT DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Service Offices Table
CREATE TABLE IF NOT EXISTS `service_offices` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT NOT NULL,
  `prefix` TEXT NOT NULL UNIQUE,
  `description` TEXT NULL,
  `icon_name` TEXT DEFAULT 'Building2',
  `status` TEXT DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT NOT NULL,
  `email` TEXT NOT NULL UNIQUE,
  `password_hash` TEXT NOT NULL,
  `role` TEXT NOT NULL,
  `student_number` TEXT NULL UNIQUE,
  `department_id` INTEGER NULL REFERENCES `departments` (`id`) ON DELETE SET NULL,
  `service_office_id` INTEGER NULL REFERENCES `service_offices` (`id`) ON DELETE SET NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Professors Table
CREATE TABLE IF NOT EXISTS `professors` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `department_id` INTEGER NOT NULL REFERENCES `departments` (`id`) ON DELETE CASCADE,
  `name` TEXT NOT NULL,
  `email` TEXT NULL,
  `specialization` TEXT NULL,
  `status` TEXT DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Services Table (Supports sub-services via parent_id)
CREATE TABLE IF NOT EXISTS `services` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `service_office_id` INTEGER NOT NULL REFERENCES `service_offices` (`id`) ON DELETE CASCADE,
  `name` TEXT NOT NULL,
  `parent_id` INTEGER NULL REFERENCES `services` (`id`) ON DELETE CASCADE,
  `estimated_minutes` INTEGER DEFAULT 15,
  `status` TEXT DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Queue Tickets Table
CREATE TABLE IF NOT EXISTS `queue_tickets` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `ticket_code` TEXT NOT NULL UNIQUE,
  `queue_number` TEXT NOT NULL,
  `student_id` INTEGER NULL REFERENCES `users` (`id`) ON DELETE SET NULL,
  `student_identifier` TEXT NOT NULL,
  `student_name` TEXT NULL,
  `instructor_name` TEXT NULL,
  `department_name` TEXT NULL,
  `concern_details` TEXT NULL,
  `service_office_id` INTEGER NOT NULL REFERENCES `service_offices` (`id`) ON DELETE CASCADE,
  `service_id` INTEGER NOT NULL REFERENCES `services` (`id`) ON DELETE CASCADE,
  `status` TEXT DEFAULT 'WAITING',
  `queue_date` TEXT NOT NULL,
  `sequence_number` INTEGER NOT NULL,
  `estimated_wait_minutes` INTEGER DEFAULT 15,
  `called_at` DATETIME NULL,
  `serving_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Appointments Table
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `appointment_code` TEXT NOT NULL UNIQUE,
  `appointment_number` TEXT NULL,
  `student_id` INTEGER NOT NULL REFERENCES `users` (`id`) ON DELETE CASCADE,
  `student_number` TEXT NULL,
  `department_id` INTEGER NOT NULL REFERENCES `departments` (`id`) ON DELETE CASCADE,
  `department_name` TEXT NULL,
  `concern_type` TEXT NOT NULL,
  `details` TEXT NULL,
  `professor_id` INTEGER NULL REFERENCES `professors` (`id`) ON DELETE SET NULL,
  `instructor_name` TEXT NULL,
  `appointment_date` TEXT NOT NULL,
  `preferred_date` TEXT NULL,
  `appointment_time` TEXT NOT NULL,
  `notes` TEXT NULL,
  `status` TEXT DEFAULT 'PENDING',
  `rejection_reason` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Queue Events Table (Audit log for queue state changes)
CREATE TABLE IF NOT EXISTS `queue_events` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `queue_ticket_id` INTEGER NOT NULL REFERENCES `queue_tickets` (`id`) ON DELETE CASCADE,
  `event_type` TEXT NOT NULL,
  `actor_id` INTEGER NULL REFERENCES `users` (`id`) ON DELETE SET NULL,
  `details` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` INTEGER NOT NULL REFERENCES `users` (`id`) ON DELETE CASCADE,
  `title` TEXT NOT NULL,
  `message` TEXT NOT NULL,
  `type` TEXT DEFAULT 'SYSTEM',
  `is_read` INTEGER DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Ratings Table
CREATE TABLE IF NOT EXISTS `ratings` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `ticket_id` INTEGER NULL,
  `appointment_id` INTEGER NULL,
  `student_id` INTEGER NOT NULL REFERENCES `users` (`id`) ON DELETE CASCADE,
  `office_or_dept` TEXT NOT NULL,
  `rating` INTEGER NOT NULL,
  `feedback` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

