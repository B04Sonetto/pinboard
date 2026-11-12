

-- ── Departments ─────────────────────────────────────────────────────────────
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

-- ── People (demo community) ────────────────────────────────────────────────
insert into public.profiles (id, full_name, role, department_id, program_id, year_level, semester, bio, avatar_color) values
  ('11111111-1111-4111-8111-111111111101', 'Mika Reyes', 'student', 'cs', 'aaaaaaaa-0000-4000-8000-000000000001', 3, 1, 'BSInfoTech student. Databases, backend and too much coffee.', '#FFE680'),
  ('11111111-1111-4111-8111-111111111102', 'Dan Cruz', 'student', 'cs', 'aaaaaaaa-0000-4000-8000-000000000001', 2, 1, 'Networking notes and subnetting drills.', '#BFE0FF'),
  ('11111111-1111-4111-8111-111111111103', 'Rica Lopez', 'student', 'bus', 'aaaaaaaa-0000-4000-8000-000000000003', 2, 2, 'BSA. Accounting flowcharts are my love language.', '#BDEBCB'),
  ('11111111-1111-4111-8111-111111111104', 'Joy Perez', 'student', 'edu', 'aaaaaaaa-0000-4000-8000-000000000005', 3, 1, 'Future elementary teacher. Lesson plans and read-alouds.', '#FFC9DC'),
  ('11111111-1111-4111-8111-111111111105', 'Marco Torres', 'student', 'eng', 'aaaaaaaa-0000-4000-8000-000000000007', 2, 2, 'BSCpE. Mechanics notes with a lot of arrows.', '#BDEBCB'),
  ('11111111-1111-4111-8111-111111111106', 'Lea Santos', 'student', 'as', 'aaaaaaaa-0000-4000-8000-00000000000a', 1, 1, 'Psychology major interested in how people learn.', '#DCD0FF'),
  ('11111111-1111-4111-8111-111111111107', 'Ken Aquino', 'student', 'cs', 'aaaaaaaa-0000-4000-8000-000000000001', 4, 1, 'Capstone survivor. Happy to share the checklist.', '#FFE680'),
  ('11111111-1111-4111-8111-111111111108', 'Tess Villanueva', 'student', 'bus', 'aaaaaaaa-0000-4000-8000-000000000003', 2, 2, 'Cost accounting drills and reviewer swaps.', '#BFE0FF'),
  ('11111111-1111-4111-8111-111111111109', 'Nina Flores', 'student', 'as', 'aaaaaaaa-0000-4000-8000-00000000000a', 2, 2, 'Psychology student. Media literacy advocate.', '#FFC9DC'),
  ('11111111-1111-4111-8111-111111111110', 'Elena Marquez', 'moderator', 'cs', 'aaaaaaaa-0000-4000-8000-000000000001', 4, 1, 'Community moderator. Reviews CS and engineering notes.', '#A9E5BF'),
  ('11111111-1111-4111-8111-111111111111', 'Pinboard Admin', 'admin', null, null, null, null, 'Platform administration account.', '#211D31'),
  ('11111111-1111-4111-8111-1111111111a1', 'Pinboard AI', 'student', null, null, null, null, 'Generated study material built from community notes.', '#DCD0FF')
on conflict (id) do nothing;

-- ── Notes ───────────────────────────────────────────────────────────────────
insert into public.notes
  (id, author_id, department_id, program_id, subject_id, topic_id, title, summary, content, content_text,
   visibility, status, origin, year_level, semester, keywords, verified_at, verified_by, created_at, updated_at, downloads, views)
values

-- 1. Normalization
('dddddddd-0000-4000-8000-000000000001',
 '11111111-1111-4111-8111-111111111101', 'cs', 'aaaaaaaa-0000-4000-8000-000000000001',
 'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001',
 'Normalization: 1NF to 3NF',
 'Why tables get split, walked through with a student-enrollment example and the mistakes graders catch most.',
 $note$# Why normalize?

Normalization organizes a relational database so that each fact lives in exactly one place. The goal is simple: *the whole key and nothing but the key*. When a table repeats data, updates can leave copies out of sync, inserts can fail for missing values, and deletes can accidentally remove unrelated facts. These are called insert, update and delete anomalies.

## The three normal forms

**First normal form (1NF)** requires atomic values and no repeating groups. A column holding `Math, Science` breaks 1NF; split those values into separate rows or a related table.

**Second normal form (2NF)** requires 1NF plus no partial dependency. A partial dependency happens when a non-key column depends on only part of a composite key. In an enrollment table keyed by `(student_id, course_id)`, storing `student_name` violates 2NF because the name depends only on `student_id`.

**Third normal form (3NF)** requires 2NF plus no transitive dependency. A transitive dependency happens when a non-key column depends on another non-key column. If `course_id` determines `instructor_id`, and `instructor_id` determines `instructor_office`, then the office transitively depends on the key.

## Worked example

Start with one wide enrollment table:

| student_id | student_name | course_id | course_name | instructor | office |
| --- | --- | --- | --- | --- | --- |
| 1001 | Ana | DB101 | Databases | Cruz | Room 204 |
| 1001 | Ana | NET101 | Networking | Lim | Room 118 |
| 1002 | Ben | DB101 | Databases | Cruz | Room 204 |

`student_name` depends only on `student_id`, and `office` depends on `instructor`, not on the full key. Splitting the design gives us:

- `students(student_id, student_name)`
- `courses(course_id, course_name, instructor_id)`
- `instructors(instructor_id, instructor_name, office)`
- `enrollment(student_id, course_id)`

```sql
CREATE TABLE enrollment (
  student_id INT,
  course_id  INT,
  PRIMARY KEY (student_id, course_id)
);
```

> **Exam tip:** If a column depends on another non-key column, that is a transitive dependency. Split it into its own table to reach 3NF.

## The checks, in order

1. Are all values atomic? If not, fix 1NF.
2. Does every non-key column depend on the *whole* primary key? If not, fix 2NF.
3. Does any non-key column depend on another non-key column? If yes, fix 3NF.

Denormalization is sometimes a deliberate performance choice, but it should be a decision made after a normalized design, not an accident.
$note$,
 $note$# Why normalize?

Normalization organizes a relational database so that each fact lives in exactly one place. The goal is simple: the whole key and nothing but the key. When a table repeats data, updates can leave copies out of sync, inserts can fail for missing values, and deletes can accidentally remove unrelated facts. These are called insert, update and delete anomalies.

## The three normal forms

First normal form (1NF) requires atomic values and no repeating groups. A column holding Math, Science breaks 1NF; split those values into separate rows or a related table.

Second normal form (2NF) requires 1NF plus no partial dependency. A partial dependency happens when a non-key column depends on only part of a composite key. In an enrollment table keyed by (student_id, course_id), storing student_name violates 2NF because the name depends only on student_id.

Third normal form (3NF) requires 2NF plus no transitive dependency. A transitive dependency happens when a non-key column depends on another non-key column. If course_id determines instructor_id, and instructor_id determines instructor_office, then the office transitively depends on the key.

## Worked example

Start with one wide enrollment table with student_id, student_name, course_id, course_name, instructor and office. student_name depends only on student_id, and office depends on instructor, not on the full key. Splitting the design gives us students, courses, instructors and an enrollment table.

Exam tip: If a column depends on another non-key column, that is a transitive dependency. Split it into its own table to reach 3NF.

## The checks, in order

1. Are all values atomic? If not, fix 1NF.
2. Does every non-key column depend on the whole primary key? If not, fix 2NF.
3. Does any non-key column depend on another non-key column? If yes, fix 3NF.

Denormalization is sometimes a deliberate performance choice, but it should be a decision made after a normalized design, not an accident.
$note$,
 'community', 'verified', 'student', 2, 1,
 array['normalization','1nf','2nf','3nf','primary key','functional dependency','anomalies','database design'],
 now() - interval '18 days', '11111111-1111-4111-8111-111111111110', now() - interval '24 days', now() - interval '18 days', 48, 312),

-- 2. Networking (published)
('dddddddd-0000-4000-8000-000000000002',
 '11111111-1111-4111-8111-111111111102', 'cs', 'aaaaaaaa-0000-4000-8000-000000000001',
 'bbbbbbbb-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000004',
 'Networking Midterm Reviewer',
 'OSI vs TCP/IP layers, subnetting practice, and the port numbers that keep showing up in quizzes.',
 $note$# Networking midterm reviewer

## OSI vs TCP/IP

The OSI model is a teaching model with seven layers. TCP/IP is the practical stack with four layers. You can map them by grouping the top three OSI layers into the TCP/IP application layer.

| OSI layer | Job | TCP/IP layer |
| --- | --- | --- |
| Application, Presentation, Session | User services, encoding, dialogs | Application |
| Transport | End-to-end delivery, ports, reliability | Transport |
| Network | Logical addressing and routing | Internet |
| Data link, Physical | Framing, MAC addresses, signals | Network access |

## Port numbers to memorize

- **20/21** FTP data and control
- **22** SSH
- **25** SMTP
- **53** DNS
- **80** HTTP, **443** HTTPS
- **110** POP3, **143** IMAP
- **3306** MySQL, **5432** PostgreSQL

## Subnetting in four steps

Given `192.168.10.0/26`:

1. A /26 borrows 2 host bits, so there are `2^2 = 4` subnets.
2. Each subnet has `2^6 - 2 = 62` usable hosts.
3. The block size is 64, so the subnets start at `.0`, `.64`, `.128`, `.192`.
4. The first usable host in the second subnet is `192.168.10.65`; the broadcast is `192.168.10.127`.

> **Remember:** number of hosts = `2^(32 - prefix) - 2`. Subtract two for the network and broadcast addresses.

## Quick checks

- A switch forwards by MAC address; a router forwards by IP address.
- DNS resolves names to addresses; DHCP assigns addresses automatically.
- TCP is connection-oriented and retransmits lost segments; UDP is connectionless and favors latency.

Practice: convert `/27` and `/29` to subnet masks and count hosts before checking the answer key.
$note$,
 $note$# Networking midterm reviewer

## OSI vs TCP/IP

The OSI model is a teaching model with seven layers. TCP/IP is the practical stack with four layers. You can map them by grouping the top three OSI layers into the TCP/IP application layer.

OSI application, presentation and session become the TCP/IP application layer. The transport layer handles end-to-end delivery, ports and reliability. The network layer handles logical addressing and routing. The data link and physical layers handle framing, MAC addresses and signals.

## Port numbers to memorize

20 and 21 FTP data and control. 22 SSH. 25 SMTP. 53 DNS. 80 HTTP and 443 HTTPS. 110 POP3 and 143 IMAP. 3306 MySQL and 5432 PostgreSQL.

## Subnetting in four steps

Given 192.168.10.0/26, a /26 borrows 2 host bits, so there are 4 subnets. Each subnet has 62 usable hosts. The block size is 64, so the subnets start at .0, .64, .128 and .192. The first usable host in the second subnet is 192.168.10.65 and the broadcast is 192.168.10.127.

Remember: number of hosts equals 2 to the power of 32 minus the prefix, minus 2. Subtract two for the network and broadcast addresses.

## Quick checks

A switch forwards by MAC address; a router forwards by IP address. DNS resolves names to addresses; DHCP assigns addresses automatically. TCP is connection-oriented and retransmits lost segments; UDP is connectionless and favors latency.

Practice converting /27 and /29 to subnet masks and count hosts before checking the answer key.
$note$,
 'community', 'verified', 'student', 2, 1,
 array['osi model','tcp/ip','subnetting','ports','dns','dhcp','networking'],
 null, null, now() - interval '2 days', now() - interval '2 days', 6, 44),

-- 3. AI note: MVC
('dddddddd-0000-4000-8000-000000000003',
 '11111111-1111-4111-8111-1111111111a1', 'cs', 'aaaaaaaa-0000-4000-8000-000000000001',
 'bbbbbbbb-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000006',
 'MVC in Laravel: Quick Recap',
 'Summary built from community notes: routes, controllers, Blade views, and how a request flows through them.',
 $note$# MVC in Laravel: quick recap

MVC separates an application into three responsibilities. **Models** talk to the database. **Views** render HTML. **Controllers** receive a request, ask models for data, and return a view or a redirect.

## How a request flows

1. The browser requests a URL.
2. `routes/web.php` matches the URL to a route.
3. The route calls a controller method.
4. The controller uses a model to fetch or change data.
5. The controller returns a Blade view with data.

```php
Route::get('/notes/{note}', [NoteController::class, 'show'])
    ->name('notes.show');

public function show(Note $note)
{
    return view('notes.show', ['note' => $note]);
}
```

## Where each piece lives

- `app/Models` — Eloquent models and relationships
- `app/Http/Controllers` — request handling
- `resources/views` — Blade templates
- `routes/web.php` — browser routes
- `database/migrations` — schema history

## Why it matters

Keeping database queries out of views makes templates easier to read and test. Controllers should stay thin: validate the request, call the model, return a response. If a controller grows long, move reusable logic into a service class or model method.

> Built from community-submitted notes. Verify details against your class discussion and the current Laravel documentation.
$note$,
 $note$# MVC in Laravel: quick recap

MVC separates an application into three responsibilities. Models talk to the database. Views render HTML. Controllers receive a request, ask models for data, and return a view or a redirect.

## How a request flows

The browser requests a URL. routes/web.php matches the URL to a route. The route calls a controller method. The controller uses a model to fetch or change data. The controller returns a Blade view with data.

A route can be written with Route::get for a note and NoteController::class for the show method. The show method receives a Note model and returns a view called notes.show with the note.

## Where each piece lives

app/Models contains Eloquent models and relationships. app/Http/Controllers contains request handling. resources/views contains Blade templates. routes/web.php contains browser routes. database/migrations contains schema history.

## Why it matters

Keeping database queries out of views makes templates easier to read and test. Controllers should stay thin: validate the request, call the model, return a response. If a controller grows long, move reusable logic into a service class or model method.
$note$,
 'community', 'verified', 'ai', 2, 1,
 array['mvc','laravel','routing','controllers','blade','eloquent'],
 now() - interval '9 days', '11111111-1111-4111-8111-111111111110', now() - interval '12 days', now() - interval '9 days', 31, 208),

-- 4. Accounting cycle
('dddddddd-0000-4000-8000-000000000004',
 '11111111-1111-4111-8111-111111111103', 'bus', 'aaaaaaaa-0000-4000-8000-000000000003',
 'bbbbbbbb-0000-4000-8000-000000000006', 'cccccccc-0000-4000-8000-00000000000b',
 'Accounting Cycle in 10 Steps',
 'From journal entries to the post-closing trial balance, with a one-page flow you can print.',
 $note$# The accounting cycle in 10 steps

The accounting cycle is the repeating process a business uses to record, summarize and report financial activity for a period.

## The steps

1. **Identify transactions.** Gather source documents such as receipts, invoices and bank statements.
2. **Journalize.** Record each transaction as a debit and credit in the general journal.
3. **Post to the ledger.** Transfer journal entries to their T-accounts.
4. **Prepare an unadjusted trial balance.** Check that total debits equal total credits.
5. **Record adjusting entries.** Accruals, deferrals, depreciation and allowances.
6. **Prepare an adjusted trial balance.** Prove the ledger again after adjustments.
7. **Prepare financial statements.** Income statement, statement of changes in equity, balance sheet, cash flow statement.
8. **Record closing entries.** Close temporary accounts — revenues, expenses and drawings — to equity.
9. **Prepare a post-closing trial balance.** Only permanent accounts remain.
10. **Reverse optional entries.** Some businesses reverse certain accruals at the start of the next period.

## Debit and credit rules

| Account type | Increases with | Normal balance |
| --- | --- | --- |
| Asset | Debit | Debit |
| Expense | Debit | Debit |
| Liability | Credit | Credit |
| Equity | Credit | Credit |
| Revenue | Credit | Credit |

> **Remember:** every transaction keeps the accounting equation balanced: Assets = Liabilities + Equity.

## A small example

The business receives ₱50,000 cash from the owner:

- Debit Cash 50,000
- Credit Owner's Capital 50,000

It pays ₱8,000 rent:

- Debit Rent Expense 8,000
- Credit Cash 8,000

After posting, the unadjusted trial balance should still balance. If it does not, look for a one-sided entry, a transposition, or a wrong account.
$note$,
 $note$# The accounting cycle in 10 steps

The accounting cycle is the repeating process a business uses to record, summarize and report financial activity for a period.

## The steps

1. Identify transactions. Gather source documents such as receipts, invoices and bank statements.
2. Journalize. Record each transaction as a debit and credit in the general journal.
3. Post to the ledger. Transfer journal entries to their T-accounts.
4. Prepare an unadjusted trial balance. Check that total debits equal total credits.
5. Record adjusting entries. Accruals, deferrals, depreciation and allowances.
6. Prepare an adjusted trial balance. Prove the ledger again after adjustments.
7. Prepare financial statements. Income statement, statement of changes in equity, balance sheet, cash flow statement.
8. Record closing entries. Close temporary accounts such as revenues, expenses and drawings to equity.
9. Prepare a post-closing trial balance. Only permanent accounts remain.
10. Reverse optional entries. Some businesses reverse certain accruals at the start of the next period.

## Debit and credit rules

Assets and expenses increase with debit and have a normal debit balance. Liabilities, equity and revenue increase with credit and have a normal credit balance.

Remember: every transaction keeps the accounting equation balanced. Assets equal Liabilities plus Equity.

## A small example

The business receives 50,000 cash from the owner. Debit Cash 50,000 and credit Owner's Capital 50,000. It pays 8,000 rent. Debit Rent Expense 8,000 and credit Cash 8,000.

After posting, the unadjusted trial balance should still balance. If it does not, look for a one-sided entry, a transposition, or a wrong account.
$note$,
 'community', 'verified', 'student', 1, 2,
 array['accounting cycle','journal entries','ledger','trial balance','debit and credit','adjusting entries','financial statements'],
 now() - interval '6 days', '11111111-1111-4111-8111-111111111110', now() - interval '11 days', now() - interval '6 days', 72, 401),

-- 5. Lesson plan
('dddddddd-0000-4000-8000-000000000005',
 '11111111-1111-4111-8111-111111111104', 'edu', 'aaaaaaaa-0000-4000-8000-000000000005',
 'bbbbbbbb-0000-4000-8000-000000000009', 'cccccccc-0000-4000-8000-00000000000e',
 'Writing a Detailed Lesson Plan',
 'Objectives, motivation, discussion and evaluation laid out with a sample plan for Grade 5 Science.',
 $note$# Writing a detailed lesson plan

A detailed lesson plan (DLP) is a teacher's working script for one lesson. It should be specific enough that another teacher could pick it up and teach the same lesson.

## The parts

1. **Learning objectives** — what students should know, do and value by the end. Use observable verbs: *identify*, *explain*, *compare*, *demonstrate*.
2. **Subject matter** — topic, references, materials and values integration.
3. **Procedure**
   - *Preliminary activities*: prayer, attendance, review.
   - *Motivation*: a short question, image, demo or story that creates a need to know.
   - *Lesson proper*: discussion, modeling, guided practice and independent practice.
   - *Generalization*: students state the big idea in their own words.
4. **Evaluation** — a short formative check aligned to the objectives.
5. **Assignment** — purposeful practice, not busywork.
6. **Reflection** — what worked, what to change next time.

## Sample objective set (Grade 5 Science)

At the end of the lesson, students should be able to:

- identify the three states of matter;
- describe the particle arrangement in each state;
- give one example of a change of state in daily life.

## Motivation idea

Show a sealed bottle of water, an ice cube and a balloon. Ask: *What do these three have in common?* Let students argue for one minute before naming matter and its states.

> **Tip:** The motivation should create a question, not summarize the lesson. If you answer it before the discussion, students have nothing to discover.

## Evaluation sample

1. Draw and label the particles of a solid, liquid and gas.
2. Explain why a gas fills its container.
3. Give one example of evaporation and one example of condensation.

## Common mistake

Objectives that say *understand* or *know* are hard to assess. Replace them with an action students can perform and you can observe.
$note$,
 $note$# Writing a detailed lesson plan

A detailed lesson plan is a teacher's working script for one lesson. It should be specific enough that another teacher could pick it up and teach the same lesson.

## The parts

1. Learning objectives: what students should know, do and value by the end. Use observable verbs such as identify, explain, compare and demonstrate.
2. Subject matter: topic, references, materials and values integration.
3. Procedure: preliminary activities, motivation, lesson proper, guided practice, independent practice and generalization.
4. Evaluation: a short formative check aligned to the objectives.
5. Assignment: purposeful practice, not busywork.
6. Reflection: what worked and what to change next time.

## Sample objective set for Grade 5 Science

At the end of the lesson, students should be able to identify the three states of matter, describe the particle arrangement in each state, and give one example of a change of state in daily life.

## Motivation idea

Show a sealed bottle of water, an ice cube and a balloon. Ask what these three have in common. Let students argue for one minute before naming matter and its states.

Tip: The motivation should create a question, not summarize the lesson. If you answer it before the discussion, students have nothing to discover.

## Evaluation sample

Draw and label the particles of a solid, liquid and gas. Explain why a gas fills its container. Give one example of evaporation and one example of condensation.

## Common mistake

Objectives that say understand or know are hard to assess. Replace them with an action students can perform and you can observe.
$note$,
 'community', 'verified', 'student', 3, 1,
 array['lesson plan','learning objectives','motivation','assessment','teaching strategies','grade 5 science'],
 null, null, now() - interval '1 day', now() - interval '1 day', 4, 29),

-- 6. Kinematics
('dddddddd-0000-4000-8000-000000000006',
 '11111111-1111-4111-8111-111111111105', 'eng', 'aaaaaaaa-0000-4000-8000-000000000007',
 'bbbbbbbb-0000-4000-8000-00000000000b', 'cccccccc-0000-4000-8000-000000000012',
 'Kinematics Formula Sheet',
 'Constant-acceleration equations, projectile cases, and when each formula actually applies.',
 $note$# Kinematics formula sheet

Kinematics describes motion without asking what causes it. These equations apply only when acceleration is constant.

## The big four

- `v = v₀ + at`
- `Δx = v₀t + ½at²`
- `v² = v₀² + 2aΔx`
- `Δx = ((v₀ + v)/2)t`

## How to choose an equation

1. List what you know.
2. List what you need.
3. Pick the equation that connects them and has exactly one unknown.

> **Sign convention:** choose a positive direction and keep it for the whole problem. If upward is positive, gravity is `a = -9.8 m/s²`.

## Projectile motion

Horizontal and vertical motion are independent.

- Horizontal: constant velocity, `Δx = v₀ₓt`.
- Vertical: constant acceleration, `v_y = v₀ᵧ - gt` and `Δy = v₀ᵧt - ½gt²`.

For a projectile launched at speed `v₀` and angle `θ`:

- `v₀ₓ = v₀ cos θ`
- `v₀ᵧ = v₀ sin θ`
- time of flight (level ground): `t = 2v₀ sin θ / g`
- maximum height: `H = (v₀ sin θ)² / (2g)`
- range: `R = v₀² sin(2θ) / g`

## Worked example

A ball is thrown straight up at 12 m/s. How high does it go?

At the top, `v = 0`. Use `v² = v₀² + 2aΔy`:

`0 = 12² + 2(-9.8)Δy` → `Δy = 144 / 19.6 ≈ 7.35 m`.

## Common mistakes

- Mixing units (convert cm to m first).
- Using the range formula on uneven ground.
- Forgetting that the vertical velocity at the top is zero, but the horizontal velocity is not.
$note$,
 $note$# Kinematics formula sheet

Kinematics describes motion without asking what causes it. These equations apply only when acceleration is constant.

## The big four

v equals v0 plus at. Delta x equals v0 t plus one half a t squared. v squared equals v0 squared plus 2a delta x. Delta x equals the average of v0 and v times t.

## How to choose an equation

List what you know. List what you need. Pick the equation that connects them and has exactly one unknown.

Sign convention: choose a positive direction and keep it for the whole problem. If upward is positive, gravity is negative 9.8 meters per second squared.

## Projectile motion

Horizontal and vertical motion are independent. Horizontal motion has constant velocity. Vertical motion has constant acceleration due to gravity.

For a projectile launched at speed v0 and angle theta, the horizontal component is v0 cos theta and the vertical component is v0 sin theta. Time of flight on level ground is 2 v0 sin theta divided by g. Maximum height is v0 sin theta squared divided by 2g. Range is v0 squared sin 2 theta divided by g.

## Worked example

A ball is thrown straight up at 12 meters per second. At the top the velocity is zero. Using v squared equals v0 squared plus 2a delta y gives zero equals 144 plus 2 times negative 9.8 times delta y. The height is about 7.35 meters.

## Common mistakes

Mixing units, using the range formula on uneven ground, and forgetting that vertical velocity at the top is zero while horizontal velocity is not.
$note$,
 'community', 'verified', 'student', 1, 1,
 array['kinematics','projectile motion','constant acceleration','formula sheet','physics','motion'],
 now() - interval '15 days', '11111111-1111-4111-8111-111111111110', now() - interval '21 days', now() - interval '15 days', 66, 388),

-- 7. Cost accounting
('dddddddd-0000-4000-8000-000000000007',
 '11111111-1111-4111-8111-111111111108', 'bus', 'aaaaaaaa-0000-4000-8000-000000000003',
 'bbbbbbbb-0000-4000-8000-000000000007', 'cccccccc-0000-4000-8000-00000000000d',
 'Cost Accounting Drill Set',
 'Practice problems on job order and process costing.',
 $note$# Cost accounting drill set

## Job order costing

Job order costing tracks costs separately for each job. It fits custom work: a print shop, a construction project, a software build.

Direct materials and direct labor go straight to the job. Manufacturing overhead is applied using a predetermined rate:

`Overhead rate = Estimated overhead / Estimated allocation base`

Common bases: direct labor hours, machine hours, direct labor cost.

### Drill 1

Estimated overhead is ₱300,000. Estimated machine hours are 15,000. Actual machine hours for Job 12 are 420.

- Rate = 300,000 / 15,000 = ₱20 per machine hour
- Applied overhead = 420 × 20 = ₱8,400

If actual overhead for the period is higher than applied overhead, overhead is underapplied. If lower, it is overapplied.

## Process costing

Process costing averages costs across many identical units. It fits continuous production: flour, paint, bottled drinks.

### Drill 2

Beginning work in process is 1,000 units (40% complete). Started is 5,000 units. Completed and transferred is 5,400 units. Ending work in process is 600 units (50% complete).

Equivalent units (weighted average):

- Completed: 5,400
- Ending WIP: 600 × 50% = 300
- Total equivalent units: 5,700

Cost per equivalent unit = total costs / 5,700.

## Quick checklist

1. Classify the costing system.
2. Separate direct costs from overhead.
3. Compute the predetermined rate.
4. Apply overhead to the job or department.
5. Reconcile applied versus actual overhead.
6. For process costing, compute equivalent units before dividing costs.
$note$,
 $note$# Cost accounting drill set

## Job order costing

Job order costing tracks costs separately for each job. It fits custom work such as a print shop, a construction project or a software build.

Direct materials and direct labor go straight to the job. Manufacturing overhead is applied using a predetermined rate. The overhead rate equals estimated overhead divided by the estimated allocation base. Common bases are direct labor hours, machine hours and direct labor cost.

### Drill 1

Estimated overhead is 300,000. Estimated machine hours are 15,000. Actual machine hours for Job 12 are 420. The rate is 20 per machine hour and applied overhead is 8,400. If actual overhead is higher than applied, overhead is underapplied. If lower, it is overapplied.

## Process costing

Process costing averages costs across many identical units. It fits continuous production such as flour, paint or bottled drinks.

### Drill 2

Beginning work in process is 1,000 units at 40 percent complete. Started is 5,000 units. Completed and transferred is 5,400 units. Ending work in process is 600 units at 50 percent complete. Completed equivalent units are 5,400. Ending WIP equivalent units are 300. Total equivalent units are 5,700. Cost per equivalent unit equals total costs divided by 5,700.

## Quick checklist

Classify the costing system. Separate direct costs from overhead. Compute the predetermined rate. Apply overhead to the job or department. Reconcile applied versus actual overhead. For process costing, compute equivalent units before dividing costs.
$note$,
 'department', 'verified', 'student', 2, 2,
 array['job order costing','process costing','overhead','equivalent units','cost accounting'],
 null, null, now() - interval '4 days', now() - interval '4 days', 3, 21),

-- 8. Sociology
('dddddddd-0000-4000-8000-000000000008',
 '11111111-1111-4111-8111-111111111106', 'as', 'aaaaaaaa-0000-4000-8000-00000000000a',
 'bbbbbbbb-0000-4000-8000-00000000000d', 'cccccccc-0000-4000-8000-000000000016',
 'Intro to Sociology: Key Terms',
 'Culture, norms and social structure in plain language, with an everyday example for each term.',
 $note$# Introduction to sociology: key terms

Sociology studies how people live together: how groups shape behavior, how institutions work, and how inequality is produced and maintained.

## Culture

**Culture** is the shared way of life of a group. It includes both material objects and non-material ideas.

- **Values** are shared beliefs about what is good or desirable, such as honesty or family closeness.
- **Norms** are rules of behavior. *Folkways* are everyday customs; *mores* are stronger moral rules; *laws* are formally enforced.
- **Symbols** carry meaning, such as a flag, a uniform or a ring.
- **Language** is a system of symbols that lets people share meaning.

Example: In a classroom, raising a hand is a folkway. Cheating is a violation of a more and often a formal rule.

## Social structure

**Social structure** is the patterned arrangement of relationships and institutions.

- **Status** is a position in society; **role** is the expected behavior attached to it.
- **Ascribed status** is assigned at birth; **achieved status** is earned.
- **Institutions** are stable systems that meet social needs: family, education, religion, government, economy.
- **Socialization** is the process of learning culture and roles.

Example: A student has an achieved status. The role includes attending class, submitting work and participating respectfully.

## Theoretical lenses

- **Functionalism** asks what a social pattern does for the whole.
- **Conflict theory** asks who benefits and who is disadvantaged.
- **Symbolic interactionism** asks how meaning is created in everyday interaction.

> **Exam tip:** When asked to analyze a situation, name the lens first. The same event looks different through each one.

## Quick self-check

1. Is a birthday greeting a folkway, a more or a law?
2. What is the difference between status and role?
3. Which institution primarily teaches norms to children?
$note$,
 $note$# Introduction to sociology: key terms

Sociology studies how people live together: how groups shape behavior, how institutions work, and how inequality is produced and maintained.

## Culture

Culture is the shared way of life of a group. It includes both material objects and non-material ideas.

Values are shared beliefs about what is good or desirable, such as honesty or family closeness. Norms are rules of behavior. Folkways are everyday customs; mores are stronger moral rules; laws are formally enforced. Symbols carry meaning, such as a flag, a uniform or a ring. Language is a system of symbols that lets people share meaning.

Example: In a classroom, raising a hand is a folkway. Cheating is a violation of a more and often a formal rule.

## Social structure

Social structure is the patterned arrangement of relationships and institutions.

Status is a position in society; role is the expected behavior attached to it. Ascribed status is assigned at birth; achieved status is earned. Institutions are stable systems that meet social needs: family, education, religion, government and economy. Socialization is the process of learning culture and roles.

Example: A student has an achieved status. The role includes attending class, submitting work and participating respectfully.

## Theoretical lenses

Functionalism asks what a social pattern does for the whole. Conflict theory asks who benefits and who is disadvantaged. Symbolic interactionism asks how meaning is created in everyday interaction.

Exam tip: When asked to analyze a situation, name the lens first. The same event looks different through each one.

## Quick self-check

Is a birthday greeting a folkway, a more or a law? What is the difference between status and role? Which institution primarily teaches norms to children?
$note$,
 'community', 'verified', 'student', 1, 1,
 array['culture','norms','values','social structure','status','role','socialization','sociology'],
 now() - interval '13 days', '11111111-1111-4111-8111-111111111110', now() - interval '19 days', now() - interval '13 days', 41, 255),

-- 9. Capstone
('dddddddd-0000-4000-8000-000000000009',
 '11111111-1111-4111-8111-111111111107', 'cs', 'aaaaaaaa-0000-4000-8000-000000000001',
 'bbbbbbbb-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-00000000000a',
 'Capstone Defense Prep Checklist',
 'Panel questions seniors were asked, and how they structured their demo and documentation.',
 $note$# Capstone defense preparation checklist

## Two weeks before

- Freeze the feature list. Fix bugs, do not add scope.
- Run the full demo on the actual defense laptop and network.
- Prepare an offline fallback: local database, seeded data, screenshots or a recorded video.
- Print three copies of the abstract and table of contents.
- Rehearse the demo out loud with a timer.

## The demo flow (8–10 minutes)

1. Problem and users — one slide, no jargon.
2. Core workflow — show the single most important task end to end.
3. One differentiator — what makes this more than a CRUD app.
4. Evidence — test results, user feedback, screenshots of edge cases.
5. Limitations and next steps — be honest and specific.

## Panel questions to prepare for

- What problem does this solve, and for whom?
- Why did you choose this architecture?
- What happens when the database is unavailable?
- How did you test it? Show a failing test you fixed.
- What is the hardest bug you solved?
- What would you build next with one more semester?

## Documentation checks

- Scope and delimitation are consistent with what you actually built.
- Every diagram has a caption and is referenced in the text.
- Screenshots show the final interface, not a draft.
- Related literature is actually cited in the body, not only listed.
- Appendices include the user manual and test cases.

> **Tip:** When you do not know an answer, say what you would test next. Panels reward clear thinking more than memorized answers.

## The day before

- Charge the laptop and pack the charger.
- Export slides to PDF as a backup.
- Bring a USB with the build, database dump and documentation.
- Sleep. A calm demo beats one more feature.
$note$,
 $note$# Capstone defense preparation checklist

## Two weeks before

Freeze the feature list. Fix bugs, do not add scope. Run the full demo on the actual defense laptop and network. Prepare an offline fallback: local database, seeded data, screenshots or a recorded video. Print three copies of the abstract and table of contents. Rehearse the demo out loud with a timer.

## The demo flow

Problem and users in one slide. Core workflow end to end. One differentiator. Evidence from tests and user feedback. Limitations and next steps.

## Panel questions to prepare for

What problem does this solve and for whom? Why did you choose this architecture? What happens when the database is unavailable? How did you test it? Show a failing test you fixed. What is the hardest bug you solved? What would you build next with one more semester?

## Documentation checks

Scope and delimitation are consistent with what you actually built. Every diagram has a caption and is referenced in the text. Screenshots show the final interface, not a draft. Related literature is actually cited in the body, not only listed. Appendices include the user manual and test cases.

Tip: When you do not know an answer, say what you would test next. Panels reward clear thinking more than memorized answers.

## The day before

Charge the laptop and pack the charger. Export slides to PDF as a backup. Bring a USB with the build, database dump and documentation. Sleep. A calm demo beats one more feature.
$note$,
 'community', 'verified', 'student', 4, 1,
 array['capstone','defense','demo','documentation','panel questions'],
 null, null, now() - interval '3 days', now() - interval '3 days', 9, 87),

-- 10. AI note: beams
('dddddddd-0000-4000-8000-00000000000a',
 '11111111-1111-4111-8111-1111111111a1', 'eng', 'aaaaaaaa-0000-4000-8000-000000000007',
 'bbbbbbbb-0000-4000-8000-00000000000c', 'cccccccc-0000-4000-8000-000000000014',
 'Beam Loading Reviewer',
 'Reviewer generated from community notes: reactions, shear and bending moment diagrams.',
 $note$# Beam loading reviewer

## Sign conventions

Choose one sign convention and keep it. A common choice:

- Upward reaction is positive.
- A downward load is negative.
- Sagging moment is positive.

## Step 1: free-body diagram

Replace supports with reactions.

- Roller: one vertical reaction.
- Pin: vertical and horizontal reactions.
- Fixed: vertical, horizontal and moment reactions.

## Step 2: equilibrium

For a simply supported beam:

- `ΣFy = 0` → `R₁ + R₂ = total load`
- `ΣM = 0` about one support → solve for the other reaction

## Step 3: shear diagram

Start at zero. Each upward reaction jumps up; each downward point load jumps down. A uniformly distributed load changes the shear linearly.

The shear is zero where the bending moment reaches a local maximum or minimum.

## Step 4: bending moment diagram

The moment is the area under the shear diagram. A point load makes the moment diagram piecewise linear; a uniform load makes it curved.

For a simply supported beam with a central point load `P` and span `L`:

- Reactions: `R₁ = R₂ = P/2`
- Maximum moment at midspan: `M = PL/4`
- Maximum shear: `V = P/2`

## Worked check

A 6 m simply supported beam carries a 12 kN point load at midspan.

- Reactions: 6 kN each.
- Maximum moment: `12 × 6 / 4 = 18 kN·m` at midspan.
- Shear just right of the left support: `+6 kN`; just left of midspan: `+6 kN`; just right: `−6 kN`.

## Common mistakes

- Forgetting the moment reaction at a fixed support.
- Using the wrong sign for a downward load.
- Assuming the maximum moment is always at the center — check where shear crosses zero.
$note$,
 $note$# Beam loading reviewer

## Sign conventions

Choose one sign convention and keep it. A common choice is upward reaction positive, downward load negative, and sagging moment positive.

## Step 1: free-body diagram

Replace supports with reactions. A roller has one vertical reaction. A pin has vertical and horizontal reactions. A fixed support has vertical, horizontal and moment reactions.

## Step 2: equilibrium

For a simply supported beam, the sum of vertical forces is zero, so R1 plus R2 equals the total load. The sum of moments about one support is zero, which solves for the other reaction.

## Step 3: shear diagram

Start at zero. Each upward reaction jumps up; each downward point load jumps down. A uniformly distributed load changes the shear linearly. The shear is zero where the bending moment reaches a local maximum or minimum.

## Step 4: bending moment diagram

The moment is the area under the shear diagram. A point load makes the moment diagram piecewise linear; a uniform load makes it curved.

For a simply supported beam with a central point load P and span L, the reactions are P over 2. Maximum moment at midspan is P L over 4. Maximum shear is P over 2.

## Worked check

A 6 meter simply supported beam carries a 12 kilonewton point load at midspan. Reactions are 6 kilonewtons each. Maximum moment is 18 kilonewton meters at midspan. Shear just right of the left support is positive 6 kilonewtons and just right of midspan is negative 6 kilonewtons.

## Common mistakes

Forgetting the moment reaction at a fixed support, using the wrong sign for a downward load, and assuming the maximum moment is always at the center instead of checking where shear crosses zero.
$note$,
 'community', 'verified', 'ai', 2, 2,
 array['beams','shear','bending moment','reactions','equilibrium','mechanics'],
 now() - interval '8 days', '11111111-1111-4111-8111-111111111110', now() - interval '10 days', now() - interval '8 days', 27, 166),

-- 11. Big-O
('dddddddd-0000-4000-8000-00000000000b',
 '11111111-1111-4111-8111-111111111101', 'cs', 'aaaaaaaa-0000-4000-8000-000000000002',
 'bbbbbbbb-0000-4000-8000-000000000004', 'cccccccc-0000-4000-8000-000000000008',
 'Big-O at a Glance',
 'Growth rates, common complexities and how to read them from a loop.',
 $note$# Big-O at a glance

Big-O describes how the work an algorithm does grows as the input size grows. It ignores constants and lower-order terms.

## The ladder

From fastest to slowest growth:

1. `O(1)` — constant: array index, hash lookup (average)
2. `O(log n)` — logarithmic: binary search, balanced tree lookup
3. `O(n)` — linear: one pass through a list
4. `O(n log n)` — linearithmic: efficient comparison sorts
5. `O(n²)` — quadratic: nested loops over the same input
6. `O(2ⁿ)` — exponential: naive recursive subsets
7. `O(n!)` — factorial: brute-force permutations

## Reading loops

```js
for (let i = 0; i < n; i++) {      // O(n)
  for (let j = 0; j < n; j++) {    // multiplied
    work(i, j);                    // → O(n²)
  }
}
```

```js
for (let i = 0; i < n; i++) {      // O(n)
  for (let j = 0; j < i; j++) {    // about n²/2 pairs
    work(i, j);                    // → still O(n²)
  }
}
```

Binary search halves the range each step, so it is `O(log n)`.

## Space complexity

Space complexity counts extra memory, not the input itself. Merge sort is `O(n)` extra space; quicksort is `O(log n)` average stack space.

> **Tip:** In exams, state the dominant term and drop constants. `3n² + 7n + 4` becomes `O(n²)`.

## Quick drill

- Accessing `arr[5]` → O(1)
- Finding an item in an unsorted list → O(n)
- Finding an item in a sorted list with binary search → O(log n)
- Sorting with merge sort → O(n log n)
- Checking every pair of items → O(n²)
$note$,
 $note$# Big-O at a glance

Big-O describes how the work an algorithm does grows as the input size grows. It ignores constants and lower-order terms.

## The ladder

From fastest to slowest growth: constant O(1), logarithmic O(log n), linear O(n), linearithmic O(n log n), quadratic O(n squared), exponential O(2 to the n), and factorial O(n factorial).

## Reading loops

A single loop over n is linear. A nested loop over the same input is quadratic. A triangular loop that runs about n squared over 2 times is still quadratic. Binary search halves the range each step, so it is logarithmic.

## Space complexity

Space complexity counts extra memory, not the input itself. Merge sort uses linear extra space; quicksort uses logarithmic average stack space.

Tip: In exams, state the dominant term and drop constants. 3n squared plus 7n plus 4 becomes O(n squared).

## Quick drill

Accessing an array index is constant. Finding an item in an unsorted list is linear. Finding an item in a sorted list with binary search is logarithmic. Sorting with merge sort is linearithmic. Checking every pair of items is quadratic.
$note$,
 'community', 'verified', 'student', 2, 2,
 array['big-o','time complexity','space complexity','algorithms','binary search','sorting'],
 now() - interval '20 days', '11111111-1111-4111-8111-111111111110', now() - interval '27 days', now() - interval '20 days', 58, 344),

-- 12. Memory & learning
('dddddddd-0000-4000-8000-00000000000c',
 '11111111-1111-4111-8111-111111111106', 'as', 'aaaaaaaa-0000-4000-8000-00000000000a',
 'bbbbbbbb-0000-4000-8000-00000000000e', 'cccccccc-0000-4000-8000-000000000018',
 'Memory & Learning: Study Strategies',
 'Encoding, retrieval, spacing and the study habits that actually move information into long-term memory.',
 $note$# Memory and learning: study strategies

## How memory works

- **Encoding** is getting information in.
- **Storage** is keeping it.
- **Retrieval** is getting it back out.

Most study problems are retrieval problems, not storage problems. Re-reading feels productive because the material feels familiar, but familiarity is not the same as recall.

## Three strategies that work

### 1. Retrieval practice

Close the notes and write what you remember. Check, then correct. Flashcards, practice questions and blank-page recall all count. The effort of pulling information out strengthens the memory more than putting it in again.

### 2. Spaced practice

Study the same topic across several short sessions instead of one long block. A useful starting schedule is 1 day, 3 days, 7 days, then 14 days. Space the sessions further apart as the material becomes easier.

### 3. Interleaving

Mix related problem types in one session instead of doing twenty of the same kind. It feels harder, but it trains you to choose the right method.

## Two strategies that feel good but underperform

- **Highlighting** without a purpose: it marks text, not understanding.
- **Cramming**: it can pass tomorrow's quiz but leaves little behind.

## A 40-minute study block

1. 5 min — retrieve the previous lesson from memory.
2. 15 min — study one concept, then explain it aloud.
3. 10 min — do mixed practice questions.
4. 5 min — correct mistakes and write the rule you missed.
5. 5 min — plan the next session.

> **Tip:** Sleep is part of studying. Memory consolidation happens during sleep, so an all-nighter trades tomorrow's recall for tonight's familiarity.

## Metacognition check

After a study session, ask: *Could I explain this to someone without notes?* If not, the next session should be retrieval, not re-reading.
$note$,
 $note$# Memory and learning: study strategies

## How memory works

Encoding is getting information in. Storage is keeping it. Retrieval is getting it back out.

Most study problems are retrieval problems, not storage problems. Re-reading feels productive because the material feels familiar, but familiarity is not the same as recall.

## Three strategies that work

Retrieval practice means closing the notes and writing what you remember, then checking and correcting. Flashcards, practice questions and blank-page recall all count. The effort of pulling information out strengthens the memory more than putting it in again.

Spaced practice means studying the same topic across several short sessions instead of one long block. A useful starting schedule is 1 day, 3 days, 7 days and 14 days. Space the sessions further apart as the material becomes easier.

Interleaving means mixing related problem types in one session instead of doing twenty of the same kind. It feels harder, but it trains you to choose the right method.

## Two strategies that feel good but underperform

Highlighting without a purpose marks text, not understanding. Cramming can pass tomorrow's quiz but leaves little behind.

## A 40-minute study block

Five minutes to retrieve the previous lesson from memory. Fifteen minutes to study one concept and explain it aloud. Ten minutes of mixed practice questions. Five minutes to correct mistakes and write the rule you missed. Five minutes to plan the next session.

Tip: Sleep is part of studying. Memory consolidation happens during sleep, so an all-nighter trades tomorrow's recall for tonight's familiarity.

## Metacognition check

After a study session, ask whether you could explain this to someone without notes. If not, the next session should be retrieval, not re-reading.
$note$,
 'community', 'verified', 'student', 1, 1,
 array['memory','retrieval practice','spaced repetition','interleaving','metacognition','study strategies'],
 null, null, now() - interval '6 hours', now() - interval '6 hours', 2, 18),

-- 13. Media literacy
('dddddddd-0000-4000-8000-00000000000d',
 '11111111-1111-4111-8111-111111111109', 'as', 'aaaaaaaa-0000-4000-8000-00000000000a',
 'bbbbbbbb-0000-4000-8000-00000000000f', 'cccccccc-0000-4000-8000-000000000019',
 'Media Literacy Checklist',
 'A practical checklist for evaluating sources, spotting framing and sharing responsibly.',
 $note$# Media literacy checklist

## Before you believe it

1. **Who made it?** Look for an author, organization and date.
2. **What is the claim?** Separate the factual claim from the opinion around it.
3. **What is the evidence?** A screenshot is not a source. Follow the link to the original.
4. **Who benefits?** Consider advertising, engagement and political incentives.
5. **What is missing?** Check whether the story includes the people most affected.

## Spotting framing

Framing is the angle a story takes. Two headlines can describe the same event with different emphasis:

- "Protests disrupt commute"
- "Commuters join protests over fare hike"

Neither is automatically false. Ask what each framing makes salient and what it leaves out.

## Lateral reading

Instead of staying on one page, open new tabs and check what other credible sources say about the organization and the claim. This is usually faster and more reliable than reading the page more carefully.

## Before you share

- Have you read past the headline?
- Can you find the original source?
- Is the image recent and unedited? Use a reverse image search.
- Could sharing it cause harm to a person or group?
- Are you adding context or just amplifying?

> **Rule of thumb:** If a post makes you angry in under five seconds, that is a reason to pause, not a reason to share.

## Quick source quality grid

| Question | Strong signal | Weak signal |
| --- | --- | --- |
| Author | Named, accountable | Anonymous or copied |
| Evidence | Linked, primary | Screenshot, vague |
| Date | Recent and stated | Missing |
| Corrections | Published | Ignored |
| Interest | Disclosed | Hidden |
$note$,
 $note$# Media literacy checklist

## Before you believe it

Who made it? Look for an author, organization and date. What is the claim? Separate the factual claim from the opinion around it. What is the evidence? A screenshot is not a source; follow the link to the original. Who benefits? Consider advertising, engagement and political incentives. What is missing? Check whether the story includes the people most affected.

## Spotting framing

Framing is the angle a story takes. Two headlines can describe the same event with different emphasis: protests disrupt commute, or commuters join protests over fare hike. Neither is automatically false. Ask what each framing makes salient and what it leaves out.

## Lateral reading

Instead of staying on one page, open new tabs and check what other credible sources say about the organization and the claim. This is usually faster and more reliable than reading the page more carefully.

## Before you share

Have you read past the headline? Can you find the original source? Is the image recent and unedited? Use a reverse image search. Could sharing it cause harm to a person or group? Are you adding context or just amplifying?

Rule of thumb: If a post makes you angry in under five seconds, that is a reason to pause, not a reason to share.

## Quick source quality grid

A strong source has a named and accountable author, linked primary evidence, a stated recent date, published corrections and disclosed interests. A weak source is anonymous or copied, relies on screenshots, hides the date, ignores corrections and hides interests.
$note$,
 'community', 'verified', 'student', 1, 2,
 array['media literacy','source evaluation','framing','lateral reading','misinformation','communication'],
 now() - interval '5 days', '11111111-1111-4111-8111-111111111110', now() - interval '7 days', now() - interval '5 days', 22, 143),

-- 14. SQL joins
('dddddddd-0000-4000-8000-00000000000e',
 '11111111-1111-4111-8111-111111111102', 'cs', 'aaaaaaaa-0000-4000-8000-000000000001',
 'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000003',
 'SQL Joins Visual Guide',
 'Inner, left, right and full joins explained with two tiny tables and the rows each one returns.',
 $note$# SQL joins visual guide

## The two tiny tables

`students`

| id | name | course_id |
| --- | --- | --- |
| 1 | Ana | 10 |
| 2 | Ben | 11 |
| 3 | Cleo | NULL |

`courses`

| id | title |
| --- | --- |
| 10 | Databases |
| 11 | Networking |
| 12 | Web Systems |

## Inner join

Returns only rows with a match on both sides.

```sql
select s.name, c.title
from students s
join courses c on c.id = s.course_id;
```

Rows: Ana–Databases, Ben–Networking. Cleo has no course, Web Systems has no student.

## Left join

Keeps every row from the left table, even when there is no match.

```sql
select s.name, c.title
from students s
left join courses c on c.id = s.course_id;
```

Rows: Ana–Databases, Ben–Networking, Cleo–NULL.

## Right join

Keeps every row from the right table. It is the mirror of a left join.

Rows: Ana–Databases, Ben–Networking, NULL–Web Systems.

## Full outer join

Keeps unmatched rows from both sides. Rows: Ana, Ben, Cleo with NULL, and NULL with Web Systems.

## Practical rules

1. Join on keys, not on names.
2. Put the table you want to keep in the `FROM` clause when using a left join.
3. Use `IS NULL` in the `WHERE` clause to find unmatched rows.
4. Aggregate after the join, and check whether the join multiplied your rows.

> **Exam tip:** If the count is higher than expected after a join, look for a one-to-many relationship before blaming the `GROUP BY`.
$note$,
 $note$# SQL joins visual guide

## The two tiny tables

The students table has Ana in course 10, Ben in course 11 and Cleo with no course. The courses table has Databases as 10, Networking as 11 and Web Systems as 12.

## Inner join

Returns only rows with a match on both sides. Joining students to courses on course id returns Ana with Databases and Ben with Networking. Cleo has no course and Web Systems has no student.

## Left join

Keeps every row from the left table even when there is no match. It returns Ana with Databases, Ben with Networking and Cleo with NULL.

## Right join

Keeps every row from the right table. It is the mirror of a left join. It returns Ana with Databases, Ben with Networking and NULL with Web Systems.

## Full outer join

Keeps unmatched rows from both sides. It returns Ana, Ben, Cleo with NULL, and NULL with Web Systems.

## Practical rules

Join on keys, not on names. Put the table you want to keep in the FROM clause when using a left join. Use IS NULL in the WHERE clause to find unmatched rows. Aggregate after the join and check whether the join multiplied your rows.

Exam tip: If the count is higher than expected after a join, look for a one-to-many relationship before blaming the GROUP BY.
$note$,
 'community', 'verified', 'ai', 2, 1,
 array['sql joins','inner join','left join','right join','full outer join','database queries'],
 null, null, now() - interval '12 hours', now() - interval '12 hours', 1, 12),

-- 15. Management
('dddddddd-0000-4000-8000-00000000000f',
 '11111111-1111-4111-8111-111111111103', 'bus', 'aaaaaaaa-0000-4000-8000-000000000004',
 'bbbbbbbb-0000-4000-8000-000000000008', null,
 'Functions of Management: Quick Notes',
 'Planning, organizing, leading and controlling, with a one-line example for each.',
 $note$# Functions of management

Management is the process of getting work done through people and resources. The classic four functions are planning, organizing, leading and controlling.

## Planning

Decide what to achieve and how. Set goals, forecast, allocate resources and choose among alternatives.

*Example:* A student organization plans a review week three weeks before finals, reserving rooms and assigning reviewers.

## Organizing

Arrange people, tasks and resources so the plan can happen. This produces structure: divisions, roles, authority and coordination.

*Example:* The organization splits into a content team, a logistics team and a promotions team.

## Leading

Influence people to do the work. This covers motivation, communication, direction and conflict resolution.

*Example:* The lead checks in with each team, removes blockers and recognizes contributions.

## Controlling

Compare actual performance with the plan and correct deviations. Control needs standards, measurement and feedback.

*Example:* Attendance is lower than expected, so the team moves the review session online and adds a recording.

## Why the order matters

The functions are a cycle, not a checklist. Control feeds back into planning. A plan without control is a wish; control without a plan has no standard.

> **Exam tip:** If a question describes a manager setting standards and comparing results, the answer is controlling — even if the word "control" never appears.
$note$,
 $note$# Functions of management

Management is the process of getting work done through people and resources. The classic four functions are planning, organizing, leading and controlling.

## Planning

Decide what to achieve and how. Set goals, forecast, allocate resources and choose among alternatives. A student organization plans a review week three weeks before finals, reserving rooms and assigning reviewers.

## Organizing

Arrange people, tasks and resources so the plan can happen. This produces structure: divisions, roles, authority and coordination. The organization splits into a content team, a logistics team and a promotions team.

## Leading

Influence people to do the work. This covers motivation, communication, direction and conflict resolution. The lead checks in with each team, removes blockers and recognizes contributions.

## Controlling

Compare actual performance with the plan and correct deviations. Control needs standards, measurement and feedback. If attendance is lower than expected, the team moves the review session online and adds a recording.

## Why the order matters

The functions are a cycle, not a checklist. Control feeds back into planning. A plan without control is a wish; control without a plan has no standard.

Exam tip: If a question describes a manager setting standards and comparing results, the answer is controlling, even if the word control never appears.
$note$,
 'community', 'verified', 'student', 1, 1,
 array['management','planning','organizing','leading','controlling'],
 null, null, now() - interval '30 hours', now() - interval '30 hours', 5, 33)

on conflict (id) do nothing;

-- Keep seeded activity timestamps sensible.
update public.activity a
set created_at = n.created_at
from public.notes n
where a.note_id = n.id
  and a.kind = 'note_submitted'
  and n.author_id::text like '11111111-1111-4111-8111-1111111111%';

insert into public.activity (actor_id, kind, note_id, created_at)
select n.verified_by, 'note_verified', n.id, coalesce(n.verified_at, n.created_at)
from public.notes n
where n.status = 'verified'
  and n.verified_by is not null
  and not exists (
    select 1 from public.activity a where a.note_id = n.id and a.kind = 'note_verified'
  );

-- ── Suggestions ─────────────────────────────────────────────────────────────
insert into public.suggestions (id, user_id, kind, title, details, subject_id, status, admin_note, created_at, updated_at) values
  ('eeeeeeee-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111102', 'lesson', 'Add a lesson on VLANs', 'Networking 1 covers subnetting but not VLAN configuration. A short lesson with a switch configuration example would help.', 'bbbbbbbb-0000-4000-8000-000000000002', 'open', null, now() - interval '3 days', now() - interval '3 days'),
  ('eeeeeeee-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111104', 'subject', 'Add Classroom Management as a subject', 'Student teachers keep asking about classroom management, but it is not listed under the College of Teacher Education. Could it be added under Year 3, first semester?', 'bbbbbbbb-0000-4000-8000-000000000009', 'accepted', 'Added to the community course list for review.', now() - interval '9 days', now() - interval '5 days'),
  ('eeeeeeee-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111103', 'correction', 'Accounting cycle step 10 wording', 'The last step is optional reversing entries, not a required part of the cycle. Suggest clarifying it.', 'bbbbbbbb-0000-4000-8000-000000000006', 'under_review', null, now() - interval '1 day', now() - interval '20 hours')
on conflict (id) do nothing;

-- ── Done ────────────────────────────────────────────────────────────────────
-- Promote your own account once you have signed up:
--   update public.profiles
--      set role = 'admin', department_id = 'cs',
--          program_id = 'aaaaaaaa-0000-4000-8000-000000000001',
--          year_level = 3, semester = 1
--    where id = (select id from auth.users where email = 'you@example.com');
