from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'img'
# Logo transparente, círculo azul e letras AV em branco
im=Image.new('RGBA',(256,256),(0,0,0,0));d=ImageDraw.Draw(im);d.ellipse((8,8,248,248),fill='#1d6fe0')
font=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',88)
b=d.textbbox((0,0),'AV',font=font,stroke_width=1);d.text(((256-(b[2]-b[0]))/2-b[0],(256-(b[3]-b[1]))/2-b[1]-3),'AV',font=font,fill='white',stroke_width=1,stroke_fill='white')
im.save(OUT/'logo.png')
# Banner 1200x630: imagem à direita, texto à esquerda
W,H=1200,630
banner=Image.new('RGB',(W,H),'#060c1a')
photo=Image.open(OUT/'xp'/'banheira-montada-1280.webp').convert('RGB')
# crop 620x630 from source to fill right half
ratio=max(620/photo.width,630/photo.height);photo=photo.resize((round(photo.width*ratio),round(photo.height*ratio)),Image.Resampling.LANCZOS)
x=max(0,(photo.width-620)//2);y=max(0,(photo.height-630)//2);photo=photo.crop((x,y,x+620,y+630))
banner.paste(photo,(580,0))
d=ImageDraw.Draw(banner);title=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',64);sub=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',30)
d.text((72,205),'AquaVita Peças',font=title,fill='white');d.text((76,300),'Peças para banheiras e spas',font=sub,fill='#9fb0cd')
banner.save(OUT/'banner2.webp','WEBP',quality=88,method=6)
