import json,os
OUT=__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'')
BG='#FBF8F5';INK='#1C1412';MUTED='#6E625C';LINE='#E8DFD7';CARD='#FFFFFF'
RED='#C8361C';REDH='#A92C16';RSOFT='#FCE6E0';RTEXT='#A12A14'
OR='#E35A0C';OSOFT='#FDE6D2';OTEXT='#863404'
H="'Bricolage Grotesque',system-ui,sans-serif";B="'Inter',system-ui,sans-serif"
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&amp;family=Inter:wght@400;500;600&amp;display=swap">'
KEYS='''@keyframes ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.6);opacity:0}}
@keyframes bounce{0%,100%{transform:translateY(0) scale(1.12,.86)}12%{transform:translateY(-6px) scale(.94,1.06)}50%{transform:translateY(-46px) scale(1,1)}88%{transform:translateY(-6px) scale(.94,1.06)}}
@keyframes shadow{0%,100%{transform:scaleX(1);opacity:.28}50%{transform:scaleX(.55);opacity:.12}}
@keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
.ring{animation:ring 2s linear infinite}.ball{animation:bounce .9s cubic-bezier(.45,0,.55,1) infinite}.shd{animation:shadow .9s cubic-bezier(.45,0,.55,1) infinite}.pop{animation:pop .6s cubic-bezier(.2,0,0,1) both}
@media (prefers-reduced-motion: reduce){.ring,.ball,.shd,.pop{animation:none}}'''
def page(title,w,h,body,lang='fr'):
    return ('<!doctype html>\n<html lang="%s">\n<head>\n<meta charset="utf-8">\n<title>%s</title>\n<script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n%s\n<style>\nbody{margin:0}\n%s\n</style>\n</helmet>\n%s\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props=\'{"$preview":{"width":%d,"height":%d}}\'>\nclass Component extends DCLogic {\nrenderVals() {\nreturn {};\n}\n}\n</script>\n</body>\n</html>\n')%(lang,title,FONTS,KEYS,body,w,h)

P={'chevd':'<path d="m7 10 5 5 5-5"/>','trash':'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>','user':'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>','pin':'<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
'map':'<path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
'list':'<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
'msg':'<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5z"/>',
'plus':'<path d="M12 5v14M5 12h14"/>','minus':'<path d="M5 12h14"/>',
'back':'<path d="M15 5l-7 7 7 7"/>','share':'<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
'check':'<path d="M5 12.5l4.5 4.5L19 7.5"/>','clock':'<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>',
'users':'<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
'cal':'<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>','route':'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
'send':'<path d="M4 12 20 4l-6 16-3-7z"/>','search':'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
'repeat':'<path d="M17 3l3 3-3 3"/><path d="M20 6H8a4 4 0 0 0-4 4v1M7 21l-3-3 3-3"/><path d="M4 18h12a4 4 0 0 0 4-4v-1"/>',
'bell':'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>','shield':'<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
'vib':'<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M4 8v8M20 8v8"/>','chev':'<path d="m9 6 6 6-6 6"/>','flag':'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
'x':'<path d="M6 6l12 12M18 6 6 18"/>','loc':'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>','apple':'<path d="M15.5 3.5c-.9.1-2 .7-2.6 1.5-.6.7-1 1.7-.9 2.7 1 0 2-.6 2.6-1.4.6-.8 1-1.8.9-2.8z"/><path d="M12 8.6c-1 0-2.1-.8-3.2-.8C6.8 7.8 5 9.6 5 12.6c0 3.8 2.6 7.9 4.4 7.9 1 0 1.5-.6 2.6-.6s1.5.6 2.6.6c1.4 0 2.6-2.2 3.4-4.2-1.7-.7-2.6-2.2-2.6-3.9 0-1.4.7-2.6 1.9-3.3-.7-1.1-2-1.6-3.1-1.6-1 0-1.8.6-2.2.6z"/>',
'mail':'<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>','google':'<path d="M20 12.2c0-.6-.1-1.2-.2-1.7H12v3.3h4.5a3.9 3.9 0 0 1-1.7 2.5"/><path d="M12 20a8 8 0 1 1 5.3-14"/><path d="M12 20c2.2 0 4-.7 5.3-2"/>'}
def ic(n,s=22,c='currentColor',w=1.9):
    return '<svg aria-hidden="true" width="%d" height="%d" viewBox="0 0 24 24" style="flex: none; fill: none; stroke: %s; stroke-width: %s; stroke-linecap: round; stroke-linejoin: round">%s</svg>'%(s,s,c,w,P[n])
def root(inner,bg=BG,title=''):
    return '<div style="width: 390px; height: 844px; box-sizing: border-box; background: %s; display: flex; flex-direction: column; font-family: %s; color: %s; position: relative; overflow: hidden">%s</div>'%(bg,B,INK,inner)
def btn(t,kind='primary',h=56,extra=''):
    st={'primary':'background: %s; color: #fff; border: 0'%RED,'dark':'background: %s; color: #fff; border: 0'%INK,
        'outline':'background: %s; color: %s; border: 1.5px solid %s'%(CARD,INK,LINE),'ghost':'background: transparent; color: %s; border: 0'%INK}[kind]
    return '<button style="width: 100%%; height: %dpx; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 10px; font: 600 17px/22px %s; %s%s">%s</button>'%(h,B,st,extra,t)
def avatar(i,s=36,ring=BG):
    cols=['#F4B9A6','#F7C99A','#E8A98F','#F1D2B8','#D9927A','#F3BE8C','#E5B5A0','#F0C7A8']
    ini=['LM','SA','TB','JD','EK','MR','NV','AL'][i%8]
    return '<span style="width: %dpx; height: %dpx; border-radius: 50%%; background: %s; border: 2px solid %s; display: inline-flex; align-items: center; justify-content: center; font: 600 %dpx/1 %s; color: #5A2A1A; flex: none">%s</span>'%(s,s,cols[i%8],ring,int(s*0.36),B,ini)
def avstack(n,s=32,ring=CARD,more=None):
    out='<div style="display: flex">'
    for i in range(n): out+='<span style="margin-left: %dpx; display: flex">%s</span>'%(0 if i==0 else -10,avatar(i,s,ring))
    if more: out+='<span style="margin-left: -10px; width: %dpx; height: %dpx; border-radius: 50%%; background: %s; border: 2px solid %s; display: inline-flex; align-items: center; justify-content: center; font: 600 12px/1 %s; color: %s">+%d</span>'%(s,s,LINE,ring,B,MUTED,more)
    return out+'</div>'
def live(t='En direct',small=False):
    return '<span style="display: inline-flex; align-items: center; gap: 6px; background: %s; color: %s; font: 600 12px/16px %s; padding: 4px 9px 4px 8px; border-radius: 999px"><span style="position: relative; width: 8px; height: 8px; display: inline-block"><span class="ring" style="position: absolute; inset: 0; border-radius: 50%%; background: %s"></span><span style="position: absolute; inset: 0; border-radius: 50%%; background: %s"></span></span>%s</span>'%(RSOFT,RTEXT,B,RED,RED,t)
def seek(t='Il manque 1 joueur'):
    return '<span style="display: inline-flex; align-items: center; gap: 5px; background: %s; color: %s; font: 600 12px/16px %s; padding: 4px 9px; border-radius: 999px">%s%s</span>'%(OSOFT,OTEXT,B,ic('search',13,OTEXT,2.4),t)
def tag(t):
    return '<span style="display: inline-flex; align-items: center; background: #F3EDE8; color: %s; font: 500 12px/16px %s; padding: 4px 9px; border-radius: 999px">%s</span>'%(MUTED,B,t)

# ===== Pictos sports =====
CL='<defs><clipPath id="spc"><circle cx="24" cy="24" r="20"/></clipPath></defs>'
SH='<path d="M24 4a20 20 0 0 1 0 40a24 24 0 0 0 0-40z" fill="#000" opacity=".13"/>'
RIM='<circle cx="24" cy="24" r="19.6" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="1"/>'
SPORTS={
'foot':('Foot',CL+'<circle cx="24" cy="24" r="20" fill="#FFFFFF"/><g clip-path="url(#spc)" fill="#1C1412"><polygon points="24,16.5 31.1,21.7 28.4,30 19.6,30 16.9,21.7"/><polygon points="24,2 30,5.5 27.5,9.5 20.5,9.5 18,5.5"/><polygon points="40,14 46,20 44,27 39,26 37,19"/><polygon points="8,14 2,20 4,27 9,26 11,19"/><polygon points="13,40 15,34 21,36 21,44 14,46"/><polygon points="35,40 33,34 27,36 27,44 34,46"/></g><g stroke="#1C1412" stroke-width="1.2" fill="none" clip-path="url(#spc)"><path d="M24 16.5V9.5M31.1 21.7L37 19M28.4 30L33 34M19.6 30L15 34M16.9 21.7L11 19"/></g>'+SH+RIM),
'basket':('Basket',CL+'<circle cx="24" cy="24" r="20" fill="#E8742A"/><g clip-path="url(#spc)" fill="none" stroke="#5E2C0E" stroke-width="1.8" stroke-linecap="round"><path d="M24 4v40M4 24h40M11 9c7 7 7 23 0 30M37 9c-7 7-7 23 0 30"/></g>'+SH),
'volley':('Volley',CL+'<circle cx="24" cy="24" r="20" fill="#FFFFFF"/><g clip-path="url(#spc)"><path d="M24 24C24 14 30 7 37 6.5L46 18L44 30C37 26 30 26 24 24z" fill="#F2B630"/><path d="M24 24C17 29 9 30 4.6 28.5L8 40L28 46C31 36 29 29 24 24z" fill="#2B4F8C"/><path d="M24 24C24 14 30 7 37 6.5M24 24C17 29 9 30 4.6 28.5M24 24C29 29 31 36 30 43M24 24C30 26 37 26 43.6 28" fill="none" stroke="#FFFFFF" stroke-width="1.6"/></g>'+SH+RIM),
'rugby':('Rugby','<defs><clipPath id="spr"><ellipse cx="24" cy="24" rx="21" ry="12.5" transform="rotate(-30 24 24)"/></clipPath></defs><g transform="rotate(-30 24 24)"><ellipse cx="24" cy="24" rx="21" ry="12.5" fill="#8E3B1E"/><g clip-path="url(#spr)" transform="rotate(30 24 24)"></g><path d="M7.5 17c-1.5 4-1.5 10 0 14M40.5 17c1.5 4 1.5 10 0 14" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/><path d="M15 24h18" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/><path d="M17.5 21.3v5.4M20.5 21.3v5.4M23.5 21.3v5.4M26.5 21.3v5.4M29.5 21.3v5.4" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/><path d="M24 11.5a21 12.5 0 0 1 0 25a24 15 0 0 0 0-25z" fill="#000" opacity=".15"/></g>'),
'spikeball':('Spikeball','<path d="M10.5 34l-3 10M37.5 34l3 10M24 38v8" stroke="#1C1412" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="24" cy="32" rx="19" ry="8" fill="#1C1412"/><ellipse cx="24" cy="31.5" rx="15.5" ry="5.4" fill="#F5D33A"/><path d="M12 31.5h24M18 27.3v8.4M24 26.2v10.6M30 27.3v8.4" stroke="#1C1412" stroke-width="1" opacity=".5"/><circle cx="31" cy="12" r="7" fill="#F2B630"/><path d="M31 5a7 7 0 0 1 0 14a8.5 8.5 0 0 0 0-14z" fill="#000" opacity=".13"/>'),
'tennis':('Tennis',CL+'<circle cx="24" cy="24" r="20" fill="#C9DC3C"/><g clip-path="url(#spc)" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"><path d="M8 9c9 7 9 23 0 30M40 9c-9 7-9 23 0 30"/></g>'+SH),
'badminton':('Badminton','<path d="M17 33L8 6h32l-9 27z" fill="#F7F3EF"/><path d="M24 6v27l7-27z" fill="#000" opacity=".09"/><path d="M17 33L8 6h32l-9 27zM20 33L15 6M24 33V6M28 33l5-27M11.4 16.5h25.2" fill="none" stroke="#8F827A" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M15.5 33h17a8.5 8.5 0 0 1-17 0z" fill="#F2E7DC"/><path d="M15.5 33h17v3h-17z" fill="#C8361C"/><path d="M24 33h8.5a8.5 8.5 0 0 1-8.5 8.5z" fill="#000" opacity=".12"/>'),
'escalade':('Escalade','<path d="M7 33c-3-6 0-12 5-14 1-7 8-10 13-8 6-3 13 1 14 7 5 3 5 11 1 15-5 6-26 8-33 0z" fill="#2FA37A"/><path d="M39 18c5 3 5 11 1 15-5 6-26 8-33 0 9 4 24 3 30-3 3-4 3-8 2-12z" fill="#000" opacity=".14"/><circle cx="25" cy="25" r="4" fill="#E9E2DC"/><circle cx="25" cy="25" r="1.6" fill="#8A7F78"/>'),
'padel':('Padel','<rect x="20.5" y="31" width="7" height="14" rx="2.5" fill="#1C1412"/><ellipse cx="24" cy="18" rx="14" ry="15" fill="#2F6FD6"/><path d="M24 3a14 15 0 0 1 0 30a16 17 0 0 0 0-30z" fill="#000" opacity=".14"/><g fill="#FFFFFF"><circle cx="19" cy="12" r="1.6"/><circle cx="24" cy="12" r="1.6"/><circle cx="29" cy="12" r="1.6"/><circle cx="17" cy="18" r="1.6"/><circle cx="22" cy="18" r="1.6"/><circle cx="27" cy="18" r="1.6"/><circle cx="31" cy="18" r="1.6"/><circle cx="19" cy="24" r="1.6"/><circle cx="24" cy="24" r="1.6"/><circle cx="29" cy="24" r="1.6"/></g>'),
'autre':('Autre','<circle cx="24" cy="24" r="19" fill="#FFFFFF" stroke="#B8ABA3" stroke-width="2.2" stroke-dasharray="4 4"/><path d="M24 16v16M16 24h16" fill="none" stroke="#1C1412" stroke-width="2.6" stroke-linecap="round"/>'),
}
import sys; sys.path.insert(0,__import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from figma_svgs import FIG
import re as _re
_FIT={'rugby':(128,128,1.13),'spikeball':(128,126,1.13),'badminton':(148,112,1.12),'escalade':(128,129,1.07),'padel':(138.5,120,1.18),'volley':(128,128,0.963)}
_COL={'foot':[('#171717','#1C1412'),('#313844','#1C1412')],
 'basket':[('#F58B28','#EE7F2D'),('#E47A23','#D96A1E'),('#63351F','#5A2A16')],
 'volley':[('#142D50','#C8361C'),('#F6C928','#F2B630')],
 'badminton':[('#D5DADD','#9C8F87'),('#E4E7E9','#E3D8CE'),('#DFE3E6','#E3D8CE'),('fill="white" stroke="#000" stroke-opacity=".14" stroke-width="3"','fill="#FBF6F1" stroke="#8F827A" stroke-width="5" stroke-linejoin="round"'),('#E44747','#C8361C'),('#C7363D','#A12A14')],
 'escalade':[('#69B64D','#2FA37A'),('#52963D','#23845F'),('#A4AAA4','#E9E2DC'),('#626C62','#8A7F78')],
 'padel':[('#258CE5','#2F6FD6'),('#1975C9','#2459B0'),('#202124','#1C1412')],
 'spikeball':[('#17191D','#1C1412'),('#303237','#2E2622'),('#25272B','#1C1412'),('#191B1F','#1C1412')],
 'rugby':[('#A96738','#A4552B')],
 'tennis':[]}
for _k,_v in FIG.items():
    for a,b in _COL.get(_k,[]): _v=_v.replace(a,b)
    if _k=='spikeball': _v=_re.sub(r'<path d="M128 229C183\.781[^>]*/>\n?','',_v)
    if _k in _FIT:
        cx,cy,sc=_FIT[_k]
        _v='<g transform="translate(128 128) scale(%s) translate(%s %s)">%s</g>'%(sc,-cx,-cy,_v)
    SPORTS[_k]=(SPORTS[_k][0],_v)
def sp(k,size=32):
    vb='0 0 256 256' if k in FIG else '0 0 48 48'
    return '<svg role="img" aria-label="%s" width="%d" height="%d" viewBox="%s" fill="none" style="flex: none; display: block">%s</svg>'%(SPORTS[k][0],size,size,vb,SPORTS[k][1])
def spbadge(k,size=44,bg=None):
    return '<span style="width: %dpx; height: %dpx; border-radius: %dpx; background: %s; display: flex; align-items: center; justify-content: center; flex: none">%s</span>'%(size,size,int(size*0.32),bg or '#F3EDE8',sp(k,int(size*0.72)))

def sptag(k):
    return '<span style="display: inline-flex; align-items: center; gap: 5px; background: #F3EDE8; color: %s; font: 500 12px/16px %s; padding: 3px 9px 3px 4px; border-radius: 999px">%s%s</span>'%(INK,B,sp(k,18),SPORTS[k][0])
def tabbar(active):
    items=[('plus','Créer'),('map','Carte'),('msg','Messages'),('user','Profil')]
    out='<nav aria-label="Navigation principale" style="position: absolute; left: 20px; right: 20px; bottom: 26px; z-index: 5; display: flex; gap: 4px; padding: 6px; background: rgba(255,255,255,.96); border: 1px solid %s; border-radius: 30px; box-shadow: 0 12px 32px rgba(28,20,18,.16), 0 2px 6px rgba(28,20,18,.06)">'%LINE
    for n,l in items:
        on=l==active
        c='#fff' if on else MUTED
        badge='<span style="position: absolute; top: 4px; left: 50%%; margin-left: 4px; min-width: 18px; height: 18px; border-radius: 9px; background: %s; color: #fff; font: 600 11px/18px %s; text-align: center; border: 2px solid #fff">2</span>'%(RED,B) if (l=='Messages' and not on) else ''
        bg='background: %s; '%(RED if on else 'transparent')
        out+='<button style="flex: 1; position: relative; height: 56px; border: 0; border-radius: 24px; %sdisplay: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: %s; font: %s 12px/15px %s">%s%s<span>%s</span></button>'%(bg,c,'600' if on else '500',B,ic(n,22,c,2.1 if on else 1.9),badge,l)
    return out+'</nav>'
def prof(s=44):
    return '<button aria-label="Ton profil" style="width: %dpx; height: %dpx; border-radius: 50%%; border: 2px solid #fff; padding: 0; background: #F4B9A6; display: flex; align-items: center; justify-content: center; font: 600 15px/1 %s; color: #5A2A1A; box-shadow: 0 2px 8px rgba(28,20,18,.12)">MD</button>'%(s,s,B)
def seg(active,float_=False):
    def b(t,n):
        on=t==active
        return '<button style="flex: 1; height: 40px; border-radius: 12px; border: 0; display: flex; align-items: center; justify-content: center; gap: 6px; font: 600 14px/18px %s; background: %s; color: %s%s">%s%s</button>'%(B,INK if on else 'transparent',('#fff' if on else MUTED),'',ic(n,17,'#fff' if on else MUTED),t)
    return '<div role="tablist" style="display: flex; gap: 2px; padding: 3px; background: %s; border-radius: 15px; border: 1px solid %s; width: 200px; box-sizing: border-box%s">%s%s</div>'%(CARD,LINE,'; box-shadow: 0 2px 10px rgba(28,20,18,.10)' if float_ else '',b('Carte','map'),b('Liste','list'))
def chip(t,on=False,icon=None):
    st='background: %s; color: #fff; border: 1.5px solid %s'%(INK,INK) if on else 'background: %s; color: %s; border: 1.5px solid %s'%(CARD,INK,LINE)
    return '<button style="flex: none; height: 44px; padding: 0 13px; border-radius: 22px; display: inline-flex; align-items: center; gap: 6px; font: 500 14px/18px %s; %s">%s%s</button>'%(B,st,ic(icon,16) if icon else '',t)
def mapbg(h=844,dim=False):
    return ('<svg aria-hidden="true" width="390" height="%d" viewBox="0 0 390 %d" style="position: absolute; left: 0; top: 0">'%(h,h)
     +'<rect width="390" height="%d" fill="#F1EAE3"/>'%h
     +'<path d="M-10 610 C 80 560 120 640 230 600 S 360 520 400 560 L400 700 L-10 720Z" fill="#D9E4EC"/>'
     +'<rect x="40" y="180" width="140" height="110" rx="22" fill="#E1E8D6"/><rect x="250" y="410" width="120" height="90" rx="20" fill="#E1E8D6"/><circle cx="300" cy="190" r="46" fill="#E1E8D6"/>'
     +'<g fill="none" stroke="#FFFFFF" stroke-linecap="round"><path d="M-10 340 L400 300" stroke-width="14"/><path d="M200 -10 C 210 200 160 420 190 860" stroke-width="12"/><path d="M-10 120 L 400 160" stroke-width="7"/><path d="M60 -10 L 120 860" stroke-width="6"/><path d="M320 -10 L 290 860" stroke-width="6"/><path d="M-10 500 L 400 470" stroke-width="6"/><path d="M-10 760 L 400 740" stroke-width="7"/></g>'
     +'</svg>')
def mpill(x,y,label,kind,sk='foot'):
    pic='<span style="width: 24px; height: 24px; border-radius: 50%%; background: #fff; display: flex; align-items: center; justify-content: center; margin-left: -7px">%s</span>'%sp(sk,20)
    if kind=='live':
        dot='<span style="position: relative; width: 8px; height: 8px; display: inline-block"><span class="ring" style="position: absolute; inset: 0; border-radius: 50%; background: #fff"></span><span style="position: absolute; inset: 0; border-radius: 50%; background: #fff"></span></span>'
        st='background: %s; color: #fff'%RED
    elif kind=='seek':
        dot=ic('search',13,OTEXT,2.4);st='background: %s; color: %s; border: 1.5px solid %s'%(OSOFT,OTEXT,OR)
    else:
        dot='';st='background: rgba(255,255,255,.92); color: %s; border: 1px solid %s; height: 28px; padding: 0 10px; font-weight: 500; font-size: 12px; box-shadow: 0 1px 4px rgba(28,20,18,.08)'%(MUTED,LINE)
        return '<button style="position: absolute; left: %dpx; top: %dpx; display: inline-flex; align-items: center; gap: 5px; border-radius: 14px; font-family: %s; line-height: 16px; %s">%s%s</button>'%(x,y,B,st.replace('padding: 0 10px','padding: 0 10px 0 4px'),sp(sk,20),label)
    return '<button style="position: absolute; left: %dpx; top: %dpx; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px 0 12px; border-radius: 17px; font: 600 13px/16px %s; box-shadow: 0 3px 10px rgba(28,20,18,.14); %s">%s%s%s</button>'%(x,y,B,st,pic,dot,label)
def zonebtn(zone):
    return '<button aria-label="Changer de zone" style="flex: 1; min-width: 0; height: 44px; border: 0; background: transparent; padding: 0; display: flex; align-items: center; gap: 4px; font: 500 14px/18px %s; color: %s">%s%s</button>'%(B,INK,zone,ic('chevd',16,MUTED,2.2))
def viewbtn(icon,label):
    return '<button style="height: 40px; padding: 0 12px; border-radius: 20px; border: 0; background: %s; color: %s; display: flex; align-items: center; gap: 6px; font: 600 13px/16px %s">%s%s</button>'%(BG,INK,B,ic(icon,18),label)
def recbtn():
    return '<button aria-label="Me recentrer" style="width: 44px; height: 44px; border-radius: 22px; border: 0; background: transparent; color: %s; display: flex; align-items: center; justify-content: center">%s</button>'%(INK,ic('loc',21))
def topbar(zone,icon,label,absolute=False):
    pos='position: absolute; left: 16px; right: 16px; top: 54px;' if absolute else 'margin: 54px 16px 0; flex: none;'
    return '<div style="%s height: 52px; box-sizing: border-box; display: flex; align-items: center; gap: 8px; padding: 0 4px 0 18px; background: %s; border-radius: 26px; box-shadow: 0 4px 14px rgba(28,20,18,.12)"><span style="font: 700 20px/24px %s; color: %s; letter-spacing: -0.3px">catch</span><span style="width: 1px; height: 18px; background: %s"></span>%s%s%s</div>'%(pos,CARD,H,RED,LINE,zonebtn(zone),viewbtn(icon,label),recbtn())
def hdr(title,sub=None,back=False,right=''):
    l='<button aria-label="Retour" style="width: 44px; height: 44px; margin-left: -10px; border: 0; background: transparent; color: %s; display: flex; align-items: center; justify-content: center">%s</button>'%(INK,ic('back',24)) if back else ''
    s='<div style="font: 400 14px/20px %s; color: %s">%s</div>'%(B,MUTED,sub) if sub else ''
    return '<div style="padding: 54px 20px 12px; display: flex; align-items: center; gap: 8px">%s<div style="flex: 1"><div style="font: 700 28px/34px %s; letter-spacing: -0.4px">%s</div>%s</div>%s</div>'%(l,H,title,s,right)

# ===== 1 Carte =====
sheetcard=('<div style="position: absolute; left: 12px; right: 12px; bottom: 112px; background: %s; border-radius: 24px; padding: 8px 16px 16px; box-shadow: 0 10px 30px rgba(28,20,18,.18); display: flex; flex-direction: column; gap: 12px">'%CARD
 +'<span style="align-self: center; width: 36px; height: 5px; border-radius: 3px; background: %s"></span>'%LINE
 +'<div style="display: flex; flex-direction: column; gap: 6px"><div style="display: flex; justify-content: space-between; align-items: center">%s<span style="font: 500 13px/16px %s; color: %s">à 600 m</span></div><div style="display: flex; justify-content: space-between; align-items: center"><span style="display: flex; align-items: center; gap: 10px">%s<span style="font: 700 24px/30px %s; letter-spacing: -0.3px">Foot à 5</span></span>%s</div><span style="font: 400 14px/20px %s; color: %s">Parc de la Source · 3 places libres</span></div>'%(live(),B,MUTED,sp('foot',30),H,avstack(3,28,CARD,3),B,MUTED)
 +'<div style="display: flex; gap: 10px; align-items: center"><div style="flex: 1">%s</div><button aria-label="Inviter" style="width: 56px; height: 56px; flex: none; border-radius: 16px; border: 1.5px solid %s; background: %s; color: %s; display: flex; align-items: center; justify-content: center">%s</button></div>'%(btn('Catch'),LINE,CARD,INK,ic('share',22))
 +'</div>')
carte=root('<div style="position: absolute; inset: 0">'+mapbg()
 +'<div style="position: absolute; left: 172px; top: 352px; width: 22px; height: 22px; border-radius: 50%; background: #2F6FD6; border: 4px solid #fff; box-shadow: 0 0 0 10px rgba(47,111,214,.15)"></div>'
 +mpill(24,232,'Foot · 6 jouent','live','foot')+mpill(186,262,'Badminton · jeu. 19h','plain','badminton')+mpill(200,374,'Volley · il manque 1','seek','volley')+mpill(36,420,'Spikeball · 4 jouent','live','spikeball')+mpill(212,170,'Escalade · sam. 14h','plain','escalade')
 +topbar('Wavre · 5 km','list','Liste',True)
 +sheetcard+'<div style="position: absolute; left: 0; right: 0; bottom: 0">'+tabbar('Carte')+'</div></div>')

# ===== 2 Liste =====
def srow(sport,place,when,people,badge,avn,more=None,sk='foot'):
    return ('<button style="width: 100%%; text-align: left; background: %s; border: 1px solid %s; border-radius: 20px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; font-family: %s; color: %s">'%(CARD,LINE,B,INK)
     +'<div style="display: flex; justify-content: space-between; align-items: center; width: 100%%">%s<span style="font: 500 13px/16px %s; color: %s">%s</span></div>'%(badge,B,MUTED,when)
     +('<div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%%; gap: 12px"><div style="display: flex; gap: 12px; align-items: flex-start; min-width: 0">%s<div style="display: flex; flex-direction: column; gap: 2px; min-width: 0"><b style="font: 700 19px/24px %s">%s</b><span style="font: 400 14px/20px %s; color: %s">%s</span><span style="font: 500 14px/20px %s; color: %s">%s</span></div></div>%s</div></button>'%(spbadge(sk,48),H,sport,B,MUTED,place,B,INK,people,'')))
liste=root(topbar('Wavre · 5 km','map','Carte')
 +'<div style="display: flex; gap: 8px; padding: 18px 20px 14px">'+chip('Toutes',True)+chip('En direct')+chip('Il manque un joueur')+'</div>'
 +'<div style="padding: 0 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; overflow: hidden">'
 +srow('Foot à 5','Parc de la Source · à 600 m','Jusqu\'à 20h','6 jouent · 3 places libres',live(),3,3,'foot')
 +srow('Badminton','Salle des sports, Rixensart · à 3 km','Jeu. 19h','Sarah cherche 1 joueur',seek(),2,None,'badminton')
 +srow('Spikeball','Lac de Genval · à 4 km','Jusqu\'à 18h','4 jouent · 2 places libres',live(),2,1,'spikeball')
 +srow('Escalade en salle','Louvain-la-Neuve · à 8 km','Sam. 14h','4 places libres · débutants bienvenus','<span></span>',2,None,'escalade')
 +'</div>'+tabbar('Carte'))

# ===== 3 Détail =====
def info(icn,a,b,right=''):
    return '<div style="display: flex; gap: 14px; align-items: center"><span style="width: 44px; height: 44px; border-radius: 14px; background: %s; color: %s; display: flex; align-items: center; justify-content: center; flex: none">%s</span><div style="flex: 1; display: flex; flex-direction: column"><b style="font: 600 16px/22px %s">%s</b><span style="font: 400 14px/20px %s; color: %s">%s</span></div>%s</div>'%(RSOFT,RED,ic(icn,22),B,a,B,MUTED,b,right)
def linkbtn(t):
    return '<button style="height: 44px; padding: 0 14px; border-radius: 22px; border: 1.5px solid %s; background: %s; color: %s; font: 600 14px/18px %s; flex: none">%s</button>'%(LINE,CARD,INK,B,t)
detail=root(
 '<div style="height: 236px; position: relative; flex: none; overflow: hidden">'+mapbg(236)
 +'<div style="position: absolute; left: 175px; top: 108px; width: 40px; height: 40px; border-radius: 50%% 50%% 50%% 4px; transform: rotate(-45deg); background: %s; box-shadow: 0 4px 12px rgba(200,54,28,.35)"></div>'%RED
 +'<button aria-label="Retour" style="position: absolute; left: 16px; top: 54px; width: 44px; height: 44px; border-radius: 50%%; border: 0; background: %s; color: %s; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(28,20,18,.12)">%s</button>'%(CARD,INK,ic('back',22))
 +'<button aria-label="Inviter" style="position: absolute; right: 16px; top: 54px; width: 44px; height: 44px; border-radius: 50%%; border: 0; background: %s; color: %s; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(28,20,18,.12)">%s</button></div>'%(CARD,INK,ic('share',21))
 +'<div style="flex: 1; margin-top: -24px; background: %s; border-radius: 26px 26px 0 0; position: relative; padding: 22px 20px 0; display: flex; flex-direction: column; gap: 18px">'%BG
 +'<div style="display: flex; flex-direction: column; gap: 6px"><div style="display: flex; align-items: center; gap: 12px">%s<div style="font: 700 38px/44px %s; letter-spacing: -0.8px">Badminton</div></div><div style="font: 400 15px/22px %s; color: %s">Organisée par Sarah · toujours présente</div><div style="display: flex; margin-top: 4px">%s</div></div>'%(spbadge('badminton',52),H,B,MUTED,tag('Débutants bienvenus'))
 +'<div style="display: flex; flex-direction: column; gap: 14px">'+info('cal','Jeudi 20 novembre · 19h','Environ 1h30')+info('pin','Salle des sports','Rixensart · à 3 km',linkbtn('Itinéraire'))+info('shield','Raquettes prêtées','Viens en baskets de salle')+'</div>'
 +'<div style="background: %s; border: 1px solid %s; border-radius: 20px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between"><div style="display: flex; flex-direction: column; gap: 2px"><b style="font: 700 22px/28px %s; color: %s">2 places libres</b><span style="font: 400 14px/20px %s; color: %s">6 inscrits sur 8</span></div>%s</div>'%(CARD,LINE,H,RED,B,MUTED,avstack(3,32,CARD,3))
 +'</div>'
 +'<div style="padding: 12px 20px 34px; background: %s; border-top: 1px solid %s; display: flex; flex-direction: column; gap: 8px">'%(CARD,LINE)
 +btn('Catch')+'<div style="text-align: center; font: 400 13px/18px %s; color: %s">Gratuit · Tu peux annuler jusqu\'à 3h avant</div></div>'%(B,MUTED))

# ===== 4 Connexion =====
connexion=root('<div style="position: absolute; inset: 0; filter: none">'+detail.split('<div style="flex: 1; margin-top: -24px')[0].replace('<div style="width: 390px; height: 844px;','<div style="width: 390px; height: 844px; display:none;') if False else '')
connexion=root(
 '<div style="height: 236px; position: relative; flex: none; overflow: hidden">'+mapbg(236)+'</div>'
 +'<div style="padding: 20px; font: 700 32px/38px %s">Badminton</div>'%H
 +'<div style="position: absolute; inset: 0; background: rgba(28,20,18,.48)"></div>'
 +'<div role="dialog" aria-label="Connexion" style="position: absolute; left: 0; right: 0; bottom: 0; background: %s; border-radius: 28px 28px 0 0; padding: 10px 20px 36px; display: flex; flex-direction: column; gap: 12px">'%CARD
 +'<span style="align-self: center; width: 36px; height: 5px; border-radius: 3px; background: %s; margin-bottom: 10px"></span>'%LINE
 +'<div style="display: flex; gap: 12px; align-items: center; background: %s; border-radius: 16px; padding: 12px 14px"><span style="width: 40px; height: 40px; border-radius: 12px; background: %s; color: #fff; display: flex; align-items: center; justify-content: center">%s</span><div style="display: flex; flex-direction: column"><b style="font: 600 15px/20px %s">Badminton · jeu. 19h</b><span style="font: 400 13px/18px %s; color: %s">Plus que 2 places libres</span></div></div>'%(BG,RED,ic('users',22,'#fff',2.2),B,B,MUTED)
 +'<div style="font: 700 24px/30px %s; letter-spacing: -0.3px; margin-top: 4px">Connecte-toi pour la catcher</div>'%H
 +'<div style="font: 400 15px/22px %s; color: %s; margin-bottom: 6px">Une seule fois. Ensuite, ta place est réservée automatiquement.</div>'%(B,MUTED)
 +btn(ic('apple',22,'#fff')+'Continuer avec Apple','dark')+btn(ic('google',20)+'Continuer avec Google','outline')+btn(ic('mail',20)+'Continuer avec un e-mail','outline')
 +'<div style="text-align: center; font: 400 12px/17px %s; color: %s; margin-top: 4px">En continuant, tu acceptes les <a href="#" style="color: %s; font-weight: 600">Conditions d\'utilisation</a> et la <a href="#" style="color: %s; font-weight: 600">Politique de confidentialité</a>.</div></div>'%(B,MUTED,INK,INK))

# ===== 5 Tu l'as catch =====
catche=root(
 '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 0 28px; text-align: center">'
 +'<div style="position: relative; width: 150px; height: 150px; display: flex; align-items: center; justify-content: center">'
 +'<span class="pop" style="position: absolute; left: 6px; top: 22px; width: 10px; height: 10px; border-radius: 50%%; background: %s"></span><span class="pop" style="position: absolute; right: 4px; top: 36px; width: 8px; height: 8px; border-radius: 2px; background: %s"></span><span class="pop" style="position: absolute; left: 22px; bottom: 10px; width: 7px; height: 7px; border-radius: 2px; background: %s"></span><span class="pop" style="position: absolute; right: 18px; bottom: 4px; width: 11px; height: 11px; border-radius: 50%%; background: %s"></span>'%(OR,RED,RED,OR)
 +'<div class="pop" style="width: 112px; height: 112px; border-radius: 50%%; background: %s; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 14px 30px rgba(200,54,28,.30)">%s</div></div>'%(RED,ic('check',56,'#fff',2.6))
 +'<div style="font: 700 36px/42px %s; letter-spacing: -0.8px">Tu l\'as catchée !</div>'%H
 +'<div style="font: 400 16px/24px %s; color: %s">Badminton · jeudi 19h<br>Salle des sports, Rixensart</div>'%(B,MUTED)
 +'<div style="display: flex; align-items: center; gap: 10px; background: %s; border: 1px solid %s; border-radius: 999px; padding: 6px 14px 6px 6px">%s<span style="font: 500 14px/18px %s">Sarah et 6 autres t\'attendent</span></div>'%(CARD,LINE,avstack(4,30,CARD),B)
 +'<div style="display: flex; gap: 10px; width: 100%; margin-top: 6px">'
 +'<button style="flex: 1; height: 48px; border-radius: 14px; border: 1.5px solid %s; background: %s; color: %s; display: flex; align-items: center; justify-content: center; gap: 8px; font: 600 14px/18px %s; white-space: nowrap; padding: 0 8px">%sAjouter à l\'agenda</button>'%(LINE,CARD,INK,B,ic('cal',19))
 +'<button style="flex: 1; height: 48px; border-radius: 14px; border: 1.5px solid %s; background: %s; color: %s; display: flex; align-items: center; justify-content: center; gap: 8px; font: 600 14px/18px %s">%sItinéraire</button></div></div>'%(LINE,CARD,INK,B,ic('route',19))
 +'<div style="padding: 12px 20px 34px; display: flex; flex-direction: column; gap: 6px">'+btn(ic('share',20,'#fff')+'Inviter un pote')+btn('Écrire au groupe','outline',52)
 +'<button style="height: 44px; border: 0; background: transparent; color: %s; font: 600 15px/20px %s; margin-top: 2px">Annuler ma participation</button><div style="text-align: center; font: 400 13px/18px %s; color: %s; margin-top: -6px">Possible jusqu\'à 3h avant</div></div>'%(RTEXT,B,B,MUTED))

# ===== 6 Créer =====
def sptiles(keys,sel):
    out='<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">'
    for i,k in enumerate(keys):
        on=i==sel
        st='background: %s; border: 2px solid %s'%(RSOFT,RED) if on else 'background: %s; border: 1.5px solid %s'%(CARD,LINE)
        out+='<button aria-pressed="%s" style="height: 76px; border-radius: 16px; %s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font: %s 13px/16px %s; color: %s">%s<span>%s</span></button>'%('true' if on else 'false',st,'600' if on else '500',B,RTEXT if on else INK,sp(k,34),SPORTS[k][0])
    return out+'</div>'
def sec(label,inner,right=''):
    return '<div style="display: flex; flex-direction: column; gap: 10px"><div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font: 600 15px/20px %s">%s</span>%s</div>%s</div>'%(B,label,right,inner)
def chips(items,sel,icons=None,extra=''):
    return '<div style="display: flex; gap: 8px; flex-wrap: wrap">'+''.join(chip(t,i==sel) for i,t in enumerate(items))+extra+'</div>'
def ichip(n,label):
    return '<button aria-label="%s" style="flex: none; width: 44px; height: 44px; border-radius: 22px; background: %s; color: %s; border: 1.5px solid %s; display: flex; align-items: center; justify-content: center">%s</button>'%(label,CARD,INK,LINE,ic(n,19))
circ='width: 44px; height: 44px; border-radius: 50%%; border: 1.5px solid %s; background: %s; color: %s; display: flex; align-items: center; justify-content: center'%(LINE,CARD,INK)
creer=root(hdr('Créer une session')
 +'<div style="padding: 0 20px; display: flex; flex-direction: column; gap: 24px; flex: 1">'
 +'<button style="height: 56px; border-radius: 18px; border: 1.5px dashed #E9A58F; background: %s; color: %s; display: flex; align-items: center; gap: 12px; padding: 0 16px; text-align: left; font-family: %s">%s<span style="display: flex; flex-direction: column"><b style="font: 600 15px/20px %s">Relancer ta dernière session</b><span style="font: 400 13px/18px %s; color: %s">Foot à 5 · jeu. 19h · Parc de la Source</span></span></button>'%(RSOFT,RTEXT,B,ic('repeat',22,RED),B,B,RTEXT)
 +sec('Sport',sptiles(['foot','badminton','basket','autre'],0))
 +sec('Quand',chips(['Maintenant','Ce soir 19h','Autre date'],1))
 +sec('Où','<button style="display: flex; align-items: center; gap: 12px; background: %s; border: 1.5px solid %s; border-radius: 16px; padding: 12px 14px; text-align: left; font-family: %s; color: %s">%s<span style="flex: 1; display: flex; flex-direction: column"><b style="font: 600 15px/20px %s">Parc de la Source, Wavre</b><span style="font: 400 13px/18px %s; color: %s">Ton dernier lieu · 600 m</span></span>%s</button>'%(CARD,LINE,B,INK,ic('pin',22,RED),B,B,MUTED,ic('chev',18,MUTED)))
 +'<div style="display: flex; align-items: center; justify-content: space-between"><div style="display: flex; flex-direction: column"><span style="font: 600 15px/20px %s">Joueurs</span><span style="font: 400 13px/18px %s; color: %s">Toi compris</span></div><div style="display: flex; align-items: center; gap: 14px"><button aria-label="Moins" style="%s">%s</button><b style="font: 700 24px/30px %s; min-width: 30px; text-align: center">10</b><button aria-label="Plus" style="%s">%s</button></div></div>'%(B,B,MUTED,circ,ic('minus',20),H,circ,ic('plus',20))
 +'<div style="display: flex; align-items: center; justify-content: space-between"><span style="font: 600 15px/20px %s">Débutants bienvenus</span><span role="switch" aria-checked="true" style="width: 52px; height: 32px; border-radius: 16px; background: %s; position: relative"><span style="position: absolute; right: 3px; top: 3px; width: 26px; height: 26px; border-radius: 50%%; background: #fff"></span></span></div>'%(B,RED)
 +'</div>'
 +'<div style="padding: 0 20px 104px; display: flex; flex-direction: column; gap: 6px"><div style="text-align: center; font: 500 13px/18px %s; color: %s">Foot · ce soir 19h · Parc de la Source · 10 joueurs</div>'%(B,MUTED)+btn('Publier la session')+'</div>'
 +tabbar('Créer').replace('border-top: 1px solid %s; padding'%LINE,'border-top: 0; padding'))

# ===== 7 Messagerie =====
def conv(t,last,time,unread=0,live_=False,avi=0,sk='foot'):
    u='<span style="min-width: 22px; height: 22px; border-radius: 11px; background: %s; color: #fff; font: 600 12px/22px %s; text-align: center">%d</span>'%(RED,B,unread) if unread else ''
    lv='<span style="position: absolute; right: -1px; bottom: -1px; width: 14px; height: 14px; border-radius: 50%%; background: %s; border: 2.5px solid %s"></span>'%(RED,BG) if live_ else ''
    return ('<button style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border: 0; border-bottom: 1px solid %s; background: transparent; text-align: left; font-family: %s; color: %s; width: 100%%">'%(LINE,B,INK)
     +'<span style="position: relative; width: 52px; height: 52px; border-radius: 16px; background: %s; color: %s; display: flex; align-items: center; justify-content: center; flex: none">%s%s</span>'%('#F3EDE8',INK,sp(sk,36),lv)
     +('<span style="flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0"><span style="display: flex; justify-content: space-between"><b style="font: 600 16px/22px %s">%s</b><span style="font: 400 13px/18px %s; color: %s">%s</span></span><span style="display: flex; justify-content: space-between; gap: 8px; align-items: center"><span style="font: %s 14px/20px %s; color: %s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">%s</span>%s</span></span></button>'%(B,t,B,MUTED,time,'500' if unread else '400',B,INK if unread else MUTED,last,u)))
messagerie=root(hdr('Messages')
 +'<div style="padding: 0 20px 6px"><div style="display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-radius: 14px; background: %s; border: 1px solid %s; color: %s; font: 400 15px/20px %s">%sRechercher une session ou un message</div></div>'%(CARD,LINE,MUTED,B,ic('search',19,MUTED))
 +'<div style="padding: 8px 20px 4px; font: 600 13px/18px %s; color: %s">Tes sessions</div>'%(B,MUTED)
 +'<div style="padding: 0 20px; display: flex; flex-direction: column; flex: 1">'
 +conv('Foot à 5 · Wavre','Lucas : on est devant la buvette','19h02',2,True,0,'foot')
 +conv('Badminton · jeu. 19h','Sarah : j\'amène des volants','18h40',0,False,1,'badminton')
 +conv('Spikeball · Genval','Tom : quelqu\'un a un 2e set ?','Hier',0,False,0,'spikeball')
 +'<div style="padding: 18px 0 4px; font: 600 13px/18px %s; color: %s">Groupes par sport</div>'%(B,MUTED)
 +conv('Foot · Brabant wallon','Nouvelle session dimanche 10h','Lun.',0,False,1,'foot')
 +'</div>'+tabbar('Messages'))

# ===== 8 Chat =====
def bub(t,me=False,who=None,av=0):
    if me:
        return '<div style="display: flex; justify-content: flex-end"><div style="max-width: 250px; background: %s; color: #fff; border-radius: 20px 20px 6px 20px; padding: 10px 14px; font: 400 15px/21px %s">%s</div></div>'%(RED,B,t)
    return '<div style="display: flex; gap: 8px; align-items: flex-end">%s<div style="display: flex; flex-direction: column; gap: 3px"><span style="font: 500 12px/16px %s; color: %s; padding-left: 4px">%s</span><div style="max-width: 250px; background: %s; border: 1px solid %s; border-radius: 20px 20px 20px 6px; padding: 10px 14px; font: 400 15px/21px %s">%s</div></div></div>'%(avatar(av,30,BG),B,MUTED,who,CARD,LINE,B,t)
chat=root(
 '<div style="padding: 54px 16px 12px; display: flex; align-items: center; gap: 10px; background: %s; border-bottom: 1px solid %s"><button aria-label="Retour" style="width: 44px; height: 44px; border: 0; background: transparent; color: %s; display: flex; align-items: center; justify-content: center">%s</button><div style="flex: 1; display: flex; flex-direction: column"><b style="font: 700 18px/24px %s">Foot à 5 · Wavre</b><span style="display: flex; gap: 6px; align-items: center; font: 400 13px/18px %s; color: %s">%s 7 inscrits</span></div>%s</div>'%(CARD,LINE,INK,ic('back',24),H,B,MUTED,live(),avstack(3,28,CARD))
 +'<div style="margin: 12px 16px 0; background: %s; border-radius: 16px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; font: 500 14px/20px %s; color: %s">%sParc de la Source · jusqu\'à 20h<span style="margin-left: auto; font-weight: 600">Itinéraire</span></div>'%(RSOFT,B,RTEXT,ic('pin',18,RED))
 +'<div style="flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px; justify-content: flex-end">'
 +'<div style="text-align: center; font: 500 12px/16px %s; color: %s">Tu as rejoint la session · 18h55</div>'%(B,MUTED)
 +bub('Yo ! On commence à 19h15, ramenez de l\'eau','',who='Lucas',av=0)
 +bub('J\'arrive dans 10 min',True)
 +bub('On est devant la buvette, maillots rouges','',who='Lucas',av=0)
 +bub('Parfait 👍'.replace(' 👍',', à tout de suite'),'',who='Emma',av=4)
 +'</div>'
 +'<div style="padding: 10px 16px 34px; background: %s; border-top: 1px solid %s; display: flex; gap: 10px; align-items: center"><div style="flex: 1; height: 46px; border-radius: 23px; background: %s; border: 1px solid %s; display: flex; align-items: center; padding: 0 16px; font: 400 15px/20px %s; color: %s">Écrire au groupe</div><button aria-label="Envoyer" style="width: 46px; height: 46px; border-radius: 50%%; border: 0; background: %s; color: #fff; display: flex; align-items: center; justify-content: center">%s</button></div>'%(CARD,LINE,BG,LINE,B,MUTED,RED,ic('send',20,'#fff')))

# ===== 9 Profil =====
def setrow(icn,t,right='',danger=False):
    c=RTEXT if danger else INK
    return '<button style="display: flex; align-items: center; gap: 14px; min-height: 44px; padding: 0 16px; border: 0; border-bottom: 1px solid %s; background: transparent; width: 100%%; text-align: left; font: 500 15px/20px %s; color: %s">%s<span style="flex: 1">%s</span>%s</button>'%(LINE,B,c,ic(icn,21,c),t,right)
def toggle(on=True):
    return '<span role="switch" aria-checked="%s" style="width: 48px; height: 30px; border-radius: 15px; background: %s; position: relative; flex: none"><span style="position: absolute; %s: 3px; top: 3px; width: 24px; height: 24px; border-radius: 50%%; background: #fff"></span></span>'%('true' if on else 'false',RED if on else LINE,'right' if on else 'left')
def stat(n,l):
    return '<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px"><b style="font: 700 24px/30px %s">%s</b><span style="font: 400 13px/18px %s; color: %s">%s</span></div>'%(H,n,B,MUTED,l)
profil=root(
 '<div style="height: 54px; display: flex; justify-content: flex-end; align-items: flex-end; padding: 0 12px"><button style="height: 44px; padding: 0 10px; border: 0; background: transparent; color: %s; font: 600 15px/20px %s">Modifier mon profil</button></div>'%(RED,B)
 +'<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 20px 12px">%s<div style="font: 700 24px/30px %s">Maxime</div><div style="display: flex; gap: 6px; align-items: center"><span style="font: 400 13px/18px %s; color: %s">Mes sports</span>%s%s</div></div>'%(avatar(0,72,BG).replace('>LM<','>MD<'),H,B,MUTED,sptag('foot'),sptag('badminton'))
 +'<div style="margin: 0 20px; background: %s; border: 1px solid %s; border-radius: 20px; padding: 14px 8px; display: flex">%s<span style="width: 1px; background: %s"></span>%s<span style="width: 1px; background: %s"></span>%s</div>'%(CARD,LINE,stat('12','jouées'),LINE,stat('100 %','de présence'),LINE,stat('3','organisées'))
 +'<div style="padding: 14px 20px 8px; font: 600 13px/18px %s; color: %s">Mes sessions à venir</div>'%(B,MUTED)
 +'<div style="margin: 0 20px; background: %s; border: 1px solid %s; border-radius: 18px; padding: 12px 14px; display: flex; align-items: center; gap: 12px"><span style="width: 44px; height: 44px; border-radius: 14px; background: %s; color: %s; display: flex; align-items: center; justify-content: center">%s</span><div style="flex: 1; display: flex; flex-direction: column"><b style="font: 600 15px/20px %s">Badminton · jeu. 19h</b><span style="font: 400 13px/18px %s; color: %s">Rixensart · dans 4 jours</span></div>%s</div>'%(CARD,LINE,RSOFT,RED,ic('cal',22),B,B,MUTED,ic('chev',18,MUTED))
 +'<div style="padding: 14px 20px 6px; font: 600 13px/18px %s; color: %s">Réglages</div>'%(B,MUTED)
 +'<div style="margin: 0 20px; background: %s; border: 1px solid %s; border-radius: 18px; overflow: hidden">'%(CARD,LINE)
 +setrow('bell','Notifications',ic('chev',18,MUTED))+setrow('vib','Vibrations',toggle(True))+setrow('shield','Sécurité et signalements',ic('chev',18,MUTED))+setrow('msg','Aide et contact',ic('chev',18,MUTED))+setrow('back','Me déconnecter','')+setrow('trash','Supprimer mon compte','',True).replace('border-bottom: 1px solid %s; '%LINE,'')
 +'</div>'+tabbar('Profil'))

# ===== 10 Carte vide =====
vide=root('<div style="position: absolute; inset: 0">'+mapbg()
 +'<div style="position: absolute; inset: 0; background: rgba(251,248,245,.55)"></div>'
 +'<div style="position: absolute; left: 16px; right: 16px; top: 54px; display: flex; align-items: center; justify-content: space-between"><div style="display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px; background: %s; border-radius: 22px; box-shadow: 0 2px 10px rgba(28,20,18,.10)"><span style="font: 700 20px/24px %s; color: %s">catch</span><span style="width: 1px; height: 18px; background: %s"></span><span style="font: 500 14px/18px %s">Ottignies · 5 km</span></div></div>'%(CARD,H,RED,LINE,B)
 +'<div style="position: absolute; left: 20px; right: 20px; top: 210px; background: %s; border-radius: 26px; padding: 28px 22px 22px; box-shadow: 0 10px 30px rgba(28,20,18,.14); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px">'%CARD
 +'<div style="position: relative; width: 80px; height: 80px"><span class="shd" style="position: absolute; left: 22px; bottom: 6px; width: 36px; height: 8px; border-radius: 50%%; background: %s"></span><span class="ball" style="position: absolute; left: 24px; bottom: 12px; width: 32px; height: 32px; border-radius: 50%%; background: %s; display: block"></span></div>'%(INK,OR)
 +'<div style="font: 700 24px/30px %s; letter-spacing: -0.3px">Rien à 5 km pour l\'instant</div>'%H
 +'<div style="font: 400 15px/22px %s; color: %s">Lance la première session ici. On prévient les joueurs du coin.</div>'%(B,MUTED)
 +'<div style="width: 100%; display: flex; flex-direction: column; gap: 8px; margin-top: 8px">'+btn(ic('plus',20,'#fff',2.4)+'Créer une session')+btn('Voir les 4 sessions à 12 km','outline',50)+'</div>'
 +'<button style="border: 0; background: transparent; color: %s; font: 600 14px/20px %s; display: flex; align-items: center; gap: 6px; min-height: 44px">%sMe prévenir des sessions de badminton</button></div>'%(RED,B,ic('bell',18,RED))
 +'<div style="position: absolute; left: 0; right: 0; bottom: 0">'+tabbar('Carte')+'</div></div>')

# ===== 11 Invitation web =====
invit=root(
 '<div style="padding: 24px 20px; display: flex; justify-content: space-between; align-items: center"><span style="font: 700 24px/28px %s; color: %s; letter-spacing: -0.3px">catch</span><a href="#" style="font: 600 14px/20px %s; color: %s; text-decoration: none; min-height: 44px; display: flex; align-items: center">Ouvrir dans l\'app</a></div>'%(H,RED,B,INK)
 +'<div style="padding: 8px 20px 0; display: flex; flex-direction: column; gap: 10px"><div style="font: 500 15px/22px %s; color: %s">Lucas t\'invite à jouer</div><div style="font: 700 40px/44px %s; letter-spacing: -1px">Foot à 5<br>ce soir</div></div>'%(B,MUTED,H)
 +'<div style="margin: 20px 20px 0; background: %s; border: 1px solid %s; border-radius: 24px; overflow: hidden"><div style="height: 140px; position: relative; overflow: hidden">%s<div style="position: absolute; left: 175px; top: 48px; width: 36px; height: 36px; border-radius: 50%% 50%% 50%% 4px; transform: rotate(-45deg); background: %s"></div></div><div style="padding: 16px; display: flex; flex-direction: column; gap: 12px">%s%s<div style="display: flex; align-items: center; justify-content: space-between"><span style="font: 600 15px/20px %s">6 jouent · 3 places libres</span>%s</div></div></div>'%(CARD,LINE,mapbg(140),RED,info('clock','Ce soir · 19h','Environ 1h'),info('pin','Parc de la Source, Wavre','Débutants bienvenus'),B,avstack(4,30,CARD,2))
 +'<div style="padding: 20px; margin-top: auto; display: flex; flex-direction: column; gap: 8px">'+btn('Rejoindre la session')+'<div style="text-align: center; font: 400 13px/18px %s; color: %s">Pas encore l\'app ? Tu pourras l\'installer juste après.</div></div>'%(B,MUTED)
 +'<div style="height: 14px"></div>')

# ===== Système =====
def sw(c,n,hexv,txt='#fff'):
    return '<div style="display: flex; flex-direction: column; gap: 8px; width: 150px"><div style="height: 84px; border-radius: 18px; background: %s; border: 1px solid %s"></div><b style="font: 600 15px/20px %s">%s</b><span style="font: 400 13px/18px %s; color: %s">%s</span></div>'%(c,LINE,B,n,B,MUTED,hexv)
def tok(n,v,u):
    return '<div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid %s; font: 400 14px/20px %s"><b style="font-weight: 600; width: 160px">%s</b><span style="width: 200px; color: %s">%s</span><span style="flex: 1; color: %s">%s</span></div>'%(LINE,B,n,INK,v,MUTED,u)
systeme=('<div style="width: 1280px; height: 1180px; box-sizing: border-box; background: %s; padding: 64px; font-family: %s; color: %s; display: flex; flex-direction: column; gap: 44px">'%(BG,B,INK)
 +'<div style="display: flex; align-items: baseline; gap: 20px"><span style="font: 700 64px/68px %s; color: %s; letter-spacing: -2px">catch</span><span style="font: 400 20px/28px %s; color: %s">Système visuel et animation v1</span></div>'%(H,RED,B,MUTED)
 +'<div style="display: flex; gap: 64px">'
 +'<div style="display: flex; flex-direction: column; gap: 18px"><div style="font: 700 22px/28px %s">Couleurs</div><div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">'%H
 +sw(RED,'Rouge Catch',RED+' · actions')+sw(OR,'Orange balle',OR+' · décor')+sw(INK,'Encre',INK+' · texte')+sw(BG,'Fond chaud',BG)
 +sw(RSOFT,'Rouge doux',RSOFT+' · badges')+sw(OSOFT,'Orange doux',OSOFT+' · cherche')+sw(CARD,'Carte','#FFFFFF')+sw(LINE,'Trait',LINE)+'</div></div>'
 +'<div style="display: flex; flex-direction: column; gap: 18px; flex: 1"><div style="font: 700 22px/28px %s">Typographie</div>'%H
 +'<div style="font: 700 44px/50px %s; letter-spacing: -1px">Tu l\'as catchée !</div><div style="font: 400 14px/20px %s; color: %s">Bricolage Grotesque · titres</div>'%(H,B,MUTED)
 +'<div style="font: 400 17px/26px %s">Débutants bienvenus. Choisis une session, appuie sur Catch, viens jouer.</div><div style="font: 400 14px/20px %s; color: %s">Inter · texte et interface</div>'%(B,B,MUTED)
 +'<div style="display: flex; gap: 10px; margin-top: 8px; align-items: center">%s%s%s</div>'%(live(),seek(),tag('Débutants bienvenus'))
 +'<div style="display: flex; gap: 12px; width: 420px; margin-top: 8px"><div style="flex: 1">%s</div><div style="flex: 1">%s</div></div></div>'%(btn('Catch'),btn('Inviter','outline'))
 +'</div>'
 +'<div style="display: flex; gap: 64px">'
 +'<div style="flex: 1; display: flex; flex-direction: column"><div style="font: 700 22px/28px %s; margin-bottom: 6px">Mouvement</div>'%H
 +tok('snappy','ressort 250 ms, sans rebond','Boutons pressés, pastilles, sélections')
 +tok('standard','ressort 400 ms, sans rebond','Tout ce qui se déplace')
 +tok('gesture','ressort 300 ms, amorti 0,8','Feuilles et cartes glissées au doigt')
 +tok('bounce','ressort 450 ms, amorti 0,55','Réservé à la balle et aux célébrations')
 +tok('Bouton pressé','scale 0,96 au toucher','Réaction en moins de 100 ms')
 +tok('Onglets','fondu 250 ms','Aucune vibration')
 +'</div>'
 +'<div style="flex: 1; display: flex; flex-direction: column"><div style="font: 700 22px/28px %s; margin-bottom: 6px">Vibrations</div>'%H
 +tok('Sélection','pastille, filtre, stepper','iOS selection · Android Segment_Tick')
 +tok('Appui sur Catch','impact moyen','iOS impact Medium · Android Virtual_Key')
 +tok('Catch confirmé','succès, avec la coche','iOS Success · Android Confirm')
 +tok('Complet ou butée','avertissement','iOS Warning · Android Reject')
 +tok('Jamais','scroll, onglets, frappe','Ni sur les animations automatiques')
 +'<div style="display: flex; align-items: center; gap: 20px; margin-top: 22px"><div style="position: relative; width: 60px; height: 70px"><span class="shd" style="position: absolute; left: 16px; bottom: 2px; width: 28px; height: 6px; border-radius: 50%%; background: %s"></span><span class="ball" style="position: absolute; left: 18px; bottom: 8px; width: 24px; height: 24px; border-radius: 50%%; background: %s; display: block"></span></div><span style="font: 400 15px/22px %s; color: %s; max-width: 380px">La balle est le seul élément qui rebondit. Chargement après 400 ms, fixe si « Réduire les animations » est activé.</span></div>'%(INK,OR,B,MUTED)
 +'</div></div></div>')

def sptile(k):
    return '<div style="display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 28px 12px 22px; background: %s; border: 1px solid %s; border-radius: 24px">%s<b style="font: 600 17px/22px %s">%s</b></div>'%(CARD,LINE,sp(k,96),B,SPORTS[k][0])
order_sp=['foot','basket','volley','rugby','spikeball','tennis','badminton','escalade','padel','autre']
sportsboard=('<div style="width: 1280px; height: 1040px; box-sizing: border-box; background: %s; padding: 64px; font-family: %s; color: %s; display: flex; flex-direction: column; gap: 36px">'%(BG,B,INK)
 +'<div style="display: flex; flex-direction: column; gap: 8px"><div style="font: 700 44px/50px %s; letter-spacing: -1px">Pictos des sports</div><div style="font: 400 17px/26px %s; color: %s; max-width: 760px">Chaque sport a son objet, dessiné dans le même style : style flat : couleurs pleines, sans contour, une ombre douce pour le volume. Générés avec Figma, retouchables dans le fichier « Catch — pictos sports ». Le picto est toujours accompagné du nom du sport, sauf sur la carte où il double le texte de la pastille.</div></div>'%(H,B,MUTED)
 +'<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px">'+''.join(sptile(k) for k in order_sp)+'</div>'
 +'<div style="display: flex; gap: 48px; align-items: flex-end">'
 +'<div style="display: flex; flex-direction: column; gap: 10px"><span style="font: 500 14px/20px %s; color: %s">Pastille de carte · 20 px</span><div style="display: flex; gap: 8px"><span style="display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px 0 5px; border-radius: 17px; background: %s; color: #fff; font: 600 13px/16px %s"><span style="width: 24px; height: 24px; border-radius: 50%%; background: #fff; display: flex; align-items: center; justify-content: center">%s</span>Basket · 5 jouent</span></div></div>'%(B,MUTED,RED,B,sp('basket',20))
 +'<div style="display: flex; flex-direction: column; gap: 10px"><span style="font: 500 14px/20px %s; color: %s">Liste · 36 px</span><div style="display: flex; align-items: center; gap: 12px">%s<b style="font: 700 19px/24px %s">Rugby</b></div></div>'%(B,MUTED,sp('rugby',36),H)
 +'<div style="display: flex; flex-direction: column; gap: 10px"><span style="font: 500 14px/20px %s; color: %s">Choix du sport · 34 px</span><div style="width: 340px">%s</div></div>'%(B,MUTED,sptiles(['tennis','volley','padel','autre'],0))
 +'</div></div>')
screens=[('Main','1. Carte (accueil)',carte),('Liste','2. Liste',liste),('Detail',"3. Détail d'une session",detail),('Connexion','4. Connexion au moment du Catch',connexion),
 ('Catche',"5. Tu l'as catchée !",catche),('Creer','6. Créer',creer),('Messages','7. Messages',messagerie),('Chat','8. Chat de session',chat),
 ('Profil','9. Profil',profil),('Vide','10. Carte vide',vide),('Invitation',"11. Page web d'invitation",invit)]
for n,t,b in screens:
    open(OUT+'/%s.dc.html'%n,'w').write(page(t,390,844,b))
open(OUT+'/Systeme.dc.html','w').write(page('Système visuel',1280,1180,systeme))
open(OUT+'/Sports.dc.html','w').write(page('Pictos des sports',1280,1040,sportsboard))
boards={};order=[]
for i,(n,t,b) in enumerate(screens):
    r,c=divmod(i,6)
    boards[n+'.dc.html']={'x':c*470,'y':r*1084,'w':390,'h':844,'title':t};order.append(n+'.dc.html')
boards['Systeme.dc.html']={'x':0,'y':2400,'w':1280,'h':1180,'title':'Système visuel et animation'};order.append('Systeme.dc.html')
boards['Sports.dc.html']={'x':1360,'y':2400,'w':1280,'h':1040,'title':'Pictos des sports'};order.append('Sports.dc.html')
idx={'v':3,'createdOnFiles':{'v':1,'at':'2026-11-15T02:05:00Z'},'title':'Catch — design v1','launch':{'view':'canvas'},'pages':[],'boards':boards,'order':order,
 'notes':{'t1':{'x':0,'y':-260,'text':'Catch : écrans principaux','kind':'title1','maxW':2740},'t2':{'x':0,'y':2120,'text':'Catch : système et pictos','kind':'title1','maxW':2640}},'designSystems':[]}
open(OUT+'/canvas.json','w').write(json.dumps(idx,ensure_ascii=False))
print(sorted(os.listdir(OUT)))
