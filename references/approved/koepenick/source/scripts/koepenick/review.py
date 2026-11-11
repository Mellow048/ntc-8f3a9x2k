"""Inspect decoded FINISHED MP4 samples, not just preview-source stills.
Writes ignored contact sheets for visual review. Requires pillow and ffmpeg
(PATH, FFMPEG, or imageio-ffmpeg). It does not claim listening or approval.
"""
from pathlib import Path
import os,shutil,subprocess,json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];VIDEO=ROOT/'deliveries/koepenick/koepenick-720p.mp4';OUT=ROOT/'shoots/koepenick/out/final-review';OUT.mkdir(parents=True,exist_ok=True)
ff=os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if not ff:
 import imageio_ffmpeg
 ff=imageio_ffmpeg.get_ffmpeg_exe()
data=json.loads((ROOT/'remotion-app/src/videos/koepenick/data.json').read_text())
# Mid-action samples of every shot plus start and ending.
frames=[0]+[int(s['a']+(s['b']-s['a'])*.65) for s in data['shots']]+[data['total']-6]
for f in frames:
 dest=OUT/f'frame-{f:04d}.png'
 subprocess.run([ff,'-v','error','-y','-ss',str(f/30),'-i',str(VIDEO),'-frames:v','1',str(dest)],check=True)
for k in range(0,len(frames),8):
 sheet=Image.new('RGB',(4*270,2*500),'#20202b');draw=ImageDraw.Draw(sheet)
 for j,f in enumerate(frames[k:k+8]):
  x=j%4*270;y=j//4*500;sheet.paste(Image.open(OUT/f'frame-{f:04d}.png').resize((270,480)),(x,y));draw.text((x+5,y+483),f'frame {f} / {f/30:.2f}s',fill='white')
 sheet.save(OUT/f'sheet-{k//8}.jpg',quality=92)
# A 2fps motion sampling of the final MP4 for finer continuity review.
subprocess.run([ff,'-v','error','-y','-i',str(VIDEO),'-vf','fps=2,scale=180:320','-f','image2',str(OUT/'motion-%03d.jpg')],check=True)
ms=sorted(OUT.glob('motion-*.jpg'))
for k in range(0,len(ms),24):
 sheet=Image.new('RGB',(6*180,4*338),'#20202b');draw=ImageDraw.Draw(sheet)
 for j,p in enumerate(ms[k:k+24]):
  x=j%6*180;y=j//6*338;sheet.paste(Image.open(p),(x,y));draw.text((x+4,y+321),f'{(k+j)/2:.1f}s',fill='white')
 sheet.save(OUT/f'motion-sheet-{k//24}.jpg',quality=90)
print(f'{len(frames)} decoded final-picture samples and {len(ms)} motion samples in {OUT}')
