-- projects: 1回の診断セッション
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  original_image_url text not null,
  target_memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- generations: 生成結果履歴
create table generations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects on delete cascade not null,
  selected_mode text not null,
  feedback_text text,
  generated_image_url text,
  used_prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table projects enable row level security;
alter table generations enable row level security;

create policy "Users can CRUD own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can CRUD own generations via projects"
  on generations for all
  using (
    exists (
      select 1 from projects p
      where p.id = generations.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from projects p
      where p.id = generations.project_id and p.user_id = auth.uid()
    )
  );
