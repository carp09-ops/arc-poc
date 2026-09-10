// ARC QA Sprint 1 — full-body measurement map.
(function(){
if(typeof S==='undefined')return;
const oldBody=typeof body==='function'?body:null;
const safe=v=>typeof esc==='function'?esc(v):String(v??'');
const n=v=>v===''||v==null||!Number.isFinite(+v)?null:+v;
function latest(){const h=S.history||{},m=Array.isArray(h.measurements)?h.measurements:[],b=Array.isArray(h.body)?h.body:[];return m.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1)||b.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1)||S.profile||{}}
const defs=[
 ['neck','Neck','in','left','19'],['shoulders','Shoulders','in','right','27'],['chest','Chest','in','left','37'],['arm','Upper arm','in','right','43'],['waist','Waist','in','left','52'],['hips','Hips','in','right','61'],['thigh','Thigh','in','left','74'],['calf','Calf','in','right','88']
];
function value(row,k,u){const x=n(row[k]);return x==null?'—':`${x} ${u}`}
function figure(){return `<svg class="arc-body-anatomy" viewBox="0 0 300 610" role="img" aria-label="Full-body front view with measurement locations">
 <defs><linearGradient id="arcBodyFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9a68d" stop-opacity=".24"/><stop offset="1" stop-color="#685c4c" stop-opacity=".08"/></linearGradient></defs>
 <circle class="arc-body-silhouette" cx="150" cy="55" r="33"/>
 <path class="arc-body-silhouette" d="M119 91 C104 99 94 118 91 143 L76 263 C74 280 87 285 94 268 L105 177 L111 300 C112 325 105 359 102 405 L99 548 C99 570 116 574 121 551 L143 363 L157 363 L179 551 C184 574 201 570 201 548 L198 405 C195 359 188 325 189 300 L195 177 L206 268 C213 285 226 280 224 263 L209 143 C206 118 196 99 181 91 C164 101 136 101 119 91 Z"/>
 <path class="arc-body-center" d="M150 93 L150 360"/>
 <path class="arc-body-band shoulders" d="M104 130 Q150 112 196 130"/><path class="arc-body-band chest" d="M106 185 Q150 197 194 185"/><path class="arc-body-band waist" d="M111 268 Q150 278 189 268"/><path class="arc-body-band hips" d="M109 324 Q150 339 191 324"/>
 <path class="arc-body-band thigh" d="M105 424 Q124 432 142 426"/><path class="arc-body-band calf" d="M100 493 Q112 500 125 495"/><path class="arc-body-band arm" d="M88 224 Q99 229 105 222"/><path class="arc-body-band neck" d="M125 93 Q150 102 175 93"/>
 </svg>`}
function upgrade(){if(S.screen!=='body')return;const photo=document.querySelector('.v05-body-photo');if(!photo||photo.dataset.arcBodyQa==='1')return;const row=latest(),date=row.date||'';photo.dataset.arcBodyQa='1';photo.classList.add('arc-body-map-upgraded');photo.innerHTML=`<div class="arc-body-map-title"><span class="eyebrow">BODY MAP</span><b>${date?'Latest measurements':'Build your baseline'}</b><small>Measurement points · front view</small></div>${figure()}<div class="arc-body-weight"><span>WEIGHT</span><b>${value(row,'weight','lb')}</b></div><div class="arc-body-points">${defs.map(([k,label,u,side,y])=>`<div class="arc-body-point ${side}" style="--y:${y}%"><span class="arc-body-line"></span><div><small>${safe(label).toUpperCase()}</small><b>${safe(value(row,k,u))}</b></div></div>`).join('')}</div><div class="arc-body-map-foot">Same landmarks each time. Trends become useful when measurements are repeatable.</div>`}
if(oldBody){try{body=function(){oldBody();upgrade()}}catch(e){window.body=function(){oldBody();upgrade()}}}
window.addEventListener('arc:rendered',upgrade);
window.ArcBodyQA={render:upgrade,version:'1.0'};
})();