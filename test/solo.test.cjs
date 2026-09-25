const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,M}=require('../dist/simulation.js');
require('../dist/levels.js');
const {Drone}=require('../dist/flight.js');
const {Pilot}=require('../dist/ai.js');
require('../dist/tools.js');
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
  assert.equal(list.length,12);
  for(let index=0;index<list.length;index++){
    const {world,player,combat,solo}=game(index),cells=world.cells.slice();
    const counts=world.count();assert.equal(counts.reduce((sum,n)=>sum+n,0),world.size,'material totals include the entire mission map');
    assert.equal(counts[M.HARDROCK],cells.filter(k=>k===M.HARDROCK).length);
    assert.ok(player.safeSpawn(player.x,player.y));assert.equal(combat.active().length,1);
    assert.equal(combat.enabled,false);assert.equal(combat.terrainCharges,true);
    for(const station of index===0?solo.stations:[]){
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
  if(index===2){assert.equal(solo.next(),true);assert.equal(solo.mission.id,'leaking-dam');}
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

test('New engineering missions require all their physical goals together, and explosions ruin protected equipment',()=>{
  for(const index of [3,4,5,7]){
    const {solo,world,player}=game(index);assert.deepEqual(player.loadout,solo.mission.loadout);
    park(player,{x:150,y:230});solo.checkObjective(1);
    assert.equal(solo.readyToReturn,false,'a new mission must need work');
    function satisfy(goal){
      const z=goal.zone;
      for(let y=z.y;y<z.y+z.height;y++)for(let x=z.x;x<z.x+z.width;x++)world.set(y*640+x,goal.clear?M.AIR:goal.materials[0]);
    }
    satisfy(solo.goals[0]);solo.checkObjective(1);
    if(solo.goals.length>1)assert.equal(solo.readyToReturn,false,'one objective cannot stand in for the other');
    for(const goal of solo.goals)satisfy(goal);solo.checkObjective(1);assert.equal(solo.readyToReturn,true);
    const goal=solo.goals[0],z=goal.zone;
    for(let y=z.y;y<z.y+z.height;y++)for(let x=z.x;x<z.x+z.width;x++)world.set(y*640+x,goal.clear?goal.materials[0]:M.AIR);
    solo.checkObjective(1);assert.equal(solo.readyToReturn,false,'a broken repair cancels extraction');
    if(solo.mission.fragile){const f=solo.mission.fragile;world.explode(f.x,f.y,19);solo.checkObjective(1/60);assert.equal(solo.phase,'lost');}
  }
});

test('The hard shell starts sealed and real blaster impacts open a flyable route to the deliverable module',()=>{
  const {world,player,combat,solo}=game(6),station=solo.stations[0],pilot=new Pilot(combat,player);
  pilot.plan(station);assert.ok(Math.hypot(pilot.route.at(-1).x-station.x,pilot.route.at(-1).y-station.y)>19);
  for(let n=0;n<3;n++){
    park(player,{x:352,y:211});player.angle=0;player.gear.charge=1;player.gear.blasterHot=false;player.gear.blasterCooldown=0;
    assert.ok(combat.shoot(player,'blaster'));const shot=combat.projectiles.pop();
    for(let frame=0;frame<90;frame++)if(!combat.projectileStep(shot,1/60))break;
  }
  for(let n=0;n<90;n++)world.step();
  pilot.plan(station);const end=pilot.route.at(-1);assert.ok(Math.hypot(end.x-station.x,end.y-station.y)<19);
  assert.ok(pilot.passage(end.x,end.y,station.x,station.y));
  park(player,station);run(solo,50);assert.equal(solo.cargo,1);assert.equal(solo.phase,'playing');
  park(player,solo.base);run(solo,50);assert.equal(solo.phase,'won');assert.equal(solo.rescued,1);
});

function fillZone(world,zone,material){
  for(let y=zone.y;y<zone.y+zone.height;y++)for(let x=zone.x;x<zone.x+zone.width;x++)world.set(y*world.width+x,material);
}

test('A mud dam stops an established lava stream while the reservoir remains molten',()=>{
  const {world,player,combat,solo}=game(list.findIndex(m=>m.id==='lava-dam'));
  park(player,{x:150,y:240});solo.phase='playing';
  // Isolate the terrain and swept projectiles from piloting, as in the gate tests.
  function advance(n){for(let i=0;i<n;i++){
    world.step();combat.prepare(player,{},1/60);
    combat.projectiles=combat.projectiles.filter(p=>combat.projectileStep(p,1/60));
    solo.elapsed+=1/60;solo.checkObjective(1/60);
  }}
  advance(650);assert.ok(solo.readings[1].count>0,'there must be a real stream to stop');
  assert.equal(solo.readyToReturn,false);
  for(const [x,y,angle] of [[363,151,0],[365,147,.12]]){
    park(player,{x,y});player.angle=angle;assert.equal(player.collides(x,y),false);
    assert.ok(combat.shoot(player,'mud'));park(player,{x:150,y:240});advance(90);
  }
  advance(900);
  assert.ok(solo.readings[0].done);assert.equal(solo.readings[1].count,0);
  assert.ok(solo.readyToReturn);assert.ok(solo.stable>=5);assert.equal(solo.progress,1,'a clear zone that started empty is still a completed goal');
  assert.ok(solo.countZone({zone:{x:430,y:93,width:62,height:73},materials:[M.LAVA]})>300,'waiting for the entire reservoir to freeze is not the solution');
  assert.equal(world.emitting,true);assert.equal(solo.phase,'playing');
  park(player,solo.base);run(solo,50);assert.equal(solo.phase,'won');
});

test('A renewed lava leak resets the full five-second confirmation and prevents returning early',()=>{
  const {world,player,solo}=game(list.findIndex(m=>m.id==='lava-dam'));
  park(player,{x:150,y:240});
  fillZone(world,solo.goals[0].zone,M.MUD);fillZone(world,solo.goals[1].zone,M.AIR);
  solo.checkObjective(4.9);assert.equal(solo.readyToReturn,false);
  solo.checkObjective(.2);assert.equal(solo.readyToReturn,true);
  const z=solo.goals[1].zone;world.set(z.y*world.width+z.x,M.LAVA);
  park(player,solo.base);solo.checkObjective(1);assert.equal(solo.stable,0);assert.equal(solo.readyToReturn,false);assert.notEqual(solo.phase,'won');
  world.set(z.y*world.width+z.x,M.AIR);solo.checkObjective(1);assert.equal(solo.readyToReturn,false);
  fillZone(world,solo.goals[0].zone,M.BASALT);solo.checkObjective(10);
  assert.equal(solo.readyToReturn,false,'rock alone cannot stand in for the mud repair');
});

test('Archive modules and both clear pickup bays are required together at delivery',()=>{
  const {world,player,solo}=game(list.findIndex(m=>m.id==='buried-archive'));
  fillZone(world,solo.goals[0].zone,M.AIR);park(player,solo.stations[0]);run(solo,50);
  assert.equal(solo.cargo,1);assert.equal(solo.readyToReturn,false,'the other bay still needs excavation');
  fillZone(world,solo.goals[1].zone,M.AIR);park(player,solo.stations[1]);run(solo,65);
  assert.equal(solo.cargo,2);assert.equal(solo.readyToReturn,true);
  fillZone(world,solo.goals[1].zone,M.SAND);park(player,solo.base);solo.checkObjective(1);
  assert.notEqual(solo.phase,'won');assert.equal(solo.rescued,0);
  fillZone(world,solo.goals[1].zone,M.AIR);run(solo,110);
  assert.equal(solo.phase,'won');assert.equal(solo.rescued,2);
  assert.equal(solo.next(),true);assert.equal(solo.mission.id,'cooling-basin');
});

test('Cooling needs a cold bed and a water blanket; the two cisterns cannot substitute for each other',()=>{
  for(const id of ['cooling-basin','split-reservoir']){
    const {world,player,solo}=game(list.findIndex(m=>m.id===id));park(player,{x:150,y:230});
    solo.checkObjective(5);assert.equal(solo.readyToReturn,false);
    if(id==='cooling-basin'){
      fillZone(world,solo.goals[0].zone,M.AIR);
      fillZone(world,{x:394,y:331,width:98,height:4},M.BASALT);
      solo.checkObjective(5);assert.equal(solo.readyToReturn,false,'a cold dry basin is not commissioned');
      fillZone(world,{x:394,y:300,width:98,height:6},M.WATER);
    }else{
      fillZone(world,solo.goals[0].zone,M.WATER);fillZone(world,solo.goals[2].zone,M.MUD);
      solo.checkObjective(5);assert.equal(solo.readyToReturn,false,'overfilling the left basin does not fill the right');
      fillZone(world,solo.goals[1].zone,M.WATER);
    }
    solo.checkObjective(solo.holdTime);assert.equal(solo.readyToReturn,true);assert.notEqual(solo.phase,'won');
    park(player,solo.base);solo.checkObjective(1);assert.equal(solo.phase,'won');
    if(id==='split-reservoir')assert.equal(solo.next(),false);
  }
});
