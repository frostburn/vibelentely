(function(root){
  'use strict';
  const {M}=root.CaveSim,{Builder,get}=root.CaveLevels;
  const BASE={x:88,y:302};
  const list=[
    {
      id:'rescue',name:'Pelastuspartio',theme:get('basalt-steps').theme,limit:180,
      briefing:'Pelasta kolme kaivostyöläistä kahdelta suojalta ja tuo heidät vihreälle kotiasemalle. Aikaa on 3 minuuttia.',
      hint:'Laskeudu tai jarruta merkin kohdalle. Kyytiin mahtuu kaksi; lasti vähentää moottorin kiihtyvyyttä. Vesi jäähdyttää laavan.',
      objective:'Kaikki kolme kotiin',
      build(b){
        b.ellipse(320,205,297,167);
        b.rock([[179,262],[260,218],[281,228],[199,284]]);
        b.rect(286,188,350,200,M.ROCK);b.rect(489,297,563,309,M.ROCK);
        b.rock([[373,123],[455,149],[450,160],[373,136]]);
        b.pool(457,589,345,375,M.LAVA);b.pool(117,215,339,375);
        b.source(396,77,M.LAVA,12);
        return {stations:[{x:316,y:175,waiting:2},{x:526,y:284,waiting:1}]};
      },
    },
    {
      id:'waterworks',name:'Luolaputkimies',theme:get('jade-pools').theme,
      briefing:'Avaa yläsäiliön pohjapato louhintapanoksella K. Johda vesi sinisellä rajattuun altaaseen ja palaa kotiasemalle.',
      hint:'Oranssi risti näyttää padon. Panos K tarttuu maastoon; sulake on 1,4 s laukaisusta. Väistä räjähdystä ja säästä altaan pohja.',
      objective:'Täytä allas ja palaa kotiin',material:M.WATER,goal:1200,
      zone:{x:260,y:302,width:122,height:54},gates:[{x:320,y:143}],
      build(b){
        b.ellipse(141,212,112,147);b.ellipse(495,207,110,146);
        b.tunnel([[147,253],[232,248],[321,246],[468,244]],29);
        b.tunnel([[161,122],[230,115],[258,115]],24);
        b.rect(259,50,382,149,M.ROCK);
        b.rect(267,58,374,138);b.rect(292,149,350,307);
        b.rect(260,285,382,356);b.rect(243,302,260,326);
        b.rect(382,302,417,326);
        b.pool(267,374,82,138);
        // A finite reservoir: neither source emits free water into the target.
        return {};
      },
    },
    {
      id:'sandfall',name:'Hallittu sortuma',theme:get('hourglass').theme,
      briefing:'Vapauta hiekkavarasto keltaiseen keräyskuiluun. Kun tavoitemäärä on koossa, palaa kotiasemalle.',
      hint:'Avaa ensin alempi luukku, sitten ylempi. Panos K tarttuu maastoon ja räjähtää 1,4 s laukaisusta. Putoavan hiekan läpi voi lentää.',
      objective:'Kerää hiekka ja palaa kotiin',material:M.SAND,goal:1800,
      zone:{x:261,y:280,width:118,height:76},gates:[{x:320,y:218},{x:320,y:137}],
      build(b){
        b.ellipse(138,215,109,148);b.ellipse(498,215,109,148);
        b.tunnel([[146,255],[226,259],[320,255],[467,255]],27);
        b.tunnel([[147,122],[246,123],[275,124]],24);
        b.tunnel([[320,171],[459,163]],22);
        b.rect(270,53,372,142,M.ROCK);
        b.rect(278,61,364,132);b.rect(299,142,342,214);
        b.rect(299,223,342,301);b.rect(261,280,379,356);
        b.rect(241,302,261,325);b.rect(379,302,416,325);
        b.rect(280,83,362,132,M.SAND);
        return {};
      },
    },
  ];
  class Solo {
    constructor(world,combat,index=0,records={}){
      this.world=world;this.combat=combat;this.records=records;this.start(index);
    }
    get player(){return this.combat.player;}
    get remaining(){return Math.max(0,(this.mission.limit||0)-this.elapsed);}
    get progress(){return this.mission.id==='rescue'?this.rescued/3:Math.min(1,this.amount/this.mission.goal);}
    get readyToReturn(){return this.mission.id==='rescue'?this.cargo>0:this.stable>=1;}
    start(index=this.index){
      if(!Number.isInteger(index)||!list[index])return false;
      this.index=index;this.mission=list[index];
      const w=this.world;w.randomState=w.seed;w.clear();
      const b=new Builder(w),data=this.mission.build(b);
      b.rect(62,316,115,328,M.ROCK);
      w.level={id:this.mission.id,name:this.mission.name,hint:this.mission.briefing};w.theme=this.mission.theme;
      w.spawn={...BASE};w.enemySpawn=null;w.teamSpawns=null;w.emitting=true;
      this.base={...BASE};this.stations=data.stations||[];
      this.combat.enabled=false;this.combat.terrainCharges=true;this.combat.setRoster(0,0);this.combat.reset(true);
      this.phase='ready';this.elapsed=0;this.cargo=0;this.rescued=0;this.amount=0;this.stable=0;
      this.docking=0;this.dockTarget=null;this.reason='';return true;
    }
    next(){return this.phase==='won'&&this.index+1<list.length?this.start(this.index+1):false;}
    finish(result,reason){
      if(this.phase==='won'||this.phase==='lost')return;
      this.phase=result;this.reason=reason;this.combat.finish(result);
      if(result==='won')this.records[this.mission.id]=Math.min(this.records[this.mission.id]??Infinity,this.elapsed);
    }
    near(point){
      const p=this.player;
      return Math.hypot(p.x-point.x,p.y-point.y)<=19&&p.speed<18&&this.combat.sight(p.x,p.y,point.x,point.y);
    }
    countZone(){
      const {zone,material}=this.mission,w=this.world;let amount=0;
      for(let y=zone.y;y<zone.y+zone.height;y++)for(let x=zone.x;x<zone.x+zone.width;x++)
        amount+=w.cells[y*w.width+x]===material;
      return amount;
    }
    checkObjective(dt){
      if(this.mission.id==='rescue'){
        for(const station of this.stations)if(station.waiting){
          for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){
            const k=this.world.cells[(station.y+y)*this.world.width+station.x+x];
            if(k===M.LAVA||k===M.FIRE){this.finish('lost','Laava tai tuli saavutti suojan. Kokeile toista reittiä tai jäähdytä laavaa.');return;}
          }
        }
      }else{
        this.amount=this.countZone();
        this.stable=this.amount>=this.mission.goal?this.stable+dt:0;
      }
      let target=null;
      if(this.readyToReturn&&this.near(this.base))target=this.base;
      else if(this.mission.id==='rescue'&&this.cargo<2)target=this.stations.find(s=>s.waiting&&this.near(s))||null;
      if(target!==this.dockTarget){this.dockTarget=target;this.docking=0;}
      if(!target){this.docking=0;return;}
      this.docking+=dt;if(this.docking<.75)return;
      this.docking=0;
      if(target===this.base){
        if(this.mission.id==='rescue'){
          this.rescued+=this.cargo;this.cargo=0;this.player.payload=0;
          if(this.rescued===3)this.finish('won','Kaikki kolme kaivostyöläistä ovat turvassa.');
        }else this.finish('won',this.mission.id==='waterworks'?'Vesi on altaassa ja lennokki kotona.':'Hiekka on keräyskuilussa ja lennokki kotona.');
      }else{target.waiting--;this.cargo++;this.player.payload=this.cargo;}
    }
    step(input={},dt=1/60){
      if(this.phase!=='ready'&&this.phase!=='playing')return;
      if(this.phase==='ready'){
        if(!Object.values(input).some(Boolean))return;
        this.phase='playing';
      }
      this.elapsed+=dt;this.world.step();this.combat.step(input,dt);
      // Destruction takes precedence over simultaneous delivery or filling a basin.
      if(this.player.dead){this.finish('lost','Lennokki hajosi. R aloittaa saman tehtävän alusta.');return;}
      if(this.mission.limit&&this.remaining<=0){this.finish('lost','Pelastusaika loppui. Lyhennä reittiä ja kuljeta kaksi kerrallaan.');return;}
      this.checkObjective(dt);
    }
    get status(){
      if(this.phase==='ready')return 'Tehtävä alkaa ensimmäisestä ohjauksesta.';
      if(this.phase==='won'||this.phase==='lost')return this.reason;
      if(this.dockTarget)return this.dockTarget===this.base?'Pidä paikallasi · purku '+Math.min(100,Math.round(this.docking/.75*100))+' %':'Pidä paikallasi · nouto '+Math.min(100,Math.round(this.docking/.75*100))+' %';
      if(this.readyToReturn)return 'Palaa vihreälle kotiasemalle ja hidasta merkin kohdalle.';
      return this.mission.id==='rescue'?'Nouda kaivostyöläiset keltaisilta henkilömerkeiltä.':'Avaa oranssilla merkityt luukut. Täyttö mitataan rajatun alueen sisältä.';
    }
    markers(){
      const points=[{...this.base,kind:'base',active:this.readyToReturn}];
      for(const s of this.stations)if(s.waiting)points.push({...s,kind:'person'});
      for(const g of this.mission.gates||[])if(this.world.cells[g.y*this.world.width+g.x]===M.ROCK)points.push({...g,kind:'gate'});
      if(this.mission.zone){const z=this.mission.zone;points.push({x:z.x+z.width/2,y:z.y+z.height/2,kind:'target',active:this.readyToReturn});}
      return points;
    }
  }
  root.CaveSolo={Solo,list};
  if(typeof module!=='undefined')module.exports=root.CaveSolo;
})(globalThis);
