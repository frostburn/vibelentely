(function(root){
  'use strict';
  const WINS=5;
  class Match {
    constructor(world,combat){this.world=world;this.combat=combat;this.start();}
    get score(){return this.combat.score;}
    get winner(){return this.phase==='finished'?(this.score[0]>=WINS?'won':'lost'):null;}
    lineup(){return {allies:this.score[0]===0?1:0,enemies:Math.max(1,Math.min(WINS-1,this.score[0]))};}
    start(){
      this.combat.score=[0,0];this.history=[];this.round=0;this.prepareRound();
    }
    prepareRound(){
      const {allies,enemies}=this.lineup();
      this.world.generate('arena');this.world.emitting=true;
      this.combat.enabled=true;this.combat.setRoster(allies,enemies);this.combat.reset();
      this.round++;this.phase='ready';
    }
    recordResult(){
      if(!this.combat.result||this.phase==='round-over'||this.phase==='finished')return;
      this.history.push(this.combat.result);
      this.phase=this.score.some(n=>n>=WINS)?'finished':'round-over';
    }
    step(input={},dt=1/60){
      if(this.phase==='round-over'||this.phase==='finished')return;
      // Both the terrain and all pilots wait until the human is ready.
      if(this.phase==='ready'){
        if(!Object.values(input).some(Boolean))return;
        this.phase='playing';
      }
      this.world.step();this.combat.step(input,dt);this.recordResult();
    }
    nextRound(){
      if(this.phase!=='round-over')return false;
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
