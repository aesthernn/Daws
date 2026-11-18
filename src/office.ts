/** Logika kantor Dawning Project: jadwal, sistem laporan CEO/Manajer/8 Divisi & ACC Arkan, serta area istirahat pasca-kerja. */
import {
  AGEN,
  BABAK,
  JADWAL,
  JAM_KANTOR,
  LAPORAN,
  type Agen,
  type KeputusanDivisi,
  type LaporanUnitKey,
  type RoomKey,
} from './config';

export type Activity = 'kerja' | 'laporan' | 'belajar' | 'istirahat' | 'siaga' | 'pulang';
export type OfficeMode = 'auto' | 'laporan' | 'kerja' | 'istirahat';

export interface Doing {
  activity: Activity;
  label: string;
}
export interface Desk {
  key: string;
  room: RoomKey;
  color: string;
  x: number;
  z: number;
}
export interface DeskState {
  desk: Desk;
  agen: Agen;
  doing: Doing;
  bubble: string | null;
  waiting: string[];
  urgent: string[];
  needsAcc: boolean;
  approved: boolean;
}

export const toMin = (hm: string) => {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const isoDay = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay());

export function agentDoing(key: string, hari: number, time: string, selaluKerja = false): Doing {
  const wd = selaluKerja && hari > 5 ? 4 : hari;
  const t = toMin(time);
  for (const j of JADWAL) {
    if (j.agen !== '*' && !j.agen.includes(key)) continue;
    if (!j.hari.includes(wd)) continue;
    const s = toMin(j.mulai);
    if (t >= s && t < s + j.menit) return { activity: j.aktivitas, label: j.label };
  }
  if (wd <= 5 && t >= toMin(JAM_KANTOR.buka) && t < toMin(JAM_KANTOR.tutup)) return { activity: 'siaga', label: 'siap menerima perintah' };
  return { activity: 'pulang', label: wd > 5 ? 'libur akhir pekan' : 'di luar jam kerja' };
}

export const isNight = (time: string) => toMin(time) >= toMin('18:30') || toMin(time) < toMin('06:00');

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);

const isReporter = (role: Agen['role']) => role === 'ceo' || role === 'manager' || role === 'lead';

export function officeDesks(
  hari: number,
  time: string,
  selaluKerja = false,
  keputusan: readonly KeputusanDivisi[] = [],
  mode: OfficeMode = 'auto',
  pengumuman?: string | null,
): DeskState[] {
  const pendingByUnit = new Map<LaporanUnitKey, KeputusanDivisi[]>();
  const approvedByUnit = new Map<LaporanUnitKey, KeputusanDivisi[]>();
  for (const k of keputusan) {
    if (k.status === 'menunggu_acc' || k.status === 'revisi') {
      const list = pendingByUnit.get(k.divisi) ?? [];
      list.push(k);
      pendingByUnit.set(k.divisi, list);
    } else if (k.status === 'di_acc') {
      const list = approvedByUnit.get(k.divisi) ?? [];
      list.push(k);
      approvedByUnit.set(k.divisi, list);
    }
  }

  const totalPending = keputusan.filter((k) => k.status === 'menunggu_acc' || k.status === 'revisi').length;

  return AGEN.map((a) => {
    const r = LAPORAN[a.key] ?? {};
    if (a.role === 'owner') {
      const doing: Doing =
        mode === 'istirahat'
          ? { activity: 'siaga', label: 'memantau kru istirahat' }
          : totalPending > 0
            ? { activity: 'kerja', label: `Dawning Project · ${totalPending} ACC` }
            : { activity: 'siaga', label: 'Dawning Project · Semua ACC' };
      const ownerBubble = pengumuman
        ? `📢 Pengumuman Owner: "${pengumuman}"`
        : totalPending > 0
          ? `Dawning Project: ${totalPending} laporan menunggu ACC di dashboard Owner sebelum kru produksi.`
          : 'Dawning Project: Seluruh keputusan sudah di-ACC & sedang dieksekusi oleh 8 divisi.';
      return {
        desk: { key: a.key, room: a.ruang, color: a.warna, x: a.x, z: a.z },
        agen: a,
        doing,
        bubble: clip(ownerBubble, 128),
        waiting: [],
        urgent: [],
        needsAcc: false,
        approved: true,
      };
    }

    const unitKey = a.ruang as LaporanUnitKey;
    const unitPending = pendingByUnit.get(unitKey) ?? [];
    const unitApproved = approvedByUnit.get(unitKey) ?? [];
    const needsAcc = unitPending.length > 0;
    const approved = !needsAcc && unitApproved.length > 0;

    let doing = agentDoing(a.key, hari, time, selaluKerja);

    if (mode === 'istirahat') {
      doing = { activity: 'istirahat', label: 'selesai kerja · istirahat santai' };
    } else if (mode === 'laporan') {
      doing = isReporter(a.role)
        ? { activity: 'laporan', label: 'menghadap Arkan · minta ACC…' }
        : { activity: 'siaga', label: 'menunggu ACC Arkan…' };
    } else if (mode === 'kerja') {
      if (needsAcc) {
        doing = isReporter(a.role)
          ? { activity: 'laporan', label: 'lapor ke Ruangan Arkan…' }
          : { activity: 'siaga', label: 'menunggu ACC Arkan…' };
      } else {
        doing = { activity: 'kerja', label: 'di-ACC Arkan · produksi berjalan!' };
      }
    } else if (doing.activity !== 'pulang' && doing.activity !== 'istirahat') {
      if (needsAcc) {
        doing = isReporter(a.role)
          ? { activity: 'laporan', label: 'lapor ke Arkan · tunggu ACC…' }
          : { activity: 'siaga', label: 'menunggu ACC dari Arkan…' };
      } else if (approved && doing.activity === 'laporan') {
        doing = { activity: 'kerja', label: 'di-ACC Arkan · produksi berjalan!' };
      }
    }

    const waitingTexts = unitPending.map((p) => p.judul);
    const urgentTexts = unitPending.filter((p) => p.mendesak).map((p) => p.judul);
    const rawBubble =
      doing.activity === 'istirahat'
        ? 'Produksi & upload selesai! Waktunya istirahat di kantin, kolam renang, atau badminton.'
        : needsAcc
          ? isReporter(a.role)
            ? `Melapor ke Dawning Project: "${unitPending[0]!.judul}"`
            : 'Menunggu izin ACC Owner di Dawning Project sebelum mulai produksi.'
          : approved
            ? `✅ Di-ACC Owner! ${r.ringkasan ?? 'Sedang menjalankan produksi divisi.'}`
            : r.ringkasan;

    return {
      desk: { key: a.key, room: a.ruang, color: a.warna, x: a.x, z: a.z },
      agen: a,
      doing,
      bubble: rawBubble ? clip(rawBubble, 118) : null,
      waiting: isReporter(a.role) ? waitingTexts : r.menunggu ?? [],
      urgent: isReporter(a.role) ? urgentTexts : r.mendesak ?? [],
      needsAcc,
      approved,
    };
  });
}

export function missionBoard(desks: readonly DeskState[]) {
  return {
    items: desks.flatMap((d) => d.waiting.map((text) => ({ key: d.agen.key, name: d.agen.nama, color: d.agen.warna, text }))),
    metrics: desks.flatMap((d) => (LAPORAN[d.agen.key]?.angka ?? []).map((m) => ({ ...m, name: d.agen.nama }))),
  };
}

export const LAPSE_SECONDS = BABAK.reduce((n, a) => n + a.detik, 0);

export function lapseAt(t: number): { time: string; act: number; title: string; inAct: number } {
  let s = ((t % LAPSE_SECONDS) + LAPSE_SECONDS) % LAPSE_SECONDS;
  for (let i = 0; i < BABAK.length; i++) {
    const a = BABAK[i]!;
    if (s < a.detik || i === BABAK.length - 1) {
      const m = Math.min(Math.floor(toMin(a.dari) + Math.min(1, s / a.detik) * (toMin(a.sampai) - toMin(a.dari))), toMin(a.sampai));
      return { time: `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`, act: i, title: a.judul, inAct: s };
    }
    s -= a.detik;
  }
  return { time: BABAK[0]!.dari, act: 0, title: BABAK[0]!.judul, inAct: 0 };
}

export type IdleSpot = 'meja' | 'owner' | 'kantin' | 'kolam' | 'badminton' | 'lounge';

export const IDLE_LABEL: Record<IdleSpot, string> = {
  meja: 'siap menerima perintah',
  owner: 'lapor ke Ruangan Arkan',
  kantin: 'makan & ngopi di Kantin',
  kolam: 'berenang & santai di Kolam',
  badminton: 'main Badminton indoor',
  lounge: 'santai di Lounge & papan misi',
};

const REST_SPOTS: readonly IdleSpot[] = ['kantin', 'kolam', 'badminton', 'lounge'];
const REPORTER_KEYS = ['revan', 'nadia_mgr', 'raka', 'sekar', 'damar', 'kevin', 'melodi', 'bagas', 'lita', 'doni'];

export function moveTargetAt(d: DeskState, t: number): { spot: IdleSpot; k: number; walking: boolean; slot: number } {
  if (d.agen.role === 'owner') return { spot: 'meja', k: 0, walking: false, slot: 0 };

  const i = Math.max(0, AGEN.findIndex((a) => a.key === d.agen.key));
  const act = d.doing.activity;

  if (act === 'laporan' && isReporter(d.agen.role)) {
    const repIdx = REPORTER_KEYS.indexOf(d.agen.key);
    const slot = repIdx >= 0 ? repIdx : i % 10;
    const ease = (x: number) => x * x * (3 - 2 * x);
    const walkIn = Math.min(1, t / 2.2);
    return { spot: 'owner', k: ease(walkIn), walking: walkIn < 1, slot };
  }

  if (act === 'istirahat') {
    const spot = REST_SPOTS[i % REST_SPOTS.length]!;
    const ease = (x: number) => x * x * (3 - 2 * x);
    const walkIn = Math.min(1, (t + (i % 5) * 0.25) / 2.4);
    return { spot, k: ease(walkIn), walking: walkIn < 1, slot: i };
  }

  if (act === 'siaga') {
    const shifted = t + i * 4.7;
    const cycle = ((shifted % 20) + 20) % 20;
    const n = Math.floor(shifted / 20);
    const spot = REST_SPOTS[(((n + i) % REST_SPOTS.length) + REST_SPOTS.length) % REST_SPOTS.length]!;
    const ease = (x: number) => x * x * (3 - 2 * x);
    if (cycle < 2.6) return { spot, k: ease(cycle / 2.6), walking: true, slot: i };
    if (cycle < 11) return { spot, k: 1, walking: false, slot: i };
    if (cycle < 13.6) return { spot, k: 1 - ease((cycle - 11) / 2.6), walking: true, slot: i };
  }

  return { spot: 'meja', k: 0, walking: false, slot: i };
}

export function params(q: URLSearchParams) {
  const jam = q.get('jam');
  return {
    lapse: q.get('timelapse') === '1',
    rec: q.get('rekam') === '1',
    time: jam && /^([01]\d|2[0-3])[:.][0-5]\d$/.test(jam) ? jam.replace('.', ':') : null,
    alwaysWork: q.get('libur') !== '1',
  };
}
export type IdleSpot = 'meja' | 'owner' | 'kantin' | 'kolam' | 'badminton' | 'lounge' | 'rapat' | 'sholat';

export const IDLE_LABEL: Record<IdleSpot, string> = {
  meja: 'siap menerima perintah',
  owner: 'lapor ke Ruangan Arkan',
  kantin: 'makan & ngopi di Kantin',
  kolam: 'berenang & santai di Kolam',
  badminton: 'main Badminton indoor',
  lounge: 'santai di Lounge & papan misi',
  rapat: 'mengikuti Ruang Rapat Utama',
  sholat: 'beribadah di Mushola kantor',
};

