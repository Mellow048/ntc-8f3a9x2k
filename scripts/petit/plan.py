"""One source of truth for shot boundaries, sound cues, captions and QA."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
w=json.loads((ROOT/'shoots/petit/voice/words.json').read_text())['words']
# New action or setting at each cut. Camera keys are positions/look-at in metres.
rows=[
(0,'hook','New York · 1974',[5,4.2,11],[0,2.1,0],43,'Wire between Twin Towers; Petit steps out, police wait on roof'),
(21,'magazine','Paris',[.9,3.1,8.5],[0,1.8,0],44,'Petit flips magazine, sees towers under construction'),
(40,'decision','',[.6,3.4,9.3],[0,1.85,0],44,'Petit points at towers, nods — decision made'),
(49,'disguise','New York',[1.2,3.1,8.5],[.3,1.8,0],43,'Petit studies buildings in disguise, notebook and camera'),
(58,'reporter','',[.9,3.1,8.5],[0,1.8,0],44,'Reporter disguise: notebook up, questions guard'),
(59,'worker','',[.9,3.1,8.5],[0,1.8,0],44,'Construction worker disguise: hard hat, tools, roof access'),
(61,'fakeid','',[.1,4.5,3.5],[0,1.3,0],38,'Fake ID cards laid out on desk beside model towers'),
(67,'smuggle','Freight elevator',[1,3.5,8.5],[0,1.7,0],44,'Cable, pole, bow and arrows loaded onto freight elevator'),
(83,'elevator','',[1,4.6,4.4],[0,1.15,0],41,'Elevator doors close; equipment rides to 104th floor'),
(87,'towers','World Trade Center',[7,7.1,18],[0,3,0],43,'New towers, empty security desk, open roof door'),
(100,'bow','Rooftop · night',[5,3.2,10],[0,1.7,0],44,'Bow shoots fishing line across the gap'),
(111,'pull','',[5.5,4.2,10],[0,2,0],44,'Friends pull heavy cable hand over hand'),
(119,'sunrise','Rooftop · dawn',[1,3.6,13],[-.6,1.7,-1],44,'Petit steps out at sunrise, empty hands, no harness'),
(130,'cross','The wire',[1,3.6,13],[-.7,1.7,0],44,'Petit crosses eight times, walking the wire'),
(137,'kneel','',[.5,3,7.2],[-.15,1.8,0],43,'Petit kneels on the wire, salutes the sky'),
(139,'lie','',[.5,3,7.2],[-.15,1.8,0],43,'Petit lies flat on his back, arms out'),
(142,'salute','',[.5,3,7.2],[-.15,1.8,0],43,'Petit stands, salutes the crowd below'),
(144,'street','Street below',[6,3.8,10],[0,1.8,1],45,'Traffic stops; crowd looks up'),
(147,'crowd','',[4.7,3.7,9],[0,1.8,0],44,'Thousands stare up, necks craned'),
(150,'police','',[3.5,3.5,7],[0,1.7,0],42,'Police cars arrive, officers rush to scene'),
(155,'wait','Rooftop',[2.2,3,7],[0,1.8,0],42,'Police wait at anchor point, hands empty'),
(166,'arrest','',[1.5,3,6],[0,1.9,0],43,'Petit steps off; police take his arms on roof'),
(177,'dropped','City Hall',[3.5,3.5,7],[0,1.7,0],42,'Gavel drops charges; city loves it'),
(187,'park','Central Park',[.2,3,8],[0,2,0],42,'Free performance in park; crowd claps'),
(194,'pass','Observation deck',[.7,3.3,8],[.1,1.7,0],44,'Lifetime pass stamped and handed to Petit'),
(206,'today','New York · today',[6,4.5,11],[0,2.1,0],43,'Empty sky where towers were; Petit walks low wire in park'),
]
out=[]
for i,(wi,place,label,pos,look,fov,action) in enumerate(rows):
 a=0 if i==0 else max(0,round(w[wi]['start']*30)-2)
 out.append(dict(id=i+1,a=a,place=place,label=label,pos=pos,look=look,fov=fov,action=action,word=wi))
total=math.ceil((w[-1]['end']+1.2)*30)
for i,s in enumerate(out): s['b']=out[i+1]['a'] if i+1<len(out) else total
(ROOT/'remotion-app/src/videos/petit/data.json').write_text(json.dumps(dict(fps=30,total=total,shots=out,words=w),ensure_ascii=False,indent=1)+'\n')
planned=[]
# Only actual edits and caption changes, not blanket masks for whole sequences.
groups=[];i=0
while i<len(w):
 a=w[i];b=w[i+1] if i+1<len(w) else None
 pair=bool(b and len(a['word'])+len(b['word'])<=13 and b['start']-a['end']<.32)
 end=b['end'] if pair else a['end']; start=a['start']
 groups.append(dict(start=start,end=end,text=a['word']+(' '+b['word'] if pair else '')))
 i+=2 if pair else 1
for i,g in enumerate(groups):
 end=min(g['end']+.15,groups[i+1]['start']-.035) if i+1<len(groups) else g['end']+.15
 planned.extend([[math.ceil((g['start']-.035)*30)-1,math.ceil((g['start']-.035)*30)+4],[math.ceil(end*30)-1,math.ceil(end*30)+1]])
(ROOT/'shoots/petit/qa-shots.json').write_text(json.dumps(dict(shots=out,planned=planned),indent=1)+'\n')
lines=['# Petit — locked production shot plan','',f'{total} frames / {total/30:.3f} s · 720×1280 · 30 fps.','', 'User approved script and voice-02 on 2026-11-11. Hook per user request.','', 'Every frame is deterministic; action ramps are clamped and hold their endpoints. A 1.2 s resolved tail follows the last word.','', '| Shot | Time | Place / distinct action |','|---|---|---|']
for s in out: lines.append(f"| {s['id']} | {s['a']/30:.2f}–{s['b']/30:.2f} | {s['place']}: {s['action']} |")
lines+=['','## Audio direction','Original score for this film (not Köpenick/Taipei/Beer). Curiosity/tension/relief arc: light street groove, tense night-pull, high-wire tension, warm park payoff. Music 5–6 LU below speech after ducking, 48 kHz stereo, −14 to −15 LUFS, true peak ≤−1 dBTP.','', '## Preview gate','Inspect all 26 sets/actions in portrait diagnostic frames before final render. Check wire/tower recognizability, face clearance, cable contact, caption band. Full render runs only after a manual preview dispatch and source fixes.']
(ROOT/'shoots/petit/SHOT_PLAN.md').write_text('\n'.join(lines)+'\n')
print(total,len(out))
