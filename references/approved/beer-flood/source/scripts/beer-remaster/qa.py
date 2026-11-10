"""Beer-only remaster verification; no edits to the other shorts' reports."""
import json,math,re,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
data=json.loads((root/'remotion-app/src/curiosity/beer.json').read_text())
indices=[0,9,24,32,35,42,49,61,63,66,78]
starts=[0]+[math.floor(data['words'][i]['start']*30+.5)-2 for i in indices[1:]]
shots=[{'id':i+1,'a':a,'b':(starts+[data['frames']])[i+1]} for i,a in enumerate(starts)]
# Match the explicitly planned insert edits in story.ts, not false "pop" flags.
beats={1:[.56],2:[.29,.55,.76],3:[.57],7:[.36,.70],10:[.38,.72],11:[.36,.68]}
planned=[[395,405],[432,442]]
for shot in shots:
 for at in beats.get(shot['id'],[]):
  cut=shot['a']+math.floor(at*(shot['b']-shot['a'])+.5)
  planned.append([cut-2,cut+2])
i=0;words=data['words']
while i<len(words):
 a=words[i];b=words[i+1] if i+1<len(words) else None
 pair=bool(b and len(a['word'])+len(b['word'])<=13 and b['start']-a['end']<.32)
 end=b['end'] if pair else a['end']
 sf=math.ceil((a['start']-.035)*30);ef=math.ceil((end+.15)*30)
 planned.extend([[max(0,sf-1),sf+5],[ef-1,ef+1]])
 i+=2 if pair else 1
folder=root/'shoots/curiosity-beer/out/remaster';folder.mkdir(parents=True,exist_ok=True)
meta=folder/'shots.json';meta.write_text(json.dumps({'shots':shots,'planned':planned}))
video=root/'deliveries/beer-flood-remastered/beer-flood-remastered-720p.mp4'
subprocess.run([sys.executable,str(root/'templates/scripts/short_qa.py'),str(video),str(folder/'qa'),str(meta)],check=True)
report=(folder/'qa/report.md').read_text()
(root/'deliveries/beer-flood-remastered/qa-report.md').write_text(report)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
assert (v['width'],v['height'],v['r_frame_rate'])==(720,1280,'30/1')
assert abs(float(probe['format']['duration'])-data['duration'])<.12
assert 'black []; unplanned white []; frozen spans >=12f []' in report
m=re.search(r'I:\s+(-?[\d.]+) LUFS',report);assert m and -18<float(m[1])<-12
print('720p, duration, loudness, black/white/freeze gates PASS. Inspect any pop flags visually.')
