import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Material,
  Mesh,
  MeshLambertMaterial,
  Scene,
  Shape,
  SphereGeometry,
} from 'three';

export type Peran =
  | 'garis'
  | 'lantai'
  | 'alas'
  | 'karpet'
  | 'dinding'
  | 'bingkai'
  | 'kayu'
  | 'logam'
  | 'buku'
  | 'kursi'
  | 'kaki'
  | 'catatan'
  | 'papan'
  | 'sofa'
  | 'kertas'
  | 'kain'
  | 'kaca'
  | 'neon'
  | 'meja'
  | 'batu'
  | 'air'
  | 'pot'
  | 'daun'
  | 'lampu'
  | 'tanah'
  | 'batang'
  | 'awan'
  | 'layar'
  | 'baju'
  | 'celana'
  | 'kulit'
  | 'rambut';

export interface Dunia {
  tinggi?: number;
  lebar?: number;
  zoomJauh?: number;
  gantiLuar?: boolean;
  malam?: (isNight: boolean) => void;
}

export interface KitGaya {
  humanStyle: 'sculpted-pixel' | 'capsule';
  kabut: [string, string] | null;
  selaluMalam?: boolean;
  pixelSize?: number;
  agen: { kepala: number; badan: number };
  luar: { ukuran: number; bentuk: 'bulat' | 'kotak'; alas?: string; awan?: boolean };
  cahaya: { langit: string; bumi: string; kuat: number; matahari: string; mKuat: number };
  warna: (hex: string, peran: Peran) => string;
  bahan: (color: string, peran: Peran, emissive?: string) => MeshLambertMaterial;
  kotak: (w: number, h: number, d: number, peran: Peran) => BufferGeometry;
  tabung: (rt: number, rb: number, h: number, peran: Peran) => BufferGeometry;
  bola: (r: number, peran: Peran, kubah?: boolean) => BufferGeometry;
  kerucut: (r: number, h: number, peran: Peran, open?: boolean) => BufferGeometry;
  kapsul: (r: number, len: number, peran: Peran) => BufferGeometry;
  hias?: (mesh: Mesh, peran: Peran) => void;
  dunia?: (args: {
    scene: Scene;
    kantor: Group;
    K: KitGaya;
    pasang: (g: BufferGeometry, m: Material, x: number, y: number, z: number, induk?: Scene | Group | Mesh) => Mesh;
  }) => Dunia | void;
  simpan: <T extends { dispose(): void }>(item: T) => T;
  dispose: () => void;
}

export function kotakBulat(w: number, h: number, d: number, r: number, segs = 3): BufferGeometry {
  const radius = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const hw = w / 2 - radius;
  const hh = h / 2 - radius;
  const shape = new Shape();
  shape.moveTo(-hw, -hh - radius);
  shape.lineTo(hw, -hh - radius);
  shape.quadraticCurveTo(hw + radius, -hh - radius, hw + radius, -hh);
  shape.lineTo(hw + radius, hh);
  shape.quadraticCurveTo(hw + radius, hh + radius, hw, hh + radius);
  shape.lineTo(-hw, hh + radius);
  shape.quadraticCurveTo(-hw - radius, hh + radius, -hw - radius, hh);
  shape.lineTo(-hw - radius, -hh);
  shape.quadraticCurveTo(-hw - radius, -hh - radius, -hw, -hh - radius);

  const geo = new ExtrudeGeometry(shape, {
    depth: Math.max(0.002, d - radius * 2),
    bevelEnabled: true,
    bevelSegments: segs,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius,
  });
  geo.center();
  return geo;
}

export function buatKitDasar(opsi: Partial<KitGaya> = {}): KitGaya {
  const bag: { dispose(): void }[] = [];
  const simpan = <T extends { dispose(): void }>(item: T): T => {
    bag.push(item);
    return item;
  };
  const warna = opsi.warna ?? ((hex: string) => hex);

  return {
    humanStyle: opsi.humanStyle ?? 'sculpted-pixel',
    kabut: opsi.kabut !== undefined ? opsi.kabut : ['#e9decb', '#13172b'],
    selaluMalam: opsi.selaluMalam ?? false,
    pixelSize: opsi.pixelSize ?? 1,
    agen: opsi.agen ?? { kepala: 1.15, badan: 1.0 },
    luar: opsi.luar ?? { ukuran: 62, bentuk: 'bulat', alas: '#3c2d5c', awan: true },
    cahaya: opsi.cahaya ?? { langit: '#fff8ee', bumi: '#b39579', kuat: 1.48, matahari: '#ffe6c4', mKuat: 1.85 },
    warna,
    bahan(color: string, peran: Peran, emissive?: string) {
      const m = new MeshLambertMaterial({
        color: warna(color, peran),
        emissive: emissive ?? '#000000',
        emissiveIntensity: emissive && emissive !== '#000000' ? 0.45 : 0,
      });
      m.userData.peran = peran;
      return simpan(m);
    },
    kotak(w: number, h: number, d: number) {
      return simpan(new BoxGeometry(w, h, d));
    },
    tabung(rt: number, rb: number, h: number) {
      return simpan(new CylinderGeometry(rt, rb, h, 18));
    },
    bola(r: number, _peran: Peran, kubah = false) {
      return simpan(kubah ? new SphereGeometry(r, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2) : new SphereGeometry(r, 18, 14));
    },
    kerucut(r: number, h: number, _peran: Peran, open = false) {
      return simpan(new ConeGeometry(r, h, 18, 1, open));
    },
    kapsul(r: number, len: number) {
      return simpan(new CapsuleGeometry(r, len, 6, 12));
    },
    hias: opsi.hias,
    dunia: opsi.dunia,
    simpan,
    dispose() {
      for (const item of bag) item.dispose();
      bag.length = 0;
    },
  };
}
