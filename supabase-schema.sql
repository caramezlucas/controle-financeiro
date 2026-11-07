create table if not exists public.financial_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.financial_data enable row level security;

create policy "Users can read their financial data"
  on public.financial_data
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their financial data"
  on public.financial_data
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their financial data"
  on public.financial_data
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);