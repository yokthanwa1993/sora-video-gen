-- Create videos table
create table public.videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  prompt text not null,
  video_url text not null,
  request_id text,
  resolution text default '720p',
  aspect_ratio text default '16:9',
  duration integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.videos enable row level security;

-- Create policy: Users can view only their own videos
create policy "Users can view own videos"
  on public.videos for select
  using (auth.uid() = user_id);

-- Create policy: Users can insert their own videos
create policy "Users can insert own videos"
  on public.videos for insert
  with check (auth.uid() = user_id);

-- Create policy: Users can delete their own videos
create policy "Users can delete own videos"
  on public.videos for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index videos_user_id_idx on public.videos(user_id);
create index videos_created_at_idx on public.videos(created_at desc);
