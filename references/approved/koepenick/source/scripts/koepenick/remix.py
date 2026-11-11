"""Audio-only revision: preserve reviewed H.264 packets, replace Python mix.
Run score.py first. Requires ffmpeg on PATH, FFMPEG, or imageio-ffmpeg.
Writes an ignored candidate and report; --publish installs it only after checks.
Original delivery remains recoverable from pinned commit 6b096c8.
"""
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'shoots/koepenick/audio'))
from dsp import read_wav, integrated, SR
import numpy as np

OUT = ROOT/'shoots/koepenick/out/audio'
VIDEO = ROOT/'deliveries/koepenick/koepenick-720p.mp4'
CANDIDATE = OUT/'koepenick-music-v2.mp4'
ff = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if not ff:
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()


def run(args):
    p = subprocess.run([ff, '-hide_banner', '-nostdin', *map(str, args)],
                       capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(p.stderr[-8000:])
    return p.stdout, p.stderr


def loudness(path):
    _, text = run(['-i', path, '-vn', '-af',
                  'loudnorm=I=-14.5:TP=-1.5:LRA=5:print_format=json', '-f', 'null', '-'])
    return json.loads(re.search(r'\{\s*"input_i".*?\}', text, re.S)[0])


def picture_hash(path):
    text, _ = run(['-v', 'error', '-i', path, '-map', '0:v:0',
                   '-c:v', 'copy', '-f', 'hash', '-hash', 'sha256', '-'])
    return text.strip()


def check_music():
    data = json.loads((OUT/'groove-events.json').read_text())
    assert data['bpm'] == 112
    timing = json.loads((ROOT/'remotion-app/src/videos/koepenick/data.json').read_text())
    assert timing['words'][-1]['end'] < data['cadence'] < timing['total']/30-.5
    q = data['quarter']
    events = data['events']
    # Event starts may differ only by sample-rounding, never by a cut reset.
    for e in events:
        unit = q/2 if e['kind'] == 'hat' else q
        assert abs(e['time']/unit-round(e['time']/unit)) < 1e-6, e
    kicks = [e['time'] for e in events if e['kind'] == 'kick']
    backbeats = [e['time'] for e in events if e['kind'] == 'backbeat']
    assert len(kicks) == len(backbeats) == 64
    assert np.allclose(np.diff(kicks), q*2, atol=1/SR)
    assert np.allclose(np.diff(backbeats), q*2, atol=1/SR)
    assert np.allclose(np.array(backbeats)-kicks, q, atol=1/SR)
    stems = {}
    for name in ['voice-processed', 'music', 'sfx']:
        x, sr = read_wav(str(OUT/f'{name}.wav'))
        assert sr == SR and x.shape == (2, 3344000)
        assert np.isfinite(x).all() and np.max(np.abs(x)) < 1
        stems[name] = float(integrated(x))
    # Same section-level targets as v1; catch accidental quiet-music workaround.
    relative = stems['music']-stems['voice-processed']
    assert abs(relative-(-24.5+18.9)) < .3, relative
    # Check actual synthesized drum energy, not only the event list. Every
    # quarter has a clear transient over its preceding trough, on the same grid.
    drums, _ = read_wav(str(OUT/'drums.wav'))
    contrasts = []
    for at in np.arange(q, data['cadence']-.01, q):
        start = round(at*SR)
        attack = np.mean(drums[:, start:start+round(.045*SR)]**2)
        trough = np.mean(drums[:, start-round(.08*SR):start-round(.025*SR)]**2)
        contrasts.append(10*np.log10((attack+1e-20)/(trough+1e-20)))
    assert min(contrasts) > 10, min(contrasts)
    return stems, relative, min(contrasts), data


stems, relative, contrast, data = check_music()
# Two-pass normalization retains mix balance; common gain does not turn the
# music down relative to speech. Measure the lossy AAC in the actual candidate.
measured = loudness(OUT/'premix.wav')
af = ('loudnorm=I=-14.5:TP=-1.5:LRA=5:'
      f'measured_I={measured["input_i"]}:measured_TP={measured["input_tp"]}:'
      f'measured_LRA={measured["input_lra"]}:measured_thresh={measured["input_thresh"]}:'
      f'offset={measured["target_offset"]}:linear=true')
run(['-v', 'error', '-y', '-i', OUT/'premix.wav', '-af', af,
     '-ar', '48000', '-ac', '2', OUT/'mix.wav'])
before = picture_hash(VIDEO)
run(['-v', 'error', '-y', '-i', VIDEO, '-i', OUT/'mix.wav',
     '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac',
     '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', '69.666667',
     '-movflags', '+faststart', CANDIDATE])
assert picture_hash(CANDIDATE) == before, 'Picture packets changed'
_, decode = run(['-xerror', '-i', CANDIDATE, '-map', '0:v:0', '-map', '0:a:0',
                 '-af', 'silencedetect=noise=-45dB:d=0.35', '-f', 'null', '-'])
assert 'silence_start' not in decode, decode
assert '720x1280' in decode and '30 fps' in decode
assert '48000 Hz, stereo' in decode
assert int(re.findall(r'frame=\s*(\d+)', decode)[-1]) == 2090
final = loudness(CANDIDATE)
assert -15.5 < float(final['input_i']) < -13.5, final
assert float(final['input_tp']) <= -1, final
result = {
    'version': 'music-v2', 'stems_lufs': stems, 'music_relative_lu': relative,
    'minimum_drum_attack_contrast_db': contrast,
    'kick_count': 64, 'backbeat_count': 64, 'bpm': 112,
    'meter': '4/4, continuous from zero; no restart at cuts',
    'cadence_seconds': data['cadence'],
    'video_packet_hash': before, 'video_packets_unchanged': True,
    'decoded_frames': 2090, 'silence_detected': False,
    'aac_loudness': final,
    'mp4_sha256': hashlib.sha256(CANDIDATE.read_bytes()).hexdigest(),
    'listened_by_agent': False,
}
(OUT/'remix-qa.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result, indent=2))
if '--publish' in sys.argv:
    # Checks have completed before replacing the usable delivery file.
    shutil.copyfile(CANDIDATE, VIDEO)
    shutil.copyfile(OUT/'remix-qa.json', ROOT/'deliveries/koepenick/music-v2-qa.json')
    print('Published checked audio-only replacement.')
