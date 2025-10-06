-- เพิ่ม column status ถ้ายังไม่มี
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'videos' and column_name = 'status') then
    alter table public.videos add column status text default 'loading' check (status in ('loading', 'completed', 'failed'));
  end if;
end $$;

-- ทำให้ video_url เป็น nullable
alter table public.videos alter column video_url drop not null;

-- สร้าง policy สำหรับ update ถ้ายังไม่มี
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can update own videos' and tablename = 'videos') then
    execute 'create policy "Users can update own videos" on public.videos for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;
