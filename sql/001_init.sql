create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  codigo text,
  tipo text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  perfil text not null check (perfil in ('admin', 'tecnico', 'utilizador')),
  unidade_id uuid references public.units(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.occurrences (
  id uuid primary key default gen_random_uuid(),
  numero_ocorrencia text,
  unidade_id uuid not null references public.units(id),
  local_ocorrencia text,
  ocorrencia text not null,
  categoria text,
  prioridade text check (prioridade in ('Baixa', 'Média', 'Alta', 'Crítica')),
  estado text not null check (estado in (
    'Em aberto','Em análise','A aguardar resposta','Em execução','Concluída','Sem efeito','Duplicado'
  )),
  data_reporte date not null,
  data_resolucao_resposta date,
  outras_informacoes text,
  tecnico_responsavel_id uuid references public.profiles(id),
  criado_por_id uuid references public.profiles(id),
  origem text,
  flag_revisao text,
  duplicado_de_id uuid references public.occurrences(id),
  sla_horas integer,
  prazo_previsto timestamptz,
  resolvida_fora_sla boolean,
  notificacao_enviada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_data_resolucao_concluida check (
    estado <> 'Concluída' or data_resolucao_resposta is not null
  ),
  constraint chk_datas_validas check (
    data_resolucao_resposta is null or data_resolucao_resposta >= data_reporte
  )
);

create table if not exists public.occurrence_updates (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.occurrences(id) on delete cascade,
  estado_anterior text,
  estado_novo text,
  observacao text,
  alterado_por_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.occurrences(id) on delete cascade,
  nome_ficheiro text not null,
  caminho_storage text not null,
  tipo_mime text,
  tamanho bigint,
  carregado_por_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid references public.occurrences(id) on delete cascade,
  tipo text not null,
  destinatario text,
  sucesso boolean not null default false,
  resposta text,
  created_at timestamptz not null default now()
);

create index if not exists idx_occurrences_unidade on public.occurrences (unidade_id);
create index if not exists idx_occurrences_estado on public.occurrences (estado);
create index if not exists idx_occurrences_data_reporte on public.occurrences (data_reporte desc);
create index if not exists idx_occurrences_numero on public.occurrences (numero_ocorrencia);
create index if not exists idx_occurrences_search on public.occurrences
using gin ((coalesce(numero_ocorrencia, '') || ' ' || coalesce(local_ocorrencia, '') || ' ' || coalesce(ocorrencia, '') || ' ' || coalesce(outras_informacoes, '')) gin_trgm_ops);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_occurrence_sla()
returns trigger language plpgsql as $$
begin
  if new.prioridade = 'Crítica' then
    new.sla_horas := 4;
  elsif new.prioridade = 'Alta' then
    new.sla_horas := 8;
  elsif new.prioridade = 'Média' then
    new.sla_horas := 24;
  elsif new.prioridade = 'Baixa' then
    new.sla_horas := 72;
  end if;

  if new.data_reporte is not null and new.sla_horas is not null then
    new.prazo_previsto := (new.data_reporte::timestamp + make_interval(hours => new.sla_horas));
  end if;

  if new.estado = 'Concluída' and new.data_resolucao_resposta is not null and new.prazo_previsto is not null then
    new.resolvida_fora_sla := (new.data_resolucao_resposta::timestamp > new.prazo_previsto);
  else
    new.resolvida_fora_sla := false;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_occurrences_updated_at on public.occurrences;
create trigger trg_occurrences_updated_at before update on public.occurrences for each row execute function public.set_updated_at();

drop trigger if exists trg_occurrences_sla on public.occurrences;
create trigger trg_occurrences_sla before insert or update on public.occurrences for each row execute function public.set_occurrence_sla();

alter table public.units enable row level security;
alter table public.profiles enable row level security;
alter table public.occurrences enable row level security;
alter table public.occurrence_updates enable row level security;
alter table public.attachments enable row level security;
alter table public.notification_logs enable row level security;

create or replace function public.current_user_role()
returns text language sql stable as $$
  select perfil from public.profiles where id = auth.uid()
$$;

create policy if not exists "read occurrences admin tecnico" on public.occurrences for select using (public.current_user_role() in ('admin', 'tecnico'));
create policy if not exists "read occurrences utilizador own unit" on public.occurrences for select using (public.current_user_role() = 'utilizador' and unidade_id = (select unidade_id from public.profiles where id = auth.uid()));
create policy if not exists "insert occurrences authenticated" on public.occurrences for insert with check (auth.uid() is not null);
create policy if not exists "update occurrences admin tecnico" on public.occurrences for update using (public.current_user_role() in ('admin', 'tecnico'));
create policy if not exists "read updates authenticated" on public.occurrence_updates for select using (auth.uid() is not null);
create policy if not exists "insert updates admin tecnico" on public.occurrence_updates for insert with check (public.current_user_role() in ('admin', 'tecnico'));
create policy if not exists "read attachments authenticated" on public.attachments for select using (auth.uid() is not null);
create policy if not exists "insert attachments authenticated" on public.attachments for insert with check (auth.uid() is not null);
create policy if not exists "read notification logs admin tecnico" on public.notification_logs for select using (public.current_user_role() in ('admin', 'tecnico'));
create policy if not exists "insert notification logs admin tecnico" on public.notification_logs for insert with check (public.current_user_role() in ('admin', 'tecnico'));
