const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,M}=require('../dist/simulation.js');
const {Drone}=require('../dist/flight.js');
function scene(){const world=new World(240,240);world.spawn={x:100,y:120};return {world,drone:new Drone(world)};}
const fly=(drone,input,n)=>{for(let i=0;i<n;i++)drone.step(input);};
test('A new craft waits for input, then thrust, inertia and gravity act on it',()=>{
  const {drone}=scene();fly(drone,{},120);assert.equal(drone.y,120);
  fly(drone,{thrust:true},40);assert.ok(drone.y<110);assert.ok(drone.vy<0);
  const y=drone.y;drone.step({});assert.ok(drone.y<y,'engine cut must retain momentum');
  fly(drone,{},140);assert.ok(drone.vy>0,'gravity eventually reverses the climb');
});
test('Turning changes thrust direction and air brakes reduce drift',()=>{
  const {drone}=scene();fly(drone,{turn:1},25);fly(drone,{thrust:true},25);assert.ok(drone.vx>15);
  drone.x=100;drone.y=120;drone.vx=90;drone.vy=0;
  fly(drone,{brake:true},30);assert.ok(drone.speed<30);
});
test('Fast flight cannot tunnel through a single-cell wall',()=>{
  const {world,drone}=scene();for(let y=1;y<239;y++)world.set(y*240+130,M.ROCK);
  drone.started=true;drone.vx=138;
  fly(drone,{},40);assert.ok(drone.x<124);assert.ok(!drone.collides(drone.x,drone.y));assert.ok(drone.health<100);
});
test('Water slows the craft; lava destroys it exactly once',()=>{
  const dry=scene(),wet=scene();
  for(let y=20;y<220;y++)for(let x=20;x<220;x++)wet.world.set(y*240+x,M.WATER);
  for(const d of [dry.drone,wet.drone]){d.started=true;d.vx=90;}
  fly(dry.drone,{},30);fly(wet.drone,{},30);assert.ok(wet.drone.speed<dry.drone.speed*.6);assert.equal(wet.drone.health,100);
  for(let y=20;y<220;y++)for(let x=20;x<220;x++)wet.world.set(y*240+x,M.LAVA);
  fly(wet.drone,{brake:true},100);assert.ok(wet.drone.dead);assert.equal(wet.world.effects.length,1);
});
test('Respawn finds free space without resetting edited terrain',()=>{
  const {world,drone}=scene();world.brush(100,120,10,M.ROCK);const before=world.cells.slice();
  assert.ok(drone.respawn());assert.ok(!drone.collides(drone.x,drone.y));assert.equal(drone.health,100);
  assert.deepEqual(world.cells,before);
});
test('Falling sand can be crossed without deleting grains; a settled pile remains solid',()=>{
  const {world,drone}=scene();
  for(let y=30;y<190;y++)for(let x=111;x<120;x++)world.set(y*240+x,M.SAND);
  const mass=world.count()[M.SAND];drone.started=true;drone.vx=90;
  for(let i=0;i<32;i++){world.step();drone.step({});}
  assert.ok(drone.x>130);assert.equal(drone.health,100);assert.equal(world.count()[M.SAND],mass);
  for(let y=70;y<239;y++)for(let x=175;x<205;x++)world.set(y*240+x,M.SAND);
  assert.ok(drone.collides(185,120));
});
test('Lava resists flight more strongly than water and reduces engine thrust',()=>{
  const air=scene(),water=scene(),lava=scene();
  for(const [s,mat] of [[water,M.WATER],[lava,M.LAVA]])for(let y=20;y<220;y++)for(let x=20;x<220;x++)s.world.set(y*240+x,mat);
  for(const s of [air,water,lava]){s.drone.started=true;s.drone.vx=90;s.drone.angle=0;fly(s.drone,{thrust:true},20);}
  assert.ok(lava.drone.vx<water.drone.vx*.5);assert.ok(water.drone.vx<air.drone.vx);assert.ok(lava.drone.health<100);
});
