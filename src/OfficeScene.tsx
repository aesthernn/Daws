import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  PointLight,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from 'three';
import { RUANGAN, type RoomKey } from './config';
import { buatKitGaya } from './gaya';
import { kotakBulat, type Dunia, type Peran } from './gaya/alat';
import { moveTargetAt, type DeskState, type IdleSpot } from './office';

type AgentKey = string;

export interface SceneProps {
  desks: readonly DeskState[];
  night: boolean;
  boardCount: number;
  anchors: React.RefObject<Map<AgentKey, HTMLElement>>;
  boardAnchor: React.RefObject<HTMLElement | null>;
  cinematic?: boolean;
  manual?: boolean;
  drive?: { current: ((t: number) => void) | null };
  onReady?: () => void;
  onFail?: () => void;
  gaya?: string;
  pixelScale?: number;
  focusRoom?: RoomKey | 'all';
}

const shade = (hex: string, f: number) => {
  const c = new Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
};
const mixHex = (a: string, b: string, t: number) => `#${new Color(a).lerp(new Color(b), t).getHexString()}`;

const ROOMS = RUANGAN.map((r) => ({
  key: r.key,
  label: r.label,
  x0: r.x0,
  x1: r.x1,
  z0: r.z0,
  z1: r.z1,
  floor: r.warna,
  floorNight: shade(r.warna, 0.34),
  rug: r.karpet,
  jenis: r.jenis,
}));

const X0 = Math.min(...ROOMS.map((r) => r.x0));
const X1 = Math.max(...ROOMS.map((r) => r.x1));
const Z0 = Math.min(...ROOMS.map((r) => r.z0));
const Z1 = Math.max(...ROOMS.map((r) => r.z1));
const W = X1 - X0;
const D = Z1 - Z0;
const CX = (X0 + X1) / 2;
const CZ = (Z0 + Z1) / 2;

const SKIN = ['#f3c9a8', '#e5b38f', '#f0c29e', '#d69c76', '#eab996', '#c58762', '#f5d0b5', '#c98d68'];
const HAIR = ['#261914', '#3b2319', '#19142b', '#4e3121', '#2c1e18', '#6b3f24', '#161622', '#593725'];
const BOARD = new Vector3(3.0, 0, -13.48);

interface Actor {
  key: AgentKey;
  room: RoomKey;
  role: 'owner' | 'ceo' | 'manager' | 'lead' | 'staff';
  root: Group;
  body: Mesh;
  head: Mesh;
  armL: Mesh;
  armR: Mesh;
  legL: Mesh;
  legR: Mesh;
  screen: Mesh;
  deskTop: Mesh;
  book: Mesh;
  lamp: Mesh;
  light: PointLight | null;
  seat: Vector3;
  facingY: number;
  label: Vector3;
  phase: number;
  index: number;
}

function makePixelFaceTexture(skin: string, hair: string, variant: number, isOwner = false): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d')!;
  const skinShadow = mixHex(skin, '#8c4f32', 0.16);
  const skinLight = mixHex(skin, '#ffffff', 0.14);

  g.fillStyle = skin;
  g.fillRect(0, 0, 64, 64);

  g.fillStyle = skinShadow;
  g.fillRect(0, 40, 64, 24);
  g.fillStyle = skin;
  g.fillRect(38, 22, 20, 20);

  g.fillStyle = hair;
  g.fillRect(0, 0, 64, 21);
  g.fillRect(0, 0, 36, 46);
  g.fillRect(59, 0, 5, 46);
  g.fillRect(41, 21, 14, 2);
  g.fillRect(43, 23, 4, 2);
  g.fillRect(50, 23, 3, 1);

  g.fillStyle = skinLight;
  g.fillRect(46, 25, 4, 1);

  g.fillStyle = hair;
  g.fillRect(43, 27, 3, 1);
  g.fillRect(51, 27, 3, 1);

  const eyeColor = isOwner ? '#0f172a' : variant % 3 === 0 ? '#1d3557' : variant % 3 === 1 ? '#2b1d16' : '#1f2937';
  g.fillStyle = '#ffffff';
  g.fillRect(43, 29, 3, 3);
  g.fillStyle = eyeColor;
  g.fillRect(44, 29, 2, 3);
  g.fillStyle = '#ffffff';
  g.fillRect(44, 29, 1, 1);

  g.fillStyle = '#ffffff';
  g.fillRect(51, 29, 3, 3);
  g.fillStyle = eyeColor;
  g.fillRect(51, 29, 2, 3);
  g.fillStyle = '#ffffff';
  g.fillRect(51, 29, 1, 1);

  g.fillStyle = '#f28482';
  g.fillRect(42, 33, 2, 1);
  g.fillRect(53, 33, 2, 1);

  g.fillStyle = skinShadow;
  g.fillRect(48, 33, 1, 1);
  g.fillStyle = '#b55d53';
  g.fillRect(47, 36, 3, 1);
  g.fillStyle = skinLight;
  g.fillRect(48, 37, 1, 1);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

function makePixelOutfitTexture(shirtHex: string, variant: number, role: Actor['role']): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const g = c.getContext('2d')!;
  const dark = mixHex(shirtHex, '#090d16', 0.34);
  const light = mixHex(shirtHex, '#ffffff', 0.2);

  g.fillStyle = shirtHex;
  g.fillRect(0, 0, 32, 32);

  g.fillStyle = light;
  g.fillRect(0, 2, 32, 2);
  g.fillStyle = dark;
  g.fillRect(0, 28, 32, 4);
  for (let x = 2; x < 32; x += 6) {
    g.fillStyle = dark;
    g.fillRect(x, 8, 1, 18);
  }

  g.fillStyle = '#ffffff';
  g.fillRect(22, 1, 5, 8);
  g.fillRect(23, 9, 3, 4);

  if (role === 'owner') {
    g.fillStyle = '#fbbf24';
    g.fillRect(24, 3, 1, 11);
    g.fillStyle = '#f59e0b';
    g.fillRect(21, 2, 1, 11);
    g.fillRect(27, 2, 1, 11);
    g.fillStyle = '#fde047';
    g.fillRect(19, 11, 3, 2);
  } else if (role === 'ceo' || role === 'manager') {
    g.fillStyle = '#c4b5fd';
    g.fillRect(24, 3, 1, 10);
    g.fillStyle = dark;
    g.fillRect(21, 2, 1, 10);
    g.fillRect(27, 2, 1, 10);
  } else {
    g.fillStyle = dark;
    g.fillRect(21, 2, 1, 9);
    g.fillRect(27, 2, 1, 9);
    g.fillRect(24, 12, 1, 16);
    g.fillStyle = '#ffe8a3';
    g.fillRect(24, 14, 1, 1);
    g.fillRect(24, 19, 1, 1);
    g.fillRect(24, 24, 1, 1);
    g.fillStyle = variant % 3 === 0 ? '#7bdff2' : variant % 3 === 1 ? '#ffd166' : '#ff8fa3';
    g.fillRect(20, 12, 2, 2);
  }

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

function computeWaypoints(from: Vector3, to: Vector3): Vector3[] {
  const pts: Vector3[] = [from.clone()];
  const getHallZ = (z: number) => {
    if (z < -8.2) return -8.2;
    if (z < -1.5) return -1.5;
    if (z < 5.2) return -1.5;
    return 5.2;
  };
  const h1 = getHallZ(from.z);
  const h2 = getHallZ(to.z);

  pts.push(new Vector3(from.x, 0, h1));
  if (Math.abs(h1 - h2) > 0.1) {
    const spines = [-7.6, 0.0, 7.6];
    let bestSpine = 0.0;
    let bestDist = Infinity;
    for (const sx of spines) {
      const dist = Math.abs(from.x - sx) + Math.abs(to.x - sx);
      if (dist < bestDist) {
        bestDist = dist;
        bestSpine = sx;
      }
    }
    pts.push(new Vector3(bestSpine, 0, h1));
    pts.push(new Vector3(bestSpine, 0, h2));
  }
  pts.push(new Vector3(to.x, 0, h2));
  pts.push(to.clone());
  return pts;
}

function samplePath(pts: Vector3[], k: number, out: Vector3) {
  let total = 0;
  const segs: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const len = pts[i]!.distanceTo(pts[i + 1]!);
    segs.push(len);
    total += len;
  }
  if (total < 1e-4) return out.copy(pts[0]!);
  let dist = Math.max(0, Math.min(1, k)) * total;
  for (let i = 0; i < segs.length; i++) {
    const l = segs[i]!;
    if (dist <= l || i === segs.length - 1) {
      const f = l > 1e-5 ? Math.min(1, dist / l) : 1;
      return out.copy(pts[i]!).lerp(pts[i + 1]!, f);
    }
    dist -= l;
  }
  return out.copy(pts[pts.length - 1]!);
}

export default function OfficeScene({
  desks,
  night,
  boardCount,
  anchors,
  boardAnchor,
  cinematic,
  manual,
  drive,
  onReady,
  onFail,
  gaya,
  pixelScale,
  focusRoom = 'all',
}: SceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ desks, night, boardCount, dirty: true, pixelScale, focusRoom });
  live.current = { desks, night, boardCount, dirty: true, pixelScale, focusRoom };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: WebGLRenderer;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    try {
      renderer = new WebGLRenderer({
        antialias: !touch || !!manual,
        alpha: true,
        powerPreference: manual ? 'high-performance' : 'low-power',
        preserveDrawingBuffer: !!manual,
      });
    } catch {
      onFail?.();
      return;
    }
    renderer.setPixelRatio(manual ? 1 : Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new Scene();
    const K = buatKitGaya(gaya);
    const sculptedHuman = K.humanStyle === 'sculpted-pixel';
    if (cinematic && K.kabut) scene.fog = new Fog(K.kabut[0], 60, 96);
    const kantor = new Group();
    scene.add(kantor);
    const camera = new OrthographicCamera(-20, 20, 14, -14, 0.1, 150);
    const target = new Vector3(CX, 1.1, CZ);

    let pixelRT: WebGLRenderTarget | null = null;
    const blitScene = new Scene();
    const blitCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const blitMat = new MeshBasicMaterial({ transparent: true, toneMapped: false });
    const blitGeo = new PlaneGeometry(2, 2);
    const blitQuad = new Mesh(blitGeo, blitMat);
    blitScene.add(blitQuad);

    const C = K.cahaya;
    const hemi = new HemisphereLight(C.langit, C.bumi, C.kuat);
    const sun = new DirectionalLight(C.matahari, C.mKuat);
    sun.position.set(-12, 22, 16);
    const amb = new AmbientLight('#ffffff', 0.42);
    scene.add(hemi, sun, amb);

    const disposables: { dispose(): void }[] = [blitMat, blitGeo];
    const geo = <T extends BufferGeometry>(g: T) => (disposables.push(g), g);
    const mat = (color: string, peran: Peran, emissive?: string) => K.bahan(color, peran, emissive);
    const peranDari = (m: Material) => (m.userData.peran ?? 'kayu') as Peran;
    const add = (mesh: Mesh, x: number, y: number, z: number, parent: Scene | Group | Mesh = kantor) => {
      mesh.position.set(x, y, z);
      parent.add(mesh);
      K.hias?.(mesh, peranDari(mesh.material as Material));
      return mesh;
    };
    const box = (w: number, h: number, d: number, m: Material, x: number, y: number, z: number, parent?: Group) =>
      add(new Mesh(K.kotak(w, h, d, peranDari(m)), m), x, y, z, parent);
    const cyl = (rt: number, rb: number, h: number, m: Material) => new Mesh(K.tabung(rt, rb, h, peranDari(m)), m);
    const ball = (r: number, m: Material, kubah = false) => new Mesh(K.bola(r, peranDari(m), kubah), m);
    const cone = (r: number, h: number, m: Material, open = false) => new Mesh(K.kerucut(r, h, peranDari(m), open), m);

    const lineM = mat('#cdb79c', 'garis');
    const hallM = mat('#efe4d4', 'lantai');
    box(W, 0.14, D, hallM, CX, -0.075, CZ);
    box(W + 1.0, 0.56, D + 1.0, mat('#3a2a5c', 'alas'), CX, -0.42, CZ + 0.12);

    const floors = ROOMS.map((r) => {
      const m = mat(r.floor, 'lantai');
      const rw = r.x1 - r.x0;
      const rd = r.z1 - r.z0;
      const rcx = (r.x0 + r.x1) / 2;
      const rcz = (r.z0 + r.z1) / 2;
      box(rw - 0.08, 0.15, rd - 0.08, m, rcx, -0.068, rcz);
      if (r.key !== 'badminton' && r.key !== 'kolam') {
        box(Math.min(3.2, rw * 0.45), 0.02, Math.min(2.1, rd * 0.42), mat(r.rug, 'karpet'), rcx, 0.012, rcz + 0.15);
      }
      return { m, r };
    });

    const wallM = mat('#fbf6ef', 'dinding');
    const wallSideM = mat('#f1e8dc', 'dinding');
    const trimM = mat('#271b3f', 'bingkai');
    const woodM = mat('#a87c56', 'kayu');
    const goldM = mat('#f59e0b', 'logam', '#d97706');

    box(W, 3.2, 0.18, wallM, CX, 1.6, Z0 - 0.09);
    box(0.18, 3.2, D, wallSideM, X0 - 0.09, 1.6, CZ);
    box(W, 0.12, 0.22, woodM, CX, 0.06, Z0 - 0.02);
    box(0.22, 0.12, D, woodM, X0 - 0.02, 0.06, CZ);

    box(0.16, 2.5, 2.4, wallSideM, -7.6, 1.25, -12.4);
    box(0.22, 0.08, 2.4, goldM, -7.6, 2.52, -12.4);
    box(4.4, 1.35, 0.16, wallSideM, -13.0, 0.67, -8.6);
    box(4.44, 0.08, 0.2, goldM, -13.0, 1.36, -8.6);
    box(2.7, 0.36, 0.06, trimM, -11.4, 2.75, Z0 + 0.04);
    box(2.56, 0.24, 0.07, goldM, -11.4, 2.75, Z0 + 0.05);

    const shelf = (x: number, z: number, rot = 0) => {
      const g = new Group();
      box(1.2, 1.8, 0.36, woodM, 0, 0.9, 0, g);
      const bookColors = ['#e4572e', '#2a9d8f', '#f2b134', '#3a86ff', '#8e6bd8', '#ff5d8f'];
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 6; i++) box(0.14, 0.34, 0.26, mat(bookColors[(i + row) % 6]!, 'buku'), -0.45 + i * 0.18, 0.4 + row * 0.55, 0.04, g);
      g.position.set(x, 0, z);
      g.rotation.y = rot;
      kantor.add(g);
    };
    shelf(-14.8, -12.2, Math.PI / 2);
    shelf(-8.2, -13.15);
    for (const gx of [-12.2, -10.6]) {
      box(0.54, 0.08, 0.54, mat('#334155', 'kursi'), gx, 0.48, -10.55);
      box(0.54, 0.52, 0.08, mat('#334155', 'kursi'), gx, 0.76, -10.29);
      box(0.06, 0.44, 0.06, mat('#475569', 'kaki'), gx, 0.22, -10.55);
    }

    box(0.14, 1.4, 3.0, wallSideM, -0.4, 0.7, -12.1);
    box(2.4, 0.28, 0.05, mat('#4f46e5', 'catatan', '#4f46e5'), -3.6, 2.65, Z0 + 0.05);

    box(3.4, 1.6, 0.1, trimM, BOARD.x, 1.85, Z0 + 0.05);
    box(3.2, 1.4, 0.04, mat('#f7f2ea', 'papan'), BOARD.x, 1.85, Z0 + 0.11);
    const noteColors = ['#ffd166', '#f3355b', '#7bdff2', '#b2f7ef', '#f7aef8', '#cdb4db', '#ffd166', '#7bdff2', '#4ade80'];
    const notes = noteColors.map((c, i) => {
      const n = box(0.46, 0.36, 0.02, mat(c, 'catatan', c), BOARD.x - 1.15 + (i % 5) * 0.57, 2.21 - Math.floor(i / 5) * 0.58, Z0 + 0.15);
      (n.material as MeshLambertMaterial).emissiveIntensity = K.selaluMalam ? 0.7 : 0.2;
      n.rotation.z = ((i * 37) % 7) / 60 - 0.05;
      return n;
    });
    box(2.0, 0.42, 0.72, mat('#5b4a72', 'sofa'), 3.0, 0.21, -9.8);
    box(2.0, 0.5, 0.18, mat('#3a2a5c', 'sofa'), 3.0, 0.62, -9.48);

    const whiteLineM = mat('#ffffff', 'kertas', '#ffffff');
    box(7.8, 0.015, 0.08, whiteLineM, 10.8, 0.015, -13.0);
    box(7.8, 0.015, 0.08, whiteLineM, 10.8, 0.015, -9.2);
    box(0.08, 0.015, 3.8, whiteLineM, 6.9, 0.015, -11.1);
    box(0.08, 0.015, 3.8, whiteLineM, 14.7, 0.015, -11.1);
    box(7.8, 0.015, 0.06, whiteLineM, 10.8, 0.015, -11.1);
    box(0.06, 0.015, 3.8, whiteLineM, 9.4, 0.015, -11.1);
    box(0.06, 0.015, 3.8, whiteLineM, 12.2, 0.015, -11.1);
    add(cyl(0.05, 0.05, 1.55, trimM), 10.8, 0.78, -13.05);
    add(cyl(0.05, 0.05, 1.55, trimM), 10.8, 0.78, -9.15);
    box(0.04, 0.06, 3.9, whiteLineM, 10.8, 1.48, -11.1);
    const netMat = K.simpan(new MeshStandardMaterial({ color: '#f8fafc', transparent: true, opacity: 0.45, roughness: 0.8 }));
    add(new Mesh(K.kotak(0.02, 0.65, 3.86, 'kain' as Peran), netMat), 10.8, 1.14, -11.1);
    const shuttlecock = add(cone(0.07, 0.14, whiteLineM), 10.8, 1.85, -11.1);
    shuttlecock.rotation.z = Math.PI / 2;

    for (const r of ROOMS.filter((x) => x.jenis === 'divisi')) {
      const rcx = (r.x0 + r.x1) / 2;
      const rcz = (r.z0 + r.z1) / 2;
      const rw = r.x1 - r.x0;
      const rd = r.z1 - r.z0;
      box(0.12, 1.0, rd - 0.4, wallSideM, r.x0 + 0.06, 0.5, rcz);
      box(0.12, 1.0, rd - 0.4, wallSideM, r.x1 - 0.06, 0.5, rcz);
      const doorZ = r.z1 < -1.5 ? r.z1 : r.z0;
      for (const side of [-1, 1]) {
        const segW = (rw - 2.4) / 2;
        const sx = rcx + side * (1.2 + segW / 2);
        box(segW, 0.85, 0.14, wallSideM, sx, 0.42, doorZ);
        box(segW + 0.04, 0.06, 0.18, woodM, sx, 0.87, doorZ);
      }
      box(1.8, 0.24, 0.04, mat(r.rug, 'catatan', r.rug), rcx - 1.9, 1.01, doorZ);
    }

    const voGlass = K.simpan(new MeshStandardMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.34, roughness: 0.15 }));
    box(1.3, 2.0, 0.06, trimM, -14.5, 1.0, 0.9);
    add(new Mesh(K.kotak(0.05, 1.9, 1.5, 'kaca'), voGlass), -13.85, 0.95, 1.65);
    add(cyl(0.03, 0.03, 1.2, trimM), -14.55, 0.6, 1.65);
    add(ball(0.07, mat('#f43f5e', 'neon', '#e11d48')), -14.5, 2.12, 0.9);

    box(4.8, 0.96, 0.72, woodM, -11.8, 0.48, 6.4);
    box(4.9, 0.08, 0.82, mat('#fef3c7', 'meja'), -11.8, 0.98, 6.4);
    box(0.55, 0.48, 0.42, trimM, -13.5, 1.24, 6.35);
    add(cyl(0.22, 0.22, 0.45, mat('#fb923c', 'kaca')), -12.5, 1.22, 6.35);
    box(1.4, 0.46, 0.48, mat('#bae6fd', 'kaca'), -11.0, 1.23, 6.35);
    for (const [tx, tz] of [
      [-12.6, 8.9],
      [-9.2, 8.9],
      [-5.6, 8.9],
      [-5.6, 6.8],
    ] as const) {
      add(cyl(0.62, 0.62, 0.07, mat('#ffffff', 'meja')), tx, 0.76, tz);
      add(cyl(0.08, 0.18, 0.74, trimM), tx, 0.37, tz);
      for (const [ox, oz] of [
        [-0.78, 0],
        [0.78, 0],
        [0, -0.78],
        [0, 0.78],
      ] as const) {
        add(cyl(0.2, 0.18, 0.44, mat('#f59e0b', 'kursi')), tx + ox, 0.22, tz + oz);
      }
    }

    box(10.6, 0.18, 4.0, mat('#f8fafc', 'batu'), 7.4, 0.08, 8.6);
    const poolWaterMat = K.simpan(
      new MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0284c7',
        emissiveIntensity: 0.28,
        roughness: 0.18,
        metalness: 0.1,
        transparent: true,
        opacity: 0.86,
      }),
    );
    const poolWater = add(new Mesh(K.kotak(10.0, 0.14, 3.4, 'air'), poolWaterMat), 7.4, 0.09, 8.6);
    const float1 = add(new Mesh(geo(new TorusGeometry(0.32, 0.11, 12, 24)), mat('#fb7185', 'neon', '#f43f5e')), 5.2, 0.19, 8.2);
    float1.rotation.x = Math.PI / 2;
    const float2 = add(new Mesh(geo(new TorusGeometry(0.3, 0.1, 12, 24)), mat('#facc15', 'neon', '#eab308')), 9.4, 0.19, 9.1);
    float2.rotation.x = Math.PI / 2;
    for (const [lx, lz, col] of [
      [-0.4, 7.0, '#f43f5e'],
      [-0.4, 8.6, '#3b82f6'],
      [-0.4, 10.2, '#f59e0b'],
    ] as const) {
      box(1.2, 0.24, 0.56, mat('#ffffff', 'kursi'), lx, 0.14, lz);
      box(0.35, 0.38, 0.56, mat(col, 'sofa'), lx - 0.42, 0.28, lz);
      add(cyl(0.03, 0.03, 1.85, trimM), lx - 0.3, 0.92, lz - 0.45);
      add(cone(0.85, 0.45, mat(col, 'kain' as Peran)), lx - 0.3, 1.85, lz - 0.45);
    }

    const glassM = mat('#bfe3ff', 'kaca', '#7fb8e6');
    for (const x of [-13.2, -9.2, -3.6, 7.8, 11.4, 14.0]) {
      box(1.7, 1.15, 0.06, trimM, x, 1.9, Z0 + 0.02);
      box(1.54, 1.0, 0.04, glassM, x, 1.9, Z0 + 0.05);
    }
    for (const z of [-10.8, -5.0, 2.0, 8.4]) {
      box(0.06, 1.1, 1.5, trimM, X0, 1.9, z);
      box(0.04, 0.96, 1.36, glassM, X0 + 0.03, 1.9, z);
    }

    const potM = mat('#c26b3b', 'pot');
    const leafM = mat('#3f9b4f', 'daun');
    const leaf2M = mat('#5bbf5e', 'daun');
    const plant = (x: number, z: number, s = 1) => {
      add(cyl(0.2 * s, 0.16 * s, 0.4 * s, potM), x, 0.2 * s, z);
      add(cone(0.34 * s, 0.9 * s, leafM), x, 0.85 * s, z);
      add(ball(0.26 * s, leaf2M), x + 0.12 * s, 0.7 * s, z + 0.1 * s);
    };
    plant(-14.7, 10.9, 1.2);
    plant(14.7, 10.9, 1.2);
    plant(14.7, 6.1, 1.1);
    plant(-7.9, -9.0, 1.0);

    const pendant: Mesh[] = [];
    for (const [x, z] of [
      [-11.4, -11.0],
      [-3.6, -11.0],
      [-11.5, -4.9],
      [-3.8, -4.9],
      [3.8, -4.9],
      [11.5, -4.9],
      [-11.5, 1.9],
      [-3.8, 1.9],
      [3.8, 1.9],
      [11.5, 1.9],
      [-8.8, 8.5],
    ] as const) {
      box(0.02, 0.9, 0.02, trimM, x, 3.25, z);
      pendant.push(add(cone(0.32, 0.3, mat('#271b3f', 'lampu', '#000000'), true), x, 2.7, z));
    }

    let grassM: (Material & { color: Color }) | null = null;
    const dunia: Dunia =
      K.dunia?.({
        scene,
        kantor,
        K,
        pasang: (g, m, x, y, z, induk = kantor) => {
          const me = new Mesh(g, m);
          me.position.set(x, y, z);
          induk.add(me);
          return me;
        },
      }) ?? {};
    const naik = dunia.tinggi ?? 0;
    kantor.position.y = naik;
    target.y += naik;

    if (cinematic && !dunia.gantiLuar) {
      const L = K.luar;
      const grassMat = mat('#8cc672', 'tanah');
      grassM = grassMat;
      const rad = Math.max(L.ukuran, 62);
      if (L.bentuk === 'bulat') add(cyl(rad / 2, rad / 2 + 0.45, 0.36, grassMat), 0, -0.82, 0);
      else box(rad, 0.2, rad, grassMat, 0, -0.78, 0);
      if (L.alas) box(rad + 0.9, 0.78, rad + 0.9, mat(L.alas, 'alas'), 0, -1.25, 0);
      const trunkM = mat('#7a4a2a', 'batang');
      const crownM = [mat('#4f9d4a', 'daun'), mat('#6dbb5a', 'daun'), mat('#f6a5c0', 'daun')];
      const tree = (x: number, z: number, s: number, c: number) => {
        add(cyl(0.12 * s, 0.16 * s, 1.0 * s, trunkM), x, -0.65 + 0.5 * s, z);
        add(ball(0.8 * s, crownM[c]!), x, -0.65 + 1.45 * s, z);
        add(ball(0.55 * s, crownM[c]!), x + 0.45 * s, -0.65 + 1.2 * s, z + 0.3 * s);
      };
      for (const [x, z, s2, c] of [
        [-19.5, -14.0, 1.4, 0],
        [-20.0, 0, 1.3, 1],
        [-19.2, 13.5, 1.5, 2],
        [0, -17.5, 1.5, 0],
        [19.5, -13.0, 1.4, 1],
        [20.0, 2.0, 1.3, 0],
        [18.8, 14.5, 1.4, 2],
        [0, 16.5, 1.3, 1],
      ] as const) {
        tree(x, z, s2, c);
      }
      if (L.awan) {
        const awanM = mat('#ffffff', 'awan');
        for (const [cx, cy, cz] of [
          [-14, 9.5, -18],
          [9, 10.0, -19],
          [20, 8.8, -10],
        ] as const) {
          add(ball(1.1, awanM), cx, cy, cz);
          add(ball(0.75, awanM), cx + 1.05, cy - 0.15, cz);
          add(ball(0.7, awanM), cx - 1.05, cy - 0.18, cz);
        }
      }
    }

    const legM = mat('#4b3b62', 'kaki');
    const chairM = mat('#3a2a5c', 'kursi');
    const shadowM = new MeshBasicMaterial({ color: '#1b1330', transparent: true, opacity: 0.14, depthWrite: false });
    disposables.push(shadowM);
    const nightLights = !!cinematic && !touch;
    const hk = 0.24 * (K.agen.kepala - 1);

    const torsoPts = [
      new Vector2(0, -0.22),
      new Vector2(0.155, -0.21),
      new Vector2(0.18, -0.1),
      new Vector2(0.168, 0.03),
      new Vector2(0.205, 0.16),
      new Vector2(0.145, 0.215),
      new Vector2(0.082, 0.245),
      new Vector2(0, 0.245),
    ];
    const sculptedTorsoGeo = sculptedHuman ? geo(new LatheGeometry(torsoPts, 22)) : null;
    const sculptedHeadGeo = sculptedHuman ? geo(new SphereGeometry(0.215, 24, 20)) : null;

    const actors: Actor[] = desks.map((d, i) => {
      const { x, z } = d.desk;
      const isOwner = d.agen.role === 'owner';
      const isExec = d.agen.role === 'ceo' || d.agen.role === 'manager';
      const deskW = isOwner ? 2.2 : isExec ? 1.65 : 1.38;
      const deskD = isOwner ? 0.92 : 0.76;
      const deskTop = box(deskW, 0.09, deskD, mat(isOwner ? '#78350f' : isExec ? '#6d4c41' : '#c9a27c', 'meja', '#000000'), x, 0.78, z);
      box(deskW - 0.12, 0.7, 0.05, legM, x, 0.38, isOwner ? z + 0.36 : z - 0.32);
      box(0.06, 0.74, deskD - 0.08, woodM, x - deskW / 2 + 0.06, 0.38, z);
      box(0.06, 0.74, deskD - 0.08, woodM, x + deskW / 2 - 0.06, 0.38, z);

      const monZ = isOwner ? z + 0.24 : z - 0.22;
      const scrZ = isOwner ? z + 0.21 : z - 0.19;
      box(isOwner ? 0.85 : 0.66, 0.46, 0.05, trimM, x - 0.05, 1.13, monZ);
      const screen = box(isOwner ? 0.78 : 0.6, 0.38, 0.01, mat('#1b1330', 'layar', '#000000'), x - 0.05, 1.13, scrZ);
      box(0.08, 0.16, 0.08, trimM, x - 0.05, 0.9, monZ);

      if (d.desk.room === 'visualizing' || d.desk.room === 'editing') {
        box(0.45, 0.36, 0.04, trimM, x + 0.46, 1.09, monZ + 0.05);
        box(0.4, 0.3, 0.01, mat('#0f172a', 'layar', '#38bdf8'), x + 0.46, 1.09, scrZ + 0.05);
      }

      if (isOwner) {
        box(0.75, 0.16, 0.12, goldM, x + 0.58, 0.88, z + 0.28);
      }

      box(0.52, 0.02, 0.18, mat('#efe9f6', 'kertas'), x - 0.05, 0.83, isOwner ? z - 0.12 : z + 0.08);
      add(cyl(0.06, 0.05, 0.12, mat(isOwner ? '#f59e0b' : d.desk.color, 'pot')), x + deskW / 2 - 0.22, 0.88, z + 0.12);
      const book = box(0.34, 0.06, 0.26, mat('#f3355b', 'buku'), x + 0.32, 0.86, z + 0.12);
      const lamp = add(ball(0.11, mat('#fff3b0', 'lampu', '#ffcf4d')), x - deskW / 2 + 0.2, 1.12, z - 0.12);
      box(0.04, 0.28, 0.04, trimM, x - deskW / 2 + 0.2, 0.96, z - 0.12);

      let light: PointLight | null = null;
      if (nightLights && (isOwner || isExec || i % 4 === 0)) {
        light = new PointLight(isOwner ? '#fde047' : '#ffb35c', 0, 5.8, 1.6);
        light.position.set(x, 1.6, z);
        kantor.add(light);
      }

      const chairZ = isOwner ? z - 0.76 : z + 0.75;
      const backZ = isOwner ? z - 1.05 : z + 1.03;
      const cMat = isOwner ? mat('#7c2d12', 'kursi') : chairM;
      box(isOwner ? 0.68 : 0.56, 0.09, 0.58, cMat, x, 0.5, chairZ);
      box(isOwner ? 0.68 : 0.56, isOwner ? 0.78 : 0.62, 0.09, cMat, x, isOwner ? 0.9 : 0.84, backZ);
      box(0.06, 0.46, 0.06, legM, x, 0.25, chairZ);
      const sh = add(new Mesh(geo(new CircleGeometry(isOwner ? 1.15 : 0.9, 20)), shadowM), x, 0.006, isOwner ? z - 0.3 : z + 0.3);
      sh.rotation.x = -Math.PI / 2;

      const root = new Group();
      const seat = new Vector3(x, 0, isOwner ? z - 0.72 : z + 0.72);
      const facingY = isOwner ? Math.PI : 0;
      root.position.copy(seat);
      root.rotation.y = facingY;

      const skinHex = isOwner ? '#f0c29e' : SKIN[i % SKIN.length]!;
      const hairHex = isOwner ? '#19142b' : HAIR[(i * 3 + 1) % HAIR.length]!;
      const shirt = mat(d.desk.color, 'baju');
      const pants = mat(isOwner ? '#0f172a' : i % 2 === 0 ? '#2b2340' : '#1e293b', 'celana');
      const skin = mat(skinHex, 'kulit');
      const hairMat = mat(hairHex, 'rambut');

      let body: Mesh;
      let head: Mesh;

      if (sculptedHuman && sculptedTorsoGeo && sculptedHeadGeo) {
        const outfitTex = K.simpan(makePixelOutfitTexture(d.desk.color, i, d.agen.role));
        const torsoMat = K.simpan(
          new MeshStandardMaterial({
            color: '#ffffff',
            map: outfitTex,
            roughness: 0.72,
            metalness: isOwner ? 0.12 : 0.04,
          }),
        );
        body = add(new Mesh(sculptedTorsoGeo, torsoMat), 0, 0.93, 0, root);
        body.scale.set(K.agen.badan, K.agen.badan, K.agen.badan * 0.88);

        const faceTex = K.simpan(makePixelFaceTexture(skinHex, hairHex, i, isOwner));
        const headMat = K.simpan(
          new MeshStandardMaterial({
            color: '#ffffff',
            map: faceTex,
            roughness: 0.66,
            metalness: 0.02,
          }),
        );
        head = add(new Mesh(sculptedHeadGeo, headMat), 0, 1.42 + hk, 0, root);
        head.scale.set(K.agen.kepala * 0.96, K.agen.kepala * 1.03, K.agen.kepala * 0.94);

        const earGeo = geo(new SphereGeometry(0.036, 10, 8));
        add(new Mesh(earGeo, skin), -0.205, -0.015, -0.005, head);
        add(new Mesh(earGeo, skin), 0.205, -0.015, -0.005, head);

        const hairCap = add(new Mesh(geo(new SphereGeometry(0.228, 20, 14, 0, Math.PI * 2, 0, Math.PI / 1.72)), hairMat), 0, 0.025, 0.018, head);
        hairCap.rotation.x = 0.34;
        const bangGeo = geo(new SphereGeometry(0.068, 12, 10));
        add(new Mesh(bangGeo, hairMat), -0.075, 0.145, -0.165, head).scale.set(1.2, 0.72, 0.7);
        add(new Mesh(bangGeo, hairMat), 0.065, 0.148, -0.168, head).scale.set(1.15, 0.68, 0.7);

        if (isOwner) {
          const crownMat = mat('#fbbf24', 'logam', '#f59e0b');
          add(new Mesh(geo(kotakBulat(0.22, 0.055, 0.22, 0.015, 3)), crownMat), 0, 0.245, 0, head);
          for (const [cx, cz] of [
            [-0.08, -0.08],
            [0.08, -0.08],
            [0, -0.09],
            [-0.08, 0.08],
            [0.08, 0.08],
          ] as const) {
            add(cone(0.028, 0.075, crownMat), cx, 0.3, cz, head);
          }
          root.scale.setScalar(1.07);
        } else if (d.desk.room === 'voiceover' || d.desk.room === 'editing') {
          const hsM = mat('#271b3f', 'logam');
          const glowM = mat('#c084fc', 'neon', '#a855f7');
          const cupGeo = geo(new SphereGeometry(0.052, 12, 10));
          add(new Mesh(cupGeo, hsM), -0.222, -0.005, -0.005, head).scale.set(0.55, 1.1, 1.1);
          add(new Mesh(cupGeo, hsM), 0.222, -0.005, -0.005, head).scale.set(0.55, 1.1, 1.1);
          add(new Mesh(geo(new SphereGeometry(0.02, 8, 6)), glowM), -0.236, -0.005, -0.005, head);
          add(new Mesh(geo(kotakBulat(0.45, 0.025, 0.035, 0.01, 2)), hsM), 0, 0.232, 0, head);
        } else if (d.desk.room === 'riset' || d.desk.room === 'visualizing' || isExec) {
          const frameM = mat('#1e1b2e', 'logam');
          const lensM = K.simpan(
            new MeshStandardMaterial({
              color: '#7bdff2',
              emissive: '#38bdf8',
              emissiveIntensity: 0.32,
              roughness: 0.15,
              transparent: true,
              opacity: 0.55,
            }),
          );
          const rimGeo = geo(kotakBulat(0.075, 0.048, 0.016, 0.014, 3));
          const lensGeo = geo(kotakBulat(0.062, 0.036, 0.018, 0.01, 2));
          add(new Mesh(rimGeo, frameM), -0.068, 0.012, -0.202, head);
          add(new Mesh(rimGeo, frameM), 0.068, 0.012, -0.202, head);
          add(new Mesh(lensGeo, lensM), -0.068, 0.012, -0.204, head);
          add(new Mesh(lensGeo, lensM), 0.068, 0.012, -0.204, head);
        } else if (d.desk.room === 'content' || d.desk.room === 'scripting') {
          add(new Mesh(geo(new SphereGeometry(0.105, 16, 12)), hairMat), 0, 0.135, 0.195, head);
          const pinM = mat('#ffd166', 'logam', '#f59e0b');
          add(new Mesh(geo(kotakBulat(0.055, 0.018, 0.018, 0.008, 2)), pinM), -0.14, 0.095, -0.135, head).rotation.z = 0.25;
        }
      } else {
        body = add(new Mesh(K.kapsul(0.23, 0.4, 'baju'), shirt), 0, 0.92, 0, root);
        body.scale.setScalar(K.agen.badan);
        head = add(ball(0.22, skin), 0, 1.42 + hk, 0, root);
        const hair = add(ball(0.235, hairMat, true), 0, 0.02, 0.02, head);
        hair.rotation.x = 0.35;
        head.scale.setScalar(K.agen.kepala);
      }

      const limb = (r: number, len: number, m: Material, px: number, py: number, isArm = false, isLeg = false) => {
        const g = K.kapsul(r, len, peranDari(m));
        g.translate(0, -len / 2 - r / 2, 0);
        const mesh = add(new Mesh(g, m), px, py, 0, root);
        if (sculptedHuman && isArm) {
          const hand = new Mesh(geo(new SphereGeometry(r * 0.88, 12, 10)), skin);
          hand.position.set(0, -len - r * 0.55, 0);
          mesh.add(hand);
        }
        if (sculptedHuman && isLeg) {
          const shoeMat = mat(isOwner ? '#1e293b' : '#f8fafc', 'kertas');
          const soleMat = mat('#334155', 'celana');
          const shoe = new Mesh(geo(kotakBulat(0.125, 0.072, 0.21, 0.032, 3)), shoeMat);
          shoe.position.set(0, -len - r * 0.55, -0.038);
          const sole = new Mesh(geo(kotakBulat(0.13, 0.024, 0.218, 0.01, 2)), soleMat);
          sole.position.set(0, -len - r * 0.55 - 0.028, -0.038);
          mesh.add(shoe, sole);
        }
        return mesh;
      };
      const armL = limb(0.068, 0.33, shirt, -0.285, 1.12, true, false);
      const armR = limb(0.068, 0.33, shirt, 0.285, 1.12, true, false);
      const legL = limb(0.084, 0.37, pants, -0.105, 0.62, false, true);
      const legR = limb(0.084, 0.37, pants, 0.105, 0.62, false, true);

      kantor.add(root);
      return {
        key: d.desk.key,
        room: d.desk.room,
        role: d.agen.role,
        root,
        body,
        head,
        armL,
        armR,
        legL,
        legR,
        screen,
        deskTop,
        book,
        lamp,
        light,
        seat,
        facingY,
        label: new Vector3(),
        phase: i * 1.37,
        index: i,
      };
    });

    let portrait = false;
    const fit = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      portrait = !!cinematic && aspect < 0.8;
      let halfW = (cinematic ? (portrait ? 10.5 : 17.5) : 18.0) * (dunia.lebar ?? 1);
      let halfH = halfW / aspect;
      const minH = (cinematic ? (portrait ? 6.8 : 11.5) : 12.0) * (dunia.lebar ?? 1);
      if (halfH < minH) {
        halfH = minH;
        halfW = halfH * aspect;
      }
      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.updateProjectionMatrix();
      live.current.dirty = true;
      redraw?.();
    };
    let redraw: (() => void) | null = null;
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const reduce = !manual && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SHOT = 4.2;
    const home = target.clone();
    const shotAim = (i: number, out: Vector3): number => {
      const fr = live.current.focusRoom;
      if (fr && fr !== 'all') {
        const rm = ROOMS.find((x) => x.key === fr);
        if (rm) {
          out.set((rm.x0 + rm.x1) / 2, 1.1 + naik, (rm.z0 + rm.z1) / 2);
          return portrait ? 2.1 : 1.95;
        }
      }
      if (i < 0 || i % 3 === 0 || !actors.length) {
        out.copy(home);
        return 1.0 * (dunia.zoomJauh ?? 1);
      }
      if (i % 3 === 1) {
        out.set(-11.4, 1.1 + naik, -11.0);
        return portrait ? 2.0 : 1.85;
      }
      const shown = actors.filter((x) => x.root.visible);
      const pick = (shown.length ? shown : actors)[(i * 5 + Math.floor(i / 2)) % (shown.length || actors.length)]!;
      out.set(pick.root.position.x, 1.1 + naik, pick.root.position.z);
      return portrait ? 1.85 : 1.75;
    };
    const aimA = new Vector3();
    const aimB = new Vector3();
    const look = new Vector3();
    const placeCamera = (t: number) => {
      const swing = reduce ? 0 : cinematic ? (portrait ? 0.12 : 0.24) * Math.sin(t * 0.16) : 0.03 * Math.sin(t * 0.15);
      const a = (portrait ? 1.1 : Math.PI / 4) + swing;
      let zoom = 1;
      look.copy(home);
      if (cinematic && !reduce) {
        const i = Math.floor(t / SHOT);
        const zA = shotAim(i - 1, aimA);
        const zB = shotAim(i, aimB);
        const f = Math.min(1, (t - i * SHOT) / 1.2);
        const e = f * f * (3 - 2 * f);
        look.copy(aimA).lerp(aimB, e);
        zoom = (zA + (zB - zA) * e) * (1 + 0.02 * Math.sin(t * 0.4));
      }
      camera.position.set(look.x + 32 * Math.sin(a), look.y + 24, look.z + 32 * Math.cos(a));
      camera.lookAt(look);
      if (camera.zoom !== zoom) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
      }
    };

    const proj = new Vector3();
    const place = (node: HTMLElement | null | undefined, at: Vector3) => {
      if (!node) return;
      proj.copy(at).project(camera);
      const x = ((proj.x + 1) / 2) * el.clientWidth;
      const y = ((1 - proj.y) / 2) * el.clientHeight;
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };
    const boardAt = new Vector3(BOARD.x, 2.85 + naik, Z0 + 0.1);
    const labelAt = new Vector3();
    const dest = new Vector3();
    const pos = new Vector3();
    const ahead = new Vector3();

    let lastNight: boolean | null = null;
    const applyState = (t: number) => {
      const { desks: list, boardCount: count } = live.current;
      const isNight = live.current.night || !!K.selaluMalam;
      if (isNight !== lastNight) {
        lastNight = isNight;
        const w = K.warna;
        hemi.intensity = isNight ? 0.35 * (K.selaluMalam ? 2.4 : 1) : C.kuat;
        hemi.color.set(isNight ? (K.selaluMalam ? C.langit : '#7d8cff') : C.langit);
        sun.intensity = isNight ? 0.15 * (K.selaluMalam ? 3 : 1) : C.mKuat;
        sun.color.set(isNight ? '#8fa2ff' : C.matahari);
        amb.intensity = isNight ? 0.22 : 0.42;
        glassM.color.set(w(isNight ? '#18204a' : '#bfe3ff', 'kaca'));
        glassM.emissive.set(isNight ? '#10173a' : '#7fb8e6');
        for (const f of floors) f.m.color.set(w(isNight ? f.r.floorNight : f.r.floor, 'lantai'));
        hallM.color.set(w(isNight ? '#2b2438' : '#efe4d4', 'lantai'));
        grassM?.color.set(w(isNight ? '#2c4a33' : '#8cc672', 'tanah'));
        lineM.color.set(w(isNight ? '#3c3029' : '#cdb79c', 'garis'));
        for (const p of pendant) (p.material as MeshLambertMaterial).emissive.set(isNight ? '#ffb35c' : '#000000');
        if (scene.fog && K.kabut) (scene.fog as Fog).color.set(isNight ? K.kabut[1] : K.kabut[0]);
        dunia.malam?.(isNight);
      }

      poolWater.position.y = 0.09 + 0.015 * Math.sin(t * 3.2);
      float1.position.x = 5.2 + 0.25 * Math.sin(t * 1.1);
      float1.position.z = 8.2 + 0.18 * Math.cos(t * 0.9);
      float2.position.x = 9.4 + 0.22 * Math.cos(t * 1.0);
      float2.position.z = 9.1 + 0.2 * Math.sin(t * 1.2);
      shuttlecock.position.x = 10.8 + 2.1 * Math.sin(t * 3.4);
      shuttlecock.position.y = 1.65 + 0.55 * Math.abs(Math.cos(t * 3.4));
      shuttlecock.rotation.z = Math.cos(t * 3.4) > 0 ? Math.PI / 2 : -Math.PI / 2;

      notes.forEach((n, i) => (n.visible = i < count));

      for (const a of actors) {
        const d = list.find((x) => x.desk.key === a.key);
        const act = d?.doing.activity ?? 'pulang';
        const away = act === 'pulang';
        a.root.visible = !away;
        const busy = act === 'kerja' || act === 'laporan';
        const sm = a.screen.material as MeshLambertMaterial;
        sm.emissive.set(
          busy
            ? act === 'laporan'
              ? '#fbbf24'
              : '#66e3a5'
            : act === 'belajar'
              ? '#ffd166'
              : act === 'istirahat'
                ? '#38bdf8'
                : '#5b4a92',
        );
        sm.emissiveIntensity = busy ? 0.85 + (reduce ? 0 : 0.2 * Math.sin(t * 9 + a.phase)) : 0.55;
        a.book.visible = act === 'belajar';
        const lampOn = act === 'belajar' || (isNight && !away);
        a.lamp.visible = lampOn;
        if (a.light) a.light.intensity = lampOn && isNight ? 2.2 : 0;

        const dm = a.deskTop.material as MeshLambertMaterial;
        if (d?.urgent.length || d?.needsAcc) {
          dm.emissive.set(d?.urgent.length ? '#f3355b' : '#f59e0b');
          dm.emissiveIntensity = reduce ? 0.35 : 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 5));
        } else {
          dm.emissiveIntensity = 0;
        }

        let k = 0;
        let walking = false;
        let spot: IdleSpot = 'meja';
        let slot = a.index;
        if (d && cinematic && !reduce) {
          const mv = moveTargetAt(d, t);
          k = mv.k;
          walking = mv.walking;
          spot = mv.spot;
          slot = mv.slot;
        }

        const standing = k > 0;
        let targetRotY = a.facingY;
        let yOffset = 0;
        let inPool = false;

        if (spot === 'owner') {
          const col = slot % 5;
          const row = Math.floor(slot / 5);
          dest.set(-13.2 + col * 0.9, 0, -10.1 + row * 0.72);
          targetRotY = 0;
        } else if (spot === 'kantin') {
          const tableCoords = [
            [-12.6, 8.1],
            [-9.2, 8.1],
            [-5.6, 8.1],
            [-5.6, 7.5],
            [-11.8, 7.2],
            [-10.2, 7.2],
          ] as const;
          const tc = tableCoords[slot % tableCoords.length]!;
          dest.set(tc[0] + ((slot % 2) * 0.6 - 0.3), 0, tc[1]);
          targetRotY = Math.PI;
        } else if (spot === 'kolam') {
          const isSwimmer = slot % 2 === 0;
          if (isSwimmer) {
            const swimIdx = Math.floor(slot / 2);
            dest.set(3.4 + (swimIdx % 5) * 1.8, 0, 7.7 + Math.floor(swimIdx / 5) * 1.5);
            inPool = k > 0.85;
            yOffset = inPool ? -0.34 + 0.04 * Math.sin(t * 4 + a.phase) : 0;
            targetRotY = Math.sin(t * 0.8 + a.phase);
          } else {
            const loungeIdx = Math.floor(slot / 2) % 3;
            dest.set(0.25, 0, 7.0 + loungeIdx * 1.6);
            targetRotY = -Math.PI / 2;
          }
        } else if (spot === 'badminton') {
          const side = slot % 2 === 0 ? -1 : 1;
          const lane = Math.floor(slot / 2) % 3;
          dest.set(10.8 + side * 2.1, 0, -12.2 + lane * 1.1);
          targetRotY = side < 0 ? -Math.PI / 2 : Math.PI / 2;
        } else if (spot === 'lounge') {
          dest.set(1.8 + (slot % 4) * 0.65, 0, -10.2);
          targetRotY = Math.PI;
        } else {
          dest.copy(a.seat);
          targetRotY = a.facingY;
        }

        const waypoints = computeWaypoints(a.seat, dest);
        samplePath(waypoints, k, pos);
        a.root.position.set(pos.x, yOffset, pos.z);

        const sitting = !standing || (spot === 'kantin' && k === 1 && slot % 3 === 0);
        if (standing && walking) {
          samplePath(waypoints, Math.min(1, k + 0.02), ahead);
          const dx = ahead.x - pos.x;
          const dz = ahead.z - pos.z;
          if (dx * dx + dz * dz > 1e-8) a.root.rotation.set(0, Math.atan2(-dx, -dz), 0);
        } else {
          a.root.rotation.set(0, targetRotY, 0);
        }

        a.label.set(pos.x, (standing && !sitting ? 1.95 : cinematic ? 1.75 : 2.1) + hk * 2 + yOffset, pos.z);

        if (reduce) continue;
        const s = Math.sin(t * 9 + a.phase);
        if (inPool) {
          a.legL.visible = a.legR.visible = false;
          a.body.position.y = 0.92;
          a.head.position.y = 1.42 + hk;
          a.armL.position.y = a.armR.position.y = 1.12;
          a.armL.rotation.set(-1.3 + 0.7 * Math.sin(t * 5 + a.phase), 0, 0.35);
          a.armR.rotation.set(-1.3 - 0.7 * Math.sin(t * 5 + a.phase), 0, -0.35);
          a.head.rotation.set(-0.1, 0.25 * Math.sin(t * 2 + a.phase), 0);
        } else {
          a.legL.visible = a.legR.visible = true;
          if (!sitting) {
            const bob = walking ? 0.03 * Math.abs(s) : 0;
            a.body.position.y = 0.98 + bob;
            a.head.position.y = 1.48 + hk + bob;
            a.armL.position.y = a.armR.position.y = 1.18 + bob;
            a.legL.position.y = a.legR.position.y = 0.7;
            if (spot === 'badminton' && !walking) {
              const swing = Math.sin(t * 5.5 + a.phase);
              a.legL.rotation.set(0.25 * swing, 0, 0);
              a.legR.rotation.set(-0.25 * swing, 0, 0);
              a.armR.rotation.set(-1.6 + 1.1 * swing, 0, -0.2);
              a.armL.rotation.set(-0.3, 0, 0.25);
              a.head.rotation.set(-0.25, 0, 0);
            } else {
              a.legL.rotation.set(walking ? 0.6 * s : 0, 0, 0);
              a.legR.rotation.set(walking ? -0.6 * s : 0, 0, 0);
              a.armL.rotation.set(walking ? -0.5 * s : spot === 'owner' ? -0.35 : 0, 0, 0.08);
              a.armR.rotation.set(walking ? 0.5 * s : spot === 'owner' ? -0.35 : 0, 0, -0.08);
              a.head.rotation.set(walking ? 0 : -0.1, 0, 0);
            }
          } else {
            a.legL.position.y = a.legR.position.y = 0.62;
            a.legL.rotation.set(-1.4, 0, 0);
            a.legR.rotation.set(-1.4, 0, 0);
            a.body.position.y = 0.92;
            a.head.position.y = 1.42 + hk;
            a.armL.position.y = a.armR.position.y = 1.12;
            if (busy) {
              a.armL.rotation.set(-1.15 + 0.12 * Math.sin(t * 16 + a.phase), 0, 0.1);
              a.armR.rotation.set(-1.15 + 0.12 * Math.sin(t * 16 + a.phase + 2), 0, -0.1);
              a.body.position.y = 0.92 + 0.012 * Math.abs(s);
              a.head.rotation.set(0.1 + 0.04 * Math.sin(t * 3 + a.phase), 0.08 * Math.sin(t * 1.3 + a.phase), 0);
            } else if (act === 'belajar') {
              a.armL.rotation.set(-0.9, 0, 0.2);
              a.armR.rotation.set(-0.9 + 0.2 * Math.max(0, Math.sin(t * 0.8 + a.phase)), 0, -0.2);
              a.head.rotation.set(0.38 + 0.04 * Math.sin(t * 1.2 + a.phase), 0.32, 0);
            } else {
              a.armL.rotation.set(-0.5, 0, 0.12);
              a.armR.rotation.set(-0.5, 0, -0.12);
              a.body.position.y = 0.92 + 0.01 * Math.sin(t * 1.6 + a.phase);
              a.head.rotation.set(0, 0.5 * Math.sin(t * 0.4 + a.phase), 0);
            }
          }
        }
      }
    };

    const draw = (t: number) => {
      placeCamera(t);
      applyState(t);

      const pScale = live.current.pixelScale ?? K.pixelSize ?? 1;
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;

      if (pScale > 1.05 && w > 8 && h > 8) {
        const rw = Math.max(1, Math.floor(w / pScale));
        const rh = Math.max(1, Math.floor(h / pScale));
        if (!pixelRT || pixelRT.width !== rw || pixelRT.height !== rh) {
          pixelRT?.dispose();
          pixelRT = new WebGLRenderTarget(rw, rh, {
            minFilter: NearestFilter,
            magFilter: NearestFilter,
          });
          blitMat.map = pixelRT.texture;
          blitMat.needsUpdate = true;
        }
        renderer.setRenderTarget(pixelRT);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(blitScene, blitCam);
      } else {
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
      }

      for (const a of actors) place(anchors.current?.get(a.key), labelAt.set(a.label.x, a.label.y + naik, a.label.z));
      place(boardAnchor.current, boardAt);
      live.current.dirty = false;
    };

    let lastT = 0;
    if (drive) drive.current = (t: number) => draw((lastT = t));
    if (manual) redraw = () => draw(lastT);

    let raf = 0;
    let running = true;
    let visible = true;
    let last = 0;
    const minGap = touch ? 1000 / 30 : 0;
    const start = performance.now();
    const frame = (now: number) => {
      raf = 0;
      if (!running || !visible || document.hidden) return;
      if (now - last >= minGap) {
        last = now;
        draw((now - start) / 1000);
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!manual && !raf && running) raf = requestAnimationFrame(frame);
    };
    const poll = reduce ? window.setInterval(() => live.current.dirty && kick(), 250) : 0;
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible) kick();
    });
    io.observe(el);
    const onVis = () => !document.hidden && kick();
    document.addEventListener('visibilitychange', onVis);
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      onFail?.();
    });
    if (manual) draw(0);
    kick();
    onReady?.();

    return () => {
      running = false;
      if (drive) drive.current = null;
      if (raf) cancelAnimationFrame(raf);
      window.clearInterval(poll);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      pixelRT?.dispose();
      for (const d of disposables) d.dispose();
      K.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [desks.map((d) => d.desk.key).join(','), cinematic, manual, gaya]);

  return <div ref={host} className="ko-canvas" />;
}
