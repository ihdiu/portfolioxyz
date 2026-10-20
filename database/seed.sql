SET NAMES utf8mb4;

-- 1. Domains
INSERT INTO domains (id, slug, name) VALUES
  (1, 'cs', 'Computer Science'),
  (2, 'electronics', 'Electronics')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Sections
INSERT INTO sections (slug, title, subtitle, sort_order, is_visible) VALUES
  ('hero', 'Terminal & Circuit', 'System Overview', 1, TRUE),
  ('skills', 'Technical Stack', 'Disciplines across software & hardware engineering', 2, TRUE),
  ('experience', 'Engineering Experience', 'Roles, leadership, and firmware/software contributions', 3, TRUE),
  ('education', 'Academic Background', 'Degrees, honors, and focused coursework', 4, TRUE),
  ('research', 'Research & Publications', 'Scholarly profiles and technical papers', 5, TRUE),
  ('projects', 'Featured Projects', 'Full-stack systems, embedded firmware, and custom hardware', 6, TRUE),
  ('career', 'Career Trajectory', 'Adjacency graph of professional milestones & roadmap', 7, TRUE),
  ('contact', 'Get In Touch', 'Initiate a signal transmission or discuss collaborations', 8, TRUE)
ON DUPLICATE KEY UPDATE title=VALUES(title), subtitle=VALUES(subtitle), sort_order=VALUES(sort_order), is_visible=VALUES(is_visible);

-- 3. Research Platforms
INSERT INTO research_platforms (id, name, icon) VALUES
  (1, 'Google Scholar', 'scholar'),
  (2, 'ORCID', 'orcid'),
  (3, 'ResearchGate', 'researchgate'),
  (4, 'IEEE Xplore', 'ieee'),
  (5, 'GitHub', 'github'),
  (6, 'LinkedIn', 'linkedin')
ON DUPLICATE KEY UPDATE icon=VALUES(icon);

-- 4. Site Settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('theme_default', 'dark'),
  ('accent_primary', '#22d3ee'),
  ('accent_secondary', '#f59e0b'),
  ('animations_enabled', '1'),
  ('site_title', 'Nahid | Embedded Systems & Full-Stack Engineer'),
  ('meta_description', 'Portfolio of a Computer Science & Electronics Engineer specializing in robotics, embedded systems, and scalable web architectures.'),
  ('og_image', '/img/og-preview.png')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- 5. Profile
INSERT INTO profile (id, full_name, headline, typed_roles, bio, email, location, avatar_path, resume_path) VALUES
  (1, 'Nahid Hasan', 'Bridging the Silicon-Software Divide',
   'Computer Systems Engineer, Embedded & IoT Architect, Full-Stack Developer, PCB & Hardware Hacker',
   'Passionate Computer Science & Electronics specialist designing resilient systems from bare-metal C and custom PCB layouts to modern web platforms. Experienced in RTOS, high-speed circuit design, and distributed backends.',
   'nahid@example.com', 'Dhaka, Bangladesh', '/img/avatar.png', '/uploads/resume.pdf')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), headline=VALUES(headline), typed_roles=VALUES(typed_roles), bio=VALUES(bio), email=VALUES(email), location=VALUES(location);

-- 6. Skill Categories
-- CS Categories
INSERT INTO skill_categories (id, domain_id, name, sort_order) VALUES
  (1, 1, 'Languages & Core CS', 1),
  (2, 1, 'Web & Cloud Systems', 2),
  (3, 1, 'Systems & Architecture', 3),
  -- Electronics Categories
  (4, 2, 'Embedded & Firmware', 1),
  (5, 2, 'Hardware & PCB Design', 2),
  (6, 2, 'Protocols & Instrumentation', 3)
ON DUPLICATE KEY UPDATE name=VALUES(name), sort_order=VALUES(sort_order);

-- 7. Skills (~6 per domain)
-- CS Skills
INSERT INTO skills (id, category_id, name, proficiency, icon, sort_order) VALUES
  (1, 1, 'C / C++20', 92, 'cpp', 1),
  (2, 1, 'Python & NumPy', 88, 'python', 2),
  (3, 1, 'JavaScript / Node.js', 90, 'nodejs', 3),
  (4, 2, 'Express & MySQL', 85, 'database', 1),
  (5, 2, 'Linux Kernel & POSIX', 80, 'linux', 2),
  (6, 3, 'Distributed Systems & Docker', 78, 'docker', 1),
  -- Electronics Skills
  (7, 4, 'ARM Cortex-M & FreeRTOS', 90, 'cpu', 1),
  (8, 4, 'ESP32 & STM32 Bare-Metal', 92, 'microchip', 2),
  (9, 5, 'KiCad & High-Speed PCB', 85, 'circuit-board', 1),
  (10, 5, 'Analog & Power Electronics', 82, 'zap', 2),
  (11, 6, 'CAN, I2C, SPI & UART', 94, 'network', 1),
  (12, 6, 'Digital Oscilloscopes & Logic Analyzers', 88, 'activity', 2)
ON DUPLICATE KEY UPDATE proficiency=VALUES(proficiency), sort_order=VALUES(sort_order);

-- 8. Organizations
INSERT INTO organizations (id, name, website, location, logo_path) VALUES
  (1, 'NeuroTech Embedded Labs', 'https://example.com/neurotech', 'Dhaka, Bangladesh', '/img/org-neurotech.svg'),
  (2, 'Apex Silicon Solutions', 'https://example.com/apexsilicon', 'Dhaka, Bangladesh', '/img/org-apex.svg'),
  (3, 'Daffodil International University', 'https://daffodilvarsity.edu.bd', 'Dhaka, Bangladesh', '/img/org-diu.svg')
ON DUPLICATE KEY UPDATE website=VALUES(website), location=VALUES(location);

-- 9. Experiences
INSERT INTO experiences (id, organization_id, role_title, start_date, end_date, description, sort_order) VALUES
  (1, 1, 'Senior Embedded Systems Engineer', '2023-01-15', NULL,
   'Architected low-power IoT telemetry hardware and FreeRTOS firmware for biomedical monitoring. Reduced standby power draw by 42% through deep-sleep state machine optimization. Developed automated hardware-in-the-loop (HIL) test suites in Python.', 1),
  (2, 2, 'Systems & Firmware Developer', '2021-06-01', '2022-12-31',
   'Designed multi-layer PCB layouts in KiCad for industrial motor controllers. Implemented real-time CAN bus telemetry and built an Express + MySQL telemetry dashboard for fleet diagnostics.', 2)
ON DUPLICATE KEY UPDATE role_title=VALUES(role_title), description=VALUES(description);

-- Experience Skills junction
INSERT INTO experience_skills (experience_id, skill_id) VALUES
  (1, 1), (1, 7), (1, 8), (1, 11),
  (2, 3), (2, 4), (2, 9), (2, 11)
ON DUPLICATE KEY UPDATE skill_id=VALUES(skill_id);

-- 10. Education
INSERT INTO educations (id, organization_id, degree, field_of_study, start_date, end_date, grade, description, sort_order) VALUES
  (1, 3, 'Bachelor of Science', 'Computer Science and Engineering & Electronics', '2019-01-10', '2023-05-20', '3.88 / 4.00 (Magna Cum Laude)',
   'Graduated with dual specialization in Embedded Systems and Computer Systems Architecture. Capstone project: Autonomous Sub-GHz Wireless Sensor Grid for Precision Agriculture.', 1)
ON DUPLICATE KEY UPDATE degree=VALUES(degree), description=VALUES(description);

-- 11. Research Profiles
INSERT INTO research_profiles (id, platform_id, profile_url, display_label, sort_order) VALUES
  (1, 1, 'https://scholar.google.com', 'Google Scholar Citations', 1),
  (2, 2, 'https://orcid.org', 'ORCID: 0000-0002-1825-0097', 2),
  (3, 4, 'https://ieeexplore.ieee.org', 'IEEE Xplore Author Profile', 3),
  (4, 5, 'https://github.com', 'GitHub Repositories', 4)
ON DUPLICATE KEY UPDATE profile_url=VALUES(profile_url), display_label=VALUES(display_label);

-- 12. Projects (2 CS, 2 Electronics)
INSERT INTO projects (id, domain_id, slug, title, summary, description, repo_url, demo_url, cover_path, is_featured, sort_order) VALUES
  (1, 1, 'telemetry-stream-engine', 'Real-Time Edge Telemetry Stream Engine',
   'High-throughput message pipeline and real-time visualization platform for industrial IoT nodes.',
   'Designed a distributed time-series ingestion engine utilizing WebSockets, Express, and MySQL connection pooling.\n\nKey Highlights:\n- Ingests 15,000 sensor frames/sec with sub-20ms latency\n- In-memory ring-buffer for fast anomaly detection\n- Interactive canvas waveform oscilloscope',
   'https://github.com/example/telemetry-stream', 'https://demo.example.com/telemetry', '/img/proj-telemetry.jpg', TRUE, 1),
  (2, 1, 'micro-kernel-scheduler', 'Preemptive Cooperative Microkernel',
   'Lightweight real-time scheduler written in ANSI C with prioritized task queues and IPC channels.',
   'Developed an educational microkernel for ARM Cortex-M processors.\n\nKey Highlights:\n- Round-robin preemptive scheduler using SysTick timer\n- Zero-copy ring buffer IPC with semaphore primitives\n- Memory footprint under 4KB RAM',
   'https://github.com/example/micro-kernel', NULL, '/img/proj-kernel.jpg', TRUE, 2),
  (3, 2, 'neural-ecg-acquisition-board', 'Precision Low-Noise Bio-Potential Board',
   '4-layer PCB with instrumentation amplifiers, 24-bit ADC, and Bluetooth LE for wearable ECG capture.',
   'Custom mixed-signal PCB designed in KiCad for medical telemetry.\n\nKey Highlights:\n- CMRR > 110 dB with driven-right-leg (DRL) circuitry\n- Ultra-low noise power supply with linear LDO regulators\n- STM32WB55 dual-core wireless MCU running custom GATT server',
   'https://github.com/example/neural-ecg-hardware', 'https://demo.example.com/ecg', '/img/proj-ecg.jpg', TRUE, 3),
  (4, 2, 'sub-ghz-mesh-repeater', 'Solar-Harvesting Sub-GHz Mesh Repeater',
   'Ruggedized outdoor wireless transceivers utilizing LoRa modulation and MPPT solar charging.',
   'Hardware design and firmware for remote environmental mesh networks.\n\nKey Highlights:\n- Semtech SX1262 transceiver operating at 915 MHz\n- BQ25570 energy harvester powering system from a 2W solar cell\n- Over-the-air (OTA) encrypted firmware updates over LoRa',
   'https://github.com/example/subghz-mesh', NULL, '/img/proj-mesh.jpg', FALSE, 4)
ON DUPLICATE KEY UPDATE title=VALUES(title), summary=VALUES(summary), description=VALUES(description);

-- Project Skills junction
INSERT INTO project_skills (project_id, skill_id) VALUES
  (1, 1), (1, 3), (1, 4), (1, 6),
  (2, 1), (2, 5), (2, 7),
  (3, 7), (3, 8), (3, 9), (3, 10),
  (4, 8), (4, 9), (4, 10), (4, 11)
ON DUPLICATE KEY UPDATE skill_id=VALUES(skill_id);

-- 13. Career Path Nodes (Adjacency list with ~10 nodes across 3 levels)
INSERT INTO career_nodes (id, parent_id, title, description, status, target_year, sort_order) VALUES
  (1, NULL, 'Electronics & CS Foundation', 'Core fundamentals in circuit analysis, digital logic, and data structures', 'done', 2019, 1),
  (2, 1, 'Embedded Firmware Specialist', 'Bare-metal programming, RTOS architectures, and hardware interfaces', 'done', 2021, 1),
  (3, 1, 'Systems Software Developer', 'Operating systems, network programming, and distributed databases', 'done', 2022, 2),
  (4, 2, 'Mixed-Signal PCB Designer', 'High-speed routing, RF front-ends, and impedance matching', 'done', 2023, 1),
  (5, 2, 'IoT Hardware Architect', 'Ultra-low-power edge devices with wireless mesh networking', 'in_progress', 2024, 2),
  (6, 3, 'Full-Stack Telemetry Platforms', 'High-performance real-time web telemetry and data pipelines', 'done', 2024, 1),
  (7, 3, 'Distributed Edge Infrastructure', 'Edge compute nodes running containerized microservices', 'in_progress', 2025, 2),
  (8, 4, 'Custom Silicon & ASIC Prototyping', 'Verilog/VHDL logic design and FPGA prototyping', 'planned', 2026, 1),
  (9, 5, 'Autonomous Robotics Systems', 'ROS2 integration, motor control loops, and sensor fusion', 'in_progress', 2026, 2),
  (10, 7, 'Principal Systems Architect', 'Unifying silicon hardware, embedded firmware, and global cloud backends', 'planned', 2027, 1)
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), status=VALUES(status), target_year=VALUES(target_year);
