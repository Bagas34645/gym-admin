# Gym Admin Dashboard

Web Admin Dashboard untuk sistem manajemen gym, dibangun dengan Next.js 16, Tailwind CSS 4, dan shadcn/ui. Terintegrasi dengan API Laravel [gym-management-api](../gym-management-api).

## Persyaratan

- Node.js 20+
- API Laravel berjalan di `http://localhost:8000`

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Akun development

| Email | Password | Role |
|-------|----------|------|
| `admin@gym.local` | `password` | admin |

Pastikan backend sudah di-seed (`php artisan db:seed`).

## Menjalankan dengan API

Terminal 1 — API:

```bash
cd ../gym-management-api
php artisan serve
```

Terminal 2 — Admin:

```bash
npm run dev
```

## Arsitektur

- **BFF**: Route Handlers di `/api/*` mem-proxy ke Laravel dengan JWT di httpOnly cookies
- **Auth**: Login → `POST /v1/auth/login` → guard role `admin` / `super_admin`
- **Data**: TanStack Query + envelope API `{ success, data, meta }`

## Modul

- Dashboard (KPI + grafik tren)
- Anggota (CRUD, import/export)
- Paket membership
- Membership (aktivasi, kedaluwarsa)
- Absensi (live, verifikasi, riwayat, rekap)
- Pelatih (jadwal, performa, rencana latihan)
- Laporan & export
- Notifikasi push
- Chat dukungan
- Feedback

## Generate tipe API

```bash
npx openapi-typescript ../gym-management-api/storage/api-docs/api-docs.yaml -o src/lib/types/api.generated.ts
```
