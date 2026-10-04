#!/usr/bin/env python3
"""Generate deterministic development-grade 2.5D fighter action atlases.

The generator intentionally produces *distinct frame sequences* from the supplied
full-body character artwork. It is a production pipeline scaffold, not a claim
that procedural transforms replace hand-authored/rigged AAA animation.

Inputs:
  FOF_character_specs.json
  FOF_special_move_matrix.csv

Outputs per character:
  public/assets/characters/<id>/actions/*.png
  public/assets/characters/<id>/actions/*.gif
  public/assets/characters/<id>/actions/actions.json
  public/assets/characters/<id>/actions/manifest.json

Usage:
  python3 scripts/generate_action_sprites.py --clean --zip
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import re
import shutil
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SPECS = ROOT / "FOF_character_specs.json"
MOVES = ROOT / "FOF_special_move_matrix.csv"
OUT = ROOT / "public/assets/characters"
FRAME_W = 256
FRAME_H = 448
FPS = 60

ACTIONS = {
    "idle": (8, True, None),
    "walk_forward": (8, True, None),
    "walk_backward": (8, True, None),
    "crouch": (5, True, None),
    "light_punch": (9, False, (3, 5)),
    "heavy_punch": (13, False, (5, 8)),
    "light_kick": (9, False, (3, 5)),
    "heavy_kick": (14, False, (5, 9)),
    "special_1": (15, False, (5, 9)),
    "special_2": (17, False, (6, 10)),
    "special_3": (16, False, (6, 10)),
    "special_4": (24, False, (8, 15)),
    "jump": (10, False, (4, 6)),
    "block": (7, True, None),
    "hurt_high": (8, False, None),
    "hurt_low": (8, False, None),
    "knockdown": (13, False, None),
    "ko": (18, False, None),
}

@dataclass
class Character:
    name: str
    cid: str
    palette: List[str]
    model: str


def slug(name: str) -> str:
    s = name.lower().replace("“", "").replace("”", "")
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    replacements = {"arjun_rao":"arjun", "alexandra_moreau":"alexandra", "leo_martin":"leo", "maya_sen":"maya", "dr_elena_voss": "elena", "rafael_rafe_torres": "rafe", "david_kim":"david", "dr_amara_okafor": "amara", "commander_jonas_reed": "jonas", "victor_kane":"victor"}
    return replacements.get(s, s)


def load_specs() -> List[Character]:
    data = json.loads(SPECS.read_text(encoding="utf-8"))
    result = []
    for row in data:
        result.append(Character(row["name"], slug(row["name"]), row.get("palette", []), row.get("model", "")))
    # Runtime boss used by the shipped default match.
    if not any(c.cid == "valeria" for c in result):
        result.append(Character("Valeria", "valeria", ["#22d3ee", "#0f172a", "#1e1b4b"], "Cybernetic fighter"))
    return result


def load_move_counts() -> Dict[str, int]:
    counts: Dict[str, int] = {}
    with MOVES.open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            counts[row["Fighter"]] = int(row["Special Count"] or 0)
    return counts


def find_base(character: Character) -> Path | None:
    d = OUT / character.cid
    candidates = [d / "fighter_cutout.png", d / "portrait.png", d / "portrait.jpeg", d / "portrait.jpg", d / "icon.jpeg"]
    for p in candidates:
        if p.exists():
            try:
                with Image.open(p) as probe:
                    probe.verify()
                return p
            except Exception:
                pass
    # SVG is handled by CairoSVG when available.
    svgs = [d / "portrait.svg", d / "texture_albedo.svg"]
    for p in svgs:
        if p.exists():
            try:
                import cairosvg
                target = d / "generated_source.png"
                cairosvg.svg2png(url=str(p), write_to=str(target), output_width=FRAME_W, output_height=FRAME_H)
                return target
            except Exception:
                pass
    return None


def fit_subject(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    # Remove opaque dark backgrounds common in supplied concept renders.
    if im.getextrema()[3][0] < 255:
        return im
    bg = Image.new("RGBA", im.size, im.getpixel((0, 0)))
    diff = ImageChops.difference(im, bg).convert("L")
    mask = diff.point(lambda p: 255 if p > 18 else 0).filter(ImageFilter.GaussianBlur(0.6))
    rgba = im.copy(); rgba.putalpha(mask)
    return rgba


def fit_canvas(base: Image.Image) -> Image.Image:
    base = fit_subject(base)
    bbox = base.getbbox()
    if bbox:
        base = base.crop(bbox)
    scale = min((FRAME_W * 0.82) / max(1, base.width), (FRAME_H * 0.90) / max(1, base.height))
    base = base.resize((max(1, int(base.width * scale)), max(1, int(base.height * scale))), Image.Resampling.BILINEAR)
    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    canvas.alpha_composite(base, ((FRAME_W - base.width) // 2, FRAME_H - base.height - 18))
    return canvas


def phase_for(action: str, frame: int, count: int, active: Tuple[int, int] | None) -> str:
    if active is None:
        return "loop" if ACTIONS[action][1] else "recovery"
    s, e = active
    if frame < s: return "startup"
    if frame < e: return "active"
    return "recovery"


def action_frame(base: Image.Image, action: str, frame: int, count: int, palette: List[str]) -> Image.Image:
    t = frame / max(1, count - 1)
    im = base.copy()
    # Stable anticipation/recovery motion rather than one frozen card.
    angle = 0.0
    dx = 0
    dy = 0
    sx = 1.0
    sy = 1.0
    if action == "idle":
        dy = int(math.sin(t * math.tau) * 4)
        angle = math.sin(t * math.tau) * 1.0
    elif action == "walk_forward":
        dx = int(math.sin(t * math.tau) * 9)
        dy = int(abs(math.sin(t * math.tau)) * -7)
        angle = math.sin(t * math.tau) * -2.2
        sx = 1.0 + 0.015 * math.sin(t * math.tau)
    elif action == "walk_backward":
        dx = int(math.sin(t * math.tau) * -9)
        dy = int(abs(math.sin(t * math.tau)) * -5)
        angle = math.sin(t * math.tau) * 1.8
    elif action == "crouch":
        dy = 38; sy = 0.82; sx = 1.08; angle = 6
    elif action == "light_punch":
        p = math.sin(math.pi * min(1, t * 1.4))
        dx = int(30 * p); sx = 1 + 0.03 * p; angle = -5 * p
    elif action == "heavy_punch":
        p = math.sin(math.pi * min(1, t * 1.15))
        dx = int(46 * p); sx = 1 + 0.07 * p; angle = -10 * p
        dy = int(-8 * p)
    elif action == "light_kick":
        p = math.sin(math.pi * min(1, t * 1.35))
        dx = int(25 * p); sx = 1 + 0.04 * p; angle = -7 * p
    elif action == "heavy_kick":
        p = math.sin(math.pi * min(1, t * 1.15))
        dx = int(42 * p); sx = 1 + 0.08 * p; angle = -15 * p; dy = int(-18 * p)
    elif action.startswith("special_"):
        p = math.sin(math.pi * min(1, t * 1.05))
        dx = int(50 * p); dy = int(-12 * p); sx = 1 + 0.10 * p; sy = 1 + 0.05 * p; angle = -8 * p
    elif action == "special_4":
        p = math.sin(math.pi * min(1, t))
        dx = int(64 * p); dy = int(-20 * p); sx = 1 + 0.16 * p; sy = 1 + 0.10 * p
    elif action == "jump":
        arc = math.sin(math.pi * t)
        dy = int(-105 * arc); sx = 1 - 0.05 * arc; sy = 1 + 0.04 * arc; angle = -3 * math.sin(t * math.tau)
    elif action == "block":
        sx = 0.96; sy = 1.02; dx = -int(5 * math.sin(t * math.pi))
    elif action == "hurt_high":
        p = math.sin(math.pi * t); dx = -int(35 * p); angle = 12 * p; sx = 1 - 0.03 * p
    elif action == "hurt_low":
        p = math.sin(math.pi * t); dx = -int(28 * p); dy = int(15 * p); angle = 18 * p; sy = 0.94
    elif action == "knockdown":
        p = min(1, t * 1.4); dx = -int(52 * p); dy = int(100 * p); angle = 75 * p; sy = 1 - 0.22 * p; sx = 1 + 0.08 * p
    elif action == "ko":
        p = min(1, t * 1.2); dx = -int(30 * p); dy = int(115 * p); angle = 78 * p; sy = 1 - 0.34 * p; sx = 1.02

    # Transform around the feet to preserve a believable ground anchor.
    transformed = im.resize((int(FRAME_W * sx), int(FRAME_H * sy)), Image.Resampling.BICUBIC)
    transformed = transformed.rotate(angle, resample=Image.Resampling.BILINEAR, expand=True, center=(transformed.width // 2, max(1, transformed.height - 50)))
    out = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = (FRAME_W - transformed.width) // 2 + dx
    y = FRAME_H - transformed.height - 18 + dy
    out.alpha_composite(transformed, (x, y))

    # Action-specific impact language: subtle, not a replacement for hand-authored VFX.
    if action in {"light_punch", "heavy_punch", "light_kick", "heavy_kick", "special_1", "special_2", "special_3", "special_4"}:
        active = ACTIONS[action][2]
        if active and active[0] <= frame < active[1]:
            accent = palette[0] if palette else "#f59e0b"
            draw = ImageDraw.Draw(out, "RGBA")
            if "kick" in action:
                y0 = int(FRAME_H * 0.54)
            else:
                y0 = int(FRAME_H * 0.37)
            for k in range(3):
                x0 = int(FRAME_W * 0.54) + k * 10
                draw.line((x0, y0 + k * 8, x0 + 70, y0 - 10 + k * 8), fill=accent + "CC", width=max(3, 7 - k))
            if action.startswith("special_"):
                glow = Image.new("RGBA", out.size, (0, 0, 0, 0))
                gd = ImageDraw.Draw(glow, "RGBA")
                gd.ellipse((FRAME_W*0.40, FRAME_H*0.25, FRAME_W*0.68, FRAME_H*0.58), fill=accent + "35")
                glow = glow.filter(ImageFilter.GaussianBlur(18))
                out = Image.alpha_composite(glow, out)
    if action == "hurt_high" and frame in (2, 3):
        out = ImageEnhance.Brightness(out).enhance(1.35)
    return out


def make_action(character: Character, base: Image.Image, action: str) -> Dict:
    count, loop, active = ACTIONS[action]
    frames = [action_frame(base, action, i, count, character.palette) for i in range(count)]
    sheet = Image.new("RGBA", (FRAME_W * count, FRAME_H), (0, 0, 0, 0))
    frame_meta = []
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * FRAME_W, 0))
        phase = phase_for(action, i, count, active)
        meta = {
            "frame": i, "x": i * FRAME_W, "y": 0, "width": FRAME_W, "height": FRAME_H,
            "durationMs": round(1000 / FPS, 3), "phase": phase,
        }
        if active and active[0] <= i < active[1]:
            meta["hitbox"] = {"x": 205, "y": 185 if "kick" not in action else 300, "width": 110, "height": 110}
        frame_meta.append(meta)
    return {"sheet": sheet, "frames": frame_meta, "loop": loop, "active": active}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--clean", action="store_true")
    ap.add_argument("--zip", action="store_true")
    ap.add_argument("--characters", nargs="*", default=None, help="Optional character IDs for a fast subset; default is the complete roster")
    args = ap.parse_args()

    if args.clean and OUT.exists():
        for child in OUT.iterdir():
            action_dir = child / "actions"
            if action_dir.exists(): shutil.rmtree(action_dir)

    specs = load_specs()
    if args.characters:
        wanted = set(args.characters)
        specs = [c for c in specs if c.cid in wanted]
    move_counts = load_move_counts()
    export_files: List[Path] = []
    roster_manifest = []

    for character in specs:
        base_path = find_base(character)
        if base_path is None:
            print(f"[WARN] no raster source for {character.name}; skipped")
            continue
        base = fit_canvas(Image.open(base_path))
        out_dir = OUT / character.cid / "actions"
        out_dir.mkdir(parents=True, exist_ok=True)
        actions_meta = {}
        for action in ACTIONS:
            result = make_action(character, base, action)
            sheet = result["sheet"]
            frames = result["frames"]
            png = out_dir / f"{action}.png"
            gif = out_dir / f"{action}.gif"
            sheet.save(png, optimize=True)
            # GIFs are previews only; preserve transparency as indexed alpha.
            gif_frames = [Image.open(base_path).convert("RGBA")] if False else []
            # Reconstruct individual frames from the sheet for GIF encoding.
            split = [sheet.crop((i*FRAME_W, 0, (i+1)*FRAME_W, FRAME_H)).convert("P", palette=Image.Palette.ADAPTIVE, colors=255) for i in range(len(frames))]
            split[0].save(gif, save_all=True, append_images=split[1:], duration=round(1000/FPS), loop=0, transparency=0, disposal=2, optimize=True)
            actions_meta[action] = {
                "image": f"/assets/characters/{character.cid}/actions/{action}.png",
                "gif": f"/assets/characters/{character.cid}/actions/{action}.gif",
                "sheetWidth": sheet.width, "sheetHeight": sheet.height,
                "displayWidth": 1.45, "displayHeight": 2.7,
                "loop": result["loop"], "defaultFrameDurationMs": round(1000/FPS, 3),
                "activeStartFrame": result["active"][0] if result["active"] else None,
                "activeEndFrameExclusive": result["active"][1] if result["active"] else None,
                "frames": frames,
            }
            export_files.extend([png, gif])
        manifest = {
            "characterId": character.cid,
            "characterName": character.name,
            "source": str(base_path.relative_to(ROOT)),
            "specialMoveCount": move_counts.get(character.name, 0),
            "actions": actions_meta,
        }
        (out_dir / "actions.json").write_text(json.dumps({"characterId": character.cid, "actions": actions_meta}, indent=2), encoding="utf-8")
        (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        export_files.extend([out_dir / "actions.json", out_dir / "manifest.json"])
        roster_manifest.append(manifest)
        print(f"[PASS] {character.name}: {len(ACTIONS)} actions, {sum(ACTIONS[a][0] for a in ACTIONS)} frames")

    root_manifest = OUT / "action_asset_manifest.json"
    root_manifest.write_text(json.dumps({"fps": FPS, "frameSize": [FRAME_W, FRAME_H], "characters": roster_manifest}, indent=2), encoding="utf-8")
    export_files.append(root_manifest)

    if args.zip:
        archive = ROOT / "FOF_action_sprites_export.zip"
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zf:
            for p in export_files:
                if p.exists(): zf.write(p, p.relative_to(ROOT))
        print(f"[PASS] archive: {archive}")

if __name__ == "__main__":
    main()
