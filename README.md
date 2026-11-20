# RE-SKIN — Next.js + Supabase starter

Landing page RE-SKIN dipindahkan ke **Next.js App Router + TypeScript**. Ikon antarmuka menggunakan **Lucide React**, sedangkan logo media sosial menggunakan **Font Awesome 6 Brands** melalui `react-icons/fa6`.

## Stack

- Next.js 16 App Router + React 19 + TypeScript
- Lucide React untuk ikon antarmuka
- React Icons Font Awesome 6 Brands untuk Instagram, TikTok, dan WhatsApp
- Supabase Auth dan PostgreSQL
- Supabase SSR untuk session berbasis cookie
- Siap dikonfigurasi untuk deployment Vercel

## 1. Jalankan secara lokal

Pastikan Node.js versi 20.9 atau lebih baru sudah terpasang. Jalankan perintah dari folder project yang berisi `package.json`:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

Jika sebelumnya sudah mencoba memasang versi project yang memiliki dependency ikon berbeda, hapus folder `node_modules` dan file `package-lock.json` (jika ada), lalu jalankan `npm install` kembali. Jangan menjalankan `npm install` dari folder induk yang tidak memiliki `package.json`.

## 2. Konfigurasi Supabase

1. Buat project di Supabase.
2. Ambil Project URL dan Publishable Key dari Project Settings → API / Connect.
3. Salin `.env.local.example` menjadi `.env.local`.
4. Isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
```

Jangan menaruh `service_role` key di variabel `NEXT_PUBLIC_*` atau kode browser.

## 3. Siapkan database

1. Buka Supabase → SQL Editor.
2. Jalankan seluruh isi `supabase/schema.sql`.
3. Daftarkan akun admin melalui website.
4. Setelah profil akun terbentuk, promosikan akun tepercaya melalui SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@domainkamu.com';
```

Pendaftaran publik selalu membuat role `member`. Pengguna tidak dapat mengubah role miliknya sendiri dari aplikasi.

## 4. Aktifkan Supabase Auth

Pada Authentication → URL Configuration, atur Site URL lokal ke `http://localhost:3000` dan tambahkan Redirect URL `http://localhost:3000/auth/callback`. Setelah deploy, tambahkan domain Vercel beserta `/auth/callback`.

## 5. Fitur aplikasi

- `/` — landing page RE-SKIN.
- `/dashboard` — dashboard anggota untuk melihat saldo SKINPoint, jumlah kemasan, status/riwayat pickup, dan transaksi poin.
- `/admin` — dashboard admin untuk mengelola anggota, pengajuan pickup, verifikasi kemasan, dan pemberian poin.
- Poin tidak ditambahkan saat pickup diajukan. Poin diberikan setelah admin memverifikasi jumlah aktual kemasan melalui fungsi database yang memeriksa role admin.

## 6. Deploy ke Vercel

1. Push project ke GitHub.
2. Import repository di Vercel.
3. Tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pada Environment Variables.
4. Deploy, lalu tambahkan domain Vercel ke Supabase Auth URL Configuration.

## Troubleshooting ikon Font Awesome 6

Project ini hanya memakai paket ikon FA6 berikut:

- `@fortawesome/free-solid-svg-icons`
- `@fortawesome/free-brands-svg-icons`

Tidak ada import runtime dari `@fortawesome/fontawesome-svg-core` maupun `@fortawesome/react-fontawesome`. Komponen `src/components/Icons.tsx` dan ikon modal di `src/components/LandingInteractions.tsx` merender path SVG FA6 secara langsung.

Jika muncul error `Module not found`, pastikan terminal berada di folder `reskin-nextjs` (folder yang memiliki `package.json`), lalu jalankan:

```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

Jika menggunakan Command Prompt:

```bat
rmdir /s /q node_modules
 del package-lock.json
 npm install
 npm run dev
```

## Perintah

```bash
npm run dev
npm run build
npm run start
npm run lint
```


## Typography update

The landing page now uses a two-font editorial system:
- **DM Sans** for body copy, navigation, buttons, cards, and bold headings.
- **Playfair Display Italic** for selected accent phrases in section headings, giving the page a softer and more feminine editorial contrast.

The hero headline is set in bold DM Sans with **“Selamat!”** highlighted in RE-SKIN coral (`#990300`) and a soft lime underline, following the supplied visual reference. The accent serif is also applied to selected phrases in the quick-start, how-it-works, packaging guide, catalog, pickup area, about, FAQ, and final CTA sections.

Fonts load from Google Fonts in the browser and have system fallbacks if the font service is unavailable. No Next.js build-time font download is required.

After extracting the project, run `npm install` before `npm run dev` so all dependencies listed in `package.json` (including Font Awesome 6 brand and solid icon packages) are installed.


## Typography system
- Main headings and body: Noto Sans.
- Selected editorial phrases across the landing page: Playfair Display Italic.
- The global typography override is intentionally placed at the END of `src/app/globals.css`.
  Keep it last when adding future CSS so older theme overrides do not reset `.display-serif`.


## Typography update — Plus Jakarta Sans
- Main typeface: Plus Jakarta Sans, using weights 400–800.
- Headline hierarchy is tuned to 700, with the hero at 800 to reduce the overly heavy appearance.
- Editorial accent remains Playfair Display Italic.


## UI polish update
- Hero headline uses Plus Jakarta Sans with a lighter 700/800 weight hierarchy.
- Navbar registration CTA uses the brand red (#990300) with white text for stronger visual prominence.
- Landing page body copy and card descriptions have improved minimum font sizes and line-height.
- Footer landscape SVG has been compacted and reshaped so the CTA flows directly into the footer without a large empty band.


## Icon system
- Interface icons (navigation, actions, cards, pickup, dashboard): `lucide-react`.
- Social brand marks (Instagram, TikTok, WhatsApp): Font Awesome 6 Brands through `react-icons/fa6`.
- The shared `<Icon />` component maps the existing `data-lucide` names and dashboard icon names to this convention.
- Do not reintroduce `@fortawesome/free-solid-svg-icons`; Lucide icons use stroke rendering while social brand icons use filled rendering.


## Pickup map illustration update
- Removed decorative icons from the two map badges to prevent text/icon collisions.
- Repositioned the Campus Hub label to the right of the location pin.
- Rebalanced the building markers and added simple window details for visual clarity.
- Added responsive badge sizing for mobile.


## Why section sticker refresh
- The yellow burst illustration in the “Why RE-SKIN?” section now uses a centered recycle icon.
- Corner text has been rebalanced into three sticker captions: RE-USE, RE-LOVE, and REPEAT.
- The illustration keeps the soft pastel organic shape, but is cleaner and more brand-relevant.


## Why RE-SKIN sticker — V2
- Rebalanced the recycle sticker into a clean circular badge.
- Centered the recycle icon inside a soft mint disc.
- Set RE-USE and RE-LOVE as aligned top corner labels and REPEAT as a centered bottom label.
- Removed label rotations, edge clipping, decorative glare spots, and uneven spacing.
- Added compact responsive sizing for mobile.


## Why RE-SKIN sticker — V3 positioning fix
- Fixed the recycle icon core anchor. The CSS `inset: auto` shorthand previously reset the top/left coordinates.
- Explicitly anchors the mint circle at 50% / 50% with translate(-50%, -50%).
- Keeps the centered icon static inside the mint circle.


## CTA and footer seamless transition
- Added a vertical mint/turquoise fade to the lower edge of the CTA while preserving its pastel horizontal gradient.
- Matched the CTA's final color exactly to the first turquoise footer wave (`#D4FFFF`).
- Removed the visible color seam by overlapping the footer landscape upward by 34px on desktop and 26px on mobile.
- Balanced the landscape's bottom margin so the footer content keeps its previous vertical position.
- Preserved the turquoise, lavender, and navy wave layers and the navy footer.


## Footer landscape refresh
- Reworked the footer landscape so the distant green hills sit higher, similar to the hero composition.
- Added small tree shapes on the hills to strengthen the go-green feeling.
- Kept the turquoise field, lavender wave, navy wave, and sparkle doodles for continuity.


## Footer green landscape — V2 layer correction
- Corrected SVG paint order: lavender wave first, then raised green hills and trees, then the navy foreground wave.
- Hills are now intentionally drawn above the lavender layer, rather than underneath it.
- Added three visible stylized tree silhouettes with layered green canopies.
- Updated footer SVG CSS selectors to use `:first-of-type` / `:last-of-type`, so the new SVG groups do not break wave colors.


## Footer landscape V3 — hills meet the navy wave cleanly
- Reordered the SVG so the navy foreground wave is painted before the green hills.
- Added an SVG clip path matching the exact upper contour of the navy wave. The hills and trees are clipped to the area above the wave, so their visible tips and edges are not covered by a later layer.
- Extended the navy wave beyond the SVG viewBox bottom to avoid a one-pixel antialias seam.
- Set the SVG/container background to the same `#130B45` as the footer and removed border/outline artifacts.


## 7. Local Demo Mode (tanpa Supabase)

Dashboard admin dan anggota dapat ditinjau tanpa membuat project Supabase.

- Jika dijalankan dengan `npm run dev` dan kredensial Supabase belum diisi (atau masih berupa placeholder dari `.env.local.example`), Demo Mode aktif otomatis.
- Buka `http://localhost:3000/admin` untuk dashboard Admin.
- Buka `http://localhost:3000/dashboard` untuk dashboard Member.
- Demo Mode dapat dipaksa aktif di development dengan `RE_SKIN_DEMO_MODE=true` pada `.env.local`, termasuk jika kredensial Supabase sudah tersedia.
- Jika ingin kembali ke autentikasi Supabase saat development, hapus flag tersebut atau ubah menjadi `false` setelah mengisi kredensial Supabase.
- Demo Mode hanya berjalan saat `NODE_ENV` bukan `production`. Pada build/deployment production, dashboard tetap memerlukan Supabase Auth dan role yang sesuai.

Data contoh di dashboard dapat digunakan untuk mencoba filter pickup, konfirmasi, pembatalan, dan verifikasi SKINPoint. Perubahan hanya tersimpan sementara di state browser; memuat ulang halaman akan mengembalikan data awal. Demo Admin dan Demo Member memakai data contoh masing-masing dan tidak saling menyimpan perubahan.

The demo verification preview follows the point values in the included SQL schema: 5 points for 5–40 ml, 10 points for 50–100 ml, and 15 points for 200–500 ml. This is a local UI simulation only.


## Demo Member Experience

The local demo member is greeted as **Beauty Bestie** and can view the Reward Corner, submit simulated reward redemptions, and track redemption status. Demo reward tiers use the minimum point threshold from the existing landing-page point ranges; stock and final exchange details remain subject to admin confirmation.

## Demo Notifications

The Admin and Member dashboards include an in-app notification center. In local demo mode, pickup submissions and reward requests appear in the Admin notification center; members receive status, verification, and redemption updates. Events synchronize between open tabs in the same browser using localStorage and BroadcastChannel. This is a local preview feature only, not a production push notification service.


## Procedure correction: pickup and reward handover

### Pickup request
- Clicking **Ajukan pickup** opens a form; it does not send a request or notify Admin yet.
- The member must provide date, time, pickup address, WhatsApp number, and estimated package quantities.
- The additional note is optional. An empty note stays empty and is not generated by the system.
- Only clicking **Kirim Pengajuan** creates the pickup record and notifies Admin. Admin sees only the details submitted by the member.
- Old V2 synthetic pickup events that contained the hard-coded note `Pengajuan pickup dari member area demo.` are removed during demo-event loading.

### Reward redemption and receipt
1. Member submits a reward redemption request. Points are reserved temporarily.
2. Admin approves or rejects. Approval means the reward is being prepared; it does not mean it has been handed over. Rejection returns the reserved points.
3. After approval, Admin selects direct pickup or delivery and enters the handover instructions (pickup location/schedule, or courier/tracking details).
4. The member sees the details in the redemption history and receives a notification.
5. After actually receiving the reward, the member clicks **Saya Sudah Menerima Hadiah**.
6. The redemption becomes **received/completed**, and Admin receives a notification that the member confirmed receipt.

All these flows are local demo simulations. Production must validate status transitions and persist them in Supabase; the actual item stock, delivery address, courier, and fulfillment evidence must be managed by the Admin.


## Admin Profile and Member Account Deletion

The Admin top bar now has a profile dropdown with an illustrative avatar, admin identity, account details, and sign-out navigation. The member demo profile includes an account deletion request form. Requests are stored as local demo events, appear in the Admin account-management queue, and can be approved or rejected. Approval does not delete an account; permanent deletion requires a separately authorized server-side process after identity verification.


## Admin Pickup Verification UI (V5)

The pickup cards now use a full-width member-information area followed by a dedicated action area. Member name, email, schedule, location, WhatsApp, package counts, and notes no longer collapse into a narrow left column. For confirmed pickups, the verification heading, three package-size inputs, and primary verification action align in a balanced horizontal panel on desktop and reflow responsively on smaller screens. The cancellation action is visually secondary and no longer stretches across the card.


## Member Profile Logout (V6)
- Added a visible **Keluar dari akun** action at the bottom of the member profile dropdown.
- In Demo Mode, this returns the member to the public landing page. There is no Supabase session to revoke until authentication is configured.


## Member Account Privacy Menu (V7)
- Moved the account-deletion request out of the primary profile menu into a collapsed **Pengaturan akun & privasi** disclosure.
- The member must intentionally expand account settings before the deletion request action is shown.
- The existing deletion-request modal, reason field, typed confirmation, and admin review flow remain unchanged.
- **Keluar dari akun** remains visible as the clear primary account-exit action.


## 8. Notifikasi WhatsApp untuk pengajuan member

Pengajuan pickup dan penukaran hadiah dari Member Demo membuka WhatsApp Admin dengan pesan yang sudah diisi. Form pickup pada landing page juga membuka WhatsApp setelah pengajuan berhasil disimpan melalui Supabase.

### Konfigurasi nomor Admin

1. Buka `.env.local` di folder `reskin-nextjs`.
2. Tambahkan nomor WhatsApp Admin:

```env
NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP=628xxxxxxxxxx
```

Gunakan nomor WhatsApp aktif dalam format internasional tanpa tanda `+`, spasi, atau tanda hubung. Nomor lokal `08...` juga dinormalisasi otomatis ke format `62...`.
3. Simpan file dan restart `npm run dev`.
4. Di Vercel, tambahkan `NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP` pada Project Settings → Environment Variables, lalu redeploy.

### Alur yang berjalan

- Pickup: sistem menyimpan pengajuan terlebih dahulu (di Demo Mode ke penyimpanan demo lokal; di landing Supabase ke database), lalu membuka chat Admin dengan ID pengajuan, identitas member, nomor kontak, rincian ukuran/jumlah kemasan, tanggal, jam, alamat, dan catatan hanya jika member mengisinya.
- Penukaran hadiah: Demo Member mencatat permintaan penukaran, lalu membuka chat Admin berisi ID permintaan, nama member, hadiah, jumlah SKINPoint, dan tanggal.
- Jika nomor Admin belum diisi, pengajuan tetap dicatat sesuai mode yang digunakan dan UI memberi tahu bahwa kontak WhatsApp belum dikonfigurasi.

**Batasan WhatsApp:** website tidak dapat menekan tombol Kirim secara otomatis. WhatsApp dibuka ke chat Admin dengan teks siap kirim; member tetap menekan **Kirim**. Ini adalah perilaku click-to-chat WhatsApp dan bukan integrasi WhatsApp Business API.


## WhatsApp Admin number configured (V9)

The project package includes a ready-to-use `.env.local` for Demo Mode with the Admin WhatsApp number supplied by the project owner: `+62 813-8809-289` (normalized to `628138809289` for WhatsApp click-to-chat). The same value is present in `.env.local.example`.

For Vercel, add this Environment Variable manually:

```env
NEXT_PUBLIC_RE_SKIN_ADMIN_WHATSAPP=628138809289
```

Then redeploy. Keep the number in international format without `+`, spaces, or hyphens.


## Admin Request Search & Date Filters (V10)

The Admin dashboard now supports:
- Search by request number/ID for pickup requests.
- Filter pickup requests by month and year.
- Sort pickup requests by scheduled date/time, newest or oldest.
- In Demo Mode, the reward redemption section also supports request-ID search, month/year filtering, and newest/oldest sorting.
- The Supabase-backed Admin page supports pickup request search, month/year filters, and sorting through GET query parameters.
- Status tabs preserve the active search and date filters. Reset clears search/date filters while keeping the current status tab.


### V10 UI notes
The Admin search bar accepts partial or complete request IDs (for example `RSK-26021`). Month and year filters apply to the pickup date; date ordering can be switched between newest and oldest. Demo Mode applies equivalent controls to reward-redemption IDs and request dates. The current status tab is retained when switching status; Reset clears the search and date criteria.


## Supabase Project Configuration (V11)

The local `.env.local` file has been prefilled with the Supabase Project URL and Publishable Key supplied by the project owner. It also retains the RE-SKIN Admin WhatsApp number.

**Current state:** Supabase credentials are configured locally, schema V12 has been executed, the member profile trigger has been verified, and separate member/admin accounts exist. The project is now configured for live Supabase mode (`RE_SKIN_DEMO_MODE=false`).

### Live integration steps
1. Run `supabase/migrations/20261119_live_member_notifications.sql` once in Supabase SQL Editor so new pickup, redemption, and account-deletion requests also notify the member who submitted them.
2. Restart Next.js after confirming `.env.local` contains `RE_SKIN_DEMO_MODE=false`.
3. Sign in with the member account and confirm that `/dashboard` shows live data.
4. Sign in with the admin account and confirm that `/admin` shows live operational data.
5. Configure reward prices and stock in Supabase Table Editor → `rewards` before enabling any reward.
6. Add the same public Supabase URL, Publishable Key, admin WhatsApp number, and `RE_SKIN_DEMO_MODE=false` to Vercel Environment Variables before deploying.

Do not commit `.env.local`. Do not add a Supabase Secret key or `service_role` key to any `NEXT_PUBLIC_` variable.


## Supabase Database Schema V12

The previous starter schema has been expanded to include:
- `rewards` catalogue with deliberately inactive seed entries until exact point cost and stock are set by an admin.
- `redemption_requests` with point reservation, approval/rejection, fulfillment instructions, and member receipt confirmation.
- `account_deletion_requests` with an explicit review stage (approval does not automatically delete an Auth user).
- `notifications` with database triggers for new pickup, pickup status, new redemption, redemption status, and account-deletion events.
- Human-readable request codes for pickup (`RSK-...`), reward redemption (`RDM-...`), and account deletion (`DEL-...`).
- Row Level Security and narrowly scoped RPC permissions.

See `supabase/SETUP-SUPABASE.md` and `LIVE-SUPABASE-QUICKSTART.md` for the setup and testing sequence. The live dashboard uses Supabase Auth, RLS-protected queries, server actions, RPC transactions, and real-time notifications.


## Perbaikan V14: pengajuan pickup dari Member Area

Tombol **Ajukan Pickup** pada dashboard member sekarang membuka halaman khusus `/dashboard/pickup`, bukan kembali ke landing page. Formulir menyimpan pengajuan melalui RPC `submit_pickup_request`, mengisi catatan hanya jika member mengetiknya, menampilkan nomor pengajuan, dan membuka WhatsApp Admin dengan ringkasan untuk dikirim manual. Tidak ada perubahan SQL/migrasi untuk perbaikan navigasi ini.


## Notification UX — V15
- Notification clicks deep-link to the exact pickup, reward redemption, or account deletion card.
- Opening an unread notification marks it as read; **Tandai dibaca** marks all unread notifications and updates the badge.
- Notification history is retained in Supabase and grouped as **Aktivitas** or **Pembaruan status**.
- The notification panel shows the latest 100 entries with filters for all, activity, and status updates.
- Run `supabase/migrations/20261119_notification-deep-links-history.sql` once after the V12 schema and live-member notification patch.

## Autentikasi Email RE-SKIN (V22)

RE-SKIN menggunakan Supabase Auth dengan satu metode autentikasi: **Email + Password**. Tab Masuk dan Buat Akun dipisahkan. Pendaftaran meminta nama lengkap, email, password, dan pilihan avatar. Setelah mendaftar, Supabase mengirim email konfirmasi; anggota harus mengeklik tautan verifikasi sebelum login. Login menggunakan email dan password. Fitur Lupa Password juga menggunakan email pemulihan Supabase.

Tidak ada Google OAuth, OTP login, atau Magic Link login. Gunakan template bawaan Confirm Signup Supabase; tidak perlu mengubah template email atau upgrade paket untuk alur standar. Ikuti `supabase/EMAIL-PASSWORD-SETUP.md` untuk konfigurasi provider Email, konfirmasi email, dan URL callback. Jalankan migration `supabase/migrations/20261119_member_auth_profile.sql` jika belum menjalankan migration profil gabungan.

Pemberitahuan penggunaan data tersedia di `src/app/kebijakan-privasi/page.tsx` dan pada form pendaftaran. Data yang diminta meliputi nama, email, pilihan jenis kelamin/avatar, nomor WhatsApp, alamat pickup, serta riwayat pengajuan, verifikasi, SKINPoint, hadiah, dan notifikasi. Data digunakan untuk menjalankan layanan RE-SKIN dan tidak dijual atau digunakan untuk iklan.


## Live landing-page statistics

The landing page reads three aggregate counters from `public.landing_stats`: verified packages from completed pickups, member profiles, and gross approved earned SKINPoint. Database triggers recalculate the aggregate row when profiles, pickup requests, or point transactions change. The aggregate-only row is readable by `anon` and `authenticated`; source tables remain protected by their existing RLS policies. Supabase Realtime pushes updates to the landing page, with a 30-second refresh as a fallback.

For an existing Supabase project, run `supabase/migrations/20261120_public_landing_stats.sql` once in SQL Editor. For a new project, the same table and trigger setup is included in `supabase/schema.sql`.
