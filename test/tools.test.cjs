const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,M}=require('../dist/simulation.js');
const {Drone}=require('../dist/flight.js');
require('../dist/ai.js');
const Tools=require('../dist/tools.js');
const {Combat}=require('../dist/combat.js');
function game(){
  const world=new World(320,240);world.spawn={x:80,y:110};
  const player=new Drone(world),combat=new Combat(world,player);combat.enabled=false;
  player.angle=0;return {world,player,combat};
}
function control(combat,input,n=1){for(let i=0;i<n;i++){combat.prepare(combat.player,input,1/60);Tools.use(combat,combat.player,input,1/60);}}
function rect(world,x0,y0,x1,y1,mat){for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)world.set(y*world.width+x,mat);}

test('Two distinct tool slots dispatch their selected weapons and changing loadout preserves heat and ammunition',()=>{
  const {player,combat}=game();
  assert.ok(Tools.setLoadout(player,['mud','vacuum']));assert.equal(Tools.setLoadout(player,['mud','mud']),false);
  assert.equal(Tools.setLoadout(player,['bogus','water']),false);
  control(combat,{tool1:true});assert.equal(combat.projectiles[0].kind,'mud');assert.equal(player.gear.mudAmmo,1);
  player.gear.charge=1;player.gear.blasterHeat=.9;player.gear.vacuumHeat=.7;
  Tools.setLoadout(player,['blaster','water']);
  assert.equal(player.gear.charge,0);assert.equal(player.gear.mudAmmo,1);assert.equal(player.gear.blasterHeat,.9);assert.equal(player.gear.vacuumHeat,.7);
  combat.reset();assert.equal(player.gear.mudAmmo,2);assert.equal(player.gear.blasterHeat,0);assert.deepEqual(player.loadout,['blaster','water']);
});

test('Mud bombs deposit bounded real mud on impact, without deleting rock, and refill slowly',()=>{
  const {world,player,combat}=game();Tools.setLoadout(player,['mud','water']);rect(world,120,75,124,155,M.ROCK);
  const rock=world.cells.filter(k=>k===M.ROCK).length;
  control(combat,{tool1:true});const p=combat.projectiles.pop();let active=true;
  for(let n=0;n<90&&active;n++)active=combat.projectileStep(p,1/60);
  const mud=world.cells.filter(k=>k===M.MUD).length;
  assert.equal(active,false);assert.ok(mud>100&&mud<=377);assert.equal(world.cells.filter(k=>k===M.ROCK).length,rock);
  assert.equal(world.effects.length,0,'mud is not a damaging explosion');
  control(combat,{},359);assert.equal(player.gear.mudAmmo,1);control(combat,{},2);assert.equal(player.gear.mudAmmo,2);
});

test('Vacuum consumes sand, water and mud, respects walls and range, and overheats on lava without storing cargo',()=>{
  for(const material of [M.SAND,M.WATER,M.MUD]){
    const {world,player,combat}=game();Tools.setLoadout(player,['vacuum','mud']);
    rect(world,92,100,102,120,material);rect(world,111,70,113,150,M.ROCK);rect(world,116,100,121,120,material);
    rect(world,145,105,151,115,material);
    const before=world.cells.filter(k=>k===material).length;control(combat,{tool1:true},20);
    assert.ok(world.cells.filter(k=>k===material).length<before);assert.equal(world.cells[110*320+118],material);
    assert.equal(world.cells[110*320+147],material);assert.equal(player.payload,0);
  }
  const {world,player,combat}=game();Tools.setLoadout(player,['vacuum','mud']);rect(world,94,98,108,122,M.LAVA);
  const volume=()=>world.lavaFill.reduce((sum,v)=>sum+v,0);
  const before=volume();control(combat,{tool1:true});assert.ok(player.gear.vacuumHot);assert.equal(player.gear.vacuumHeat,1);
  assert.ok(volume()<before);const cells=world.cells.slice();control(combat,{tool1:true},30);
  assert.deepEqual(world.cells,cells,'hot vacuum must stop consuming');control(combat,{},220);assert.equal(player.gear.vacuumHot,false);
});

test('Blaster fires only on a fully charged release, fast enough to need swept collision, and breaks hard rock',()=>{
  const {world,player,combat}=game();Tools.setLoadout(player,['blaster','water']);
  rect(world,132,75,150,155,M.HARDROCK);
  control(combat,{tool1:true},60);control(combat,{});assert.equal(combat.projectiles.length,0);
  assert.equal(combat.shoot(player,'blaster'),false,'direct fire also rejects an incomplete charge');
  control(combat,{tool1:true},73);assert.equal(player.gear.charge,1);assert.equal(combat.projectiles.length,0);
  control(combat,{});const shot=combat.projectiles.pop();assert.equal(shot.kind,'blaster');assert.equal(shot.vx,430);
  const before=world.cells.filter(k=>k===M.HARDROCK).length;
  for(let i=0;i<30;i++)if(!combat.projectileStep(shot,1/60))break;
  assert.equal(world.effects.length,1);assert.equal(world.effects[0].radius,30);assert.equal(world.effects[0].power,125);
  assert.ok(world.cells.filter(k=>k===M.HARDROCK).length<before);assert.ok(shot.x<133,'the shot must not tunnel through the wall');
});

test('Holding a full blaster overheats and discards it; cooling while held cannot restart a charge',()=>{
  const {player,combat}=game();Tools.setLoadout(player,['blaster','vacuum']);
  control(combat,{tool1:true},172);assert.equal(player.gear.blasterHot,true);assert.equal(player.gear.charge,0);assert.equal(combat.projectiles.length,0);
  control(combat,{tool1:true},300);assert.equal(player.gear.blasterHot,false);assert.equal(player.gear.charge,0);
  control(combat,{});assert.equal(combat.projectiles.length,0);control(combat,{tool1:true},73);assert.equal(player.gear.charge,1);
  Tools.cancel(player);control(combat,{});assert.equal(combat.projectiles.length,0,'pause/menu cancellation is not a firing release');
  control(combat,{tool1:true},73);control(combat,{shield:true});assert.equal(combat.projectiles.length,0,'shielding cancels the charge safely');
});

test('Hard rock blocks flight, sight, blink and ordinary explosions; blast damage still respects teams',()=>{
  const {world,player,combat}=game();rect(world,100,1,180,239,M.HARDROCK);
  assert.equal(player.collides(104,110),true);assert.equal(combat.sight(80,110,190,110),false);assert.equal(combat.blinkTarget(player),null);
  const before=world.cells.filter(k=>k===M.HARDROCK).length;world.explode(115,110,19);
  assert.equal(world.cells.filter(k=>k===M.HARDROCK).length,before);
  world.clear();combat.setRoster(1,1);combat.enabled=true;combat.reset();
  const ally=combat.actors.find(a=>a!==player&&a.team===0),enemy=combat.enemy;
  Object.assign(player,{x:160,y:110});Object.assign(ally,{x:132,y:110});Object.assign(enemy,{x:180,y:110});
  combat.detonate({kind:'blaster',owner:player,x:160,y:110});combat.blasts();
  assert.equal(player.dead,true);assert.ok(enemy.health<100);assert.equal(ally.health,100);
});
