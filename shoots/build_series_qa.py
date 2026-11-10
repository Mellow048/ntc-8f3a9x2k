"""Mark intentional visual cuts and subtitle entrance/exit animation for QA.

Caption text changes (and its three-frame pop-in animation) are intentional
frame-difference spikes, not editing mistakes. Keep this grouping in sync with
captionGroups in engineering-series/Series.tsx.
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
stories = json.loads((root.parent/'remotion-app/src/videos/engineering-series/data.json').read_text())
for slug, story in stories.items():
    beats = story['beats']
    shots = [{'id': i+1, 'a': b['frame'], 'b': beats[i+1]['frame'] if i+1<len(beats) else story['frames']}
             for i,b in enumerate(beats)]
    words=story['words']
    planned=[]
    i=0
    while i<len(words):
        a=words[i]
        b=words[i+1] if i+1<len(words) else None
        pair=bool(b and b['start']-a['end']<.16 and len(a['word'])+len(b['word'])<=20)
        last=b if pair else a
        next_i=i+(2 if pair else 1)
        following=words[next_i] if next_i<len(words) else None
        end=following['start'] if following and following['start']-last['end']<.24 else last['end']+.12
        # Round to a whole frame; a 3-frame pop-in follows the start.
        for time in (max(0, a['start']-.025),end):
            f=round(time*30)
            planned.append([max(0,f-2), min(story['frames'],f+4)])
        i=next_i
    (root/slug/'qa-shots.json').write_text(json.dumps({'frames':story['frames'],'shots':shots,'planned':planned},indent=2)+'\n')
