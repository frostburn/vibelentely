(function(root){
  'use strict';
  const {M}=root.CaveSim,Tools=root.CaveTools;
  const solid=k=>k===M.ROCK||k===M.HARDROCK||k===M.BASALT||k===M.SAND||k===M.MUD||k===M.POWDER;
  function equipment(){return {heat:0,overheated:false,pulse:0,grenades:3,reload:0,grenade:0,water:100,jet:0,energy:100,shield:false,shieldLock:0,blink:0,blinkHeld:false};}
  class Combat {
    constructor(world,player){
      this.world=world;this.player=player;player.team=0;player.name='Sinä';
      this.projectiles=[];this.effects=[];this.enabled=true;this.score=[0,0];this.terrainCharges=false;
      this.setRoster(0,1);this.reset();
    }
    get enemy(){return this.actors.find(a=>a.team===1);}
    get ai(){return this.enemy?.pilot;}
    setRoster(allies,enemies){
      this.actors=[this.player];
      // Give each pilot its own observation, route and staggered planning clock.
      for(let i=0;i<enemies;i++){
        const actor=new root.CaveFlight.Drone(this.world,{team:1});
        actor.name='Vihollinen '+(i+1);actor.slot=i;
        actor.pilot=new root.CaveAI.Pilot(this,actor,i);this.actors.push(actor);
      }
      for(let i=0;i<allies;i++){
        const actor=new root.CaveFlight.Drone(this.world,{team:0});
        actor.name=allies===1?'Siipi':'Siipi '+(i+1);actor.slot=i+1;
        actor.pilot=new root.CaveAI.Pilot(this,actor,enemies+i);this.actors.push(actor);
      }
    }
    reset(clearScore=false){
      const w=this.world,occupied=[];
      for(const actor of this.actors){
        const base=actor.team?(w.enemySpawn||{x:w.spawn.x+110,y:w.spawn.y-15}):w.spawn;
        actor.spawn=w.teamSpawns?.[actor.team]?.[actor.slot||0]||
          {x:base.x+(actor.slot||0)*(actor.team?24:-24),y:base.y};
        actor.respawn(occupied);actor.gear={...equipment(),...Tools.equipment()};actor.loadout??=['grenade','water'];actor.pilot?.reset();
        if(!actor.dead)occupied.push(actor);
      }
      this.projectiles.length=0;this.effects.length=0;this.time=0;this.result=null;this.started=false;
      this.seenBlasts=new WeakSet(this.world.effects);
      if(clearScore)this.score=[0,0];
    }
    setOpponent(value){
      this.enabled=value;this.projectiles=this.projectiles.filter(p=>p.owner===this.player);
      if(value)for(const actor of this.actors)if(actor!==this.player){
        actor.respawn(this.actors.filter(a=>a!==actor&&!a.dead));actor.gear={...equipment(),...Tools.equipment()};actor.pilot.reset();
      }
    }
    active(){return this.enabled?this.actors:[this.player];}
    living(team){return this.active().filter(a=>a.team===team&&!a.dead);}
    finish(result){
      if(this.result)return;
      this.result=result;
      if(this.enabled&&result!=='draw')this.score[result==='won'?0:1]++;
      for(const actor of this.actors){actor.throttle=0;actor.gear.shield=false;Tools.cancel(actor);}
    }
    resolve(){
      const ours=this.living(0).length,theirs=this.enabled?this.living(1).length:1;
      if(!ours||!theirs)this.finish(!ours?(!theirs?'draw':'lost'):'won');
    }
    cell(x,y){
      const w=this.world;
      if(x<1||y<1||x>=w.width-1||y>=w.height-1)return M.ROCK;
      return w.cells[Math.floor(y)*w.width+Math.floor(x)];
    }
    sight(ax,ay,bx,by){
      const n=Math.ceil(Math.hypot(bx-ax,by-ay));
      for(let i=1;i<n;i++)if(solid(this.cell(ax+(bx-ax)*i/n,ay+(by-ay)*i/n)))return false;
      return true;
    }
    blinkTarget(actor){
      const co=Math.cos(actor.angle),si=Math.sin(actor.angle),w=this.world;
      for(let d=54;d>=18;d--){
        const x=actor.x+co*d,y=actor.y+si*d;
        if(actor.collides(x,y,false))continue;
        if(this.active().some(other=>other!==actor&&!other.dead&&Math.hypot(other.x-x,other.y-y)<actor.radius+other.radius+2))continue;
        let hot=false;
        for(let yy=-6;yy<=6&&!hot;yy++)for(let xx=-6;xx<=6;xx++)if(xx*xx+yy*yy<40){
          const k=w.cells[Math.floor(y+yy)*w.width+Math.floor(x+xx)];
          if(k===M.LAVA||k===M.FIRE){hot=true;break;}
        }
        if(!hot)return {x,y};
      }
      return null;
    }
    blink(actor){
      if(actor.dead||actor.gear.blink>0)return false;
      const target=this.blinkTarget(actor);
      if(!target)return false;
      this.effects.push({kind:'blink',x:actor.x,y:actor.y,life:.35,max:.35},{kind:'blink',...target,life:.35,max:.35});
      actor.x=target.x;actor.y=target.y;actor.gear.blink=4;return true;
    }
    prepare(actor,input,dt){
      const g=actor.gear;
      Tools.tick(actor,dt);
      for(const key of ['pulse','grenade','jet','shieldLock','blink'])g[key]=Math.max(0,g[key]-dt);
      g.heat=Math.max(0,g.heat-dt*.3);if(g.heat<.28)g.overheated=false;
      if(g.grenades<3){g.reload+=dt;if(g.reload>=4){g.reload-=4;g.grenades++;}}else g.reload=0;
      if(actor.medium().wet>0)g.water=Math.min(100,g.water+dt*75);
      g.shield=!!input.shield&&g.energy>0&&!g.shieldLock&&!actor.dead;
      if(g.shield){g.energy=Math.max(0,g.energy-25*dt);if(!g.energy){g.shield=false;g.shieldLock=1.5;}}
      else if(!g.shieldLock)g.energy=Math.min(100,g.energy+22*dt);
      if(input.blink&&!g.blinkHeld)this.blink(actor);
      g.blinkHeld=!!input.blink;
    }
    guard(actor,x,y,cost){
      const g=actor.gear,dx=x-actor.x,dy=y-actor.y,d=Math.hypot(dx,dy)||1;
      if(!g.shield||(dx*Math.cos(actor.angle)+dy*Math.sin(actor.angle))/d<.35)return false;
      g.energy=Math.max(0,g.energy-cost);
      if(!g.energy){g.shield=false;g.shieldLock=1.5;}
      this.effects.push({kind:'shield',x:actor.x,y:actor.y,life:.14,max:.14});return true;
    }
    shoot(actor,kind){
      const g=actor.gear;if(actor.dead||g.shield)return false;
      if(kind==='pulse'&&(g.pulse||g.overheated))return false;
      if(kind==='grenade'&&(g.grenade||!g.grenades))return false;
      if(kind==='water'&&(g.jet||g.water<1.5))return false;
      if(kind==='mud'&&(g.mudCooldown||!g.mudAmmo))return false;
      if(kind==='blaster'&&(g.charge!==1||g.blasterHot||g.blasterCooldown))return false;
      const co=Math.cos(actor.angle),si=Math.sin(actor.angle);
      const speed=kind==='blaster'?430:kind==='pulse'?230:kind==='grenade'||kind==='mud'?95:155;
      this.projectiles.push({kind,owner:actor,x:actor.x+co*5,y:actor.y+si*5,
        vx:actor.vx+co*speed,vy:actor.vy+si*speed,life:kind==='grenade'?1.4:kind==='mud'?1.1:kind==='water'?.6:1.5,age:0,
        sticky:kind==='grenade'&&this.terrainCharges});
      if(kind==='pulse'){g.pulse=.13;g.heat=Math.min(1,g.heat+.17);if(g.heat>=.99)g.overheated=true;}
      if(kind==='grenade'){g.grenade=.65;g.grenades--;actor.vx-=co*7;actor.vy-=si*7;}
      if(kind==='water'){g.jet=.055;g.water-=1.5;actor.vx-=co*1.8;actor.vy-=si*1.8;}
      if(kind==='mud'){g.mudCooldown=.65;g.mudAmmo--;actor.vx-=co*5;actor.vy-=si*5;}
      if(kind==='blaster'){g.charge=0;g.blasterCooldown=.6;g.blasterHeat=Math.min(1,g.blasterHeat+.5);g.blasterHot=g.blasterHeat>=1;actor.vx-=co*26;actor.vy-=si*26;}
      return true;
    }
    waterImpact(p,x=p.x,y=p.y){
      const w=this.world,len=Math.hypot(p.vx,p.vy)||1,dx=Math.round(p.vx/len),dy=Math.round(p.vy/len);
      x=Math.round(x);y=Math.round(y);
      // Pressure moves actual grains along open paths, preserving their state and mass.
      for(let yy=y-4;yy<=y+4;yy++)for(let xx=x-4;xx<=x+4;xx++){
        if(xx<2||yy<2||xx>=w.width-2||yy>=w.height-2||(xx-x)**2+(yy-y)**2>16)continue;
        const i=yy*w.width+xx,k=w.cells[i];
        if(k===M.LAVA){
          w.heat[i]-=260;
          if(w.heat[i]<480){w.cells[i]=M.BASALT;w.lavaFlux[i]=0;}
        }else if(k===M.FIRE)w.set(i,M.STEAM);
        else if(k===M.SAND||k===M.POWDER||k===M.MUD){
          let dest=i;
          for(let n=1;n<=3;n++){
            const tx=xx+dx*n,ty=yy+dy*n,j=ty*w.width+tx;
            if(tx<2||ty<2||tx>=w.width-2||ty>=w.height-2||(!w.isGas(j)&&w.cells[j]!==M.WATER))break;
            dest=j;
          }
          if(dest!==i)w.swap(i,dest);
        }
      }
      w.brush(x,y,1,M.WATER);
    }
    detonate(p){const blast=this.world.explode(Math.round(p.x),Math.round(p.y),p.kind==='blaster'?30:19);blast.owner=p.owner;if(p.kind==='blaster')blast.power=125;}
    projectileStep(p,dt){
      p.life-=dt;p.age+=dt;
      if(p.life<=0){if(p.kind==='grenade'||p.kind==='blaster')this.detonate(p);else if(p.kind==='water')this.waterImpact(p);else if(p.kind==='mud')Tools.mudBurst(this,p);return false;}
      if(p.stuck)return true;
      if(p.kind!=='pulse'&&p.kind!=='blaster')p.vy+=dt*70;
      if(this.cell(p.x,p.y)===M.WATER){const drag=Math.exp(-dt*(p.kind==='grenade'?3:1));p.vx*=drag;p.vy*=drag;}
      const steps=Math.max(1,Math.ceil(Math.hypot(p.vx,p.vy)*dt/.45));
      for(let n=0;n<steps;n++){
        const ox=p.x,oy=p.y,nx=ox+p.vx*dt/steps,ny=oy+p.vy*dt/steps,k=this.cell(nx,ny);
        const hitTerrain=solid(k)||(p.kind==='water'&&(k===M.LAVA||k===M.FIRE))||(p.kind==='mud'&&(k===M.WATER||k===M.LAVA));
        if(hitTerrain){
          if(p.kind==='blaster'){this.detonate(p);return false;}
          if(p.kind==='mud'){Tools.mudBurst(this,{...p,x:ox,y:oy});return false;}
          if(p.kind==='grenade'){
            // Solo demolition charges attach at the swept contact point; the
            // original fuse keeps running. Duel grenades retain their bounce.
            if(p.sticky){p.stuck=true;p.vx=p.vy=0;return true;}
            const hitX=solid(this.cell(nx,oy)),hitY=solid(this.cell(ox,ny));
            if(hitX||!hitY)p.vx*=-.58;if(hitY)p.vy*=-.58;
            if(Math.abs(p.vy)<3&&hitY)p.vy=0;
            break;
          }
          if(p.kind==='water')this.waterImpact(p,ox,oy);
          else {
            const w=this.world,x=Math.floor(nx),y=Math.floor(ny);
            for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++){
              if(xx<2||yy<2||xx>=w.width-2||yy>=w.height-2||(xx-x)**2+(yy-y)**2>4)continue;
              const i=yy*w.width+xx,mat=w.cells[i];
              if(mat===M.POWDER){w.blasts.push(i);w.set(i,M.FIRE);}
              else if(mat===M.SAND||mat===M.MUD)w.set(i,M.AIR);
            }
            this.effects.push({kind:'hit',x:ox,y:oy,life:.1,max:.1});
          }
          return false;
        }
        p.x=nx;p.y=ny;
        for(const actor of this.active()){
          if(actor.dead||(actor!==p.owner&&actor.team===p.owner.team)||(actor===p.owner&&(p.kind!=='grenade'||p.age<.2)))continue;
          const r=actor.radius+(actor.gear.shield?3:0);
          if(Math.hypot(actor.x-p.x,actor.y-p.y)>r)continue;
          if(this.guard(actor,p.x,p.y,p.kind==='blaster'?65:p.kind==='pulse'?12:p.kind==='grenade'?30:3)){
            if(p.kind!=='grenade')return false;
            const co=Math.cos(actor.angle),si=Math.sin(actor.angle),v=Math.max(65,Math.hypot(p.vx,p.vy));
            p.vx=co*v+actor.vx;p.vy=si*v+actor.vy;p.x=actor.x+co*(r+2);p.y=actor.y+si*(r+2);break;
          }
          if(Math.hypot(actor.x-p.x,actor.y-p.y)>actor.radius)continue;
          if(p.kind==='grenade'||p.kind==='blaster'){this.detonate(p);return false;}
          if(p.kind==='mud'){Tools.mudBurst(this,p);return false;}
          if(p.kind==='pulse')actor.damage(9);
          else {const len=Math.hypot(p.vx,p.vy)||1;actor.vx+=p.vx/len*14;actor.vy+=p.vy/len*14;this.waterImpact(p);}
          return false;
        }
      }
      return true;
    }
    blasts(){
      // Includes powder chains, editor blasts and drone deaths. Each blast damages once.
      for(const e of this.world.effects){
        if(this.seenBlasts.has(e))continue;this.seenBlasts.add(e);
        for(const actor of this.active()){
          if(actor.dead||(e.owner&&actor!==e.owner&&actor.team===e.owner.team))continue;
          const dx=actor.x-e.x,dy=actor.y-e.y,d=Math.hypot(dx,dy),reach=e.radius+12;
          if(d>=reach)continue;
          const power=1-d/reach;
          if(this.guard(actor,e.x,e.y,65*power))continue;
          actor.damage((e.power||85)*power);actor.vx+=dx/Math.max(1,d)*110*power;actor.vy+=dy/Math.max(1,d)*110*power;
        }
      }
    }
    bump(){
      const actors=this.active().filter(a=>!a.dead);
      for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
        const a=actors[i],b=actors[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),r=a.radius+b.radius;
        if(d>=r)continue;
        const nx=d?dx/d:1,ny=d?dy/d:0,push=(r-d)/2+.1;
        if(!a.collides(a.x-nx*push,a.y-ny*push)){a.x-=nx*push;a.y-=ny*push;}
        if(!b.collides(b.x+nx*push,b.y+ny*push)){b.x+=nx*push;b.y+=ny*push;}
        const closing=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
        if(closing>0){a.vx-=nx*closing*.6;a.vy-=ny*closing*.6;b.vx+=nx*closing*.6;b.vy+=ny*closing*.6;}
      }
    }
    step(input={},dt=1/60){
      if(this.result)return;
      this.resolve();if(this.result)return;
      if(this.player.started||this.player.dead||Object.values(input).some(Boolean))this.started=true;
      if(!this.started)return;
      this.time+=dt;
      const actors=this.active().filter(a=>!a.dead);
      const inputs=actors.map(a=>a===this.player?input:a.pilot.step(dt));
      for(const [i,actor] of actors.entries()){actor.started=true;this.prepare(actor,inputs[i],dt);}
      for(const [i,actor] of actors.entries())actor.step(inputs[i],dt);
      this.bump();
      for(const [i,actor] of actors.entries()){
        const keys=inputs[i];
        const water=Tools.use(this,actor,keys,dt);
        if(keys.fire&&!water)this.shoot(actor,'pulse');
      }
      this.projectiles=this.projectiles.filter(p=>this.projectileStep(p,dt));this.blasts();
      for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0).slice(-128);
      this.resolve();
    }
  }
  root.CaveCombat={Combat};
  if(typeof module!=='undefined')module.exports=root.CaveCombat;
})(globalThis);
