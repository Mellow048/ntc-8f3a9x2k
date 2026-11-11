"""One source of truth for shot boundaries, sound cues, captions and QA."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
w=json.loads((ROOT/'shoots/petit/voice/words.json').read_text())['words']
# New action or setting at each cut. Camera keys are positions/look-at in metres.
rows=[
(0,'hook','New York · 1974','day',[0,15,40],[0,15.5,-6],55,'Both towers, the wire between them, the man tiny on it, street far below'),
(9,'height','','day',[2.2,16.5,3.5],[.4,0,-7.5],56,'Straight down the tower face: street, cars, people 1,350 feet below'),
(15,'policewait','','day',[3.4,1.5,9],[0,9,-6],53,'Street: police car, two officers craning up at the wire'),
(21,'performer','Paris','day',[1.0,2.0,6.2],[0,1.5,0],42,'Paris square: Petit performs on a low wire, hat of coins, small crowd'),
(29,'magazine','','day',[.35,4.0,3.3],[.05,1.35,-1.0],40,'Overhead: magazine open on the table, the towers page'),
(40,'decision','','day',[.6,2.4,4.9],[0,1.9,-.6],42,'He points at the page and grins — the decision'),
(49,'study','New York','day',[3.6,1.5,7.2],[.8,3.2,-3.2],48,'Tower base: Petit with press camera and notebook, craning up'),
(58,'reporter','','day',[.9,2.2,4.4],[0,1.85,-.4],40,'Reporter disguise: press card up, guard beside him'),
(59,'worker','','day',[1.2,1.9,5.4],[0,1.7,0],44,'Hard hat and toolbox at the site gate, clipboard checked'),
(61,'fakeid','','day',[.15,4.4,3.4],[0,1.3,-.6],38,'Overhead: three fake IDs laid out beside model towers'),
(67,'smuggle','Freight elevator','day',[1.3,2.6,5.6],[0,1.5,-1],44,'Cable coil, pole and bow loaded beside two friends in the freight car'),
(76,'load','','day',[.2,1.95,3.0],[0,1.6,-1.6],46,'The pole goes up on shoulders, the bow on top'),
(83,'elevator','','day',[.1,2.0,3.6],[0,1.9,-1.4],45,'Doors close on the loaded car, 104 lit above'),
(87,'security','World Trade Center','day',[1.3,2.5,5.4],[0,1.75,-.6],44,'Brand-new lobby: empty guard chair, barrier tape, NO GUARD YET'),
(100,'bow','Rooftop · night','night',[4.2,14.2,3.0],[-2.5,13.6,-6],46,'A friend draws the bow; fishing line flies across the gap'),
(111,'pull','','night',[2.6,14.4,2.6],[-3,13.2,-6],46,'Two friends haul the heavy cable hand over hand'),
(119,'sunrise','Rooftop · dawn','golden',[1.6,14.0,2.4],[-3.4,13.4,-6],44,'Petit steps onto the wire at dawn: empty hands, no harness, no net'),
(130,'cross','The wire','day',[-7.4,15.0,7.6],[1.5,13.4,-6],46,'Wide from the far roof: he is halfway across, towers behind'),
(137,'kneel','','day',[1.5,13.6,1.2],[-1.6,13.2,-6],38,'Medium: he kneels down on the wire'),
(139,'lie','','day',[2.6,13.5,1.6],[-1.6,13.3,-6],36,'He lies flat on the cable, arms wide'),
(142,'salute','','day',[.6,11.8,2.2],[-2.2,13.9,-6],42,'Low angle from under the wire: he stands and salutes'),
(144,'street','Street below','day',[5.0,1.6,7.5],[-.5,2.4,-6],50,'Cars stopped, drivers out, everyone looking up'),
(147,'crowd','','day',[.4,1.7,3.6],[-1.2,8.5,-6],56,'Inside the crowd: faces tilted up, mouths open'),
(150,'police','','day',[3.2,2.0,6.4],[0,1.6,-1.5],46,'Cruiser slews in, officers run, one shouting into a radio'),
(155,'reach','','day',[.6,14.2,2.2],[-2.6,13.5,-6],46,'Two cops on the roof, empty hands, staring out along the wire'),
(162,'wait','','day',[2.6,13.2,1.8],[-2.4,12.9,-6],42,'The same two sit down to wait, coffees, folded arms'),
(166,'arrest','','day',[2.0,13.6,2.4],[-.6,13.0,-6],44,'He steps off the wire into their arms on the roof'),
(177,'dropped','City Hall','day',[.2,4.2,3.4],[0,1.3,-.6],38,'Overhead: gavel down, DROPPED stamp on the charge sheet'),
(187,'park','Central Park','day',[1.8,2.4,7.4],[0,1.9,0],44,'Free show: he walks a low wire above a clapping crowd'),
(194,'pass','Observation deck','day',[.5,2.9,5.2],[0,1.7,-.4],40,'The clerk slides the lifetime pass across the counter'),
(206,'today','New York · today','day',[3.6,2.4,9.5],[0,2.2,-4],50,'Two empty tower footprints; he crosses a low wire in front'),
(216,'quote','','day',[-3.2,2.4,6.4],[0,2.4,0],42,'Side view: he stops mid-wire, points at two towers on the skyline'),
(227,'walk','','day',[.9,2.6,4.6],[0,2.4,0],40,'Close: the pass in his hand; he walks on out of frame'),
]
out=[]
for i,(wi,place,label,light,pos,look,fov,action) in enumerate(rows):
 a=0 if i==0 else max(0,round(w[wi]['start']*30)-2)
 out.append(dict(id=i+1,a=a,place=place,label=label,light=light,pos=pos,look=look,fov=fov,action=action,word=wi))
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
