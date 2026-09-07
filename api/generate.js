const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

// Daftarkan font tulisan tangan sekali saja (cold start)
const fontPath = path.join(process.cwd(), 'fonts', 'Caveat.ttf');
GlobalFonts.registerFromPath(fontPath, 'Handwriting');

// Pecah teks jadi baris-baris berdasarkan \n DAN auto-wrap kalau kepanjangan
function buildLines(text, maxCharsPerLine) {
  const rawLines = String(text ?? '').split('\n'); // <-- ini bagian "enter pakai \n"
  const result = [];

  for (const raw of rawLines) {
    if (raw.length <= maxCharsPerLine) {
      result.push(raw);
      continue;
    }
    // auto-wrap per kata kalau satu baris kepanjangan untuk lebar buku
    const words = raw.split(' ');
    let cur = '';
    for (const w of words) {
      const candidate = cur ? cur + ' ' + w : w;
      if (candidate.length > maxCharsPerLine) {
        if (cur) result.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    result.push(cur);
  }
  return result;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    res.status(200).json({
      usage: 'POST JSON ke endpoint ini',
      body_contoh: {
        text: 'Baris pertama\\nBaris kedua\\nBaris ketiga',
        catatan: 'startX/startY/lineHeight/fontSize sudah punya default yang pas untuk book-blank.jpg, tidak wajib dikirim'
      }
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed, pakai POST atau GET untuk lihat contoh.' });
    return;
  }

  try {
    const {
      text = '',
      imageUrl,
      // Default sudah dikalibrasi PAS ke garis buku di public/book-blank.jpg (720x1098px)
      startX = 108,
      startY = 95.5,
      lineHeight = 26.6,
      fontSize = 20,
      color = '#1a1a2e',
      maxCharsPerLine = 48,
      rotateJitter = 0.015, // sedikit kemiringan acak biar makin mirip tulisan tangan asli
    } = req.body || {};

    const bgSource = imageUrl || path.join(process.cwd(), 'public', 'book-blank.jpg');
    const image = await loadImage(bgSource);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Handwriting`;
    ctx.textBaseline = 'alphabetic';

    const lines = buildLines(text, maxCharsPerLine);

    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      if (!line) return; // baris kosong dari \n\n cukup dilewati (jadi spasi baris)

      if (rotateJitter > 0) {
        const angle = (Math.random() * 2 - 1) * rotateJitter;
        ctx.save();
        ctx.translate(startX, y);
        ctx.rotate(angle);
        ctx.fillText(line, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(line, startX, y);
      }
    });

    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
