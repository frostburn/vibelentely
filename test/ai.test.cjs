const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,M}=require('../dist/simulation.js');
const {Drone}=require('../dist/flight.js');
require('../dist/ai.js');
const {Combat}=require('../dist/combat.js');

test('Planning checks only short, bounded connections from the craft, even when trapped',()=>{
  const world=new World();world.generate('arena');
  const combat=new Combat(world,new Drone(world)),ai=combat.ai,enemy=combat.enemy;
  const passage=ai.passage.bind(ai),connections=[];
  ai.passage=(ax,ay,bx,by)=>{
    if(ax===enemy.x&&ay===enemy.y)connections.push(Math.hypot(bx-ax,by-ay));
    return passage(ax,ay,bx,by);
  };
  const goal={x:333,y:128};
  ai.plan(goal);assert.ok(ai.route.length>0);
  assert.ok(connections.length<=25,'start selection must not scan the map with rays');
  assert.ok(connections.every(d=>d<60),'start connections must stay near the craft');

  world.brush(enemy.x,enemy.y,14,M.ROCK,true);connections.length=0;
  ai.plan(goal);assert.deepEqual(ai.route,[]);
  assert.ok(connections.length<=25);assert.ok(connections.every(d=>d<60));
});

test('Planning tries another local grid node when the nearest centers are obstructed',()=>{
  const world=new World(320,240);world.spawn={x:80,y:110};world.enemySpawn={x:160,y:112};
  const combat=new Combat(world,new Drone(world)),ai=combat.ai,enemy=combat.enemy;
  // The craft fits between these obstacles; only the lower-right nearest node is open.
  for(const [x,y] of [[152,104],[168,104],[152,120]])world.brush(x,y,1,M.ROCK);
  assert.equal(enemy.collides(enemy.x,enemy.y),false);
  const passage=ai.passage.bind(ai),starts=[];
  ai.passage=(ax,ay,bx,by)=>{
    const clear=passage(ax,ay,bx,by);
    if(ax===enemy.x&&ay===enemy.y&&clear)starts.push({x:bx,y:by});
    return clear;
  };
  ai.plan({x:220,y:180});
  assert.deepEqual(starts,[{x:168,y:120}]);assert.ok(ai.route.length>0);
  assert.ok(ai.route.every(p=>!enemy.collides(p.x,p.y)));
});
