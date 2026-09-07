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
Sudah disiapkan di `public/book-blank.jpg` (720x1098px) dan posisi default (`startX`, `startY`, `lineHeight`) sudah dikalibrasi PAS ke garis-garis di gambar itu. Kalau nanti ganti dengan foto buku lain yang ukuran/posisi garisnya beda, ukur ulang koordinatnya dan update default di `api/generate.js`.

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
  "text": "opik yang foto in coba lagi nanti\nbaris kedua\nbaris ketiga"
}
```

Field lain (`startX`, `startY`, `lineHeight`, dst) opsional — kalau tidak dikirim, otomatis pakai default yang sudah pas untuk `book-blank.jpg`.

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
| `text` | `""` | Teks yang mau ditulis, pisah baris pakai `\n` |
| `imageUrl` | pakai `public/book-blank.jpg` | Bisa pakai gambar dari URL lain kalau mau |
| `startX` | `108` | Posisi awal X (px) dari kiri, sudah pas setelah kotak checkbox |
| `startY` | `95.5` | Posisi baseline baris pertama (px dari atas), pas nempel di garis pertama |
| `lineHeight` | `26.6` | Jarak antar garis buku (px), diukur langsung dari foto asli |
| `fontSize` | `20` | Ukuran font |
| `color` | `#1a1a2e` | Warna tinta |
| `maxCharsPerLine` | `48` | Auto-wrap kalau satu baris kepanjangan untuk lebar buku |

Nilai di atas sudah dikalibrasi dari pengukuran piksel foto `book-blank.jpg` (garis-garis berjarak konsisten ~26.6px). Kalau ganti foto buku lain, ukur ulang jaraknya.

## Catatan teknis
- Pakai `@napi-rs/canvas` (bukan `node-canvas`/`canvas`) karena sudah punya native binary siap pakai untuk lingkungan serverless Vercel, tidak perlu install `cairo` manual.
- Font default: **Caveat** (Google Fonts, lisensi OFL, bebas dipakai). Bisa ganti font lain di folder `fonts/` lalu update path di `api/generate.js`.
