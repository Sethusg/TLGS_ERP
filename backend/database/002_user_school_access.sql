-- Non-destructive incremental migration for Dynamic User-School-Campus Access & Parent-Student Links
-- Preserves all existing TLGS-ERP tables and records.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS access_scope ENUM('all_schools', 'single_school', 'selected_schools') NOT NULL DEFAULT 'single_school',
  ADD COLUMN IF NOT EXISTS created_by_id BIGINT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS role_assigned_by_id BIGINT UNSIGNED NULL;

CREATE TABLE IF NOT EXISTS user_school_access (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  organization_id BIGINT UNSIGNED NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  campus_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  assigned_by_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_school_campus_access (user_id, school_id, campus_id),
  INDEX idx_usa_user_active (user_id, is_active),
  INDEX idx_usa_school (school_id),
  CONSTRAINT fk_usa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_usa_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_usa_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_student_links (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_user_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  relationship VARCHAR(50) NOT NULL DEFAULT 'Parent/Guardian',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_parent_student_link (parent_user_id, student_id),
  CONSTRAINT fk_usl_parent FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_usl_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
