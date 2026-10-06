"""Render the actual app's software geometry, then label the diagnostic image.
Requires Node and Pillow. This does not automate or simulate a browser.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json,subprocess,os
root=Path(__file__).parents[1]
os.chdir(root)
subprocess.run(['node','tests/render-native.mjs'],check=True)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def face(size):
    try:return ImageFont.truetype(font,size)
    except OSError:return ImageFont.load_default()
im=Image.new('RGB',(1800,560),'#f3f5ef');d=ImageDraw.Draw(im)
d.text((28,20),'SKETCHBENCH v2.0 — native fillets and chamfers',font=face(26),fill='#22372f')
slugs=['rounded-block','chamfered-bore','filleted-enclosure']
names=['All twelve edges · R4 fillets','Circular bore · 1.5 mm chamfers','Inner and outer corners · R2 fillets']
for i,(slug,name) in enumerate(zip(slugs,names)):
    raw=Path('verification/'+slug+'.rgba');edges=Path('verification/'+slug+'-edges.json')
    pic=Image.frombytes('RGBA',(600,440),raw.read_bytes());bg=Image.new('RGBA',pic.size,'#eef0e8');bg.alpha_composite(pic);draw=ImageDraw.Draw(bg)
    for a,b in json.loads(edges.read_text()):draw.line([(a[0],a[1]),(b[0],b[1])],fill='#425c4d',width=1)
    im.paste(bg.convert('RGB'),(i*600,66));d.text((i*600+28,506),name,font=face(19),fill='#22372f')
    raw.unlink();edges.unlink()
d.text((28,540),'Actual app geometry and software rasterizer. This is not browser or GPU acceptance.',font=face(13),fill='#63726b')
im.save('verification/native-finishes-software.png')
