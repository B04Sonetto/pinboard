-- ============================================================================
-- LSPU taxonomy corrections and missing subjects/topics
-- Idempotent. Run after supabase/setup.sql.
--
-- Fixes:
--   * Every LSPU program has at least one subject, so students in CCJE, CIT,
--     CIHTM, BSEE, BSECE, BSOA, MIT, BPEd, BTLEd, BTVTEd, CTP and BSEd can
--     create notes.
--   * Notes are realigned to their subject's department and program.
-- ============================================================================
insert into public.departments (id, name, short_name, color, description, sort_order) values
  ('as',    'College of Arts and Sciences',                         'CAS',   '#DCD0FF', 'Biology and psychology programs.', 1),
  ('bus',   'College of Business Administration and Accountancy',   'CBAA',  '#BFE0FF', 'Accountancy, business administration, and office administration.', 2),
  ('cs',    'College of Computer Studies',                           'CCS',   '#FFE680', 'Computer science and information technology programs.', 3),
  ('ccje',  'College of Criminal Justice Education',                 'CCJE',  '#FFC9A8', 'Criminology and criminal justice education.', 4),
  ('eng',   'College of Engineering',                                'COE',   '#BDEBCB', 'Computer, electrical, and electronics engineering.', 5),
  ('cit',   'College of Industrial Technology',                       'CIT',   '#AEE4DF', 'Industrial technology and its applied specializations.', 6),
  ('cihtm', 'College of International Hospitality and Tourism Management', 'CIHTM', '#FFD3A8', 'Hospitality and tourism management programs.', 7),
  ('edu',   'College of Teacher Education',                           'CTE',   '#FFC9DC', 'Elementary, secondary, physical, and technical-vocational teacher education.', 8)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  color = excluded.color,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- ── Programs ────────────────────────────────────────────────────────────────
insert into public.programs (id, department_id, name, code, description) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'cs',  'Bachelor of Science in Information Technology', 'BSInfoTech', 'Specializations: Animation and Motion Graphics; Systems Management/Development; Web and Mobile App Development.'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'cs',  'Bachelor of Science in Computer Science', 'BSCS', 'Graphics and Visual Computing.'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'bus', 'Bachelor of Science in Accountancy', 'BSA', 'Accountancy and professional accounting practice.'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'bus', 'Bachelor of Science in Business Administration', 'BSBA', 'Majors: Financial Management and Marketing Management.'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'edu', 'Bachelor of Elementary Education', 'BEEd', 'Elementary teaching and learning.'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'edu', 'Bachelor of Secondary Education', 'BSEd', 'Secondary teaching and learning.'),
  ('aaaaaaaa-0000-4000-8000-000000000007', 'eng', 'Bachelor of Science in Computer Engineering', 'BSCpE', 'Computer hardware, software, and systems engineering.'),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'eng', 'Bachelor of Science in Electrical Engineering', 'BSEE', 'Electrical systems, circuits, and power engineering.'),
  ('aaaaaaaa-0000-4000-8000-000000000009', 'as',  'Bachelor of Science in Biology', 'BSBio', 'Biological sciences and laboratory study.'),
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'as',  'Bachelor of Science in Psychology', 'BSPsych', 'Behavior, cognition, and psychological research.'),
  ('aaaaaaaa-0000-4000-8000-00000000000b', 'bus', 'Bachelor of Science in Office Administration', 'BSOA', 'Office systems, administration, and professional communication.'),
  ('aaaaaaaa-0000-4000-8000-00000000000c', 'cs',  'Master in Information Technology', 'MIT', 'Graduate study in information technology.'),
  ('aaaaaaaa-0000-4000-8000-00000000000d', 'ccje', 'Bachelor of Science in Criminology', 'BSCrim', 'Criminology and criminal justice.'),
  ('aaaaaaaa-0000-4000-8000-00000000000e', 'eng', 'Bachelor of Science in Electronics Engineering', 'BSECE', 'Electronic systems and communications engineering.'),
  ('aaaaaaaa-0000-4000-8000-00000000000f', 'cihtm', 'Bachelor of Science in Hospitality Management', 'BSHM', 'Hospitality services and management.'),
  ('aaaaaaaa-0000-4000-8000-000000000010', 'cihtm', 'Bachelor of Science in Tourism Management', 'BSTM', 'Tourism operations and destination management.'),
  ('aaaaaaaa-0000-4000-8000-000000000011', 'edu', 'Bachelor of Physical Education', 'BPEd', 'Physical education, movement, and wellness.'),
  ('aaaaaaaa-0000-4000-8000-000000000012', 'edu', 'Bachelor of Technology and Livelihood Education', 'BTLEd', 'Technology and livelihood education.'),
  ('aaaaaaaa-0000-4000-8000-000000000013', 'edu', 'Bachelor of Technical-Vocational Teacher Education', 'BTVTEd', 'Technical-vocational teaching and training.'),
  ('aaaaaaaa-0000-4000-8000-000000000014', 'edu', 'Certificate in Teaching Program', 'CTP', 'Professional teaching preparation.'),
  ('aaaaaaaa-0000-4000-8000-000000000015', 'cit', 'Bachelor of Science in Industrial Technology', 'BSIT', 'Majors: Automotive Technology (AT), Architectural Drafting Technology (AD), Electrical Technology (ELT), Electronics Technology (ELX), Food Preparation and Services Management (FBPSM), and Heating, Ventilation, Air Conditioning, and Refrigeration (HVACR).')
on conflict (id) do update set
  department_id = excluded.department_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description;

-- ── Subjects ────────────────────────────────────────────────────────────────
insert into public.subjects (id, program_id, department_id, code, name, year_level, semester, description, is_community) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'cs', 'DBMS101', 'Database Management', 2, 1, 'Relational modeling, normalization, SQL and transactions.', true),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'cs', 'NET201', 'Networking 1', 2, 1, 'OSI and TCP/IP models, addressing and subnetting.', true),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'cs', 'WEB202', 'Web Systems', 2, 1, 'Server-side architecture, routing and templating.', true),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000002', 'cs', 'DS101', 'Data Structures & Algorithms', 2, 2, 'Complexity, lists, trees, graphs and searching.', true),
  ('bbbbbbbb-0000-4000-8000-000000000005', 'aaaaaaaa-0000-4000-8000-000000000001', 'cs', 'CAP401', 'Capstone Project 1', 4, 1, 'Proposal, prototyping and defense preparation.', true),
  ('bbbbbbbb-0000-4000-8000-000000000006', 'aaaaaaaa-0000-4000-8000-000000000003', 'bus', 'ACC101', 'Fundamentals of Accounting', 1, 2, 'The accounting cycle, journals, ledgers and statements.', true),
  ('bbbbbbbb-0000-4000-8000-000000000007', 'aaaaaaaa-0000-4000-8000-000000000003', 'bus', 'COST201', 'Cost Accounting', 2, 2, 'Job order, process costing and overhead allocation.', true),
  ('bbbbbbbb-0000-4000-8000-000000000008', 'aaaaaaaa-0000-4000-8000-000000000004', 'bus', 'MGT101', 'Principles of Management', 1, 1, 'Planning, organizing, leading and controlling.', true),
  ('bbbbbbbb-0000-4000-8000-000000000009', 'aaaaaaaa-0000-4000-8000-000000000005', 'edu', 'EDUC201', 'Teaching Strategies', 3, 1, 'Lesson design, questioning and classroom assessment.', true),
  ('bbbbbbbb-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000005', 'edu', 'EDUC105', 'Child & Adolescent Development', 1, 1, 'Physical, cognitive and socio-emotional development.', true),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'aaaaaaaa-0000-4000-8000-000000000007', 'eng', 'PHYS101', 'Physics for Engineers', 1, 1, 'Mechanics, kinematics and Newtonian dynamics.', true),
  ('bbbbbbbb-0000-4000-8000-00000000000c', 'aaaaaaaa-0000-4000-8000-000000000007', 'eng', 'MECH201', 'Mechanics of Deformable Bodies', 2, 2, 'Stress, strain, beams and bending moments.', true),
  ('bbbbbbbb-0000-4000-8000-00000000000d', 'aaaaaaaa-0000-4000-8000-00000000000a', 'as', 'SOC101', 'Understanding Society', 1, 1, 'Culture, institutions and social structure.', true),
  ('bbbbbbbb-0000-4000-8000-00000000000e', 'aaaaaaaa-0000-4000-8000-00000000000a', 'as', 'PSY101', 'Introduction to Psychology', 1, 1, 'Learning, memory, development and research.', true),
  ('bbbbbbbb-0000-4000-8000-00000000000f', 'aaaaaaaa-0000-4000-8000-00000000000a', 'as', 'COMM101', 'Media & Society', 1, 2, 'Media literacy, audiences and communication ethics.', true),
  ('bbbbbbbb-0000-4000-8000-000000000010', 'aaaaaaaa-0000-4000-8000-000000000006', 'edu', 'EDUC210', 'Foundations of Secondary Education', 2, 1, 'Adolescent learning, curriculum, and subject-area pedagogy.', true),
  ('bbbbbbbb-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000006', 'edu', 'ASSESS201', 'Assessment of Learning 1', 3, 1, 'Test construction, grading, and feedback.', true),
  ('bbbbbbbb-0000-4000-8000-000000000012', 'aaaaaaaa-0000-4000-8000-000000000008', 'eng', 'EE201', 'Electrical Circuits 1', 2, 1, 'DC circuits, network theorems, and circuit analysis.', true),
  ('bbbbbbbb-0000-4000-8000-000000000013', 'aaaaaaaa-0000-4000-8000-000000000008', 'eng', 'EE301', 'Power Systems', 3, 2, 'Generation, transmission, and distribution fundamentals.', true),
  ('bbbbbbbb-0000-4000-8000-000000000014', 'aaaaaaaa-0000-4000-8000-00000000000b', 'bus', 'OA101', 'Office Procedures and Administration', 1, 1, 'Office systems, records, and professional communication.', true),
  ('bbbbbbbb-0000-4000-8000-000000000015', 'aaaaaaaa-0000-4000-8000-00000000000b', 'bus', 'OA201', 'Business Communication', 2, 2, 'Correspondence, reports, and workplace etiquette.', true),
  ('bbbbbbbb-0000-4000-8000-000000000016', 'aaaaaaaa-0000-4000-8000-00000000000c', 'cs', 'MIT501', 'Advanced Database Systems', 1, 1, 'Distributed databases, tuning, and data modeling.', true),
  ('bbbbbbbb-0000-4000-8000-000000000017', 'aaaaaaaa-0000-4000-8000-00000000000c', 'cs', 'MIT502', 'Research Methods in IT', 1, 2, 'Research design, literature review, and academic writing.', true),
  ('bbbbbbbb-0000-4000-8000-000000000018', 'aaaaaaaa-0000-4000-8000-00000000000d', 'ccje', 'CRIM101', 'Introduction to Criminology', 1, 1, 'Theories of crime, criminal behavior, and the justice system.', true),
  ('bbbbbbbb-0000-4000-8000-000000000019', 'aaaaaaaa-0000-4000-8000-00000000000d', 'ccje', 'CRIM201', 'Criminal Law 1', 2, 1, 'Felonies, elements of crimes, and criminal liability.', true),
  ('bbbbbbbb-0000-4000-8000-00000000001a', 'aaaaaaaa-0000-4000-8000-00000000000d', 'ccje', 'CRIM301', 'Criminalistics', 3, 2, 'Forensic science, evidence collection, and laboratory examination.', true),
  ('bbbbbbbb-0000-4000-8000-00000000001b', 'aaaaaaaa-0000-4000-8000-00000000000d', 'ccje', 'CRIM401', 'Criminal Justice System', 4, 1, 'The pillars of the justice system and case flow.', true),
  ('bbbbbbbb-0000-4000-8000-00000000001c', 'aaaaaaaa-0000-4000-8000-00000000000e', 'eng', 'ECE201', 'Electronic Circuits', 2, 1, 'Diodes, transistors, amplifiers, and circuit troubleshooting.', true),
  ('bbbbbbbb-0000-4000-8000-00000000001d', 'aaaaaaaa-0000-4000-8000-00000000000e', 'eng', 'ECE301', 'Signals and Systems', 3, 1, 'Continuous and discrete signals, transforms, and filters.', true),
  ('bbbbbbbb-0000-4000-8000-00000000001e', 'aaaaaaaa-0000-4000-8000-00000000000f', 'cihtm', 'HM101', 'Fundamentals of Hospitality Management', 1, 1, 'Hospitality operations, service standards, and guest experience.', true),
  ('bbbbbbbb-0000-4000-8000-00000000001f', 'aaaaaaaa-0000-4000-8000-00000000000f', 'cihtm', 'HM201', 'Food and Beverage Operations', 2, 2, 'Restaurant service, cost control, and menu planning.', true),
  ('bbbbbbbb-0000-4000-8000-000000000020', 'aaaaaaaa-0000-4000-8000-000000000010', 'cihtm', 'TM101', 'Principles of Tourism', 1, 1, 'Tourism systems, destinations, and sustainability.', true),
  ('bbbbbbbb-0000-4000-8000-000000000021', 'aaaaaaaa-0000-4000-8000-000000000010', 'cihtm', 'TM201', 'Tourism Planning and Development', 3, 1, 'Destination planning, policy, and community impact.', true),
  ('bbbbbbbb-0000-4000-8000-000000000022', 'aaaaaaaa-0000-4000-8000-000000000011', 'edu', 'PE101', 'Foundations of Physical Education', 1, 1, 'Movement concepts, fitness, and health-related activity.', true),
  ('bbbbbbbb-0000-4000-8000-000000000023', 'aaaaaaaa-0000-4000-8000-000000000011', 'edu', 'PE201', 'Sports and Games Coaching', 2, 2, 'Coaching principles, drills, and sportsmanship.', true),
  ('bbbbbbbb-0000-4000-8000-000000000024', 'aaaaaaaa-0000-4000-8000-000000000012', 'edu', 'TLE101', 'Introduction to Technology and Livelihood Education', 1, 1, 'TLE curriculum, tools, and laboratory safety.', true),
  ('bbbbbbbb-0000-4000-8000-000000000025', 'aaaaaaaa-0000-4000-8000-000000000012', 'edu', 'TLE201', 'Instructional Materials in TLE', 2, 1, 'Preparing and evaluating hands-on learning materials.', true),
  ('bbbbbbbb-0000-4000-8000-000000000026', 'aaaaaaaa-0000-4000-8000-000000000013', 'edu', 'TVT101', 'Foundations of Technical-Vocational Education', 1, 1, 'TVET systems, competency standards, and training design.', true),
  ('bbbbbbbb-0000-4000-8000-000000000027', 'aaaaaaaa-0000-4000-8000-000000000013', 'edu', 'TVT201', 'Assessment in Technical-Vocational Education', 2, 2, 'Competency assessment, rubrics, and feedback.', true),
  ('bbbbbbbb-0000-4000-8000-000000000028', 'aaaaaaaa-0000-4000-8000-000000000014', 'edu', 'CTP101', 'Foundations of Teaching', 1, 1, 'Learner-centered teaching, classroom management, and ethics.', true),
  ('bbbbbbbb-0000-4000-8000-000000000029', 'aaaaaaaa-0000-4000-8000-000000000014', 'edu', 'CTP102', 'Field Study and Practice Teaching', 1, 2, 'Observation, lesson delivery, and reflective practice.', true),
  ('bbbbbbbb-0000-4000-8000-00000000002a', 'aaaaaaaa-0000-4000-8000-000000000015', 'cit', 'DRFT101', 'Technical Drafting', 1, 1, 'Orthographic projection, dimensioning, and CAD basics.', true),
  ('bbbbbbbb-0000-4000-8000-00000000002b', 'aaaaaaaa-0000-4000-8000-000000000015', 'cit', 'ELEC101', 'Basic Electricity', 1, 2, 'Circuits, Ohm''s law, and electrical safety.', true),
  ('bbbbbbbb-0000-4000-8000-00000000002c', 'aaaaaaaa-0000-4000-8000-000000000015', 'cit', 'AUTO101', 'Automotive Fundamentals', 2, 1, 'Engine systems, tools, and preventive maintenance.', true),
  ('bbbbbbbb-0000-4000-8000-00000000002d', 'aaaaaaaa-0000-4000-8000-000000000015', 'cit', 'HVAC101', 'Refrigeration and Air Conditioning', 2, 2, 'Refrigeration cycle, components, and servicing.', true),
  ('bbbbbbbb-0000-4000-8000-00000000002e', 'aaaaaaaa-0000-4000-8000-000000000015', 'cit', 'FBPSM101', 'Food Preparation and Service Management', 2, 2, 'Food safety, preparation methods, and service operations.', true),
  ('bbbbbbbb-0000-4000-8000-00000000002f', 'aaaaaaaa-0000-4000-8000-000000000015', 'cit', 'ELX201', 'Electronics Technology', 2, 1, 'Semiconductors, circuits, and troubleshooting.', true),
  ('bbbbbbbb-0000-4000-8000-000000000030', 'aaaaaaaa-0000-4000-8000-000000000015', 'cit', 'ARCH201', 'Architectural Drafting', 2, 2, 'Building plans, elevations, and detailing.', true),
  ('bbbbbbbb-0000-4000-8000-000000000031', 'aaaaaaaa-0000-4000-8000-000000000009', 'as', 'BIO101', 'General Biology 1', 1, 1, 'Cell structure, genetics, and biological processes.', true),
  ('bbbbbbbb-0000-4000-8000-000000000032', 'aaaaaaaa-0000-4000-8000-000000000009', 'as', 'BIO201', 'Ecology and Evolution', 2, 2, 'Populations, ecosystems, and evolutionary mechanisms.', true)
on conflict (id) do update set
  program_id = excluded.program_id,
  department_id = excluded.department_id,
  code = excluded.code,
  name = excluded.name,
  year_level = excluded.year_level,
  semester = excluded.semester,
  description = excluded.description;

-- ── Topics ──────────────────────────────────────────────────────────────────
insert into public.topics (id, subject_id, name, description) values
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Normalization', 'Functional dependencies, 1NF to 3NF, and avoiding anomalies.'),
  ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000001', 'ER Modeling', 'Entities, relationships, cardinality and keys.'),
  ('cccccccc-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000001', 'SQL Joins', 'Inner, left, right and full joins with worked examples.'),
  ('cccccccc-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000002', 'OSI Model', 'The seven layers and what each one is responsible for.'),
  ('cccccccc-0000-4000-8000-000000000005', 'bbbbbbbb-0000-4000-8000-000000000002', 'Subnetting', 'Masks, host ranges and practical subnetting drills.'),
  ('cccccccc-0000-4000-8000-000000000006', 'bbbbbbbb-0000-4000-8000-000000000003', 'MVC & Routing', 'How requests move through routes, controllers and views.'),
  ('cccccccc-0000-4000-8000-000000000007', 'bbbbbbbb-0000-4000-8000-000000000003', 'Authentication Basics', 'Sessions, hashing and protecting routes.'),
  ('cccccccc-0000-4000-8000-000000000008', 'bbbbbbbb-0000-4000-8000-000000000004', 'Big-O Analysis', 'Growth rates and how to read complexity at a glance.'),
  ('cccccccc-0000-4000-8000-000000000009', 'bbbbbbbb-0000-4000-8000-000000000004', 'Trees & Traversal', 'Binary trees, DFS, BFS and recursion patterns.'),
  ('cccccccc-0000-4000-8000-00000000000a', 'bbbbbbbb-0000-4000-8000-000000000005', 'Defense Preparation', 'Panel questions, demo flow and documentation.'),
  ('cccccccc-0000-4000-8000-00000000000b', 'bbbbbbbb-0000-4000-8000-000000000006', 'Accounting Cycle', 'From journal entries to the post-closing trial balance.'),
  ('cccccccc-0000-4000-8000-00000000000c', 'bbbbbbbb-0000-4000-8000-000000000006', 'Journal Entries', 'Debits, credits and the rules that decide them.'),
  ('cccccccc-0000-4000-8000-00000000000d', 'bbbbbbbb-0000-4000-8000-000000000007', 'Job Order Costing', 'Costing distinct jobs, overhead and variances.'),
  ('cccccccc-0000-4000-8000-00000000000e', 'bbbbbbbb-0000-4000-8000-000000000009', 'Lesson Planning', 'Objectives, motivation, discussion and evaluation.'),
  ('cccccccc-0000-4000-8000-00000000000f', 'bbbbbbbb-0000-4000-8000-000000000009', 'Assessment Design', 'Formative, summative and authentic assessment.'),
  ('cccccccc-0000-4000-8000-000000000010', 'bbbbbbbb-0000-4000-8000-00000000000a', 'Cognitive Development', 'Piaget, Vygotsky and classroom applications.'),
  ('cccccccc-0000-4000-8000-000000000011', 'bbbbbbbb-0000-4000-8000-00000000000a', 'Learning Theories', 'Behaviorism, constructivism and social learning.'),
  ('cccccccc-0000-4000-8000-000000000012', 'bbbbbbbb-0000-4000-8000-00000000000b', 'Kinematics', 'Motion equations, projectiles and sign conventions.'),
  ('cccccccc-0000-4000-8000-000000000013', 'bbbbbbbb-0000-4000-8000-00000000000b', 'Newton''s Laws', 'Forces, free-body diagrams and equilibrium.'),
  ('cccccccc-0000-4000-8000-000000000014', 'bbbbbbbb-0000-4000-8000-00000000000c', 'Beam Analysis', 'Reactions, shear and bending moment diagrams.'),
  ('cccccccc-0000-4000-8000-000000000015', 'bbbbbbbb-0000-4000-8000-00000000000c', 'Stress & Strain', 'Axial stress, deformation and material behavior.'),
  ('cccccccc-0000-4000-8000-000000000016', 'bbbbbbbb-0000-4000-8000-00000000000d', 'Culture & Society', 'Norms, values, symbols and social structure.'),
  ('cccccccc-0000-4000-8000-000000000017', 'bbbbbbbb-0000-4000-8000-00000000000d', 'Social Institutions', 'Family, education, religion and government.'),
  ('cccccccc-0000-4000-8000-000000000018', 'bbbbbbbb-0000-4000-8000-00000000000e', 'Memory & Learning', 'Encoding, retrieval, spacing and metacognition.'),
  ('cccccccc-0000-4000-8000-000000000019', 'bbbbbbbb-0000-4000-8000-00000000000f', 'Media Literacy', 'Source evaluation, framing and responsible sharing.'),
  ('cccccccc-0000-4000-8000-00000000001a', 'bbbbbbbb-0000-4000-8000-000000000007', 'Process Costing', 'Equivalent units and cost allocation across departments.'),
  ('cccccccc-0000-4000-8000-00000000001b', 'bbbbbbbb-0000-4000-8000-000000000005', 'Documentation', 'Writing the technical chapters of a capstone paper.'),
  ('cccccccc-0000-4000-8000-00000000001c', 'bbbbbbbb-0000-4000-8000-000000000010', 'Adolescent Learning', 'How secondary students think, motivate themselves, and learn.'),
  ('cccccccc-0000-4000-8000-00000000001d', 'bbbbbbbb-0000-4000-8000-000000000011', 'Test Construction', 'Table of specifications, item types, and validity.'),
  ('cccccccc-0000-4000-8000-00000000001e', 'bbbbbbbb-0000-4000-8000-000000000012', 'DC Circuit Analysis', 'Ohm''s law, Kirchhoff''s laws, and network theorems.'),
  ('cccccccc-0000-4000-8000-00000000001f', 'bbbbbbbb-0000-4000-8000-000000000013', 'Transmission & Distribution', 'Power grids, transformers, and line losses.'),
  ('cccccccc-0000-4000-8000-000000000020', 'bbbbbbbb-0000-4000-8000-000000000014', 'Records Management', 'Filing systems, retention, and office workflows.'),
  ('cccccccc-0000-4000-8000-000000000021', 'bbbbbbbb-0000-4000-8000-000000000015', 'Business Correspondence', 'Memos, emails, and formal report writing.'),
  ('cccccccc-0000-4000-8000-000000000022', 'bbbbbbbb-0000-4000-8000-000000000016', 'Distributed Databases', 'Replication, partitioning, and consistency trade-offs.'),
  ('cccccccc-0000-4000-8000-000000000023', 'bbbbbbbb-0000-4000-8000-000000000017', 'Literature Review', 'Searching, synthesizing, and citing related studies.'),
  ('cccccccc-0000-4000-8000-000000000024', 'bbbbbbbb-0000-4000-8000-000000000018', 'Theories of Crime', 'Biological, psychological, and sociological explanations.'),
  ('cccccccc-0000-4000-8000-000000000025', 'bbbbbbbb-0000-4000-8000-000000000019', 'Elements of a Crime', 'Actus reus, mens rea, and criminal liability.'),
  ('cccccccc-0000-4000-8000-000000000026', 'bbbbbbbb-0000-4000-8000-00000000001a', 'Forensic Evidence', 'Collection, chain of custody, and laboratory analysis.'),
  ('cccccccc-0000-4000-8000-000000000027', 'bbbbbbbb-0000-4000-8000-00000000001b', 'Pillars of Justice', 'Law enforcement, prosecution, courts, and corrections.'),
  ('cccccccc-0000-4000-8000-000000000028', 'bbbbbbbb-0000-4000-8000-00000000001c', 'Transistor Amplifiers', 'Biasing, gain, and small-signal models.'),
  ('cccccccc-0000-4000-8000-000000000029', 'bbbbbbbb-0000-4000-8000-00000000001d', 'Fourier Analysis', 'Time and frequency representations of signals.'),
  ('cccccccc-0000-4000-8000-00000000002a', 'bbbbbbbb-0000-4000-8000-00000000001e', 'Guest Experience', 'Service quality, expectations, and recovery.'),
  ('cccccccc-0000-4000-8000-00000000002b', 'bbbbbbbb-0000-4000-8000-00000000001f', 'Food and Beverage Cost Control', 'Menu pricing, portion control, and inventory.'),
  ('cccccccc-0000-4000-8000-00000000002c', 'bbbbbbbb-0000-4000-8000-000000000020', 'Tourism Systems', 'Tourism components, stakeholders, and impacts.'),
  ('cccccccc-0000-4000-8000-00000000002d', 'bbbbbbbb-0000-4000-8000-000000000021', 'Destination Planning', 'Attraction development, policy, and sustainability.'),
  ('cccccccc-0000-4000-8000-00000000002e', 'bbbbbbbb-0000-4000-8000-000000000022', 'Fitness and Movement', 'Components of fitness and movement screening.'),
  ('cccccccc-0000-4000-8000-00000000002f', 'bbbbbbbb-0000-4000-8000-000000000023', 'Coaching Fundamentals', 'Season planning, skill progressions, and feedback.'),
  ('cccccccc-0000-4000-8000-000000000030', 'bbbbbbbb-0000-4000-8000-000000000024', 'TLE Curriculum', 'Learning competencies and laboratory routines.'),
  ('cccccccc-0000-4000-8000-000000000031', 'bbbbbbbb-0000-4000-8000-000000000025', 'Learning Materials', 'Choosing and evaluating hands-on resources.'),
  ('cccccccc-0000-4000-8000-000000000032', 'bbbbbbbb-0000-4000-8000-000000000026', 'Competency Standards', 'Training regulations and competency-based learning.'),
  ('cccccccc-0000-4000-8000-000000000033', 'bbbbbbbb-0000-4000-8000-000000000027', 'Competency Assessment', 'Evidence gathering, rubrics, and reassessment.'),
  ('cccccccc-0000-4000-8000-000000000034', 'bbbbbbbb-0000-4000-8000-000000000028', 'Learner-Centered Teaching', 'Active learning, questioning, and classroom climate.'),
  ('cccccccc-0000-4000-8000-000000000035', 'bbbbbbbb-0000-4000-8000-000000000029', 'Practice Teaching', 'Lesson delivery, observation notes, and reflection.'),
  ('cccccccc-0000-4000-8000-000000000036', 'bbbbbbbb-0000-4000-8000-00000000002a', 'Orthographic Projection', 'Views, dimensions, and drafting standards.'),
  ('cccccccc-0000-4000-8000-000000000037', 'bbbbbbbb-0000-4000-8000-00000000002b', 'Ohm''s Law', 'Voltage, current, resistance, and safety.'),
  ('cccccccc-0000-4000-8000-000000000038', 'bbbbbbbb-0000-4000-8000-00000000002c', 'Engine Systems', 'Lubrication, cooling, fuel, and ignition basics.'),
  ('cccccccc-0000-4000-8000-000000000039', 'bbbbbbbb-0000-4000-8000-00000000002d', 'Refrigeration Cycle', 'Compression, condensation, expansion, and evaporation.'),
  ('cccccccc-0000-4000-8000-00000000003a', 'bbbbbbbb-0000-4000-8000-00000000002e', 'Food Safety', 'Hygiene, temperature control, and HACCP basics.'),
  ('cccccccc-0000-4000-8000-00000000003b', 'bbbbbbbb-0000-4000-8000-00000000002f', 'Semiconductor Devices', 'Diodes, transistors, and basic troubleshooting.'),
  ('cccccccc-0000-4000-8000-00000000003c', 'bbbbbbbb-0000-4000-8000-000000000030', 'Building Plans', 'Floor plans, elevations, sections, and details.'),
  ('cccccccc-0000-4000-8000-00000000003d', 'bbbbbbbb-0000-4000-8000-000000000031', 'Cell Structure', 'Organelles, membranes, and cellular processes.'),
  ('cccccccc-0000-4000-8000-00000000003e', 'bbbbbbbb-0000-4000-8000-000000000032', 'Ecosystems', 'Energy flow, biodiversity, and population dynamics.')
on conflict (id) do update set
  subject_id = excluded.subject_id,
  name = excluded.name,
  description = excluded.description;
-- ── Repair notes that do not match their subject's taxonomy ─────────────────
update public.notes n
set department_id = s.department_id,
    program_id = s.program_id
from public.subjects s
where n.subject_id = s.id
  and (n.department_id is distinct from s.department_id or n.program_id is distinct from s.program_id);

-- ── Repair profiles whose program belongs to another department ─────────────
update public.profiles p
set department_id = pr.department_id
from public.programs pr
where p.program_id = pr.id
  and p.department_id is distinct from pr.department_id;
