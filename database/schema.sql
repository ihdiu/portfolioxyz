SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS admin_users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Single-row table (id is always 1)
CREATE TABLE IF NOT EXISTS profile (
  id           TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  full_name    VARCHAR(120) NOT NULL,
  headline     VARCHAR(190) NULL,
  typed_roles  VARCHAR(300) NULL,          -- comma-separated strings for the typing effect
  bio          TEXT NULL,
  email        VARCHAR(190) NULL,
  location     VARCHAR(120) NULL,
  avatar_path  VARCHAR(255) NULL,
  resume_path  VARCHAR(255) NULL,
  CONSTRAINT ck_profile_single CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key   VARCHAR(80) PRIMARY KEY,
  setting_value TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Landing page layout control
CREATE TABLE IF NOT EXISTS sections (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug       VARCHAR(50)  NOT NULL,
  title      VARCHAR(100) NOT NULL,
  subtitle   VARCHAR(190) NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_visible BOOLEAN  NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_sections_slug (slug),
  KEY ix_sections_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS domains (
  id   TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(30) NOT NULL,                -- 'cs', 'electronics'
  name VARCHAR(50) NOT NULL,                -- 'Computer Science', 'Electronics'
  UNIQUE KEY uq_domains_slug (slug),
  UNIQUE KEY uq_domains_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS skill_categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  domain_id  TINYINT UNSIGNED NOT NULL,
  name       VARCHAR(80) NOT NULL,          -- Languages, Embedded, PCB Design...
  sort_order SMALLINT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_cat_domain_name (domain_id, name),
  KEY ix_cat_sort (sort_order),
  CONSTRAINT fk_cat_domain FOREIGN KEY (domain_id) REFERENCES domains(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS skills (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name        VARCHAR(80) NOT NULL,
  proficiency TINYINT UNSIGNED NOT NULL DEFAULT 50,   -- 0..100
  icon        VARCHAR(80) NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_skill_cat_name (category_id, name),
  KEY ix_skill_sort (sort_order),
  CONSTRAINT ck_skill_prof CHECK (proficiency <= 100),
  CONSTRAINT fk_skill_cat FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS organizations (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(150) NOT NULL,
  website   VARCHAR(255) NULL,
  location  VARCHAR(120) NULL,
  logo_path VARCHAR(255) NULL,
  UNIQUE KEY uq_org_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS experiences (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id INT UNSIGNED NOT NULL,
  role_title      VARCHAR(150) NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NULL,                -- NULL = present
  description     TEXT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  KEY ix_exp_org (organization_id),
  KEY ix_exp_sort (sort_order),
  CONSTRAINT fk_exp_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS experience_skills (
  experience_id INT UNSIGNED NOT NULL,
  skill_id      INT UNSIGNED NOT NULL,
  PRIMARY KEY (experience_id, skill_id),
  KEY ix_es_skill (skill_id),
  CONSTRAINT fk_es_exp   FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
  CONSTRAINT fk_es_skill FOREIGN KEY (skill_id)      REFERENCES skills(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS educations (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organization_id INT UNSIGNED NOT NULL,
  degree          VARCHAR(120) NOT NULL,
  field_of_study  VARCHAR(120) NULL,
  start_date      DATE NULL,
  end_date        DATE NULL,
  grade           VARCHAR(40) NULL,
  description     TEXT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  KEY ix_edu_org (organization_id),
  KEY ix_edu_sort (sort_order),
  CONSTRAINT fk_edu_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS research_platforms (
  id   TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,                -- Google Scholar, ORCID, ResearchGate, IEEE Xplore, GitHub...
  icon VARCHAR(80) NULL,
  UNIQUE KEY uq_platform_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS research_profiles (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  platform_id   TINYINT UNSIGNED NOT NULL,
  profile_url   VARCHAR(255) NOT NULL,
  display_label VARCHAR(100) NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  KEY ix_rp_platform (platform_id),
  KEY ix_rp_sort (sort_order),
  CONSTRAINT fk_rp_platform FOREIGN KEY (platform_id) REFERENCES research_platforms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  domain_id   TINYINT UNSIGNED NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  title       VARCHAR(150) NOT NULL,
  summary     VARCHAR(300) NULL,
  description TEXT NULL,                    -- shown in the modal (plain text with line breaks)
  repo_url    VARCHAR(255) NULL,
  demo_url    VARCHAR(255) NULL,
  cover_path  VARCHAR(255) NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_project_slug (slug),
  KEY ix_proj_domain (domain_id),
  KEY ix_proj_sort (sort_order),
  CONSTRAINT fk_proj_domain FOREIGN KEY (domain_id) REFERENCES domains(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_images (   -- optional gallery inside the modal
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  caption    VARCHAR(190) NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  KEY ix_pi_project (project_id),
  CONSTRAINT fk_pi_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_skills (
  project_id INT UNSIGNED NOT NULL,
  skill_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (project_id, skill_id),
  KEY ix_ps_skill (skill_id),
  CONSTRAINT fk_ps_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_skill   FOREIGN KEY (skill_id)   REFERENCES skills(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS career_nodes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id   INT UNSIGNED NULL,
  title       VARCHAR(120) NOT NULL,
  description VARCHAR(300) NULL,
  status      ENUM('done','in_progress','planned') NOT NULL DEFAULT 'planned',
  target_year SMALLINT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  KEY ix_cn_parent (parent_id),
  KEY ix_cn_sort (sort_order),
  CONSTRAINT fk_cn_parent FOREIGN KEY (parent_id) REFERENCES career_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  subject    VARCHAR(190) NULL,
  message    TEXT NOT NULL,
  ip_address VARCHAR(45) NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_cm_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
