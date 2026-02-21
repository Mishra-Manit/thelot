#!/usr/bin/env python3
"""
Generate storyboard shot start-frame images for demo data.

Defaults are cost-conscious:
- only generates missing files
- one image per shot
- sequential requests
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


SCENES = [
    "Arrakis Arrival",
    "Gom Jabbar Test",
    "House Atreides Betrayed",
    "Escape into the Desert",
    "First Ride with the Fremen",
]

SHOT_TEMPLATES = [
    {
        "title": "Cinematic Dunes Wide",
        "start_frame_prompt": "Endless sand dunes at golden hour, cinematic scale, atmospheric haze, 2.39:1.",
    },
    {
        "title": "Paul Close-up",
        "start_frame_prompt": "Intense cinematic close-up of a young man in desert light, expressive eyes.",
    },
    {
        "title": "Ornithopter Flight",
        "start_frame_prompt": "Futuristic desert aircraft crossing sunlit dunes, cinematic action framing.",
    },
    {
        "title": "Sandworm Emergence",
        "start_frame_prompt": "Massive sandworm breaching from the desert, epic cinematic scale and dust.",
    },
    {
        "title": "Battle Momentum",
        "start_frame_prompt": "Desert battle sequence with kinetic camera and high-contrast cinematic grading.",
    },
]


@dataclass(frozen=True)
class ShotSpec:
    scene_number: int
    shot_number: int
    scene_title: str
    shot_title: str
    start_frame_prompt: str

    @property
    def output_filename(self) -> str:
        return f"scene-{self.scene_number:02d}-shot-{self.shot_number:02d}-start.png"

    @property
    def output_relpath(self) -> str:
        return f"public/storyboard/shots/{self.output_filename}"


def load_dotenv(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return
    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def all_shots() -> list[ShotSpec]:
    shots: list[ShotSpec] = []
    for s_idx, scene in enumerate(SCENES, start=1):
        for sh_idx, template in enumerate(SHOT_TEMPLATES, start=1):
            shots.append(
                ShotSpec(
                    scene_number=s_idx,
                    shot_number=sh_idx,
                    scene_title=scene,
                    shot_title=template["title"],
                    start_frame_prompt=template["start_frame_prompt"],
                )
            )
    return shots


def build_prompt(shot: ShotSpec) -> str:
    return (
        f"Create a cinematic storyboard keyframe for Scene {shot.scene_number}: "
        f"'{shot.scene_title}', Shot {shot.shot_number}: '{shot.shot_title}'. "
        f"{shot.start_frame_prompt} "
        "Style: grounded sci-fi desert epic, dramatic film lighting, realistic detail, "
        "single clear composition, no text, no logos, no watermark."
    )


def request_image(
    api_key: str,
    model: str,
    prompt: str,
    timeout_seconds: int = 90,
) -> bytes:
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Network error: {exc}") from exc

    parsed = json.loads(body)
    candidates = parsed.get("candidates", [])
    for candidate in candidates:
        parts = (
            candidate.get("content", {}).get("parts", [])
            if isinstance(candidate, dict)
            else []
        )
        for part in parts:
            inline = part.get("inlineData") or part.get("inline_data")
            if not inline:
                continue
            mime = (inline.get("mimeType") or inline.get("mime_type") or "").lower()
            b64 = inline.get("data")
            if b64 and mime.startswith("image/"):
                return base64.b64decode(b64)

    raise RuntimeError(f"No image payload found in API response: {body[:600]}")


def extract_png_dimensions(png_bytes: bytes) -> tuple[int, int] | None:
    if len(png_bytes) < 24 or png_bytes[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    # IHDR width/height are bytes 16..24
    w = int.from_bytes(png_bytes[16:20], "big")
    h = int.from_bytes(png_bytes[20:24], "big")
    return (w, h)


def parse_only_filter(raw: str | None) -> set[tuple[int, int]] | None:
    if not raw:
        return None
    out: set[tuple[int, int]] = set()
    items = [x.strip() for x in raw.split(",") if x.strip()]
    pat = re.compile(r"^(\d+)[\.:/-](\d+)$")
    for item in items:
        m = pat.match(item)
        if not m:
            raise ValueError(
                f"Invalid --only item '{item}'. Use scene.shot format, e.g. 5.4,5.5"
            )
        out.add((int(m.group(1)), int(m.group(2))))
    return out


def iter_targets(
    shots: Iterable[ShotSpec],
    output_dir: Path,
    include_existing: bool,
    only_pairs: set[tuple[int, int]] | None,
) -> list[ShotSpec]:
    targets: list[ShotSpec] = []
    for shot in shots:
        if only_pairs and (shot.scene_number, shot.shot_number) not in only_pairs:
            continue
        out_path = output_dir / shot.output_filename
        if out_path.exists() and not include_existing:
            continue
        targets.append(shot)
    return targets


def main() -> int:
    script_path = Path(__file__).resolve()
    project_root = script_path.parent.parent
    dotenv_path = project_root / ".env"
    output_dir = project_root / "public" / "storyboard" / "shots"

    parser = argparse.ArgumentParser(
        description="Generate storyboard start-frame PNGs with Google image API."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List planned generations without making API calls.",
    )
    parser.add_argument(
        "--include-existing",
        action="store_true",
        help="Regenerate files even if they already exist.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of shots to generate in this run.",
    )
    parser.add_argument(
        "--only",
        type=str,
        default=None,
        help="Comma-separated scene.shot pairs (e.g. 5.4,5.5).",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemini-2.5-flash-image",
        help="Google model name for image generation.",
    )
    parser.add_argument(
        "--sleep-ms",
        type=int,
        default=350,
        help="Delay between requests to avoid aggressive request bursts.",
    )
    args = parser.parse_args()

    load_dotenv(dotenv_path)
    api_key = os.environ.get("IMAGE_API", "").strip()
    if not api_key and not args.dry_run:
        print("Missing IMAGE_API in environment or .env", file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)
    shots = all_shots()

    try:
        only_pairs = parse_only_filter(args.only)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    targets = iter_targets(
        shots=shots,
        output_dir=output_dir,
        include_existing=args.include_existing,
        only_pairs=only_pairs,
    )
    if args.limit is not None:
        targets = targets[: max(args.limit, 0)]

    print(f"Total storyboard shots: {len(shots)}")
    print(f"Planned generations: {len(targets)}")
    for shot in targets:
        print(f"- S{shot.scene_number:02d}.SH{shot.shot_number:02d} -> {shot.output_relpath}")

    if args.dry_run:
        print("Dry run complete. No API calls were made.")
        return 0

    succeeded = 0
    failed = 0
    for idx, shot in enumerate(targets, start=1):
        prompt = build_prompt(shot)
        out_path = output_dir / shot.output_filename
        print(f"[{idx}/{len(targets)}] Generating {out_path.name} ...")
        try:
            img_bytes = request_image(api_key=api_key, model=args.model, prompt=prompt)
            out_path.write_bytes(img_bytes)
            dims = extract_png_dimensions(img_bytes)
            size = len(img_bytes)
            dims_str = f"{dims[0]}x{dims[1]}" if dims else "unknown-dimensions"
            print(f"  wrote {size} bytes ({dims_str})")
            succeeded += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  failed: {exc}", file=sys.stderr)
            failed += 1
        if args.sleep_ms > 0 and idx < len(targets):
            time.sleep(args.sleep_ms / 1000)

    print(f"Done. Success: {succeeded}, Failed: {failed}, Total attempted: {len(targets)}")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
