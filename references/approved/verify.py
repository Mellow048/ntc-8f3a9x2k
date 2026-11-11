"""Verify the preserved originals and source snapshots; no media generation."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
for name in ['taipei-101','beer-flood']:
 folder=root/name
 manifest=json.loads((folder/'manifest.json').read_text())
 for entry in manifest['files']:
  p=folder/entry['path']
  assert p.is_file(),f'Missing: {p}'
  assert p.stat().st_size==entry['bytes'],f'Size mismatch: {p}'
  assert hashlib.sha256(p.read_bytes()).hexdigest()==entry['sha256'],f'Hash mismatch: {p}'
 print(f'{name}: {len(manifest["files"])} verified files; origin {manifest["origin_commit"]}')
