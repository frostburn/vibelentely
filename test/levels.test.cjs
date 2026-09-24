const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {World,M}=require('../dist/simulation.js');
const Levels=require('../dist/levels.js');
const {Drone}=require('../dist/flight.js');
require('../dist/ai.js');
const {Combat}=require('../dist/combat.js');
const {Match}=require('../dist/match.js');
require('../dist/render.js');
const hash=cells=>createHash('sha256').update(cells).digest('hex');

test('All eight levels have different terrain and reproduce from a clean load',()=>{
  const layouts=new Set(),world=new World(),fresh=new World();
  assert.equal(Levels.list.length,8);assert.equal(new Set(Levels.list.map(l=>l.id)).size,8);
  for(const level of Levels.list){
    world.generate(level.id);const before=hash(world.cells);layouts.add(before);
    world.explode(320,200,40);world.step();world.generate(level.id);fresh.generate(level.id);
    assert.equal(hash(world.cells),before,level.id);assert.equal(hash(world.cells),hash(fresh.cells));
    assert.equal(world.effects.length,0);assert.equal(world.tick,0);assert.equal(world.theme,level.theme);
    for(let x=0;x<640;x++){assert.equal(world.cells[x],M.ROCK);assert.equal(world.cells[399*640+x],M.ROCK);}
    for(let y=0;y<400;y++){assert.equal(world.cells[y*640],M.ROCK);assert.equal(world.cells[y*640+639],M.ROCK);}
  }
  assert.equal(layouts.size,8);
  world.generate('lab');assert.equal(world.theme,null);assert.equal(world.level,null);
});

test('Every cave safely spawns both teams and gives all six enemy pilots a hull-wide route to the player',()=>{
  for(const level of Levels.list){
    const world=new World();world.generate(level.id);
    const player=new Drone(world),combat=new Combat(world,player);combat.setRoster(1,6);combat.reset();
    assert.equal(combat.actors.length,8);
    for(const [i,actor] of combat.actors.entries()){
      assert.equal(actor.health,100,level.id);assert.ok(actor.safeSpawn(actor.x,actor.y),level.id);
      for(const other of combat.actors.slice(i+1))assert.ok(Math.hypot(actor.x-other.x,actor.y-other.y)>actor.radius+other.radius+4,level.id);
      if(actor.team){
        actor.pilot.plan(player);const end=actor.pilot.route.at(-1);
        assert.ok(end&&Math.hypot(end.x-player.x,end.y-player.y)<18,level.id+' must connect the spawn chambers');
        assert.ok(actor.pilot.passage(end.x,end.y,player.x,player.y),level.id);
      }
    }
  }
});

test('Wins, losses, draws, forfeits and difficulty changes advance the same continuous level cycle',()=>{
  const world=new World();world.generate('arena');
  const combat=new Combat(world,new Drone(world)),match=new Match(world,combat),played=[];
  const results=['lost','draw','won','won','won','won','won','lost','draw','won'];
  for(const [i,result] of results.entries()){
    played.push(match.level.id);assert.equal(match.level,Levels.at(i));
    const level=match.level;match.nextRound();assert.equal(match.level,level,'live rounds cannot skip levels');
    if(result==='lost')match.forfeit();
    else{
      for(const actor of combat.active())if(result==='draw'||actor.team===1)actor.damage(100);
      match.step({brake:true});
    }
    assert.equal(match.level,level,'the result screen still shows the completed map');
    const next=match.nextLevel;assert.notEqual(next.id,level.id);
    assert.ok(match.nextRound());assert.equal(match.level,next);assert.equal(world.level,next);
    if(i===6){assert.equal(match.stage,1);assert.deepEqual(match.score,[0,0]);}
  }
  assert.equal(new Set(played.slice(0,8)).size,8);assert.equal(played[8],played[0]);
  match.start();assert.equal(match.level,Levels.at(0));assert.equal(match.battle,1);
});

test('An exhausted run cannot change level; reset starts from the first cave',()=>{
  const world=new World();world.generate('arena');const match=new Match(world,new Combat(world,new Drone(world)));
  for(let i=0;i<5;i++){match.forfeit();if(i<4)match.nextRound();}
  const level=match.level;assert.equal(match.phase,'finished');assert.equal(match.nextRound(),false);
  match.step({fire:true});assert.equal(match.level,level);match.start();assert.equal(match.level,Levels.at(0));
});

// Renderer output buffers can be checked without a browser or a native dependency.
function canvas(){return {getContext(){return {
  createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},fillRect(){},strokeRect(){},
};}};}
test('Theme changes reach the main pixel buffer and minimap, including returning to an unthemed lab',()=>{
  const world=new World();world.generate('empty');
  const renderer=new CaveRenderer(world,canvas(),canvas());
  const sample=()=>{
    for(let y=45;y<65;y++)for(let x=45;x<65;x++)world.set(y*640+x,M.WATER);
    renderer.render(0,0,null,0,5);renderer.minimap(0,0);
    return {screen:renderer.pixels[52*320+52],map:renderer.mapPixels[13*160+13]};
  };
  const original=sample();world.generate('jade-pools');const green=sample();
  world.generate('amethyst-nest');const violet=sample();
  assert.notEqual(original.screen,green.screen);assert.notEqual(green.screen,violet.screen);
  assert.notEqual(original.map,green.map);assert.notEqual(green.map,violet.map);
  world.generate('empty');assert.deepEqual(sample(),original);
  const other=new World();other.generate('jade-pools');renderer.world=other;
  renderer.minimap(0,0);assert.equal(renderer.theme,other.theme,'session switches also refresh the minimap directly');
});
