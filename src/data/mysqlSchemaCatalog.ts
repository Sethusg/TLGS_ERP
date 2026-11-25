export interface MySqlColumnSpec {
  name: string;
  dataType: string;
  isPrimaryKey?: boolean;
  foreignKey?: string;
  nullable: boolean;
  defaultValue?: string;
  unique?: boolean;
  notes?: string;
}

export interface MySqlTableSpec {
  name: string;
  description: string;
  tenantScoped: 'Global' | 'school_id' | 'school_id + campus_id';
  columns: MySqlColumnSpec[];
  uniqueConstraints: string[];
  indexes: string[];
  relationships: string[];
}

export interface MySqlDatabaseGroup {
  groupNumber: number;
  groupName: string;
  summary: string;
  tables: MySqlTableSpec[];
}

const AUDIT_COLS: MySqlColumnSpec[] = [
  { name: 'is_active', dataType: 'TINYINT(1)', nullable: false, defaultValue: '1' },
  { name: 'is_deleted', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0', notes: 'Soft-delete flag' },
  { name: 'deleted_at', dataType: 'DATETIME', nullable: true, defaultValue: 'NULL' },
  { name: 'created_at', dataType: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
  { name: 'updated_at', dataType: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
];

export const MYSQL_SCHEMA_GROUPS: MySqlDatabaseGroup[] = [
  {
    groupNumber: 1,
    groupName: 'Organization and School Tables',
    summary: 'Root multi-tenant hierarchy for educational trusts, affiliated schools, education boards, and school documents.',
    tables: [
      {
        name: 'organizations',
        description: 'Top-level educational trust or society governing one or more schools.',
        tenantScoped: 'Global',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false, notes: 'AUTO_INCREMENT' },
          { name: 'org_code', dataType: 'VARCHAR(32)', nullable: false, unique: true },
          { name: 'name', dataType: 'VARCHAR(180)', nullable: false },
          { name: 'registration_no', dataType: 'VARCHAR(80)', nullable: false, unique: true },
          { name: 'email', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'phone', dataType: 'VARCHAR(30)', nullable: false },
          { name: 'headquarters_address', dataType: 'TEXT', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_organizations_code (org_code)', 'uq_organizations_reg (registration_no)'],
        indexes: ['idx_org_active (is_active, is_deleted)'],
        relationships: ['1:N -> schools (organization_id)'],
      },
      {
        name: 'education_boards',
        description: 'Accreditation boards (CBSE, ICSE, IB, Cambridge IGCSE, State Board).',
        tenantScoped: 'Global',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false, notes: 'AUTO_INCREMENT' },
          { name: 'board_code', dataType: 'VARCHAR(24)', nullable: false, unique: true },
          { name: 'board_name', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'affiliation_body', dataType: 'VARCHAR(160)', nullable: true },
          { name: 'grading_scale', dataType: 'VARCHAR(120)', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_education_boards_code (board_code)'],
        indexes: ['idx_boards_active (is_active)'],
        relationships: ['1:N -> schools (board_id)'],
      },
      {
        name: 'schools',
        description: 'Primary tenant table isolating each school within an organization.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false, notes: 'AUTO_INCREMENT (tenant root school_id)' },
          { name: 'organization_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'organizations.id', nullable: false },
          { name: 'board_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'education_boards.id', nullable: false },
          { name: 'school_code', dataType: 'VARCHAR(32)', nullable: false, unique: true },
          { name: 'name', dataType: 'VARCHAR(200)', nullable: false },
          { name: 'affiliation_no', dataType: 'VARCHAR(64)', nullable: false },
          { name: 'currency_code', dataType: 'CHAR(3)', nullable: false, defaultValue: "'INR'" },
          { name: 'timezone', dataType: 'VARCHAR(64)', nullable: false, defaultValue: "'Asia/Kolkata'" },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_schools_code (school_code)', 'uq_schools_org_aff (organization_id, affiliation_no)'],
        indexes: ['idx_schools_org (organization_id, is_active)', 'idx_schools_board (board_id)'],
        relationships: ['N:1 -> organizations', 'N:1 -> education_boards', '1:N -> campuses, academic_years, students, staff'],
      },
      {
        name: 'school_documents',
        description: 'Affiliation certificates, NOC, trust deeds, and compliance documents per school.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'document_type', dataType: 'VARCHAR(64)', nullable: false },
          { name: 'document_title', dataType: 'VARCHAR(180)', nullable: false },
          { name: 'file_path', dataType: 'VARCHAR(512)', nullable: false },
          { name: 'valid_until', dataType: 'DATE', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_school_doc_ref (school_id, document_type, document_title)'],
        indexes: ['idx_school_docs_school (school_id, valid_until)'],
        relationships: ['N:1 -> schools'],
      },
    ],
  },
  {
    groupNumber: 2,
    groupName: 'Campus Tables',
    summary: 'Physical campus branches and institutional departments scoped under each school.',
    tables: [
      {
        name: 'campuses',
        description: 'Individual physical branches belonging to a school.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_code', dataType: 'VARCHAR(32)', nullable: false },
          { name: 'name', dataType: 'VARCHAR(180)', nullable: false },
          { name: 'city', dataType: 'VARCHAR(100)', nullable: false },
          { name: 'address', dataType: 'TEXT', nullable: true },
          { name: 'principal_name', dataType: 'VARCHAR(140)', nullable: true },
          { name: 'capacity_students', dataType: 'INT UNSIGNED', nullable: false, defaultValue: '1000' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_campus_school_code (school_id, campus_code)'],
        indexes: ['idx_campus_school_active (school_id, is_active, is_deleted)'],
        relationships: ['N:1 -> schools', '1:N -> students, staff, classes, hostels, vehicles'],
      },
      {
        name: 'departments',
        description: 'Academic and operational departments scoped by school and optional campus.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: true },
          { name: 'dept_code', dataType: 'VARCHAR(24)', nullable: false },
          { name: 'name', dataType: 'VARCHAR(120)', nullable: false },
          { name: 'wing_type', dataType: "ENUM('Academic','Administrative','Operations')", nullable: false, defaultValue: "'Academic'" },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_dept_school_code (school_id, dept_code)'],
        indexes: ['idx_dept_school_campus (school_id, campus_id)'],
        relationships: ['N:1 -> schools', 'N:1 -> campuses', '1:N -> staff'],
      },
    ],
  },
  {
    groupNumber: 3,
    groupName: 'Academic Year Tables',
    summary: 'Multi-year session windows and academic calendar milestones isolated per school.',
    tables: [
      {
        name: 'academic_years',
        description: 'Defines session start/end dates and current active session per school.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'year_code', dataType: 'VARCHAR(20)', nullable: false, notes: 'e.g. 2026-2027' },
          { name: 'start_date', dataType: 'DATE', nullable: false },
          { name: 'end_date', dataType: 'DATE', nullable: false },
          { name: 'is_current', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_ay_school_code (school_id, year_code)'],
        indexes: ['idx_ay_school_current (school_id, is_current)'],
        relationships: ['N:1 -> schools', '1:N -> students, fee_structures, exams'],
      },
      {
        name: 'academic_calendar_events',
        description: 'Holidays, exam windows, PTM dates, and institutional events.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: true },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'event_title', dataType: 'VARCHAR(180)', nullable: false },
          { name: 'event_date', dataType: 'DATE', nullable: false },
          { name: 'event_type', dataType: "ENUM('Holiday','Exam','Event','PTM','Admin')", nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: [],
        indexes: ['idx_cal_school_date (school_id, academic_year_id, event_date)'],
        relationships: ['N:1 -> schools', 'N:1 -> campuses', 'N:1 -> academic_years'],
      },
    ],
  },
  {
    groupNumber: 4,
    groupName: 'User and Authentication Tables',
    summary: 'User accounts, campus/school bindings, password reset tokens, and login history tracking.',
    tables: [
      {
        name: 'users',
        description: 'Platform, organization, school, and campus user accounts with tenant scope.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'organization_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'organizations.id', nullable: true },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: true, notes: 'NULL for Super/Org Admins' },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: true, notes: 'NULL for School/Platform Admins' },
          { name: 'username', dataType: 'VARCHAR(80)', nullable: false, unique: true },
          { name: 'email', dataType: 'VARCHAR(160)', nullable: false, unique: true },
          { name: 'password_hash', dataType: 'VARCHAR(255)', nullable: false },
          { name: 'full_name', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'phone', dataType: 'VARCHAR(30)', nullable: true },
          { name: 'must_reset_password', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0' },
          { name: 'last_login_at', dataType: 'DATETIME', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_users_username (username)', 'uq_users_email (email)'],
        indexes: ['idx_users_tenant (school_id, campus_id, is_active)'],
        relationships: ['N:1 -> organizations, schools, campuses', 'M:N -> roles via user_roles'],
      },
      {
        name: 'user_login_history',
        description: 'Immutable login audit trail recording IP, device, status, and tenant context.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: true },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: true },
          { name: 'login_at', dataType: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'ip_address', dataType: 'VARCHAR(45)', nullable: false },
          { name: 'user_agent', dataType: 'VARCHAR(255)', nullable: true },
          { name: 'auth_status', dataType: "ENUM('Success','Failed','Deactivated','Locked')", nullable: false },
        ],
        uniqueConstraints: [],
        indexes: ['idx_login_user_time (user_id, login_at)', 'idx_login_school (school_id, login_at)'],
        relationships: ['N:1 -> users, schools, campuses'],
      },
      {
        name: 'password_reset_tokens',
        description: 'Time-limited password reset tokens triggered by admins or self-service.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: true },
          { name: 'token_hash', dataType: 'CHAR(64)', nullable: false, unique: true },
          { name: 'expires_at', dataType: 'DATETIME', nullable: false },
          { name: 'used_at', dataType: 'DATETIME', nullable: true },
          { name: 'created_at', dataType: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
        ],
        uniqueConstraints: ['uq_reset_token_hash (token_hash)'],
        indexes: ['idx_reset_user (user_id, expires_at)'],
        relationships: ['N:1 -> users'],
      },
    ],
  },
  {
    groupNumber: 5,
    groupName: 'Roles and Permissions Tables',
    summary: 'Normalized 19-role RBAC schema with module-level CRUD flags and campus-level scoping.',
    tables: [
      {
        name: 'roles',
        description: 'Master table for all 19 ERP roles and their access scope tier.',
        tenantScoped: 'Global',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'role_code', dataType: 'VARCHAR(40)', nullable: false, unique: true },
          { name: 'role_name', dataType: 'VARCHAR(80)', nullable: false, unique: true },
          { name: 'scope_level', dataType: "ENUM('Platform','Organization','School','Campus','Personal')", nullable: false },
          { name: 'is_system_role', dataType: 'TINYINT(1)', nullable: false, defaultValue: '1' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_roles_code (role_code)', 'uq_roles_name (role_name)'],
        indexes: ['idx_roles_scope (scope_level, is_active)'],
        relationships: ['1:N -> role_module_permissions', 'M:N -> users via user_roles'],
      },
      {
        name: 'erp_modules',
        description: 'Catalog of all 17 sidebar ERP modules and sub-menu keys.',
        tenantScoped: 'Global',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'module_code', dataType: 'VARCHAR(48)', nullable: false, unique: true },
          { name: 'module_name', dataType: 'VARCHAR(120)', nullable: false },
          { name: 'display_order', dataType: 'SMALLINT UNSIGNED', nullable: false, defaultValue: '0' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_modules_code (module_code)'],
        indexes: ['idx_modules_order (display_order)'],
        relationships: ['1:N -> role_module_permissions'],
      },
      {
        name: 'role_module_permissions',
        description: 'Granular Create/Read/Update/Delete permission matrix per role and module.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: true, notes: 'NULL = global default policy' },
          { name: 'role_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'roles.id', nullable: false },
          { name: 'module_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'erp_modules.id', nullable: false },
          { name: 'can_create', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0' },
          { name: 'can_read', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0' },
          { name: 'can_update', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0' },
          { name: 'can_delete', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_role_module_school (school_id, role_id, module_id)'],
        indexes: ['idx_rmp_role (role_id, module_id)'],
        relationships: ['N:1 -> roles', 'N:1 -> erp_modules', 'N:1 -> schools'],
      },
      {
        name: 'user_roles',
        description: 'Assigns roles to users with optional campus-level restriction.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          { name: 'role_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'roles.id', nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: true },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_user_role_scope (user_id, role_id, school_id, campus_id)'],
        indexes: ['idx_ur_tenant (school_id, campus_id)'],
        relationships: ['N:1 -> users, roles, schools, campuses'],
      },
    ],
  },
  {
    groupNumber: 6,
    groupName: 'Student Tables',
    summary: 'Students, admission enquiries, enrollments, promotions, and transfer certificates with duplicate admission number prevention.',
    tables: [
      {
        name: 'students',
        description: 'Core student master record isolated by school, campus, and academic year.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'class_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'classes.id', nullable: false },
          { name: 'section_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'sections.id', nullable: false },
          { name: 'admission_no', dataType: 'VARCHAR(40)', nullable: false, notes: 'Unique within (school_id, academic_year_id)' },
          { name: 'roll_no', dataType: 'VARCHAR(24)', nullable: true },
          { name: 'first_name', dataType: 'VARCHAR(80)', nullable: false },
          { name: 'last_name', dataType: 'VARCHAR(80)', nullable: false },
          { name: 'gender', dataType: "ENUM('Male','Female','Other')", nullable: false },
          { name: 'date_of_birth', dataType: 'DATE', nullable: false },
          { name: 'admission_date', dataType: 'DATE', nullable: false },
          { name: 'blood_group', dataType: 'VARCHAR(8)', nullable: true },
          { name: 'enrollment_status', dataType: "ENUM('Active','Promoted','Withdrawn','Alumni','Transferred')", nullable: false, defaultValue: "'Active'" },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: [
          'uq_student_school_year_admission (school_id, academic_year_id, admission_no)',
          'uq_student_school_admission (school_id, admission_no)',
        ],
        indexes: [
          'idx_students_tenant (school_id, campus_id, academic_year_id)',
          'idx_students_class_sec (school_id, class_id, section_id)',
        ],
        relationships: ['N:1 -> schools, campuses, academic_years, classes, sections', 'M:N -> parents_guardians via student_guardians'],
      },
      {
        name: 'admission_enquiries',
        description: 'Prospective admission leads and application processing pipeline.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'enquiry_no', dataType: 'VARCHAR(40)', nullable: false },
          { name: 'student_name', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'parent_name', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'contact_phone', dataType: 'VARCHAR(30)', nullable: false },
          { name: 'applying_grade', dataType: 'VARCHAR(40)', nullable: false },
          { name: 'enquiry_date', dataType: 'DATE', nullable: false },
          { name: 'status', dataType: "ENUM('New','Visit Scheduled','Applied','Admitted','Closed')", nullable: false, defaultValue: "'New'" },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_enquiry_school_no (school_id, enquiry_no)'],
        indexes: ['idx_enq_school_status (school_id, campus_id, status)'],
        relationships: ['N:1 -> schools, campuses, academic_years'],
      },
      {
        name: 'transfer_certificates',
        description: 'Issued Transfer Certificates (TC) and student withdrawal ledger.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'student_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'students.id', nullable: false },
          { name: 'tc_number', dataType: 'VARCHAR(48)', nullable: false },
          { name: 'issue_date', dataType: 'DATE', nullable: false },
          { name: 'reason_for_leaving', dataType: 'VARCHAR(255)', nullable: false },
          { name: 'dues_cleared', dataType: 'TINYINT(1)', nullable: false, defaultValue: '1' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_tc_school_number (school_id, tc_number)'],
        indexes: ['idx_tc_student (school_id, student_id)'],
        relationships: ['N:1 -> schools, campuses, students'],
      },
    ],
  },
  {
    groupNumber: 7,
    groupName: 'Parent and Guardian Tables',
    summary: 'Normalized parent/guardian directory and M:N sibling-aware linkage to students.',
    tables: [
      {
        name: 'parents_guardians',
        description: 'Parent and guardian master profile linked to portal user account.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: true },
          { name: 'full_name', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'relation_type', dataType: "ENUM('Father','Mother','Legal Guardian')", nullable: false },
          { name: 'phone', dataType: 'VARCHAR(30)', nullable: false },
          { name: 'email', dataType: 'VARCHAR(160)', nullable: true },
          { name: 'occupation', dataType: 'VARCHAR(120)', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_parent_school_phone (school_id, phone, full_name)'],
        indexes: ['idx_parent_school (school_id, phone)'],
        relationships: ['N:1 -> schools, users', 'M:N -> students via student_guardians'],
      },
      {
        name: 'student_guardians',
        description: 'Join table supporting multiple guardians per student and siblings under one parent.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'student_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'students.id', nullable: false },
          { name: 'guardian_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'parents_guardians.id', nullable: false },
          { name: 'is_primary_contact', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_student_guardian (school_id, student_id, guardian_id)'],
        indexes: ['idx_sg_guardian (guardian_id)'],
        relationships: ['N:1 -> students', 'N:1 -> parents_guardians'],
      },
    ],
  },
  {
    groupNumber: 8,
    groupName: 'Staff Tables',
    summary: 'Teaching and non-teaching staff profiles, designations, documents, and exit clearances.',
    tables: [
      {
        name: 'designations',
        description: 'Standardized job titles per school (Principal, PGT, TGT, Accountant, Warden).',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'designation_code', dataType: 'VARCHAR(24)', nullable: false },
          { name: 'title', dataType: 'VARCHAR(120)', nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_desig_school_code (school_id, designation_code)'],
        indexes: ['idx_desig_school (school_id)'],
        relationships: ['N:1 -> schools', '1:N -> staff'],
      },
      {
        name: 'staff',
        description: 'Faculty and operational employees isolated by school and campus.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: true },
          { name: 'department_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'departments.id', nullable: false },
          { name: 'designation_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'designations.id', nullable: false },
          { name: 'employee_code', dataType: 'VARCHAR(40)', nullable: false },
          { name: 'full_name', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'email', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'phone', dataType: 'VARCHAR(30)', nullable: false },
          { name: 'joining_date', dataType: 'DATE', nullable: false },
          { name: 'employment_status', dataType: "ENUM('Active','On Leave','Resigned','Retired','Archived')", nullable: false, defaultValue: "'Active'" },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_staff_school_empcode (school_id, employee_code)'],
        indexes: ['idx_staff_tenant (school_id, campus_id, department_id)'],
        relationships: ['N:1 -> schools, campuses, users, departments, designations'],
      },
    ],
  },
  {
    groupNumber: 9,
    groupName: 'Class and Section Tables',
    summary: 'Grades, sections, room capacities, and class teacher assignments per campus and academic year.',
    tables: [
      {
        name: 'classes',
        description: 'Academic grade levels (Nursery through Class 12) per school & board.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'board_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'education_boards.id', nullable: false },
          { name: 'grade_name', dataType: 'VARCHAR(60)', nullable: false },
          { name: 'sequence_order', dataType: 'SMALLINT UNSIGNED', nullable: false, defaultValue: '1' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_class_campus_grade (school_id, campus_id, grade_name)'],
        indexes: ['idx_class_tenant (school_id, campus_id, sequence_order)'],
        relationships: ['N:1 -> schools, campuses, education_boards', '1:N -> sections'],
      },
      {
        name: 'sections',
        description: 'Class sections (A, B, C) with assigned room and class teacher.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'class_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'classes.id', nullable: false },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'section_name', dataType: 'VARCHAR(24)', nullable: false },
          { name: 'class_teacher_staff_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'staff.id', nullable: true },
          { name: 'room_no', dataType: 'VARCHAR(32)', nullable: true },
          { name: 'max_capacity', dataType: 'SMALLINT UNSIGNED', nullable: false, defaultValue: '40' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_section_class_year (school_id, class_id, academic_year_id, section_name)'],
        indexes: ['idx_section_teacher (school_id, class_teacher_staff_id)'],
        relationships: ['N:1 -> classes, academic_years, staff'],
      },
    ],
  },
  {
    groupNumber: 10,
    groupName: 'Subject and Timetable Tables',
    summary: 'Subjects, teacher subject allocations, weekly timetables, syllabus, and homework assignments.',
    tables: [
      {
        name: 'subjects',
        description: 'Core, elective, and co-scholastic subjects per school.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'subject_code', dataType: 'VARCHAR(24)', nullable: false },
          { name: 'subject_name', dataType: 'VARCHAR(120)', nullable: false },
          { name: 'subject_type', dataType: "ENUM('Core','Elective','Co-Scholastic')", nullable: false, defaultValue: "'Core'" },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_subject_school_code (school_id, subject_code)'],
        indexes: ['idx_subject_school (school_id, subject_type)'],
        relationships: ['N:1 -> schools', '1:N -> timetable_entries, exam_marks'],
      },
      {
        name: 'timetable_entries',
        description: 'Period-wise weekly schedule linking section, subject, and faculty.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'section_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'sections.id', nullable: false },
          { name: 'subject_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'subjects.id', nullable: false },
          { name: 'teacher_staff_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'staff.id', nullable: false },
          { name: 'day_of_week', dataType: 'TINYINT UNSIGNED', nullable: false, notes: '1=Mon .. 6=Sat' },
          { name: 'period_no', dataType: 'TINYINT UNSIGNED', nullable: false },
          { name: 'start_time', dataType: 'TIME', nullable: false },
          { name: 'end_time', dataType: 'TIME', nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_tt_section_slot (school_id, academic_year_id, section_id, day_of_week, period_no)'],
        indexes: ['idx_tt_teacher_slot (school_id, teacher_staff_id, day_of_week, period_no)'],
        relationships: ['N:1 -> sections, subjects, staff, academic_years'],
      },
    ],
  },
  {
    groupNumber: 11,
    groupName: 'Attendance Tables',
    summary: 'Daily student roll-call, staff attendance, and biometric/QR scan logs.',
    tables: [
      {
        name: 'student_attendance',
        description: 'Daily attendance record per student and academic date.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'student_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'students.id', nullable: false },
          { name: 'section_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'sections.id', nullable: false },
          { name: 'attendance_date', dataType: 'DATE', nullable: false },
          { name: 'status', dataType: "ENUM('Present','Absent','Late','Half-Day','Excused')", nullable: false },
          { name: 'source', dataType: "ENUM('Manual','Biometric','QR')", nullable: false, defaultValue: "'Manual'" },
          { name: 'marked_by_user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_std_att_day (school_id, student_id, attendance_date)'],
        indexes: ['idx_std_att_sec_date (school_id, campus_id, section_id, attendance_date)'],
        relationships: ['N:1 -> students, sections, users'],
      },
      {
        name: 'staff_attendance',
        description: 'Daily biometric and manual check-in/check-out records for staff.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'staff_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'staff.id', nullable: false },
          { name: 'attendance_date', dataType: 'DATE', nullable: false },
          { name: 'check_in_time', dataType: 'DATETIME', nullable: true },
          { name: 'check_out_time', dataType: 'DATETIME', nullable: true },
          { name: 'status', dataType: "ENUM('Present','Absent','Late','On Leave','Half-Day')", nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_stf_att_day (school_id, staff_id, attendance_date)'],
        indexes: ['idx_stf_att_date (school_id, campus_id, attendance_date)'],
        relationships: ['N:1 -> staff, schools, campuses'],
      },
    ],
  },
  {
    groupNumber: 12,
    groupName: 'Fee Management Tables',
    summary: 'Fee categories, class structures, student fee assignments, discounts, payments, receipts, and refunds using DECIMAL(12,2).',
    tables: [
      {
        name: 'fee_structures',
        description: 'Fee head amounts defined per school, campus, academic year, and class.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'class_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'classes.id', nullable: false },
          { name: 'fee_category', dataType: 'VARCHAR(80)', nullable: false },
          { name: 'amount', dataType: 'DECIMAL(12,2)', nullable: false, defaultValue: '0.00' },
          { name: 'due_date', dataType: 'DATE', nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_fee_struct (school_id, campus_id, academic_year_id, class_id, fee_category)'],
        indexes: ['idx_fee_struct_class (school_id, academic_year_id, class_id)'],
        relationships: ['N:1 -> schools, campuses, academic_years, classes'],
      },
      {
        name: 'student_fee_invoices',
        description: 'Assigned student fee dues, scholarships, discounts, and running balances.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'student_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'students.id', nullable: false },
          { name: 'invoice_no', dataType: 'VARCHAR(48)', nullable: false },
          { name: 'gross_amount', dataType: 'DECIMAL(12,2)', nullable: false, defaultValue: '0.00' },
          { name: 'discount_amount', dataType: 'DECIMAL(12,2)', nullable: false, defaultValue: '0.00' },
          { name: 'paid_amount', dataType: 'DECIMAL(12,2)', nullable: false, defaultValue: '0.00' },
          { name: 'balance_amount', dataType: 'DECIMAL(12,2)', nullable: false, defaultValue: '0.00' },
          { name: 'due_date', dataType: 'DATE', nullable: false },
          { name: 'payment_status', dataType: "ENUM('Paid','Partial','Pending','Overdue','Refunded')", nullable: false, defaultValue: "'Pending'" },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_fee_invoice_no (school_id, invoice_no)'],
        indexes: ['idx_fee_inv_student (school_id, student_id, payment_status)'],
        relationships: ['N:1 -> students, academic_years', '1:N -> fee_receipts'],
      },
      {
        name: 'fee_receipts',
        description: 'Immutable payment receipts for cash, UPI, card, bank, or online gateway payments.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'invoice_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'student_fee_invoices.id', nullable: false },
          { name: 'student_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'students.id', nullable: false },
          { name: 'receipt_no', dataType: 'VARCHAR(48)', nullable: false },
          { name: 'payment_date', dataType: 'DATETIME', nullable: false },
          { name: 'amount_paid', dataType: 'DECIMAL(12,2)', nullable: false },
          { name: 'payment_mode', dataType: "ENUM('Cash','UPI','Card','NetBanking','Cheque')", nullable: false },
          { name: 'gateway_txn_ref', dataType: 'VARCHAR(120)', nullable: true },
          { name: 'collected_by_user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_receipt_school_no (school_id, receipt_no)'],
        indexes: ['idx_receipt_date (school_id, campus_id, payment_date)'],
        relationships: ['N:1 -> student_fee_invoices, students, users'],
      },
    ],
  },
  {
    groupNumber: 13,
    groupName: 'Examination Tables',
    summary: 'Exam schedules, subject marks entries, grading scales, and finalized report card summaries.',
    tables: [
      {
        name: 'examinations',
        description: 'Examination terms (Unit Test, Mid-Term, Annual) scoped per school and year.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'exam_code', dataType: 'VARCHAR(32)', nullable: false },
          { name: 'exam_name', dataType: 'VARCHAR(140)', nullable: false },
          { name: 'start_date', dataType: 'DATE', nullable: false },
          { name: 'end_date', dataType: 'DATE', nullable: false },
          { name: 'is_published', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_exam_school_code (school_id, academic_year_id, exam_code)'],
        indexes: ['idx_exam_tenant (school_id, campus_id, academic_year_id)'],
        relationships: ['N:1 -> schools, campuses, academic_years', '1:N -> exam_marks'],
      },
      {
        name: 'exam_marks',
        description: 'Subject-wise student marks and computed grade points.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'exam_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'examinations.id', nullable: false },
          { name: 'student_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'students.id', nullable: false },
          { name: 'subject_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'subjects.id', nullable: false },
          { name: 'marks_obtained', dataType: 'DECIMAL(6,2)', nullable: false, defaultValue: '0.00' },
          { name: 'max_marks', dataType: 'DECIMAL(6,2)', nullable: false, defaultValue: '100.00' },
          { name: 'grade_code', dataType: 'VARCHAR(8)', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_exam_student_subject (school_id, exam_id, student_id, subject_id)'],
        indexes: ['idx_marks_student (school_id, exam_id, student_id)'],
        relationships: ['N:1 -> examinations, students, subjects'],
      },
    ],
  },
  {
    groupNumber: 14,
    groupName: 'HR and Payroll Tables',
    summary: 'Staff leave requests, salary components, monthly payroll runs, and payslips.',
    tables: [
      {
        name: 'staff_leave_requests',
        description: 'Leave applications and approval statuses for school staff.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'staff_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'staff.id', nullable: false },
          { name: 'leave_type', dataType: 'VARCHAR(48)', nullable: false },
          { name: 'start_date', dataType: 'DATE', nullable: false },
          { name: 'end_date', dataType: 'DATE', nullable: false },
          { name: 'total_days', dataType: 'DECIMAL(4,1)', nullable: false },
          { name: 'status', dataType: "ENUM('Pending','Approved','Rejected')", nullable: false, defaultValue: "'Pending'" },
          { name: 'approved_by_user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: [],
        indexes: ['idx_leave_school_status (school_id, campus_id, status)'],
        relationships: ['N:1 -> staff, users'],
      },
      {
        name: 'payroll_payslips',
        description: 'Monthly staff salary disbursements with gross, deductions, and net pay.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'staff_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'staff.id', nullable: false },
          { name: 'pay_month', dataType: 'CHAR(7)', nullable: false, notes: 'YYYY-MM' },
          { name: 'basic_salary', dataType: 'DECIMAL(12,2)', nullable: false },
          { name: 'allowances_total', dataType: 'DECIMAL(12,2)', nullable: false, defaultValue: '0.00' },
          { name: 'deductions_total', dataType: 'DECIMAL(12,2)', nullable: false, defaultValue: '0.00' },
          { name: 'net_salary', dataType: 'DECIMAL(12,2)', nullable: false },
          { name: 'disbursement_date', dataType: 'DATE', nullable: true },
          { name: 'payout_status', dataType: "ENUM('Draft','Approved','Paid')", nullable: false, defaultValue: "'Draft'" },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_payslip_staff_month (school_id, staff_id, pay_month)'],
        indexes: ['idx_payroll_month (school_id, pay_month, payout_status)'],
        relationships: ['N:1 -> staff, schools, campuses'],
      },
    ],
  },
  {
    groupNumber: 15,
    groupName: 'Finance Tables',
    summary: 'Chart of account heads, bank accounts, cash book, and payment/receipt vouchers.',
    tables: [
      {
        name: 'finance_account_heads',
        description: 'Chart of accounts (Income, Expense, Asset, Liability) isolated per school.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'head_code', dataType: 'VARCHAR(24)', nullable: false },
          { name: 'head_name', dataType: 'VARCHAR(120)', nullable: false },
          { name: 'account_type', dataType: "ENUM('Income','Expense','Asset','Liability')", nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_fin_head_code (school_id, head_code)'],
        indexes: ['idx_fin_head_type (school_id, account_type)'],
        relationships: ['N:1 -> schools', '1:N -> finance_vouchers'],
      },
      {
        name: 'finance_vouchers',
        description: 'General ledger payment, receipt, and journal vouchers.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: true },
          { name: 'account_head_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'finance_account_heads.id', nullable: false },
          { name: 'voucher_no', dataType: 'VARCHAR(48)', nullable: false },
          { name: 'voucher_type', dataType: "ENUM('Receipt','Payment','Journal','Contra')", nullable: false },
          { name: 'voucher_date', dataType: 'DATE', nullable: false },
          { name: 'amount', dataType: 'DECIMAL(14,2)', nullable: false },
          { name: 'narration', dataType: 'VARCHAR(255)', nullable: true },
          { name: 'created_by_user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_voucher_school_no (school_id, voucher_no)'],
        indexes: ['idx_voucher_date (school_id, voucher_date, voucher_type)'],
        relationships: ['N:1 -> finance_account_heads, schools, campuses, users'],
      },
    ],
  },
  {
    groupNumber: 16,
    groupName: 'Library Tables',
    summary: 'Campus book catalog, circulation issue/return records, reservations, and fines.',
    tables: [
      {
        name: 'library_books',
        description: 'Campus-isolated book inventory with ISBN, rack location, and available copies.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'isbn', dataType: 'VARCHAR(32)', nullable: false },
          { name: 'title', dataType: 'VARCHAR(200)', nullable: false },
          { name: 'author', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'category_name', dataType: 'VARCHAR(80)', nullable: false },
          { name: 'total_copies', dataType: 'INT UNSIGNED', nullable: false, defaultValue: '1' },
          { name: 'available_copies', dataType: 'INT UNSIGNED', nullable: false, defaultValue: '1' },
          { name: 'rack_location', dataType: 'VARCHAR(48)', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_lib_campus_isbn (school_id, campus_id, isbn)'],
        indexes: ['idx_lib_books_cat (school_id, campus_id, category_name)'],
        relationships: ['N:1 -> schools, campuses', '1:N -> library_circulations'],
      },
      {
        name: 'library_circulations',
        description: 'Book issue, return, overdue tracking, and fine settlements.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'book_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'library_books.id', nullable: false },
          { name: 'member_user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          { name: 'issued_date', dataType: 'DATE', nullable: false },
          { name: 'due_date', dataType: 'DATE', nullable: false },
          { name: 'returned_date', dataType: 'DATE', nullable: true },
          { name: 'fine_amount', dataType: 'DECIMAL(10,2)', nullable: false, defaultValue: '0.00' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: [],
        indexes: ['idx_circ_due (school_id, campus_id, returned_date, due_date)'],
        relationships: ['N:1 -> library_books, users'],
      },
    ],
  },
  {
    groupNumber: 17,
    groupName: 'Transport Tables',
    summary: 'Fleet vehicles, drivers, routes, stops, student allocations, and maintenance records.',
    tables: [
      {
        name: 'transport_vehicles',
        description: 'School buses and vans with registration, capacity, and fitness compliance dates.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'registration_no', dataType: 'VARCHAR(32)', nullable: false },
          { name: 'seating_capacity', dataType: 'SMALLINT UNSIGNED', nullable: false },
          { name: 'driver_name', dataType: 'VARCHAR(140)', nullable: false },
          { name: 'driver_license_no', dataType: 'VARCHAR(64)', nullable: false },
          { name: 'insurance_expiry', dataType: 'DATE', nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_vehicle_school_reg (school_id, registration_no)'],
        indexes: ['idx_vehicle_campus (school_id, campus_id, is_active)'],
        relationships: ['N:1 -> schools, campuses', '1:N -> transport_routes'],
      },
      {
        name: 'transport_routes',
        description: 'Scheduled pickup/drop routes and monthly transport fee tariff.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'vehicle_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'transport_vehicles.id', nullable: false },
          { name: 'route_code', dataType: 'VARCHAR(32)', nullable: false },
          { name: 'route_title', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'monthly_fee', dataType: 'DECIMAL(10,2)', nullable: false, defaultValue: '0.00' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_route_school_code (school_id, route_code)'],
        indexes: ['idx_route_vehicle (school_id, vehicle_id)'],
        relationships: ['N:1 -> transport_vehicles, schools, campuses'],
      },
    ],
  },
  {
    groupNumber: 18,
    groupName: 'Hostel Tables',
    summary: 'Residential hostel blocks, rooms, bed allocations, mess subscriptions, and visitor register.',
    tables: [
      {
        name: 'hostel_rooms',
        description: 'Residential blocks and room bed capacity per campus.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'hostel_block', dataType: 'VARCHAR(80)', nullable: false },
          { name: 'room_no', dataType: 'VARCHAR(24)', nullable: false },
          { name: 'total_beds', dataType: 'SMALLINT UNSIGNED', nullable: false },
          { name: 'monthly_tariff', dataType: 'DECIMAL(10,2)', nullable: false, defaultValue: '0.00' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_hostel_block_room (school_id, campus_id, hostel_block, room_no)'],
        indexes: ['idx_hostel_campus (school_id, campus_id)'],
        relationships: ['N:1 -> schools, campuses', '1:N -> hostel_allocations'],
      },
      {
        name: 'hostel_allocations',
        description: 'Assigns boarder students to specific rooms and beds per academic year.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'academic_year_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'academic_years.id', nullable: false },
          { name: 'room_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'hostel_rooms.id', nullable: false },
          { name: 'student_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'students.id', nullable: false },
          { name: 'bed_label', dataType: 'VARCHAR(16)', nullable: false },
          { name: 'allocated_on', dataType: 'DATE', nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_hostel_student_year (school_id, academic_year_id, student_id)'],
        indexes: ['idx_hostel_room (room_id, is_active)'],
        relationships: ['N:1 -> hostel_rooms, students, academic_years'],
      },
    ],
  },
  {
    groupNumber: 19,
    groupName: 'Inventory Tables',
    summary: 'Fixed assets, stock items, vendors, purchase orders, goods receipts, and stock movement ledgers.',
    tables: [
      {
        name: 'inventory_assets',
        description: 'Institutional fixed assets and lab equipment tracked per campus.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'asset_code', dataType: 'VARCHAR(48)', nullable: false },
          { name: 'asset_name', dataType: 'VARCHAR(180)', nullable: false },
          { name: 'category_name', dataType: 'VARCHAR(80)', nullable: false },
          { name: 'purchase_date', dataType: 'DATE', nullable: false },
          { name: 'purchase_cost', dataType: 'DECIMAL(12,2)', nullable: false },
          { name: 'asset_condition', dataType: "ENUM('Excellent','Good','Maintenance','Disposed')", nullable: false, defaultValue: "'Good'" },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_asset_school_code (school_id, asset_code)'],
        indexes: ['idx_asset_campus_cat (school_id, campus_id, category_name)'],
        relationships: ['N:1 -> schools, campuses'],
      },
      {
        name: 'inventory_stock_items',
        description: 'Consumable stock SKUs supporting bulk CSV/Excel stock updates and reorder alerts.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: false },
          { name: 'sku', dataType: 'VARCHAR(64)', nullable: false },
          { name: 'barcode', dataType: 'VARCHAR(64)', nullable: true },
          { name: 'item_name', dataType: 'VARCHAR(180)', nullable: false },
          { name: 'unit_price', dataType: 'DECIMAL(12,2)', nullable: false, defaultValue: '0.00' },
          { name: 'cost_price', dataType: 'DECIMAL(12,2)', nullable: true },
          { name: 'stock_quantity', dataType: 'INT', nullable: false, defaultValue: '0' },
          { name: 'reorder_level', dataType: 'INT', nullable: false, defaultValue: '10' },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: ['uq_stock_campus_sku (school_id, campus_id, sku)'],
        indexes: ['idx_stock_reorder (school_id, campus_id, stock_quantity, reorder_level)'],
        relationships: ['N:1 -> schools, campuses'],
      },
    ],
  },
  {
    groupNumber: 20,
    groupName: 'Communication Tables',
    summary: 'SMS, Email, WhatsApp Official API broadcasts, templates, and official school circulars.',
    tables: [
      {
        name: 'communication_broadcasts',
        description: 'Outbound SMS, Email, and WhatsApp broadcast logs scoped by school.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: true },
          { name: 'channel', dataType: "ENUM('SMS','Email','WhatsApp','Circular')", nullable: false },
          { name: 'subject', dataType: 'VARCHAR(200)', nullable: false },
          { name: 'message_body', dataType: 'TEXT', nullable: false },
          { name: 'recipient_count', dataType: 'INT UNSIGNED', nullable: false, defaultValue: '0' },
          { name: 'delivery_status', dataType: "ENUM('Queued','Delivered','Partial','Failed')", nullable: false, defaultValue: "'Queued'" },
          { name: 'sent_by_user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: [],
        indexes: ['idx_comm_school_channel (school_id, channel, created_at)'],
        relationships: ['N:1 -> schools, campuses, users'],
      },
    ],
  },
  {
    groupNumber: 21,
    groupName: 'Notification Tables',
    summary: 'In-app real-time alerts and per-user read/unread state tracking.',
    tables: [
      {
        name: 'user_notifications',
        description: 'Targeted notifications for fee reminders, absences, leave approvals, and announcements.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: false },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: true },
          { name: 'recipient_user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          { name: 'category', dataType: "ENUM('Attendance','Fee','Exam','Leave','Announcement','System')", nullable: false },
          { name: 'title', dataType: 'VARCHAR(160)', nullable: false },
          { name: 'body', dataType: 'TEXT', nullable: false },
          { name: 'is_read', dataType: 'TINYINT(1)', nullable: false, defaultValue: '0' },
          { name: 'read_at', dataType: 'DATETIME', nullable: true },
          ...AUDIT_COLS,
        ],
        uniqueConstraints: [],
        indexes: ['idx_notif_recipient_unread (recipient_user_id, is_read, created_at)'],
        relationships: ['N:1 -> users, schools, campuses'],
      },
    ],
  },
  {
    groupNumber: 22,
    groupName: 'Audit and System Log Tables',
    summary: 'Immutable compliance audit trail, tenant activity logs, and scheduled backup records.',
    tables: [
      {
        name: 'audit_logs',
        description: 'Tamper-evident record of every security, financial, RBAC, and administrative event.',
        tenantScoped: 'school_id + campus_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: true },
          { name: 'campus_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'campuses.id', nullable: true },
          { name: 'actor_user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          { name: 'action_type', dataType: 'VARCHAR(48)', nullable: false },
          { name: 'entity_table', dataType: 'VARCHAR(64)', nullable: false },
          { name: 'entity_id', dataType: 'VARCHAR(64)', nullable: false },
          { name: 'before_payload', dataType: 'JSON', nullable: true },
          { name: 'after_payload', dataType: 'JSON', nullable: true },
          { name: 'ip_address', dataType: 'VARCHAR(45)', nullable: true },
          { name: 'created_at', dataType: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
        ],
        uniqueConstraints: [],
        indexes: [
          'idx_audit_school_time (school_id, created_at)',
          'idx_audit_actor (actor_user_id, action_type)',
        ],
        relationships: ['N:1 -> users, schools, campuses'],
      },
      {
        name: 'system_backup_logs',
        description: 'Tracks scheduled MySQL dump snapshots and recovery verification metadata.',
        tenantScoped: 'school_id',
        columns: [
          { name: 'id', dataType: 'BIGINT UNSIGNED', isPrimaryKey: true, nullable: false },
          { name: 'school_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'schools.id', nullable: true, notes: 'NULL = full multi-school snapshot' },
          { name: 'backup_label', dataType: 'VARCHAR(140)', nullable: false },
          { name: 'storage_uri', dataType: 'VARCHAR(512)', nullable: false },
          { name: 'size_mb', dataType: 'DECIMAL(10,2)', nullable: false, defaultValue: '0.00' },
          { name: 'status', dataType: "ENUM('Completed','Running','Failed')", nullable: false },
          { name: 'initiated_by_user_id', dataType: 'BIGINT UNSIGNED', foreignKey: 'users.id', nullable: false },
          { name: 'created_at', dataType: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
        ],
        uniqueConstraints: [],
        indexes: ['idx_backup_time (school_id, created_at)'],
        relationships: ['N:1 -> schools, users'],
      },
    ],
  },
];

export function generateMysqlSchemaDDL(): string {
  const lines: string[] = [
    '-- ============================================================================',
    '-- MULTI-SCHOOL MANAGEMENT ERP — NORMALIZED MYSQL 8+ RELATIONAL SCHEMA',
    '-- Planned Backend: Python Django REST Framework + MySQL 8.0+ (InnoDB, utf8mb4)',
    '-- Features: school_id & campus_id isolation, BIGINT UNSIGNED PKs, DECIMAL(12,2)',
    '-- financials, DATE/DATETIME/TIMESTAMP audit columns, soft deletes & RBAC.',
    '-- ============================================================================',
    '',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
  ];

  for (const group of MYSQL_SCHEMA_GROUPS) {
    lines.push(`-- ----------------------------------------------------------------------------`);
    lines.push(`-- GROUP ${group.groupNumber}: ${group.groupName.toUpperCase()}`);
    lines.push(`-- ${group.summary}`);
    lines.push(`-- ----------------------------------------------------------------------------`);
    lines.push('');

    for (const table of group.tables) {
      lines.push(`CREATE TABLE IF NOT EXISTS \`${table.name}\` (`);
      const colLines: string[] = [];

      for (const col of table.columns) {
        const parts: string[] = [`  \`${col.name}\` ${col.dataType}`];
        parts.push(col.nullable ? 'NULL' : 'NOT NULL');
        if (col.isPrimaryKey) {
          parts.push('AUTO_INCREMENT');
        } else if (col.defaultValue !== undefined) {
          parts.push(`DEFAULT ${col.defaultValue}`);
        }
        colLines.push(parts.join(' '));
      }

      const pkCol = table.columns.find((c) => c.isPrimaryKey);
      if (pkCol) {
        colLines.push(`  PRIMARY KEY (\`${pkCol.name}\`)`);
      }

      for (const uq of table.uniqueConstraints) {
        const match = uq.match(/^([a-zA-Z0-9_]+)\s*\((.+)\)$/);
        if (match) {
          colLines.push(`  UNIQUE KEY \`${match[1]}\` (${match[2]})`);
        }
      }

      for (const idx of table.indexes) {
        const match = idx.match(/^([a-zA-Z0-9_]+)\s*\((.+)\)$/);
        if (match) {
          colLines.push(`  KEY \`${match[1]}\` (${match[2]})`);
        }
      }

      for (const col of table.columns) {
        if (col.foreignKey) {
          const [refTable, refCol] = col.foreignKey.split('.');
          colLines.push(
            `  CONSTRAINT \`fk_${table.name}_${col.name}\` FOREIGN KEY (\`${col.name}\`) REFERENCES \`${refTable}\` (\`${refCol}\`) ON UPDATE CASCADE ON DELETE RESTRICT`
          );
        }
      }

      lines.push(colLines.join(',\n'));
      lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
      lines.push('');
    }
  }

  lines.push('SET FOREIGN_KEY_CHECKS = 1;');
  return lines.join('\n');
}

export function downloadMysqlSchemaSQL(): void {
  const ddl = generateMysqlSchemaDDL();
  const blob = new Blob([ddl], { type: 'application/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'multi_school_erp_mysql8_schema.sql');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
