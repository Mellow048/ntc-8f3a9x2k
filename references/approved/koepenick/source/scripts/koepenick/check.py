import json,re,subprocess
from pathlib import Path
p=Path('deliveries/koepenick/koepenick-720p.mp4')
d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
v=next(s for s in d['streams'] if s['codec_type']=='video');a=next(s for s in d['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'],v['r_frame_rate'])==(720,1280,'30/1')
assert a['sample_rate']=='48000' and a['channels']==2
assert abs(float(d['format']['duration'])-2090/30)<.12
report=Path('deliveries/koepenick/qa-report.md').read_text()
assert 'black []; unplanned white []; frozen spans >=12f []' in report
l=float(re.search(r'I:\s*(-?[\d.]+) LUFS',report)[1]);assert -15.5<l<-13.5,l
peak=float(re.search(r'Peak:\s*(-?[\d.]+) dBFS',report)[1]);assert peak<=-1,peak
print('Technical gates PASS. This does not constitute aesthetic/user approval.')
