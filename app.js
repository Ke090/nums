const homeScreen = document.querySelector('#homeScreen');
const gameScreen = document.querySelector('#gameScreen');
const playArea = document.querySelector('#playArea');
const goalPanel = document.querySelector('#goalPanel');
const goalNumber = document.querySelector('#goalNumber');
const instruction = document.querySelector('#instruction');
const splitDialog = document.querySelector('#splitDialog');
const splitChoices = document.querySelector('#splitChoices');
const colors = ['#ef5d63','#f3ad3e','#4bb8dc','#71c78b','#8974cf','#f184ad','#4fc3aa','#f08054','#719be0','#9c72c5'];
let mode = 'free', goal = 5, audioOn = true, audioContext, drag, longPress;

function speech(text) {
  if (!audioOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP'; utterance.rate = .8; utterance.pitch = 1.15;
  speechSynthesis.speak(utterance);
}

function tone(type='tap') {
  if (!audioOn) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const now = audioContext.currentTime;
  const notes = type === 'win' ? [523,659,784,1047] : type === 'merge' ? [330,523,784] : type === 'split' ? [650,440] : [520];
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = type === 'win' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.001, now + index * .07); gain.gain.exponentialRampToValueAtTime(.13, now + index * .07 + .015); gain.gain.exponentialRampToValueAtTime(.001, now + index * .07 + .18);
    oscillator.connect(gain).connect(audioContext.destination); oscillator.start(now + index * .07); oscillator.stop(now + index * .07 + .2);
  });
}

function createBlock(value, x, y, animate=false) {
  const block = document.createElement('button');
  block.className = `number-block${animate ? ' pulse' : ''}`; block.textContent = value; block.dataset.value = value;
  block.style.background = colors[(value - 1) % colors.length];
  block.style.left = `${Math.max(8, Math.min(x, playArea.clientWidth - 120))}px`; block.style.top = `${Math.max(8, Math.min(y, playArea.clientHeight - 120))}px`;
  block.addEventListener('pointerdown', startDrag); playArea.append(block); return block;
}

function startDrag(event) {
  const block = event.currentTarget, rect = block.getBoundingClientRect(), area = playArea.getBoundingClientRect();
  drag = { block, startX:event.clientX, startY:event.clientY, x:rect.left-area.left, y:rect.top-area.top, moved:false };
  block.setPointerCapture(event.pointerId); block.classList.add('dragging'); tone('tap');
  longPress = setTimeout(() => { if (!drag.moved) { block.releasePointerCapture(event.pointerId); drag=null; block.classList.remove('dragging'); openSplit(block); } }, 650);
  block.addEventListener('pointermove', moveDrag); block.addEventListener('pointerup', endDrag, {once:true}); block.addEventListener('pointercancel', endDrag, {once:true});
}
function moveDrag(event) {
  if (!drag) return; const dx=event.clientX-drag.startX, dy=event.clientY-drag.startY;
  if (Math.hypot(dx,dy)>8) { drag.moved=true; clearTimeout(longPress); }
  drag.block.style.left=`${Math.max(0,Math.min(drag.x+dx,playArea.clientWidth-drag.block.offsetWidth))}px`;
  drag.block.style.top=`${Math.max(0,Math.min(drag.y+dy,playArea.clientHeight-drag.block.offsetHeight))}px`;
}
function endDrag() {
  clearTimeout(longPress); if (!drag) return;
  const {block,moved}=drag; block.classList.remove('dragging'); block.removeEventListener('pointermove',moveDrag);
  if (!moved) { tone(); speech(numberName(+block.dataset.value)); drag=null; return; }
  const a=block.getBoundingClientRect();
  const target=[...document.querySelectorAll('.number-block')].find(other=>{ if(other===block)return false;const b=other.getBoundingClientRect();return Math.hypot(a.left+a.width/2-b.left-b.width/2,a.top+a.height/2-b.top-b.height/2)<75; });
  if(target) mergeBlocks(block,target); drag=null;
}
function mergeBlocks(first, second) {
  const sum=+first.dataset.value + +second.dataset.value, x=parseFloat(second.style.left), y=parseFloat(second.style.top);
  first.remove(); second.remove(); const made=createBlock(sum,x,y,true); tone('merge'); setTimeout(()=>speech(numberName(sum)),120);
  if(mode==='target' && sum===goal) celebrate(made);
}
function openSplit(block) {
  const value=+block.dataset.value; if(value<2){speech('いちは わけられないよ');return;}
  document.querySelector('#splitNumber').textContent=value; splitChoices.innerHTML='';
  for(let left=1;left<=Math.floor(value/2);left++){const button=document.createElement('button');button.type='button';button.className='split-choice';button.textContent=`${left}　と　${value-left}`;button.onclick=()=>splitBlock(block,left,value-left);splitChoices.append(button)}
  splitDialog.showModal(); speech(`${numberName(value)}を どう わける？`);
}
function splitBlock(block,left,right){const x=parseFloat(block.style.left),y=parseFloat(block.style.top);block.remove();splitDialog.close();createBlock(left,x-55,y,true);createBlock(right,x+70,y,true);tone('split');setTimeout(()=>speech(`${numberName(left)}、${numberName(right)}`),100)}
function numberName(n){return ['','いち','に','さん','よん','ご','ろく','なな','はち','きゅう','じゅう'][n] || String(n)}
function celebrate(block){tone('win');speech(`${numberName(goal)}、できた！`);instruction.textContent='できた！ すごい！';for(let i=0;i<55;i++){const c=document.createElement('i');c.className='confetti';c.style.left=`${Math.random()*100}%`;c.style.background=colors[i%colors.length];c.style.setProperty('--drift',`${Math.random()*180-90}px`);c.style.animationDelay=`${Math.random()*.35}s`;document.querySelector('#celebration').append(c)}const banner=document.createElement('div');banner.className='success-banner';banner.textContent='できた！ ★';document.querySelector('#celebration').append(banner);setTimeout(()=>document.querySelector('#celebration').replaceChildren(),2200);block.classList.add('pulse')}
function setupGame(selected){mode=selected;homeScreen.classList.remove('active');gameScreen.classList.add('active');gameScreen.classList.toggle('free',mode==='free');playArea.replaceChildren();instruction.textContent=mode==='free'?'ブロックを じゆうに うごかそう！':'ブロックを かさねてみよう！';if(mode==='target'){goal=[5,6,7,8][Math.floor(Math.random()*4)];goalNumber.textContent=goal;}const values=mode==='free'?[1,2,2,3,4]:goal===5?[1,2,3,4]:[1,2,3,4,5];requestAnimationFrame(()=>values.forEach((v,i)=>{const cols=window.innerWidth<600?2:values.length;const col=i%cols,row=Math.floor(i/cols);createBlock(v,45+col*((playArea.clientWidth-130)/Math.max(1,cols-1)),75+row*155,true)}));setTimeout(()=>speech(mode==='free'?'じゆうに あそぼう':`${numberName(goal)}を つくろう`),250)}
document.querySelectorAll('.mode-card').forEach(button=>button.onclick=()=>setupGame(button.dataset.mode));
document.querySelector('#backButton').onclick=()=>{gameScreen.classList.remove('active');homeScreen.classList.add('active');speech('どの あそびにする？')};
document.querySelector('#homeButton').onclick=()=>{gameScreen.classList.remove('active');homeScreen.classList.add('active')};
document.querySelector('#resetButton').onclick=()=>setupGame(mode);
document.querySelector('#soundButton').onclick=e=>{audioOn=!audioOn;e.currentTarget.textContent=audioOn?'♪':'×';e.currentTarget.setAttribute('aria-label',audioOn?'音を切る':'音をつける');if(audioOn){tone();speech('おとを つけたよ')}};
document.querySelector('#infoButton').onclick=()=>document.querySelector('#infoDialog').showModal();
