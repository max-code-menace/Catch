'use strict';
/* ---------- utilitaires ---------- */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
function h(tag,a,...k){const e=document.createElement(tag);if(a)for(const[n,v]of Object.entries(a)){if(n==='class')e.className=v;else if(n.slice(0,2)==='on')e.addEventListener(n.slice(2),v);else if(n==='html')e.innerHTML=v;else if(n==='style'&&typeof v==='object')Object.assign(e.style,v);else if(v!==false&&v!=null)e.setAttribute(n,v===true?'':v)}
  for(const c of k.flat(9)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(c))}return e}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const store={get(k,d){try{const v=localStorage.getItem('catchlab-'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('catchlab-'+k,JSON.stringify(v))}catch(e){}}};
const IC={map:'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',plus:'M12 5v14M5 12h14',chat:'M4 5h16v11H9l-5 4z',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',list:'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',search:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',filter:'M4 6h16M7 12h10M10 18h4',chev:'M9 6l6 6-6 6',chevd:'M6 9l6 6 6-6',back:'M15 6l-6 6 6 6',check:'M5 12l5 5 9-10',x:'M6 6l12 12M18 6 6 18',bell:'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',pin:'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',people:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a7 7 0 0 1 4 6',send:'M4 12 20 4l-4 16-4-6z',heart:'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',cal:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',share:'M12 15V4M8 8l4-4 4 4M5 12v8h14v-8',locate:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3',sliders:'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6',lock:'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',wifioff:'M3 3l18 18M5 11a10 10 0 0 1 5-2.7M19 11a10 10 0 0 0-3-2M8.5 14.5a5 5 0 0 1 3-1.5M12 19h.01',alert:'M12 4 2 20h20zM12 10v4M12 17h.01',euro:'M17 6a6 6 0 1 0 0 12M5 10h9M5 14h9',star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',camera:'M4 8h4l2-3h4l2 3h4v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',more:'M5 12h.01M12 12h.01M19 12h.01',grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',link:'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1',trash:'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',flag:'M5 21V4M5 5h12l-2 4 2 4H5',copy:'M9 9h11v11H9zM5 15V4h11',qr:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM19 19h1',mail:'M3 6h18v12H3zM3 7l9 7 9-7',drag:'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',undo:'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',moon:'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z',zap:'M13 3 5 14h6l-1 7 8-11h-6z',home:'M4 11l8-7 8 7v9H4z',phone:'M6 3h12v18H6zM11 18h2',globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',key:'M8 15a4 4 0 1 1 3.9-5H21v3h-3v3h-3v-3h-3.1A4 4 0 0 1 8 15z',pause:'M8 5v14M16 5v14',sun:'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5'};
const Is=(n,s=20,sw=1.8)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[n]||''}"/></svg>`;
const I=(n,s=20,sw)=>h('span',{class:'ic',html:Is(n,s,sw)});
const SP=(id,s=30)=>h('span',{class:'sp',style:{width:s+'px',height:s+'px'},html:(typeof PICTOS!=='undefined'&&PICTOS[id])||''});
const COLS=['#C8361C','#E35A0C','#1F7A4D','#245A8D','#7A4BA8','#B07A00','#0F7B83','#A23B72'];
const AV=(n,i=0,s=30)=>h('span',{class:'av',style:{background:COLS[(i??n.charCodeAt(0))%COLS.length],width:s+'px',height:s+'px',fontSize:s*.4+'px'}},n[0]);
/* ---------- données d'exemple (fictives) ---------- */
const SPORTS=[['foot','Foot'],['basket','Basket'],['volley','Volley'],['rugby','Rugby'],['spikeball','Spikeball'],['tennis','Tennis'],['badminton','Badminton'],['escalade','Escalade'],['padel','Padel'],['autre','Autre']].map(([id,n])=>({id,n}));
const spName=id=>(SPORTS.find(s=>s.id===id)||{}).n||id;
const LV=['Débutants bienvenus','Intermédiaire','Confirmé'];
const SESS=[
 {id:1,sp:'foot',day:0,t:'19h',when:'Ce soir 19h',pl:'Terrain synthétique',com:'Wavre',km:.6,in:6,max:10,lv:0,px:0,org:'Karim',x:50,y:44},
 {id:2,sp:'volley',day:0,t:'19h30',when:'Ce soir 19h30',pl:'Salle omnisports',com:'Ottignies',km:3.2,in:5,max:6,lv:1,px:3,org:'Léa',x:28,y:66},
 {id:3,sp:'basket',day:0,t:'18h45',when:'En direct',live:true,pl:'Plaine de jeux',com:'Wavre',km:1.4,in:7,max:10,lv:0,px:0,org:'Noah',x:70,y:58},
 {id:4,sp:'tennis',day:1,t:'12h30',when:'Demain 12h30',pl:'Courts communaux',com:'Rixensart',km:5.1,in:1,max:2,lv:1,px:0,org:'Inès',x:78,y:24},
 {id:5,sp:'padel',day:1,t:'20h',when:'Demain 20h',pl:'Club de padel',com:'Waterloo',km:9.8,in:3,max:4,lv:2,px:6,org:'Hugo',x:22,y:22},
 {id:6,sp:'spikeball',day:2,t:'17h',when:'Mer. 17h',pl:'Parc, pelouse nord',com:'Wavre',km:.9,in:3,max:6,lv:0,px:0,org:'Manon',x:40,y:30},
 {id:7,sp:'badminton',day:3,t:'19h',when:'Jeu. 19h',pl:'Salle des sports',com:'Louvain-la-Neuve',km:7.5,in:4,max:8,lv:1,px:2,org:'Yanis',x:60,y:78},
 {id:8,sp:'escalade',day:4,t:'18h',when:'Ven. 18h',pl:'Salle de bloc',com:'Ottignies',km:3.6,in:5,max:8,lv:0,px:8,org:'Camille',x:14,y:44},
 {id:9,sp:'foot',day:5,t:'10h',when:'Sam. 10h',pl:'Terrain synthétique',com:'Wavre',km:.6,in:9,max:10,lv:2,px:0,org:'Sarah',x:46,y:74},
 {id:10,sp:'rugby',day:6,t:'15h',when:'Dim. 15h',pl:'Stade communal',com:'Court-Saint-Étienne',km:8.9,in:11,max:14,lv:1,px:0,org:'Tom',x:84,y:48}
];
const need=s=>s.max-s.in;
const needTxt=s=>s.live?s.in+' jouent':need(s)===0?'Complet':need(s)===1?'Il manque 1 joueur':'Il manque '+need(s)+' joueurs';
/* ---------- retours haptiques (simulés) ---------- */
const HAP={select:['Sélection','selectionAsync','Segment_Tick',[8]],light:['Impact léger','impact Light','Clock_Tick',[6]],impact:['Appui sur Catch','impact Medium','Virtual_Key',[18]],success:['Succès','notification Success','Confirm',[15,40,25]],warn:['Complet / butée','notification Warning','Reject',[30,40,30]],error:['Erreur','notification Error','Reject',[40,50,40,50,40]]};
const state={haptics:true,sel:store.get('sel',{}),keep:store.get('keep',{})};
function hap(k){if(!state.haptics||!HAP[k])return;const[l,ios,and,pat]=HAP[k];const el=$('#hap');if(!el)return;$('#hap-t').textContent=l+' · iOS '+ios+' · Android '+and;el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');try{navigator.vibrate&&navigator.vibrate(pat)}catch(e){}}
/* ---------- téléphone ---------- */
function phone(build,o={}){
  const wrap=h('div',{class:'phone'+(o.dark?' dark':''),style:o.style||null});
  const scr=h('div',{class:'ph-scr'+(o.cls?' '+o.cls:'')});
  const body=h('div',{class:'ph-body'});
  scr.append(h('div',{class:'ph-status'},h('span',{},'9:41'),h('span',{class:'ph-ind'})),body);
  wrap.append(h('div',{class:'ph-screen'},scr),h('div',{class:'ph-home'}));
  let tt;
  const ctx={wrap,scr,body,hasNav:!!o.nav,
    toast(text,act,fn,ms=5000){$$('.toast',scr).forEach(t=>t.remove());clearTimeout(tt);const t=h('div',{class:'toast',style:{bottom:o.nav===false||!o.nav?'28px':'92px'}},h('span',{},text),act&&h('button',{onclick:()=>{fn&&fn();t.remove()}},act),act&&h('i',{style:{animationDuration:ms+'ms'}}));scr.append(t);requestAnimationFrame(()=>t.classList.add('in'));tt=setTimeout(()=>{t.classList.remove('in');setTimeout(()=>t.remove(),300)},ms);return t},
    sheet(content,so={}){const ov=h('div',{class:'ov'});const sh=h('div',{class:'sh'});const grab=h('div',{class:'grab'});sh.append(grab,so.title&&h('div',{class:'hd h2',style:{marginBottom:'10px'}},so.title),content);scr.append(ov,sh);requestAnimationFrame(()=>{ov.classList.add('in');sh.classList.add('in')});
      const api={el:sh,close(){ov.classList.remove('in');sh.classList.remove('in');sh.style.transform='';setTimeout(()=>{ov.remove();sh.remove()},350);so.onClose&&so.onClose()}};
      ov.addEventListener('click',api.close);
      let y0=null,dy=0,t0=0;grab.addEventListener('pointerdown',e=>{y0=e.clientY;t0=Date.now();grab.setPointerCapture(e.pointerId);sh.style.transition='none'});
      grab.addEventListener('pointermove',e=>{if(y0==null)return;dy=Math.max(0,e.clientY-y0);sh.style.transform='translateY('+dy+'px)'});
      const up=()=>{if(y0==null)return;const v=dy/(Date.now()-t0);sh.style.transition='';y0=null;if(dy>90||v>.6){api.close()}else{sh.style.transform=''}dy=0};grab.addEventListener('pointerup',up);grab.addEventListener('pointercancel',up);
      return api},
    dialog(d){const ov=h('div',{class:'ov'});const dl=h('div',{class:'dlg'},h('div',{class:'hd h2'},d.title),d.text&&h('p',{class:'mute',style:{margin:'8px 0 14px'}},d.text),d.body,h('div',{class:'stk gap8',style:{marginTop:'12px'}},(d.actions||[]).map(a=>h('button',{class:'btn '+(a.k||''),onclick:()=>{api.close();a.f&&a.f()}},a.l))));scr.append(ov,dl);requestAnimationFrame(()=>{ov.classList.add('in');dl.classList.add('in')});const api={el:dl,close(){ov.classList.remove('in');dl.classList.remove('in');setTimeout(()=>{ov.remove();dl.remove()},250)}};ov.addEventListener('click',api.close);return api},
    confetti(){const cs=['#C8361C','#E35A0C','#FBC02D','#1F7A4D','#245A8D'];for(let i=0;i<26;i++){const c=h('i',{class:'confetti',style:{background:cs[i%5],left:'50%',top:'46%'}});scr.append(c);const a=Math.random()*Math.PI*2,d=70+Math.random()*130;c.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d+90}px) rotate(${Math.random()*540}deg)`,opacity:0}],{duration:900+Math.random()*500,easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=()=>c.remove()}}
  };
  const out=build(ctx);if(out&&out.nodeType)body.append(out);
  if(o.nav)body.style.paddingBottom='90px';
  return wrap}
/* barre de navigation flottante */
function navBar(tabs,cur,on,cls=''){const n=h('nav',{class:'nav '+cls});const draw=()=>{n.replaceChildren(...tabs.map(([id,l,ic])=>h('button',{'aria-current':id===cur,onclick:()=>{if(id===cur)return;cur=id;hap('select');draw();on(id)}},I(ic,20),h('span',{},l))))};draw();n.set=c=>{cur=c;draw()};return n}
/* segment avec pastille qui glisse */
function seg(opts,cur,on){const el=h('div',{class:'seg'});const th=h('i',{class:'thumb'});el.append(th);const bs=opts.map(([id,l])=>{const b=h('button',{'aria-pressed':id===cur,onclick:()=>set(id,true)},l);el.append(b);return b});
  function place(){const i=opts.findIndex(o=>o[0]===cur);const b=bs[i];if(!b)return;th.style.width=b.offsetWidth+'px';th.style.transform='translateX('+b.offsetLeft+'px)'}
  function set(id,u){cur=id;bs.forEach((b,i)=>b.setAttribute('aria-pressed',opts[i][0]===id));place();if(u){hap('select');on&&on(id)}}
  new ResizeObserver(place).observe(el);requestAnimationFrame(place);el.set=set;return el}
const tog=(on,fn)=>{const b=h('button',{class:'tog',role:'switch','aria-checked':!!on,onclick:()=>{const v=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',v);hap('select');fn&&fn(v)}});return b};
const sessCard=(s,o={})=>h('button',{class:'card tap row gap12',style:{width:'100%',textAlign:'left',...(o.style||{})},onclick:o.on},
  h('span',{class:'sq'},SP(s.sp)),
  h('span',{class:'fx stk'},h('b',{},spName(s.sp)+' · '+s.com),h('span',{class:'mute small'},s.when+' · à '+(s.km<1?Math.round(s.km*1000)+' m':s.km+' km'))),
  s.live?h('span',{class:'badge'},h('i',{class:'live-dot'}),'En direct'):need(s)>0&&need(s)<=2?h('span',{class:'badge org'},need(s)===1?'Manque 1':'Manque '+need(s)):h('span',{class:'badge gr'},s.in+'/'+s.max));
const bar=(l,r)=>h('div',{class:'topbar'},l,h('div',{class:'fx'}),r);
const logo=()=>h('span',{class:'hd',style:{fontSize:'20px',color:'var(--a-pri)'}},'catch');
const ibtn=(n,fn,lab)=>h('button',{class:'sq',style:{width:'38px',height:'38px',border:0,borderRadius:'12px'},'aria-label':lab||n,onclick:fn},I(n,18));
/* ---------- rendu d'un pattern ---------- */
const CRIT=['Compréhension','Rapidité','Peu de manipulations','Accessibilité','Cohérence','Fluidité','Charge cognitive faible','Petits écrans','Faisabilité technique','Maintenabilité'];
const TYPES={p:'Bonne pratique éprouvée',t:'Tendance visuelle',x:'Expérimentation'};
const CX=['','Simple · environ ½ jour','Moyenne · 1 à 3 jours','Élevée · plus de 3 jours'];
const sum=s=>[...s].reduce((a,b)=>a+ +b,0);
function renderPattern(mod,p){
  const sec=h('section',{class:'pat',id:'p-'+p.id});
  const key=p.id;let cur=Math.min(state.sel[key]||0,p.v.length-1);
  const tabs=h('div',{class:'vtabs',role:'tablist'});
  const body=h('div',{class:'pat-b'});
  sec.append(h('div',{class:'pat-h'},h('h2',{},p.n),h('div',{class:'legend',style:{margin:0}},p.v.some((v,i)=>i===p.reco)&&h('span',{class:'tag r'},'★ Reco : '+p.v[p.reco].n))),h('p',{class:'goal'},h('b',{},'Objectif. '),p.goal),tabs,body);
  function draw(){
    state.sel[key]=cur;store.set('sel',state.sel);
    tabs.replaceChildren(...p.v.map((v,i)=>h('button',{class:'vtab',role:'tab','aria-selected':i===cur,onclick:()=>{cur=i;draw()}},(i===p.reco?'★ ':'')+v.n,h('small',{},sum(v.s)+'/50'))));
    const v=p.v[cur];
    const stage=h('div',{class:'stage'});
    const mount=()=>{stage.replaceChildren(v.demo(),h('div',{class:'stage-t'},h('button',{class:'mini',onclick:mount},'Réinitialiser')),h('div',{class:'small mute',style:{textAlign:'center',maxWidth:'290px'}},v.hint||'Touche et manipule la maquette. Les données sont des exemples.'))};mount();
    const facts=[['Comment ça marche',v.how],['Quand l’utiliser',v.when],['Animation',v.anim],['Vibration',v.hap],['Pour rester rapide',v.fast]].filter(f=>f[1]);
    const kept=state.keep[key]===cur;
    const info=h('div',{},
      h('div',{class:'legend'},h('span',{class:'tag '+v.t},TYPES[v.t]),h('span',{class:'tag'},'Complexité : '+CX[v.cx]),cur===p.reco&&h('span',{class:'tag r'},'★ Recommandé')),
      h('dl',{class:'facts'},facts.map(f=>h('div',{class:'fact'},h('dt',{},f[0]),h('dd',{},f[1])))),
      h('div',{class:'pc'},h('div',{class:'pros'},h('h3',{},'Avantages'),h('ul',{},v.pro.split('|').map(x=>h('li',{},x)))),h('div',{class:'cons'},h('h3',{},'Limites'),h('ul',{},v.con.split('|').map(x=>h('li',{},x))))),
      h('details',{class:'an'},h('summary',{},h('span',{},'Analyse critique (10 critères)'),h('span',{class:'mono'},sum(v.s)+' / 50')),
        h('div',{class:'sc'},CRIT.map((c,i)=>h('div',{class:'sc-r'},h('span',{},c),h('span',{class:'pips','aria-label':v.s[i]+' sur 5'},[1,2,3,4,5].map(n=>h('i',{class:'pip'+(n<=+v.s[i]?' on':'')}))))),),
        h('p',{class:'note'},'Notes de 1 à 5, 5 = meilleur (donc 5 en « charge cognitive faible » = très simple). C’est un jugement argumenté de l’équipe, pas une mesure sur des utilisateurs.')),
      v.ref&&h('div',{class:'refs'},v.ref.map(k=>REFS[k]&&h('a',{href:REFS[k][1],target:'_blank',rel:'noopener'},REFS[k][0]+' ↗'))),
      h('div',{class:'reco'},h('b',{},'Ma recommandation pour Catch. '),p.why),
      h('button',{class:'keep','aria-pressed':kept,onclick:e=>{if(state.keep[key]===cur)delete state.keep[key];else state.keep[key]=cur;store.set('keep',state.keep);e.target.setAttribute('aria-pressed',state.keep[key]===cur);e.target.textContent=state.keep[key]===cur?'✓ Variante retenue':'Retenir cette variante'}},kept?'✓ Variante retenue':'Retenir cette variante'));
    body.replaceChildren(stage,info)}
  draw();return sec}
