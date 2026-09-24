(function(root){
  'use strict';
  const {M}=CaveSim;
  const rgb=(r,g,b)=>((255<<24)|(b<<16)|(g<<8)|r)>>>0;
  const allyPalette={'1':'#396b57','2':'#82cea0','3':'#e5ffca','4':'#254737'};
  const actorColor=a=>a.team?'#ffb784':a.pilot?'#9ce4a6':'#b5f1ec';
  const enemyPalette={'1':'#834840','2':'#e59067','3':'#fff0c1','4':'#4c2339'};
  const palettes={
    [M.ROCK]:[[40,47,59],[44,51,64],[47,54,66],[50,57,69],[54,61,72]],
    [M.SAND]:[[179,129,61],[203,157,77],[218,176,91],[234,197,115],[200,153,78]],
    [M.WATER]:[[34,90,143],[33,92,149],[34,101,156],[34,95,151],[39,110,166]],
    [M.MUD]:[[110,73,54],[119,81,57],[124,85,60],[130,90,62],[113,76,54]],
    [M.BASALT]:[[51,44,48],[60,49,50],[64,52,52],[69,55,53],[57,49,51]],
    [M.POWDER]:[[105,109,104],[121,124,109],[140,139,117],[99,108,105],[117,122,110]],
  };
  function hash(x,y){let v=Math.imul(x,374761393)+Math.imul(y,668265263);v=Math.imul(v^(v>>>13),1274126177);return(v^(v>>>16))>>>0;}
  class Renderer{
    constructor(world,screen,minimap){
      this.world=world;this.canvas=screen;this.ctx=screen.getContext('2d',{alpha:false});
      this.ctx.imageSmoothingEnabled=false;this.image=this.ctx.createImageData(320,200);this.pixels=new Uint32Array(this.image.data.buffer);
      this.light=new Uint8Array(64000);this.map=minimap;this.mapCtx=minimap.getContext('2d',{alpha:false});
      this.mapImage=this.mapCtx.createImageData(160,100);this.mapPixels=new Uint32Array(this.mapImage.data.buffer);
      this.mapColors=[rgb(10,16,23),rgb(47,56,67),rgb(217,175,99),rgb(37,113,170),rgb(123,83,57),rgb(250,107,37),rgb(112,140,153),rgb(137,140,122),rgb(255,204,96),rgb(69,71,72),rgb(83,57,52)];
      this.defaultMapColors=this.mapColors.slice();this.syncTheme();
    }
    syncTheme(){
      const theme=this.world.theme||null;if(theme===this.theme)return;
      this.theme=theme;this.palettes={...palettes,...theme?.palettes};
      this.sky=theme?.sky||[10,15,23];this.surface=theme?.surface||[83,166,199];
      this.mapColors=this.defaultMapColors.slice();this.mapColors[M.AIR]=rgb(...this.sky);
      for(const [kind,colors] of Object.entries(this.palettes))this.mapColors[kind]=rgb(...colors[2]);
      this.sourceColors={
        [M.SAND]:'rgb('+this.palettes[M.SAND][4].join(',')+')',
        [M.WATER]:'rgb('+this.surface.join(',')+')',[M.LAVA]:'#ffae5a',
      };
    }
    render(cx,cy,pointer,tool,radius,drone,combat){
      this.syncTheme();
      const w=this.world.width,c=this.world.cells,h=this.world.heat,life=this.world.life,t=this.world.tick,p=this.pixels,light=this.light;
      const theme=this.theme,colors=this.palettes,sky=this.sky;
      light.fill(0);
      // Light is computed on the same pixel grid as the simulation.
      for(let y=0;y<200;y+=3)for(let x=0;x<320;x+=3){
        const i=(cy+y)*w+cx+x;
        if(c[i]!==M.LAVA&&c[i]!==M.FIRE)continue;
        for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
          const xx=x+dx,yy=y+dy;
          if(xx<0||xx>=320||yy<0||yy>=200)continue;
          const strength=38-Math.abs(dx)*5-Math.abs(dy)*5;
          if(strength>light[yy*320+xx])light[yy*320+xx]=strength;
        }
      }
      for(let y=0;y<200;y++)for(let x=0;x<320;x++){
        const wx=cx+x,wy=cy+y,i=wy*w+wx,k=c[i],n=hash(wx,wy),idx=y*320+x;
        let r,g,b;
        if(k===M.AIR){
          const band=(Math.sin(wx/27+wy/31)+Math.sin(wx/61-wy/22))*1.3;
          r=sky[0]+band+(n%11===0?2:0);g=sky[1]+band;b=sky[2]+band*1.4;
        }else if(k===M.LAVA){
          const cool=Math.max(0,Math.min(1,(h[i]-480)/650)),flicker=(Math.sin((wy-t*.12)/4+wx/9)+1)/2;
          r=151+cool*103;g=41+cool*90+flicker*35;b=22+cool*15;
          if(c[i-w]!==M.LAVA&&cool>.55){r=255;g=171+flicker*49;b=63+flicker*19;}
          if(n%19===0&&cool>.8){r=255;g=191;b=77;}
          if(this.world.lavaFill[i]<48){r*=.87;g*=.8;b*=.8;}
        }else if(k===M.STEAM){const a=Math.min(1,life[i]/120);r=43+a*39;g=62+a*46;b=73+a*45;}
        else if(k===M.SMOKE){r=41+n%14;g=40+n%13;b=46+n%11;}
        else if(k===M.FIRE){r=247;g=94+hash(wx+t,wy)%135;b=30+hash(wx,wy+t)%67;}
        else{
          let palette=colors[k]||colors[M.ROCK],shade=0;
          if(k===M.ROCK&&theme){
            let vein=false;
            switch(theme.texture){
              case 'granite':vein=(wx+wy+Math.round(6*Math.sin(wy/23)))%47<3;shade=n%17===0?10:0;break;
              case 'sandstone':vein=(wy+Math.round(5*Math.sin(wx/35)))%26<5;break;
              case 'chalk':vein=(wy+Math.floor(wx/18))%37<2;shade=n%29===0?-15:0;break;
              case 'basalt':vein=(wx+Math.floor(wy/48)*3)%23<2;shade=(wx%23===7)?-9:0;break;
              case 'slate':vein=(wy+Math.floor(wx/8))%15<3;break;
              case 'crystal':vein=((Math.floor((wx+wy)/22)+Math.floor((wx-wy)/29))%4+4)%4===0;break;
              case 'gneiss':vein=(wy+Math.round(10*Math.sin(wx/31)))%18<4;break;
            }
            if(vein)palette=theme.vein;
          }
          [r,g,b]=palette[n%5];r+=shade;g+=shade;b+=shade;
          if(k===M.ROCK){
            const stratum=(wy+Math.round(5*Math.sin(wx/23)))%17;
            if(!theme&&stratum===0){r-=7;g-=7;b-=6;}
            if(c[i-w]===M.AIR){r+=27;g+=29;b+=29;}
            else if(c[i+w]===M.AIR){r-=13;g-=13;b-=13;}
            else if(c[i-1]===M.AIR){r+=9;g+=10;b+=11;}
          }else if(k===M.WATER){
            if(c[i-w]!==M.WATER){[r,g,b]=this.surface;}
            else if(c[i-w*3]===M.WATER){r-=6;g-=9;b-=6;}
          }else if(k===M.MUD&&c[i-w]!==M.MUD){r+=27;g+=24;b+=16;}
          else if(k===M.BASALT&&c[i-w]!==M.BASALT){r+=20;g+=10;b+=5;}
        }
        const glow=light[idx];
        if(glow&&k!==M.LAVA&&k!==M.FIRE){r+=glow;g+=glow*.37;b+=glow*.06;}
        p[idx]=rgb(Math.max(0,Math.min(255,r|0)),Math.max(0,Math.min(255,g|0)),Math.max(0,Math.min(255,b|0)));
      }
      this.ctx.putImageData(this.image,0,0);
      for(const e of this.world.effects){
        const r=Math.round(e.radius*(.5+e.age/24));
        this.ring(e.x-cx,e.y-cy,r,e.age<5?'#ffdfa0':'#b77242',true);
      }
      if(this.world.emitting)for(const s of this.world.sources){
        const x=s.x-cx,y=s.y-cy-4;
        this.ctx.fillStyle=this.sourceColors[s.material]||'#e8cb8c';
        this.ctx.fillRect(x-1,y,3,1);this.ctx.fillRect(x,y+1,1,1);
      }
      if(drone)this.drone(cx,cy,drone);
      if(combat){
        for(const actor of combat.active())if(actor!==drone)this.drone(cx,cy,actor);
        this.combat(cx,cy,combat);
      }
      if(pointer&&pointer.inside&&!pointer.panning){
        const x=pointer.x-cx,y=pointer.y-cy;
        this.ring(x,y,radius,tool===M.AIR?'#ef998e':'#e1e3c9',false);
        this.ctx.fillStyle='#f5eed6';this.ctx.fillRect(x,y,1,1);
      }
    }
    ring(x,y,r,color,dotted){
      const ctx=this.ctx;ctx.fillStyle=color;
      for(let dy=-r;dy<=r;dy++){
        if(dotted&&(dy+r)%2)continue;
        const dx=Math.round(Math.sqrt(r*r-dy*dy));ctx.fillRect(x-dx,y+dy,1,1);ctx.fillRect(x+dx,y+dy,1,1);
      }
      for(let dx=-r;dx<=r;dx++){
        if(dotted&&(dx+r)%2)continue;
        const dy=Math.round(Math.sqrt(r*r-dx*dx));ctx.fillRect(x+dx,y-dy,1,1);ctx.fillRect(x+dx,y+dy,1,1);
      }
    }
    drone(cx,cy,drone){
      if(drone.dead)return;
      const {SPRITE,PALETTE}=CaveFlight,ctx=this.ctx;
      const palette=drone.team?enemyPalette:drone.pilot?allyPalette:PALETTE;
      const cxp=Math.round(drone.x)-cx,cyp=Math.round(drone.y)-cy;
      const co=Math.cos(drone.angle),si=Math.sin(drone.angle);
      for(let y=-12;y<=12;y++)for(let x=-12;x<=12;x++) {
        const u=co*x+si*y,v=-si*x+co*y;
        if(drone.throttle&&u<-5&&u>-11-(this.world.tick%3)&&Math.abs(v)<1.8+(u+6)*.16) {
          ctx.fillStyle=u>-8?'#ffe5a3':'#ed8b48';ctx.fillRect(cxp+x,cyp+y,1,1);
        }
        const sx=Math.round(u+6),sy=Math.round(v+5);
        const key=SPRITE[sy]?.[sx];
        const color=palette[key];
        if(color){ctx.fillStyle=color;ctx.fillRect(cxp+x,cyp+y,1,1);}
      }
      if(drone.pilot&&!drone.team){ctx.fillStyle=actorColor(drone);ctx.fillRect(cxp-2,cyp-16,5,1);ctx.fillRect(cxp,cyp-18,1,5);}
      if(drone.health<100){
        ctx.fillStyle='#25353d';ctx.fillRect(cxp-6,cyp-12,12,2);
        ctx.fillStyle=actorColor(drone);ctx.fillRect(cxp-6,cyp-12,Math.ceil(drone.health*.12),2);
      }
      if(drone.gear?.shield){
        ctx.fillStyle='#b8f5ee';
        for(let a=-1.21;a<=1.21;a+=.07){const angle=drone.angle+a;ctx.fillRect(cxp+Math.round(Math.cos(angle)*10),cyp+Math.round(Math.sin(angle)*10),1,1);}
      }
    }
    combat(cx,cy,combat){
      const ctx=this.ctx;
      for(const p of combat.projectiles){
        const x=Math.round(p.x)-cx,y=Math.round(p.y)-cy;
        if(p.kind==='pulse'){
          const length=Math.hypot(p.vx,p.vy)||1;
          ctx.fillStyle=p.owner.team?'#ffc383':'#bff7f1';
          for(let n=0;n<4;n++)ctx.fillRect(x-Math.round(p.vx/length*n),y-Math.round(p.vy/length*n),1,1);
        }else if(p.kind==='grenade'){
          ctx.fillStyle='#131922';ctx.fillRect(x-2,y-2,5,5);
          ctx.fillStyle=Math.floor(p.age/(p.life<.4?.05:.15))%2?'#ffcb6c':'#e76c51';ctx.fillRect(x-1,y-1,3,3);
        }else {ctx.fillStyle=this.sourceColors[M.WATER];ctx.fillRect(x,y,2,2);}
      }
      for(const e of combat.effects){
        const x=Math.round(e.x)-cx,y=Math.round(e.y)-cy;
        this.ring(x,y,Math.round(e.kind==='blink'?5+(1-e.life/e.max)*11:e.kind==='shield'?11:2),e.kind==='hit'?'#ffe4a3':'#a1e8eb',e.kind==='blink');
      }
      for(const actor of combat.active())if(actor!==combat.player&&!actor.dead&&
          (actor.x<cx+8||actor.x>cx+312||actor.y<cy+8||actor.y>cy+192)){
        const dx=actor.x-cx-160,dy=actor.y-cy-100,f=1/Math.max(Math.abs(dx)/151,Math.abs(dy)/91);
        const x=Math.round(160+dx*f),y=Math.round(100+dy*f);
        ctx.fillStyle=actorColor(actor);
        if(actor.team){ctx.fillRect(x-2,y-2,5,5);ctx.fillStyle='#572b28';ctx.fillRect(x-1,y-1,3,3);}
        else{ctx.fillRect(x-2,y,5,1);ctx.fillRect(x,y-2,1,5);}
      }
      if(!combat.result&&!combat.player.dead&&combat.player.gear.blink===0){
        const target=combat.blinkTarget(combat.player);
        if(target){
          const x=Math.round(target.x)-cx,y=Math.round(target.y)-cy;
          ctx.fillStyle='#50868c';ctx.fillRect(x-3,y,2,1);ctx.fillRect(x+2,y,2,1);ctx.fillRect(x,y-3,1,2);ctx.fillRect(x,y+2,1,2);
        }
      }
    }
    minimap(cx,cy,drone,combat){
      this.syncTheme();
      const c=this.world.cells,w=this.world.width;
      for(let y=0;y<100;y++)for(let x=0;x<160;x++)this.mapPixels[y*160+x]=this.mapColors[c[y*4*w+x*4]];
      this.mapCtx.putImageData(this.mapImage,0,0);
      this.mapCtx.strokeStyle='#f1d598';this.mapCtx.lineWidth=1;
      this.mapCtx.strokeRect(Math.floor(cx/4)+.5,Math.floor(cy/4)+.5,79,49);
      if(drone&&!drone.dead){this.mapCtx.fillStyle='#b5f1ec';this.mapCtx.fillRect(Math.round(drone.x/4)-1,Math.round(drone.y/4)-1,3,3);}
      if(combat)for(const actor of combat.active())if(actor!==drone&&!actor.dead){
        const x=Math.round(actor.x/4),y=Math.round(actor.y/4);this.mapCtx.fillStyle=actorColor(actor);
        if(actor.team){this.mapCtx.fillRect(x-2,y-2,5,5);this.mapCtx.fillStyle='#572b28';this.mapCtx.fillRect(x-1,y-1,3,3);}
        else{this.mapCtx.fillRect(x-2,y,5,1);this.mapCtx.fillRect(x,y-2,1,5);}
      }
    }
  }
  root.CaveRenderer=Renderer;
})(globalThis);
