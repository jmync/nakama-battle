/* Animated background: drifting particles, floating music notes, glowing equalizer */
(function(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, DPR;
  const NOTE_GLYPHS = ['\u266A','\u266B','\u266C','\u2669'];
  let particles = [], notes = [], bars = [], icons = [];

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    init();
  }

  function rand(a,b){return a + Math.random()*(b-a);}

  function init(){
    const count = Math.round((innerWidth*innerHeight)/26000);
    particles = [];
    for(let i=0;i<count;i++){
      particles.push({
        x:Math.random()*W, y:Math.random()*H,
        r:rand(.6,2.4)*DPR, vy:rand(.08,.5)*DPR, vx:rand(-.15,.15)*DPR,
        a:rand(.15,.7), tw:rand(.005,.02), tp:Math.random()*Math.PI*2,
        c:Math.random()<.5?'255,77,109':(Math.random()<.5?'255,255,255':'255,86,48')
      });
    }
    const ncount = Math.round(innerWidth/130);
    notes = [];
    for(let i=0;i<ncount;i++){
      notes.push({
        x:Math.random()*W, y:Math.random()*H,
        s:rand(14,30)*DPR, vy:rand(.15,.5)*DPR, sway:rand(.3,1)*DPR,
        ph:Math.random()*Math.PI*2, a:rand(.06,.18),
        g:NOTE_GLYPHS[(Math.random()*NOTE_GLYPHS.length)|0],
        c:Math.random()<.5?'255,56,72':'255,255,255'
      });
    }
    const icount = Math.max(4, Math.round(innerWidth/300));
    icons = [];
    for(let i=0;i<icount;i++){
      icons.push({
        x:Math.random()*W, y:Math.random()*H,
        s:rand(20,42)*DPR, vy:rand(.12,.3)*DPR, sway:rand(.3,.9)*DPR,
        ph:Math.random()*Math.PI*2, a:rand(.06,.13), rot:rand(-.22,.22),
        type:Math.random()<.5?'phone':'phones',
        c:Math.random()<.5?'255,56,72':'255,255,255'
      });
    }
  }

  function rrect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function drawIcon(x,y,R,col,a,rot,type){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(rot);
    ctx.strokeStyle = `rgba(${col},${a})`;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if(type==='phone'){
      ctx.lineWidth = Math.max(1, R*0.12);
      const w=R*1.2, h=R*2.15, rr=R*0.3;
      rrect(-w/2,-h/2,w,h,rr); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R*0.2,-h/2+R*0.22); ctx.lineTo(R*0.2,-h/2+R*0.22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R*0.26,h/2-R*0.2); ctx.lineTo(R*0.26,h/2-R*0.2); ctx.stroke();
    } else {
      ctx.lineWidth = Math.max(1, R*0.13);
      ctx.beginPath(); ctx.arc(0,0,R,Math.PI,2*Math.PI); ctx.stroke();
      rrect(-R-R*0.16,-R*0.05,R*0.34,R*0.66,R*0.15); ctx.stroke();
      rrect( R-R*0.18,-R*0.05,R*0.34,R*0.66,R*0.15); ctx.stroke();
    }
    ctx.restore();
  }

  let t=0;
  function frame(){
    t += 0.016;
    ctx.clearRect(0,0,W,H);

    // floating phones & headphones (behind everything)
    for(const p of icons){
      p.y -= p.vy; p.ph += 0.006;
      const x = p.x + Math.sin(p.ph)*p.sway*10;
      if(p.y < -p.s*3){ p.y = H + p.s*3; p.x = Math.random()*W; }
      drawIcon(x, p.y, p.s, p.c, p.a, p.rot + Math.sin(p.ph)*0.05, p.type);
    }

    // particles
    for(const p of particles){
      p.y -= p.vy; p.x += p.vx;
      p.tp += p.tw;
      if(p.y < -10) {p.y = H+10; p.x=Math.random()*W;}
      if(p.x < -10) p.x = W+10; if(p.x>W+10) p.x=-10;
      const a = p.a * (0.6 + 0.4*Math.sin(p.tp));
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(${p.c},${a})`;
      ctx.shadowBlur = 8*DPR; ctx.shadowColor = `rgba(${p.c},${a})`;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // floating notes
    for(const n of notes){
      n.y -= n.vy; n.ph += 0.01;
      const x = n.x + Math.sin(n.ph)*n.sway*8;
      if(n.y < -40){n.y = H+40; n.x = Math.random()*W;}
      ctx.font = `${n.s}px "Zen Kaku Gothic New", sans-serif`;
      ctx.fillStyle = `rgba(${n.c},${n.a})`;
      ctx.fillText(n.g, x, n.y);
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, {passive:true});
  resize();
  requestAnimationFrame(frame);
})();
