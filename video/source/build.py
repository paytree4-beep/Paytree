from PIL import Image
import subprocess
BG=(250,245,234)
def comp(src,out,scale_h=None,scale_w=None,max_w=1800,max_h=1000):
    im=Image.open(src).convert('RGB'); w,h=im.size
    s=min(max_w/w,max_h/h); im=im.resize((int(w*s),int(h*s)),Image.LANCZOS)
    c=Image.new('RGB',(1920,1080),BG); c.paste(im,((1920-im.width)//2,(1080-im.height)//2)); c.save(out)
comp('hero.png','s_hero.png',max_w=1920,max_h=1080)
comp('phone.png','s_phone.png',max_h=1020)
comp('features.png','s_feat.png',max_w=1920)
comp('pricing.png','s_price.png',max_h=1060)
comp('cta.png','s_cta.png',max_w=1920)
# strip: 2x scale for panning
st=Image.open('strip.png').convert('RGB'); s=3840/st.width; st=st.resize((3840,int(st.height*s)),Image.LANCZOS)
c=Image.new('RGB',(3840,1080),BG); c.paste(st,(0,(1080-st.height)//2)); c.save('s_strip.png')
scenes=[('c_intro.png',3.5,'in'),('s_hero.png',5,'in'),('s_phone.png',4.5,'in'),('s_strip.png',3.5,'pan'),('s_feat.png',5,'in'),('s_price.png',4.5,'in'),('s_cta.png',3,'in'),('c_outro.png',3.5,'out')]
fps=30;clips=[]
for i,(f,d,m) in enumerate(scenes):
    n=int(d*fps)+fps  # extra for crossfade
    if m=='pan':
        vf=f"crop=1920:1080:x='(iw-1920)*t/{d+1}':y=0"
        cmd=['ffmpeg','-y','-loop','1','-framerate',str(fps),'-t',str(d+1),'-i',f,'-vf',vf+',format=yuv420p','-r',str(fps),f'k{i}.mp4']
    else:
        z="min(1+0.05*on/%d,1.05)"%n if m=='in' else "max(1.05-0.05*on/%d,1)"%n
        vf=f"scale=3840:2160,zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1920x1080:fps={fps},format=yuv420p"
        cmd=['ffmpeg','-y','-i',f,'-vf',vf,'-frames:v',str(n),f'k{i}.mp4']
    subprocess.run(cmd,check=True,capture_output=True); clips.append((f'k{i}.mp4',d))
inp=[];
for f,_ in clips: inp+=['-i',f]
fc='';prev='[0:v]';off=0
for i in range(1,len(clips)):
    off+=clips[i-1][1]
    fc+=f"{prev}[{i}:v]xfade=transition=fade:duration=1:offset={off}[v{i}];";prev=f'[v{i}]'
subprocess.run(['ffmpeg','-y',*inp,'-filter_complex',fc.rstrip(';'),'-map',prev,'-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart','paytree-video.mp4'],check=True,capture_output=True)
