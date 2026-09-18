"""Normalize generated source artwork according to docs/ASSET-MANIFEST.md.
Requires Pillow. Source boundaries are inspected overrides, not assumed AI grid.
"""
from pathlib import Path
import json, hashlib
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'apps/web/public/assets'
OUT.mkdir(parents=True, exist_ok=True)
ANIMATIONS = ['idle','walk','eat','play','rest','cast','ward','celebrate']
DURATIONS = [500,200,300,250,800,220,300,300]
PROPS = ['berries','toy','nest','egg','grass','path','mushroom','rune','spark','ward','bloom','star','feed-icon','play-icon','rest-icon','habitat-icon']

def normalize(name, filename, cell, margin, xs, ys):
    source=Image.open(ROOT/'art/source'/filename).convert('RGBA')
    frames=[]; rects=[]
    for i in range(16):
        col,row=i%4,i//4
        rect=(xs[col],ys[row],xs[col+1],ys[row+1]); rects.append(rect)
        crop=source.crop(rect)
        # Crisp alpha removes barely-visible generation fringes, preserving silhouette.
        crop.putalpha(crop.getchannel('A').point(lambda a:255 if a>=128 else 0))
        bbox=crop.getbbox()
        if not bbox: raise ValueError(f'Empty source frame {i}')
        if bbox[0]==0 or bbox[1]==0 or bbox[2]==crop.width or bbox[3]==crop.height:
            raise ValueError(f'Source frame touches crop boundary: {name}/{i} {bbox}')
        frames.append(crop.crop(bbox))
    # One scale for the whole atlas, never independent x/y stretching.
    factor=min((cell-2*margin)/max(f.width for f in frames),(cell-2*margin)/max(f.height for f in frames))
    atlas=Image.new('RGBA',(cell*4,cell*4)); bounds=[]
    for i,frame in enumerate(frames):
        size=(max(1,round(frame.width*factor)),max(1,round(frame.height*factor)))
        frame=frame.resize(size,Image.Resampling.NEAREST)
        x=(cell-frame.width)//2;y=cell-margin-frame.height
        atlas.alpha_composite(frame,((i%4)*cell+x,(i//4)*cell+y));bounds.append([x,y,x+frame.width,y+frame.height])
    atlas.save(OUT/f'{name}.png',optimize=True)
    return {'file':f'{name}.png','cell':cell,'columns':4,'rows':4,'pivot':[cell//2,cell-margin],'safeBorder':margin,'sourceRects':rects,'uniformScale':factor,'bounds':bounds}

pet=normalize('longneck','longneck-scifi-generated.png',64,4,[0,330,640,950,1254],[0,335,645,925,1254])
props=normalize('garden','garden-generated.png',32,2,[0,320,635,955,1254],[0,340,642,944,1254])
manifest={'version':1,'pet':pet,'props':props,'animations':{key:{'frames':[i*2,i*2+1],'frameMs':DURATIONS[i]} for i,key in enumerate(ANIMATIONS)},'propFrames':dict(zip(PROPS,range(16)))}
# Derived icon using the generated idle frame on a simple code-native background.
icon=Image.new('RGBA',(64,64),'#211d38'); d=ImageDraw.Draw(icon)
d.rounded_rectangle((1,1,62,62),radius=12,outline='#e8c883',width=2)
icon.alpha_composite(Image.open(OUT/'longneck.png').crop((0,0,64,64)))
for size in [180,192,512]:icon.resize((size,size),Image.Resampling.NEAREST).save(OUT/f'icon-{size}.png',optimize=True)
manifest['files']={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(OUT.glob('*.png'))}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(ROOT/'apps/web/src/asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
# Inspectable integer-scale atlas montage, independent of a web browser.
review=Image.new('RGBA',(768,768),'#211d38')
review.alpha_composite(Image.open(OUT/'longneck.png').resize((768,768),Image.Resampling.NEAREST))
review.convert('RGB').save(ROOT/'art/longneck-review.png')
print(json.dumps(manifest['files'],indent=2))
