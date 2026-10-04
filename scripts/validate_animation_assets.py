#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
characters=['arjun','david','valeria']
actions=['idle','walk_forward','walk_backward','crouch','light_punch','heavy_punch','light_kick','heavy_kick','special_1','special_2','special_3','special_4','jump','block','hurt_high','hurt_low','knockdown','ko']
failed=[]
def local_asset(url):
    return ROOT / 'public' / url.lstrip('/').replace('assets/','assets/',1)
for cid in characters:
    p=ROOT/'public/assets/characters'/cid/'actions/actions.json'
    if not p.exists(): failed.append(f'{cid}: missing actions.json'); continue
    data=json.loads(p.read_text())
    for action in actions:
        clip=data['actions'].get(action)
        if not clip: failed.append(f'{cid}: missing {action}'); continue
        if not local_asset(clip['image']).exists(): failed.append(f'{cid}: missing png {action}')
        if not local_asset(clip['gif']).exists(): failed.append(f'{cid}: missing gif {action}')
        if not clip['frames']: failed.append(f'{cid}: no frames {action}')
print('=== Animation Asset Validation ===')
print(f'checked characters: {len(characters)}')
print(f'checked actions/character: {len(actions)}')
if failed:
    for f in failed: print('FAIL |',f)
    raise SystemExit(1)
print('PASS | all sample action contracts complete')
