# Gera ícones do app e telas de abertura a partir de assets/boss-portrait.png
# (retrato transparente renderizado com www/index.html?shot=gorruk).
from PIL import Image, ImageDraw, ImageFilter
import glob, os
R=os.path.join(os.path.dirname(__file__),'..')
head=Image.open(f"{R}/assets/boss-portrait.png").convert("RGBA"); head=head.crop(head.getbbox())
def bg(size):
    im=Image.new("RGBA",(size,size)); d=ImageDraw.Draw(im); c0=(70,46,96); c1=(17,12,24)
    for r in range(size,0,-2):
        t=r/size; col=tuple(int(c0[i]*(1-t)+c1[i]*t) for i in range(3))+(255,)
        d.ellipse([size/2-r*.75,size*.42-r*.75,size/2+r*.75,size*.42+r*.75],fill=col)
    glow=Image.new("RGBA",(size,size),(0,0,0,0)); ImageDraw.Draw(glow).ellipse([size*.18,size*.12,size*.82,size*.76],fill=(255,201,60,110))
    return Image.alpha_composite(im,glow.filter(ImageFilter.GaussianBlur(size*.08)))
def place(canvas,frac,yoff=0.0):
    size=canvas.size[0]; w=int(size*frac); h=int(head.size[1]*w/head.size[0])
    if h>size*frac: h=int(size*frac); w=int(head.size[0]*h/head.size[1])
    canvas.alpha_composite(head.resize((w,h),Image.LANCZOS),((size-w)//2,int((size-h)/2+yoff*size))); return canvas
store=place(bg(1024),.8,.04)
store.save(f"{R}/assets/icon-1024.png"); store.resize((512,512),Image.LANCZOS).save(f"{R}/assets/icon-512.png")
fg=place(Image.new("RGBA",(432,432),(0,0,0,0)),.62,.03)
res=f"{R}/android/app/src/main/res"
def masked(img,sz,shape):
    m=Image.new("L",(sz*4,sz*4),0); d=ImageDraw.Draw(m)
    (d.ellipse if shape=='round' else lambda b,fill: d.rounded_rectangle(b,radius=sz*.72,fill=fill))([0,0,sz*4-1,sz*4-1],fill=255)
    o=Image.new("RGBA",(sz,sz),(0,0,0,0)); o.paste(img.resize((sz,sz),Image.LANCZOS),(0,0),m.resize((sz,sz),Image.LANCZOS)); return o
for k,s in {"mdpi":1,"hdpi":1.5,"xhdpi":2,"xxhdpi":3,"xxxhdpi":4}.items():
    fg.resize((int(108*s),int(108*s)),Image.LANCZOS).save(f"{res}/mipmap-{k}/ic_launcher_foreground.png")
    sz=int(48*s); masked(store,sz,'square').save(f"{res}/mipmap-{k}/ic_launcher.png"); masked(store,sz,'round').save(f"{res}/mipmap-{k}/ic_launcher_round.png")
open(f"{res}/values/ic_launcher_background.xml","w").write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#2E2140</color>\n</resources>\n')
for f in glob.glob(f"{res}/drawable*/splash.png"):
    w,h=Image.open(f).size; im=Image.new("RGB",(w,h),(17,12,24)); s=int(min(w,h)*.42)
    m=Image.new("L",(s,s),0); ImageDraw.Draw(m).ellipse([0,0,s-1,s-1],fill=255)
    im.paste(store.resize((s,s),Image.LANCZOS),((w-s)//2,(h-s)//2),m); im.save(f)
print("ícones e splash gerados")
