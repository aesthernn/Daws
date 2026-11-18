// Tes logika Dawning Project: Owner Arkan + CEO + Manajer + 8 Divisi + ACC + Istirahat: node scripts/test.mjs
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const O = (await runnerImport(path.join(root, 'src/office.ts'), { root, configFile: false, cacheDir: path.join(os.tmpdir(), 'kantor-vite'), logLevel: 'error' })).module;
const C = (await runnerImport(path.join(root, 'src/config.ts'), { root, configFile: false, cacheDir: path.join(os.tmpdir(), 'kantor-vite'), logLevel: 'error' })).module;

let n = 0;
const t = (name, fn) => {
  fn();
  n++;
};

t('Dawning Project: Owner Arkan + CEO + Manajer + 32 agen lintas 8 divisi', () => {
  assert.equal(C.KANTOR.nama, 'Dawning Project');
  assert.equal(C.AGEN.length, 35);
  assert.equal(C.AGEN.find((a) => a.key === 'arkan')?.role, 'owner');
  assert.equal(C.AGEN.find((a) => a.key === 'revan')?.role, 'ceo');
  assert.equal(C.AGEN.find((a) => a.key === 'nadia_mgr')?.role, 'manager');
  for (const div of ['riset', 'content', 'scripting', 'visualizing', 'voiceover', 'editing', 'upload', 'marketing']) {
    assert.ok(C.RUANGAN.some((r) => r.key === div), `Divisi ${div} harus ada`);
  }
});

t('aturan wajib ACC Arkan untuk CEO, Manajer & 8 Divisi sebelum bekerja', () => {
  const belumAcc = O.officeDesks(1, '10:00', true, C.KEPUTUSAN_AWAL, 'kerja');
  assert.equal(belumAcc.find((d) => d.agen.key === 'revan')?.doing.activity, 'laporan');
  assert.equal(belumAcc.find((d) => d.agen.key === 'melodi')?.doing.activity, 'laporan');

  const sudahAccList = C.KEPUTUSAN_AWAL.map((k) => ({ ...k, status: 'di_acc' }));
  const sudahAcc = O.officeDesks(1, '10:00', true, sudahAccList, 'kerja');
  assert.equal(sudahAcc.find((d) => d.agen.key === 'revan')?.doing.activity, 'kerja');
  assert.equal(sudahAcc.find((d) => d.agen.key === 'melodi')?.doing.activity, 'kerja');
});

t('istirahat setelah kerja mengarahkan kru ke kantin, kolam renang & badminton', () => {
  const desks = O.officeDesks(1, '16:30', true, [], 'istirahat');
  const spots = new Set(desks.filter((d) => d.agen.role !== 'owner').map((d) => O.moveTargetAt(d, 5).spot));
  assert.ok(spots.has('kantin'));
  assert.ok(spots.has('kolam'));
  assert.ok(spots.has('badminton'));
});

console.log(`${n} tes lulus`);
