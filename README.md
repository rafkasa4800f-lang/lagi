# Buku Tulis API

API sederhana untuk generate teks bergaya tulisan tangan di atas gambar buku kosongan (seperti foto to-do list bergaris). Deploy di Vercel, kode disimpan di GitHub.

## Struktur folder

```
buku-tulis-api/
├── api/
│   └── generate.js      <- endpoint utama
├── public/
│   ├── index.html        <- demo web sederhana
│   └── book-blank.jpg    <- GANTI dengan foto buku kosongan kamu (WAJIB)
├── fonts/
│   └── Caveat.ttf         <- font tulisan tangan (sudah disediakan)
├── package.json
├── vercel.json
└── README.md
```

## Langkah pakai

### 1. Gambar buku kosongan
Sudah ada 2 pilihan, keduanya sudah dikalibrasi PAS ke garisnya masing-masing:
- `public/book-blank.jpg` → **canvas 1**
- `public/book-blank-2.jpg` → **canvas 2**

Pilih salah satu lewat parameter `canvas` (`1` atau `2`) saat request. Kalau nanti mau tambah buku ketiga, tambahkan filenya di `public/`, lalu tambahkan preset barunya di objek `CANVAS_PRESETS` pada `api/generate.js` (ukur posisi garis dulu seperti sebelumnya).

### 2. Push ke GitHub

```bash
cd buku-tulis-api
git init
git add .
git commit -m "init: buku tulis api"
git branch -M main
git remote add origin https://github.com/USERNAME/buku-tulis-api.git
git push -u origin main
```

### 3. Deploy ke Vercel
1. Buka https://vercel.com/new
2. Import repo GitHub `buku-tulis-api`
3. Framework preset: pilih **Other** (bukan Next.js)
4. Klik **Deploy**

Setelah selesai kamu akan dapat URL seperti `https://buku-tulis-api.vercel.app`.

### 4. Pakai API-nya

**Endpoint:** `POST /api/generate`

Kirim JSON body:

```json
{
  "text": "opik yang foto in coba lagi nanti\nbaris kedua\nbaris ketiga",
  "canvas": 1
}
```

Field lain (`startX`, `startY`, `lineHeight`, dst) opsional — kalau tidak dikirim, otomatis pakai default sesuai `canvas` yang dipilih.

**Cara enter/pindah baris:** cukup pakai `\n` di dalam string `text`. Kalau kamu kirim dari form textarea HTML, Enter yang ditekan user otomatis jadi karakter `\n` — tidak perlu diubah manual.

Contoh pakai `curl`:

```bash
curl -X POST https://buku-tulis-api.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"text":"Baris satu\nBaris dua\nBaris tiga"}' \
  --output hasil.png
```

Response: gambar PNG langsung (bukan base64), bisa dipakai langsung di `<img src="...">` atau disimpan sebagai file.

### 5. Coba lewat browser
Buka `https://buku-tulis-api.vercel.app/` — ada textarea untuk nulis dan tombol Generate, tekan Enter di textarea untuk pindah baris seperti biasa.

## Parameter yang bisa diatur

| Parameter | Default | Keterangan |
|---|---|---|
| `canvas` | `1` | Pilih buku kosongan: `1` (book-blank.jpg) atau `2` (book-blank-2.jpg) |
| `text` | `""` | Teks yang mau ditulis, pisah baris pakai `\n` |
| `imageUrl` | — | Kalau diisi, override gambar background dari canvas manapun |
| `startX` | ikut preset canvas | Posisi awal X (px) dari kiri |
| `startY` | ikut preset canvas | Posisi baseline baris pertama (px dari atas) |
| `lineHeight` | ikut preset canvas | Jarak antar garis buku (px) |
| `fontSize` | ikut preset canvas | Ukuran font |
| `color` | `#1a1a2e` | Warna tinta |
| `maxWidth` | ikut preset canvas | Batas lebar baris dalam PIKSEL sebelum wrap ke baris baru |

**Preset per canvas** (di `api/generate.js`, objek `CANVAS_PRESETS`):

| Canvas | startX | startY | lineHeight | fontSize | maxWidth |
|---|---|---|---|---|---|
| 1 | 108 | 95.5 | 26.6 | 20 | 542 |
| 2 | 100 | 92 | 34.3 | 26 | 650 |

Nilai-nilai ini sudah dikalibrasi dari pengukuran piksel foto masing-masing. Kalau ganti/tambah foto buku lain, ukur ulang jaraknya dan update presetnya.

## Catatan teknis
- Pakai `@napi-rs/canvas` (bukan `node-canvas`/`canvas`) karena sudah punya native binary siap pakai untuk lingkungan serverless Vercel, tidak perlu install `cairo` manual.
- Font default: **Caveat** (Google Fonts, lisensi OFL, bebas dipakai). Bisa ganti font lain di folder `fonts/` lalu update path di `api/generate.js`.
