-- Enable RLS
create extension if not exists "uuid-ossp";

create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table projects enable row level security;
create policy "Users own projects" on projects for all using (auth.uid() = user_id);

create table assumptions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade unique,
  discount_rate numeric default 0.10,
  fx_rate numeric default 1.36,
  edmonton_diff numeric default -4,
  quality_adj numeric default -2,
  horizon_years int default 15,
  wti_price_deck jsonb default '[74,76,78,79,80,80,80,80,80,80,81,81,81,81,82]',
  royalty_floor numeric default 0.05,
  royalty_cap numeric default 0.40,
  price_low numeric default 40,
  price_high numeric default 120,
  pdp_risk numeric default 1.0,
  pnp_risk numeric default 0.85,
  pud_risk numeric default 0.60,
  probable_risk numeric default 0.30,
  economic_limit numeric default 5,
  updated_at timestamptz default now()
);
alter table assumptions enable row level security;
create policy "Via project" on assumptions for all using (
  project_id in (select id from projects where user_id = auth.uid())
);

create table targets (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade,
  label text not null,
  name text,
  asking_price_mm numeric default 85,
  strategic_fit int default 5 check (strategic_fit between 1 and 10),
  sort_order int default 0
);
alter table targets enable row level security;
create policy "Via project" on targets for all using (
  project_id in (select id from projects where user_id = auth.uid())
);

create table nav_inputs (
  id uuid primary key default uuid_generate_v4(),
  target_id uuid references targets on delete cascade,
  reserve_category text check (reserve_category in ('PDP','PUD','Probable')),
  qi numeric default 1400,
  di numeric default 0.28,
  b_factor numeric default 0.9,
  capex_yr1_mm numeric default 0,
  var_opex_cad_boe numeric default 15.5,
  fixed_opex_mm_yr numeric default 1.2,
  aro_undiscounted_mm numeric default 22,
  aro_timing_yrs numeric default 12,
  unique(target_id, reserve_category)
);
alter table nav_inputs enable row level security;
create policy "Via target" on nav_inputs for all using (
  target_id in (select t.id from targets t join projects p on t.project_id=p.id where p.user_id=auth.uid())
);

create table liability_items (
  id uuid primary key default uuid_generate_v4(),
  target_id uuid references targets on delete cascade,
  sort_order int default 0,
  name text not null,
  gross_mm numeric default 0,
  probability numeric default 0.5 check (probability between 0 and 1),
  timing_years numeric default 5
);
alter table liability_items enable row level security;
create policy "Via target" on liability_items for all using (
  target_id in (select t.id from targets t join projects p on t.project_id=p.id where p.user_id=auth.uid())
);

create table scenario_config (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade,
  scenario text check (scenario in ('base','downside','upside')),
  price_mult numeric default 1.0,
  prod_mult numeric default 1.0,
  opex_mult numeric default 1.0,
  liability_mult numeric default 1.0,
  decline_adj numeric default 0.0,
  unique(project_id, scenario)
);
alter table scenario_config enable row level security;
create policy "Via project" on scenario_config for all using (
  project_id in (select id from projects where user_id = auth.uid())
);

create table synergy_inputs (
  id uuid primary key default uuid_generate_v4(),
  target_id uuid references targets on delete cascade unique,
  infra_score numeric default 0.5 check (infra_score between 0 and 1),
  staff_score numeric default 0.5 check (staff_score between 0 and 1),
  water_score numeric default 0.5 check (water_score between 0 and 1),
  infra_confirmed boolean default false,
  staff_confirmed boolean default false,
  water_confirmed boolean default false
);
alter table synergy_inputs enable row level security;
create policy "Via target" on synergy_inputs for all using (
  target_id in (select t.id from targets t join projects p on t.project_id=p.id where p.user_id=auth.uid())
);

create table mcda_config (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade unique,
  w_screening numeric default 0.454,
  w_pdp_share numeric default 0.262,
  w_aro_ratio numeric default 0.156,
  w_strategic_fit numeric default 0.128
);
alter table mcda_config enable row level security;
create policy "Via project" on mcda_config for all using (
  project_id in (select id from projects where user_id = auth.uid())
);

create table buyer_config (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade unique,
  n_bidders int default 4,
  hurdle_return numeric default 0.15,
  seller_batna_mm numeric default 55,
  seller_power numeric default 0.5
);
alter table buyer_config enable row level security;
create policy "Via project" on buyer_config for all using (
  project_id in (select id from projects where user_id = auth.uid())
);

create table seller_config (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade unique,
  median_buyer_value_mm numeric default 98,
  buyer_sigma numeric default 0.25,
  vdr_noise numeric default 0.15,
  seller_batna_mm numeric default 55
);
alter table seller_config enable row level security;
create policy "Via project" on seller_config for all using (
  project_id in (select id from projects where user_id = auth.uid())
);

create table territorial_competitors (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects on delete cascade,
  name text not null,
  standalone_nav_mm numeric default 76,
  adjacency numeric default 0 check (adjacency between 0 and 1),
  infra_owner boolean default false,
  denial_value_mm numeric default 0,
  sort_order int default 0
);
alter table territorial_competitors enable row level security;
create policy "Via project" on territorial_competitors for all using (
  project_id in (select id from projects where user_id = auth.uid())
);
