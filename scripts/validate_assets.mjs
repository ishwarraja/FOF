import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const candidates = [
  'public/assets/characters/arjun/fighter_cutout.png',
  'public/assets/characters/david/fighter_cutout.png',
  'public/assets/characters/steele/fighter_cutout.png',
  'public/assets/characters/arjun/arjun_combat_preview.gif',
  'public/stages/png/stage_metro_rain.png',
  'public/stages/png/stage_riverfront_sunset.png',
  'public/stages/png/stage_sky_observatory.png',
  'public/stages/png/stage_bioluminescent_ruins.png',
];
let ok = true;
for (const rel of candidates) {
  const exists = fs.existsSync(path.join(root, rel));
  console.log(`${exists ? 'PASS' : 'FAIL'} ${rel}`);
  if (!exists) ok = false;
}
for (const cid of ['arjun','david','valeria']) {
  const manifest = path.join(root, 'public/assets/characters', cid, 'actions/actions.json');
  const exists = fs.existsSync(manifest);
  console.log(`${exists ? 'PASS' : 'FAIL'} ${manifest}`);
  if (!exists) ok = false;
}
process.exitCode = ok ? 0 : 1;
