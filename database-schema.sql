-- Digital Minds BPO Services Inc.
-- Inventory Management System database schema
-- Covers: auth/profile, inventory, assignments, user management, settings, and reporting views.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.auth_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'Admin', false);
$$;

create or replace function public.is_admin_or_it()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('Admin', 'IT Officers'), false);
$$;

create or replace function public.is_current_profile_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.user_id = target_user_id
      and u.auth_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  user_id uuid primary key default gen_random_uuid(),
  auth_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'User'
    check (role in ('Admin', 'IT Officers', 'HR Officers', 'User', 'user')),
  phone text not null default '',
  department text not null default '',
  position text not null default '',
  date_joined text not null default '',
  is_blocked boolean not null default false,
  blocked_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_auth_id on public.users (auth_id);
create index if not exists idx_users_role on public.users (role);
create index if not exists idx_users_blocked on public.users (is_blocked);

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create table if not exists public.assets (
  asset_id uuid primary key default gen_random_uuid(),
  asset_name text not null,
  sku text not null unique,
  asset_type text not null,
  brand text not null default '',
  model text not null default '',
  serial_number text not null default '',
  status text not null default 'Available'
    check (status in ('Available', 'Assigned', 'Under Maintenance', 'Defective')),
  condition text not null default 'Good'
    check (condition in ('Excellent', 'Good', 'Fair', 'Poor', 'Damaged')),
  purchase_date date null,
  price numeric(12,2) not null default 0,
  quantity integer not null default 0 check (quantity >= 0),
  min_quantity integer not null default 0 check (min_quantity >= 0),
  location text not null default '',
  location_code text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assets_type on public.assets (asset_type);
create index if not exists idx_assets_status on public.assets (status);
create index if not exists idx_assets_condition on public.assets (condition);
create index if not exists idx_assets_location on public.assets (location_code);

alter table public.assets
drop constraint if exists assets_status_check;

alter table public.assets
add constraint assets_status_check
check (status in ('Available', 'Assigned', 'Under Maintenance', 'Defective'));

drop trigger if exists trg_assets_updated_at on public.assets;
create trigger trg_assets_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

create table if not exists public.assignments (
  assignment_id text primary key,
  asset_id uuid null references public.assets(asset_id) on delete set null,
  asset_name text not null,
  asset_sku text not null,
  asset_category text not null,
  assigned_to_name text not null,
  department text not null,
  workstation text not null,
  seat_number integer null,
  floor text not null,
  status text not null default 'Assigned'
    check (status in ('Available', 'Assigned', 'Under Maintenance', 'Defective')),
  date_assigned timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assignments_asset_id on public.assignments (asset_id);
create index if not exists idx_assignments_status on public.assignments (status);
create index if not exists idx_assignments_department on public.assignments (department);
create index if not exists idx_assignments_date on public.assignments (date_assigned);

alter table public.assignments
drop constraint if exists assignments_status_check;

alter table public.assignments
add constraint assignments_status_check
check (status in ('Available', 'Assigned', 'Under Maintenance', 'Defective'));

drop trigger if exists trg_assignments_updated_at on public.assignments;
create trigger trg_assignments_updated_at
before update on public.assignments
for each row execute function public.set_updated_at();

create or replace function public.sync_assignment_asset_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asset public.assets%rowtype;
begin
  if new.asset_id is null then
    return new;
  end if;

  select * into v_asset
  from public.assets
  where asset_id = new.asset_id;

  if not found then
    raise exception 'Asset not found for assignment %', new.assignment_id;
  end if;

  new.asset_name := v_asset.asset_name;
  new.asset_sku := v_asset.sku;
  new.asset_category := v_asset.asset_type;
  return new;
end;
$$;

drop trigger if exists trg_assignments_snapshot on public.assignments;
create trigger trg_assignments_snapshot
before insert or update of asset_id on public.assignments
for each row execute function public.sync_assignment_asset_snapshot();

create table if not exists public.company_profile (
  id integer primary key default 1,
  company_name text not null default 'Digital Minds BPO Services Inc.',
  business_type text not null default 'Business Process Outsourcing',
  industry text not null default 'Information Technology & Services',
  registration_number text not null default '',
  tax_id text not null default '',
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  address text not null default '',
  city text not null default '',
  province text not null default '',
  postal_code text not null default '',
  country text not null default 'Philippines',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_company_profile_updated_at on public.company_profile;
create trigger trg_company_profile_updated_at
before update on public.company_profile
for each row execute function public.set_updated_at();

insert into public.company_profile (
  id,
  company_name,
  business_type,
  industry,
  registration_number,
  tax_id,
  email,
  phone,
  website,
  address,
  city,
  province,
  postal_code,
  country
)
values (
  1,
  'Digital Minds BPO Services Inc.',
  'Business Process Outsourcing',
  'Information Technology & Services',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  'Philippines'
)
on conflict (id) do nothing;

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users(user_id) on delete cascade,
  low_stock boolean not null default true,
  out_of_stock boolean not null default true,
  new_item boolean not null default false,
  weekly_report boolean not null default true,
  email_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_notification_preferences_updated_at on public.notification_preferences;
create trigger trg_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reporting views
-- ---------------------------------------------------------------------------

create or replace view public.report_inventory_summary as
select
  count(*)::bigint as asset_types,
  coalesce(sum(quantity), 0)::bigint as total_assets,
  coalesce(sum(quantity) filter (where status = 'Available'), 0)::bigint as in_stock,
  coalesce(sum(quantity) filter (where quantity > 0 and quantity <= min_quantity), 0)::bigint as low_stock,
  coalesce(sum(quantity) filter (where quantity = 0), 0)::bigint as out_of_stock,
  coalesce(sum(price * quantity), 0)::numeric(12,2) as total_inventory_value
from public.assets;

create or replace view public.report_stock_by_category as
select
  asset_type as category,
  coalesce(sum(quantity) filter (where status = 'Available'), 0)::bigint as in_stock,
  coalesce(sum(quantity) filter (where quantity > 0 and quantity <= min_quantity), 0)::bigint as low_stock,
  coalesce(sum(quantity) filter (where quantity = 0), 0)::bigint as out_of_stock,
  coalesce(sum(quantity), 0)::bigint as total_quantity
from public.assets
group by asset_type
order by asset_type;

create or replace view public.report_asset_condition_summary as
select
  case
    when condition = 'Poor' then 'Damaged'
    else condition
  end as condition_name,
  coalesce(sum(quantity), 0)::bigint as quantity
from public.assets
group by case
  when condition = 'Poor' then 'Damaged'
  else condition
end
order by condition_name;

create or replace view public.report_low_stock_alerts as
select
  asset_id,
  asset_name,
  sku,
  asset_type,
  quantity as current_quantity,
  min_quantity as minimum_quantity,
  (min_quantity - quantity) as shortage
from public.assets
where quantity <= min_quantity
order by shortage desc, asset_name asc;

create or replace view public.report_recent_assignments as
select
  assignment_id,
  asset_name,
  asset_sku,
  asset_category,
  assigned_to_name,
  department,
  workstation,
  seat_number,
  floor,
  status,
  date_assigned
from public.assignments
order by date_assigned desc;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.assets enable row level security;
alter table public.assignments enable row level security;
alter table public.company_profile enable row level security;
alter table public.notification_preferences enable row level security;

-- USERS
drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin"
on public.users
for select
to authenticated
using (
  auth.uid() = auth_id
  or public.is_admin()
);

drop policy if exists "users_insert_own_or_admin" on public.users;
create policy "users_insert_own_or_admin"

on public.users
for insert
to authenticated
with check (
  auth.uid() = auth_id
  or public.is_admin()
);

drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin"
on public.users
for update
to authenticated
using (
  auth.uid() = auth_id
  or public.is_admin()
)
with check (
  auth.uid() = auth_id
  or public.is_admin()
);

drop policy if exists "users_delete_admin_only" on public.users;
create policy "users_delete_admin_only"
on public.users
for delete
to authenticated
using (public.is_admin());

-- ASSETS
drop policy if exists "assets_select_authenticated" on public.assets;
create policy "assets_select_authenticated"
on public.assets
for select
to authenticated
using (true);

drop policy if exists "assets_write_admin_or_it" on public.assets;
create policy "assets_write_admin_or_it"
on public.assets
for insert
to authenticated
with check (public.is_admin_or_it());

drop policy if exists "assets_update_admin_or_it" on public.assets;
create policy "assets_update_admin_or_it"
on public.assets
for update
to authenticated
using (public.is_admin_or_it())
with check (public.is_admin_or_it());

drop policy if exists "assets_delete_admin_or_it" on public.assets;
create policy "assets_delete_admin_or_it"
on public.assets
for delete
to authenticated
using (public.is_admin_or_it());

-- ASSIGNMENTS
drop policy if exists "assignments_select_authenticated" on public.assignments;
create policy "assignments_select_authenticated"
on public.assignments
for select
to authenticated
using (true);

drop policy if exists "assignments_write_admin_or_it" on public.assignments;
create policy "assignments_write_admin_or_it"
on public.assignments
for insert
to authenticated
with check (public.is_admin_or_it());

drop policy if exists "assignments_update_admin_or_it" on public.assignments;
create policy "assignments_update_admin_or_it"
on public.assignments
for update
to authenticated
using (public.is_admin_or_it())
with check (public.is_admin_or_it());

drop policy if exists "assignments_delete_admin_or_it" on public.assignments;
create policy "assignments_delete_admin_or_it"
on public.assignments
for delete
to authenticated
using (public.is_admin_or_it());

-- COMPANY PROFILE
drop policy if exists "company_profile_select_authenticated" on public.company_profile;
create policy "company_profile_select_authenticated"
on public.company_profile
for select
to authenticated
using (true);

drop policy if exists "company_profile_admin_write" on public.company_profile;
create policy "company_profile_admin_write"
on public.company_profile
for all
to authenticated
using (true)
with check (true);

-- NOTIFICATION PREFERENCES
drop policy if exists "notification_preferences_select_own_or_admin" on public.notification_preferences;
create policy "notification_preferences_select_own_or_admin"
on public.notification_preferences
for select
to authenticated
using (
  public.is_current_profile_user(user_id)
  or public.is_admin()
);

drop policy if exists "notification_preferences_write_own_or_admin" on public.notification_preferences;
create policy "notification_preferences_write_own_or_admin"
on public.notification_preferences
for insert
to authenticated
with check (
  public.is_current_profile_user(user_id)
  or public.is_admin()
);

drop policy if exists "notification_preferences_update_own_or_admin" on public.notification_preferences;
create policy "notification_preferences_update_own_or_admin"
on public.notification_preferences
for update
to authenticated
using (
  public.is_current_profile_user(user_id)
  or public.is_admin()
)
with check (
  public.is_current_profile_user(user_id)
  or public.is_admin()
);

drop policy if exists "notification_preferences_delete_admin" on public.notification_preferences;
create policy "notification_preferences_delete_admin"
on public.notification_preferences
for delete
to authenticated
using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Optional helper seed for existing users
-- ---------------------------------------------------------------------------

insert into public.notification_preferences (user_id)
select u.user_id
from public.users u
where not exists (
  select 1
  from public.notification_preferences n
  where n.user_id = u.user_id
)
on conflict (user_id) do nothing;
