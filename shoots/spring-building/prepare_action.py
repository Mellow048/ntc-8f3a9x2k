from pathlib import Path
import sys,json,wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from prepare_series_voice import decode_take,align,words_of,SR
p=Path(__file__).resolve().parent
x=decode_take(p/'voice/action-take.mp3')
words=align(x,words_of((p/'ACTION-SCRIPT.txt').read_text()),.12)
x=np.concatenate([np.zeros(int(.12*SR)),x,np.zeros(int(.35*SR))])
frames=int(np.ceil(len(x)/SR*30));x=np.pad(x,(0,frames*(SR//30)-len(x)))
with wave.open(str(p/'voice/action.wav'),'wb') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(x,-1,1)*32767).astype('<i2').tobytes())
(p/'voice/action-words.json').write_text(json.dumps(words,indent=2)+'\n')
(p/'timing.json').write_text(json.dumps({'frames':frames,'fps':30,'duration':frames/30},indent=2)+'\n')
datap=ROOT.parent/'remotion-app/src/videos/engineering-series/data.json'
data=json.loads(datap.read_text());data['spring-building']['frames']=frames;data['spring-building']['words']=words
# Dedicated story.ts owns the shot list; these minimal beats are not used by SpringWorld.
data['spring-building']['beats']=[{'frame':0,'scene':'cityhall','phrase':''}]
datap.write_text(json.dumps(data,separators=(',',':'))+'\n')
print('FRAMES',frames)
for i in range(0,len(words),12):print(' '.join(f"{w['word']}:{w['start']:.2f}" for w in words[i:i+12]))
