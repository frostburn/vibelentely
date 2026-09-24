const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,M}=require('../dist/simulation.js');
require('../dist/levels.js');
const {Drone}=require('../dist/flight.js');
require('../dist/ai.js');
const {Combat}=require('../dist/combat.js');
const {Match}=require('../dist/match.js');

function game(){
  const world=new World();world.generate('arena');
  const player=new Drone(world),combat=new Combat(world,player),match=new Match(world,combat);
  return {world,player,combat,match};
}
function endRound(match,result){
  for(const actor of match.combat.active())if(result==='draw'||actor.team===(result==='won'?1:0))actor.damage(100);
  match.step({brake:true});
}

test('Each lineup lasts five wins; only then does the next stage start at 0–0',()=>{
  const {world,combat,match}=game(),initial=world.cells.slice();
  for(let i=0;i<60;i++)match.step();
  assert.equal(world.tick,0);assert.equal(combat.time,0);assert.deepEqual(world.cells,initial);
  assert.equal(match.nextRound(),false);
  // Continue beyond 1v4 as well: progression has no arbitrary final stage.
  for(let stage=0;stage<7;stage++){
    for(let wins=0;wins<5;wins++){
      assert.equal(match.stage,stage);
      assert.equal(combat.living(0).length,stage===0?2:1);
      assert.equal(combat.living(1).length,Math.max(1,stage));
      endRound(match,'won');assert.deepEqual(match.score,[wins+1,0]);
      const tick=world.tick;
      for(let i=0;i<10;i++)match.step({fire:true});
      assert.equal(world.tick,tick);assert.deepEqual(match.score,[wins+1,0]);
      assert.equal(match.phase,wins===4?'stage-over':'round-over');
      assert.equal(match.winner,wins===4?'won':null);
      assert.equal(match.forfeit(),false);
      assert.equal(match.stage,stage,'the results screen still belongs to the completed stage');
      assert.equal(match.nextRound(),true);
      assert.equal(match.stage,stage+(wins===4?1:0));
      assert.deepEqual(match.score,wins===4?[0,0]:[wins+1,0]);
    }
    assert.equal(match.round,1);assert.equal(match.phase,'ready');
  }
  assert.equal(match.history.length,35);
  match.start();assert.equal(match.stage,0);assert.equal(match.round,1);
  assert.deepEqual(match.score,[0,0]);assert.equal(combat.living(0).length,2);
});

test('Losses keep the current lineup and five enemy wins end the run',()=>{
  const {combat,match}=game();
  for(let n=0;n<5;n++){endRound(match,'won');match.nextRound();}
  endRound(match,'won');match.nextRound();endRound(match,'won');match.nextRound();
  for(let n=0;n<5;n++){
    assert.equal(match.stage,1);
    assert.equal(combat.living(0).length,1);assert.equal(combat.living(1).length,1);
    endRound(match,'lost');assert.deepEqual(match.score,[2,n+1]);
    assert.equal(match.nextRound(),n<4);
  }
  assert.equal(match.winner,'lost');assert.equal(match.phase,'finished');assert.equal(match.round,7);
  assert.equal(match.forfeit(),false);
  match.step({fire:true});assert.deepEqual(match.score,[2,5]);
});

test('A draw at 4–4 neither advances the stage nor scores; a subsequent win resets both scores',()=>{
  const {match}=game();
  for(let n=0;n<4;n++){
    endRound(match,'won');match.nextRound();endRound(match,'lost');match.nextRound();
  }
  endRound(match,'draw');
  assert.deepEqual(match.score,[4,4]);assert.equal(match.phase,'round-over');assert.equal(match.stage,0);
  assert.equal(match.history.at(-1),'draw');match.nextRound();
  assert.deepEqual(match.lineup(),{allies:1,enemies:1});assert.equal(match.round,10);
  endRound(match,'won');assert.deepEqual(match.score,[5,4]);assert.equal(match.phase,'stage-over');
  match.nextRound();assert.deepEqual(match.score,[0,0]);assert.equal(match.stage,1);
  assert.deepEqual(match.lineup(),{allies:0,enemies:1});assert.equal(match.round,1);
});

test('An ally continues after the human dies and can still win the round',()=>{
  const {player,combat,match}=game();match.step({brake:true});
  const ally=combat.living(0).find(a=>a!==player),before={x:ally.x,y:ally.y};
  player.damage(100);
  for(let n=0;n<30;n++)match.step({});
  assert.equal(match.phase,'playing');assert.equal(combat.result,null);
  assert.ok(Math.hypot(ally.x-before.x,ally.y-before.y)>1);assert.ok(ally.pilot.target.team===1);
  combat.enemy.damage(100);match.step();assert.equal(combat.result,'won');assert.deepEqual(match.score,[1,0]);
});

test('Every enemy must be eliminated; pilots retarget living opponents, never allies',()=>{
  const {combat,match,player}=game();
  combat.setRoster(1,3);combat.reset();match.step({brake:true});
  const ally=combat.living(0).find(a=>a!==player),enemies=combat.living(1);
  for(const actor of combat.active().filter(a=>a.pilot))assert.equal(actor.pilot.target.team,1-actor.team);
  player.damage(100);match.step();
  for(const enemy of enemies)assert.equal(enemy.pilot.target,ally);
  enemies[0].damage(100);match.step();assert.equal(combat.result,null);
  enemies[1].damage(100);match.step();assert.equal(combat.result,null);
  enemies[2].damage(100);match.step();assert.equal(combat.result,'won');
});

test('Each difficulty spawns separate, healthy craft in clear, cool space',()=>{
  const {world,combat,match}=game();
  for(let stage=0;stage<7;stage++){
    match.stage=stage;combat.score=[0,0];match.prepareRound();
    for(const [i,actor] of combat.actors.entries()){
      assert.equal(actor.health,100);assert.equal(actor.safeSpawn(actor.x,actor.y),true);
      for(const other of combat.actors.slice(i+1))assert.ok(Math.hypot(actor.x-other.x,actor.y-other.y)>actor.radius+other.radius+4);
    }
    const nextLevel=match.nextLevel.id;world.brush(260,165,9,M.ROCK,true);
    combat.player.gear.grenades=0;combat.player.gear.blink=3;
    endRound(match,'won');
    match.nextRound();
    const pristine=new World();pristine.generate(nextLevel);
    assert.equal(world.level.id,nextLevel);
    assert.ok(Buffer.from(world.cells).equals(Buffer.from(pristine.cells)),'the next map must be pristine');
    assert.equal(combat.player.gear.grenades,3);assert.equal(combat.player.gear.blink,0);
    assert.equal(combat.started,false);
  }
});

test('Forfeiting costs exactly one enemy point and cannot heal a live round for free',()=>{
  const {player,combat,match}=game();player.health=32;
  assert.equal(match.forfeit(),true);assert.equal(match.forfeit(),false);
  assert.deepEqual(match.score,[0,1]);assert.equal(combat.result,'lost');assert.equal(player.health,32);
  match.nextRound();assert.equal(player.health,100);assert.deepEqual(match.score,[0,1]);
});

test('Team shots pass through allies; blasts protect allies but still hurt the owner and enemies',()=>{
  const {world,combat,player}=game();world.clear();combat.setRoster(1,1);combat.reset();
  const ally=combat.living(0).find(a=>a!==player),enemy=combat.enemy;
  Object.assign(player,{x:150,y:150,angle:0});Object.assign(ally,{x:175,y:150});Object.assign(enemy,{x:210,y:150});
  const p={kind:'pulse',owner:player,x:158,y:150,vx:230,vy:0,age:0,life:1};
  for(let i=0;i<30;i++)if(!combat.projectileStep(p,1/60))break;
  assert.equal(ally.health,100);assert.equal(enemy.health,91);
  Object.assign(enemy,{x:185,y:150});combat.detonate({owner:player,x:165,y:150});combat.blasts();
  assert.equal(ally.health,100);assert.ok(player.health<100);assert.ok(enemy.health<91);
  world.explode(ally.x,ally.y,12);combat.blasts();assert.ok(ally.health<100,'environmental explosions remain dangerous');
});

test('Pilots choose the nearest enemy and stagger expensive planning across frames',()=>{
  const {combat,player}=game();combat.setRoster(1,4);combat.reset();
  const ally=combat.living(0).find(a=>a!==player),enemy=combat.enemy;
  ally.x=enemy.x-30;ally.y=enemy.y;player.x=enemy.x-120;player.y=enemy.y;
  combat.step({brake:true});assert.equal(enemy.pilot.target,ally);
  const pilots=combat.actors.filter(a=>a.pilot).map(a=>a.pilot);
  assert.equal(pilots.filter(p=>p.plans>0).length,1);
  assert.equal(new Set(pilots.map(p=>p.planIn)).size,pilots.length);
});

test('The ally fights with ordinary weapons during live play',()=>{
  const {combat,match,player}=game();const ally=combat.living(0).find(a=>a!==player);
  const start={x:ally.x,y:ally.y};let fired=false;
  for(let n=0;n<900&&!combat.result;n++){
    match.step({brake:true});fired||=combat.projectiles.some(p=>p.owner===ally);
  }
  assert.ok(fired,'ally must reach a firing position and shoot');
  assert.ok(Math.hypot(ally.x-start.x,ally.y-start.y)>20);
  assert.ok(ally.pilot.plans>1);
});
