"""Frame/loudness checks, using the existing verifier without changing it."""
import json,math,re,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]; slug=sys.argv[1]
data=json.loads((root/f'remotion-app/src/curiosity/{slug}.json').read_text())
indices={'beer':[0,9,24,32,35,42,49,61,63,66,78], 'survivor':[0,5,11,25,29,37,42,49,56,59,68,79,96], 'lake':[0,12,24,34,43,51,57,67,79,86,97]}[slug]
starts=[0]+[max(0,math.floor(data['words'][i]['start']*30+.5)-2) for i in indices[1:]]
shots=[{'id':i+1,'a':a,'b':(starts+[data['frames']])[i+1]} for i,a in enumerate(starts)]
out=root/f'remotion-app/out/curiosity-{slug}';out.mkdir(exist_ok=True,parents=True)
meta=out/'shots.json';meta.write_text(json.dumps({'shots':shots,'planned':([[295,316],[618,639]] if slug=='survivor' else [])}))
video=out/f'curiosity-{slug}.mp4'
subprocess.run([sys.executable,str(root/'templates/scripts/short_qa.py'),str(video),str(out/'qa'),str(meta)],check=True)
report=(out/'qa/report.md').read_text()
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
assert (v['width'],v['height'],v['r_frame_rate'])==(720,1280,'30/1'),v
assert abs(float(probe['format']['duration'])-data['duration'])<.12
assert 'black []; unplanned white []; frozen spans >=12f []' in report,'Frame QA flags: inspect report'
match=re.search(r'I: (-?[\d.]+) LUFS',report)
assert match and -18<float(match[1])<-12,'Loudness outside target range'
# Pops are review flags rather than an automatic pass: inspect them and contact sheets.
pops=re.search(r'POPS.*?: (.*)',report)
summary={'specs':'720x1280 / 30fps / H.264 / AAC 48kHz','black_white_freeze':'PASS','loudness':'PASS','pop_review':pops[1] if pops else 'unknown','captions':'1–2 words, forced-aligned Arena TTS; burned in','note':'Automated QA is not a substitute for visual/source review.'}
(out/'qa/gates.json').write_text(json.dumps(summary,indent=2))
