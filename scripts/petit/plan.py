"""One source of truth for shot boundaries, sound cues, captions and QA."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
w=json.loads((ROOT/'shoots/petit/voice/words.json').read_text())['words']
# New action or setting at each cut. Camera keys are positions/look-at in metres.
# (word, place, label, light, subject(x,y,z), distance, yaw_deg, pitch_deg, fov, action)
# The camera sits `distance` metres from the subject, swung `yaw` degrees round it from +Z and lifted
# `pitch` degrees above the subject's eye line. Framing is derived, so every shot is composed on purpose.
rows=[
(0,'hook','New York · 1974','day',[0,40.1,-6],30,0,6,55,'Both towers, the walk wire between them, the man tiny on it, police and cars below'),
(9,'height','','day',[0,1.0,-4],22,40,38,52,'Straight down the tower face: street, cars and people 1,350 feet below'),
(15,'policewait','','day',[1.6,1.5,-1.2],11,-12,-2,52,'Street: police car and two officers craning up at the wire'),
(21,'performer','Paris','day',[0,1.7,.2],8.4,5,2,44,'Paris square: Petit performs on a low wire, hat of coins, small crowd'),
(29,'magazine','','day',[0,1.6,-.9],4.6,4,18,40,'Overhead: magazine open on the table, the towers page'),
(40,'decision','','day',[0,1.9,-.5],5.2,8,6,42,'He points at the page and grins — the decision'),
(49,'study','New York','day',[1.3,2.2,.6],6.6,26,-6,46,'Tower base: Petit with press camera and notebook, craning up'),
(58,'reporter','','day',[0,1.8,-.5],4.8,6,4,40,'Reporter disguise: press card up, guard beside him'),
(59,'worker','','day',[.9,1.7,1.0],6.4,12,0,44,'Hard hat and toolbox at the site gate, clipboard checked'),
(61,'fakeid','','day',[0,1.5,-.9],4.6,2,30,38,'Overhead: three fake IDs laid out beside model towers'),
(67,'smuggle','Freight elevator','day',[0,1.6,-.6],6.0,10,6,44,'Cable coil, pole and bow loaded beside two friends in the freight car'),
(76,'load','','day',[0,1.7,-.9],4.8,4,2,46,'The pole goes up on shoulders, the bow on top'),
(83,'elevator','','day',[0,1.9,-1.4],5.0,0,0,45,'Doors close on the loaded car, 104 lit above'),
(87,'security','World Trade Center','day',[0,1.7,-1.1],9.6,10,4,46,'Brand-new lobby: empty guard chair, barrier tape, NO GUARD YET'),
(100,'bow','Rooftop · night','night',[-6.4,39.9,-4.9],13,34,5,48,'A friend draws the bow; fishing line flies across the gap'),
(111,'pull','','night',[-7,39.4,-3.2],20,26,8,48,'Two friends haul the heavy cable hand over hand'),
(119,'sunrise','Rooftop · dawn','golden',[-2.6,40.0,-6],7.5,55,8,44,'Petit steps onto the wire at dawn: empty hands, no harness, no net'),
(130,'cross','The wire','day',[0,40.0,-6],26,78,8,48,'Wide from the far roof: he is halfway across, towers behind'),
(137,'kneel','','day',[-.6,40.0,-6],5.6,68,4,38,'Medium: he kneels down on the wire'),
(139,'lie','','day',[-.6,40.0,-6],6.4,85,12,36,'He lies flat on the cable, arms wide'),
(142,'salute','','day',[-.8,40.0,-6],6.8,40,-12,42,'Low angle from under the wire: he stands and salutes'),
(144,'street','Street below','day',[0,1.9,-.6],12,34,2,50,'Cars stopped, drivers out, everyone looking up'),
(147,'crowd','','day',[0,3.0,-3.0],9,4,10,56,'Inside the crowd: faces tilted up, mouths open'),
(150,'police','','day',[1.2,1.7,-1.0],8.5,30,2,46,'Cruiser slews in, officers run, one shouting into a radio'),
(155,'reach','','day',[-.2,39.8,-5.0],12,34,8,48,'Two cops on the roof, empty hands, staring out along the wire'),
(162,'wait','','day',[1.3,39.4,-4.4],6.4,42,10,42,'The same two sit down to wait, coffees, folded arms'),
(166,'arrest','','day',[.6,39.4,-4.8],6.6,46,8,44,'He steps off the wire into their arms on the roof'),
(177,'dropped','City Hall','day',[.2,1.5,-1.0],4.4,6,26,38,'Overhead: gavel down, DROPPED stamp on the charge sheet'),
(187,'park','Central Park','day',[-.2,2.6,.2],10,14,4,44,'Free show: he walks a low wire above a clapping crowd'),
(194,'pass','Observation deck','day',[.1,1.8,-.9],5.0,10,8,40,'The clerk slides the lifetime pass across the counter'),
(206,'today','New York · today','day',[0,2.2,-3.0],13,14,3,46,'Two empty tower footprints with hoarding; he crosses a low wire'),
(216,'quote','','day',[.4,2.4,0],12,-16,2,46,'Side view: he stops mid-wire, points at two towers on the skyline'),
(227,'walk','','day',[-.2,2.6,0],6.2,26,2,42,'Close: the pass in his hand; he walks on out of frame'),
]
def camera(subject,dist,yaw,pitch):
    y,p=math.radians(yaw),math.radians(pitch)
    pos=[subject[0]+dist*math.sin(y)*math.cos(p),subject[1]+dist*math.sin(p),subject[2]+dist*math.cos(y)*math.cos(p)]
    look=list(subject)
    return [round(v,3) for v in pos],[round(v,3) for v in look]
out=[]
for i,(wi,place,label,light,subject,dist,yaw,pitch,fov,action) in enumerate(rows):
 pos,look=camera(subject,dist,yaw,pitch)
 a=0 if i==0 else max(0,round(w[wi]['start']*30)-2)
 out.append(dict(id=i+1,a=a,place=place,label=label,light=light,pos=pos,look=look,fov=fov,action=action,word=wi))
total=math.ceil((w[-1]['end']+1.2)*30)
for i,s in enumerate(out): s['b']=out[i+1]['a'] if i+1<len(out) else total
# ---- captions: 1-2 words, synchronised to the voice, never a full sentence, never across a phrase break ----
import re as _re
_text=(ROOT/'shoots/petit/voice/narration.txt').read_text()
_chunks=[c for c in _re.split(r'(?<=[.!?,;:])\s+|\n+',_text) if c.strip()]
_span=[];k=0
for c in _chunks:
    n=len(c.split());_span.append((k,k+n-1));k+=n
if k!=len(w):raise SystemExit(f'caption phrases cover {k} words, voice has {len(w)}')
STOP={'a','an','the','and','of','to','in','at','for','is','was','were','he','his','him','she','they','it','that',
 'with','no','yet','now','still','even','just','so','but','then','when','if','has','have','had','can',"can't",
 'are','as','by','up','out','off','one','her','from','into','over','there','here','too','not','all','you'}
TRAIL={'up','out','off','down','over','in','on','by','now','still','below','back','again','there','through','across'}
LEAD={'a','an','the'}
OVERRIDE={(9,14):'1,350 FEET',(17,18):'POLICE',(19,20):'WAITING BELOW',(23,24):'TWENTY-FOUR',
 (131,132):'45 MINUTES',(135,136):'EIGHT TIMES',(201,202):'LIFETIME PASS',(196,197):'PORT AUTHORITY',
 (64,65):'FAKE ID',(92,93):'ONLY JUST',(118,118):'BY HAND',(208,210):'GONE NOW',
 (84,86):'FREIGHT ELEVATOR',(198,199):'GIVES HIM',(213,215):'STILL WALKING',(144,144):'BELOW',
 (157,159):"CAN'T REACH",(160,161):'UP THERE'}
def clean(t):return t.strip('.,!?;:').upper()
groups=[]
for a0,b0 in _span:
    i=a0
    while i<=b0:
        if i+1<=b0:
            x,y=clean(w[i]['word']).lower(),clean(w[i+1]['word']).lower()
            joined=len(clean(w[i]['word']))+1+len(clean(w[i+1]['word']))
            pair=joined<=15 and w[i+1]['start']-w[i]['end']<.34 and (y not in STOP or y in TRAIL) and (x not in STOP or x in LEAD)
        else:pair=False
        groups.append(dict(start=w[i]['start'],end=w[i+1]['end'] if pair else w[i]['end'],
                           text=clean(w[i]['word'])+(' '+clean(w[i+1]['word']) if pair else '')))
        i+=2 if pair else 1
for (i0,i1),text in sorted(OVERRIDE.items()):
    start=w[i0]['start'];end=w[i1]['end']
    groups=[g for g in groups if not (g['start']<end-.01 and g['end']>start+.01)]
    groups.append(dict(start=start,end=end,text=text))
groups.sort(key=lambda g:g['start'])
caps=[]
for i,g in enumerate(groups):
    end=min(g['end']+.16,groups[i+1]['start']-.03) if i+1<len(groups) else g['end']+.16
    caps.append(dict(start=max(0,round(g['start']-.03,3)),end=round(end,3),text=g['text']))
(ROOT/'remotion-app/src/videos/petit/data.json').write_text(json.dumps(dict(fps=30,total=total,shots=out,words=w,captions=caps),ensure_ascii=False,indent=1)+'\n')
planned=[]
for g in caps:
 planned.extend([[math.ceil(g['start']*30)-1,math.ceil(g['start']*30)+4],[math.ceil(g['end']*30)-1,math.ceil(g['end']*30)+1]])
lines=['# Petit — locked production shot plan','',f'{total} frames / {total/30:.3f} s · 720×1280 · 30 fps.','', 'User approved script and voice-02 on 2026-11-11. Hook per user request.','', 'Every frame is deterministic; action ramps are clamped and hold their endpoints. A 1.2 s resolved tail follows the last word.','', '| Shot | Time | Place / distinct action |','|---|---|---|']
for s in out: lines.append(f"| {s['id']} | {s['a']/30:.2f}–{s['b']/30:.2f} | {s['place']}: {s['action']} |")
lines+=['','## Audio direction','Original score for this film (not Köpenick/Taipei/Beer). Curiosity/tension/relief arc: light street groove, tense night-pull, high-wire tension, warm park payoff. Music 5–6 LU below speech after ducking, 48 kHz stereo, −14 to −15 LUFS, true peak ≤−1 dBTP.','', '## Preview gate','Inspect all 26 sets/actions in portrait diagnostic frames before final render. Check wire/tower recognizability, face clearance, cable contact, caption band. Full render runs only after a manual preview dispatch and source fixes.']
(ROOT/'shoots/petit/SHOT_PLAN.md').write_text('\n'.join(lines)+'\n')
print(total,len(out))
