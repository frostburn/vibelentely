(function(root){
  'use strict';
  const {M}=root.CaveSim;
  const list=[
    {id:'grenade',name:'Kranaatti / panos',hint:'Kolme latausta. Soolokeikalla tarttuu maastoon; muualla pomppii. Sulake 1,4 s.'},
    {id:'water',name:'Painevesi',hint:'Työntää irtoainesta ja jäähdyttää laavaa. Säiliö täyttyy vedessä.'},
    {id:'mud',name:'Mutapommi',hint:'Levittää oikeaa mutaa osumassa. Kaksi pommia; uusi lataus 6 s välein.'},
    {id:'vacuum',name:'Imutykki',hint:'Tuhoaa hiekan, veden ja mudan keulan edestä. Laavan imeminen ylikuumentaa heti.'},
    {id:'blaster',name:'Blasteri',hint:'Lataa pitämällä 1,2 s, vapauta ampuaksesi. Vain täysi lataus laukeaa. Täytenä pito ylikuumentaa 1,6 s:ssa.'},
  ];
  function equipment(){return {mudAmmo:2,mudReload:0,mudCooldown:0,vacuumHeat:0,vacuumHot:false,vacuumRays:[],
    charge:0,blasterHeat:0,blasterHot:false,blasterHeld:false,blasterNeedsRelease:false,blasterCooldown:0};}
  function cancel(actor){
    if(!actor?.gear)return;
    const g=actor.gear;g.charge=0;g.blasterHeld=false;g.vacuumRays=[];
  }
  function setLoadout(actor,slots){
    if(!Array.isArray(slots)||slots.length!==2||new Set(slots).size!==2||slots.some(id=>!list.some(t=>t.id===id)))return false;
    cancel(actor);actor.loadout=slots.slice();return true;
  }
  function tick(actor,dt){
    const g=actor.gear;g.vacuumRays=[];
    g.mudCooldown=Math.max(0,g.mudCooldown-dt);g.blasterCooldown=Math.max(0,g.blasterCooldown-dt);
    if(g.mudAmmo<2){g.mudReload+=dt;if(g.mudReload>=6){g.mudAmmo++;g.mudReload-=6;}}else g.mudReload=0;
    g.vacuumHeat=Math.max(0,g.vacuumHeat-dt*.24);if(g.vacuumHeat<=.2)g.vacuumHot=false;
    if(g.charge<1)g.blasterHeat=Math.max(0,g.blasterHeat-dt*.28);
    if(g.blasterHeat<=.2)g.blasterHot=false;
  }
  function mudBurst(combat,p){
    const w=combat.world,x=Math.round(p.x),y=Math.round(p.y);
    // A bounded, contiguous parcel. Existing solids and lava are never replaced.
    for(let dy=-11;dy<=11;dy++)for(let dx=-11;dx<=11;dx++){
      const xx=x+dx,yy=y+dy;if(dx*dx+dy*dy>121||xx<2||yy<2||xx>=w.width-2||yy>=w.height-2)continue;
      const i=yy*w.width+xx;if(w.isGas(i)||w.cells[i]===M.WATER)w.set(i,M.MUD);
    }
    combat.effects.push({kind:'mud',x,y,life:.3,max:.3});
  }
  function vacuum(combat,actor){
    const g=actor.gear;if(g.vacuumHot)return;
    const w=combat.world,hits=new Set();
    // Each ray stops at its first material cell. Collect before deleting so a
    // frame cannot drill through a wall or consume the same parcel twice.
    for(let ray=0;ray<17;ray++){
      const a=actor.angle+(ray/16-.5)*.84,co=Math.cos(a),si=Math.sin(a);let x=actor.x,y=actor.y;
      for(let d=7;d<=46;d++){
        x=actor.x+co*d;y=actor.y+si*d;
        const k=combat.cell(x,y);
        if(k===M.AIR||k===M.STEAM||k===M.SMOKE||k===M.FIRE)continue;
        if(k===M.SAND||k===M.WATER||k===M.MUD||k===M.LAVA)hits.add(Math.floor(y)*w.width+Math.floor(x));
        break;
      }
      g.vacuumRays.push({x,y});
    }
    for(const i of hits){
      const hot=w.cells[i]===M.LAVA;w.set(i,M.AIR);
      if(hot){g.vacuumHeat=1;g.vacuumHot=true;break;}
    }
  }
  function use(combat,actor,input,dt){
    const g=actor.gear,held=new Set();
    for(let slot=0;slot<2;slot++)if(input['tool'+(slot+1)])held.add(actor.loadout[slot]);
    // AI pilots use named triggers; human K/L always go through the two slots.
    if(input.grenade)held.add('grenade');if(input.water)held.add('water');
    const pressed=held.has('blaster');
    if(!pressed)g.blasterNeedsRelease=false;
    if(actor.dead||g.shield){cancel(actor);return false;}
    if(held.has('grenade'))combat.shoot(actor,'grenade');
    if(held.has('water'))combat.shoot(actor,'water');
    if(held.has('mud'))combat.shoot(actor,'mud');
    if(held.has('vacuum'))vacuum(combat,actor);
    if(pressed&&!g.blasterHot&&!g.blasterNeedsRelease&&!g.blasterCooldown){
      if(g.charge<1)g.charge=Math.min(1,g.charge+dt/1.2);
      else{
        g.blasterHeat=Math.min(1,g.blasterHeat+dt/1.6);
        if(g.blasterHeat>=1){g.blasterHot=true;g.blasterNeedsRelease=true;g.charge=0;}
      }
    }else if(!pressed&&g.blasterHeld){
      if(g.charge===1&&!g.blasterHot)combat.shoot(actor,'blaster');
      g.charge=0;
    }
    g.blasterHeld=pressed;return held.has('water');
  }
  function readout(id,g,sticky){
    const spec=list.find(t=>t.id===id),name=id==='grenade'?(sticky?'Panos':'Kranaatti'):spec.name;
    const data={
      grenade:[g.grenades+' / 3',g.grenades/3],water:[Math.floor(g.water)+' %',g.water/100],mud:[g.mudAmmo+' / 2',g.mudAmmo/2],
      vacuum:[g.vacuumHot?'Ylikuuma '+Math.ceil(g.vacuumHeat*100)+' %':'Valmis',1-g.vacuumHeat],
      blaster:[g.blasterHot?'Ylikuuma '+Math.ceil(g.blasterHeat*100)+' %':g.charge===1?'Täysi · lämpö '+Math.ceil(g.blasterHeat*100)+' %':g.charge>0?'Lataa '+Math.floor(g.charge*100)+' %':g.blasterCooldown?'Jäähtyy':'Pidä ja vapauta',g.charge||1-g.blasterHeat],
    }[id];
    return {name,status:data[0],charge:data[1],hint:spec.hint};
  }
  root.CaveTools={list,equipment,cancel,setLoadout,tick,use,mudBurst,readout};
  if(typeof module!=='undefined')module.exports=root.CaveTools;
})(globalThis);
