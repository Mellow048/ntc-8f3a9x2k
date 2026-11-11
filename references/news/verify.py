"""Verify the preserved news films and their source snapshots against their manifests; no media generation."""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parent
for manifest_path in sorted(root.glob('*/manifest.json')):
    folder = manifest_path.parent
    manifest = json.loads(manifest_path.read_text())
    for entry in manifest['files']:
        p = folder / entry['path']
        assert p.is_file(), f'Missing: {p}'
        assert p.stat().st_size == entry['bytes'], f'Size mismatch: {p}'
        assert hashlib.sha256(p.read_bytes()).hexdigest() == entry['sha256'], f'Hash mismatch: {p}'
    print(f'{folder.name}: {len(manifest["files"])} verified files; origin {manifest["origin_commit"]}')
