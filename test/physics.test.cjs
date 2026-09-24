const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,M}=require('../dist/simulation.js');
const advance=(world,n)=>{for(let i=0;i<n;i++)world.step();};
function profile(world,lo,hi,material){
  const tops=[];
  for(let x=lo;x<hi;x++)for(let y=1;y<world.height-1;y++)if(world.cells[y*world.width+x]===material){tops.push(y);break;}
  return tops;
}
test('Equal samples form a sand pile, level water and a stable cohesive mud clump',()=>{
  const world=new World(320,160);world.generate('lab');const before=world.count();advance(world,1200);
  const sand=profile(world,13,86,M.SAND),water=profile(world,87,160,M.WATER),mud=profile(world,161,234,M.MUD);
  assert.ok(Math.max(...sand)-Math.min(...sand)>15);
  for(let i=1;i<sand.length;i++)assert.ok(Math.abs(sand[i]-sand[i-1])<=1);
  assert.equal(water.length,73);assert.ok(Math.max(...water)-Math.min(...water)<=1);
  assert.ok(mud.length<sand.length);assert.ok(mud.length>27,'mud corners must actually relax');
  const snapshot=world.cells.slice();advance(world,600);
  for(let i=0;i<world.size;i++)if(snapshot[i]===M.MUD||world.cells[i]===M.MUD)assert.equal(snapshot[i],world.cells[i]);
  for(const kind of [M.SAND,M.WATER,M.MUD])assert.equal(world.count()[kind],before[kind]);
});
test('Lava flows more slowly and ultimately conserves its mass as basalt',()=>{
  const world=new World(320,160);world.generate('lab');const before=world.lavaVolume();advance(world,8);
  assert.ok(profile(world,235,307,M.LAVA).some(y=>y<80));
  assert.ok(profile(world,13,86,M.SAND).every(y=>y>=62));
  advance(world,6500);assert.equal(world.count()[M.LAVA],0);assert.equal(world.lavaVolume(),before);
});
test('Steam rises and clears within 2.5 seconds instead of circulating indefinitely',()=>{
  const world=new World(64,64);const at=32*64+32;world.set(at,M.LAVA,900);world.set(at-64,M.WATER);world.step();
  assert.equal(world.count()[M.STEAM],1);assert.ok(world.heat[at]<900);
  for(let i=0;i<world.size;i++)if(world.cells[i]===M.LAVA||world.cells[i]===M.BASALT)world.set(i,M.AIR);
  advance(world,150);assert.equal(world.count()[M.STEAM],0);assert.ok(world.count()[M.WATER]<=1);
});
test('A wall stops lateral water movement and no particle crosses the world border',()=>{
  const world=new World(80,60);for(let y=1;y<59;y++)world.cells[y*80+40]=M.ROCK;
  world.brush(20,20,9,M.WATER);const count=world.count()[M.WATER];advance(world,600);
  assert.equal(world.count()[M.WATER],count);
  for(let y=0;y<60;y++){assert.equal(world.cells[y*80],M.ROCK);assert.equal(world.cells[y*80+79],M.ROCK);for(let x=41;x<80;x++)assert.notEqual(world.cells[y*80+x],M.WATER);}
});
test('Powder propagates an explosion beyond the initial blast',()=>{
  const world=new World(100,60);for(let y=24;y<=28;y++)for(let x=20;x<75;x++)world.set(y*100+x,M.POWDER);
  for(let y=29;y<34;y++)for(let x=15;x<80;x++)world.set(y*100+x,M.ROCK);
  world.explode(20,26,8);const before=world.count()[M.POWDER];advance(world,35);
  assert.ok(world.count()[M.POWDER]<before/2);assert.equal(world.cells[0],M.ROCK);
});
test('A poured mud mound settles with a rounded cap instead of a triangular tip',()=>{
  const world=new World(160,120);for(let x=1;x<159;x++)world.set(100*160+x,M.ROCK);
  for(let n=0;n<700;n++){if(n<500&&n%2===0)world.brush(80,30,1,M.MUD);world.step();}
  const mass=world.count()[M.MUD];advance(world,1400);
  const top=profile(world,1,159,M.MUD),height=100-Math.min(...top);
  assert.ok(top.filter(y=>y<=Math.min(...top)+2).length>=9,'cap must span more than the 45-degree grain pile tip');
  assert.ok(height<top.length,'mud must not form a rigid needle under continued pouring');
  assert.equal(world.count()[M.MUD],mass);
  const before=world.cells.slice();advance(world,300);assert.deepEqual(world.cells,before);
});
test('Lava remains connected over a ledge and fractional volume is conserved',()=>{
  const world=new World(160,160);
  for(let x=15;x<=70;x++)for(let y=70;y<75;y++)world.set(y*160+x,M.ROCK);
  world.brush(65,50,10,M.LAVA);const volume=world.lavaVolume();advance(world,480);
  assert.equal(world.lavaVolume(),volume);
  const c=world.cells,seen=new Uint8Array(world.size);let total=0,largest=0,maxY=0;
  for(let i=0;i<world.size;i++)if(c[i]===M.LAVA){
    total+=world.lavaFill[i];maxY=Math.max(maxY,i/160|0);
    assert.ok(world.lavaFill[i]>0&&world.lavaFill[i]<=256);assert.ok(Number.isFinite(world.heat[i]));
    if(seen[i])continue;
    const todo=[i];seen[i]=1;let mass=0;
    while(todo.length){const j=todo.pop();mass+=world.lavaFill[j];for(const k of [j-1,j+1,j-160,j+160])if(c[k]===M.LAVA&&!seen[k]){seen[k]=1;todo.push(k);}}
    largest=Math.max(largest,mass);
  }
  assert.ok(maxY>90,'lava must actually flow beyond the ledge');
  assert.ok(largest/total>.97,'a continuous ribbon must carry almost all molten material');
});
