import { buatKitDasar, type KitGaya } from './alat';

export function kitPixelHuman(): KitGaya {
  return buatKitDasar({
    humanStyle: 'sculpted-pixel',
    pixelSize: 2.5,
    kabut: ['#ece0ce', '#12162b'],
    agen: { kepala: 1.18, badan: 1.0 },
    luar: { bentuk: 'bulat', ukuran: 62, alas: '#3c2d5c', awan: true },
    cahaya: { langit: '#fff8ee', bumi: '#b39579', kuat: 1.48, matahari: '#ffe6c4', mKuat: 1.85 },
  });
}
