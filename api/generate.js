const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

// Daftarkan font tulisan tangan sekali saja (cold start)
const fontPath = path.join(process.cwd(), 'fonts', 'Caveat.ttf');
GlobalFonts.registerFromPath(fontPath, 'Handwriting');

// Preset kalibrasi untuk tiap opsi canvas (posisi garis sudah diukur dari foto asli masing-masing)
const CANVAS_PRESETS = {
  1: {
    file: path.join(process.cwd(), 'public', 'book-blank.jpg'),
    startX: 108,
    startY: 95.5,
    lineHeight: 26.6,
    fontSize: 20,
    maxWidth: 542,
  },
  2: {
    file: path.join(process.cwd(), 'public', 'book-blank-2.jpg'),
    startX: 100,
    startY: 92,
    lineHeight: 34.3,
    fontSize: 26,
    maxWidth: 650,
  },
};

// Pecah teks jadi baris berdasarkan \n, lalu wrap berdasarkan LEBAR PIKSEL asli
// (bukan jumlah karakter) supaya tiap baris konsisten mepet ke ujung kanan garis.
function wrapTextByWidth(ctx, text, maxWidth) {
  const paragraphs = String(text ?? '').split('\n'); // <-- ini bagian "enter pakai \n"
  const lines = [];

  for (const para of paragraphs) {
    if (para === '') {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let cur = '';
    for (const w of words) {
      const candidate = cur ? cur + ' ' + w : w;
      if (ctx.measureText(candidate).width > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    res.status(200).json({
      usage: 'POST JSON ke endpoint ini',
      body_contoh: {
        text: 'Baris pertama\\nBaris kedua\\nBaris ketiga',
        canvas: '1 atau 2 (default 1), pilih buku kosongan mana yang dipakai',
        catatan: 'startX/startY/lineHeight/fontSize/maxWidth sudah punya default per canvas, tidak wajib dikirim'
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
      canvas: canvasChoice = 1,
      imageUrl,
    } = req.body || {};

    const preset = CANVAS_PRESETS[canvasChoice] || CANVAS_PRESETS[1];

    const {
      startX = preset.startX,
      startY = preset.startY,
      lineHeight = preset.lineHeight,
      fontSize = preset.fontSize,
      color = '#1a1a2e',
      maxWidth = preset.maxWidth,
      rotateJitter = 0.015, // sedikit kemiringan acak biar makin mirip tulisan tangan asli
    } = req.body || {};

    const bgSource = imageUrl || preset.file;
    const image = await loadImage(bgSource);

    const canvasEl = createCanvas(image.width, image.height);
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(image, 0, 0);

    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Handwriting`;
    ctx.textBaseline = 'alphabetic';

    const lines = wrapTextByWidth(ctx, text, maxWidth);

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

    const buffer = canvasEl.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

