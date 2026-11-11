-- Add the practice-exam study mode to existing projects.
alter type public.study_kind add value if not exists 'exam';
