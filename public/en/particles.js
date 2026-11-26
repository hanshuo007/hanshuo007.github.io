(() => {
  const field=document.querySelector('#particle-field'),world=document.querySelector('#world');
  const ctx=field.getContext('2d');
  if(!ctx)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let seed=1705;
  function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
  const grains=Array.from({length:310},()=>({
    angle:random()*Math.PI*2,depth:random(),radius:.13+random()*.9,
    speed:.55+random()*.64,light:random(),phase:random()*Math.PI*2
  }));
  let w=1,h=1,last=0,time=0,distance=0,id=0,x=.5,y=.5,px=.5,py=.5,strength=0,active=false;
  function pointer(event){x=event.clientX/w;y=event.clientY/h;active=true;}
  function release(){active=false;}
  window.addEventListener('pointermove',pointer,{passive:true});
  document.documentElement.addEventListener('pointerleave',release);
  window.addEventListener('pointerup',e=>{if(e.pointerType==='touch')release();});
  window.addEventListener('pointercancel',release);
  function smooth(a,b,t){const v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v);}
  function draw(now){
    id=0;
    if(document.hidden)return;
    const dt=last?Math.min(.08,(now-last)/1000):0;last=now;
    const reduced=motion.matches;
    if(!reduced)time+=dt;
    const pos=Number(world.dataset.position)||0;
    const flight=smooth(2.73,3,pos)*(1-smooth(3.915,4,pos));
    if(!reduced)distance+=dt*(.026+.125*flight);
    const orbit=world.classList.contains('live')?0:smooth(1.73,2,pos)*(1-smooth(2.73,3,pos));
    const eased=1-Math.exp(-8*dt);
    px+=(x-px)*eased;py+=(y-py)*eased;strength+=((active&&!reduced?1:0)-strength)*eased;
    const span=Math.min(w,h),cx=w*(.50-.10*flight),cy=h*.5;
    const zoom=.5+.48*flight;
    ctx.clearRect(0,0,w,h);
    for(const g of grains){
      const travel=g.depth-distance*g.speed;
      const z=.03+travel-Math.floor(travel);
      const depth=.20+z;
      const edge=smooth(.03,.18,z)*(1-smooth(.81,1.03,z));
      const angle=g.angle+.045*Math.sin(time*.35+g.phase);
      let dx=Math.cos(angle)*span*g.radius*zoom/depth,dy=Math.sin(angle)*span*g.radius*zoom/depth;
      if(orbit){
        const a=g.angle+time*.22+pos;
        dx+=(Math.cos(a)*span*(.20+.09*g.radius)-dx)*orbit;
        dy+=((Math.sin(a)*.13+Math.sin(a*2+g.phase*.14)*.05)*span-dy)*orbit;
      }
      let sx=cx+dx,sy=cy+dy;
      const mx=sx-px*w,my=sy-py*h,dist=Math.hypot(mx,my);
      const push=(1-smooth(0,span*.16,dist))*strength*span*.036;
      sx+=mx/(dist+1)*push;sy+=my/(dist+1)*push;
      if(sx<-10||sy<-10||sx>w+10||sy>h+10)continue;
      const alpha=edge*(.15+.6*g.light)*(.60+.4*flight);
      const r=Math.min(2.45,(.32+.42*g.light)/depth);
      ctx.fillStyle='rgba(203,239,246,'+alpha+')';
      ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();
      if(flight>.02){
        const tail=Math.min(.09,.011/depth)*flight;
        ctx.strokeStyle='rgba(141,211,229,'+alpha*.67*flight+')';
        ctx.lineWidth=r;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-dx*tail,sy-dy*tail);ctx.stroke();
      }
    }
    if(!reduced)id=requestAnimationFrame(draw);
  }
  function queue(){if(!id&&!document.hidden)id=requestAnimationFrame(draw);}
  function resize(){
    w=Math.max(1,field.clientWidth);h=Math.max(1,field.clientHeight);
    const ratio=Math.min(devicePixelRatio||1,1.75);
    field.width=Math.round(w*ratio);field.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    queue();
  }
  window.addEventListener('resize',resize);window.addEventListener('scroll',()=>{if(motion.matches)queue();},{passive:true});
  motion.addEventListener('change',queue);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(id);id=last=0;queue();});
  resize();
})();
