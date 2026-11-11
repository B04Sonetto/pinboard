-- Allow authors to edit and resubmit notes that are awaiting review or returned for revision
drop policy if exists "notes update" on public.notes;
create policy "notes update" on public.notes for update to authenticated
  using (public.is_moderator() or (author_id = auth.uid() and status in ('submitted', 'rejected')))
  with check (
    public.is_moderator()
    or (author_id = auth.uid() and status = 'submitted' and origin = 'student')
  );
