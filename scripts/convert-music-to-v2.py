#!/usr/bin/env python3
"""Convert docs/music/ .md files to docs/music-v2/ .mdx with new components."""

import re
import os

SRC_DIR = 'docs/music/zuns_music_collection'
DEST_DIR = 'docs/music-v2/zuns_music_collection'


def escape_jsx_attr(s):
    """Escape for JSX string attributes."""
    return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')


def escape_yaml(s):
    """Escape for YAML frontmatter quoted strings."""
    return s.replace('\\', '\\\\').replace('"', '\\"')


def parse_frontmatter(raw_fm):
    """Parse frontmatter manually, handling escaped quotes."""
    fm = {}
    for line in raw_fm.strip().split('\n'):
        m = re.match(r'^(\w+):\s*(.+)$', line)
        if m:
            key = m.group(1)
            val = m.group(2).strip()
            # Handle quoted values with possible escaped quotes
            if val.startswith('"'):
                # Find the real end quote (not escaped)
                inner = val[1:]
                result = []
                i = 0
                while i < len(inner):
                    if inner[i] == '\\' and i + 1 < len(inner):
                        result.append(inner[i + 1])
                        i += 2
                    elif inner[i] == '"':
                        break
                    else:
                        result.append(inner[i])
                        i += 1
                val = ''.join(result)
            fm[key] = val
    return fm


def convert_file(src_path):
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split frontmatter and body
    parts = content.split('---\n', 2)
    if len(parts) < 3:
        print(f"  WARNING: Could not parse frontmatter")
        return None

    fm = parse_frontmatter(parts[1])
    body = parts[2]

    # Extract album cover import path
    cover_match = re.search(r"import\s+albumCover\s+from\s+'(.+?)'\s*;", body)
    cover_path = cover_match.group(1) if cover_match else ''

    # Extract KR title from first h1
    kr_title_full = ''
    h1_match = re.search(r'^# (.+)$', body, re.MULTILINE)
    if h1_match:
        kr_title_full = h1_match.group(1).strip()

    # Extract JP title from first h2 that contains CJK
    jp_title_full = ''
    for m in re.finditer(r'^## (.+)$', body, re.MULTILINE):
        candidate = m.group(1).strip()
        if re.search(r'[\u3000-\u9fff\u30a0-\u30ff]', candidate):
            jp_title_full = candidate
            break

    # Split titles at ~ separator
    def split_title(full):
        if ' ~ ' in full or ' ～ ' in full:
            p = re.split(r'\s*[~～]\s*', full, 1)
            return p[0], p[1] if len(p) > 1 else ''
        return full, ''

    kr_main, kr_en = split_title(kr_title_full)
    jp_main, jp_en = split_title(jp_title_full)
    title_en = kr_en or jp_en

    # Extract source URL
    source_match = re.search(r'\[touhouwiki[^\]]*\]\((https://[^)]+)\)', body)
    source_url = source_match.group(1) if source_match else ''

    # Extract track table
    tracks = []
    table_match = re.search(
        r'\|\s*#\s*\|\s*제목\s*\|\s*원제\s*\|\s*비고\s*\|'
        r'\n\|[\s\-:]+\|[\s\-:]+\|[\s\-:]+\|[\s\-:]+\|'
        r'\n((?:\|[^\n]+\|\n?)+)',
        body
    )

    if table_match:
        rows_text = table_match.group(1).strip()
        for row in rows_text.split('\n'):
            cells = row.split('|')
            cells = [c.strip() for c in cells if c.strip()]
            if len(cells) >= 3:
                try:
                    num = int(cells[0])
                    title = cells[1]
                    orig = cells[2].replace('**', '')
                    note = cells[3] if len(cells) > 3 else ''
                    tracks.append({
                        'number': num,
                        'title': title,
                        'originalTitle': orig,
                        'note': note,
                    })
                except (ValueError, IndexError):
                    pass

    # Find content after track table
    remaining = ''
    if table_match:
        remaining = body[table_match.end():].strip()
        # Remove leading ---
        if remaining.startswith('---'):
            remaining = remaining[3:].strip()

    # Build tracks JSON
    track_lines = []
    for t in tracks:
        parts_t = [
            f'number: {t["number"]}',
            f'title: "{escape_jsx_attr(t["title"])}"',
            f'originalTitle: "{escape_jsx_attr(t["originalTitle"])}"',
        ]
        if t['note']:
            parts_t.append(f'note: "{escape_jsx_attr(t["note"])}"')
        track_lines.append('  { ' + ', '.join(parts_t) + ' }')

    tracks_str = ',\n'.join(track_lines)

    # Build AlbumHeader props
    header_props = [
        f'  cover={{albumCover}}',
        f'  titleKr="{escape_jsx_attr(kr_main)}"',
    ]
    if jp_main:
        header_props.append(f'  titleJp="{escape_jsx_attr(jp_main)}"')
    if title_en:
        header_props.append(f'  titleEn="{escape_jsx_attr(title_en)}"')
    if source_url:
        header_props.append(f'  sourceUrl="{source_url}"')

    header_str = '\n'.join(header_props)

    # Build frontmatter
    orig_title = fm.get('title', kr_title_full)
    desc = fm.get('description', '')
    slug = fm.get('slug', '')
    pos = fm.get('sidebar_position', '1')

    mdx_lines = [
        '---',
        f'sidebar_position: {pos}',
        f'title: "{escape_yaml(orig_title)}"',
    ]
    if desc:
        mdx_lines.append(f'description: "{escape_yaml(desc)}"')
    if slug:
        mdx_lines.append(f'slug: "{slug}"')
    mdx_lines.append('---')
    mdx_lines.append('')
    mdx_lines.append("import { AlbumHeader, AlbumTrackList } from '@site/src/components/music';")
    mdx_lines.append(f"import albumCover from '{cover_path}';")
    mdx_lines.append('')
    mdx_lines.append('<AlbumHeader')
    mdx_lines.append(header_str)
    mdx_lines.append('/>')
    mdx_lines.append('')
    mdx_lines.append('<AlbumTrackList tracks={[')
    mdx_lines.append(tracks_str)
    mdx_lines.append(']} />')
    mdx_lines.append('')

    if remaining:
        mdx_lines.append('---')
        mdx_lines.append('')
        mdx_lines.append(remaining)

    result = '\n'.join(mdx_lines)
    if not result.endswith('\n'):
        result += '\n'
    return result


def main():
    os.makedirs(DEST_DIR, exist_ok=True)

    files = sorted([
        f for f in os.listdir(SRC_DIR)
        if f.endswith('.md') and not f.startswith('_')
    ])

    print(f'Found {len(files)} files to convert')

    for filename in files:
        src_path = os.path.join(SRC_DIR, filename)
        dest_filename = filename.replace('.md', '.mdx')
        dest_path = os.path.join(DEST_DIR, dest_filename)

        print(f'  {filename} -> {dest_filename}')
        try:
            mdx = convert_file(src_path)
            if mdx:
                with open(dest_path, 'w', encoding='utf-8') as f:
                    f.write(mdx)
                # Count tracks
                track_count = mdx.count('number:')
                print(f'    OK ({track_count} tracks)')
            else:
                print(f'    SKIPPED')
        except Exception as e:
            print(f'    ERROR: {e}')
            import traceback
            traceback.print_exc()

    print('Done!')


if __name__ == '__main__':
    main()
