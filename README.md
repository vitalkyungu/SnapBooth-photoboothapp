# Graduation Photobooth

An iPad-first party photobooth web app. Guests choose **Photo Strip** or **Single Photo**, pick a countdown (3s / 5s / 10s), take selfies, then share via the iOS share sheet (AirDrop, Messages, and more). Photos are saved locally on the iPad and uploaded to a cloud gallery when Wi‑Fi is available.

## Features

- Front-camera selfie preview with countdown
- Classic 4-photo vertical strip or single framed photo
- Web Share API on iPad (AirDrop, Messages, Mail, Save to Photos)
- Local gallery stored in IndexedDB on the device
- Cloud gallery via Supabase with offline upload retry
- PWA-ready for Add to Home Screen

## Quick start

```bash
npm install
npm run dev
```

Open the dev server on your iPad (same Wi‑Fi) or use `localhost` on your Mac. Camera access requires HTTPS in production.

## Configure the event

Edit [`src/config/event.ts`](src/config/event.ts):

- `graduateName` — shown on photo footer
- `classYear` — e.g. `Class of 2026`
- `eventId` — used for cloud gallery grouping
- `accentColor` — booth accent (also update CSS `--accent` in `index.css` if needed)

## Cloud gallery (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Create a public storage bucket named `photobooth`
3. Run this SQL in the Supabase SQL editor:

```sql
create table if not exists photos (
  id uuid primary key,
  event_id text not null,
  storage_path text not null,
  mode text not null check (mode in ('strip', 'single')),
  created_at timestamptz not null default now()
);

alter table photos enable row level security;

create policy "Public read photos"
  on photos for select
  using (true);

create policy "Public insert photos"
  on photos for insert
  with check (true);

-- Storage policies (adjust in Dashboard if needed)
create policy "Public read photobooth"
  on storage.objects for select
  using (bucket_id = 'photobooth');

create policy "Public upload photobooth"
  on storage.objects for insert
  with check (bucket_id = 'photobooth');
```

4. Copy `.env.example` to `.env` and add your project URL and anon key:

```bash
cp .env.example .env
```

## Deploy

Deploy to Vercel or Netlify (HTTPS is required for camera access on iPad):

```bash
npm run build
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your host’s environment variables.

## Party-day checklist

1. Deploy the app to an HTTPS URL
2. On the iPad, open the URL in **Safari** → Share → **Add to Home Screen**
3. Test camera permission once before guests arrive
4. Optional: enable **Guided Access** (Settings → Accessibility) to lock the iPad to the booth
5. Confirm venue Wi‑Fi for cloud sync (local capture works offline)
6. Share `/gallery` with co-hosts to browse uploads from the night

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Start screen — choose strip or single |
| `/camera/strip` | 4-shot strip capture |
| `/camera/single` | Single photo capture |
| `/preview` | Share / download / retake |
| `/local` | Photos saved on this iPad |
| `/gallery` | Cloud gallery (Supabase) |

## Tech stack

- Vite + React + TypeScript
- Canvas API for strip compositing
- IndexedDB (`idb`) for local gallery
- Supabase Storage + Postgres for cloud gallery
- Web Share API for native iOS sharing
