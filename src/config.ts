/**
 * Konfigurasi Dawning Project · Kantor Virtual 3D & Dashboard Owner:
 * - Dashboard Owner khusus bernama "Dawning Project" (Owner: Arkan)
 * - Sistem persetujuan wajib (ACC Owner) sebelum CEO, Manajer & 8 Divisi mengeksekusi tugas
 * - 8 Divisi Produksi & Growth (32 Agen) + Fasilitas Istirahat (Kantin, Kolam Renang, Badminton)
 */

import laporanAgen from './laporan.json';
import type { GayaId } from './gaya/daftar';

export const KANTOR = {
  nama: 'Dawning Project',
  subjudul: 'Dashboard Owner · CEO & Manajer · 8 Divisi Sosmed & AI Creator',
};

export const GAYA: GayaId = 'pixelhuman';
export const TAMPIL_PEMILIH_GAYA = true;

export const RUANGAN = [
  { key: 'owner', label: 'Ruangan Owner · Dawning Project', x0: -15.2, x1: -7.6, z0: -13.6, z1: -8.6, warna: '#ebd8bd', karpet: '#d4af37', jenis: 'owner' },
  { key: 'manajemen', label: 'Ruang CEO & Manajer', x0: -6.8, x1: -0.4, z0: -13.6, z1: -8.6, warna: '#e6e4f2', karpet: '#6366f1', jenis: 'manajemen' },
  { key: 'briefing', label: 'Lobby & Mission Board', x0: 0.4, x1: 5.6, z0: -13.6, z1: -8.6, warna: '#f2e8da', karpet: '#8b5cf6', jenis: 'fasilitas' },
  { key: 'badminton', label: 'Ruang Badminton', x0: 6.4, x1: 15.2, z0: -13.6, z1: -8.6, warna: '#2d8a68', karpet: '#1f6f52', jenis: 'fasilitas' },

  { key: 'riset', label: 'Divisi Riset, Ide & Dev', x0: -15.2, x1: -7.9, z0: -7.8, z1: -2.0, warna: '#ead9c3', karpet: '#e4572e', jenis: 'divisi' },
  { key: 'content', label: 'Divisi Content', x0: -7.3, x1: -0.3, z0: -7.8, z1: -2.0, warna: '#f5e4ec', karpet: '#ec4899', jenis: 'divisi' },
  { key: 'scripting', label: 'Divisi Scripting', x0: 0.3, x1: 7.3, z0: -7.8, z1: -2.0, warna: '#f0e4d0', karpet: '#eab308', jenis: 'divisi' },
  { key: 'visualizing', label: 'Divisi Visualizing', x0: 7.9, x1: 15.2, z0: -7.8, z1: -2.0, warna: '#e3ecf5', karpet: '#3b82f6', jenis: 'divisi' },

  { key: 'voiceover', label: 'Divisi Voice Over', x0: -15.2, x1: -7.9, z0: -1.0, z1: 4.8, warna: '#ebe3f5', karpet: '#8b5cf6', jenis: 'divisi' },
  { key: 'editing', label: 'Divisi Editing', x0: -7.3, x1: -0.3, z0: -1.0, z1: 4.8, warna: '#e4d8c8', karpet: '#14b8a6', jenis: 'divisi' },
  { key: 'upload', label: 'Divisi Upload', x0: 0.3, x1: 7.3, z0: -1.0, z1: 4.8, warna: '#e6efe6', karpet: '#22c55e', jenis: 'divisi' },
  { key: 'marketing', label: 'Divisi Marketing', x0: 7.9, x1: 15.2, z0: -1.0, z1: 4.8, warna: '#f6e4dc', karpet: '#f43f5e', jenis: 'divisi' },

  { key: 'kantin', label: 'Kantin & Kafe', x0: -15.2, x1: -2.6, z0: 5.6, z1: 11.4, warna: '#f6e7d8', karpet: '#d97706', jenis: 'fasilitas' },
  { key: 'kolam', label: 'Kolam Renang & Santai', x0: -1.8, x1: 15.2, z0: 5.6, z1: 11.4, warna: '#eadbc8', karpet: '#0284c7', jenis: 'fasilitas' },
] as const;

export type RoomKey = (typeof RUANGAN)[number]['key'];
export type DivisiKey = 'riset' | 'content' | 'scripting' | 'visualizing' | 'voiceover' | 'editing' | 'upload' | 'marketing';
export type LaporanUnitKey = 'manajemen' | DivisiKey;

export interface Agen {
  key: string;
  nama: string;
  tugas: string;
  ruang: RoomKey;
  role: 'owner' | 'ceo' | 'manager' | 'lead' | 'staff';
  warna: string;
  x: number;
  z: number;
}

export const AGEN: Agen[] = [
  // OWNER & EKSEKUTIF
  { key: 'arkan', nama: 'Arkan', tugas: 'Owner Dawning Project · Pemegang Keputusan Final (ACC)', ruang: 'owner', role: 'owner', warna: '#1e293b', x: -11.4, z: -12.0 },
  { key: 'revan', nama: 'Revan Wijaya', tugas: 'CEO · Strategi Agensi & Brand Vision', ruang: 'manajemen', role: 'ceo', warna: '#4f46e5', x: -5.0, z: -11.8 },
  { key: 'nadia_mgr', nama: 'Nadia Larasati', tugas: 'Manajer · Pipeline Produksi & QC Tim', ruang: 'manajemen', role: 'manager', warna: '#7c3aed', x: -2.2, z: -11.8 },

  // 1. Divisi Riset, Ide & Pengembangan
  { key: 'raka', nama: 'Raka Pratama', tugas: 'Kadiv Riset · Tren Viral & R&D AI', ruang: 'riset', role: 'lead', warna: '#e4572e', x: -13.3, z: -6.25 },
  { key: 'alya', nama: 'Alya Rahmawati', tugas: 'Riset · Analisis Algoritma & Kompetitor', ruang: 'riset', role: 'staff', warna: '#f26a4b', x: -9.8, z: -6.25 },
  { key: 'fajar', nama: 'Fajar Nugroho', tugas: 'Pengembangan · AI Workflow & Tools', ruang: 'riset', role: 'staff', warna: '#d64526', x: -13.3, z: -4.15 },
  { key: 'dimas', nama: 'Dimas Saputra', tugas: 'Ideation · Konsep Show & Hook Viral', ruang: 'riset', role: 'staff', warna: '#ff7b54', x: -9.8, z: -4.15 },

  // 2. Divisi Content
  { key: 'sekar', nama: 'Sekar Ayuningtyas', tugas: 'Kadiv Content · Pilar Konten & Entertainment', ruang: 'content', role: 'lead', warna: '#ec4899', x: -5.55, z: -6.25 },
  { key: 'bima', nama: 'Bima Sena', tugas: 'AI Creator · Virtual Persona & Karakter', ruang: 'content', role: 'staff', warna: '#f472b6', x: -2.05, z: -6.25 },
  { key: 'maya', nama: 'Maya Sari', tugas: 'Content · Kurasi Format Reels & TikTok', ruang: 'content', role: 'staff', warna: '#db2777', x: -5.55, z: -4.15 },
  { key: 'tari', nama: 'Tari Melati', tugas: 'Content · Series YouTube & Interaktif', ruang: 'content', role: 'staff', warna: '#be185d', x: -2.05, z: -4.15 },

  // 3. Divisi Scripting
  { key: 'damar', nama: 'Damar Kusuma', tugas: 'Kadiv Scripting · Storytelling & Naskah', ruang: 'scripting', role: 'lead', warna: '#eab308', x: 2.05, z: -6.25 },
  { key: 'vina', nama: 'Vina Maharani', tugas: 'Scriptwriter · Hook 3 Detik & Short Video', ruang: 'scripting', role: 'staff', warna: '#f59e0b', x: 5.55, z: -6.25 },
  { key: 'galih', nama: 'Galih Permana', tugas: 'Scriptwriter · Naskah Podcast & Dokumenter', ruang: 'scripting', role: 'staff', warna: '#d97706', x: 2.05, z: -4.15 },
  { key: 'citra', nama: 'Citra Lestari', tugas: 'Copywriter · Caption, CTA & Ad Script', ruang: 'scripting', role: 'staff', warna: '#ca8a04', x: 5.55, z: -4.15 },

  // 4. Divisi Visualizing
  { key: 'kevin', nama: 'Kevin Halim', tugas: 'Kadiv Visualizing · Art Director & AI Visual', ruang: 'visualizing', role: 'lead', warna: '#3b82f6', x: 9.8, z: -6.25 },
  { key: 'intan', nama: 'Intan Permata', tugas: 'AI Artist · Midjourney & ComfyUI Visual', ruang: 'visualizing', role: 'staff', warna: '#60a5fa', x: 13.3, z: -6.25 },
  { key: 'rendi', nama: 'Rendi Wijaya', tugas: '3D Artist · Avatar & Set Virtual', ruang: 'visualizing', role: 'staff', warna: '#2563eb', x: 9.8, z: -4.15 },
  { key: 'salsa', nama: 'Salsa Nabila', tugas: 'Designer · Thumbnail CTR Tinggi & Grafis', ruang: 'visualizing', role: 'staff', warna: '#0284c7', x: 13.3, z: -4.15 },

  // 5. Divisi Voice Over
  { key: 'melodi', nama: 'Melodi Putri', tugas: 'Kadiv Voice Over · Voice Director & Dubbing', ruang: 'voiceover', role: 'lead', warna: '#8b5cf6', x: -13.3, z: 0.55 },
  { key: 'arif', nama: 'Arif Rahman', tugas: 'Voice Talent · Narator & Karakter Animasi', ruang: 'voiceover', role: 'staff', warna: '#a78bfa', x: -9.8, z: 0.55 },
  { key: 'nisa', nama: 'Nisa Amelia', tugas: 'AI Voice · Voice Cloning & Emosi vokal', ruang: 'voiceover', role: 'staff', warna: '#7c3aed', x: -13.3, z: 2.65 },
  { key: 'tio', nama: 'Tio Pratama', tugas: 'Audio Engineer · Mastering & SFX', ruang: 'voiceover', role: 'staff', warna: '#6d28d9', x: -9.8, z: 2.65 },

  // 6. Divisi Editing
  { key: 'bagas', nama: 'Bagas Kurniawan', tugas: 'Kadiv Editing · Lead Editor & Post-Prod', ruang: 'editing', role: 'lead', warna: '#14b8a6', x: -5.55, z: 0.55 },
  { key: 'reza', nama: 'Reza Mahendra', tugas: 'Video Editor · Pacing & Retention Cut', ruang: 'editing', role: 'staff', warna: '#2dd4bf', x: -2.05, z: 0.55 },
  { key: 'gilang', nama: 'Gilang Ramadhan', tugas: 'Motion & VFX · Animasi Teks & Transisi', ruang: 'editing', role: 'staff', warna: '#0d9488', x: -5.55, z: 2.65 },
  { key: 'putri', nama: 'Putri Handayani', tugas: 'Colorist · Color Grading & Visual Finish', ruang: 'editing', role: 'staff', warna: '#0f766e', x: -2.05, z: 2.65 },

  // 7. Divisi Upload
  { key: 'lita', nama: 'Lita Kusuma', tugas: 'Kadiv Upload · Channel & Schedule Ops', ruang: 'upload', role: 'lead', warna: '#22c55e', x: 2.05, z: 0.55 },
  { key: 'hendra', nama: 'Hendra Gunawan', tugas: 'Uploader · YouTube, TikTok & IG Reels', ruang: 'upload', role: 'staff', warna: '#4ade80', x: 5.55, z: 0.55 },
  { key: 'sinta', nama: 'Sinta Dewi', tugas: 'SEO Sosmed · Judul, Tag & A/B Thumbnail', ruang: 'upload', role: 'staff', warna: '#16a34a', x: 2.05, z: 2.65 },
  { key: 'wulan', nama: 'Wulan Anggraini', tugas: 'Distribusi · Cross-Posting & Prime Time', ruang: 'upload', role: 'staff', warna: '#15803d', x: 5.55, z: 2.65 },

  // 8. Divisi Marketing
  { key: 'doni', nama: 'Doni Setiawan', tugas: 'Kadiv Marketing · Digital Growth & Ads', ruang: 'marketing', role: 'lead', warna: '#f43f5e', x: 9.8, z: 0.55 },
  { key: 'clarissa', nama: 'Clarissa Tan', tugas: 'Partnership · Brand Deal, Sponsor & KOL', ruang: 'marketing', role: 'staff', warna: '#fb7185', x: 13.3, z: 0.55 },
  { key: 'ilham', nama: 'Ilham Fauzi', tugas: 'Performance Ads · Meta, TikTok & YT Ads', ruang: 'marketing', role: 'staff', warna: '#e11d48', x: 9.8, z: 2.65 },
  { key: 'keisha', nama: 'Keisha Nabila', tugas: 'Growth Analyst · Funnel & Monetisasi', ruang: 'marketing', role: 'staff', warna: '#be123c', x: 13.3, z: 2.65 },
];

export type StatusAcc = 'menunggu_acc' | 'di_acc' | 'revisi';

export interface KeputusanDivisi {
  id: string;
  divisi: LaporanUnitKey;
  divisiLabel: string;
  pelaporKey: string;
  pelaporNama: string;
  warna: string;
  judul: string;
  ringkasan: string;
  estimasiBiaya: string;
  targetImpact: string;
  mendesak?: boolean;
  status: StatusAcc;
  catatanRevisi?: string;
}

export const KEPUTUSAN_AWAL: KeputusanDivisi[] = [
  {
    id: 'acc-manajemen-1',
    divisi: 'manajemen',
    divisiLabel: 'CEO & Manajer',
    pelaporKey: 'revan',
    pelaporNama: 'Revan (CEO) & Nadia (Manajer)',
    warna: '#4f46e5',
    judul: 'ACC Target 24 Konten Viral & KPI Dawning Project Minggu Ini',
    ringkasan: 'Roadmap produksi lintas 8 divisi & alokasi kru siap dijalankan setelah ACC Owner.',
    estimasiBiaya: 'Rp 12.500.000',
    targetImpact: '+3.5M Views',
    mendesak: true,
    status: 'menunggu_acc',
  },
  {
    id: 'acc-riset-1',
    divisi: 'riset',
    divisiLabel: 'Riset, Ide & Dev',
    pelaporKey: 'raka',
    pelaporNama: 'Raka Pratama',
    warna: '#e4572e',
    judul: 'ACC 5 Ide Topik Viral AI & Update Workflow Otomasi',
    ringkasan: 'Hasil riset tren TikTok/YouTube & pipeline AI terbaru siap diturunkan ke tim.',
    estimasiBiaya: 'Rp 1.800.000',
    targetImpact: 'CTR +4.2%',
    status: 'menunggu_acc',
  },
  {
    id: 'acc-content-1',
    divisi: 'content',
    divisiLabel: 'Divisi Content',
    pelaporKey: 'sekar',
    pelaporNama: 'Sekar Ayuningtyas',
    warna: '#ec4899',
    judul: 'ACC Konsep Series AI Creator & Format Entertainment Baru',
    ringkasan: 'Karakter virtual & format episodik siap masuk tahap penulisan naskah.',
    estimasiBiaya: 'Rp 3.200.000',
    targetImpact: '6 Episode',
    status: 'menunggu_acc',
  },
  {
    id: 'acc-scripting-1',
    divisi: 'scripting',
    divisiLabel: 'Divisi Scripting',
    pelaporKey: 'damar',
    pelaporNama: 'Damar Kusuma',
    warna: '#eab308',
    judul: 'ACC 7 Naskah Utama, Hook 3 Detik & Copy Campaign',
    ringkasan: 'Draf naskah short-form dan YouTube siap diserahkan ke Visualizing & Voice Over.',
    estimasiBiaya: 'Rp 950.000',
    targetImpact: 'Retensi >72%',
    status: 'menunggu_acc',
  },
  {
    id: 'acc-visualizing-1',
    divisi: 'visualizing',
    divisiLabel: 'Divisi Visualizing',
    pelaporKey: 'kevin',
    pelaporNama: 'Kevin Halim',
    warna: '#3b82f6',
    judul: 'ACC Style Visual AI Art, Avatar 3D & Desain Thumbnail',
    ringkasan: 'Moodboard visual & 3 varian thumbnail CTR tinggi menunggu persetujuan Owner.',
    estimasiBiaya: 'Rp 4.500.000',
    targetImpact: 'CTR >11.5%',
    status: 'menunggu_acc',
  },
  {
    id: 'acc-voiceover-1',
    divisi: 'voiceover',
    divisiLabel: 'Divisi Voice Over',
    pelaporKey: 'melodi',
    pelaporNama: 'Melodi Putri',
    warna: '#8b5cf6',
    judul: 'ACC Karakter Suara Narator & Preset AI Voice Cloning',
    ringkasan: 'Sampel rekaman studio & tone emosi vokal siap diproduksi massal.',
    estimasiBiaya: 'Rp 2.100.000',
    targetImpact: '4 Bahasa',
    status: 'menunggu_acc',
  },
  {
    id: 'acc-editing-1',
    divisi: 'editing',
    divisiLabel: 'Divisi Editing',
    pelaporKey: 'bagas',
    pelaporNama: 'Bagas Kurniawan',
    warna: '#14b8a6',
    judul: 'ACC Template Motion Graphics, Pacing Cut & Color LUT',
    ringkasan: 'Standar editing retensi tinggi siap diterapkan ke seluruh video episode minggu ini.',
    estimasiBiaya: 'Rp 1.500.000',
    targetImpact: '2x Cepat Render',
    status: 'menunggu_acc',
  },
  {
    id: 'acc-upload-1',
    divisi: 'upload',
    divisiLabel: 'Divisi Upload',
    pelaporKey: 'lita',
    pelaporNama: 'Lita Kusuma',
    warna: '#22c55e',
    judul: 'ACC Jadwal Tayang Prime-Time YouTube, TikTok & IG Reels',
    ringkasan: 'Slot rilis pukul 17.00 & 19.30 beserta metadata SEO siap dijadwalkan.',
    estimasiBiaya: 'Rp 600.000',
    targetImpact: '24 Slot Rilis',
    status: 'menunggu_acc',
  },
  {
    id: 'acc-marketing-1',
    divisi: 'marketing',
    divisiLabel: 'Divisi Marketing',
    pelaporKey: 'doni',
    pelaporNama: 'Doni Setiawan',
    warna: '#f43f5e',
    judul: 'ACC Budget Boost Ads & Kontrak Endorsement Brand',
    ringkasan: 'Kampanye akuisisi & 2 kesepakatan sponsor menunggu tanda tangan ACC Owner.',
    estimasiBiaya: 'Rp 18.000.000',
    targetImpact: 'ROAS 4.8x',
    mendesak: true,
    status: 'menunggu_acc',
  },
];

export interface ProyekKonten {
  id: string;
  judul: string;
  platform: 'YouTube' | 'TikTok' | 'IG Reels' | 'Multi-Platform';
  divisiAktif: DivisiKey;
  progress: number;
  pic: string;
  deadline: string;
  prioritas: 'Tinggi' | 'Normal';
}

export const PIPELINE_KONTEN_AWAL: ProyekKonten[] = [
  {
    id: 'cnt-1',
    judul: 'AI Documentary: Masa Depan Kreator Digital 2027',
    platform: 'YouTube',
    divisiAktif: 'editing',
    progress: 78,
    pic: 'Bagas Kurniawan',
    deadline: 'Hari ini · 19.00',
    prioritas: 'Tinggi',
  },
  {
    id: 'cnt-2',
    judul: 'Short Series: Detektif Cyber Jakarta (Eps. 4)',
    platform: 'TikTok',
    divisiAktif: 'voiceover',
    progress: 62,
    pic: 'Melodi Putri',
    deadline: 'Besok · 17.00',
    prioritas: 'Tinggi',
  },
  {
    id: 'cnt-3',
    judul: 'Kampanye Sponsor TechX AI Smartphone',
    platform: 'IG Reels',
    divisiAktif: 'visualizing',
    progress: 45,
    pic: 'Kevin Halim',
    deadline: 'Kamis · 18.30',
    prioritas: 'Tinggi',
  },
  {
    id: 'cnt-4',
    judul: 'Breakdown 10 Prompt AI Sinematik Tanpa GPU Mahal',
    platform: 'Multi-Platform',
    divisiAktif: 'scripting',
    progress: 35,
    pic: 'Damar Kusuma',
    deadline: 'Jumat · 19.30',
    prioritas: 'Normal',
  },
  {
    id: 'cnt-5',
    judul: 'Boost Campaign Viral Challenge #DawningAI',
    platform: 'TikTok',
    divisiAktif: 'marketing',
    progress: 90,
    pic: 'Doni Setiawan',
    deadline: 'Siap Tayang',
    prioritas: 'Tinggi',
  },
];

export interface AiToolStack {
  nama: string;
  divisi: string;
  kuota: string;
  persen: number;
  biayaBulan: string;
  status: 'Aktif' | 'Hemat';
}

export const AI_TOOLS_STACK: AiToolStack[] = [
  { nama: 'Midjourney Pro & ComfyUI GPU Cluster', divisi: 'Visualizing', kuota: '1.840 / 2.500 render', persen: 74, biayaBulan: 'Rp 4.200.000', status: 'Aktif' },
  { nama: 'ElevenLabs Enterprise & AI Voice Clone', divisi: 'Voice Over', kuota: '420k / 500k karakter', persen: 84, biayaBulan: 'Rp 2.850.000', status: 'Aktif' },
  { nama: 'Runway Gen-3 & Kling AI Video', divisi: 'Content & Edit', kuota: '6.100 / 10.000 kredit', persen: 61, biayaBulan: 'Rp 3.900.000', status: 'Aktif' },
  { nama: 'Claude / GPT-4o Scripting & Trend Scraper', divisi: 'Riset & Script', kuota: '18.4M token', persen: 46, biayaBulan: 'Rp 2.150.000', status: 'Hemat' },
];

export type Aktivitas = 'kerja' | 'laporan' | 'belajar' | 'istirahat';

export const JADWAL: { agen: string[] | '*'; mulai: string; menit: number; hari: number[]; aktivitas: Aktivitas; label: string }[] = [
  { agen: ['arkan'], mulai: '07:30', menit: 630, hari: [1, 2, 3, 4, 5], aktivitas: 'kerja', label: 'memantau Dawning Project & ACC…' },
  {
    agen: ['revan', 'nadia_mgr', 'raka', 'sekar', 'damar', 'kevin', 'melodi', 'bagas', 'lita', 'doni'],
    mulai: '07:45',
    menit: 95,
    hari: [1, 2, 3, 4, 5],
    aktivitas: 'laporan',
    label: 'lapor ke Ruangan Arkan…',
  },
  { agen: '*', mulai: '09:20', menit: 160, hari: [1, 2, 3, 4, 5], aktivitas: 'kerja', label: 'produksi konten ter-ACC…' },
  { agen: '*', mulai: '12:00', menit: 60, hari: [1, 2, 3, 4, 5], aktivitas: 'istirahat', label: 'istirahat makan & olahraga…' },
  { agen: '*', mulai: '13:00', menit: 160, hari: [1, 2, 3, 4, 5], aktivitas: 'kerja', label: 'eksekusi target divisi…' },
  { agen: '*', mulai: '15:40', menit: 35, hari: [1, 2, 3, 4, 5], aktivitas: 'laporan', label: 'laporan akhir ke Arkan…' },
  { agen: '*', mulai: '16:15', menit: 195, hari: [1, 2, 3, 4, 5], aktivitas: 'istirahat', label: 'selesai kerja · rekreasi santai…' },
  { agen: '*', mulai: '20:00', menit: 120, hari: [1, 2, 3, 4, 5, 6, 7], aktivitas: 'belajar', label: 'riset algoritma & evaluasi…' },
];

export const JAM_KANTOR = { buka: '07:30', tutup: '19:30' };

export interface Laporan {
  ringkasan?: string;
  menunggu?: string[];
  mendesak?: string[];
  angka?: { label: string; nilai: string }[];
}

export const LAPORAN: Record<string, Laporan> = laporanAgen;

export const BABAK = [
  { dari: '07:50', sampai: '09:40', detik: 10, judul: 'Pagi · Laporan CEO, Manajer & 8 Divisi ke Arkan' },
  { dari: '10:00', sampai: '11:50', detik: 10, judul: 'Siang · Produksi Konten, Visual, VO, Editing & Ads' },
  { dari: '16:20', sampai: '18:00', detik: 10, judul: 'Sore · Istirahat Kantin, Kolam Renang & Badminton' },
];
export const RUANGAN = [
  { key: 'owner', label: 'Ruangan Owner · Dawning Project', x0: -15.2, x1: -7.6, z0: -13.6, z1: -8.6, warna: '#ebd8bd', karpet: '#d4af37', jenis: 'owner' },
  { key: 'manajemen', label: 'Ruang CEO & Manajer', x0: -6.8, x1: -0.4, z0: -13.6, z1: -8.6, warna: '#e6e4f2', karpet: '#6366f1', jenis: 'manajemen' },
  
  // Ruang Rapat Utama (Briefing CEO)
  { key: 'ruang_rapat', label: 'Ruang Rapat Utama', x0: 0.4, x1: 7.2, z0: -13.6, z1: -8.6, warna: '#e0e7ff', karpet: '#4f46e5', jenis: 'fasilitas' },
  
  // Mushola / Tempat Sholat & Tenang
  { key: 'tempat_sholat', label: 'Mushola / Tempat Sholat', x0: 7.8, x1: 15.2, z0: -13.6, z1: -8.6, warna: '#d1fae5', karpet: '#059669', jenis: 'fasilitas' },

  { key: 'riset', label: 'Divisi Riset, Ide & Dev', x0: -15.2, x1: -7.9, z0: -7.8, z1: -2.0, warna: '#ead9c3', karpet: '#e4572e', jenis: 'divisi' },
  { key: 'content', label: 'Divisi Content', x0: -7.3, x1: -0.3, z0: -7.8, z1: -2.0, warna: '#f5e4ec', karpet: '#ec4899', jenis: 'divisi' },
  { key: 'scripting', label: 'Divisi Scripting', x0: 0.3, x1: 7.3, z0: -7.8, z1: -2.0, warna: '#f0e4d0', karpet: '#eab308', jenis: 'divisi' },
  { key: 'visualizing', label: 'Divisi Visualizing', x0: 7.9, x1: 15.2, z0: -7.8, z1: -2.0, warna: '#e3ecf5', karpet: '#3b82f6', jenis: 'divisi' },

  { key: 'voiceover', label: 'Divisi Voice Over', x0: -15.2, x1: -7.9, z0: -1.0, z1: 4.8, warna: '#ebe3f5', karpet: '#8b5cf6', jenis: 'divisi' },
  { key: 'editing', label: 'Divisi Editing', x0: -7.3, x1: -0.3, z0: -1.0, z1: 4.8, warna: '#e4d8c8', karpet: '#14b8a6', jenis: 'divisi' },
  { key: 'upload', label: 'Divisi Upload', x0: 0.3, x1: 7.3, z0: -1.0, z1: 4.8, warna: '#e6efe6', karpet: '#22c55e', jenis: 'divisi' },
  { key: 'marketing', label: 'Divisi Marketing', x0: 7.9, x1: 15.2, z0: -1.0, z1: 4.8, warna: '#f6e4dc', karpet: '#f43f5e', jenis: 'divisi' },

  { key: 'kantin', label: 'Kantin & Kafe', x0: -15.2, x1: -2.6, z0: 5.6, z1: 11.4, warna: '#f6e7d8', karpet: '#d97706', jenis: 'fasilitas' },
  { key: 'kolam', label: 'Kolam Renang & Santai', x0: -1.8, x1: 15.2, z0: 5.6, z1: 11.4, warna: '#eadbc8', karpet: '#0284c7', jenis: 'fasilitas' },
] as const;

