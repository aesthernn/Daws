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
    if (targetItem) {
      tampilToast(`✅ Dawning Project ACC: ${targetItem.divisiLabel} mulai eksekusi!`);
    }
  };

  const accSemua = () => {
    setKeputusan((prev) => prev.map((k) => ({ ...k, status: 'di_acc', mendesak: false, catatanRevisi: undefined })));
    tampilToast('✅ Seluruh keputusan CEO, Manajer & 8 Divisi telah di-ACC Owner!');
  };

  const simpanRevisi = (id: string) => {
    const targetItem = keputusan.find((k) => k.id === id);
    setKeputusan((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'revisi', catatanRevisi: revisiNote.trim() || 'Mohon sesuaikan KPI & konsep.' } : k)),
    );
    setRevisiTargetId(null);
    setRevisiNote('');
    if (targetItem) {
      tampilToast(`↺ Catatan revisi dikirim ke ${targetItem.pelaporNama} (${targetItem.divisiLabel}).`);
    }
  };

  const tambahPerintahOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const unit = UNIT_OPTIONS.find((u) => u.key === newTaskUnit) ?? UNIT_OPTIONS[0]!;
    const baru: KeputusanDivisi = {
      id: `owner-cmd-${Date.now()}`,
      divisi: unit.key,
      divisiLabel: unit.label,
      pelaporKey: 'arkan',
      pelaporNama: `Instruksi Owner → ${unit.pelapor}`,
      warna: unit.warna,
      judul: newTaskTitle.trim(),
      ringkasan: 'Perintah langsung dari Dashboard Dawning Project (Owner Arkan).',
      estimasiBiaya: 'Disetujui Owner',
      targetImpact: 'Prioritas Utama',
      mendesak: true,
      status: 'di_acc',
    };
    setKeputusan((prev) => [baru, ...prev]);
    setNewTaskTitle('');
    setMode('kerja');
    tampilToast(`👑 Perintah Owner diteruskan ke ${unit.label} & langsung dikerjakan!`);
  };

  const ajukanLaporanBaru = () => {
    setKeputusan(KEPUTUSAN_AWAL.map((k) => ({ ...k, status: 'menunggu_acc' })));
    setMode('laporan');
    setActiveTab('acc');
    setDashboardOpen(true);
    tampilToast('📋 CEO, Manajer & 8 Kepala Divisi masuk ke Ruangan Arkan meminta ACC!');
  };

  const majukanProyek = (id: string) => {
    setProyekList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = Math.min(100, item.progress + 15);
        return { ...item, progress: next, deadline: next === 100 ? 'Selesai & Tayang ✅' : item.deadline };
      }),
    );
    tampilToast('🚀 Progress produksi konten diperbarui!');
  };

  const kirimPengumuman = (e: React.FormEvent) => {
    e.preventDefault();
    const teks = announcementInput.trim();
    if (!teks) return;
    setActiveAnnouncement(teks);
    setAnnouncementInput('');
    tampilToast(`📢 Pengumuman disiarkan ke seluruh studio Dawning Project!`);
  };

  const gantiGaya = (id: GayaId) => {
    setGaya(id);
    setPilihBuka(false);
    try {
      localStorage.setItem(KUNCI_SIMPAN, id);
    } catch {
      /* abaikan */
    }
    const q = new URLSearchParams(location.search);
    q.set('gaya', id);
    history.replaceState(null, '', `${location.pathname}?${q}`);
  };
  const g = cariGaya(gaya);

  useEffect(() => {
    if (p.rec) {
      const w = window as unknown as { __koFrame?: (t: number) => boolean };
      w.__koFrame = (x: number) => {
        flushSync(() => setT(x));
        drive.current?.(x);
        return !!drive.current;
      };
      return () => void delete w.__koFrame;
    }
    const start = performance.now();
    const id = window.setInterval(() => {
      setT((performance.now() - start) / 1000);
      setNow(new Date());
    }, 100);
    return () => window.clearInterval(id);
  }, [p.rec]);

  const lapse = p.lapse ? lapseAt(t) : null;
  const time = lapse?.time ?? p.time ?? hm(now);
  const desks = officeDesks(isoDay(now), time, p.alwaysWork, keputusan, mode, activeAnnouncement);
  const board = missionBoard(desks);
  const night = nightOverride !== null ? nightOverride : isNight(time);
  const withBubble = desks.filter((d) => d.bubble);
  const spotKey = withBubble.length ? withBubble[Math.floor(t / 2.6) % withBubble.length]!.desk.key : null;

  const working = desks.filter((d) => d.agen.role !== 'owner' && d.doing.activity === 'kerja').length;
  const resting = desks.filter((d) => d.doing.activity === 'istirahat').length;
  const pendingAcc = keputusan.filter((k) => k.status === 'menunggu_acc' || k.status === 'revisi');
  const approvedAcc = keputusan.filter((k) => k.status === 'di_acc');
  const filteredKeputusan = keputusan.filter((k) => {
    if (filterAcc === 'pending') return k.status !== 'di_acc';
    if (filterAcc === 'approved') return k.status === 'di_acc';
    return true;
  });

  const latar = g.latar && (night ? g.latar.malam : g.latar.siang);

  return (
    <div className="ko" data-night={night || !!g.malam || undefined} data-gaya={gaya} style={latar ? { background: latar } : undefined}>
      <div className="ko-stage">
        <Suspense fallback={<div className="ko-loading">Menyiapkan Dawning Project · Kantor Virtual 3D…</div>}>
          <OfficeScene
            desks={desks}
            night={night}
            boardCount={Math.min(board.items.length, 9)}
            anchors={anchors}
            boardAnchor={boardAnchor}
            cinematic
            manual={p.rec}
            drive={drive}
            gaya={gaya}
            pixelScale={gaya === 'pixelhuman' ? pixelScale : undefined}
            focusRoom={focusRoom}
          />
        </Suspense>
        {g.tiltShift && <div className="ko-tilt" aria-hidden="true" />}
        <div className="ko-layer">
          {desks.map((d) => {
            const mv = moveTargetAt(d, t);
            const activeSpot = mv.k > 0.2 ? mv.spot : null;
            const dim = focusRoom !== 'all' && d.desk.room !== focusRoom && d.agen.role !== 'owner';
            return (
              <Tag
                key={d.desk.key}
                d={d}
                dim={dim}
                spot={spotKey === d.desk.key}
                idle={activeSpot}
                refFn={(el) => (el ? anchors.current.set(d.desk.key, el) : anchors.current.delete(d.desk.key))}
                onOpen={() => setOpen(d)}
              />
            );
          })}
          <span className="ko-board-pin" ref={(el) => void (boardAnchor.current = el)}>
            Mission Board
          </span>
        </div>
      </div>

      {/* HUD Atas */}
      <header className="ko-hud">
        <div className="ko-hud-left">
          <div className="ko-brand">
            <span className="ko-live" />
            <div>
              <b>{KANTOR.nama}</b>
              <small>
                Owner: Arkan · {pendingAcc.length} tunggu ACC · {working} produksi · {resting} istirahat
              </small>
            </div>
            <button
              type="button"
              className="ko-dash-pill"
              onClick={() => setDashboardOpen((v) => !v)}
              title="Buka / Tutup Dashboard Owner Dawning Project"
            >
              👑 {dashboardOpen ? 'Sembunyikan Dashboard' : 'Buka Dawning Project'}
            </button>
          </div>

          <div className="ko-mode-bar" role="group" aria-label="Status Operasional Agensi">
            <button type="button" aria-pressed={mode === 'auto'} onClick={() => setMode('auto')}>
              🕒 Otomatis
            </button>
            <button type="button" aria-pressed={mode === 'laporan'} onClick={() => setMode('laporan')}>
              📋 Lapor ke Arkan ({pendingAcc.length})
            </button>
            <button type="button" aria-pressed={mode === 'kerja'} onClick={() => setMode('kerja')}>
              🎬 Produksi Konten
            </button>
            <button type="button" className="ko-rest-btn" aria-pressed={mode === 'istirahat'} onClick={() => setMode('istirahat')}>
              🏖️ Istirahat Setelah Kerja
            </button>
          </div>

          <nav className="ko-divisi-bar" aria-label="Sorot Ruangan & Divisi">
            <button type="button" aria-pressed={focusRoom === 'all'} onClick={() => setFocusRoom('all')}>
              Semua Area
            </button>
            <button type="button" aria-pressed={focusRoom === 'owner'} onClick={() => setFocusRoom('owner')}>
              👑 Ruang Arkan
            </button>
            <button type="button" aria-pressed={focusRoom === 'manajemen'} onClick={() => setFocusRoom('manajemen')}>
              💼 CEO & Manajer
            </button>
            {RUANGAN.filter((r) => r.jenis === 'divisi').map((r) => (
              <button key={r.key} type="button" aria-pressed={focusRoom === r.key} onClick={() => setFocusRoom(r.key)}>
                <span className="ko-div-dot" style={{ background: r.karpet }} />
                {r.label.replace(/^Divisi\s+/, '')}
              </button>
            ))}
            <button type="button" aria-pressed={focusRoom === 'kantin'} onClick={() => setFocusRoom('kantin')}>
              ☕ Kantin
            </button>
            <button type="button" aria-pressed={focusRoom === 'kolam'} onClick={() => setFocusRoom('kolam')}>
              🏊 Kolam Renang
            </button>
            <button type="button" aria-pressed={focusRoom === 'badminton'} onClick={() => setFocusRoom('badminton')}>
              🏸 Badminton
            </button>
          </nav>
        </div>

        <div className="ko-clock">
          <b>{time.replace(':', '.')}</b>
          <small>
            {HARI[now.getDay()]}, {now.getDate()} {BULAN[now.getMonth()]} {now.getFullYear()}
          </small>
        </div>
      </header>

      {/* Banner Pengumuman Owner */}
      {activeAnnouncement && (
        <div className="ko-banner-announce" role="region" aria-label="Pengumuman Owner">
          <span>📢 <b>Dawning Project Broadcast:</b> {activeAnnouncement}</span>
          <button type="button" onClick={() => setActiveAnnouncement(null)} aria-label="Tutup pengumuman">
            ✕
          </button>
        </div>
      )}

      {toast && (
        <div className="ko-toast" role="status">
          {toast}
        </div>
      )}

      {lapse && (!p.rec || lapse.inAct < 3) && (
        <p key={lapse.act} className="ko-act" style={p.rec ? { animation: 'none', opacity: Math.max(0, Math.min(1, lapse.inAct * 3, (3 - lapse.inAct) * 2)) } : undefined}>
          {lapse.title}
        </p>
      )}

      {/* DASHBOARD OWNER: DAWNING PROJECT (MULTI-FITUR) */}
      {dashboardOpen && (
        <aside className="ko-mini ko-dawning-panel" aria-label="Dashboard Owner Dawning Project">
          <div className="ko-dawning-header">
            <div>
              <span className="ko-dawning-badge">OWNER COMMAND CENTER</span>
              <h2>👑 Dawning Project</h2>
            </div>
            <button type="button" className="ko-acc-toggle" onClick={() => setDashboardOpen(false)}>
              Perkecil
            </button>
          </div>

          {/* Navigasi 5 Tab Fitur */}
          <div className="ko-dawning-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={activeTab === 'acc'} onClick={() => setActiveTab('acc')}>
              ✅ ACC ({pendingAcc.length})
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
              📊 KPI
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'pipeline'} onClick={() => setActiveTab('pipeline')}>
              🎬 Konten
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'finance'} onClick={() => setActiveTab('finance')}>
              💰 Dana & AI
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'control'} onClick={() => setActiveTab('control')}>
              🎛️ Studio
            </button>
          </div>

          {/* TAB 1: MEJA ACC OWNER & PERINTAH BARU */}
          {activeTab === 'acc' && (
            <div className="ko-tab-body">
              <form className="ko-owner-cmd" onSubmit={tambahPerintahOwner}>
                <input
                  type="text"
                  placeholder="Tulis perintah/misi baru dari Arkan…"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <div className="ko-owner-cmd-row">
                  <select value={newTaskUnit} onChange={(e) => setNewTaskUnit(e.target.value as LaporanUnitKey)}>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.key} value={u.key}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit">+ Kirim</button>
                </div>
              </form>

              <div className="ko-acc-toolbar">
                <div className="ko-filter-pills">
                  <button type="button" aria-pressed={filterAcc === 'all'} onClick={() => setFilterAcc('all')}>
                    Semua ({keputusan.length})
                  </button>
                  <button type="button" aria-pressed={filterAcc === 'pending'} onClick={() => setFilterAcc('pending')}>
                    Pending ({pendingAcc.length})
                  </button>
                  <button type="button" aria-pressed={filterAcc === 'approved'} onClick={() => setFilterAcc('approved')}>
                    ACC ({approvedAcc.length})
                  </button>
                </div>

                {pendingAcc.length > 0 ? (
                  <button type="button" className="ko-btn-acc-all" onClick={accSemua}>
                    ✓ ACC Semua ({pendingAcc.length})
                  </button>
                ) : (
                  <button type="button" className="ko-btn-reset-acc" onClick={ajukanLaporanBaru}>
                    + Simulasi Laporan Baru
                  </button>
                )}
              </div>

              <ul className="ko-acc-list">
                {filteredKeputusan.map((item) => (
                  <li key={item.id} data-status={item.status}>
                    <div className="ko-acc-top">
                      <span className="ko-acc-div" style={{ background: item.warna }}>
                        {item.divisiLabel}
                      </span>
                      <small>{item.pelaporNama}</small>
                    </div>
                    <p className="ko-acc-title">{item.judul}</p>
                    <div className="ko-acc-meta">
                      <span>💵 {item.estimasiBiaya}</span>
                      <span>🎯 {item.targetImpact}</span>
                    </div>
                    {item.catatanRevisi && <p className="ko-rev-note">Catatan Arkan: “{item.catatanRevisi}”</p>}

                    {revisiTargetId === item.id ? (
                      <div className="ko-rev-box">
                        <input
                          type="text"
                          placeholder="Tulis catatan revisi untuk tim…"
                          value={revisiNote}
                          onChange={(e) => setRevisiNote(e.target.value)}
                        />
                        <div className="ko-acc-foot">
                          <button type="button" className="ko-btn-acc" onClick={() => simpanRevisi(item.id)}>
                            Kirim Revisi
                          </button>
                          <button type="button" className="ko-btn-rev" onClick={() => setRevisiTargetId(null)}>
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="ko-acc-foot">
                        {item.status === 'di_acc' ? (
                          <span className="ko-status-ok">✅ Di-ACC Owner · Sedang Dikerjakan</span>
                        ) : (
                          <>
                            <button type="button" className="ko-btn-acc" onClick={() => beriAcc(item.id)}>
                              ✓ ACC Arkan
                            </button>
                            <button
                              type="button"
                              className="ko-btn-rev"
                              onClick={() => {
                                setRevisiTargetId(item.id);
                                setRevisiNote(item.catatanRevisi ?? '');
                              }}
                            >
                              ↺ Revisi
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 2: ANALYTICS & KPI AGENSI */}
          {activeTab === 'analytics' && (
            <div className="ko-tab-body">
              <div className="ko-kpi-grid">
                <div className="ko-kpi-card">
                  <small>Total Views (7 Hari)</small>
                  <b>4.82M</b>
                  <span className="ko-up">▲ +28.4%</span>
                </div>
                <div className="ko-kpi-card">
                  <small>Est. Revenue Minggu Ini</small>
                  <b>Rp 148.5 Jt</b>
                  <span className="ko-up">▲ AdSense + Sponsor</span>
                </div>
                <div className="ko-kpi-card">
                  <small>Output Konten</small>
                  <b>21 / 24</b>
                  <span>87.5% Target</span>
                </div>
                <div className="ko-kpi-card">
                  <small>Efisiensi AI Studio</small>
                  <b>3.4x</b>
                  <span>Hemat 68% Jam</span>
                </div>
              </div>

              <div className="ko-section-box">
                <h4>Performa Channel Dawning Project</h4>
                {[
                  { nama: 'YouTube Long & Shorts', views: '2.15M views', pct: 88, warna: '#ef4444' },
                  { nama: 'TikTok AI & Entertainment', views: '1.74M views', pct: 76, warna: '#14b8a6' },
                  { nama: 'Instagram Reels', views: '930K views', pct: 64, warna: '#ec4899' },
                ].map((ch) => (
                  <div key={ch.nama} className="ko-bar-row">
                    <div className="ko-bar-label">
                      <span>{ch.nama}</span>
                      <b>{ch.views}</b>
                    </div>
                    <div className="ko-bar-track">
                      <div className="ko-bar-fill" style={{ width: `${ch.pct}%`, background: ch.warna }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="ko-section-box">
                <h4>Kesiapan Eksekusi 8 Divisi</h4>
                <p className="ko-muted">
                  <b>{approvedAcc.length}</b> dari <b>{keputusan.length}</b> unit sudah mengantongi ACC Owner Arkan.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PIPELINE PRODUKSI KONTEN */}
          {activeTab === 'pipeline' && (
            <div className="ko-tab-body">
              <p className="ko-muted">Pantau & percepat antrean produksi konten aktif lintas 8 divisi:</p>
              <ul className="ko-acc-list">
                {proyekList.map((pr) => (
                  <li key={pr.id}>
                    <div className="ko-acc-top">
                      <span className="ko-acc-div" style={{ background: '#3b82f6' }}>
                        {pr.platform}
                      </span>
                      <small>PIC: {pr.pic}</small>
                    </div>
                    <p className="ko-acc-title">{pr.judul}</p>
                    <div className="ko-bar-track">
                      <div className="ko-bar-fill" style={{ width: `${pr.progress}%`, background: pr.progress === 100 ? '#16a34a' : '#f59e0b' }} />
                    </div>
                    <div className="ko-acc-foot" style={{ justifyContent: 'space-between' }}>
                      <small>
                        {pr.progress}% · {pr.deadline}
                      </small>
                      {pr.progress < 100 && (
                        <button type="button" className="ko-btn-acc" onClick={() => majukanProyek(pr.id)}>
                          +15% Progress
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB 4: KEUANGAN, BUDGET ADS & AI STACK */}
          {activeTab === 'finance' && (
            <div className="ko-tab-body">
              <div className="ko-section-box">
                <div className="ko-bar-label">
                  <span>Alokasi Budget Boost Ads</span>
                  <b>Rp {adsBudgetJuta}.000.000</b>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={adsBudgetJuta}
                  onChange={(e) => setAdsBudgetJuta(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <small className="ko-muted">Estimasi jangkauan iklan: ±{(adsBudgetJuta * 145).toLocaleString('id-ID')} impresi tertarget.</small>
              </div>

              <div className="ko-section-box">
                <h4>AI Tools & GPU Render Stack</h4>
                <ul className="ko-tool-list">
                  {AI_TOOLS_STACK.map((tool) => (
                    <li key={tool.nama}>
                      <div className="ko-bar-label">
                        <span>{tool.nama}</span>
                        <b>{tool.biayaBulan}</b>
                      </div>
                      <small className="ko-muted">
                        {tool.divisi} · {tool.kuota}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="ko-btn-acc-all"
                disabled={bonusCair}
                onClick={() => {
                  setBonusCair(true);
                  tampilToast('🎉 Bonus performa 34 kru Dawning Project berhasil dicairkan!');
                }}
              >
                {bonusCair ? '✅ Bonus Kru Bulan Ini Sudah Cair' : '💸 Cairkan Bonus Performa 34 Kru'}
              </button>
            </div>
          )}

          {/* TAB 5: KONTROL STUDIO & MEGAFON OWNER */}
          {activeTab === 'control' && (
            <div className="ko-tab-body">
              
              <form className="ko-section-box" onSubmit={(e) => {
                e.preventDefault();
                const taskText = newTaskTitle.trim();
                if (!taskText) return;
                const unitObj = UNIT_OPTIONS.find(u => u.key === newTaskUnit) || UNIT_OPTIONS[0]!;
                setActiveAnnouncement(`[TUGAS AGENT ${newTaskUnit.toUpperCase()}] ${taskText}`);
                setKeputusan((prev) => [
                  {
                    id: 'task-' + Date.now(),
                    divisi: newTaskUnit,
                    divisiLabel: unitObj.label,
                    pelaporKey: 'arkan',
                    pelaporNama: 'Owner Arkan (Instan)',
                    warna: unitObj.warna,
                    judul: taskText,
                    ringkasan: 'Perintah instan dari Owner Dashboard (Cloudflare deployed).',
                    estimasiBiaya: 'Disetujui Owner',
                    targetImpact: 'Prioritas Utama',
                    status: 'di_acc',
                    mendesak: true,
                  },
                  ...prev,
                ]);
                setNewTaskTitle('');
                tampilToast(`🚀 Perintah "${taskText}" berhasil dikirim ke agent ${newTaskUnit}!`);
              }} style={{ border: '2px solid #6366f1', background: '#eef2ff' }}>
                <h4 style={{ color: '#4f46e5' }}>🤖 Pusat Perintah AI Agent (Auto-Dispatch)</h4>
                <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '8px' }}>
                  Ketik perintah pekerjaan. Pesan akan langsung masuk ke ruang agen & otomatis di-ACC untuk dikerjakan seluruh kru!
                </p>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <select 
                    value={newTaskUnit} 
                    onChange={(e) => setNewTaskUnit(e.target.value as LaporanUnitKey)}
                    style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.key} value={u.key}>{u.label} ({u.pelapor})</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: Buat konten riset AI & optimasi Reels terbaru..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '8px' }}
                />
                <button type="submit" className="ko-btn-acc-all" style={{ width: '100%', background: '#4f46e5', color: '#fff', padding: '8px', fontWeight: 'bold', borderRadius: '4px' }}>
                  ⚡ Kirim & Perintahkan Agen Sekarang
                </button>
              </form>

              <form className="ko-section-box" onSubmit={kirimPengumuman}>
                <h4>📢 Megafon Pengumuman Studio</h4>
                <input
                  type="text"
                  placeholder="Contoh: Semua kumpul di Lobby 5 menit lagi!"
                  value={announcementInput}
                  onChange={(e) => setAnnouncementInput(e.target.value)}
                />
                <button type="submit" className="ko-btn-acc-all" style={{ marginTop: 6 }}>
                  Siarkan ke Seluruh Ruangan
                </button>
              </form>

              <div className="ko-section-box">
                <h4>Pencahayaan & Suasana Kantor</h4>
                <div className="ko-filter-pills">
                  <button type="button" aria-pressed={nightOverride === null} onClick={() => setNightOverride(null)}>
                    Auto Jam
                  </button>
                  <button type="button" aria-pressed={nightOverride === false} onClick={() => setNightOverride(false)}>
                    ☀️ Siang Cerah
                  </button>
                  <button type="button" aria-pressed={nightOverride === true} onClick={() => setNightOverride(true)}>
                    🌙 Lembur Malam
                  </button>
                </div>
              </div>

              <div className="ko-section-box">
                <h4>Aksi Cepat Operasional</h4>
                <div className="ko-quick-grid">
                  <button type="button" className="ko-btn-rev" onClick={() => setMode('laporan')}>
                    📋 Panggil Rapat ACC
                  </button>
                  <button type="button" className="ko-btn-rev" onClick={() => setMode('kerja')}>
                    🎬 Mode Produksi Penuh
                  </button>
                  <button type="button" className="ko-btn-rev" onClick={() => setMode('istirahat')}>
                    🏖️ Jam Istirahat Kru
                  </button>
                  <button type="button" className="ko-btn-rev" onClick={() => setFocusRoom('owner')}>
                    👑 Fokus Ruang Arkan
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

      {TAMPIL_PEMILIH_GAYA && !p.rec && (
        <nav className="ko-gaya" aria-label="Gaya 3D">
          {gaya === 'pixelhuman' && (
            <button
              type="button"
              className="ko-pixel-btn"
              title="Ubah kepadatan piksel HD-2D"
              onClick={() => setPixelScale((s) => (s === 2.5 ? 3.5 : s === 3.5 ? 1 : 2.5))}
            >
              HD-2D: {pixelScale === 1 ? 'Halus' : `${pixelScale}x`}
            </button>
          )}
          {pilihBuka && (
            <ul>
              {DAFTAR_GAYA.map((x) => (
                <li key={x.id}>
                  <button type="button" aria-pressed={x.id === gaya} title={x.ket} onClick={() => gantiGaya(x.id as GayaId)}>
                    {x.nama}
                    {x.jenis === 'paduan' && <small>dunia</small>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="ko-gaya-btn" aria-expanded={pilihBuka} onClick={() => setPilihBuka((b) => !b)}>
            Gaya: {g.nama}
          </button>
        </nav>
      )}

      {open && (
        <div className="ko-sheet" role="dialog" aria-label={open.agen.nama} onClick={() => setOpen(null)}>
          <div className="ko-sheet-in" onClick={(e) => e.stopPropagation()}>
            <span className="ko-sheet-badge" style={{ background: open.agen.role === 'owner' ? '#d97706' : open.desk.color }}>
              {open.agen.role === 'owner' ? '👑 Dawning Project · Owner' : ROOM_LABEL.get(open.desk.room)}
            </span>
            <h3>
              {open.agen.nama} <small>{open.agen.tugas}</small>
            </h3>
            <p>
              Status sekarang: <b>{open.doing.label}</b>
            </p>
            {open.bubble && <p className="ko-sheet-sum">{open.bubble}</p>}
            {open.needsAcc && (
              <div className="ko-sheet-acc-box">
                <p>⚠️ Keputusan unit/divisi ini menunggu ACC Owner di Dawning Project sebelum dikerjakan.</p>
                {keputusan
                  .filter((k) => k.divisi === open.desk.room && k.status !== 'di_acc')
                  .map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      className="ko-btn-acc"
                      onClick={() => {
                        beriAcc(k.id);
                        setOpen(null);
                      }}
                    >
                      ✓ Beri ACC Owner Sekarang
                    </button>
                  ))}
              </div>
            )}
            <button type="button" onClick={() => setOpen(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({
  d,
  dim,
  spot,
  idle,
  refFn,
  onOpen,
}: {
  d: DeskState;
  dim: boolean;
  spot: boolean;
  idle: IdleSpot | null;
  refFn: (el: HTMLElement | null) => void;
  onOpen: () => void;
}) {
  const isOwner = d.agen.role === 'owner';
  const label = idle ? IDLE_LABEL[idle] : d.doing.label;
  const a = d.doing.activity;
  const rolePrefix = d.agen.role === 'ceo' ? 'CEO · ' : d.agen.role === 'manager' ? 'Mgr · ' : '';
  const shortName = isOwner ? '👑 Arkan (Dawning Project)' : `${rolePrefix}${d.agen.nama.split(' ')[0] ?? d.agen.nama}`;
  const isReporter = d.agen.role === 'ceo' || d.agen.role === 'manager' || d.agen.role === 'lead';
  const think = isOwner
    ? '👑'
    : idle === 'owner'
      ? '📋 ACC?'
      : idle === 'kantin'
        ? '☕'
        : idle === 'kolam'
          ? '🏊'
          : idle === 'badminton'
            ? '🏸'
            : a === 'kerja'
              ? '✅'
              : null;

  return (
    <div
      className="ko-tag"
      ref={refFn}
      data-act={a}
      data-owner={isOwner || undefined}
      data-compact={!isOwner || undefined}
      data-dim={dim || undefined}
      style={{ ['--agent' as string]: isOwner ? '#f59e0b' : d.desk.color }}
    >
      <div className="ko-tag-in">
        {d.bubble && (spot || isOwner) && a !== 'pulang' && !dim && <p className="ko-bubble">{d.bubble}</p>}
        {think && !(d.bubble && (spot || isOwner)) && !dim && <span className="ko-think">{think}</span>}
        <div className="ko-tag-row">
          <button type="button" className="ko-name" title={`${d.agen.nama} · ${d.agen.tugas}`} onClick={onOpen}>
            <span className="ko-dot" />
            {shortName}
            {isOwner && <span className="ko-name-act">{label}</span>}
          </button>
          {d.needsAcc && isReporter && (
            <button type="button" className="ko-bang" onClick={onOpen} aria-label="Menunggu ACC Owner">
              ACC
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
<div className="ko-section-box" style={{ border: '2px solid #4f46e5', background: '#eef2ff' }}>
  <h4 style={{ color: '#4f46e5' }}>💼 Kontrol Rapat & Aktivitas Kru</h4>
  <p style={{ fontSize: '11px', color: '#4b5563', marginBottom: '8px' }}>
    Perintahkan CEO Revan untuk mengumpulkan seluruh Kepala Divisi ke Ruang Rapat Utama.
  </p>
  <button 
    type="button" 
    className="ko-btn-acc-all" 
    style={{ background: '#4f46e5', color: '#fff', padding: '8px', fontWeight: 'bold', borderRadius: '6px' }}
    onClick={() => {
      setMode('laporan');
      setActiveAnnouncement("📢 CEO Revan: Seluruh Kepala Divisi harap berkumpul di Ruang Rapat Utama sekarang!");
      tampilToast("💼 CEO memanggil rapat darurat seluruh kepala divisi!");
    }}
  >
    📢 Panggil Rapat Divisi (Ruang Rapat)
  </button>
</div>

