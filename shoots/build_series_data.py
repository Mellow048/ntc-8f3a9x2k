"""Turn forced-aligned narration into deterministic frame-accurate scene cues."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent
plans = json.loads((ROOT/'series-plan.json').read_text())
scripts = json.loads((ROOT/'series-scripts.json').read_text())
result = {}
for slug, cues in plans.items():
    wordfile=ROOT/slug/'voice'/('action-words.json' if slug=='spring-building' else 'words.json')
    words = json.loads(wordfile.read_text())
    timing = json.loads((ROOT/slug/'timing.json').read_text())
    tokens = [w['word'] for w in words]
    events = []
    seek = 0
    for phrase, scene in cues:
        if not phrase:
            idx = 0
        else:
            needle = phrase.split()
            idx = next((i for i in range(seek, len(tokens)-len(needle)+1) if tokens[i:i+len(needle)] == needle), None)
            if idx is None:
                raise ValueError(f'{slug}: phrase not aligned: {phrase}')
        seek = idx
        events.append({'frame': max(0, round(words[idx]['start']*30)-2) if phrase else 0, 'scene':scene, 'phrase':phrase})
    if len({x['frame'] for x in events}) != len(events):
        raise ValueError(f'{slug}: duplicated beat')
    result[slug] = {'title':scripts[slug]['title'], 'frames':timing['frames'], 'words':words, 'beats':events}
    print(slug, [(x['frame'], x['scene']) for x in events])
out = ROOT.parent/'remotion-app/src/videos/engineering-series/data.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result, separators=(',', ':'))+'\n')
