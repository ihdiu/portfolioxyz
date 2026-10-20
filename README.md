# PROJECT PLAN: Animated Portfolio Website (Node.js + Express + MySQL)

> **How to use this file:** This is a build specification for an AI coding agent (Claude Code or a generative IDE). Read the whole file first, then execute the phases in order. After each phase, run the acceptance checks listed for it before moving on. Do not add features that are not listed here. Keep the project small and simple.

---

## 0. Goal

Build a **single-page portfolio website** for a person with a **Computer Science + Electronics** background.

- The **landing page shows everything**: hero, skills, experience, education, research profiles, projects, career path tree, contact.
- Projects open in **modals** on the landing page (no separate project pages).
- A **contact form sends email**.
- An **admin panel** gives full control over all content, section order/visibility, and appearance.
- Design is **animated and transitional**, visually inspired by both **CS** (terminal, code, graph/tree) and **electronics** (PCB traces, signals, LEDs).
- Database is **MySQL 8, normalized to 3NF**.

## 1. Non-Goals (do NOT build)

- No React/Vue/Angular, no TypeScript build pipeline, no bundler required (plain ES modules in the browser).
- No public JSON API for content (landing page is server-rendered). The only public non-page endpoints are `POST /contact` and `GET /healthz`.
- No user registration, comments, blog, or multi-language support.
- No ORM. Use `mysql2/promise` with prepared statements.

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js 20 LTS or newer, ES modules (`"type": "module"`) |
| Web framework | Express 4 |
| Templating | EJS (server-rendered, with partials) |
| Database | MySQL 8, InnoDB, `utf8mb4`, driver `mysql2/promise` (connection pool) |
| Sessions | `express-session` + `express-mysql-session` |
| Passwords | `argon2` |
| Security | `helmet`, `csrf-csrf` (double-submit CSRF), `express-rate-limit`, `zod` validation, EJS auto-escaping (`<%= %>` only; `<%- %>` only for trusted partials) |
| Uploads | `multer` (memory storage), validate MIME + extension + size, optionally `sharp` to resize/convert to WebP |
| Email | `nodemailer` (SMTP via env vars) |
| Misc | `dotenv`, `compression`, `morgan`, `slugify` |
| Frontend | Vanilla JS (ES modules), CSS with custom properties, inline SVG. **No animation library required**; GSAP is NOT used. |
| Fonts | Self-host **Inter** (body) and **JetBrains Mono** (accents). Use `font-display: swap`. |
| Tests | `node:test` + `supertest` for key routes; keep light |

## 3. Folder Structure

```
portfolio/
├── package.json
├── .env.example
├── plan.md
├── README.md
├── database/
│   ├── schema.sql              # full 3NF schema (section 5)
│   ├── seed.sql                # sample data + default sections + domains + platforms
│   └── migrate.js              # runs schema.sql then seed.sql (idempotent flags)
├── scripts/
│   └── create-admin.js         # CLI: node scripts/create-admin.js email password
├── src/
│   ├── server.js               # bootstrap, listen
│   ├── app.js                  # express app factory (middleware, routes)
│   ├── config.js               # env parsing + validation (zod)
│   ├── db.js                   # mysql2 pool + helper query()
│   ├── middleware/
│   │   ├── auth.js             # requireAdmin, login rate limiter
│   │   ├── csrf.js
│   │   ├── upload.js           # multer + validation + sharp
│   │   └── errors.js           # 404 + error handler
│   ├── repositories/           # SQL only, one file per aggregate
│   │   ├── profile.js
│   │   ├── sections.js
│   │   ├── settings.js
│   │   ├── skills.js           # domains, categories, skills
│   │   ├── organizations.js
│   │   ├── experiences.js
│   │   ├── educations.js
│   │   ├── research.js
│   │   ├── projects.js
│   │   ├── careerNodes.js
│   │   ├── messages.js
│   │   └── admins.js
│   ├── services/
│   │   ├── landing.js          # assembles all data for the landing page in parallel
│   │   ├── careerTree.js       # flat rows -> nested tree
│   │   └── mailer.js           # nodemailer wrapper
│   ├── routes/
│   │   ├── public.js           # GET /, POST /contact, GET /healthz
│   │   └── admin/
│   │       ├── index.js        # mounts everything under /admin
│   │       ├── auth.js         # login/logout
│   │       ├── crud.js         # generic config-driven CRUD factory
│   │       ├── resources.js    # resource configs (fields, validation, hooks)
│   │       ├── sections.js     # reorder/toggle visibility
│   │       ├── settings.js     # appearance + site settings
│   │       ├── careerTree.js   # tree editor
│   │       └── messages.js     # contact inbox
│   └── views/
│       ├── layout.ejs
│       ├── landing.ejs
│       ├── sections/           # hero, skills, experience, education, research, projects, career, contact
│       ├── partials/           # nav, footer, project-modal-template, icons
│       └── admin/              # layout, login, dashboard, list, form, tree, settings, messages
├── public/
│   ├── css/
│   │   ├── tokens.css          # design tokens (colors, spacing, type, motion)
│   │   ├── base.css            # reset, typography, layout utilities
│   │   ├── components.css      # cards, chips, buttons, modal, timeline, tree
│   │   ├── animations.css      # keyframes + reveal classes
│   │   └── admin.css           # simple clean admin styling
│   ├── js/
│   │   ├── main.js             # entry (imports below)
│   │   ├── reveal.js           # IntersectionObserver reveals
│   │   ├── nav.js              # scroll-spy + mobile menu + smooth scroll
│   │   ├── theme.js            # dark/light toggle (localStorage)
│   │   ├── typing.js           # hero terminal typing effect
│   │   ├── filters.js          # project domain filters + skill tabs
│   │   ├── modal.js            # <dialog> project modal
│   │   ├── careerTree.js       # tree layout + SVG draw animation
│   │   ├── circuit.js          # hero circuit background + signal pulses
│   │   └── contact.js          # fetch POST /contact with inline feedback
│   ├── fonts/
│   └── img/
├── uploads/                    # runtime uploads (gitignored), served statically with no-exec
└── test/
```

## 4. Environment Variables (`.env.example`)

```
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=portfolio
DB_PASSWORD=change_me
DB_NAME=portfolio

SESSION_SECRET=change_me_long_random
CSRF_SECRET=change_me_long_random

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Portfolio <no-reply@example.com>"
MAIL_TO=you@example.com

# Optional spam protection (Cloudflare Turnstile). If empty, skip captcha.
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET=
```

`config.js` must validate all required vars with `zod` and fail fast with a clear message.

## 5. Database (MySQL 8, 3NF)

### 5.1 Normalization rules applied

- Every non-key column depends on the key, the whole key, and nothing but the key.
- Organizations (companies, universities) live in **one** table and are referenced by experiences and educations. Never repeat organization names.
- Domains (CS, Electronics), skill categories, and research platforms are **lookup tables**.
- Many-to-many relations use **junction tables** (`experience_skills`, `project_skills`).
- The career path tree is an **adjacency list** (`parent_id` self-reference).
- Key/value `site_settings` is used only for appearance and site meta (no repeating groups).
- Session storage is managed by `express-mysql-session` in its own table (outside the domain model).

### 5.2 `database/schema.sql`

```sql
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
```

### 5.3 `database/seed.sql` must include

- `domains`: `(cs, Computer Science)`, `(electronics, Electronics)`
- `sections` (slug, default order): `hero`, `skills`, `experience`, `education`, `research`, `projects`, `career`, `contact`
- `research_platforms`: Google Scholar, ORCID, ResearchGate, IEEE Xplore, GitHub, LinkedIn
- `site_settings` defaults: `theme_default=dark`, `accent_primary=#22d3ee`, `accent_secondary=#f59e0b`, `animations_enabled=1`, `site_title`, `meta_description`, `og_image`
- One `profile` row with placeholder text
- Sample data: ~6 skills per domain, 2 organizations, 2 experiences, 1 education, 3 research profiles, 4 projects (2 CS, 2 Electronics) with skill links, and a career tree of about 10 nodes with 3 levels

### 5.4 Query rules

- All queries use `?` placeholders. Never concatenate user input into SQL.
- Career tree loads with one recursive CTE (or a flat `SELECT` ordered by `parent_id, sort_order`) and is nested in `services/careerTree.js`.
- Landing page data is fetched in **parallel** with `Promise.all` in `services/landing.js`. Skills for projects and experiences are fetched with a single `JOIN` per aggregate and grouped in JS (avoid N+1).
- Cycle prevention: when updating a career node's `parent_id`, reject if the new parent is the node itself or one of its descendants.

## 6. Routes

### 6.1 Public

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Landing page (all visible sections in `sort_order`) |
| POST | `/contact` | Validate, store, and email a message. Returns JSON `{ok, message}` |
| GET | `/healthz` | `200 ok` (also checks DB with `SELECT 1`) |
| GET | `/uploads/*` | Static uploads (no directory listing, `X-Content-Type-Options: nosniff`) |

### 6.2 Admin (all under `/admin`, session-protected except login)

| Path | Purpose |
|---|---|
| `GET/POST /admin/login`, `POST /admin/logout` | Auth |
| `GET /admin` | Dashboard: counts per section, unread messages, quick links |
| `/admin/profile` | Edit the single profile row, upload avatar and resume |
| `/admin/skills`, `/admin/skill-categories`, `/admin/domains` | CRUD |
| `/admin/organizations` | CRUD |
| `/admin/experiences` | CRUD with skill multi-select |
| `/admin/educations` | CRUD |
| `/admin/research-platforms`, `/admin/research-profiles` | CRUD |
| `/admin/projects` | CRUD with skill multi-select, cover upload, optional gallery images |
| `/admin/career` | Tree editor (indented list, parent select, up/down reorder, status) |
| `/admin/sections` | Reorder (up/down) and toggle visibility, edit titles/subtitles |
| `/admin/settings` | Appearance (colors, default theme, animation on/off) + SEO meta |
| `/admin/messages` | Inbox: list, view, mark read, delete |
| `/admin/backup` | Download a SQL dump (use `mysqldump` if available, else a JS table dumper) |

**Generic CRUD factory (`routes/admin/crud.js`):** a function that takes a resource config and generates list / new / create / edit / update / delete routes plus views. Config shape:

```js
{
  name: 'projects',
  table: 'projects',
  label: 'Projects',
  listColumns: ['title', 'domain', 'is_featured', 'sort_order'],
  fields: [
    { name: 'title', type: 'text', required: true, max: 150 },
    { name: 'domain_id', type: 'select', optionsFrom: 'domains' },
    { name: 'summary', type: 'textarea', max: 300 },
    { name: 'cover_path', type: 'image' },
    { name: 'is_featured', type: 'checkbox' },
    { name: 'sort_order', type: 'number', default: 0 },
    { name: 'skills', type: 'multiselect', relation: { junction: 'project_skills', key: 'project_id', other: 'skill_id', optionsFrom: 'skills' } }
  ],
  schema: zodSchema,        // validation
  beforeSave, afterSave     // optional hooks (e.g. slugify)
}
```

Adding a new editable resource should require only a new config entry. Custom screens (sections, settings, career tree, messages) are written by hand.

## 7. Landing Page Spec

Render order and visibility come from the `sections` table. Each section partial receives its data and the section row (title/subtitle). Hidden sections are not rendered and not shown in the nav. Every section has `id="<slug>"`.

| Section | Content & behavior |
|---|---|
| **Hero** | Name, typed roles (terminal-style typing effect from `typed_roles`), short bio, buttons (View Projects, Download Resume, Contact), avatar. Animated circuit-trace SVG background with traveling signal pulses. |
| **Skills** | Tabs or a two-column split: **CS** and **Electronics**. Grouped by category. Each skill shows a chip with an animated proficiency bar. Electronics bars can be styled as LED segments. Bars animate on scroll into view. |
| **Experience** | Vertical timeline. Org logo, role, date range (`Present` when `end_date` is NULL), description, skill chips. Items slide in alternately. |
| **Education** | Timeline cards: degree, field, institution, dates, grade. |
| **Research profiles** | Icon cards linking to external profiles (open in a new tab with `rel="noopener noreferrer"`). |
| **Projects** | Filter bar: All / CS / Electronics. Card grid with cover, title, summary, skill chips. Clicking a card opens a **modal** (native `<dialog>`) with the full description, gallery, skill chips, repo and demo buttons. Filtering animates cards (fade/scale). |
| **Career path** | Interactive SVG tree (see 7.2). |
| **Contact** | Form: name, email, subject, message, honeypot field, optional Turnstile. Submit with `fetch`, show inline success/error, disable button while sending. Plus email and location from profile. |

### 7.1 Project modal implementation

- Render each project's modal content server-side into a hidden `<template id="project-modal-<id>">` inside the projects section (no API calls).
- `modal.js` listens for clicks on `[data-project-id]`, clones the template into a single `<dialog>`, and calls `dialog.showModal()`.
- Requirements: ESC closes, backdrop click closes, focus is trapped natively by `<dialog>`, focus returns to the triggering card on close, body scroll locked while open, URL hash `#project-<slug>` opens the modal directly (deep linking), and open/close use a CSS transition (opacity + translateY, 250 ms).

### 7.2 Career tree spec

- `services/careerTree.js` returns nested JSON; the landing page embeds it as `<script type="application/json" id="career-data">`.
- `public/js/careerTree.js` computes a **horizontal tidy-tree layout** (root at left, children to the right; fixed node width, vertical spacing by leaf count) and renders SVG: curved or right-angle connector paths plus rounded-rect nodes.
- Node styling by status: `done` = filled accent, `in_progress` = pulsing outline, `planned` = dashed outline. Show `target_year` as a small label.
- On scroll into view, edges draw with `stroke-dasharray`/`stroke-dashoffset` (staggered by depth), then nodes fade in.
- Clicking or focusing a node shows its description in a small tooltip/popover. Nodes are keyboard-focusable.
- On narrow screens, switch to a **vertical** indented layout (same data, collapsible branches).
- Also render a `<noscript>` nested `<ul>` fallback so the data is accessible without JS.

## 8. Design System

### 8.1 Tokens (`tokens.css`)

```css
:root {
  /* color (dark default) */
  --bg: #0a0f14;           /* deep PCB navy-green */
  --surface: #111a22;
  --surface-2: #17232d;
  --text: #e6edf3;
  --text-muted: #8fa3b3;
  --accent: var(--accent-primary, #22d3ee);       /* neon cyan */
  --accent-2: var(--accent-secondary, #f59e0b);   /* copper/amber */
  --success: #34d399;
  --border: #22313d;

  /* spacing: strict 8px scale */
  --s1: 4px; --s2: 8px; --s3: 16px; --s4: 24px; --s5: 32px; --s6: 48px; --s7: 64px; --s8: 96px;

  /* type */
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* shape + motion */
  --radius: 12px;
  --ease-out: cubic-bezier(.22,.61,.36,1);
  --dur-fast: 150ms; --dur: 300ms; --dur-slow: 600ms;
}
:root[data-theme="light"] { /* provide a full light palette with AA contrast */ }
```

Admin-configured accent colors and default theme are injected as inline CSS variables on `<html>` from `site_settings`.

### 8.2 CS-inspired motifs

- Monospace for section labels, tags, chips, nav, and code-like headings (e.g., `// skills`, `> projects`, `{ experience }`).
- Hero typing effect with blinking block cursor.
- Syntax-highlight-style coloring for skill chips (keyword, string, function colors derived from the accent palette).
- Career path rendered as a real tree/graph.
- Modular grid and component-like cards with consistent spacing.

### 8.3 Electronics-inspired motifs

- Section dividers: SVG circuit traces with 90° bends and circular solder pads at endpoints.
- Signal pulse: a glowing dot traveling along a trace path (`offset-path` animation or an SVG `<animateMotion>`).
- Section titles with a subtle oscilloscope-style sine/square waveform underline.
- LED-segment proficiency bars for electronics skills; resistor color-band decoration for the Electronics tab (decorative only).
- Card hover: soft copper/cyan edge glow like a lit trace.

### 8.4 Animation and transition rules

- Animate **only `transform` and `opacity`** (plus `stroke-dashoffset` on SVG) to stay GPU-friendly.
- Scroll reveals: `IntersectionObserver` adds `.is-visible`; fade + translateY(24px) → 0, duration 500–600 ms, ease-out; stagger siblings by 80 ms via a CSS variable `--i`.
- Nav: sticky, blur background after scrolling, scroll-spy highlights the active section, smooth scroll with offset for the nav height.
- Page load: short hero entrance sequence (name → typed line → buttons), total under 1.2 s.
- Section tab and filter changes: crossfade, 200–300 ms.
- Theme toggle: transition `background-color` and `color` over 300 ms.
- **Respect `prefers-reduced-motion: reduce`**: disable translate/pulse/typing animations, show final states immediately. Also honor the admin setting `animations_enabled=0` by adding `data-motion="off"` on `<html>` and treating it identically.
- Never block content behind JS: elements are visible by default; JS adds a `js` class to `<html>` that enables the hidden-before-reveal state.

## 9. Contact Form and Email

**Client (`contact.js`):** validate required fields, `fetch('/contact', { method: 'POST', headers: {'Content-Type':'application/json','x-csrf-token': token}, body })`, show inline status with `aria-live="polite"`, reset on success.

**Server (`POST /contact`):**

1. Rate limit: 5 requests per IP per hour (`express-rate-limit`).
2. CSRF check.
3. Validate with `zod`: name (1–120), email (valid, ≤190), subject (≤190, optional), message (10–5000).
4. Spam defenses: hidden honeypot field (if filled, return fake success and discard); minimum time-to-submit check using a signed timestamp in a hidden field (reject if under 3 s); verify Turnstile token if keys are configured.
5. Insert into `contact_messages` first (so nothing is lost if SMTP fails).
6. Send email via `services/mailer.js` (Nodemailer): to `MAIL_TO`, `replyTo` set to the sender, plain-text body plus simple HTML body, with all user content escaped. Strip CR/LF from header fields to prevent header injection.
7. Update `email_sent=1` on success; on SMTP failure, log the error, keep the stored message, and still return success to the visitor with a gentle note.
8. Return `{ ok: true, message: 'Thanks! I will get back to you soon.' }`.

## 10. Security Checklist (must pass)

- `helmet` with a CSP: `default-src 'self'`; scripts from self only (use a per-request nonce for the JSON data script); `img-src 'self' data:`; frame-ancestors none. If Turnstile is enabled, allow `https://challenges.cloudflare.com`.
- Admin sessions: `httpOnly`, `sameSite=lax`, `secure` in production, session ID regenerated on login, 2-hour idle timeout, MySQL session store.
- Login: argon2 verify, constant-time failure message, rate limit 5 attempts per 15 minutes per IP.
- CSRF protection on every state-changing admin route and on `/contact`.
- All DB access via prepared statements; all output escaped by EJS.
- Uploads: allow only JPEG, PNG, WebP, SVG is **not** allowed; PDF allowed only for resume; max 5 MB; random filenames; re-encode images with `sharp` when available; store under `/uploads`, served statically with `nosniff` and never executed.
- External links use `rel="noopener noreferrer"`.
- Validate `http(s)` scheme on all stored URLs (reject `javascript:`).
- `trust proxy` configured for production behind a reverse proxy so rate limiting sees real IPs.
- No secrets in the repo; `.env` is gitignored.
- Generic error pages in production (no stack traces).

## 11. Performance and Accessibility Targets

- Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- Total JS shipped under 50 KB (unminified is fine; keep modules small). No third-party scripts except optional Turnstile.
- Images: lazy-load (`loading="lazy"`, width/height set), WebP preferred, covers resized to max 1200 px.
- Gzip/Brotli via `compression`; long cache headers for `/css`, `/js`, `/fonts` with content hashing or a version query string.
- Semantic HTML: one `<h1>`, landmarks (`header`, `nav`, `main`, `section`, `footer`), skip-to-content link, visible focus rings, `aria-current` on active nav link, modal uses `<dialog>` with an accessible name, tabs use proper roles, color contrast WCAG AA in both themes.
- SEO: `<title>`, meta description, Open Graph and Twitter tags from `site_settings`, canonical URL, `robots.txt`, `sitemap.xml` (single URL), JSON-LD `Person` schema from the profile.

## 12. Build Phases

Work through these in order. Mark each checkbox when done and run the acceptance check before continuing.

### Phase 1: Foundation
- [x] `npm init`, install dependencies, set `"type": "module"`, add scripts: `dev` (node --watch), `start`, `migrate`, `test`
- [x] `config.js`, `db.js`, `app.js`, `server.js`, error middleware, `/healthz`
- [x] `database/schema.sql`, `seed.sql`, `migrate.js`, `scripts/create-admin.js`
- [x] Repositories for all tables
- **Accept:** `npm run migrate` creates all tables; `GET /healthz` returns 200; admin user can be created via CLI.

### Phase 2: Admin auth and generic CRUD
- [x] Session store, CSRF, login/logout, `requireAdmin`
- [x] Admin layout, dashboard, generic CRUD factory with list/form views
- [x] Resource configs for profile, domains, skill categories, skills, organizations, experiences (+skills), educations, research platforms/profiles, projects (+skills, cover, gallery)
- [x] Upload middleware
- **Accept:** can log in, create/edit/delete every resource, validation errors display per field, unauthenticated access to `/admin/*` redirects to login, CSRF failures are rejected.

### Phase 3: Custom admin screens
- [x] Sections manager (reorder, visibility, titles)
- [x] Settings (appearance + SEO)
- [x] Career tree editor with cycle prevention and reorder
- [x] Messages inbox
- [x] Backup download
- **Accept:** changing section order/visibility in admin changes the landing page; tree edits persist; cycle attempts are rejected with a message.

### Phase 4: Landing page (content first, minimal styling)
- [x] `services/landing.js` parallel data assembly
- [x] `landing.ejs` plus all section partials, nav, footer, project modal templates, JSON-LD
- [x] Contact route and mailer with all defenses
- **Accept:** landing page renders all seeded content with no JS; contact form stores a message and sends email (verify with a local SMTP catcher such as MailHog or Mailpit).

### Phase 5: Design and motion
- [x] `tokens.css`, `base.css`, `components.css`, `animations.css`, fonts
- [x] `reveal.js`, `nav.js`, `theme.js`, `typing.js`, `filters.js`, `modal.js`
- [x] `circuit.js` (hero background and section dividers with signal pulses)
- [x] `careerTree.js` (layout, draw animation, mobile vertical mode)
- [x] LED-segment skill bars, waveform headings, hover glows
- **Accept:** every animation in section 8.4 works; reduced-motion and `animations_enabled=0` both disable motion; modal deep-link works; tree is keyboard accessible.

### Phase 6: Polish and hardening
- [x] Responsive pass at 360, 768, 1024, 1440 px
- [x] Accessibility audit (keyboard-only walkthrough, screen reader labels, contrast)
- [x] Lighthouse run and fixes; SEO files (`robots.txt`, `sitemap.xml`)
- [x] Security checklist (section 10) verified item by item
- [x] Tests (see section 13)
- [x] `README.md` with setup, env, migration, admin creation, deployment notes
- **Accept:** all targets in section 11 are met; all tests pass.

## 13. Tests (keep light, `node:test` + `supertest`)

- `GET /` returns 200 and contains seeded name and section ids; a hidden section is absent.
- `POST /contact`: valid → 200 and row stored; invalid → 400 with field errors; honeypot filled → fake 200 and no row; 6th request in an hour → 429.
- Admin: unauthenticated `GET /admin` → redirect to `/admin/login`; POST without CSRF token → 403.
- `careerTree` service: nests rows correctly and rejects cycles.
- Upload validation rejects wrong MIME type and oversized files.

## 14. Deployment Notes (include in README)

- Run behind Nginx or Caddy with HTTPS; set `NODE_ENV=production` and `trust proxy`.
- Process manager: `pm2` or `systemd`.
- Use a dedicated MySQL user with privileges only on the portfolio database.
- Persist `/uploads` outside the release directory; schedule DB backups (cron + `mysqldump`).
- Provide a simple `Dockerfile` and `docker-compose.yml` (app + MySQL + Mailpit for local dev) as an optional convenience.

## 15. Definition of Done

1. All phases complete and all acceptance checks pass.
2. A non-technical owner can change every piece of landing-page content, section order/visibility, colors, and default theme from `/admin` without touching code.
3. The landing page displays: hero, skills, experience, education, research profiles, projects (with modals), career path tree, and a working contact form.
4. Schema is in 3NF with foreign keys and indexes as specified; no N+1 queries on the landing page.
5. Security checklist and performance/accessibility targets are met.
6. Code stays small and readable: no unused dependencies, no dead features, short files with a single responsibility.