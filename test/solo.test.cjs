const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,M}=require('../dist/simulation.js');
require('../dist/levels.js');
const {Drone}=require('../dist/flight.js');
const {Pilot}=require('../dist/ai.js');
const {Combat}=require('../dist/combat.js');
const {Solo,list}=require('../dist/solo.js');

function game(index=0){
  const world=new World();world.generate('empty');
  const player=new Drone(world),combat=new Combat(world,player),solo=new Solo(world,combat,index);
  return {world,player,combat,solo};
}
function park(player,point){Object.assign(player,{x:point.x,y:point.y,vx:0,vy:0,spin:0,angle:-Math.PI/2});}
function run(solo,n){for(let i=0;i<n;i++)solo.step({brake:true});}

test('Solo missions wait for input, have safe reachable docks, and retry a pristine map and equipment',()=>{
  assert.equal(list.length,3);
  for(let index=0;index<list.length;index++){
    const {world,player,combat,solo}=game(index),cells=world.cells.slice();
    assert.ok(player.safeSpawn(player.x,player.y));assert.equal(combat.active().length,1);
    assert.equal(combat.enabled,false);assert.equal(combat.terrainCharges,true);
    for(const station of solo.stations){
      const pilot=new Pilot(combat,player);pilot.plan(station);const end=pilot.route.at(-1);
      assert.ok(end&&Math.hypot(end.x-station.x,end.y-station.y)<19,'each shelter has a hull-wide route');
      assert.ok(pilot.passage(end.x,end.y,station.x,station.y));
    }
    for(let n=0;n<30;n++)solo.step();
    assert.equal(world.tick,0);assert.equal(solo.elapsed,0);assert.equal(combat.time,0);
    run(solo,1);assert.equal(solo.phase,'playing');assert.equal(combat.result,null);
    world.explode(320,190);player.payload=2;combat.shoot(player,'grenade');player.health=13;
    solo.start();assert.ok(Buffer.from(cells).equals(Buffer.from(world.cells)));
    assert.equal(world.tick,0);assert.equal(world.effects.length,0);assert.equal(combat.projectiles.length,0);
    assert.equal(player.health,100);assert.equal(player.payload,0);assert.equal(player.gear.grenades,3);
    assert.equal(solo.phase,'ready');assert.equal(solo.next(),false);
  }
});

test('Rescue needs slow docking, carries at most two, and only counts delivered passengers',()=>{
  const {player,solo,combat,world}=game(),first=solo.stations[0],second=solo.stations[1];
  park(player,first);player.vx=30;solo.checkObjective(1);assert.equal(solo.cargo,0,'a flyby cannot pick up');
  park(player,first);world.set(first.y*640+first.x+1,M.ROCK);player.x+=3;
  solo.checkObjective(1);assert.equal(solo.cargo,0,'a wall prevents docking through terrain');
  solo.start();park(player,solo.stations[0]);run(solo,100);
  assert.equal(solo.cargo,2);assert.equal(player.payload,2);assert.equal(solo.rescued,0);
  park(player,solo.stations[1]);run(solo,100);
  assert.equal(solo.cargo,2);assert.equal(solo.stations[1].waiting,1,'full craft leaves the last passenger waiting');
  park(player,solo.base);run(solo,50);assert.equal(solo.cargo,0);assert.equal(solo.rescued,2);assert.equal(player.payload,0);
  park(player,solo.stations[1]);run(solo,50);assert.equal(solo.cargo,1);assert.equal(solo.phase,'playing');
  park(player,solo.base);run(solo,50);assert.equal(solo.rescued,3);assert.equal(solo.phase,'won');
  assert.equal(combat.result,'won');assert.deepEqual(combat.score,[0,0]);
  const tick=world.tick,best=solo.records.rescue;run(solo,50);assert.equal(world.tick,tick);assert.equal(solo.records.rescue,best);
  assert.ok(solo.next());assert.equal(solo.mission.id,'waterworks');assert.equal(player.payload,0);assert.equal(solo.records.rescue,best);
});

test('Passengers reduce engine acceleration and respawning clears the payload',()=>{
  const world=new World();world.generate('empty');
  const empty=new Drone(world),loaded=new Drone(world);loaded.payload=2;
  empty.step({thrust:true});loaded.step({thrust:true});
  assert.ok(loaded.vy>empty.vy,'loaded craft gains less upward speed from the same engine');
  loaded.respawn();assert.equal(loaded.payload,0);
});

// Launch with the actual weapon and integrate the swept projectile collision and
// fuse. Moving the fixture's pilot aside isolates demolition from flight control.
function openGate(combat,gate){
  const player=combat.player;park(player,{x:gate.x,y:gate.y+45});
  assert.equal(player.collides(player.x,player.y),false,'the firing position fits a craft');
  player.gear.grenade=0;assert.ok(combat.shoot(player,'grenade'));
  const shot=combat.projectiles.pop();park(player,{x:155,y:285});
  const effects=combat.world.effects.length;let attached=false,contact;
  for(let n=0;n<90;n++){
    if(!combat.projectileStep(shot,1/60))break;
    if(shot.stuck){
      if(!attached)contact={x:shot.x,y:shot.y};
      attached=true;assert.equal(shot.x,contact.x);assert.equal(shot.y,contact.y);
    }
  }
  assert.ok(attached,'the charge must attach to the underside of the gate');
  assert.equal(combat.world.effects.length,effects+1,'one explosion at the end of the original fuse');
  assert.ok(Math.hypot(shot.x-gate.x,shot.y-gate.y)<19,'the blast reaches the gate');
}

for(const index of [1,2])test(list[index].name+': demolition charges release real material; a stable target and return are required',()=>{
  const {world,player,combat,solo}=game(index);
  run(solo,150);assert.equal(solo.amount,0);assert.equal(solo.phase,'playing');
  for(const gate of solo.mission.gates)openGate(combat,gate);
  run(solo,700);
  assert.ok(solo.amount>=solo.mission.goal,solo.mission.id+' must receive enough material from its reservoir');
  assert.ok(solo.readyToReturn);assert.equal(solo.phase,'playing','filling alone does not end the mission');
  park(player,solo.base);run(solo,50);assert.equal(solo.phase,'won');assert.ok(solo.records[solo.mission.id]>0);
  const tick=world.tick;run(solo,10);assert.equal(world.tick,tick);
  if(index===2)assert.equal(solo.next(),false,'the last mission returns to the menu via the app');
});

test('Only the requested material inside the marked basin counts, and loss of fill cancels extraction',()=>{
  const {world,player,solo}=game(1),z=solo.mission.zone;
  function fill(material){for(let y=z.y;y<z.y+12;y++)for(let x=z.x;x<z.x+z.width;x++)world.set(y*640+x,material);}
  park(player,{x:150,y:270});fill(M.SAND);solo.checkObjective(2);assert.equal(solo.amount,0);
  fill(M.WATER);solo.checkObjective(.5);assert.equal(solo.readyToReturn,false);
  solo.checkObjective(.5);assert.equal(solo.readyToReturn,true);
  fill(M.AIR);park(player,solo.base);solo.checkObjective(1);assert.equal(solo.readyToReturn,false);assert.notEqual(solo.phase,'won');
});

test('Destruction, a burning occupied shelter, and the rescue deadline fail once and freeze the mission',()=>{
  for(const failure of ['ship','shelter','deadline']){
    const {world,player,solo}=game();
    if(failure==='ship')player.damage(100);
    if(failure==='shelter'){const s=solo.stations[0];world.set(s.y*640+s.x,M.LAVA);world.set((s.y+1)*640+s.x,M.ROCK);}
    if(failure==='deadline')solo.elapsed=solo.mission.limit-1/120;
    run(solo,1);assert.equal(solo.phase,'lost',failure);assert.deepEqual(solo.records,{});
    const tick=world.tick,elapsed=solo.elapsed;run(solo,30);assert.equal(world.tick,tick);assert.equal(solo.elapsed,elapsed);
    assert.equal(solo.next(),false);solo.start();assert.equal(solo.phase,'ready');assert.equal(solo.remaining,180);
  }
});
