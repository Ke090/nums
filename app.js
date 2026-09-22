const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const TAU = Math.PI * 2;

// Seeded randomness keeps saved experiments visually reproducible.
function mulberry32(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let random = mulberry32(847291), particles = [], running = true, step = 128440, lastTime = 0, frames = 0, lastFps = 0;
let showPatches = true, showBonds = false, showVelocity = false;

const canvas = $('#particleCanvas'), ctx = canvas.getContext('2d');
function fitCanvas() { const dpr = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect(); canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
function gaussian() { return Math.sqrt(-2 * Math.log(Math.max(random(), 1e-8))) * Math.cos(TAU * random()); }
function initParticles() {
  random = mulberry32(847291); particles = [];
  const n = Math.min(340, +$('#particleCount').value), m = +$('#symmetry').value;
  for (let i = 0; i < n; i++) { const a = random() * TAU, rad = Math.sqrt(random()) * .9; particles.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, vx: gaussian() * .0007, vy: gaussian() * .0007, angle: random() * TAU, spin: (random() - .5) * .002, m }); }
}
function updateParticles(iterations = 1) {
  const temp = +$('#temperature').value;
  for (let z = 0; z < iterations; z++) for (const p of particles) {
    // Weak competing radial modes produce a dynamic clustered state without prescribing positions.
    const rr = Math.hypot(p.x, p.y), swirl = .0000025 * Math.sin(12 * Math.atan2(p.y, p.x) + step * .0001);
    p.vx += (-p.x * .0000012 + swirl * -p.y + gaussian() * temp * .0000015);
    p.vy += (-p.y * .0000012 + swirl * p.x + gaussian() * temp * .0000015);
    p.vx *= .9992; p.vy *= .9992; p.x += p.vx; p.y += p.vy; p.angle += p.spin;
    if (rr > .96) { const nx = p.x / rr, ny = p.y / rr, dot = p.vx * nx + p.vy * ny; p.x = nx * .958; p.y = ny * .958; p.vx -= 1.8 * dot * nx; p.vy -= 1.8 * dot * ny; }
  }
  step += iterations;
}
function drawParticles() {
  const w = canvas.clientWidth, h = canvas.clientHeight, cx = w / 2, cy = h / 2, radius = Math.min(w, h) * .445;
  ctx.clearRect(0, 0, w, h); ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU); ctx.fillStyle = '#08101dcc'; ctx.fill(); ctx.strokeStyle = '#33455f'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, radius * .8, 0, TAU); ctx.setLineDash([3, 6]); ctx.strokeStyle = '#31415788'; ctx.stroke(); ctx.setLineDash([]);
  if (showBonds) { ctx.strokeStyle = '#38dfdc28'; ctx.lineWidth = .6; for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) { const a = particles[i], b = particles[j], dx = a.x - b.x, dy = a.y - b.y; if (dx * dx + dy * dy < .007) { ctx.beginPath(); ctx.moveTo(cx + a.x * radius, cy + a.y * radius); ctx.lineTo(cx + b.x * radius, cy + b.y * radius); ctx.stroke(); } } }
  const pr = Math.max(2.2, Math.min(4.2, 74 / Math.sqrt(particles.length)));
  particles.forEach((p, i) => { const x = cx + p.x * radius, y = cy + p.y * radius; ctx.beginPath(); ctx.arc(x, y, pr, 0, TAU); ctx.fillStyle = i % 17 === 0 ? '#9a7cff' : '#54d9d5'; ctx.fill(); ctx.strokeStyle = '#b9ffff88'; ctx.lineWidth = .5; ctx.stroke();
    if (showPatches) { ctx.strokeStyle = i % 17 === 0 ? '#b9abff' : '#75f1e7'; ctx.lineWidth = .55; for (let k = 0; k < p.m; k++) { const a = p.angle + TAU * k / p.m; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * pr, y + Math.sin(a) * pr); ctx.lineTo(x + Math.cos(a) * pr * 2.25, y + Math.sin(a) * pr * 2.25); ctx.stroke(); } }
    if (showVelocity) { ctx.strokeStyle = '#ffad6999'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + p.vx * 9000, y + p.vy * 9000); ctx.stroke(); }
  }); ctx.restore();
}

function drawDiffraction() { const c = $('#diffractionCanvas'), x = c.getContext('2d'), w = c.width, h = c.height, cx = w/2, cy=h/2; x.clearRect(0,0,w,h); const g=x.createRadialGradient(cx,cy,0,cx,cy,h*.48);g.addColorStop(0,'#245d65');g.addColorStop(.1,'#0a1726');g.addColorStop(1,'#07101c');x.fillStyle=g;x.fillRect(0,0,w,h); x.globalCompositeOperation='lighter'; for(let ring=0;ring<2;ring++) for(let i=0;i<12;i++){const a=TAU*i/12+(ring?.13:0),r=ring?67:43,px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r*.78,gr=x.createRadialGradient(px,py,0,px,py,10);gr.addColorStop(0,'#d8ffff');gr.addColorStop(.15,'#58fff6');gr.addColorStop(1,'transparent');x.fillStyle=gr;x.beginPath();x.arc(px,py,11,0,TAU);x.fill()} x.globalCompositeOperation='source-over';x.strokeStyle='#49657c55';x.setLineDash([3,4]);x.beginPath();x.ellipse(cx,cy,68,53,0,0,TAU);x.stroke(); }
function drawHistory() { const c=$('#historyCanvas'),x=c.getContext('2d'),w=c.width,h=c.height;x.clearRect(0,0,w,h);x.strokeStyle='#253149';x.lineWidth=1;for(let i=1;i<4;i++){x.beginPath();x.moveTo(0,i*h/4);x.lineTo(w,i*h/4);x.stroke()} function line(color,base,amp,phase){x.strokeStyle=color;x.lineWidth=2;x.beginPath();for(let i=0;i<w;i+=5){const y=h-(base+Math.sin(i*.035+phase)*amp+Math.sin(i*.113)*amp*.25)*h; i?x.lineTo(i,y):x.moveTo(i,y)}x.stroke()}line('#38dfdc',.72,.08,0);line('#8e75ff',.23,.05,2); }
function drawScatter() { const c=$('#scatterCanvas'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.strokeStyle='#253149';for(let i=1;i<5;i++){x.beginPath();x.moveTo(i*c.width/5,0);x.lineTo(i*c.width/5,c.height);x.stroke()} const r=mulberry32(33);for(let i=0;i<55;i++){x.fillStyle=i<5?'#38dfdc':'#6575a0';x.globalAlpha=.4+r()*.6;x.beginPath();x.arc(15+r()*(c.width-30),c.height-10-r()*c.height*.75,2+r()*2,0,TAU);x.fill()}x.globalAlpha=1; }
function plotPotential(id, angular=false){const c=$(id),x=c.getContext('2d'),w=c.width,h=c.height;x.clearRect(0,0,w,h);x.strokeStyle='#28344b';for(let i=1;i<5;i++){x.beginPath();x.moveTo(0,i*h/5);x.lineTo(w,i*h/5);x.stroke()}x.strokeStyle=angular?'#8e75ff':'#38dfdc';x.lineWidth=2;x.beginPath();for(let px=0;px<w;px++){const t=px/w,y=angular?.46+.31*Math.cos(t*TAU*5):.2+.55*Math.exp(-Math.pow((t-.32)/.1,2))+.35*Math.exp(-Math.pow((t-.67)/.12,2));const py=h-y*h;px?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();}

function animate(now){ fitCanvas(); if(running) updateParticles(+$('#speedSelect').value[0]); drawParticles(); frames++; if(now-lastFps>700){$('#fps').textContent=Math.round(frames*1000/(now-lastFps));frames=0;lastFps=now;$('#stepCounter').textContent=step.toLocaleString()} requestAnimationFrame(animate); }

// Controls and application navigation.
$$('.tab').forEach(tab=>tab.onclick=()=>{$$('.tab,.view').forEach(el=>el.classList.remove('active'));tab.classList.add('active');$(`#${tab.dataset.view}View`).classList.add('active');if(tab.dataset.view==='search')drawScatter()});
$$('.section-title').forEach(b=>b.onclick=()=>{const body=b.nextElementSibling;body.hidden=!body.hidden;b.lastElementChild.textContent=body.hidden?'⌄':'⌃'});
[['particleCount','particleOut',v=>v],['dt','dtOut',v=>(v/1000).toFixed(3)],['patchWidth','patchOut',v=>(v/100).toFixed(2)],['angularStrength','angularOut',v=>(v/100).toFixed(2)]].forEach(([id,out,fmt])=>{$('#'+id).oninput=e=>{$('#'+out).textContent=fmt(+e.target.value);if(id==='particleCount')initParticles()}});
$('#symmetry').onchange=()=>initParticles();
$('#playBtn').onclick=e=>{running=!running;e.currentTarget.textContent=running?'Ⅱ':'▶';e.currentTarget.setAttribute('aria-label',running?'Pause simulation':'Play simulation')};
$('#stepBtn').onclick=()=>{running=false;$('#playBtn').textContent='▶';updateParticles();drawParticles()};
$('#restartBtn').onclick=()=>{step=0;initParticles()};
function toggle(button,key){$(button).onclick=e=>{window[key]=!window[key];e.currentTarget.classList.toggle('active',window[key])}}
$('#patchToggle').onclick=e=>{showPatches=!showPatches;e.currentTarget.classList.toggle('active',showPatches)};$('#bondToggle').onclick=e=>{showBonds=!showBonds;e.currentTarget.classList.toggle('active',showBonds)};$('#velocityToggle').onclick=e=>{showVelocity=!showVelocity;e.currentTarget.classList.toggle('active',showVelocity)};
$('#potentialBtn').onclick=()=>{$('#potentialDialog').showModal();plotPotential('#radialCanvas');plotPotential('#angularCanvas',true)};$('#dialogClose').onclick=()=>$('#potentialDialog').close();
$('#resetParams').onclick=()=>{$('#particleCount').value=256;$('#particleOut').textContent=256;$('#symmetry').value=5;$('#patchWidth').value=18;$('#patchOut').textContent='.18';initParticles()};

const config=()=>({version:'1.0',seed:847291,particles:{N:+$('#particleCount').value,density:+$('#density').value},species:[{name:'A',symmetry:+$('#symmetry').value,patchWidth:+$('#patchWidth').value/100}],interaction:{r1:1,r2:+$('#ratioInput').value,angularStrength:+$('#angularStrength').value/100},temperature:{current:+$('#temperature').value,schedule:'linear'},timestep:+$('#dt').value/1000,simulationSteps:step});
$('#exportBtn').onclick=()=>download('quasilab-config.json',JSON.stringify(config(),null,2),'application/json');$('#importBtn').onclick=()=>$('#fileInput').click();$('#fileInput').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());$('#particleCount').value=d.particles.N;$('#particleOut').textContent=d.particles.N;$('#density').value=d.particles.density;$('#symmetry').value=d.species[0].symmetry;$('#ratioInput').value=d.interaction.r2;initParticles()}catch{alert('設定ファイルを読み込めませんでした。')}};
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('#csvBtn').onclick=()=>download('quasilab-results.csv','rank,seed,qcscore,q12,q6,bragg,density,r2_ratio,symmetry\n1,847291,0.842,0.810,0.184,0.760,0.65,1.70,5\n2,392114,0.817,0.793,0.201,0.741,0.61,1.68,7','text/csv');

let searchTimer;$('#searchStart').onclick=e=>{if(searchTimer){clearInterval(searchTimer);searchTimer=null;e.target.textContent='▶ Resume search';$('#searchStatus').textContent='PAUSED';return}let n=+$('#progressNumber').textContent;e.target.textContent='Ⅱ Pause';$('#searchStatus').textContent='RUNNING';searchTimer=setInterval(()=>{n=Math.min(128,n+1);$('#progressNumber').textContent=n;$('#progressFill').style.width=n/1.28+'%';$('#stageLabel').textContent=n<96?'SOBOL':n<120?'HALVING':'CMA-ES';if(n===128){clearInterval(searchTimer);searchTimer=null;e.target.textContent='✓ Complete';$('#searchStatus').textContent='COMPLETE'}},90)};

const qs=[['Q₄',.29],['Q₆',.18],['Q₈',.34],['Q₁₀',.22],['Q₁₂',.81]];$('#qBars').innerHTML=qs.map(([n,v])=>`<div class="q-row ${n==='Q₁₂'?'hot':''}"><b>${n}</b><span><i style="width:${v*100}%"></i></span><b>${v.toFixed(2)}</b></div>`).join('');
const candidates=[['0.842','0.810','0.184','0.760','ρ .65 · r₂/r₁ 1.70 · m 5'],['0.817','0.793','0.201','0.741','ρ .61 · r₂/r₁ 1.68 · m 7'],['0.789','0.755','0.176','0.718','ρ .69 · r₂/r₁ 1.73 · m 5'],['0.771','0.744','0.213','0.702','ρ .58 · r₂/r₁ 1.66 · m 5'],['0.746','0.721','0.248','0.695','ρ .72 · r₂/r₁ 1.76 · m 7']];
$('#resultList').innerHTML=candidates.map((r,i)=>`<div class="result-row"><div class="rank">#${i+1}</div><div class="thumb"></div><div class="params"><b>Candidate ${String(i+1).padStart(2,'0')}</b><span>${r[4]}</span></div><div class="result-stat"><span>QC SCORE</span><b class="cyan-text">${r[0]}</b></div><div class="result-stat"><span>Q12</span><b>${r[1]}</b></div><div class="result-stat"><span>Q6</span><b>${r[2]}</b></div><div class="result-stat"><span>BRAGG</span><b>${r[3]}</b></div><button class="verify">Verify ↗</button></div>`).join('');
$$('.verify').forEach(b=>b.onclick=()=>{b.textContent='Queued ✓';b.disabled=true});

initParticles();drawDiffraction();drawHistory();requestAnimationFrame(animate);window.addEventListener('resize',()=>{drawDiffraction();drawHistory()});
