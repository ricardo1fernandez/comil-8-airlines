-- Ejecutar completo en Supabase > SQL Editor (una sola vez)

-- ========== 1. Pasajeros (visitantes de la casa abierta) ==========
create table if not exists public.pasajeros (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  ticket      text not null unique,
  nombre      text not null check (char_length(nombre) between 1 and 80),
  destino     text not null,
  puerta      text,
  asiento     text
);
alter table public.pasajeros enable row level security;
-- Los visitantes solo pueden INSERTAR (no leer ni borrar datos de otros).
create policy "anon puede registrar" on public.pasajeros
  for insert to anon with check (true);
-- Los registros se ven en Table Editor (Export -> CSV).

-- ========== 2. Enlaces de salas (Zoom/Meet), abiertos: evento de un solo dia ==========
create table if not exists public.salas (
  clave text primary key,
  url   text not null check (url ~ '^https://')
);
alter table public.salas enable row level security;
create policy "salas: leer"   on public.salas for select to anon using (true);
create policy "salas: crear"  on public.salas for insert to anon with check (true);
create policy "salas: editar" on public.salas for update to anon using (true) with check (true);
create policy "salas: borrar" on public.salas for delete to anon using (true);

-- ========== 3. Música compartida (la docente la sube desde la página) ==========
create table if not exists public.ajustes (
  clave text primary key,
  valor text not null
);
alter table public.ajustes enable row level security;
create policy "ajustes: leer"   on public.ajustes for select to anon using (true);
create policy "ajustes: crear"  on public.ajustes for insert to anon with check (true);
create policy "ajustes: editar" on public.ajustes for update to anon using (true) with check (true);
create policy "ajustes: borrar" on public.ajustes for delete to anon using (true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('musica', 'musica', true, 52428800) on conflict (id) do nothing;
create policy "musica: leer"       on storage.objects for select to anon using (bucket_id = 'musica');
create policy "musica: subir"      on storage.objects for insert to anon with check (bucket_id = 'musica');
create policy "musica: reemplazar" on storage.objects for update to anon using (bucket_id = 'musica');
create policy "musica: borrar"     on storage.objects for delete to anon using (bucket_id = 'musica');
