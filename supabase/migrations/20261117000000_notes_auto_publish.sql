-- Notes are published immediately: no moderator approval step.
-- Moderation still exists for returning or removing notes that break the rules.

-- Publish everything that was waiting in the old review queue.
update public.notes
   set status = 'verified'
 where status = 'submitted';

-- New notes are published unless a caller explicitly chooses another status.
alter table public.notes alter column status set default 'verified';

-- Authors publish directly. Only moderators may stamp verification metadata.
drop policy if exists "notes insert own" on public.notes;
create policy "notes insert own" on public.notes for insert to authenticated
  with check (
    author_id = auth.uid()
    and origin = 'student'
    and (public.current_department() is null or department_id = public.current_department())
    and (
      public.is_moderator()
      or (status in ('submitted', 'verified') and verified_by is null)
    )
  );

-- Authors can edit their own published notes. Notes already verified by a
-- moderator keep the "submit a revision" flow so that stamp is not overwritten.
drop policy if exists "notes update" on public.notes;
create policy "notes update" on public.notes for update to authenticated
  using (public.is_moderator() or author_id = auth.uid())
  with check (
    public.is_moderator()
    or (
      author_id = auth.uid()
      and origin = 'student'
      and status in ('submitted', 'verified')
      and verified_by is null
    )
  );

-- Authors can delete their own notes after publishing too.
drop policy if exists "notes delete" on public.notes;
create policy "notes delete" on public.notes for delete to authenticated
  using (public.is_moderator() or author_id = auth.uid());
