/* A particle occupies one cell. Movement swaps cell state; no frame interpolation. */
(function (root) {
  'use strict';
  const M = Object.freeze({ AIR: 0, ROCK: 1, SAND: 2, WATER: 3, MUD: 4, LAVA: 5, STEAM: 6, POWDER: 7, FIRE: 8, SMOKE: 9, BASALT: 10 });
  const dynamic = new Set([M.SAND, M.WATER, M.MUD, M.LAVA, M.STEAM, M.POWDER, M.FIRE, M.SMOKE]);
  class World {
    constructor(width = 640, height = 400, seed = 7321) {
      this.width = width; this.height = height; this.size = width * height;
      this.cells = new Uint8Array(this.size);
      this.heat = new Float32Array(this.size);
      this.life = new Uint16Array(this.size);
      this.moved = new Uint32Array(this.size);
      this.sandMoved = new Uint32Array(this.size);
      // Lava carries fractional volume (1/256 cell), temperature and persistent flux.
      this.lavaFill = new Uint16Array(this.size);
      this.lavaFlux = new Float32Array(this.size);
      this.nextFill = new Uint16Array(this.size);
      this.lavaEnergy = new Float64Array(this.size);
      this.lavaCells = [];
      this.mudPressure = new Float32Array(this.size);
      this.mudKernel = [];
      for(let y=-9;y<=9;y++)for(let x=-9;x<=9;x++) {
        const d=x*x+y*y;
        if(d && d<=81)this.mudKernel.push({x,y,offset:y*width+x,weight:Math.exp(-d/32)});
      }
      this.tick = 0; this.seed = seed; this.randomState = seed;
      this.blasts = []; this.sources = []; this.emitting = false;
      this.effects = []; this.moves = 0;
      this.clear();
    }
    random() {
      let v = this.randomState; v ^= v << 13; v ^= v >>> 17; v ^= v << 5;
      this.randomState = v >>> 0; return this.randomState / 4294967296;
    }
    clear() {
      this.cells.fill(0); this.heat.fill(0); this.life.fill(0); this.moved.fill(0);
      this.sandMoved.fill(0);
      this.lavaFill.fill(0); this.lavaFlux.fill(0); this.lavaCells.length=0;
      this.tick = 0; this.blasts.length = 0; this.effects.length = 0; this.sources.length = 0;
      for (let x = 0; x < this.width; x++) { this.cells[x] = M.ROCK; this.cells[(this.height-1)*this.width+x] = M.ROCK; }
      for (let y = 0; y < this.height; y++) { this.cells[y*this.width] = M.ROCK; this.cells[y*this.width+this.width-1] = M.ROCK; }
    }
    set(i, material, heat = 0) {
      this.cells[i] = material; this.heat[i] = heat || (material === M.LAVA ? 1200 : 0);
      this.lavaFill[i] = material === M.LAVA || material === M.BASALT ? 256 : 0;
      this.lavaFlux[i] = 0;
      this.life[i] = material === M.STEAM ? 90 + (this.random()*60|0) : material === M.FIRE ? 30 + (this.random()*60|0) : material === M.SMOKE ? 160 + (this.random()*120|0) : 0;
      this.moved[i] = this.tick;
      this.sandMoved[i] = 0;
    }
    swap(a, b) {
      let v = this.cells[a]; this.cells[a] = this.cells[b]; this.cells[b] = v;
      v = this.heat[a]; this.heat[a] = this.heat[b]; this.heat[b] = v;
      v = this.life[a]; this.life[a] = this.life[b]; this.life[b] = v;
      v = this.lavaFill[a]; this.lavaFill[a] = this.lavaFill[b]; this.lavaFill[b] = v;
      v = this.lavaFlux[a]; this.lavaFlux[a] = this.lavaFlux[b]; this.lavaFlux[b] = v;
      this.moved[a] = this.moved[b] = this.tick; this.moves++;
      this.sandMoved[a] = this.cells[a] === M.SAND ? this.tick + 1 : 0;
      this.sandMoved[b] = this.cells[b] === M.SAND ? this.tick + 1 : 0;
    }
    looseSand(i) {
      if(this.cells[i]!==M.SAND)return false;
      // Recently moving grains form a penetrable stream; a settled pile is terrain.
      if(this.sandMoved[i]&&this.tick+1-this.sandMoved[i]<=6)return true;
      const w=this.width;
      return this.isGas(i+w)||this.cells[i+w]===M.WATER||
        (this.isGas(i-1)&&this.isGas(i+w-1))||(this.isGas(i+1)&&this.isGas(i+w+1));
    }
    isGas(i) { const v = this.cells[i]; return v === M.AIR || v === M.STEAM || v === M.SMOKE || v === M.FIRE; }
    fall(i, j, kind) {
      const target = this.cells[j];
      if (this.isGas(j)) { this.swap(i,j); return true; }
      if (target === M.WATER && (kind === M.SAND || kind === M.MUD || kind === M.POWDER) && this.random() < 0.35) { this.swap(i,j); return true; }
      return false;
    }
    neighbors(i, kind) {
      const w=this.width, c=this.cells;
      return (c[i-1]===kind)+(c[i+1]===kind)+(c[i-w]===kind)+(c[i+w]===kind)+(c[i-w-1]===kind)+(c[i-w+1]===kind)+(c[i+w-1]===kind)+(c[i+w+1]===kind);
    }
    powder(i, kind, direction) {
      const w=this.width;
      if(this.fall(i,i+w,kind)) return;
      for(const d of [direction,-direction]) if(this.isGas(i+d) && this.fall(i,i+w+d,kind)) return;
    }
    water(i, direction) {
      const w=this.width;
      if(this.fall(i,i+w,M.WATER)) return;
      for(const d of [direction,-direction]) if(this.isGas(i+d) && this.fall(i,i+w+d,M.WATER)) return;
      // Search along an open path, never through a wall. A long reach levels pools quickly.
      for(const d of [direction,-direction]) {
        let dest=i;
        for(let s=1;s<=5;s++) {
          const j=i+d*s;
          if(!this.isGas(j)) break;
          dest=j;
          if(this.isGas(j+w)) break;
        }
        if(dest!==i) {this.swap(i,dest); return;}
      }
    }
    mudCohesion(at, omit) {
      const x=at%this.width,y=at/this.width|0;
      const inner=x>=9&&x<this.width-9&&y>=9&&y<this.height-9;
      let score=0;
      for(const k of this.mudKernel) {
        if(!inner&&(x+k.x<1||x+k.x>=this.width-1||y+k.y<1||y+k.y>=this.height-1))continue;
        const j=at+k.offset;
        if(j!==omit&&this.cells[j]===M.MUD)score+=k.weight;
      }
      return score;
    }
    mud(i, direction) {
      const w=this.width,c=this.cells;
      if(this.fall(i,i+w,M.MUD))return;
      if((this.tick+i)%6!==0 || (!this.isGas(i-w)&&!this.isGas(i-1)&&!this.isGas(i+1)))return;
      const before=this.mudCohesion(i,-1);
      let best=i,gain=0.55;
      // Surface creep follows an open path, allowing a pointed cap to round off.
      // The path-length yield cost stops a settled mound from spreading indefinitely.
      if(this.isGas(i-w))for(const d of [direction,-direction]) {
        let j=i,drop=0;
        for(let reach=1;reach<=9;reach++) {
          if(!this.isGas(j+d))break;
          j+=d;
          while(drop<9&&this.isGas(j+w)){j+=w;drop++;}
          if(this.isGas(j+w))break;
          const change=this.mudCohesion(j,i)-before+drop*0.35-reach*0.55;
          if(change>gain){gain=change;best=j;}
        }
      }
      if(best!==i){this.swap(i,best);return;}
      // A tall, supported clump can yield at its foot without becoming a loose powder.
      const load=this.mudPressure[i];
      for(const d of [direction,-direction]) {
        const j=i+d;
        if(this.isGas(j)&&this.isGas(j+w)&&this.mudCohesion(j+w,i)+1.2+load*0.28>before+0.7) {
          this.swap(i,j+w);return;
        }
        if(this.isGas(j)&&!this.isGas(j+w)&&this.mudCohesion(j,i)+load*0.32>before+0.7) {
          this.swap(i,j);return;
        }
      }
    }
    lava(i) {
      const w=this.width,c=this.cells,h=this.heat;
      let cooling=0.20;
      this.life[i]=Math.min(65535,this.life[i]+1);
      for(const j of [i-w,i+w,i-1,i+1]) {
        const k=c[j];
        if(k===M.WATER) {this.set(j,M.STEAM);h[i]-=190;}
        else if(k===M.POWDER) {this.blasts.push(j);this.set(j,M.FIRE);}
        else if(k===M.MUD) {this.set(j,M.SAND);h[i]-=15;}
        else if(k===M.AIR||k===M.STEAM||k===M.SMOKE)cooling+=0.28;
        else if(k===M.ROCK||k===M.BASALT)cooling+=0.12;
        else if(k===M.LAVA) {
          // Exchange heat by volume; a thin film cannot heat a full reservoir for free.
          const exchange=(h[i]-h[j])*0.018*Math.min(this.lavaFill[i],this.lavaFill[j]);
          h[i]-=exchange/Math.max(1,this.lavaFill[i]);
          h[j]+=exchange/Math.max(1,this.lavaFill[j]);
        }
      }
      h[i]-=cooling;
      if(h[i]<480){c[i]=M.BASALT;this.lavaFlux[i]=0;return;}
      this.lavaCells.push(i);
    }
    flowLava() {
      const active=this.lavaCells,w=this.width,c=this.cells,mass=this.lavaFill,next=this.nextFill,energy=this.lavaEnergy;
      if(!active.length)return;
      next.set(mass);energy.fill(0);
      for(const i of active)energy[i]=mass[i]*this.heat[i];
      const created=[];
      const transfer=(a,b,amount)=>{
        const n=Math.min(Math.floor(amount),next[a],256-next[b]);
        if(n<=0)return 0;
        if(c[b]!==M.LAVA){c[b]=M.LAVA;this.life[b]=0;this.lavaFlux[b]=0;created.push(b);}
        next[a]-=n;next[b]+=n;
        energy[a]-=n*this.heat[a];energy[b]+=n*this.heat[a];
        this.life[b]=0;this.moves++;return n;
      };
      // Read old donor volumes, write bounded fluxes into the next state. Incoming fluid
      // never travels a second cell during the same tick, regardless of scan direction.
      for(const i of active) {
        let available=mass[i];
        const hot=Math.max(0.08,Math.min(1,(this.heat[i]-480)/650));
        const targetFlux=5+hot*17;
        this.lavaFlux[i]+=(targetFlux-this.lavaFlux[i])*0.18;
        const fed=c[i-w]===M.LAVA||this.life[i]<12;
        const film=fed?32:0;
        const down=i+w;
        if((this.isGas(down)||c[down]===M.LAVA)&&(available>48||!fed)) {
          const n=transfer(i,down,Math.min(available-film,this.lavaFlux[i]));available-=n;
        }
        // On a slope the front wets the adjacent cell before turning downward. Keeping
        // a small fed film in the donor joins successive advances into one continuous ribbon.
        if(!this.isGas(down)&&(c[down]!==M.LAVA||next[down]>160)) {
          const d=(this.tick+(i/w|0))%2?1:-1;
          for(const side of [d,-d]) {
            const j=i+side;
            if(!(this.isGas(j)||c[j]===M.LAVA))continue;
            const pressure=(next[i]-next[j]-12)*0.12;
            const n=transfer(i,j,Math.min(available-film,pressure,hot*14+2));available-=n;
          }
        }
      }
      for(const i of active.concat(created)) {
        mass[i]=next[i];
        if(!mass[i])this.set(i,M.AIR);
        else this.heat[i]=energy[i]/mass[i];
      }
    }
    lavaVolume() {
      let total=0;
      for(let i=0;i<this.size;i++)if(this.cells[i]===M.LAVA||this.cells[i]===M.BASALT)total+=this.lavaFill[i];
      return total/256;
    }
    gas(i, kind, direction) {
      const w=this.width,c=this.cells;
      if(this.life[i]>0) this.life[i]--;
      if(!this.life[i]) {
        const ceiling=c[i-w]===M.ROCK||c[i-w]===M.BASALT;
        this.set(i,kind===M.STEAM&&ceiling&&this.random()<0.18?M.WATER:M.AIR);return;
      }
      if(kind===M.FIRE) {
        for(const j of [i-w,i+w,i-1,i+1]) {
          if(c[j]===M.POWDER) {this.blasts.push(j);this.set(j,M.FIRE);}
          else if(c[j]===M.WATER) {this.set(i,M.SMOKE);return;}
        }
      }
      if(kind!==M.STEAM&&(this.tick+i)%2!==0) return;
      for(const j of [i-w,i-w+direction,i-w-direction,i+direction]) {
        if(c[j]===M.AIR) {this.swap(i,j);return;}
      }
    }
    explode(x,y,radius=18) {
      const c=this.cells,w=this.width;
      for(let dy=-radius;dy<=radius;dy++) for(let dx=-radius;dx<=radius;dx++) {
        const d2=dx*dx+dy*dy,xx=x+dx,yy=y+dy;
        if(d2>radius*radius || xx<2 || xx>=w-2 || yy<2 || yy>=this.height-2) continue;
        const i=yy*w+xx,k=c[i];
        if(k===M.POWDER && d2>16) this.blasts.push(i);
        if(k===M.WATER) {if(this.random()<0.35)this.set(i,M.STEAM);else this.set(i,M.AIR);}
        else if(d2<(radius-2)*(radius-2)) this.set(i,this.random()<0.16?M.FIRE:this.random()<0.18?M.SMOKE:M.AIR);
        else if(k===M.ROCK || k===M.BASALT) this.set(i,M.SAND);
        else if(this.random()<0.25)this.set(i,M.FIRE);
      }
      const effect={x,y,radius,age:0};this.effects.push(effect);return effect;
    }
    brush(x,y,radius,material,replace=false) {
      const w=this.width;
      for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++) {
        if(dx*dx+dy*dy>radius*radius)continue;
        const xx=x+dx,yy=y+dy;
        if(xx<2||xx>=w-2||yy<2||yy>=this.height-2)continue;
        const i=yy*w+xx;
        if(material===M.LAVA&&this.cells[i]===M.LAVA) {
          const old=this.lavaFill[i],added=256-old;
          if(added){this.heat[i]=(this.heat[i]*old+1200*added)/256;this.lavaFill[i]=256;this.life[i]=0;}
        }else if(replace || material===M.AIR || this.isGas(i))this.set(i,material);
      }
    }
    step() {
      this.tick++;this.moves=0;this.lavaCells.length=0;
      if(this.emitting) for(const s of this.sources) {
        if(this.tick%s.rate===0) this.brush(s.x,s.y,s.radius,s.material);
      }
      const w=this.width,c=this.cells,p=this.mudPressure;
      // Weight spreads through touching mud cells, including diagonal support.
      // A fresh outer column still bears part of the connected clump above it.
      for(let y=1;y<this.height-1;y++)for(let x=1;x<w-1;x++) {
        const i=y*w+x;
        p[i]=c[i]===M.MUD?Math.min(60,1+Math.max(
          c[i-w]===M.MUD?p[i-w]:0,
          c[i-w-1]===M.MUD?p[i-w-1]-.7:0,
          c[i-w+1]===M.MUD?p[i-w+1]-.7:0)):0;
      }
      for(let y=this.height-2;y>=1;y--) {
        const right=(y+this.tick)%2===0;
        let i=y*w+(right?1:w-2), end=y*w+(right?w-1:0), inc=right?1:-1;
        for(;i!==end;i+=inc) {
          const k=c[i];
          if(k===M.AIR||k===M.ROCK||k===M.BASALT||this.moved[i]===this.tick)continue;
          const direction=this.random()<0.5?-1:1;
          if(k===M.SAND||k===M.POWDER)this.powder(i,k,direction);
          else if(k===M.WATER)this.water(i,direction);
          else if(k===M.MUD)this.mud(i,direction);
          else if(k===M.LAVA)this.lava(i);
          else this.gas(i,k,direction);
        }
      }
      this.flowLava();
      // Process a bounded breadth of chain reactions per tick.
      const queue=this.blasts.splice(0,24);
      for(const i of queue)this.explode(i%w,i/w|0,7);
      if(this.blasts.length>2048)this.blasts.length=2048;
      for(const e of this.effects)e.age++;
      this.effects=this.effects.filter(e=>e.age<18).slice(-64);
    }
    count() {
      const counts=new Uint32Array(11);for(const k of this.cells)counts[k]++;
      return Array.from(counts);
    }
    generate(scene='cave') {
      this.randomState=this.seed;this.clear();const w=this.width,h=this.height,c=this.cells;
      this.enemySpawn=null;
      if(scene==='arena') {
        // A wide central fight, two cover islands and lower routes through water.
        for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++) {
          const nx=(x-w/2)/(w*.46),ny=(y-h*.49)/(h*.42);
          const edge=1+.035*Math.sin(x/13)+.025*Math.sin(y/9+x/22);
          if(nx*nx+ny*ny>edge)c[y*w+x]=M.ROCK;
        }
        const shelf=(x0,x1,y0,slope,depth)=>{
          for(let x=x0;x<x1;x++)for(let y=Math.round(y0+(x-x0)*slope);y<y0+(x-x0)*slope+depth;y++)c[y*w+x]=M.ROCK;
        };
        shelf(112,203,217,.16,10);shelf(424,520,215,-.12,10);
        shelf(301,340,204,-.04,20);shelf(278,369,99,0,9);
        shelf(480,544,134,.18,8);
        for(let y=293;y<h-2;y++)for(let x=75;x<435;x++)if(c[y*w+x]===M.AIR)this.set(y*w+x,M.WATER);
        for(let y=305;y<340;y++)for(let x=443;x<548;x++)if(c[y*w+x]===M.AIR)this.set(y*w+x,M.LAVA);
        this.brush(144,137,17,M.SAND);this.brush(491,120,11,M.LAVA);
        this.brush(187,206,9,M.POWDER);
        this.sources=[{x:151,y:85,material:M.SAND,radius:1,rate:5},{x:478,y:67,material:M.WATER,radius:1,rate:7}];
        this.spawn={x:251,y:166};this.enemySpawn={x:394,y:163};return;
      }
      if(scene==='empty') {
        for(let y=h-20;y<h-1;y++)for(let x=1;x<w-1;x++)c[y*w+x]=M.ROCK;
        this.spawn={x:160,y:h-100};return;
      }
      if(scene==='lab') {
        // Four equal containers make repose, levelling, yield and viscosity directly comparable.
        for(let y=130;y<143;y++)for(let x=12;x<308;x++)c[y*w+x]=M.ROCK;
        for(const x of [12,86,160,234,307])for(let y=40;y<143;y++)c[y*w+x]=M.ROCK;
        for(const [j,material] of [M.SAND,M.WATER,M.MUD,M.LAVA].entries()) {
          const x=49+j*74;
          for(let yy=54;yy<83;yy++)for(let xx=x-13;xx<x+14;xx++)this.set(yy*w+xx,material);
          this.sources.push({x,y:27,material,radius:2,rate:material===M.LAVA?8:4});
        }
        this.spawn={x:160,y:100};return;
      }
      // Smooth a seeded binary field, then carve broad linked chambers.
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)c[y*w+x]=this.random()<0.47?M.ROCK:M.AIR;
      const temp=new Uint8Array(this.size);
      for(let pass=0;pass<5;pass++) {
        temp.set(c);
        for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++) {
          const i=y*w+x;let n=0;
          for(const d of [-w-1,-w,-w+1,-1,1,w-1,w,w+1])if(c[i+d]===M.ROCK)n++;
          temp[i]=n>=5?M.ROCK:n<=3?M.AIR:c[i];
        }
        c.set(temp);
      }
      const carve=(cx,cy,rx,ry)=>{
        for(let y=Math.max(2,cy-ry|0);y<Math.min(h-2,cy+ry);y++)for(let x=Math.max(2,cx-rx|0);x<Math.min(w-2,cx+rx);x++) {
          if(((x-cx)/rx)**2+((y-cy)/ry)**2<1)c[y*w+x]=M.AIR;
        }
      };
      const chambers=[[175,131,153,83],[455,126,142,86],[165,302,143,72],[450,306,143,72]];
      for(const [cx,cy,rx,ry] of chambers)carve(cx,cy,rx,ry);
      for(let k=0;k<80;k++){carve(245+k*2.1,128+Math.sin(k/15)*14,20,22);carve(168+Math.sin(k/13)*20,164+k*1.6,23,20);carve(453+Math.cos(k/11)*17,160+k*1.6,20,20);}
      for(let k=0;k<100;k++)carve(250+k*1.8,304+Math.sin(k/20)*9,25,20);
      // Rebuild the initial chamber's readable silhouette: sloped banks, pool and a lava ledge.
      for(let x=25;x<324;x++) {
        const floor=Math.round(180+25*Math.sin((x-62)/68)+6*Math.sin(x/18));
        for(let y=floor;y<227;y++)c[y*w+x]=M.ROCK;
        const ceiling=Math.round(49+7*Math.sin(x/23)+4*Math.cos(x/9));
        for(let y=25;y<ceiling;y++)c[y*w+x]=M.ROCK;
      }
      // Shelves have separate, intentionally visible materials; the user can cut through any rock.
      for(let x=223;x<309;x++) {
        const top=100+Math.round((x-223)*0.32);
        for(let y=top;y<top+9;y++)c[y*w+x]=M.ROCK;
      }
      for(let x=32;x<99;x++) {
        const top=143+Math.round((x-32)*0.29);
        for(let y=top;y<top+8;y++)c[y*w+x]=M.ROCK;
      }
      for(let x=65;x<137;x++)for(let y=60;y<113;y++) {
        if((x-101)**2/36**2+(y-88)**2/26**2<1 && c[y*w+x]===M.AIR)this.set(y*w+x,M.SAND);
      }
      for(let x=125;x<217;x++)for(let y=182;y<225;y++)if(c[y*w+x]===M.AIR)this.set(y*w+x,M.WATER);
      for(let x=36;x<83;x++)for(let y=112;y<161;y++)if(c[y*w+x]===M.AIR && y>113+Math.abs(x-58)*0.2)this.set(y*w+x,M.MUD);
      for(let x=244;x<284;x++)for(let y=71;y<110;y++)if(c[y*w+x]===M.AIR)this.set(y*w+x,M.LAVA);
      // A deep reservoir, a second lava chamber and a powder seam reward exploration.
      for(let x=340;x<545;x++)for(let y=142;y<197;y++)if(c[y*w+x]===M.AIR)this.set(y*w+x,M.WATER);
      for(let x=390;x<507;x++)for(let y=319;y<365;y++)if(c[y*w+x]===M.AIR)this.set(y*w+x,M.LAVA);
      for(let x=77;x<162;x++)for(let y=335;y<355;y++)if(c[y*w+x]===M.AIR)this.set(y*w+x,M.POWDER);
      this.sources=[{x:107,y:57,material:M.SAND,radius:1,rate:5},{x:197,y:68,material:M.WATER,radius:1,rate:5},{x:269,y:65,material:M.LAVA,radius:2,rate:8}];
      this.spawn={x:176,y:134};
    }
  }
  root.CaveSim={M,World,dynamic};
  if(typeof module!=='undefined')module.exports=root.CaveSim;
})(globalThis);
