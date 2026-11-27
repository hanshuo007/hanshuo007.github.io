const chapters = [...document.querySelectorAll('.chapter')];
const rail = [...document.querySelectorAll('.rail a')];
const world = document.querySelector('#world');
const nextStop = document.querySelector('#continue');
const menu = document.querySelector('#menu');
const openMenu = document.querySelector('#menu-button');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const limit = (value, low, high) => Math.max(low, Math.min(high, value));
function ramp(start, end, value) {
  const t = limit((value-start)/(end-start),0,1);
  return t*t*(3-2*t);
}
const scenes = chapters.map((chapter, index) => {
  const pin = document.createElement('div');
  pin.className = 'chapter-pin';
  pin.append(...chapter.querySelectorAll(':scope > .cover, :scope > .brief, :scope > .deck'));
  chapter.append(pin);
  const [cover,brief,deck]=pin.children;
  const title=cover.firstElementChild;
  const over=title.querySelector('.over');
  const rest=[...title.childNodes].filter(node=>node!==over);
  const lines=[over.textContent];
  let line='';
  for(const node of rest){
    if(node.nodeName==='BR'){lines.push(line);line='';}
    else line+=node.textContent;
  }
  if(line)lines.push(line);
  title.setAttribute('aria-label',lines.join(' '));
  title.replaceChildren(...lines.map((text,i)=>{
    const mask=document.createElement('span'), word=document.createElement('span');
    mask.className='headline-line'+(i===0?' over':'');
    mask.setAttribute('aria-hidden','true');
    word.textContent=text;word.style.setProperty('--order',i);
    mask.append(word);return mask;
  }));
  const indicator=rail[index];
  return {pin,cover,brief,deck,indicator};
});
document.documentElement.classList.add('story-ready');

const count=chapters.length;
const flightChapter=count-1;
const flightExit=.915;
const wrap=(value,period)=>((value%period)+period)%period;
let tops,lengths,cycle,goal=0,playhead=0,frame=0,last=0,recenterTimer=0;
function measure(){
  const bounds=chapters.map(ch=>ch.getBoundingClientRect());
  tops=bounds.map(r=>r.top+scrollY);
  cycle=tops[count-1]+bounds[count-1].height;
  lengths=tops.map((top,i)=>(tops[i+1]??cycle)-top);
}
function position(){
  const y=Math.max(0,scrollY);
  const lap=Math.floor(y/cycle);
  const offset=y-lap*cycle;
  const i=lengths.findIndex((length,n)=>offset<tops[n]+length);
  return lap*count+i+(offset-tops[i])/lengths[i];
}
function recenter(){
  const laps=Math.floor(Math.max(0,scrollY)/cycle);
  if(!laps)return;
  // Keep the camera's easing error and the wheel/touch overshoot across the seam.
  playhead-=laps*count;goal-=laps*count;
  window.scrollTo({top:scrollY-laps*cycle,behavior:'instant'});
}
function setLayer(el,alpha,shift){
  el.style.setProperty('--alpha',alpha.toFixed(3));
  el.style.setProperty('--shift',shift.toFixed(2)+'px');
  const interactive=alpha>.48;
  if(el.inert===interactive)el.inert=!interactive;
  el.style.visibility=alpha>.001?'visible':'hidden';
}
const soundtrack=createSoundtrack(document.querySelector('#mute-music'));
function paint(){
  const wrapped=wrap(playhead,count), i=Math.floor(wrapped), p=wrapped-i;
  const incoming=(i+1)%count;
  const exit=i===flightChapter?flightExit:.73;
  const blend=ramp(exit,1,p);
  soundtrack.transition(i,blend);
  const dominant=blend>.55?incoming:i;
  world.dataset.position=String(wrapped);
  world.dataset.chapter=i;
  world.style.setProperty('--next-scene', 'url(assets/scene-'+incoming+'.webp)');
  world.style.setProperty('--blend',blend);
  for(const [n,s] of scenes.entries()){
    const visible=n===i||(n===incoming&&p>exit+.40*(1-exit));
    s.indicator.setAttribute('aria-current',String(n===dominant));
    s.indicator.style.setProperty('--fill',(n<i?1:n===i?p:0).toFixed(3));
    s.pin.hidden=!visible;
    if(!visible)continue;
    const t=n===i?p*(i===flightChapter?1.5:1):(p-1)*(.27/(1-exit));
    const enter=ramp(-.155,-.006,t);
    const leave=ramp(.105,.265,t);
    const titleAlpha=enter*(1-leave);
    setLayer(s.cover,titleAlpha,0);
    s.cover.style.setProperty('--enter',(1-enter).toFixed(3));
    s.cover.style.setProperty('--leave',leave.toFixed(3));
    const briefIn=ramp(.15,.30,t),briefOut=ramp(.43,.575,t);
    setLayer(s.brief,briefIn*(1-briefOut),motion.matches?0:44*(1-briefIn)-34*briefOut);
    const deckIn=ramp(.475,.615,t),deckOut=ramp(.765,.87,t);
    setLayer(s.deck,deckIn*(1-deckOut),motion.matches?0:48*(1-deckIn)-32*deckOut);
  }
}
function tick(now){
  const dt=last?Math.min(.1,(now-last)/1000):1/60; last=now;
  const distance=goal-playhead;
  playhead+=distance*(motion.matches?1:1-Math.exp(-12*dt));
  if(Math.abs(goal-playhead)<.00015)playhead=goal;
  paint();
  if(playhead!==goal)frame=requestAnimationFrame(tick);
  else {frame=0;last=0;}
}
function onScroll(){
  goal=position();
  clearTimeout(recenterTimer);
  if(scrollY>=cycle){
    const headroom=document.documentElement.scrollHeight-document.documentElement.clientHeight-scrollY;
    if(headroom<innerHeight*.3)recenter();
    else recenterTimer=setTimeout(recenter,220);
  }
  if(!frame)frame=requestAnimationFrame(tick);
}
function onResize(){measure();onScroll();}
measure();playhead=goal=position();paint();
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',onResize);
addEventListener('pageshow',onResize);
motion.addEventListener('change',onScroll);
nextStop.addEventListener('click',()=>{
  const distance=position(), lap=Math.floor(distance/count), here=wrap(distance,count);
  const stops=chapters.flatMap((_,i)=>i===flightChapter?[i,i+.35/1.5,i+.68/1.5,i+.76]:[i,i+.35,i+.68]);
  const dest=stops.find(value=>value>here+.012)??count;
  const chapter=Math.floor(dest)%count;
  const target=(lap+Number(dest===count))*cycle+tops[chapter]+(dest%1)*lengths[chapter];
  window.scrollTo({top:target,behavior:motion.matches?'instant':'smooth'});
});
openMenu.onclick=()=>{
  menu.showModal();openMenu.setAttribute('aria-expanded','true');
  document.body.style.overflow='hidden';
};
document.querySelector('#close-menu').onclick=()=>menu.close();
menu.addEventListener('close',()=>{
  document.body.style.overflow='';openMenu.setAttribute('aria-expanded','false');onResize();
});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
for(const deck of document.querySelectorAll('.deck')){
  const track=deck.querySelector('.track'),cards=[...track.children],count=deck.querySelector('.count');
  let selected=0, start=null, blockClick=false;
  function select(next,dir){
    if(next<0)next=cards.length-1;
    if(next>=cards.length)next=0;
    const old=selected;
    selected=next;
    cards.forEach((card,n)=>{
      card.inert=n!==selected;
      card.classList.toggle('current',n===selected);
      if(!dir||motion.matches||!card.animate||n!==old&&n!==next)return;
      card.getAnimations().forEach(animation=>animation.cancel());
      const vertical=deck.closest('#home')&&innerWidth>700;
      const transform=distance=>'translate'+(vertical?'Y':'X')+'('+distance+'%)';
      const entering=n===next;
      card.animate(entering?
        [{opacity:0,transform:transform(dir*13)},{opacity:1,transform:transform(0)}]:
        [{opacity:1,transform:transform(0)},{opacity:0,transform:transform(-dir*9)}],
        {duration:entering?490:290,easing:'cubic-bezier(.2,.7,.2,1)'});
    });
    count.textContent=String(selected+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
  }
  select(0,0);
  function step(dir){select(selected+dir,dir);}
  deck.querySelector('.previous').onclick=()=>step(-1);
  deck.querySelector('.next').onclick=()=>step(1);
  deck.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}
  });
  track.addEventListener('pointerdown',e=>{blockClick=false;start=[e.clientX,e.clientY];});
  track.addEventListener('pointercancel',()=>{start=null;});
  track.addEventListener('pointerup',e=>{
    if(!start)return;
    const dx=e.clientX-start[0],dy=e.clientY-start[1];start=null;
    if(Math.abs(dx)>45&&Math.abs(dx)>1.4*Math.abs(dy)){blockClick=true;step(dx<0?1:-1);}
  });
  track.addEventListener('click',e=>{if(blockClick){e.preventDefault();blockClick=false;}},true);
}
function createSoundtrack(button){
  const Context=window.AudioContext||window.webkitAudioContext;
  const buffers=new Map();
  if(!Context){button.hidden=true;return {transition(){}};}
  let context,session,music,effect,muted=false,pageAway=false,generation=0,lastBoundary=-1,cents=0;
  const wanted=()=>!muted&&!pageAway&&!document.hidden;
  function load(name){
    if(!buffers.has(name)){
      const pending=fetch('assets/sounds/'+name+'.mp3')
        .then(response=>{if(!response.ok)throw Error('Audio unavailable');return response.arrayBuffer();})
        .then(data=>context.decodeAudioData(data))
        .catch(error=>{buffers.delete(name);throw error;});
      buffers.set(name,pending);
    }
    return buffers.get(name);
  }
  function pause(){
    generation++;
    if(effect){effect.stop();effect=null;}
    if(context&&context.state==='running')context.suspend().catch(()=>{});
  }
  async function playMusic(){
    if(music||!wanted()||context.state!=='running')return;
    const stamp=generation;
    const buffer=await load('music');
    if(music||!wanted()||stamp!==generation||context.state!=='running')return;
    session=context.createGain();session.connect(context.destination);
    session.gain.setValueAtTime(0,context.currentTime);
    session.gain.linearRampToValueAtTime(.72,context.currentTime+.65);
    music=context.createBufferSource();music.buffer=buffer;music.loop=true;
    music.detune.value=cents;music.connect(session);music.start();
    load('fx').catch(()=>{});
  }
  function start(){
    if(!wanted())return;
    try{
      if(!context){
        context=new Context();
        context.onstatechange=()=>{
          if(context.state!=='running')return;
          if(wanted())playMusic().catch(()=>{});else pause();
        };
      }
      if(context.state==='running')playMusic().catch(()=>{});
      else context.resume().catch(()=>{});
    }catch{/* Retry on the next activation when audio is available. */}
  }
  function transition(chapter,blend){
    cents=-1200*(1-Math.abs(1-2*blend));
    if(music)music.detune.setTargetAtTime(cents,context.currentTime,.045);
    if(blend<=.002||blend>=.998){lastBoundary=-1;return;}
    if(blend<.025||blend>.975||lastBoundary===chapter)return;
    lastBoundary=chapter;
    if(!music||!wanted()||context.state!=='running')return;
    const stamp=generation;
    load('fx').then(buffer=>{
      if(stamp!==generation||!wanted()||context.state!=='running'||lastBoundary!==chapter)return;
      if(effect)effect.stop();
      const node=context.createBufferSource();node.buffer=buffer;node.connect(session);effect=node;
      node.onended=()=>{node.disconnect();if(effect===node)effect=null;};
      node.start();
    }).catch(()=>{});
  }
  button.onclick=()=>{
    muted=!muted;button.textContent=muted?'Unmute sound':'Mute sound';
    if(muted)pause();else start();
  };
  // resume() may stay pending until a trusted input. Call it within that input too.
  for(const event of ['pointerdown','pointerup','click','keydown']){
    window.addEventListener(event,start,{capture:true,passive:true});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else start();});
  window.addEventListener('pagehide',()=>{pageAway=true;pause();});
  window.addEventListener('pageshow',()=>{pageAway=false;start();});
  start();
  return {transition};
}
