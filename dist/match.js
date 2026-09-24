(function(root){
  'use strict';
  const WINS=5,Levels=root.CaveLevels;
  class Match {
    constructor(world,combat){this.world=world;this.combat=combat;this.start();}
    get nextLevel(){return Levels.at(this.battle);}
    get score(){return this.combat.score;}
    get winner(){return this.phase==='stage-over'?'won':this.phase==='finished'?'lost':null;}
    lineup(stage=this.stage){return {allies:stage===0?1:0,enemies:Math.max(1,stage)};}
    start(){
      this.combat.score=[0,0];this.history=[];this.stage=0;this.round=0;this.battle=0;this.prepareRound();
    }
    prepareRound(){
      const {allies,enemies}=this.lineup();
      this.level=Levels.at(this.battle++);
      this.world.generate(this.level.id);this.world.emitting=true;
      this.combat.enabled=true;this.combat.setRoster(allies,enemies);this.combat.reset();
      this.round++;this.phase='ready';
    }
    recordResult(){
      if(!this.combat.result||!['ready','playing'].includes(this.phase))return;
      this.history.push(this.combat.result);
      this.phase=this.score[0]>=WINS?'stage-over':this.score[1]>=WINS?'finished':'round-over';
    }
    step(input={},dt=1/60){
      if(!['ready','playing'].includes(this.phase))return;
      // Both the terrain and all pilots wait until the human is ready.
      if(this.phase==='ready'){
        if(!Object.values(input).some(Boolean))return;
        this.phase='playing';
      }
      this.world.step();this.combat.step(input,dt);this.recordResult();
    }
    nextRound(){
      if(this.phase==='stage-over'){
        this.stage++;this.combat.score=[0,0];this.round=0;
      }else if(this.phase!=='round-over')return false;
      this.prepareRound();return true;
    }
    forfeit(){
      if(this.phase!=='ready'&&this.phase!=='playing')return false;
      this.combat.finish('lost');this.recordResult();return true;
    }
  }
  root.CaveMatch={Match,WINS};
  if(typeof module!=='undefined')module.exports=root.CaveMatch;
})(globalThis);
