"""CI validation for source-independent atlas geometry, alpha and checksums."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1]
out=root/'apps/web/public/assets'
m=json.loads((out/'manifest.json').read_text())
assert m==json.loads((root/'apps/web/src/asset-manifest.json').read_text())
assert set(m['animations'])=={'idle','walk','eat','play','rest','cast','ward','celebrate'}
for key in ['pet','props']:
    spec=m[key];im=Image.open(out/spec['file']);cell=spec['cell'];border=spec['safeBorder']
    assert im.mode=='RGBA' and im.size==(cell*4,cell*4)
    for i in range(16):
        frame=im.crop(((i%4)*cell,(i//4)*cell,(i%4+1)*cell,(i//4+1)*cell))
        bbox=frame.getbbox();assert bbox and min(bbox[:2])>=border and max(bbox[2:])<=cell-border,(key,i,bbox)
        for scale in [1,2,3]:
            enlarged=frame.resize((cell*scale,cell*scale),Image.Resampling.NEAREST)
            assert enlarged.getbbox()==tuple(x*scale for x in bbox)
for spec in m['animations'].values():
    assert all(0<=i<16 for i in spec['frames']) and spec['frameMs']>0
for name,record in m['files'].items():
    p=out/name
    assert p.stat().st_size==record['bytes']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==record['sha256']
print(f'Validated 32 sprites, 8 animations, 1x/2x/3x alpha bounds, icons and hashes; {sum(v["bytes"] for v in m["files"].values())} runtime PNG bytes.')
