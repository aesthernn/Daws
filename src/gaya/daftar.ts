export type GayaId = 'pixelhuman' | 'cozy' | 'neon' | 'minimal';

export interface InfoGaya {
  id: GayaId;
  nama: string;
  ket: string;
  jenis?: 'dasar' | 'paduan';
  malam?: boolean;
  tiltShift?: boolean;
  latar?: { siang: string; malam: string };
}

export const KUNCI_SIMPAN = 'dawning_project_gaya_v1';

export const DAFTAR_GAYA: InfoGaya[] = [
  {
    id: 'pixelhuman',
    nama: 'HD-2D Pixel',
    ket: 'Karakter piksel 3D sculpted & pulau melayang',
    jenis: 'paduan',
    tiltShift: true,
    latar: {
      siang: 'radial-gradient(circle at 50% 25%, #fff8eb 0%, #e7d9c4 58%, #cbbba4 100%)',
      malam: 'radial-gradient(circle at 50% 25%, #1e1b4b 0%, #0f172a 65%, #060913 100%)',
    },
  },
  {
    id: 'cozy',
    nama: 'Cozy Studio',
    ket: 'Pencahayaan hangat kayu & pastel lembut',
    jenis: 'dasar',
    latar: {
      siang: 'linear-gradient(160deg, #fdf6ec 0%, #ead8c3 100%)',
      malam: 'linear-gradient(160deg, #1b1730 0%, #0e0c1a 100%)',
    },
  },
  {
    id: 'neon',
    nama: 'Cyber Creator',
    ket: 'Mode studio malam dengan aksen lampu neon',
    jenis: 'paduan',
    malam: true,
    latar: {
      siang: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 100%)',
      malam: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 100%)',
    },
  },
  {
    id: 'minimal',
    nama: 'Clean Iso',
    ket: 'Tampilan isometrik bersih tanpa kabut',
    jenis: 'dasar',
  },
];

export function cariGaya(id: GayaId): InfoGaya {
  return DAFTAR_GAYA.find((g) => g.id === id) ?? DAFTAR_GAYA[0]!;
}

export function gayaAwal(query: string | null, saved: string | null, fallback: GayaId): GayaId {
  const valid = new Set<string>(DAFTAR_GAYA.map((g) => g.id));
  if (query && valid.has(query)) return query as GayaId;
  if (saved && valid.has(saved)) return saved as GayaId;
  return fallback;
}
