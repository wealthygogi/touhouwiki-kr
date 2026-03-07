#!/usr/bin/env python3
"""
Add Japanese originalTitle to MusicTrack components in music.mdx files.
Reads track titles from ~/git/touhou-backup/thpatch-data/{Game}/Music/ja.md TOC.
Only adds where originalTitle is missing (doesn't overwrite existing).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

GAME_MAP = {
    "Th06":  "shooting_game/the-embodiment-of-scarlet-devil",
    "Th07":  "shooting_game/perfect-cherry-blossom",
    "Th08":  "shooting_game/imperishable-night",
    "Th09":  "shooting_game/phantasmagoria-of-flower-view",
    "Th095": "side_game/shoot-the-bullet",
    "Th10":  "shooting_game/mountain-of-faith",
    "Th11":  "shooting_game/subterranean-animism",
    "Th12":  "shooting_game/undefined-fantastic-object",
    "Th125": "side_game/double-spoiler",
    "Th128": "side_game/fairy-wars",
    "Th13":  "shooting_game/ten-desires",
    "Th135": "fighting_game/hopeless-masquerade",
    "Th14":  "shooting_game/double-dealing-character",
    "Th143": "side_game/impossible-spell-card",
    "Th15":  "shooting_game/legacy-of-lunatic-kingdom",
    "Th16":  "shooting_game/hidden-star-in-four-seasons",
    "Th165": "side_game/violet-detector",
    "Th17":  "shooting_game/wily-beast-and-weakest-creature",
    "Th18":  "shooting_game/unconnected-marketeers",
    "Th185": "side_game/100th-black-market",
    "Th19":  "shooting_game/the-unfinished-dream-of-all-living-ghost",
    "Th20":  "shooting_game/fossilized-wonders",
}


def parse_ja_titles(ja_path: Path) -> dict[int, str]:
    """Extract track number → Japanese title from ja.md TOC."""
    content = ja_path.read_text(encoding="utf-8")
    titles = {}
    # TOC format: * [N No. M Title](#...)
    pattern = re.compile(r'\* \[\d+ No\. (\d+) (.+?)\]\(')
    for m in pattern.finditer(content):
        num = int(m.group(1))
        title = m.group(2).strip()
        titles[num] = title
    return titles


def add_original_titles(music_path: Path, ja_titles: dict[int, str], dry_run=False) -> int:
    """
    Add originalTitle to MusicTrack blocks missing it.
    Returns count of tracks updated.
    """
    lines = music_path.read_text(encoding="utf-8").split('\n')
    result = []
    updated = 0

    in_track = False
    current_num = None
    has_original_title = False
    title_line_idx = None

    for line in lines:
        if '<MusicTrack' in line and '</MusicTrack' not in line:
            in_track = True
            current_num = None
            has_original_title = False
            title_line_idx = None
            result.append(line)
            continue

        if in_track:
            num_m = re.match(r'\s+number="(\d+)"', line)
            if num_m:
                current_num = int(num_m.group(1))

            if 'originalTitle=' in line:
                has_original_title = True

            if re.match(r'\s+title="', line):
                title_line_idx = len(result)

            if line.strip() == '>':
                # End of opening tag — inject originalTitle if needed
                if current_num and not has_original_title:
                    ja_title = ja_titles.get(current_num)
                    if ja_title:
                        insert_at = (title_line_idx + 1) if title_line_idx is not None else len(result)
                        result.insert(insert_at, f'  originalTitle="{ja_title}"')
                        updated += 1
                in_track = False

        result.append(line)

    if updated and not dry_run:
        music_path.write_text('\n'.join(result), encoding="utf-8")

    return updated


def main():
    dry_run = '--dry-run' in sys.argv
    games = [a for a in sys.argv[1:] if not a.startswith('--')] or list(GAME_MAP.keys())

    total_updated = 0
    for game_code in games:
        if game_code not in GAME_MAP:
            print(f"[SKIP] Unknown game: {game_code}")
            continue

        ja_path = Path.home() / "git" / "touhou-backup" / "thpatch-data" / game_code / "Music/ja.md"
        v3_rel = GAME_MAP[game_code]
        music_path = ROOT / "docs/v3" / v3_rel / "music.mdx"

        if not ja_path.exists():
            print(f"[SKIP] No ja.md for {game_code}")
            continue
        if not music_path.exists():
            print(f"[SKIP] No music.mdx for {game_code} ({v3_rel})")
            continue

        ja_titles = parse_ja_titles(ja_path)
        if not ja_titles:
            print(f"[WARN] No titles parsed from {ja_path}")
            continue

        count = add_original_titles(music_path, ja_titles, dry_run=dry_run)
        if count:
            tag = "[DRY]" if dry_run else "[OK]"
            print(f"{tag} {game_code}: added originalTitle to {count} tracks")
            total_updated += count
        else:
            print(f"[--] {game_code}: all tracks already have originalTitle or no matches")

    print(f"\nTotal tracks updated: {total_updated}")


if __name__ == "__main__":
    main()
