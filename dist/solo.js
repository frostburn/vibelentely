(function(root){
  'use strict';
  const {M}=root.CaveSim,{Builder,get}=root.CaveLevels;
  const BASE={x:88,y:302};
  const leakZone={x:391,y:323,width:23,height:24};
  function leakingBasin(b){
    b.ellipse(320,211,295,167);
    b.rect(340,252,468,340,M.ROCK);b.rect(348,230,460,326);
    b.rect(396,326,408,340);b.rect(385,344,419,354,M.ROCK);
  }
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
      briefing:'Avaa yläsäiliön pohjapato louhintapanoksella. Johda vesi sinisellä rajattuun altaaseen ja palaa kotiasemalle.',
      hint:'Oranssi risti näyttää padon. Panos tarttuu maastoon; sulake on 1,4 s laukaisusta. Väistä räjähdystä ja säästä altaan pohja.',
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
      hint:'Avaa ensin alempi luukku, sitten ylempi. Panos tarttuu maastoon ja räjähtää 1,4 s laukaisusta. Putoavan hiekan läpi voi lentää.',
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
    {
      id:'leaking-dam',name:'Vuotava pato',theme:get('chalk-vaults').theme,loadout:['mud','water'],
      briefing:'Paikkaa altaan pohjavuoto mutapommilla. Kerää vettä ja palaa kotiin, kun pato pitää.',
      hint:'Ammu mutapommi pohjavuodon alla olevalle kielekkeelle. Muta tarvitsee tuen. Täyttö ja mutapaikka tarkistetaan yhdessä.',
      objective:'Paikkaa vuoto ja täytä allas',success:'Mutapaikka pitää ja allas on täynnä.',
      goals:[{label:'Vesi altaassa',zone:{x:348,y:275,width:112,height:51},materials:[M.WATER],amount:1200},
        {label:'Mutapaikka',zone:leakZone,materials:[M.MUD],amount:65}],
      points:[{x:402,y:337,kind:'repair'}],
      build(b){leakingBasin(b);b.source(369,238,M.WATER,3);return {};},
    },
    {
      id:'pump-room',name:'Pumppaamo tukossa',theme:get('rust-chasm').theme,loadout:['vacuum','water'],
      briefing:'Ime vesi ja muta pumppaamosta. Herkkä laitteisto ei kestä lähellä räjäyttämistä. Palaa lopuksi kotiin.',
      hint:'Imutykki tuhoaa aineen keulan edestä. Pyyhkäise koko allas; kivi pysäyttää imun. Rajatun koneiston lähellä räjähdys häviää tehtävän.',
      objective:'Tyhjennä pumppaamo',success:'Pumppaamo on kuiva ja ehjä.',
      goals:[{label:'Poistettavaa',zone:{x:286,y:270,width:92,height:58},materials:[M.WATER,M.MUD],amount:35,clear:true}],
      fragile:{x:332,y:299,radius:66},
      build(b){
        b.ellipse(320,204,296,169);b.rect(278,266,386,337,M.ROCK);b.rect(286,238,378,328);
        b.pool(286,378,301,328);b.pile(355,294,10,7,M.MUD);return {};
      },
    },
    {
      id:'dry-dock',name:'Kuivatelakka',theme:get('jade-pools').theme,loadout:['mud','vacuum'],
      briefing:'Tuki vuotava syöttöputki mudalla ja ime telakka kuivaksi. Molempien töiden pitää pysyä kunnossa kotiin asti.',
      hint:'Putken sivusuun alla on mutaa kantava hylly. Paikkaa suu ensin, ime allas vasta sitten. Räjäyttäminen rikkoo telakan.',
      objective:'Eristä tulovesi ja kuivaa telakka',success:'Tulovesi on eristetty ja telakka kuiva.',
      goals:[{label:'Mutatulppa',zone:{x:396,y:192,width:24,height:24},materials:[M.MUD],amount:95},
        {label:'Vettä telakassa',zone:{x:330,y:273,width:144,height:63},materials:[M.WATER],amount:45,clear:true}],
      points:[{x:414,y:204,kind:'repair'}],fragile:{x:402,y:301,radius:68},
      build(b){
        b.ellipse(320,205,296,167);
        b.rect(380,74,424,222,M.ROCK);b.rect(392,80,412,212);b.rect(412,201,424,212);
        b.rect(403,212,439,224,M.ROCK);
        b.rect(322,269,482,346,M.ROCK);b.rect(330,241,474,336);
        b.pool(330,474,319,336);b.source(402,97,M.WATER,4);return {};
      },
    },
    {
      id:'hard-shell',name:'Kova kuori',theme:get('amethyst-nest').theme,loadout:['blaster','vacuum'],delivery:true,
      briefing:'Puhkaise luja kallio täyteen ladatulla blasterilla. Nouda ydinmoduuli kapselista ja tuo se kotiasemalle.',
      hint:'Sinertävä ristijuovainen kallio kestää tavalliset räjähteet. Lataa 1,2 s ja vapauta. Täyteen ladattua asetta ei voi säilyttää loputtomiin.',
      objective:'Ydinmoduuli kotiin',cargoLabel:'Moduuleja',success:'Ydinmoduuli on turvallisesti kotona.',
      build(b){
        b.ellipse(213,207,186,160);b.tunnel([[290,211],[397,211]],37);
        b.rect(400,100,600,330,M.HARDROCK);b.rect(470,172,538,258);
        b.rect(476,249,532,258,M.ROCK);
        return {stations:[{x:503,y:236,waiting:1}]};
      },
    },
    {
      id:'new-waterway',name:'Uusi vesireitti',theme:get('granite-bridge').theme,loadout:['blaster','mud'],
      briefing:'Paikkaa keräysaltaan vuoto mudalla. Avaa sitten lujasta kivestä tehty yläpato blasterilla ja johda vesi altaaseen.',
      hint:'Tee paikka ennen padon puhkaisua. Blasteri räjähtää osumasta suurella säteellä: ammu riittävän kaukaa ja säästä alapuolinen allas.',
      objective:'Avaa vesireitti ja pidä allas täynnä',success:'Uusi vesireitti toimii ja pato pitää.',
      goals:[{label:'Vesi altaassa',zone:{x:348,y:275,width:112,height:51},materials:[M.WATER],amount:1100},
        {label:'Mutapaikka',zone:leakZone,materials:[M.MUD],amount:65}],
      points:[{x:402,y:337,kind:'repair'}],gates:[{x:403,y:151}],
      build(b){
        leakingBasin(b);b.rect(361,57,444,159,M.HARDROCK);b.rect(369,65,436,144);
        b.pool(369,436,88,144);return {};
      },
    },
  ];
  class Solo {
    constructor(world,combat,index=0,records={}){
      this.world=world;this.combat=combat;this.records=records;this.start(index);
    }
    get player(){return this.combat.player;}
    get remaining(){return Math.max(0,(this.mission.limit||0)-this.elapsed);}
    get delivery(){return this.mission.id==='rescue'||!!this.mission.delivery;}
    get progress(){return this.delivery?this.rescued/this.total:Math.min(...this.readings.map(r=>r.progress));}
    get readyToReturn(){return this.delivery?this.cargo>0:this.stable>=1;}
    get canEquip(){return !this.player.dead&&(this.phase==='ready'||this.phase==='won'||this.phase==='lost'||this.near(this.base));}
    start(index=this.index){
      if(!Number.isInteger(index)||!list[index])return false;
      const keepLoadout=this.index===index?this.player.loadout:null;
      this.index=index;this.mission=list[index];
      const w=this.world;w.randomState=w.seed;w.clear();
      const b=new Builder(w),data=this.mission.build(b);
      b.rect(62,316,115,328,M.ROCK);
      w.level={id:this.mission.id,name:this.mission.name,hint:this.mission.briefing};w.theme=this.mission.theme;
      w.spawn={...BASE};w.enemySpawn=null;w.teamSpawns=null;w.emitting=true;
      this.base={...BASE};this.stations=data.stations||[];
      this.total=this.stations.reduce((n,s)=>n+s.waiting,0);
      this.goals=(this.mission.goals||(!this.delivery?[{label:'Täyttö',zone:this.mission.zone,materials:[this.mission.material],amount:this.mission.goal}]:[])).map(g=>({...g,initial:this.countZone(g)}));
      this.readings=this.goals.map(g=>({count:g.initial,progress:0,done:false}));
      this.hazardsSeen=new WeakSet();
      this.combat.enabled=false;this.combat.terrainCharges=true;this.combat.setRoster(0,0);this.combat.reset(true);
      root.CaveTools.setLoadout(this.player,keepLoadout||this.mission.loadout||['grenade','water']);
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
    countZone(goal=this.goals[0]){
      const {zone,materials}=goal,w=this.world;let amount=0;
      for(let y=zone.y;y<zone.y+zone.height;y++)for(let x=zone.x;x<zone.x+zone.width;x++)
        amount+=materials.includes(w.cells[y*w.width+x]);
      return amount;
    }
    checkObjective(dt){
      const fragile=this.mission.fragile;
      if(fragile)for(const e of this.world.effects)if(!this.hazardsSeen.has(e)){
        this.hazardsSeen.add(e);
        if(Math.hypot(e.x-fragile.x,e.y-fragile.y)<e.radius+fragile.radius){this.finish('lost','Räjähdys rikkoi herkän laitteiston. Käytä imutykkiä ja mutaa.');return;}
      }
      if(this.mission.id==='rescue'){
        for(const station of this.stations)if(station.waiting){
          for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){
            const k=this.world.cells[(station.y+y)*this.world.width+station.x+x];
            if(k===M.LAVA||k===M.FIRE){this.finish('lost','Laava tai tuli saavutti suojan. Kokeile toista reittiä tai jäähdytä laavaa.');return;}
          }
        }
      }else if(!this.delivery){
        this.readings=this.goals.map(g=>{
          const count=this.countZone(g),done=g.clear?count<=g.amount:count>=g.amount;
          const progress=g.clear?(g.initial-count)/Math.max(1,g.initial-g.amount):count/g.amount;
          return {count,done,progress:Math.max(0,Math.min(1,progress))};
        });
        this.amount=this.readings[0].count;
        this.stable=this.readings.every(r=>r.done)?this.stable+dt:0;
      }
      let target=null;
      if(this.readyToReturn&&this.near(this.base))target=this.base;
      else if(this.delivery&&this.cargo<2)target=this.stations.find(s=>s.waiting&&this.near(s))||null;
      if(target!==this.dockTarget){this.dockTarget=target;this.docking=0;}
      if(!target){this.docking=0;return;}
      this.docking+=dt;if(this.docking<.75)return;
      this.docking=0;
      if(target===this.base){
        if(this.delivery){
          this.rescued+=this.cargo;this.cargo=0;this.player.payload=0;
          if(this.rescued===this.total)this.finish('won',this.mission.success||'Kaikki kolme kaivostyöläistä ovat turvassa.');
        }else this.finish('won',this.mission.success||(this.mission.id==='waterworks'?'Vesi on altaassa ja lennokki kotona.':'Hiekka on keräyskuilussa ja lennokki kotona.'));
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
      return this.delivery?(this.mission.delivery?'Nouda moduuli keltaiselta pakettimerkiltä.':'Nouda kaivostyöläiset keltaisilta henkilömerkeiltä.'):this.mission.goals?'Täytä kaikki tehtäväpaneelin tavoitteet. Vihreä H näyttää paluupaikan.':'Avaa oranssilla merkityt luukut. Täyttö mitataan rajatun alueen sisältä.';
    }
    markers(){
      const points=[{...this.base,kind:'base',active:this.readyToReturn}];
      for(const s of this.stations)if(s.waiting)points.push({...s,kind:this.mission.delivery?'parcel':'person'});
      for(const g of this.mission.gates||[])if([M.ROCK,M.HARDROCK].includes(this.world.cells[g.y*this.world.width+g.x]))points.push({...g,kind:'gate'});
      points.push(...this.mission.points||[]);
      if(this.mission.fragile)points.push({...this.mission.fragile,kind:'fragile'});
      if(this.mission.zone){const z=this.mission.zone;points.push({x:z.x+z.width/2,y:z.y+z.height/2,kind:'target',active:this.readyToReturn});}
      return points;
    }
  }
  root.CaveSolo={Solo,list};
  if(typeof module!=='undefined')module.exports=root.CaveSolo;
})(globalThis);
