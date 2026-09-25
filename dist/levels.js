(function(root){
  'use strict';
  const {M}=root.CaveSim;
  const shades=base=>[-8,-4,0,5,9].map(d=>base.map(c=>Math.max(0,Math.min(255,c+d))));
  function theme(name,texture,rock,vein,sand,water,surface,sky){
    return {name,texture,vein:shades(vein),surface,sky,
      palettes:{[M.ROCK]:shades(rock),[M.SAND]:shades(sand),[M.WATER]:shades(water)}};
  }
  // Colours describe the geology; material IDs and all physical rules stay shared.
  const themes={
    granite:theme('Graniitti · kultahiekka · sininen vesi','granite',[57,62,75],[80,69,82],[212,175,106],[38,99,153],[106,188,214],[10,15,24]),
    rust:theme('Hiekkakivi · punahiekka · turkoosi vesi','sandstone',[91,53,43],[127,73,48],[199,111,69],[31,117,122],[91,186,177],[24,13,17]),
    chalk:theme('Kalkkikivi · valkoinen hiekka · kirkas vesi','chalk',[88,94,88],[109,115,102],[222,218,186],[48,126,157],[139,213,223],[12,22,26]),
    basalt:theme('Basaltti · tumma hiekka · sininen vesi','basalt',[48,44,54],[74,53,61],[133,120,126],[42,84,130],[97,153,186],[20,11,19]),
    jade:theme('Vihreä liuske · vaalea hiekka · vihreä vesi','slate',[45,74,69],[58,105,84],[195,186,138],[31,118,98],[98,203,146],[9,23,22]),
    ochre:theme('Kerroshiekkakivi · okrahiekka · sinivihreä vesi','sandstone',[97,76,48],[133,107,65],[232,184,79],[40,107,119],[100,176,174],[24,20,13]),
    amethyst:theme('Ametisti ja kvartsi · hopeahiekka · violetti vesi','crystal',[73,52,97],[114,80,137],[188,183,209],[79,81,157],[153,155,221],[17,12,30]),
    quarry:theme('Gneissi · harmaa hiekka · sininen vesi','gneiss',[70,69,65],[107,98,82],[157,151,133],[40,95,127],[102,163,187],[18,19,22]),
  };
  class Builder {
    constructor(world){this.world=world;world.cells.fill(M.ROCK);}
    rect(x0,y0,x1,y1,material=M.AIR){
      const w=this.world;
      for(let y=Math.max(2,y0);y<Math.min(w.height-2,y1);y++)
        for(let x=Math.max(2,x0);x<Math.min(w.width-2,x1);x++)w.set(y*w.width+x,material);
    }
    ellipse(cx,cy,rx,ry,material=M.AIR,onlyAir=false){
      const w=this.world;
      for(let y=Math.max(2,Math.floor(cy-ry-3));y<Math.min(w.height-2,cy+ry+3);y++)
        for(let x=Math.max(2,Math.floor(cx-rx-3));x<Math.min(w.width-2,cx+rx+3);x++){
          const edge=1+.018*Math.sin(x/11)+.014*Math.sin(y/9+x/17);
          const i=y*w.width+x;
          if(((x-cx)/rx)**2+((y-cy)/ry)**2<edge&&(!onlyAir||w.cells[i]===M.AIR))w.set(i,material);
        }
    }
    tunnel(points,r=24){
      for(let i=1;i<points.length;i++){
        const [ax,ay]=points[i-1],[bx,by]=points[i],n=Math.ceil(Math.hypot(bx-ax,by-ay)/8);
        for(let j=0;j<=n;j++)this.ellipse(ax+(bx-ax)*j/n,ay+(by-ay)*j/n,r,r);
      }
    }
    rock(points){
      const w=this.world,xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
      for(let y=Math.max(2,Math.min(...ys));y<Math.min(w.height-2,Math.max(...ys));y++)
        for(let x=Math.max(2,Math.min(...xs));x<Math.min(w.width-2,Math.max(...xs));x++){
          let inside=false;
          for(let i=0,j=points.length-1;i<points.length;j=i++){
            const [ax,ay]=points[i],[bx,by]=points[j];
            if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
          }
          if(inside)w.set(y*w.width+x,M.ROCK);
        }
    }
    pool(x0,x1,top,bottom,material=M.WATER){
      const w=this.world;
      for(let y=top;y<bottom;y++)for(let x=x0;x<x1;x++){
        const i=y*w.width+x;if(w.cells[i]===M.AIR)w.set(i,material);
      }
    }
    pile(x,y,rx,ry,material=M.SAND){this.ellipse(x,y,rx,ry,material,true);}
    source(x,y,material,rate=8){this.world.sources.push({x,y,material,radius:1,rate});}
  }
  const list=[
    {
      id:'granite-bridge',name:'Graniittisilta',theme:themes.granite,
      hint:'Kivikaari jakaa taistelun ylä- ja alareittiin. Vesi odottaa sillan alla.',
      starts:[[206,173],[429,176]],
      build(b){
        b.ellipse(320,201,296,169);
        b.rock([[142,237],[219,161],[283,131],[355,131],[422,164],[497,239],[472,251],[404,190],[345,159],[291,160],[237,192],[168,256]]);
        b.ellipse(306,290,48,18,M.ROCK);b.ellipse(522,128,34,19,M.ROCK);
        b.pool(73,570,326,379);b.pile(144,116,23,17);b.pile(523,99,20,12);
        b.source(148,72,M.SAND,9);b.source(487,77,M.WATER,10);
      },
    },
    {
      id:'rust-chasm',name:'Ruostekuilu',theme:themes.rust,
      hint:'Vinot kielekkeet katkaisevat tähtäyslinjan. Kiertotie kulkee kuilun pohjan kautta.',
      starts:[[209,114],[433,242]],
      build(b){
        b.ellipse(203,124,161,85);b.ellipse(441,271,163,96);
        b.tunnel([[215,140],[335,167],[371,241]],38);
        b.tunnel([[151,161],[119,252],[252,314],[381,287]],27);
        b.tunnel([[291,105],[430,99],[514,167],[502,219]],24);
        b.rock([[237,132],[291,144],[322,172],[285,169],[253,152]]);
        b.rock([[342,256],[388,238],[412,249],[371,272],[343,293]]);
        b.pool(76,592,336,381);b.pile(122,96,24,15);b.pile(506,291,23,12);
        b.source(139,83,M.SAND,11);
      },
    },
    {
      id:'chalk-vaults',name:'Kalkkiholvit',theme:themes.chalk,
      hint:'Kolme holvia, kaksi kulkukorkeutta. Pienet vesialtaat täydentävät säiliötä.',
      starts:[[189,182],[436,181]],
      build(b){
        b.ellipse(156,202,127,143);b.ellipse(320,188,100,151);b.ellipse(482,205,127,140);
        b.tunnel([[158,186],[487,186]],27);b.tunnel([[148,277],[487,277]],23);
        b.rock([[245,89],[275,96],[261,148]]);b.rock([[368,83],[394,99],[377,142]]);
        b.ellipse(315,226,42,18,M.ROCK);
        b.pool(42,606,315,376);b.pile(120,286,23,14);b.pile(505,287,21,13);
        b.source(339,73,M.WATER,12);
      },
    },
    {
      id:'basalt-steps',name:'Mustat portaat',theme:themes.basalt,
      hint:'Laava laskeutuu portaita pitkin. Viileä vasen allas tarjoaa paikan täydentää vettä.',
      starts:[[213,151],[422,188]],
      build(b){
        b.ellipse(320,207,296,162);
        b.rock([[316,93],[405,117],[400,132],[320,112]]);
        b.rock([[443,154],[570,185],[570,202],[446,171]]);
        b.rock([[359,235],[479,258],[472,275],[352,255]]);
        b.ellipse(192,254,49,19,M.ROCK);
        b.pool(437,579,314,377,M.LAVA);b.pool(69,276,322,373);
        b.pile(526,164,24,10,M.LAVA);b.pile(175,227,23,12);
        b.source(501,113,M.LAVA,16);b.source(121,100,M.WATER,12);
      },
    },
    {
      id:'jade-pools',name:'Smaragdialtaat',theme:themes.jade,
      hint:'Vihreä vesi on tavallista vettä. Sukellus yhdistää saarekkeiden alapuoliset reitit.',
      starts:[[187,151],[424,167]],
      build(b){
        b.ellipse(319,200,294,173);
        b.rock([[183,218],[243,206],[286,224],[273,244],[213,248],[186,236]]);
        b.rock([[363,239],[414,222],[466,229],[481,246],[422,263],[372,259]]);
        b.ellipse(318,91,24,37,M.ROCK);
        b.pool(57,584,288,376);b.pile(221,187,25,12);b.pile(422,205,22,12);
        b.source(102,105,M.WATER,7);b.source(525,112,M.WATER,9);
      },
    },
    {
      id:'hourglass',name:'Tiimalasi',theme:themes.ochre,
      hint:'Ylä- ja alakammion yhdistää hiekkasateinen kurkku. Putoavien jyvien läpi voi lentää.',
      starts:[[248,116],[385,284]],
      build(b){
        b.ellipse(317,111,245,80);b.ellipse(320,294,253,78);
        b.tunnel([[320,133],[320,271]],43);
        b.tunnel([[157,143],[123,200],[163,262]],23);
        b.tunnel([[486,143],[520,200],[481,262]],23);
        b.ellipse(304,300,24,16,M.ROCK);
        b.pile(310,83,24,17);b.pile(390,98,20,16);b.pool(132,510,347,378);
        b.source(320,49,M.SAND,7);b.source(208,89,M.SAND,11);
      },
    },
    {
      id:'amethyst-nest',name:'Ametistipesä',theme:themes.amethyst,
      hint:'Terävät kideharjanteet jakavat ampumalinjat. Suojaa löytyy myös keskimmäisen kiteen alta.',
      starts:[[207,164],[433,169]],
      build(b){
        b.ellipse(320,202,296,169);
        b.rock([[111,90],[152,53],[174,122],[155,151]]);
        b.rock([[292,209],[322,151],[353,213],[342,253],[310,249]]);
        b.rock([[476,81],[502,60],[534,148],[510,176]]);
        b.rock([[163,357],[190,269],[221,317],[233,361]]);
        b.rock([[422,367],[448,281],[481,350]]);
        b.pool(66,577,333,377);b.pile(91,231,18,15);b.pile(559,246,17,14);
        b.source(391,68,M.WATER,11);
      },
    },
    {
      id:'powder-quarry',name:'Ruutilouhos',theme:themes.quarry,
      hint:'Ruudit lepäävät kivihyllyillä. Räjäytys avaa suojan, mutta myös omat lennokit ovat vaarassa.',
      starts:[[194,150],[433,160]],
      build(b){
        b.ellipse(320,202,294,168);
        b.rock([[119,213],[245,205],[251,222],[134,234]]);
        b.rock([[350,111],[462,103],[481,121],[361,131]]);
        b.rock([[400,230],[527,219],[536,239],[408,250]]);
        b.ellipse(316,273,51,19,M.ROCK);
        b.pile(222,194,11,8,M.POWDER);b.pile(426,91,12,8,M.POWDER);
        b.pile(480,208,11,8,M.POWDER);b.pile(312,246,18,10);
        b.pile(161,289,14,8,M.MUD);b.pool(79,571,332,377);
        b.source(115,130,M.SAND,12);
      },
    },
  ];
  function get(id){return list.find(level=>level.id===id);}
  function at(index){return list[((index%list.length)+list.length)%list.length];}
  function spawnPoints(world,anchor){
    const safe=(x,y)=>{
      for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++){
        if(dx*dx+dy*dy>100)continue;
        if(x+dx<2||y+dy<2||x+dx>=world.width-2||y+dy>=world.height-2||world.cells[(y+dy)*world.width+x+dx]!==M.AIR)return false;
      }
      return true;
    };
    const [ax,ay]=anchor,points=[],candidates=[{x:ax,y:ay}];
    // Fill a team's own chamber before searching farther away. No terrain is carved for spawning.
    for(let y=36;y<world.height-36;y+=24)for(let x=36;x<world.width-36;x+=24)
      if((x<320)===(ax<320))candidates.push({x,y});
    candidates.sort((a,b)=>(a.x-ax)**2+(a.y-ay)**2-((b.x-ax)**2+(b.y-ay)**2));
    for(const p of candidates)if(safe(p.x,p.y)&&points.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=25)){
      points.push(p);if(points.length===24)break;
    }
    if(!points.length)throw new Error('Kentän lähtökammio on tukossa.');
    return points;
  }
  function build(world,id){
    const level=get(id);if(!level)throw new Error('Tuntematon kenttä: '+id);
    world.randomState=world.seed;world.clear();level.build(new Builder(world));
    world.level=level;world.theme=level.theme;
    world.teamSpawns=level.starts.map(p=>spawnPoints(world,p));
    world.spawn=world.teamSpawns[0][0];world.enemySpawn=world.teamSpawns[1][0];
  }
  root.CaveLevels={list,get,at,build,Builder};
  if(typeof module!=='undefined')module.exports=root.CaveLevels;
})(globalThis);
