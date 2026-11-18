# Dawning Project — Kantor Virtual 3D & Dashboard Owner

Simulasi kantor virtual 3D interaktif berbasis **React + TypeScript + Three.js (Vite)** untuk agensi **Social Media, Digital Marketing, AI Creator & Entertainment**.

## Fitur Utama Dawning Project
- **Dashboard Owner ("Dawning Project")** multi-tab lengkap:
  1. **Meja ACC Owner**: Tinjau, ACC, minta revisi dengan catatan, atau kirim instruksi/perintah baru ke CEO, Manajer, dan 8 Divisi.
  2. **Analytics & KPI**: Pantau total views mingguan, revenue AdSense & brand deal, performa platform (YouTube, TikTok, IG Reels), serta efisiensi AI.
  3. **Content Pipeline**: Tracker produksi konten lintas 8 divisi dari Riset hingga Marketing & Ads.
  4. **Keuangan & AI Stack**: Kontrol budget Ads, status langganan AI tools (Midjourney, ComfyUI, ElevenLabs, Runway, LLM), dan pencairan bonus kru.
  5. **Studio Control & Megafon Owner**: Kirim pengumuman real-time ke seluruh ruang kantor 3D, atur mode siang/malam, dan kontrol mode kerja/istirahat.
- **Struktur Kantor 3D**:
  - Ruangan Owner (`Arkan`), Ruang CEO (`Revan Wijaya`) & Manajer (`Nadia Larasati`), Lobby Mission Board, 8 Divisi Spesialis (32 Agen), serta fasilitas istirahat (Kantin, Kolam Renang, Ruang Badminton Indoor).

## Cara Menjalankan di Lokal
```bash
npm install
npm run dev
```

## Cara Deploy Online (Gratis)
- **Vercel**: Push ke GitHub lalu import ke [vercel.com](https://vercel.com) (otomatis terdeteksi via `vercel.json`).
- **Netlify Drop**: Jalankan `npm run build`, lalu drag-and-drop folder `dist/` ke [app.netlify.com/drop](https://app.netlify.com/drop).
