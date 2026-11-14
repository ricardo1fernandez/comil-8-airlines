# COMIL 8 AIRLINES – Despliegue gratis (Vercel + Supabase)

## 1. Base de datos (Supabase, gratis)
1. Crear cuenta en https://supabase.com → New project.
2. SQL Editor → pegar TODO `supabase.sql` → Run.
3. Project Settings → API: copiar **Project URL** y **anon public key**.
4. Pegarlos en `config.js`.
5. Ver los registros de visitantes: Supabase → Table Editor → `pasajeros` (Export → CSV).

## 2. Publicar (Vercel, gratis)
https://vercel.com → Add New → Project → subir esta carpeta, o con CLI: `npx vercel --prod` dentro de la carpeta.

## 3. Uso (sin claves ni PIN)
- **Visitantes**: Check-in (nombre + país) → "Generar mi pase" → se guarda y sale el ticket imprimible.
- **Docente – salas**: botón "Configurar salas" → pegar enlaces → "Generar enlace del evento".
  Quedan guardados en la base de datos y todos los visitantes los ven con el link normal.
- **Música**: botón ♫ → elegir archivo (MP3/WAV/OGG, máx. 50 MB) → "Guardar para todos los visitantes".
  Se sube a Supabase Storage y suena para todos (tras su primer clic en la página). "Quitar música de todos" la elimina.
