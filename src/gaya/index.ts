import { buatKitDasar, type KitGaya } from './alat';
import { kitPixelHuman } from './pixelhuman';

export function buatKitGaya(gaya?: string): KitGaya {
  switch (gaya) {
    case 'cozy':
      return buatKitDasar({
        humanStyle: 'sculpted-pixel',
        pixelSize: 1,
        agen: { kepala: 1.14, badan: 1.0 },
        luar: { bentuk: 'bulat', ukuran: 62, alas: '#5c3d2e', awan: true },
        cahaya: { langit: '#fff3e0', bumi: '#c49a6c', kuat: 1.52, matahari: '#ffd8a8', mKuat: 1.9 },
      });
    case 'neon':
      return buatKitDasar({
        humanStyle: 'sculpted-pixel',
        pixelSize: 1.5,
        selaluMalam: true,
        kabut: ['#141836', '#090d16'],
        agen: { kepala: 1.16, badan: 1.0 },
        luar: { bentuk: 'bulat', ukuran: 62, alas: '#1e1b4b', awan: false },
        cahaya: { langit: '#818cf8', bumi: '#312e81', kuat: 1.1, matahari: '#6366f1', mKuat: 1.1 },
      });
    case 'minimal':
      return buatKitDasar({
        humanStyle: 'capsule',
        pixelSize: 1,
        kabut: null,
        agen: { kepala: 1.1, badan: 0.98 },
        luar: { bentuk: 'kotak', ukuran: 62, alas: '#334155', awan: false },
      });
    case 'pixelhuman':
    default:
      return kitPixelHuman();
  }
}
