(function(root){
  'use strict';
  const {M}=root.CaveSim;
  const solid=new Set([M.ROCK,M.BASALT,M.SAND,M.MUD,M.POWDER]);
  const SPRITE=[
    '             ',
    '  33         ',
    '  133        ',
    '  112333     ',
    ' 1122222233  ',
    '1122244222233',
    ' 1122222233  ',
    '  112333     ',
    '  133        ',
    '  33         ',
    '             ',
  ];
  const PALETTE={'1':'#466978','2':'#82bcc6','3':'#edf3d6','4':'#263f55'};
  class Drone {
    constructor(world,options={}){this.world=world;this.radius=6.2;this.spawn=options.spawn;this.team=options.team||0;this.respawn();}
    collides(x,y,settledOnly=true){
      const w=this.world.width,h=this.world.height,r=this.radius;
      if(x-r<1||y-r<1||x+r>=w-1||y+r>=h-1)return true;
      for(let yy=Math.floor(y-r);yy<=Math.ceil(y+r);yy++)for(let xx=Math.floor(x-r);xx<=Math.ceil(x+r);xx++) {
        const i=yy*w+xx,k=this.world.cells[i];
        if((xx+.5-x)**2+(yy+.5-y)**2<r*r&&solid.has(k)&&!(settledOnly&&k===M.SAND&&this.world.looseSand(i)))return true;
      }
      return false;
    }
    safeSpawn(x,y){
      if(this.collides(x,y,false))return false;
      const w=this.world.width;
      for(let yy=-6;yy<=6;yy+=3)for(let xx=-6;xx<=6;xx+=3) {
        const k=this.world.cells[Math.floor(y+yy)*w+Math.floor(x+xx)];
        if(k===M.LAVA||k===M.FIRE||k===M.WATER)return false;
      }
      return true;
    }
    respawn(){
      const s=this.spawn||this.world.spawn||{x:this.world.width/2,y:this.world.height/2};
      let point=null;
      if(this.safeSpawn(s.x,s.y))point=s;
      for(let r=4;!point&&r<180;r+=4)for(let a=0;a<32;a++) {
        const x=Math.round(s.x+Math.cos(a*Math.PI/16)*r),y=Math.round(s.y+Math.sin(a*Math.PI/16)*r);
        if(this.safeSpawn(x,y)){point={x,y};break;}
      }
      this.x=point?point.x:s.x;this.y=point?point.y:s.y;
      this.vx=0;this.vy=0;this.angle=-Math.PI/2;this.spin=0;this.health=point?100:0;
      this.started=false;this.dead=!point;this.blocked=!point;this.throttle=0;this.wet=0;this.impactCooldown=0;
      return !!point;
    }
    medium(){
      let wet=0,hot=0,fire=0,sand=0,n=0;const w=this.world.width;
      for(let y=-4;y<=4;y+=2)for(let x=-4;x<=4;x+=2)if(x*x+y*y<=20) {
        const k=this.world.cells[Math.floor(this.y+y)*w+Math.floor(this.x+x)];
        wet+=k===M.WATER;hot+=k===M.LAVA;fire+=k===M.FIRE;sand+=k===M.SAND;n++;
      }
      return {wet:wet/n,hot:hot/n,fire:fire/n,sand:sand/n};
    }
    damage(amount){
      if(this.dead)return;
      this.health=Math.max(0,this.health-amount);
      if(this.health===0){this.dead=true;this.throttle=0;this.world.explode(Math.round(this.x),Math.round(this.y),12);}
    }
    unstick(){
      if(!this.collides(this.x,this.y))return true;
      // Settling sand or edited terrain can engulf a stopped craft. Resolve only a
      // nearby overlap; do not teleport through a thick wall or delete terrain.
      for(let r=1;r<=9;r++)for(let a=0;a<16;a++) {
        const x=this.x+Math.cos(a*Math.PI/8)*r,y=this.y+Math.sin(a*Math.PI/8)*r;
        if(!this.collides(x,y)){this.x=x;this.y=y;return true;}
      }
      return false;
    }
    step(input={},dt=1/60){
      if(this.dead)return;
      if(input.thrust||input.turn||input.brake)this.started=true;
      if(!this.started){this.throttle=0;return;}
      this.impactCooldown=Math.max(0,this.impactCooldown-dt);
      const medium=this.medium();this.wet=medium.wet;
      this.damage((medium.hot*100+medium.fire*15)*dt);
      if(this.dead)return;
      if(!this.unstick()){this.vx=this.vy=0;this.damage(60*dt);return;}
      this.spin+=((input.turn||0)*3.3-this.spin)*(1-Math.exp(-12*dt));
      this.angle+=this.spin*dt;
      this.angle=((this.angle+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
      this.throttle=Math.max(0,Math.min(1,Number(input.thrust)||0));
      const thrust=115*this.throttle*(1-medium.wet*.58)*(1-medium.hot*.78)*(1-medium.sand*.25);
      this.vx+=Math.cos(this.angle)*thrust*dt;
      this.vy+=(Math.sin(this.angle)*thrust+34*(1-medium.wet*.8))*dt;
      const drag=Math.exp(-(0.22+medium.wet*3+medium.hot*9+medium.sand*1.8+(input.brake?3.8:0))*dt);
      this.vx*=drag;this.vy*=drag;
      const speed=Math.hypot(this.vx,this.vy);
      if(speed>140){this.vx*=140/speed;this.vy*=140/speed;}
      // Sub-cell swept motion prevents a fast craft from crossing one-cell walls.
      const substeps=Math.max(1,Math.ceil(Math.hypot(this.vx,this.vy)*dt/.5));
      for(let n=0;n<substeps;n++) {
        const dx=this.vx*dt/substeps,dy=this.vy*dt/substeps;
        if(this.collides(this.x+dx,this.y)) {
          const impact=Math.abs(this.vx);this.vx*=-.16;
          if(!this.impactCooldown&&impact>38){this.damage((impact-38)*.65);this.impactCooldown=.18;}
        }else this.x+=dx;
        if(this.collides(this.x,this.y+dy)) {
          const impact=Math.abs(this.vy);this.vy=impact<12?0:this.vy*-.12;this.vx*=.96;
          if(!this.impactCooldown&&impact>42){this.damage((impact-42)*.65);this.impactCooldown=.18;}
        }else this.y+=dy;
        if(this.dead)break;
      }
    }
    get speed(){return Math.hypot(this.vx,this.vy);}
  }
  root.CaveFlight={Drone,SPRITE,PALETTE};
  if(typeof module!=='undefined')module.exports=root.CaveFlight;
})(globalThis);
