-- Allow users to edit only their own generated study materials.
drop policy if exists "generations update own" on public.ai_generations;
create policy "generations update own" on public.ai_generations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
