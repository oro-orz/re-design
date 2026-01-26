-- app_users: 社員番号・氏名・メール・auth 紐づけ（パスワードは auth.users に格納）
create table app_users (
  id uuid default gen_random_uuid() primary key,
  employee_number text not null unique,
  name text not null,
  email text not null unique,
  auth_user_id uuid not null references auth.users on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_app_users_email on app_users (email);
create index idx_app_users_auth_user_id on app_users (auth_user_id);

comment on table app_users is '社員番号・氏名・メールと auth.users の対応';
comment on column app_users.employee_number is '社員番号';
comment on column app_users.name is '氏名';
comment on column app_users.email is 'メールアドレス';
