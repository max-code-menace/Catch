import json,os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'')
# Liquid glass gris : une seule couleur d'action, le rouge Catch.
MAPBG='#DDE3E6';PARK='#B9D3A8';WATER='#9CC6E0'
INK='#1C1C1E';MUTED='#4A4A50';WHITE='#FFFFFF'
RED='#C8361C';REDH='#A92C16'
FILL='rgba(255,255,255,.55)'   # fond des pastilles et icônes posées sur le verre
LINE='rgba(60,60,67,.18)'
B="'Inter',system-ui,sans-serif"
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap">'
KEYS='''@keyframes ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.6);opacity:0}}
@keyframes bounce{0%,100%{transform:translateY(0) scale(1.12,.86)}12%{transform:translateY(-6px) scale(.94,1.06)}50%{transform:translateY(-46px) scale(1,1)}88%{transform:translateY(-6px) scale(.94,1.06)}}
@keyframes shadow{0%,100%{transform:scaleX(1);opacity:.28}50%{transform:scaleX(.55);opacity:.12}}
@keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
.ring{animation:ring 2s linear infinite}.ball{animation:bounce .9s cubic-bezier(.45,0,.55,1) infinite}.shd{animation:shadow .9s cubic-bezier(.45,0,.55,1) infinite}.pop{animation:pop .6s cubic-bezier(.2,0,0,1) both}
button:focus-visible,a:focus-visible{outline:2px solid #1C1C1E;outline-offset:2px}
@media (prefers-reduced-motion: reduce){.ring,.ball,.shd,.pop{animation:none}}'''
def page(title,w,h,body,lang='fr'):
    return ('<!doctype html>\n<html lang="%s">\n<head>\n<meta charset="utf-8">\n<title>%s</title>\n<script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n%s\n<style>\nbody{margin:0}\n%s\n</style>\n</helmet>\n%s\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props=\'{"$preview":{"width":%d,"height":%d}}\'>\nclass Component extends DCLogic {\nrenderVals() {\nreturn {};\n}\n}\n</script>\n</body>\n</html>\n')%(lang,title,FONTS,KEYS,body,w,h)

# ===== Verre =====
def glass(a=.62,r=26,blur=24,float_=True):
    sh='inset 0 1px 0 rgba(255,255,255,.85)'+(', 0 10px 30px rgba(0,0,0,.12)' if float_ else '')
    return f'background: rgba(242,242,247,{a}); backdrop-filter: blur({blur}px) saturate(180%); -webkit-backdrop-filter: blur({blur}px) saturate(180%); border: 1px solid rgba(255,255,255,.6); border-radius: {r}px; box-shadow: {sh}'
def smoke(r=32):
    return f'background: rgba(44,44,48,.66); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255,255,255,.16); border-radius: {r}px; box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 12px 32px rgba(0,0,0,.22)'

P={'chevd':'<path d="m7 10 5 5 5-5"/>','trash':'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>','user':'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>','pin':'<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
'map':'<path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
'list':'<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
'msg':'<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17H6.5A2.5 2.5 0 0 1 4 14.5z"/>',
'swipe':'<rect x="5" y="7" width="14" height="13" rx="3"/><path d="M8 3.5h8"/>',
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
    return f'<svg aria-hidden="true" width="{s}" height="{s}" viewBox="0 0 24 24" style="flex: none; fill: none; stroke: {c}; stroke-width: {w}; stroke-linecap: round; stroke-linejoin: round">{P[n]}</svg>'
def root(inner,bg=MAPBG):
    return f'<div style="width: 390px; height: 844px; box-sizing: border-box; background: {bg}; display: flex; flex-direction: column; font-family: {B}; font-variant-numeric: tabular-nums; color: {INK}; position: relative; overflow: hidden">{inner}</div>'
def btn(t,kind='primary',h=56,extra=''):
    st={'primary':f'border-radius: 16px; background: {RED}; color: #fff; border: 0','dark':f'border-radius: 16px; background: {INK}; color: #fff; border: 0',
        'glass':glass(.70,16,20,False)+f'; color: {INK}','ghost':f'border-radius: 16px; background: transparent; color: {INK}; border: 0'}[kind]
    return f'<button style="width: 100%; height: {h}px; display: flex; align-items: center; justify-content: center; gap: 10px; font: 600 17px/22px {B}; {st}; {extra}">{t}</button>'
def avatar(i,s=36):
    cols=['#D1D1D6','#C7C7CC','#E5E5EA','#AEAEB2']
    ini=['L','S','T','J','E','M','N','A'][i%8]
    return f'<span style="width: {s}px; height: {s}px; border-radius: 50%; background: {cols[i%4]}; border: 2px solid rgba(255,255,255,.85); box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; font: 600 {int(s*0.38)}px/1 {B}; color: {INK}; flex: none">{ini}</span>'
def avstack(n,s=32,more=None):
    out='<div style="display: flex">'
    for i in range(n): out+=f'<span style="margin-left: {0 if i==0 else -10}px; display: flex">{avatar(i,s)}</span>'
    if more: out+=f'<span style="margin-left: -10px; width: {s}px; height: {s}px; border-radius: 50%; background: {FILL}; border: 2px solid rgba(255,255,255,.85); box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; font: 600 12px/1 {B}; color: {INK}">+{more}</span>'
    return out+'</div>'
def live(t='En direct'):
    return f'<span style="display: inline-flex; align-items: center; gap: 6px; background: {INK}; color: #fff; font: 600 12px/16px {B}; padding: 4px 10px 4px 9px; border-radius: 999px"><span style="position: relative; width: 8px; height: 8px; display: inline-block"><span class="ring" style="position: absolute; inset: 0; border-radius: 50%; background: #fff"></span><span style="position: absolute; inset: 0; border-radius: 50%; background: #fff"></span></span>{t}</span>'
def seek(t='Il manque 1 joueur'):
    return f'<span style="display: inline-flex; align-items: center; gap: 5px; background: {FILL}; border: 1.5px solid {INK}; color: {INK}; font: 600 12px/14px {B}; padding: 3px 9px; border-radius: 999px">{ic("search",13,INK,2.4)}{t}</span>'
def tag(t):
    return f'<span style="display: inline-flex; align-items: center; background: {FILL}; color: {INK}; font: 500 12px/16px {B}; padding: 4px 10px; border-radius: 999px">{t}</span>'
def seats(taken,free,s=16):
    full=''.join(f'<span style="width: {s}px; height: {s}px; border-radius: 50%; background: {INK}; display: block"></span>' for _ in range(taken))
    empty=''.join(f'<span style="width: {s}px; height: {s}px; border-radius: 50%; border: 2px solid {INK}; box-sizing: border-box; display: block"></span>' for _ in range(free))
    return f'<span role="img" aria-label="{taken} inscrits, {free} places libres" style="display: inline-flex; gap: 4px; flex-wrap: wrap">{full}{empty}</span>'

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
    return f'<svg role="img" aria-label="{SPORTS[k][0]}" width="{size}" height="{size}" viewBox="{vb}" fill="none" style="flex: none; display: block">{SPORTS[k][1]}</svg>'
def spbadge(k,size=48):
    return f'<span style="width: {size}px; height: {size}px; border-radius: {int(size*0.32)}px; background: {FILL}; display: flex; align-items: center; justify-content: center; flex: none">{sp(k,int(size*0.72))}</span>'
def sptag(k):
    return f'<span style="display: inline-flex; align-items: center; gap: 5px; background: {FILL}; color: {INK}; font: 500 13px/16px {B}; padding: 5px 11px 5px 6px; border-radius: 999px">{sp(k,20)}{SPORTS[k][0]}</span>'

# ===== Briques =====
def mapbg(w=390,h=844,veil=0):
    v=f'<rect width="390" height="844" fill="rgba(242,242,247,{veil})"/>' if veil else ''
    return (f'<svg aria-hidden="true" width="{w}" height="{h}" viewBox="0 0 390 844" preserveAspectRatio="xMidYMin slice" style="position: absolute; left: 0; top: 0">'
     +f'<rect width="390" height="844" fill="{MAPBG}"/>'
     +f'<path d="M-10 170 L120 140 L152 268 L44 314 L-10 296 Z" fill="{PARK}"/><path d="M236 300 L372 276 L400 424 L262 456 Z" fill="{PARK}"/><path d="M30 560 L168 532 L198 680 L70 720 Z" fill="{PARK}"/>'
     +f'<path d="M150 380 q32 -22 52 10 q20 42 -12 72 q-40 20 -50 -22 q-10 -40 10 -60 Z" fill="{WATER}"/>'
     +'<g fill="none" stroke="#FFFFFF" stroke-linecap="round"><path d="M60 -10 L84 250 M290 -10 L300 200 M-10 330 L220 290 M-10 420 L150 400 M20 250 L40 500 M300 196 L320 484 M-10 610 L190 590 L400 540 M60 520 L90 860 M240 560 L250 860" stroke-width="5"/><path d="M-10 250 L400 180 M200 -10 L230 300 L180 520 L260 860 M-10 500 L180 520 L400 480" stroke-width="14"/></g>'
     +v+'</svg>')
def veil(a): return f'<div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(28,28,30,{a})"></div>'
def gbtn(icon,label,size=44,c=INK):
    return f'<button aria-label="{label}" style="width: {size}px; height: {size}px; flex: none; padding: 0; color: {c}; display: flex; align-items: center; justify-content: center; {glass(.62,size//2)}">{ic(icon,21)}</button>'
def prof():
    return f'<button aria-label="Mon profil" style="width: 52px; height: 52px; flex: none; padding: 0; display: flex; align-items: center; justify-content: center; {glass(.62,26)}"><span style="width: 40px; height: 40px; border-radius: 20px; background: {INK}; color: #fff; display: flex; align-items: center; justify-content: center; font: 700 16px/1 {B}">M</span></button>'
def topbar(zone='Wavre · 5 km'):
    return (f'<div style="position: absolute; left: 16px; right: 16px; top: 54px; display: flex; gap: 10px; z-index: 4">'
     +f'<button style="flex: 1; min-width: 0; height: 52px; padding: 0 18px; display: flex; align-items: center; gap: 10px; font: 600 15px/20px {B}; color: {INK}; text-align: left; {glass(.62,26)}">{ic("pin",20,INK,2.1)}<span style="flex: 1">{zone}</span>{ic("chevd",18,MUTED,2.2)}</button>{prof()}</div>')
def viewrow(icon,label,recenter=True):
    v=f'<button style="height: 44px; padding: 0 16px 0 14px; display: flex; align-items: center; gap: 8px; font: 600 14px/18px {B}; color: {INK}; {glass(.62,22)}">{ic(icon,18)}{label}</button>'
    r=gbtn('loc','Me recentrer') if recenter else ''
    return f'<div style="position: absolute; left: 16px; right: 16px; top: 118px; display: flex; justify-content: space-between; z-index: 4">{v}{r}</div>'
def createbtn():
    return f'<a href="Creer.dc.html" style="position: absolute; left: 16px; right: 16px; bottom: 102px; height: 52px; z-index: 4; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; font: 600 16px/20px {B}; color: {INK}; {glass(.78,26)}">{ic("plus",20,INK,2.4)}Créer une session</a>'
def tabbar(active):
    items=[('map','Carte'),('swipe','Swipe'),('msg','Messages')]
    out=f'<nav aria-label="Navigation principale" style="position: absolute; left: 16px; right: 16px; bottom: 26px; height: 64px; z-index: 5; box-sizing: border-box; display: flex; gap: 4px; padding: 6px; {smoke(32)}">'
    for n,l in items:
        on=l==active
        badge=f'<span style="position: absolute; top: 3px; left: 50%; margin-left: 6px; min-width: 18px; height: 18px; box-sizing: border-box; border-radius: 9px; background: #fff; color: {INK}; font: 700 11px/18px {B}; text-align: center">2</span>' if (l=='Messages' and not on) else ''
        st=f'background: rgba(255,255,255,.92); color: {INK}' if on else 'background: transparent; color: #fff'
        out+=f'<a href="#" {"aria-current=\"page\" " if on else ""}style="flex: 1; position: relative; height: 50px; border-radius: 25px; {st}; text-decoration: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; font: {600 if on else 500} 12px/14px {B}">{ic(n,22,"currentColor",2.1 if on else 1.9)}{badge}<span>{l}</span></a>'
    return out+'</nav>'
def chip(t,on=False):
    st=f'background: {INK}; color: #fff; border: 1px solid {INK}' if on else glass(.62,22,20,False)+f'; color: {INK}'
    return f'<button aria-pressed="{"true" if on else "false"}" style="flex: none; height: 44px; padding: 0 16px; display: inline-flex; align-items: center; border-radius: 22px; font: 500 14px/18px {B}; {st}">{t}</button>'
def grab(): return f'<span aria-hidden="true" style="align-self: center; width: 40px; height: 5px; border-radius: 3px; background: rgba(60,60,67,.3); flex: none"></span>'
def sheet(inner,top,a=.82,gap=16,pad='10px 20px 34px',label=''):
    return f'<section aria-label="{label}" style="position: absolute; left: 0; right: 0; bottom: 0; top: {top}px; box-sizing: border-box; padding: {pad}; display: flex; flex-direction: column; gap: {gap}px; z-index: 6; {glass(a,34,30,False)}; border-radius: 34px 34px 0 0; border-bottom: 0">{grab()}{inner}</section>'
def mpill(x,y,label,kind,sk,sel=False):
    pic=f'<span style="width: 28px; height: 28px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; flex: none">{sp(sk,22)}</span>'
    if kind=='live':
        st=f'background: {INK}; color: #fff; border: 1px solid rgba(255,255,255,.5); border-radius: 20px'
        if sel: st+='; box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 0 0 10px rgba(255,255,255,.35), 0 10px 22px rgba(0,0,0,.22)'
        else: st+='; box-shadow: 0 6px 16px rgba(0,0,0,.2)'
    elif kind=='seek':
        st=glass(.78,20,20)+f'; border: 2px solid {INK}; color: {INK}'
    else:
        st=glass(.62,20,20)+f'; color: {INK}'
    return f'<button style="position: absolute; left: {x}px; top: {y}px; height: 40px; padding: 0 14px 0 6px; display: inline-flex; align-items: center; gap: 8px; font: 600 14px/18px {B}; {st}">{pic}{label}</button>'
def info(icn,a,b,right=''):
    return f'<div style="display: flex; gap: 14px; align-items: center"><span style="width: 44px; height: 44px; border-radius: 14px; background: {FILL}; color: {INK}; display: flex; align-items: center; justify-content: center; flex: none">{ic(icn,22)}</span><div style="flex: 1; display: flex; flex-direction: column"><b style="font: 600 16px/22px {B}">{a}</b><span style="font: 400 14px/20px {B}; color: {MUTED}">{b}</span></div>{right}</div>'
def linkbtn(t):
    return f'<button style="height: 44px; padding: 0 16px; flex: none; font: 600 14px/18px {B}; color: {INK}; {glass(.70,22,20,False)}">{t}</button>'
def h1(t,size=32): return f'<h1 style="margin: 0; font: 700 {size}px/{size+6}px {B}; letter-spacing: -0.03em">{t}</h1>'
def caps(t): return f'<div style="font: 600 12px/16px {B}; letter-spacing: .08em; text-transform: uppercase; color: {MUTED}">{t}</div>'
def pane(inner,pad='0',r=26,a=.62): return f'<div style="{glass(a,r,24,False)}; padding: {pad}; overflow: hidden">{inner}</div>'

# ===== 1 Carte =====
selcard=(f'<article style="position: absolute; left: 16px; right: 16px; bottom: 166px; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px; z-index: 3; {glass(.70,30,28)}">'
 +f'<div style="display: flex; justify-content: space-between; align-items: center">{live()}<span style="font: 500 14px/18px {B}; color: {MUTED}">à 600 m</span></div>'
 +f'<div style="display: flex; gap: 12px; align-items: center">{spbadge("foot",52)}<div style="flex: 1; min-width: 0"><h2 style="margin: 0; font: 700 24px/28px {B}; letter-spacing: -0.02em">Foot à 5</h2><div style="font: 400 14px/20px {B}; color: {MUTED}">Parc de la Source · jusqu’à 20h</div></div></div>'
 +f'<div style="display: flex; align-items: center; gap: 12px">{seats(6,3)}<span style="font: 600 14px/18px {B}">3 places libres</span></div>'
 +f'<div style="display: flex; gap: 10px"><div style="flex: 1">{btn("Catch")}</div><button aria-label="Inviter" style="width: 56px; height: 56px; flex: none; padding: 0; color: {INK}; display: flex; align-items: center; justify-content: center; {glass(.70,16,20,False)}">{ic("share",22)}</button></div></article>')
carte=root(mapbg()
 +'<span aria-hidden="true" style="position: absolute; left: 160px; top: 372px; width: 16px; height: 16px; border-radius: 8px; background: #0A84FF; border: 3px solid #fff; box-shadow: 0 0 0 8px rgba(10,132,255,.2)"></span>'
 +mpill(26,232,'Basket · il manque 1','seek','basket')+mpill(196,200,'Badminton · jeu. 19h','plain','badminton')+mpill(150,300,'Foot · 6 jouent','live','foot',True)
 +mpill(24,416,'Spikeball · 4 jouent','live','spikeball')+mpill(214,432,'Escalade · sam. 14h','plain','escalade')
 +topbar()+viewrow('list','Liste')+selcard+createbtn()+tabbar('Carte'))

# ===== 2 Liste =====
def srow(sk,title,place,when,people,badge):
    return (f'<button style="width: 100%; box-sizing: border-box; text-align: left; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; font-family: {B}; color: {INK}; {glass(.66,24,24,False)}">'
     +f'<div style="display: flex; justify-content: space-between; align-items: center; width: 100%; min-height: 22px">{badge}<span style="font: 600 13px/16px {B}; color: {MUTED}">{when}</span></div>'
     +f'<div style="display: flex; gap: 12px; align-items: center">{spbadge(sk,48)}<div style="display: flex; flex-direction: column; min-width: 0"><b style="font: 700 18px/22px {B}">{title}</b><span style="font: 400 14px/18px {B}; color: {MUTED}">{place}</span><span style="font: 500 14px/18px {B}">{people}</span></div></div></button>')
liste=root(mapbg(veil=.55)+topbar()+viewrow('map','Carte',False)
 +f'<div style="position: absolute; left: 16px; right: 16px; top: 172px; display: flex; gap: 8px; z-index: 4">{chip("Toutes",True)}{chip("En direct")}{chip("Il manque un joueur")}</div>'
 +'<div style="position: absolute; left: 16px; right: 16px; top: 228px; display: flex; flex-direction: column; gap: 8px; z-index: 3">'
 +srow('foot','Foot à 5','Parc de la Source · à 600 m','Jusqu’à 20h','6 jouent · 3 places libres',live())
 +srow('badminton','Badminton','Salle des sports, Rixensart · à 3 km','Jeu. 19h','Sarah cherche 1 joueur',seek())
 +srow('spikeball','Spikeball','Lac de Genval · à 4 km','Jusqu’à 18h','4 jouent · 2 places libres',live())
 +srow('escalade','Escalade en salle','Louvain-la-Neuve · à 8 km','Sam. 14h','4 places libres · débutants bienvenus','<span></span>')
 +'</div>'+createbtn()+tabbar('Carte'))

# ===== 3 Détail =====
pinmark=(f'<div style="position: absolute; left: 171px; top: 140px; display: flex; flex-direction: column; align-items: center"><span style="width: 48px; height: 48px; border-radius: 24px; background: {INK}; border: 2px solid rgba(255,255,255,.7); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,.25)"><span style="width: 34px; height: 34px; border-radius: 17px; background: #fff; display: flex; align-items: center; justify-content: center">{sp("badminton",26)}</span></span><span style="width: 3px; height: 12px; background: {INK}; border-radius: 2px"></span></div>')
detail=root(mapbg()+pinmark
 +f'<div style="position: absolute; left: 16px; top: 54px; z-index: 4">{gbtn("back","Retour")}</div><div style="position: absolute; right: 16px; top: 54px; z-index: 4">{gbtn("share","Inviter")}</div>'
 +sheet(
  f'<div style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; justify-content: space-between; align-items: center"><h1 style="margin: 0; font: 700 34px/40px {B}; letter-spacing: -0.03em">Badminton</h1>{seek("Il manque 2 joueurs")}</div><div style="font: 400 15px/22px {B}; color: {MUTED}">Organisée par Sarah · toujours présente</div><div style="display: flex">{tag("Débutants bienvenus")}</div></div>'
  +'<div style="display: flex; flex-direction: column; gap: 14px">'+info('cal','Jeudi 20 novembre · 19h','Environ 1h30')+info('pin','Salle des sports','Rixensart · à 3 km',linkbtn('Itinéraire'))+info('shield','Raquettes prêtées','Viens en baskets de salle')+'</div>'
  +f'<div style="{glass(.55,22,24,False)}; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px"><div style="display: flex; justify-content: space-between; align-items: baseline"><b style="font: 700 22px/28px {B}">2 places libres</b><span style="font: 400 14px/20px {B}; color: {MUTED}">6 inscrits sur 8</span></div>{seats(6,2,20)}</div>'
  +f'<div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px">{btn("Catch")}<div style="text-align: center; font: 400 13px/18px {B}; color: {MUTED}">Gratuit · Tu peux annuler jusqu’à 3h avant</div></div>',
  top=250,label='Détail de la session',gap=18))

# ===== 4 Connexion (au moment du Catch) =====
connexion=root(mapbg()+pinmark+veil(.32)
 +sheet(
  f'<div style="display: flex; gap: 12px; align-items: center; {glass(.55,18,24,False)}; padding: 12px 14px">{spbadge("badminton",44)}<div style="display: flex; flex-direction: column"><b style="font: 600 15px/20px {B}">Badminton · jeu. 19h</b><span style="font: 400 13px/18px {B}; color: {MUTED}">Plus que 2 places libres</span></div></div>'
  +f'<div style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px">{h1("Connecte-toi pour la catcher",28)}<div style="font: 400 15px/22px {B}; color: {MUTED}">Une seule fois. Ensuite, tu catches en un geste.</div></div>'
  +btn(ic('apple',22,'#fff')+'Continuer avec Apple','dark')+btn(ic('google',20)+'Continuer avec Google','glass')+btn(ic('mail',20)+'Continuer avec un e-mail','glass')
  +f'<div style="text-align: center; font: 400 12px/17px {B}; color: {MUTED}">En continuant, tu acceptes les <a href="#" style="color: {INK}; font-weight: 600">Conditions d’utilisation</a> et la <a href="#" style="color: {INK}; font-weight: 600">Politique de confidentialité</a>.</div>',
  top=392,a=.86,gap=12,pad='10px 20px 36px',label='Connexion'))

# ===== 5 Tes sports (demandés au premier Catch) =====
def sptiles(keys,sel,cols=4,h=76):
    out=f'<div style="display: grid; grid-template-columns: repeat({cols}, minmax(0, 1fr)); gap: 8px">'
    for k in keys:
        on=k in sel
        st=f'background: {INK}; color: #fff; border: 1px solid {INK}' if on else f'background: {FILL}; color: {INK}; border: 1px solid rgba(255,255,255,.7)'
        pic=f'<span style="width: 40px; height: 40px; border-radius: 20px; background: #fff; display: flex; align-items: center; justify-content: center">{sp(k,32)}</span>' if on else sp(k,36)
        out+=f'<button aria-pressed="{"true" if on else "false"}" style="height: {h}px; border-radius: 18px; {st}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font: {600 if on else 500} 13px/16px {B}">{pic}<span>{SPORTS[k][0]}</span></button>'
    return out+'</div>'
premier=root(mapbg()+pinmark+veil(.32)
 +sheet(
  f'<div style="display: flex; flex-direction: column; gap: 6px">{h1("Tu joues à quoi ?",30)}<div style="font: 400 15px/22px {B}; color: {MUTED}">On te prévient quand il manque du monde près de toi. Tu pourras changer plus tard.</div></div>'
  +sptiles(['foot','basket','volley','rugby','spikeball','tennis','badminton','escalade','padel','autre'],['foot','badminton'],4,86)
  +f'<div style="margin-top: auto; display: flex; flex-direction: column; gap: 4px"><div style="text-align: center; font: 500 13px/18px {B}; color: {MUTED}; padding-bottom: 6px">Badminton · jeu. 19h · Salle des sports</div>{btn("Catch")}<button style="height: 44px; border: 0; background: transparent; color: {INK}; font: 600 15px/20px {B}">Passer</button></div>',
  top=232,a=.86,gap=16,pad='10px 20px 24px',label='Tes sports'))

# ===== 6 Tu l’as catchée =====
catche=root(mapbg()+veil(.18)
 +sheet(
  f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; text-align: center">'
  +f'<div style="position: relative; width: 150px; height: 150px; display: flex; align-items: center; justify-content: center"><span class="pop" style="position: absolute; left: 8px; top: 24px; width: 10px; height: 10px; border-radius: 50%; background: {INK}"></span><span class="pop" style="position: absolute; right: 6px; top: 38px; width: 8px; height: 8px; border-radius: 2px; background: #fff"></span><span class="pop" style="position: absolute; left: 22px; bottom: 10px; width: 8px; height: 8px; border-radius: 2px; background: #fff"></span><span class="pop" style="position: absolute; right: 18px; bottom: 6px; width: 11px; height: 11px; border-radius: 50%; background: {INK}"></span>'
  +f'<div class="pop" style="width: 104px; height: 104px; border-radius: 50%; background: {INK}; color: #fff; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.5); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 14px 30px rgba(0,0,0,.25)">{ic("check",52,"#fff",2.6)}</div></div>'
  +f'<div style="font: 700 36px/42px {B}; letter-spacing: -0.03em">Tu l’as catchée !</div>'
  +f'<div style="font: 400 16px/24px {B}; color: {MUTED}">Badminton · jeudi 19h<br>Salle des sports, Rixensart</div>'
  +f'<div style="display: flex; align-items: center; gap: 10px; background: {FILL}; border-radius: 999px; padding: 6px 14px 6px 6px">{avstack(4,30)}<span style="font: 500 14px/18px {B}">Sarah et 6 autres t’attendent</span></div>'
  +f'<div style="display: flex; gap: 10px; width: 100%; margin-top: 4px"><div style="flex: 1">{btn(ic("cal",19)+"Agenda","glass",48,"font-size: 14px")}</div><div style="flex: 1">{btn(ic("route",19)+"Itinéraire","glass",48,"font-size: 14px")}</div></div></div>'
  +f'<div style="display: flex; flex-direction: column; gap: 8px">{btn(ic("share",20,"#fff")+"Inviter un pote")}{btn("Écrire au groupe","glass",52)}<button style="height: 44px; border: 0; background: transparent; color: {INK}; font: 600 15px/20px {B}; text-decoration: underline">Annuler ma participation</button><div style="text-align: center; font: 400 13px/18px {B}; color: {MUTED}; margin-top: -8px">Possible jusqu’à 3h avant</div></div>',
  top=120,a=.84,gap=8,pad='10px 20px 24px',label='Session catchée'))

# ===== 7 Créer =====
def stepper(sym,label):
    return f'<button aria-label="{label}" style="width: 44px; height: 44px; border-radius: 22px; padding: 0; color: {INK}; display: flex; align-items: center; justify-content: center; {glass(.8,22,20,False)}">{ic(sym,20,INK,2.2)}</button>'
creer=root(mapbg()+veil(.18)
 +sheet(
  f'<div style="display: flex; justify-content: space-between; align-items: center"><h1 style="margin: 0; font: 700 26px/32px {B}; letter-spacing: -0.03em">Créer une session</h1><a href="Main.dc.html" aria-label="Fermer" style="width: 44px; height: 44px; margin-right: -8px; display: flex; align-items: center; justify-content: center; color: {INK}">{ic("x",24)}</a></div>'
  +f'<button style="height: 52px; padding: 0 16px; display: flex; align-items: center; gap: 12px; text-align: left; font-family: {B}; color: {INK}; background: {FILL}; border: 1.5px dashed {INK}; border-radius: 18px">{ic("repeat",22)}<span style="display: flex; flex-direction: column"><b style="font: 600 15px/18px {B}">Relancer ta dernière session</b><span style="font: 400 13px/16px {B}; color: {MUTED}">Foot à 5 · jeu. 19h · Parc de la Source</span></span></button>'
  +sptiles(['foot','basket','volley','spikeball','badminton','tennis','padel','autre'],['spikeball'],4,72)
  +f'<div style="{glass(.55,20,24,False)}; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between"><div style="display: flex; flex-direction: column"><span style="font: 500 14px/18px {B}; color: {MUTED}">Il nous manque</span><b style="font: 700 24px/30px {B}">2 joueurs</b><span style="font: 500 14px/18px {B}">pour le spikeball</span></div><div style="display: flex; gap: 10px">{stepper("minus","Un joueur de moins")}{stepper("plus","Un joueur de plus")}</div></div>'
  +f'<div style="display: flex; gap: 8px">{chip("Maintenant")}{chip("Dans 30 min",True)}{chip("Ce soir")}</div>'
  +f'<button style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; text-align: left; font-family: {B}; color: {INK}; background: {FILL}; border: 1px solid rgba(255,255,255,.7); border-radius: 18px">{ic("pin",22)}<span style="flex: 1; display: flex; flex-direction: column"><b style="font: 600 15px/20px {B}">Parc de la Source, Wavre</b><span style="font: 400 13px/18px {B}; color: {MUTED}">Ton dernier lieu · 600 m</span></span>{ic("chev",18,MUTED)}</button>'
  +f'<div style="display: flex; align-items: center; justify-content: space-between; min-height: 36px"><span style="font: 600 15px/20px {B}">Débutants bienvenus</span><span role="switch" aria-checked="true" style="width: 52px; height: 32px; border-radius: 16px; background: {INK}; position: relative"><span style="position: absolute; right: 3px; top: 3px; width: 26px; height: 26px; border-radius: 50%; background: #fff"></span></span></div>'
  +f'<div style="margin-top: auto; display: flex; flex-direction: column; gap: 6px"><div style="text-align: center; font: 500 13px/18px {B}; color: {MUTED}">Visible sur la carte · lien à partager juste après</div>{btn("Publier la session")}</div>',
  top=86,gap=12,pad='10px 20px 28px',label='Créer une session'))

# ===== 8 Messages =====
def conv(sk,t,last,when,unread=0,live_=False):
    u=f'<span style="min-width: 22px; height: 22px; box-sizing: border-box; padding: 0 6px; border-radius: 11px; background: {INK}; color: #fff; font: 700 12px/22px {B}; text-align: center">{unread}</span>' if unread else ''
    right=live() if live_ else f'<span style="font: 500 13px/18px {B}; color: {MUTED}">{when}</span>'
    return (f'<button style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 0; border-bottom: 1px solid {LINE}; background: transparent; text-align: left; font-family: {B}; color: {INK}; width: 100%">'
     +spbadge(sk,52)
     +f'<span style="flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0"><span style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><b style="font: 600 16px/22px {B}">{t}</b>{right}</span><span style="display: flex; justify-content: space-between; gap: 8px; align-items: center"><span style="font: {500 if unread else 400} 14px/20px {B}; color: {INK if unread else MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{last}</span>{u}</span></span></button>')
messages=root(mapbg(veil=.55)
 +f'<div style="position: absolute; left: 20px; right: 16px; top: 54px; height: 52px; display: flex; align-items: center; justify-content: space-between; z-index: 4">{h1("Messages",32)}{prof()}</div>'
 +f'<div style="position: absolute; left: 16px; right: 16px; top: 126px; display: flex; flex-direction: column; gap: 14px">'
 +f'<div style="height: 48px; padding: 0 16px; display: flex; align-items: center; gap: 10px; color: {MUTED}; font: 400 15px/20px {B}; {glass(.62,24,24,False)}">{ic("search",19,MUTED)}Rechercher une session ou un message</div>'
 +caps('Tes sessions')
 +pane(conv('foot','Foot à 5 · Wavre','Lucas : on est devant la buvette','',2,True)+conv('badminton','Badminton · jeu. 19h','Sarah : j’amène des volants','18h40')+conv('spikeball','Spikeball · Genval','Tom : quelqu’un a un 2e set ?','Hier').replace(f'border-bottom: 1px solid {LINE}','border-bottom: 0'))
 +caps('Groupes par sport')
 +pane(conv('foot','Foot · Brabant wallon','Nouvelle session dimanche 10h','Lun.').replace(f'border-bottom: 1px solid {LINE}','border-bottom: 0'))
 +'</div>'+createbtn()+tabbar('Messages'))

# ===== 9 Chat de session =====
def bub(t,me=False,who=None,av=0):
    if me:
        return f'<div style="display: flex; justify-content: flex-end"><div style="max-width: 250px; background: {INK}; color: #fff; border-radius: 20px 20px 6px 20px; padding: 10px 14px; font: 400 15px/21px {B}">{t}</div></div>'
    return f'<div style="display: flex; gap: 8px; align-items: flex-end">{avatar(av,30)}<div style="display: flex; flex-direction: column; gap: 3px"><span style="font: 600 12px/16px {B}; color: {MUTED}; padding-left: 4px">{who}</span><div style="max-width: 250px; border-radius: 20px 20px 20px 6px; padding: 10px 14px; font: 400 15px/21px {B}; {glass(.78,20,24,False)}; border-radius: 20px 20px 20px 6px">{t}</div></div></div>'
chat=root(mapbg(veil=.5)
 +f'<div style="position: absolute; left: 16px; right: 16px; top: 54px; z-index: 4; padding: 8px 14px 8px 8px; box-sizing: border-box; display: flex; align-items: center; gap: 8px; {glass(.70,30,28)}">{gbtn("back","Retour")}<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px"><b style="font: 700 18px/22px {B}">Foot à 5 · Wavre</b><span style="display: flex; gap: 6px; align-items: center; font: 400 13px/18px {B}; color: {MUTED}">{live()} 7 inscrits</span></div>{avstack(3,28)}</div>'
 +f'<div style="position: absolute; left: 16px; right: 16px; top: 134px; z-index: 3; padding: 0 14px; height: 44px; box-sizing: border-box; display: flex; align-items: center; gap: 10px; font: 500 14px/20px {B}; {glass(.62,22,24,False)}">{ic("pin",18)}Parc de la Source · jusqu’à 20h<span style="margin-left: auto; font-weight: 600">Itinéraire</span></div>'
 +f'<div style="position: absolute; left: 16px; right: 16px; top: 196px; bottom: 152px; display: flex; flex-direction: column; gap: 12px; justify-content: flex-end">'
 +f'<div style="text-align: center; font: 500 12px/16px {B}; color: {MUTED}">Tu as rejoint la session · 18h55</div>'
 +bub('Yo ! On commence à 19h15, ramenez de l’eau',False,'Lucas',0)+bub('J’arrive dans 10 min',True)+bub('On est devant la buvette, maillots clairs',False,'Lucas',0)+bub('Parfait, à tout de suite',False,'Emma',4)+'</div>'
 +f'<div style="position: absolute; left: 16px; right: 16px; bottom: 82px; display: flex; gap: 8px; z-index: 3">{chip("J’arrive")}{chip("5 min de retard")}{chip("J’ai le matériel")}</div>'
 +f'<div style="position: absolute; left: 16px; right: 16px; bottom: 26px; display: flex; gap: 10px; align-items: center; z-index: 3"><div style="flex: 1; height: 48px; padding: 0 18px; box-sizing: border-box; display: flex; align-items: center; font: 400 15px/20px {B}; color: {MUTED}; {glass(.78,24,24,False)}">Écrire au groupe</div><button aria-label="Envoyer" style="width: 48px; height: 48px; border-radius: 24px; border: 0; background: {RED}; color: #fff; display: flex; align-items: center; justify-content: center">{ic("send",20,"#fff")}</button></div>')

# ===== 10 Profil =====
def setrow(icn,t,right='',last=False):
    bb='border-bottom: 0' if last else f'border-bottom: 1px solid {LINE}'
    return f'<button style="display: flex; align-items: center; gap: 14px; min-height: 44px; padding: 0 16px; border: 0; {bb}; background: transparent; width: 100%; text-align: left; font: 500 15px/20px {B}; color: {INK}">{ic(icn,21)}<span style="flex: 1">{t}</span>{right}</button>'
def toggle(on=True):
    return f'<span role="switch" aria-checked="{"true" if on else "false"}" style="width: 48px; height: 30px; border-radius: 15px; background: {INK if on else "rgba(60,60,67,.3)"}; position: relative; flex: none"><span style="position: absolute; {"right" if on else "left"}: 3px; top: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff"></span></span>'
def stat(n,l):
    return f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px"><b style="font: 700 24px/30px {B}">{n}</b><span style="font: 400 13px/18px {B}; color: {MUTED}">{l}</span></div>'
profil=root(mapbg(veil=.55)
 +f'<div style="position: absolute; left: 16px; right: 16px; top: 54px; display: flex; justify-content: space-between; align-items: center; z-index: 4">{gbtn("back","Retour")}<button style="height: 44px; padding: 0 16px; font: 600 14px/18px {B}; color: {INK}; {glass(.62,22)}">Modifier mon profil</button></div>'
 +f'<div style="position: absolute; left: 16px; right: 16px; top: 108px; display: flex; flex-direction: column; gap: 12px">'
 +f'<div style="display: flex; flex-direction: column; align-items: center; gap: 4px"><span style="width: 72px; height: 72px; border-radius: 36px; background: {INK}; color: #fff; display: flex; align-items: center; justify-content: center; font: 700 30px/1 {B}; border: 2px solid rgba(255,255,255,.8); box-sizing: border-box">M</span><div style="font: 700 28px/34px {B}; letter-spacing: -0.03em">Maxime</div><div style="font: 400 14px/20px {B}; color: {MUTED}">Wavre · membre depuis novembre 2026</div></div>'
 +pane(f'<div style="display: flex">{stat("12","jouées")}<span style="width: 1px; background: {LINE}"></span>{stat("100 %","de présence")}<span style="width: 1px; background: {LINE}"></span>{stat("3","organisées")}</div>','14px 8px',24)
 +f'<div style="display: flex; align-items: center; gap: 8px"><span style="font: 600 14px/18px {B}; color: {MUTED}; margin-right: 4px">Mes sports</span>{sptag("foot")}{sptag("badminton")}</div>'
 +caps('Mes sessions à venir')
 +f'<button style="width: 100%; box-sizing: border-box; text-align: left; padding: 10px 14px; display: flex; align-items: center; gap: 12px; font-family: {B}; color: {INK}; {glass(.66,22,24,False)}">{spbadge("badminton",44)}<div style="flex: 1; display: flex; flex-direction: column"><b style="font: 600 15px/20px {B}">Badminton · jeu. 19h</b><span style="font: 400 13px/18px {B}; color: {MUTED}">Rixensart · dans 4 jours</span></div>{ic("chev",18,MUTED)}</button>'
 +caps('Réglages')
 +pane(setrow('bell','Notifications',ic('chev',18,MUTED))+setrow('vib','Vibrations',toggle(True))+setrow('shield','Sécurité et signalements',ic('chev',18,MUTED))+setrow('msg','Aide et contact',ic('chev',18,MUTED))+setrow('back','Me déconnecter')+setrow('trash','Supprimer mon compte','',True),'0',22)
 +'</div>')

# ===== 11 Carte vide =====
vide=root(mapbg(veil=.35)+topbar('Ottignies · 5 km')+viewrow('list','Liste')
 +f'<div style="position: absolute; left: 16px; right: 16px; top: 210px; box-sizing: border-box; padding: 26px 22px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; {glass(.74,32,28)}">'
 +f'<div style="position: relative; width: 80px; height: 80px"><span class="shd" style="position: absolute; left: 22px; bottom: 6px; width: 36px; height: 8px; border-radius: 50%; background: {INK}"></span><span class="ball" style="position: absolute; left: 24px; bottom: 12px; width: 32px; height: 32px; border-radius: 50%; background: {INK}; border: 3px solid #fff; box-sizing: border-box; display: block"></span></div>'
 +f'<div style="font: 700 24px/30px {B}; letter-spacing: -0.02em">Rien à 5 km pour l’instant</div>'
 +f'<div style="font: 400 15px/22px {B}; color: {MUTED}">Lance la première session ici. On prévient les joueurs du coin.</div>'
 +f'<div style="width: 100%; display: flex; flex-direction: column; gap: 6px; margin-top: 8px">{btn("Voir les 4 sessions à 12 km")}<button style="border: 0; background: transparent; color: {INK}; font: 600 14px/20px {B}; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px">{ic("bell",18)}Me prévenir des sessions de badminton</button></div></div>'
 +createbtn()+tabbar('Carte'))

# ===== 12 Page web d’invitation =====
invit=root(mapbg(veil=.35)
 +f'<div style="position: absolute; left: 20px; right: 16px; top: 20px; height: 48px; display: flex; justify-content: space-between; align-items: center"><span style="font: 700 26px/30px {B}; letter-spacing: -0.04em">catch</span><a href="#" style="height: 44px; padding: 0 16px; display: flex; align-items: center; text-decoration: none; font: 600 14px/18px {B}; color: {INK}; {glass(.62,22)}">Ouvrir dans l’app</a></div>'
 +f'<div style="position: absolute; left: 20px; right: 20px; top: 92px; display: flex; flex-direction: column; gap: 8px"><div style="font: 500 15px/22px {B}; color: {MUTED}">Lucas t’invite à jouer</div><div style="font: 700 42px/46px {B}; letter-spacing: -0.04em">Foot à 5<br>ce soir</div></div>'
 +f'<div style="position: absolute; left: 16px; right: 16px; top: 244px; box-sizing: border-box; padding: 16px; display: flex; flex-direction: column; gap: 14px; {glass(.74,30,28)}">'
 +info('clock','Ce soir · 19h','Environ 1h')+info('pin','Parc de la Source, Wavre','Débutants bienvenus')
 +f'<div style="display: flex; align-items: center; justify-content: space-between"><div style="display: flex; flex-direction: column; gap: 6px"><span style="font: 600 15px/20px {B}">6 jouent · 3 places libres</span>{seats(6,3)}</div>{avstack(4,30,2)}</div></div>'
 +f'<div style="position: absolute; left: 20px; right: 20px; bottom: 32px; display: flex; flex-direction: column; gap: 8px">{btn("Rejoindre la session")}<div style="text-align: center; font: 400 13px/18px {B}; color: {MUTED}">Pas encore l’app ? Tu pourras l’installer juste après.</div></div>')

# ===== Système =====
def sw(c,n,v,border=True,glassy=False):
    bd=f'; border: 1px solid rgba(60,60,67,.18)' if border else ''
    return f'<div style="display: flex; flex-direction: column; gap: 8px; width: 150px"><div style="height: 84px; border-radius: 18px; background: {c}{bd}"></div><b style="font: 600 15px/20px {B}">{n}</b><span style="font: 400 13px/18px {B}; color: {MUTED}">{v}</span></div>'
def sglass(c,n,v,smoky=False):
    st=smoke(18) if smoky else glass(.62,18,24,False)
    return f'<div style="display: flex; flex-direction: column; gap: 8px; width: 150px"><div style="height: 84px; {st}"></div><b style="font: 600 15px/20px {B}">{n}</b><span style="font: 400 13px/18px {B}; color: {MUTED}">{v}</span></div>'
def tok(n,v,u):
    return f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LINE}; font: 400 14px/20px {B}"><b style="font-weight: 600; width: 160px">{n}</b><span style="width: 200px">{v}</span><span style="flex: 1; color: {MUTED}">{u}</span></div>'
def sysbox(inner,extra=''): return f'<div style="{glass(.66,32,28,False)}; padding: 28px; box-sizing: border-box; {extra}">{inner}</div>'
systeme=('<div style="width: 1280px; height: 1180px; position: relative; overflow: hidden; font-family: %s; font-variant-numeric: tabular-nums; color: %s">'%(B,INK)+mapbg(1280,1180)
 +'<div style="position: absolute; inset: 0; box-sizing: border-box; padding: 56px; display: flex; flex-direction: column; gap: 28px">'
 +f'<div style="display: flex; align-items: baseline; gap: 20px"><span style="font: 700 64px/68px {B}; letter-spacing: -0.05em">catch</span><span style="font: 500 20px/28px {B}; color: {MUTED}">Système visuel et animation v2 · liquid glass gris</span></div>'
 +'<div style="display: flex; gap: 28px">'
 +sysbox(f'<div style="font: 700 22px/28px {B}; margin-bottom: 18px">Couleurs</div><div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">'
   +sw(RED,'Rouge Catch',RED+' · action',False)+sw(REDH,'Rouge appuyé',REDH+' · pressé',False)+sw(INK,'Encre',INK+' · texte, sélection',False)+sw('#4A4A50','Texte secondaire','#4A4A50',False)
   +sglass(0,'Verre clair','rgba(242,242,247,.62–.86)')+sglass(0,'Verre fumé','rgba(44,44,48,.66) · menu',True)+sw(MAPBG,'Sol de carte',MAPBG)+sw(PARK,'Parcs et eau',PARK+' · '+WATER)+'</div>','flex: none')
 +sysbox(f'<div style="font: 700 22px/28px {B}; margin-bottom: 14px">Typographie</div><div style="font: 700 44px/50px {B}; letter-spacing: -0.03em">Tu l’as catchée !</div><div style="font: 400 14px/20px {B}; color: {MUTED}; margin-bottom: 14px">Inter 700 · titres</div>'
   +f'<div style="font: 400 17px/26px {B}">Débutants bienvenus. Choisis une session, appuie sur Catch, viens jouer.</div><div style="font: 400 14px/20px {B}; color: {MUTED}">Inter 400–600 · texte et interface, chiffres alignés</div>'
   +f'<div style="display: flex; gap: 10px; margin-top: 16px; align-items: center">{live()}{seek()}{tag("Débutants bienvenus")}</div>'
   +f'<div style="display: flex; gap: 12px; margin-top: 16px; align-items: center"><div style="width: 190px">{btn("Catch")}</div><div style="width: 190px">{btn("Inviter","glass")}</div><div>{seats(6,3,20)}</div></div>','flex: 1')
 +'</div>'
 +'<div style="display: flex; gap: 28px; flex: 1">'
 +sysbox(f'<div style="font: 700 22px/28px {B}; margin-bottom: 6px">Mouvement</div>'
   +tok('snappy','ressort 250 ms, sans rebond','Boutons pressés, pastilles, sélections')+tok('standard','ressort 400 ms, sans rebond','Tout ce qui se déplace')+tok('gesture','ressort 300 ms, amorti 0,8','Feuilles et cartes glissées au doigt')
   +tok('bounce','ressort 450 ms, amorti 0,55','Réservé à la balle et aux célébrations')+tok('Bouton pressé','scale 0,96 au toucher','Réaction en moins de 100 ms')+tok('Onglets','fondu 250 ms','Aucune vibration'),'flex: 1')
 +sysbox(f'<div style="font: 700 22px/28px {B}; margin-bottom: 6px">Vibrations</div>'
   +tok('Sélection','pastille, filtre, stepper','iOS selection · Android Segment_Tick')+tok('Appui sur Catch','impact moyen','iOS impact Medium · Android Virtual_Key')+tok('Catch confirmé','succès, avec la coche','iOS Success · Android Confirm')
   +tok('Complet ou butée','avertissement','iOS Warning · Android Reject')+tok('Jamais','scroll, onglets, frappe','Ni sur les animations automatiques')
   +f'<div style="display: flex; align-items: center; gap: 20px; margin-top: 18px"><div style="position: relative; width: 60px; height: 70px"><span class="shd" style="position: absolute; left: 16px; bottom: 2px; width: 28px; height: 6px; border-radius: 50%; background: {INK}"></span><span class="ball" style="position: absolute; left: 18px; bottom: 8px; width: 24px; height: 24px; border-radius: 50%; background: {INK}; border: 2px solid #fff; box-sizing: border-box; display: block"></span></div><span style="font: 400 15px/22px {B}; color: {MUTED}; max-width: 380px">La balle est le seul élément qui rebondit. Chargement après 400 ms, fixe si « Réduire les animations » est activé.</span></div>','flex: 1')
 +'</div></div></div>')

def sptile(k):
    return f'<div style="display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 28px 12px 22px; {glass(.66,24,24,False)}">{sp(k,96)}<b style="font: 600 17px/22px {B}">{SPORTS[k][0]}</b></div>'
order_sp=['foot','basket','volley','rugby','spikeball','tennis','badminton','escalade','padel','autre']
sportsboard=('<div style="width: 1280px; height: 1040px; position: relative; overflow: hidden; font-family: %s; color: %s">'%(B,INK)+mapbg(1280,1040,.2)
 +'<div style="position: absolute; inset: 0; box-sizing: border-box; padding: 56px; display: flex; flex-direction: column; gap: 32px">'
 +f'<div style="display: flex; flex-direction: column; gap: 8px"><div style="font: 700 44px/50px {B}; letter-spacing: -0.04em">Pictos des sports</div><div style="font: 400 17px/26px {B}; color: {MUTED}; max-width: 780px">Chaque sport a son objet, dessiné dans le même style flat : couleurs pleines, sans contour, une ombre douce pour le volume. Ils restent en couleur : ce sont des illustrations, pas des actions. Le picto est toujours accompagné du nom du sport, sauf sur la carte où il double le texte de la pastille.</div></div>'
 +'<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px">'+''.join(sptile(k) for k in order_sp)+'</div>'
 +'<div style="display: flex; gap: 48px; align-items: flex-end">'
 +f'<div style="display: flex; flex-direction: column; gap: 10px"><span style="font: 500 14px/20px {B}">Pastille de carte · 22 px</span><div style="position: relative; height: 40px; width: 190px">{mpill(0,0,"Basket · 5 jouent","live","basket")}</div></div>'
 +f'<div style="display: flex; flex-direction: column; gap: 10px"><span style="font: 500 14px/20px {B}">Liste et messages · 36 px</span><div style="display: flex; align-items: center; gap: 12px">{spbadge("rugby",52)}<b style="font: 700 19px/24px {B}">Rugby</b></div></div>'
 +f'<div style="display: flex; flex-direction: column; gap: 10px"><span style="font: 500 14px/20px {B}">Choix du sport · 36 px, sélectionné en noir</span><div style="width: 360px">{sptiles(["tennis","volley","padel","autre"],["tennis"],4,76)}</div></div>'
 +'</div></div></div>')

screens=[('Main','1. Carte (accueil)',carte),('Liste','2. Liste',liste),('Detail',"3. Détail d’une session",detail),('Connexion','4. Connexion au moment du Catch',connexion),
 ('PremierCatch','5. Tes sports (premier Catch)',premier),('Catche',"6. Tu l’as catchée !",catche),('Creer','7. Créer une session',creer),('Messages','8. Messages',messages),
 ('Chat','9. Chat de session',chat),('Profil','10. Profil',profil),('Vide','11. Carte vide',vide),('Invitation',"12. Page web d’invitation",invit)]
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
idx={'v':3,'createdOnFiles':{'v':1,'at':'2026-11-15T12:00:00Z'},'title':'Catch — design v2 (liquid glass)','launch':{'view':'canvas'},'pages':[],'boards':boards,'order':order,
 'notes':{'t1':{'x':0,'y':-260,'text':'Catch : écrans principaux (liquid glass)','kind':'title1','maxW':2740},'t2':{'x':0,'y':2120,'text':'Catch : système et pictos','kind':'title1','maxW':2640}},'designSystems':[]}
open(OUT+'/canvas.json','w').write(json.dumps(idx,ensure_ascii=False))
print(sorted(os.listdir(OUT)))
