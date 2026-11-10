"""Prepare only the three isolated curiosity shoots. Arena TTS is the voice source.
Forced alignment: PocketSphinx with known transcript; timings saved for review.
"""
import json, re, wave, math
from pathlib import Path
import numpy as np
from scipy.signal import resample_poly
from pocketsphinx import Decoder
ROOT = Path(__file__).resolve().parents[2]
TEXT = {
'beer': "London once suffered a flood made entirely of beer. On October seventeenth, eighteen fourteen, a giant wooden vat stood inside the Horse Shoe Brewery. Iron hoops held it together. When one failed, the vat burst. Beer smashed through the brewery wall and poured into the streets of Saint Giles. But this wasn't free drinks. It was a disaster. Homes were damaged. Cellars flooded. Eight people died. Neighbours searched the wreckage, keeping quiet so they could hear anyone trapped. And afterward? The brewery received tax relief on the beer it had lost.",
'survivor': "He survived an atomic bomb. Then he went home to Nagasaki. In August nineteen forty-five, Tsutomu Yamaguchi was in Hiroshima on a business trip. When the bomb exploded, he suffered terrible burns. He survived the night, then travelled home by train. Home was Nagasaki. Three days after Hiroshima, a second atomic bomb struck that city. Yamaguchi survived again. He wasn't the only person to experience both bombings. But Japan later officially recognised him as a survivor of both. He lived to ninety-three, and spoke out against nuclear weapons. His story wasn't about being lucky. It was about making sure nobody had to survive the same horror again.",
'lake': "A drilling crew accidentally helped turn a lake into a giant drain. In nineteen eighty, an oil rig was drilling beneath Louisiana's Lake Peigneur. Under the lake was something else: a working salt mine. The drilling breached the mine, and water rushed underground. Think of pulling the plug in a bathtub. Except this drain kept getting bigger. A huge whirlpool swallowed the drilling rig and eleven barges. A canal even reversed direction, bringing water back toward the disappearing lake. Remarkably, the miners escaped, and nobody died. As the lake refilled, nine of those barges came back up. The mine did not."
}
SOURCES = {
'beer': [('Smithsonian: This 1814 Beer Flood Killed Eight People','https://www.smithsonianmag.com/smart-news/1814-beer-flood-killed-eight-people-180964256/'),('Smithsonian: Four Deadly Disasters Caused by Food','https://www.smithsonianmag.com/arts-culture/four-deadly-disasters-caused-by-food-65498495/')],
'survivor': [('NPR obituary, 6 January 2010','https://www.npr.org/2010/01/06/122291007/only-survivor-of-both-atomic-bombs-dies')],
'lake': [('ScienceBlog, historical marker and university archive synthesis','https://scienceblog.com/t-lake-peigneur-barges-salt-mine-disaster/'),('UL Lafayette Special Collections, Lake Peigneur disaster photographs','https://archives.louisiana.edu/repositories/2/resources/335'),('Federal investigation caveat reported by Ecoticias','https://www.ecoticias.com/en/louisianas-lake-peigneur-emptied-into-a-salt-mine-within-hours-in-1980-while-a-texaco-rig-drilled-on-the-lake-and-about-50-miners-escaped-but-federal-investigators-never-pinned-down-the-exact-caus/51892/')]
}
PRON = {'tsutomu':'T S UW T OW M UW','yamaguchi':'Y AA M AA G UW CH IY','peigneur':'P EY N Y ER','recognised':'R EH K AH G N AY Z D','neighbours':'N EY B ER Z','travelled':'T R AE V AH L D'}
for slug, text in TEXT.items():
    folder = ROOT/'shoots'/f'curiosity-{slug}'
    wav = wave.open(str(folder/'voice/voice.wav'))
    sr=wav.getframerate(); voice=np.frombuffer(wav.readframes(wav.getnframes()),np.int16).astype(float)/32768
    dur=len(voice)/sr
    dec=Decoder(samprate=16000, loglevel='ERROR')
    tokens=re.findall(r"[a-z]+(?:'[a-z]+)?",text.lower().replace('-',' '))
    for token in tokens:
        if dec.lookup_word(token) is None:
            if token not in PRON: raise ValueError(f'Missing pronunciation: {token}')
            dec.add_word(token,PRON[token])
    dec.set_align_text(' '.join(tokens))
    pcm=(resample_poly(voice,16000,sr)*32767).astype(np.int16).tobytes()
    dec.start_utt(); dec.process_raw(pcm,False,True); dec.end_utt()
    segments=list(dec.seg())
    words=[{'word':re.sub(r'\(\d+\)$','',s.word),'start':round(s.start_frame/100,3),'end':round((s.end_frame+1)/100,3)} for s in segments if s.word not in ('<sil>','<s>','</s>','[SPEECH]')]
    assert len(words)==len(tokens),(slug,len(words),len(tokens))
    for w,token in zip(words,tokens): assert w['word']==token
    (folder/'voice/words.json').write_text(json.dumps(words,indent=2))
    # Original gentle plucked score, ducked continuously beneath narration.
    outsr=48000; n=math.ceil((dur+.12)*30)/30; N=round(n*outsr)
    v=resample_poly(voice,outsr,sr); v=np.pad(v,(0,max(0,N-len(v))))[:N]
    t=np.arange(N)/outsr; music=np.zeros(N); sfx=np.zeros(N)
    notes=[146.83,174.61,220,196] if slug=='survivor' else [196,246.94,293.66,220]
    for k,at in enumerate(np.arange(0,n,.4)):
        f=notes[(k//4)%4]*(2 if k%4==2 else 1); ix=int(at*outsr); length=min(int(.7*outsr),N-ix); tt=np.arange(length)/outsr
        music[ix:ix+length]+=.026*np.exp(-tt*7)*(np.sin(2*np.pi*f*tt)+.22*np.sin(4*np.pi*f*tt))
    # soft low percussion; no martial percussion on survivor story.
    if slug!='survivor':
        for at in np.arange(.8,n,.8):
            ix=int(at*outsr); length=min(int(.18*outsr),N-ix); tt=np.arange(length)/outsr
            music[ix:ix+length]+=.022*np.sin(2*np.pi*(65*tt-60*tt**2))*np.exp(-tt*25)
    # Speech envelope gives a further 5 dB dip during words.
    duck=np.ones(N)
    for w in words:
        a=max(0,int((w['start']-.06)*outsr)); b=min(N,int((w['end']+.12)*outsr)); duck[a:b]=.56
    music*=duck * 10**(3/20)
    # Story-specific restrained synthesized cues, defined by word timings.
    cues={'beer':['failed','burst','poured'],'lake':['breached','whirlpool','reversed'],'survivor':['train']}[slug]
    rng=np.random.default_rng(42)
    cue_report=[]
    for cue in cues:
        hits=[w for w in words if w['word']==cue]
        if not hits: continue
        at=hits[0]['start']; ix=int(at*outsr); length=min(int(.8*outsr),N-ix); tt=np.arange(length)/outsr
        noise=rng.normal(0,1,length); noise=np.convolve(noise,np.ones(40)/40,'same')
        sfx[ix:ix+length]+=.15*noise*np.sin(np.pi*np.minimum(tt/.8,1))**2*10**(-6/20)
        cue_report.append(f'- {at:.2f}s: {cue}, synthesized filtered noise, SFX -6 dB')
    audio=folder/'audio'; audio.mkdir(exist_ok=True)
    def save(name,x):
        stereo=np.stack([x,x],axis=1); w=wave.open(str(audio/name),'wb');w.setparams((2,2,outsr,0,'NONE','not compressed'));w.writeframes((np.clip(stereo,-.98,.98)*32767).astype(np.int16).tobytes());w.close()
    save('music.wav',music);save('sfx.wav',sfx);save('premix.wav',v+music+sfx)
    (audio/'cues.md').write_text('# Original synthesized sound\nArena TTS voice unchanged in premix; music +3 dB, SFX -6 dB. Final loudness normalized in CI.\n'+'\n'.join(cue_report))
    script='# '+{'beer':'The Day London Flooded With Beer','survivor':'The Man Who Survived Both Atomic Bombs','lake':'The Lake That Became a Drain'}[slug]+'\n\n## Sources\n'+'\n'.join(f'- [{label}]({url})' for label,url in SOURCES[slug])+'\n\n## Fact boundaries\n'
    script+= {'beer':'Eight deaths; no drinking-crowd myth; no disputed volume or wave-height figures. No graphic casualties.\n','survivor':'Yamaguchi was not the only double survivor; distinguish official recognition from uniqueness. No invented dialogue, no graphic injuries.\n','lake':'The drilling breach is the standard historical explanation; the flooded mine prevented definitive inspection of the precise initiating failure. Do not claim a proven surveying error. Eleven barges lost, nine resurfaced; no exact miner count.\n'}[slug]
    script+='\n## Narration\n'+text+'\n\n## Production\nApproved batch; Arena TTS voice-00. 720x1280, 30fps, GitHub Actions only. Per user update: 1–2-word moving subtitles. PocketSphinx forced-aligned timings; verify visually.\n'
    (folder/'SCRIPT.md').write_text(script)
    target=ROOT/'remotion-app/src/curiosity'/f'{slug}.json'
    target.write_text(json.dumps({'slug':slug,'duration':n,'frames':round(n*30),'words':words},indent=2))
    print(slug,n,len(words),flush=True)

# TypeScript data avoids changing the shared project's tsconfig for JSON imports.
base=ROOT/'remotion-app/src/curiosity'
(base/'data.ts').write_text('// Generated from forced-aligned Arena narration.\n'+''.join(f'export const {s} = '+json.dumps(json.loads((base/f'{s}.json').read_text()),separators=(',',':'))+';\n' for s in TEXT))
