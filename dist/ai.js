(function(root){
  'use strict';
  const {M}=root.CaveSim;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  class Pilot {
    constructor(combat,actor=combat.enemy,slot=0){this.combat=combat;this.actor=actor;this.slot=slot;this.reset();}
    reset(){this.route=[];this.planIn=this.slot*.13;this.senseIn=0;this.observed=null;this.target=null;this.stuck=0;this.last=null;this.intent={};this.plans=0;}
    clear(x,y){
      const a=this.actor;
      if(a.collides(x,y))return false;
      for(const [dx,dy] of [[0,0],[6,0],[-6,0],[0,6],[0,-6]])if(this.combat.cell(x+dx,y+dy)===M.LAVA)return false;
      return true;
    }
    passage(ax,ay,bx,by){
      const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/4));
      for(let k=0;k<=n;k++)if(!this.clear(ax+(bx-ax)*k/n,ay+(by-ay)*k/n))return false;
      return true;
    }
    firingSpot(x,y,target){
      // Aiming cuts thrust. Reserve falling room plus the waypoint arrival tolerance.
      return this.clear(x,y+18)&&this.clear(x,y+32)&&this.combat.sight(x,y,target.x,target.y);
    }
    plan(goal,target=null){
      const a=this.actor,w=this.combat.world,grid=16,cols=Math.floor(w.width/grid),rows=Math.floor(w.height/grid),size=cols*rows;
      const pos=i=>({x:(i%cols)*grid+8,y:Math.floor(i/cols)*grid+8});
      // Cache clearance only for nodes reached by this plan; edits invalidate it next time.
      const open=new Uint8Array(size);
      const isOpen=i=>{
        if(!open[i]){const p=pos(i);open[i]=this.clear(p.x,p.y)?2:1;}
        return open[i]===2;
      };
      // Connect to the nearest reachable local center. Never ray-march across the map
      // just to find a start; a trapped craft can fall back to its existing blink logic.
      const candidates=[],gx=Math.floor(a.x/grid),gy=Math.floor(a.y/grid);
      for(let y=Math.max(0,gy-2);y<=Math.min(rows-1,gy+2);y++)for(let x=Math.max(0,gx-2);x<=Math.min(cols-1,gx+2);x++){
        const i=y*cols+x,p=pos(i);candidates.push({i,d:(p.x-a.x)**2+(p.y-a.y)**2});
      }
      candidates.sort((a,b)=>a.d-b.d);
      let start=-1;
      for(const {i} of candidates){
        if(!isOpen(i))continue;
        const p=pos(i);if(this.passage(a.x,a.y,p.x,p.y)){start=i;break;}
      }
      if(start<0){this.route=[];return;}
      // Bounded breadth-first search is replanned against the editable cellular map.
      const queue=[start],parent=new Int32Array(size);parent.fill(-1);parent[start]=start;
      let best=start,bestDistance=Infinity;
      for(let head=0;head<queue.length;head++){
        const i=queue[head],p=pos(i);
        const d=Math.hypot(p.x-goal.x,p.y-goal.y)+(target&&!this.firingSpot(p.x,p.y,target)?500:0);
        if(d<bestDistance){best=i;bestDistance=d;}
        if(d<10)break;
        for(const j of [i-cols,i+cols,i-1,i+1]){
          if(j<0||j>=size||parent[j]!==-1||Math.abs(j%cols-i%cols)>1||!isOpen(j))continue;
          const next=pos(j);if(!this.passage(p.x,p.y,next.x,next.y))continue;
          parent[j]=i;queue.push(j);
        }
      }
      this.route=[];
      for(let i=best;i!==start;i=parent[i])this.route.push(pos(i));
      this.route.reverse();this.plans++;
    }
    step(dt){
      const c=this.combat,a=this.actor;if(a.dead)return {};
      this.planIn-=dt;this.senseIn-=dt;
      if(this.senseIn<=0||!this.target||this.target.dead){
        const enemies=c.living(1-a.team).sort((b,d)=>Math.hypot(b.x-a.x,b.y-a.y)-Math.hypot(d.x-a.x,d.y-a.y));
        const target=enemies[0];if(!target)return {};
        if(target!==this.target){this.target=target;this.route=[];this.last=null;this.stuck=0;}

        // Aim reacts to a sampled observation, never to future inputs.
        this.senseIn=.14;this.observed={x:target.x,y:target.y,vx:target.vx,vy:target.vy};
      }
      const p=this.observed,dx=p.x-a.x,dy=p.y-a.y,distance=Math.hypot(dx,dy);
      const side=a.x>=p.x?1:-1,goal={x:p.x+side*82,y:p.y-38};
      if(this.planIn<=0){
        this.planIn=.65;
        if(this.last&&Math.hypot(a.x-goal.x,a.y-goal.y)>25&&Math.hypot(a.x-this.last.x,a.y-this.last.y)<5)this.stuck+=.65;else this.stuck=0;
        this.last={x:a.x,y:a.y};this.plan(goal,p);
      }
      while(this.route.length&&Math.hypot(this.route[0].x-a.x,this.route[0].y-a.y)<12)this.route.shift();
      let waypoint=this.route[0]||{x:a.x,y:a.y-10};
      // Skip only waypoints connected by a hull-width, hazard-free corridor.
      for(let k=Math.min(6,this.route.length-1);k>0;k--)if(this.passage(a.x,a.y,this.route[k].x,this.route[k].y)){waypoint=this.route[k];break;}
      if(this.passage(a.x,a.y,goal.x,goal.y)&&this.firingSpot(goal.x,goal.y,p))waypoint=goal;
      const ax=clamp((waypoint.x-a.x)*2.1-a.vx*3,-95,95),ay=clamp((waypoint.y-a.y)*2.1-a.vy*3-34,-105,70);
      let angle=Math.atan2(ay,ax),thrust=clamp(Math.hypot(ax,ay)/115,0,1),brake=false;
      const travel=distance/230,aim=Math.atan2(dy+p.vy*travel,dx+p.vx*travel);
      const visible=distance<210&&c.sight(a.x,a.y,p.x,p.y);
      const attack=visible&&(c.time+this.slot*.4)%2.8<1.35&&a.vy<42&&this.clear(a.x,a.y+18);
      if(attack){angle=aim;thrust=0;brake=true;}
      const error=wrap(angle-a.angle),aimError=Math.abs(wrap(aim-a.angle));
      if(Math.abs(error)>.6)thrust=0;
      let threatened=false;
      for(const shot of c.projectiles){
        if(shot.owner.team===a.team||shot.kind==='water')continue;
        const sx=shot.x-a.x,sy=shot.y-a.y,vx=shot.vx-a.vx,vy=shot.vy-a.vy;
        const t=clamp(-(sx*vx+sy*vy)/(vx*vx+vy*vy||1),0,.55);
        if(t>.06&&Math.hypot(sx+vx*t,sy+vy*t)<13&&(sx*Math.cos(a.angle)+sy*Math.sin(a.angle))>0){threatened=true;break;}
      }
      const onTarget=visible&&aimError<.16;
      const water=onTarget&&distance<70&&a.gear.water>5&&Math.floor(c.time/2.8)%3===2;
      const blink=(this.stuck>1.9||(a.medium().hot>0)||(threatened&&a.gear.energy<18))&&a.gear.blink===0;
      this.intent={turn:clamp(error*3.5-a.spin*.65,-1,1),thrust,brake,
        fire:onTarget&&!water,water,grenade:onTarget&&dy>22&&distance>45&&distance<115&&a.gear.grenades>0,
        shield:threatened&&a.gear.energy>12,blink};
      return this.intent;
    }
  }
  root.CaveAI={Pilot};
  if(typeof module!=='undefined')module.exports=root.CaveAI;
})(globalThis);
