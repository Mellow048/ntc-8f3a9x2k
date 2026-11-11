"""One source of truth for shot boundaries, sound cues, captions and QA."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
w=json.loads((ROOT/'shoots/koepenick/voice/words.json').read_text())['words']
# New action or setting at each cut. Camera keys are positions/look-at in metres.
rows=[
(0,'hook','Town hall · 1906',[5,4.2,11],[0,2.1,0],43,'Soldiers carry bags and salute the fake captain'),
(18,'ban','Berlin · 1906',[1.2,3.1,8.5],[.3,1.8,0],43,'Civilian Voigt at police desk; papers stamped and pushed away'),
(33,'shop','Second-hand dealer',[.9,3.1,8.5],[0,1.8,0],44,'Voigt enters a shop packed with coats and military cast-offs'),
(37,'uniform','',[1,4.6,4.4],[0,1.15,0],41,'Coat, sash, sabre and cap arrive on counter in sequence'),
(46,'mirror','',[.3,2.9,6.5],[.3,1.9,0],42,'Uniformed captain; cap versus spiked helmet visible beside him'),
(55,'halt','Plötzensee',[1,3.6,13],[-.6,1.7,-1],44,'White glove rises and ten soldiers halt in two ranks'),
(65,'follow','',[1,3.6,13],[-.7,1.7,0],44,'Captain points; troops wheel and march behind him'),
(72,'obey','',[.5,3,7.2],[-.15,1.8,0],43,'Soldier glances at cap then snaps to attention'),
(82,'train','To Köpenick',[.9,3.1,8.5],[0,1.8,0],45,'Carriage interior with ten seated troops; mugs lifted on beer'),
(95,'hall','Köpenick',[7,7.1,18],[0,3,0],43,'Squad advances up town hall stairs; guards close the entrance'),
(104,'crowd','',[6,3.8,10],[0,1.8,1],45,'Police hold a crowd behind their arms'),
(111,'bath','Inside the town hall',[.8,3.3,8.5],[.5,1.7,-.5],44,'Inspector with a towel asks; captain waves him towards a bath'),
(126,'mayor','Mayor’s office',[.6,3.4,9.3],[0,1.85,0],44,'Mayor demands paperwork; hands empty; captain faces him'),
(131,'warrant','',[.6,3.4,9.3],[0,1.85,0],43,'Captain gestures at two armed guards; mayor shrinks back'),
(139,'cash','Town treasury',[1,3.5,8.5],[0,1.7,0],44,'Cash box opens; coins drop into bag held by treasurer'),
(145,'receipt','',[.1,4.5,3.5],[0,1.3,0],38,'Quill writes von Malzahn on a receipt beside cash bag'),
(157,'guard','Town hall',[5.5,4.2,10],[0,2,0],44,'Two sentries at portal; captain walks off while clock moves'),
(168,'escape','Köpenick station',[5,3.2,10],[0,1.7,0],44,'Captain crosses platform behind a steam cloud and disappears'),
(170,'wanted','Berlin police',[1.5,3,6],[0,1.9,0],43,'Police examine wanted poster with unknown face'),
(179,'tip','',[3.8,3,7],[0,1.8,0],43,'Former cellmate recognises the cap and points to his name'),
(184,'breakfast','Ten days later',[.7,3.3,8],[.1,1.7,0],44,'Voigt in civilian clothes stops mid-breakfast; police arrive'),
(191,'prison','Four years',[2.2,3,7],[0,1.8,0],42,'Iron-barred cell closes in front of him'),
(195,'laugh','Germany',[4.7,3.7,9],[0,1.8,0],44,'Newsstand; public laughs at the illustrated newspaper'),
(201,'pardon','Imperial pardon',[3.5,3.5,7],[0,1.7,0],42,'Kaiser signs pardon; seal stamps on word pardons'),
(206,'stage','After his release',[.2,3,8],[0,2,0],42,'Music-hall stage; captain bows, audience claps'),
(214,'statue','Köpenick · today',[6,4.5,11],[0,2.1,0],43,'Reveal bronze captain on pedestal in front of the same town hall'),
]
out=[]
for i,(wi,place,label,pos,look,fov,action) in enumerate(rows):
 a=0 if i==0 else max(0,round(w[wi]['start']*30)-2)
 out.append(dict(id=i+1,a=a,place=place,label=label,pos=pos,look=look,fov=fov,action=action,word=wi))
total=math.ceil((w[-1]['end']+1.2)*30)
for i,s in enumerate(out): s['b']=out[i+1]['a'] if i+1<len(out) else total
(ROOT/'remotion-app/src/videos/koepenick/data.json').write_text(json.dumps(dict(fps=30,total=total,shots=out,words=w),ensure_ascii=False,indent=1)+'\n')
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
(ROOT/'shoots/koepenick/qa-shots.json').write_text(json.dumps(dict(shots=out,planned=planned),indent=1)+'\n')
lines=['# Köpenick — locked production shot plan','',f'{total} frames / {total/30:.3f} s · 720×1280 · 30 fps.','', 'User instructed production to proceed using the selected voice on 2026-11-10. No claim of separate voice approval.','', 'Every frame is deterministic; action ramps are clamped and hold their endpoints. A 1.2 s resolved tail follows the last word.','', '| Shot | Time | Place / distinct action |','|---|---|---|']
for s in out: lines.append(f"| {s['id']} | {s['a']/30:.2f}–{s['b']/30:.2f} | {s['place']}: {s['action']} |")
lines+=['','## Audio direction','Original 116 BPM D-major / B-minor mock military music-hall score. Pizzicato bass, dry woodblock, flute, muted brass; tighter texture at the arrest, theatrical reprise on stage, final resolved D-major chord. Score measured after ducking at roughly 5–6 LU below narration. No melody from either reference.','', '## Preview gate','Inspect all 26 sets/actions in portrait diagnostic frames before final render. Check opening troop/captain separation, face clearance, hat silhouette, cash/bag contact, signature, bars, statue and caption band. Full render runs only after a manual preview dispatch and source fixes.']
(ROOT/'shoots/koepenick/SHOT_PLAN.md').write_text('\n'.join(lines)+'\n')
print(total,len(out))
