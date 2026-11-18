import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  AI_TOOLS_STACK,
  GAYA,
  KANTOR,
  KEPUTUSAN_AWAL,
  PIPELINE_KONTEN_AWAL,
  RUANGAN,
  TAMPIL_PEMILIH_GAYA,
  type KeputusanDivisi,
  type LaporanUnitKey,
  type ProyekKonten,
  type RoomKey,
} from './config';
import { DAFTAR_GAYA, KUNCI_SIMPAN, cariGaya, gayaAwal, type GayaId } from './gaya/daftar';
import {
  IDLE_LABEL,
  isNight,
  isoDay,
  lapseAt,
  missionBoard,
  moveTargetAt,
  officeDesks,
  params as readParams,
  type DeskState,
  type IdleSpot,
  type OfficeMode,
} from './office';

const OfficeScene = lazy(() => import('./OfficeScene'));

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const ROOM_LABEL = new Map<RoomKey, string>(RUANGAN.map((r) => [r.key, r.label]));

type DashboardTab = 'acc' | 'analytics' | 'pipeline' | 'finance' | 'control';

const UNIT_OPTIONS: { key: LaporanUnitKey; label: string; pelapor: string; warna: string }[] = [
  { key: 'manajemen', label: 'CEO & Manajer', pelapor: 'Revan & Nadia', warna: '#4f46e5' },
  { key: 'riset', label: 'Riset, Ide & Dev', pelapor: 'Raka Pratama', warna: '#e4572e' },
  { key: 'content', label: 'Divisi Content', pelapor: 'Sekar Ayuningtyas', warna: '#ec4899' },
  { key: 'scripting', label: 'Divisi Scripting', pelapor: 'Damar Kusuma', warna: '#eab308' },
  { key: 'visualizing', label: 'Divisi Visualizing', pelapor: 'Kevin Halim', warna: '#3b82f6' },
  { key: 'voiceover', label: 'Divisi Voice Over', pelapor: 'Melodi Putri', warna: '#8b5cf6' },
  { key: 'editing', label: 'Divisi Editing', pelapor: 'Bagas Kurniawan', warna: '#14b8a6' },
  { key: 'upload', label: 'Divisi Upload', pelapor: 'Lita Kusuma', warna: '#22c55e' },
  { key: 'marketing', label: 'Divisi Marketing', pelapor: 'Doni Setiawan', warna: '#f43f5e' },
];

export default function App() {
  const p = useMemo(() => readParams(new URLSearchParams(location.search)), []);
  const [now, setNow] = useState(() => new Date());
  const [t, setT] = useState(0);
  const [open, setOpen] = useState<DeskState | null>(null);
  const [focusRoom, setFocusRoom] = useState<RoomKey | 'all'>('all');
  const [mode, setMode] = useState<OfficeMode>('auto');
  const [nightOverride, setNightOverride] = useState<boolean | null>(null);

  // State Dashboard Owner "Dawning Project"
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('acc');
  const [keputusan, setKeputusan] = useState<KeputusanDivisi[]>(() => KEPUTUSAN_AWAL);
  const [filterAcc, setFilterAcc] = useState<'all' | 'pending' | 'approved'>('all');
  const [revisiTargetId, setRevisiTargetId] = useState<string | null>(null);
  const [revisiNote, setRevisiNote] = useState('');

  // Form Perintah Baru Owner
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskUnit, setNewTaskUnit] = useState<LaporanUnitKey>('manajemen');

  // State Pipeline Konten & Keuangan
  const [proyekList, setProyekList] = useState<ProyekKonten[]>(() => PIPELINE_KONTEN_AWAL);
  const [adsBudgetJuta, setAdsBudgetJuta] = useState(25);
  const [bonusCair, setBonusCair] = useState(false);

  // Pengumuman Owner (Megafon)
  const [announcementInput, setAnnouncementInput] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const drive = useRef<((t: number) => void) | null>(null);
  const anchors = useRef(new Map<string, HTMLElement>());
  const boardAnchor = useRef<HTMLElement | null>(null);
  const [gaya, setGaya] = useState<GayaId>(() => {
    let simpanan: string | null = null;
    try {
      simpanan = localStorage.getItem(KUNCI_SIMPAN);
    } catch {
      /* abaikan */
    }
    return gayaAwal(new URLSearchParams(location.search).get('gaya'), simpanan, GAYA);
  });
  const [pilihBuka, setPilihBuka] = useState(false);
  const [pixelScale, setPixelScale] = useState<number>(2.5);

  const tampilToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 3600);
  };

  const beriAcc = (id: string) => {
    const targetItem = keputusan.find((k) => k.id === id);
    setKeputusan((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'di_acc', mendesak: false, catatanRevisi: undefined } : k)),
    );
    if
