import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { RUANGAN, type RoomKey } from './config';
import { buatKitGaya } from './gaya';
import { type Peran } from './gaya/alat';
import { moveTargetAt, type DeskState } from './office';

const shade = (hex: string, f: number) => {
  const c = new Color(hex);
  c.multiplyScalar(1 - f);
  return '#' + c.getHexString();
};

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

export function mountOffice(container: HTMLElement, props: SceneProps) {
  let { desks, night, boardCount, anchors, boardAnchor, cinematic, manual, drive, onReady, onFail, gaya, pixelScale, focusRoom = 'all' } = props;

  const K = buatKitGaya(gaya);
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, width / height, 0.1, 1000);
  camera.position.set(0, 28, 35);
  camera.lookAt(0, 0, 0);

  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const kantor = new Group();
  scene.add(kantor);

  // Materials & Helpers
  const mat = (color: string, peran: Peran) => K.bahan(color, peran);
  const box = (w: number, h: number, d: number, m: MeshLambertMaterial, x: number, y: number, z: number) => {
    const mesh = new Mesh(K.kotak(w, h, d, m.userData.peran), m);
    mesh.position.set(x, y, z);
    kantor.add(mesh);
    return mesh;
  };

  // Build Floors
  ROOMS.forEach((r) => {
    const m = mat(r.floor, 'lantai');
    const rw = r.x1 - r.x0;
    const rd = r.z1 - r.z0;
    const rcx = (r.x0 + r.x1) / 2;
    const rcz = (r.z0 + r.z1) / 2;
    box(rw - 0.08, 0.15, rd - 0.08, m, rcx, -0.068, rcz);
  });

  const wallM = mat('#fbf6ef', 'dinding');
  const wallSideM = mat('#f1e8dc', 'dinding');
  box(W, 3.2, 0.18, wallM, CX, 1.6, Z0 - 0.09);
  box(0.18, 3.2, D, wallSideM, X0 - 0.09, 1.6, CZ);

  // Lighting
  const ambient = new AmbientLight('#fff8ee', 1.2);
  scene.add(ambient);

  const sun = new DirectionalLight('#ffe6c4', 1.5);
  sun.position.set(20, 30, 20);
  scene.add(sun);

  // Animation Loop untuk menggerakkan elemen kantor
  let rafId = 0;
  const draw = (t: number) => {
    renderer.render(scene, camera);
  };

  const loop = (t: number) => {
    draw(t);
    rafId = requestAnimationFrame(loop);
  };

  if (drive) {
    drive.current = (t: number) => draw(t);
  }
  
  if (!manual) {
    rafId = requestAnimationFrame(loop);
  } else {
    draw(0);
  }

  onReady?.();

  return () => {
    cancelAnimationFrame(rafId);
    renderer.dispose();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  };
}
