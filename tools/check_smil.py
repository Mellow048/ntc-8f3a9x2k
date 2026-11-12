"""Verify the SMIL layer with a DOM parse (not regex) against the build geometry."""
import math, re, sys
from xml.etree import ElementTree as ET

SVG = sys.argv[1] if len(sys.argv) > 1 else "../pelican-bicycle.svg"
NS = "{http://www.w3.org/2000/svg}"
BB=(474,996); CRANK=40; PHASE0=-86.0; CRANKDUR=1.5
HIP=(400,806); L1,L2=96,144
def nums(s): return [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", s or "")]

root=ET.parse(SVG).getroot()
anim=list(root.iter(NS+"animateTransform"))+list(root.iter(NS+"animate"))
print("animate elements found:", len(anim))

rot=[a for a in root.iter(NS+"animateTransform") if a.get("type")=="rotate"]
print("rotate animations:", len(rot))
bad=0; checked=0; circles=0

# 1. every rotating group whose base transform carries a 3-number pivot must
#    start its values at that same pivot (no jump on the first frame)
for g in root.iter(NS+"g"):
    tr=(g.get("transform") or "")
    if not tr.startswith("rotate("): continue
    hd=nums(tr[tr.index("(")+1:tr.index(")")])
    if len(hd) not in (1,3): continue
    at=None
    for c in g:
        if c.tag==NS+"animateTransform" and c.get("type")=="rotate": at=c
    if at is None or not at.get("values"): continue
    first=nums(at.get("values").split(";")[0])
    checked+=1
    if abs(first[0]-hd[0])>0.05:
        print("  static/kf0 mismatch: %.2f vs %.2f" % (hd[0], first[0])); bad+=1
    if len(hd)==3 and abs(first[1]-hd[1])>0.5:
        print("  pivot drift: %s vs %s" % (first[1:], hd[1:])); bad+=1

# 2. full-turn rotators (cranks, wheels): |from-to| must be exactly 360
turns=0
for at in rot:
    f,t=at.get("from"),at.get("to")
    if f and t:
        a,b=nums(f)[0],nums(t)[0]
        if abs(abs(b-a)-360)<.01: turns+=1
        else: print("  rotator not a full turn:",f,t); bad+=1

# 3. pedals: every sampled translation lies on the crank circle
for g in root.iter(NS+"g"):
    at=None
    for c in g:
        if c.tag==NS+"animateTransform" and c.get("type")=="translate" and c.get("values"):
            at=c
    if at is None: continue
    v=at.get("values").split(";")
    if len(v)<40: continue
    err=max(abs(math.hypot(nums(s)[0]-BB[0], nums(s)[1]-BB[1])-CRANK) for s in v if nums(s))
    circles+=1
    if err>0.08: print("  pedal off circle by %.3f px"%err); bad+=1

print("static/kf0 checks:",checked,"| full-turn rotators:",turns,"| pedal paths:",circles)
print("RESULT:","PASS" if bad==0 else "FAIL (%d)"%bad)
