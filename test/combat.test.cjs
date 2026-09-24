const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,M}=require('../dist/simulation.js');
const {Drone}=require('../dist/flight.js');
require('../dist/ai.js');
const {Combat}=require('../dist/combat.js');
function scene(){
  const world=new World(320,240);world.spawn={x:80,y:110};world.enemySpawn={x:220,y:110};
  const player=new Drone(world),combat=new Combat(world,player);
  return {world,player,combat,enemy:combat.enemy};
}
function advance(c,input,n){for(let i=0;i<n;i++)c.step(input);}
function shot(kind,owner,x,y,vx,vy=0){return {kind,owner,x,y,vx,vy,age:0,life:1.4};}
function flyShot(c,p,steps=120){for(let n=0;n<steps;n++)if(!c.projectileStep(p,1/60))break;}

test('Pulse shots dig soft terrain but cannot tunnel through a one-cell rock wall',()=>{
  const {world,player,combat,enemy}=scene();
  for(let y=1;y<239;y++)world.set(y*320+150,M.ROCK);
  flyShot(combat,shot('pulse',player,90,110,900));assert.equal(enemy.health,100);assert.equal(world.cells[110*320+150],M.ROCK);
  world.set(110*320+150,M.MUD);flyShot(combat,shot('pulse',player,145,110,230));assert.equal(world.cells[110*320+150],M.AIR);
  flyShot(combat,shot('pulse',player,175,110,230));assert.equal(enemy.health,91);
});
test('Pulse overheats and recovers; shield suppresses every weapon while consuming energy',()=>{
  const {player,combat}=scene();combat.setOpponent(false);player.angle=0;
  let overheated=false;
  for(let n=0;n<180;n++){combat.step({fire:true,brake:true});overheated||=player.gear.overheated;}
  assert.ok(overheated);advance(combat,{brake:true},180);assert.equal(player.gear.overheated,false);
  const before=[player.gear.grenades,player.gear.water];advance(combat,{shield:true,fire:true,grenade:true,water:true,brake:true},20);
  assert.deepEqual([player.gear.grenades,player.gear.water],before);assert.ok(player.gear.energy<100);
  advance(combat,{shield:true,brake:true},240);assert.ok(player.gear.shieldLock>0||player.gear.energy<25);
});
test('The directional shield blocks front shots and reflects grenades, but not rear shots',()=>{
  const {player,combat,enemy}=scene();enemy.angle=Math.PI;enemy.gear.shield=true;
  flyShot(combat,shot('pulse',player,170,110,230));assert.equal(enemy.health,100);assert.ok(enemy.gear.energy<100);
  const grenade=shot('grenade',player,207,110,95);
  for(let n=0;n<12;n++){if(!combat.projectileStep(grenade,1/60))break;if(grenade.vx<0)break;}
  assert.ok(grenade.vx<0);assert.equal(enemy.health,100);
  flyShot(combat,shot('pulse',player,260,110,-230));assert.equal(enemy.health,91);
});
test('Grenades inherit momentum, bounce, detonate once, damage the owner and replenish',()=>{
  const {world,player,combat,enemy}=scene();player.angle=0;player.vx=30;
  combat.shoot(player,'grenade');const p=combat.projectiles.pop();assert.equal(p.vx,125);
  for(let y=1;y<239;y++)world.set(y*320+110,M.ROCK);
  for(let n=0;n<50&&p.vx>0;n++)combat.projectileStep(p,1/60);
  assert.ok(p.vx<0,'wall should reflect grenade velocity');
  p.x=player.x+8;p.y=player.y;p.life=.001;assert.equal(combat.projectileStep(p,1/60),false);
  const before=player.health;combat.blasts();assert.ok(player.health<before);const health=player.health;combat.blasts();assert.equal(player.health,health);
  assert.equal(world.effects.filter(e=>e.radius===19).length,1);
  player.gear.grenades=0;for(let n=0;n<241;n++)combat.prepare(player,{},1/60);assert.equal(player.gear.grenades,1);
  assert.equal(enemy.health,100);
});
test('Water pushes craft and grains, cools lava without changing volume, and refills from a shallow pool',()=>{
  const {world,player,combat,enemy}=scene();
  flyShot(combat,shot('water',player,205,110,155));assert.ok(enemy.vx>10);assert.equal(enemy.health,100);
  const sand=130*320+130;world.set(sand,M.SAND);const count=world.count()[M.SAND];
  combat.waterImpact(shot('water',player,128,130,155));assert.equal(world.count()[M.SAND],count);assert.notEqual(world.cells[sand],M.SAND);
  world.set(130*320+145,M.LAVA,700);world.lavaFill[130*320+145]=99;const volume=world.lavaVolume();
  combat.waterImpact(shot('water',player,143,130,155));assert.equal(world.cells[130*320+145],M.BASALT);assert.equal(world.lavaVolume(),volume);
  player.gear.water=0;world.set(112*320+80,M.WATER);
  for(let i=0;i<60;i++)combat.prepare(player,{},1/60);assert.ok(player.gear.water>70,'any sampled water must refill reliably');
  player.gear.water=0;assert.equal(combat.shoot(player,'water'),false);
});
test('Blink crosses a thin wall into hull-sized free space, keeps momentum and never edits terrain',()=>{
  const {world,player,combat}=scene();player.angle=0;player.vx=28;player.vy=-13;
  for(let y=1;y<239;y++)world.set(y*320+105,M.ROCK);
  const before=world.cells.slice();assert.ok(combat.blink(player));assert.equal(player.x,134);assert.equal(player.y,110);
  assert.equal(player.vx,28);assert.equal(player.vy,-13);assert.deepEqual(world.cells,before);
  assert.equal(combat.blink(player),false,'cooldown cannot be bypassed');
  for(let n=0;n<260;n++)combat.prepare(player,{blink:true},1/60);
  assert.equal(player.x,134,'holding the trigger must not blink again when charged');
  combat.prepare(player,{blink:false},1/60);combat.prepare(player,{blink:true},1/60);assert.equal(player.x,188);
});
test('Blink rejects sealed destinations, lava, map edges and another craft without spending charge',()=>{
  const {world,player,combat,enemy}=scene();player.angle=0;
  for(let x=92;x<150;x++)for(let y=85;y<137;y++)world.set(y*320+x,M.ROCK);
  assert.equal(combat.blink(player),false);assert.equal(player.gear.blink,0);
  for(let x=92;x<150;x++)for(let y=85;y<137;y++)world.set(y*320+x,M.LAVA);
  assert.equal(combat.blink(player),false);assert.equal(player.gear.blink,0);
  world.clear();enemy.x=134;enemy.y=110;const target=combat.blinkTarget(player);
  assert.ok(target&&Math.hypot(target.x-enemy.x,target.y-enemy.y)>=14);
  player.x=309;assert.equal(combat.blink(player),false);assert.equal(player.gear.blink,0);
});
test('A round waits for input, scores once, and restarts without replacing edited terrain',()=>{
  const {world,player,combat,enemy}=scene();advance(combat,{},60);assert.equal(combat.time,0);assert.equal(enemy.started,false);
  combat.step({shield:true});assert.ok(combat.time>0);assert.equal(enemy.started,true);
  enemy.damage(100);combat.step({});assert.equal(combat.result,'won');assert.deepEqual(combat.score,[1,0]);
  advance(combat,{fire:true},120);assert.deepEqual(combat.score,[1,0]);
  world.brush(50,50,5,M.ROCK);const before=world.cells.slice();combat.reset();assert.deepEqual(world.cells,before);
  assert.equal(player.health,100);assert.equal(enemy.health,100);assert.equal(player.started,false);assert.equal(combat.projectiles.length,0);assert.equal(combat.result,null);
});
test('AI replans a hull-wide route around rock and only shoots with a clear sightline',()=>{
  const {world,player,combat,enemy}=scene();enemy.x=230;enemy.y=120;player.x=75;player.y=120;
  for(let y=65;y<165;y++)for(let x=144;x<151;x++)world.set(y*320+x,M.ROCK);
  combat.ai.plan({x:90,y:120});assert.ok(combat.ai.route.length>5);
  assert.ok(combat.ai.route.some(p=>p.y<59||p.y>171));
  assert.ok(combat.ai.route.every(p=>!enemy.collides(p.x,p.y)));
  enemy.angle=Math.PI;assert.equal(combat.ai.step(1/60).fire,false);
  for(let y=65;y<165;y++)for(let x=144;x<151;x++)world.set(y*320+x,M.AIR);
  assert.equal(combat.ai.step(1/60).fire,true);
});
test('AI wins a live arena round against an idle braking craft using normal projectiles',()=>{
  const world=new World();world.generate('arena');const player=new Drone(world),combat=new Combat(world,player);
  let fired=false;
  for(let n=0;n<1800&&!combat.result;n++){
    world.step();combat.step({brake:true});fired||=combat.projectiles.some(p=>p.owner===combat.enemy);
  }
  assert.ok(fired);assert.ok(player.health<100);assert.equal(combat.result,'lost');assert.ok(combat.enemy.health>0);
});
test('AI physically flies around cover to attack a hovering target, rather than waiting at a blind waypoint',()=>{
  const {world,player,combat,enemy}=scene();player.x=75;player.y=120;enemy.x=230;enemy.y=120;
  for(let y=50;y<175;y++)for(let x=144;x<151;x++)world.set(y*320+x,M.ROCK);
  let rounded=false;
  for(let n=0;n<1200&&!combat.result;n++){
    combat.step({thrust:34/115,brake:true});rounded||=enemy.x<144&&enemy.y<50;
  }
  assert.ok(rounded);assert.equal(combat.result,'lost');assert.equal(enemy.health,100);
});
