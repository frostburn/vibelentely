(function(){
  'use strict';
  const {M,World}=CaveSim,$=id=>document.getElementById(id);
  const materials=[
    {id:M.SAND,name:'Hiekka',color:'#d9b065',hint:'Valuu rinteitä alas ja kasautuu loiviksi, kolmionmuotoisiksi kasoiksi.'},
    {id:M.WATER,name:'Vesi',color:'#559fc5',hint:'Putoaa pisaroina, etsii reitin alaspäin ja tasaantuu lätäköiksi.'},
    {id:M.MUD,name:'Muta',color:'#986d4c',hint:'Valuu ja pyöristyy hetken. Koheesio pitää asettuneen köntin koossa.'},
    {id:M.LAVA,name:'Laava',color:'#f48439',hint:'Virtaa hitaasti, jäähtyy pinnasta ja muuttuu tummaksi kiveksi.'},
    {id:M.ROCK,name:'Kivi',color:'#64727d',hint:'Rakenna patoja ja tasanteita. Kiveä voi kaivaa ja räjäyttää.'},
    {id:M.POWDER,name:'Ruuti',color:'#9c9e82',hint:'Valuu kuin hiekka. Laava tai räjähdys sytyttää ketjureaktion.'},
    {id:M.AIR,name:'Pyyhi',color:'#26323b',hint:'Kaiva tunneleita tai avaa pato. Oikea hiirennappi kaivaa aina.'},
    {id:-1,name:'Räjäytä',color:'#ebbf86',hint:'Napsauta räjäyttääksesi. Siveltimen koko määrää räjähdyksen säteen.'},
  ];
  const names=['Ilma','Kivi','Hiekka','Vesi','Muta','Laava','Höyry','Ruuti','Tuli','Savu','Jäähtynyt laava'];
  const screen=$('screen'),held=new Set(),keys=new Set();
  const pointer={inside:false,down:false,x:0,y:0,panning:false,erase:false};
  function createSession(kind,missionIndex=0,records={}){
    const world=new World();world.generate(kind==='match'?'arena':'cave');
    const drone=new CaveFlight.Drone(world),combat=new CaveCombat.Combat(world,drone);
    const match=kind==='match'?new CaveMatch.Match(world,combat):null;
    const solo=kind==='solo'?new CaveSolo.Solo(world,combat,missionIndex,records):null;
    if(!match&&!solo)combat.setOpponent(false);
    return {world,drone,combat,match,solo,camera:{x:0,y:0},selected:0,radius:5,paused:false,
      scene:kind==='match'?'arena':'cave',speed:1,mode:kind==='lab'?'edit':'fly',follow:true};
  }
  const sessions={lab:createSession('lab')};
  let {world,drone,combat,camera}=sessions.lab,match=null,solo=null,view='menu';
  const renderer=new CaveRenderer(world,screen,$('minimap'));
  let selected=0,radius=5,paused=false,scene='cave',panTool=false,speed=1,mode='edit';
  let rosterActors=[];
  let accumulator=0,lastTime=0,statTime=0,frameCount=0,stepCount=0,raf=0,simMS=0,lastBrush=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function clampCamera(){camera.x=clamp(Math.round(camera.x),0,world.width-320);camera.y=clamp(Math.round(camera.y),0,world.height-200);}
  function setMode(value,recenter=true){
    if((view==='match'||view==='solo')&&value!=='fly')return;
    mode=value;keys.clear();held.clear();document.querySelectorAll('[data-flight]').forEach(b=>b.classList.remove('is-held'));pointer.down=false;pointer.panning=false;pointer.inside=false;lastBrush=null;
    panTool=false;$('pan').setAttribute('aria-pressed','false');screen.classList.remove('panning','dragging');
    screen.classList.toggle('flying',mode==='fly');
    $('fly-mode').setAttribute('aria-pressed',String(mode==='fly'));
    $('edit-mode').setAttribute('aria-pressed',String(mode==='edit'));
    $('flight-controls').hidden=mode!=='fly';$('flight-note').hidden=mode!=='fly';$('edit-note').hidden=mode!=='edit';
    $('weapons').hidden=mode!=='fly';$('combat-panel').hidden=mode!=='fly';$('editor-controls').hidden=mode!=='edit';
    $('round-result').hidden=mode!=='fly'||!combat.result;
    if(mode==='fly'&&recenter)centerCamera();
    else if(mode==='edit'){$('pointer-status').textContent='Valitse aine ja piirrä luolaan.';$('pointer-status').classList.remove('damaged');}
  }
  function selectMaterial(index){
    if(view!=='lab')return;
    setMode('edit');selected=index;panTool=false;$('pan').setAttribute('aria-pressed','false');screen.classList.remove('panning');
    document.querySelectorAll('.material').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index)));
    $('material-hint').textContent=materials[index].hint;
  }
  materials.forEach((m,i)=>{
    const b=document.createElement('button');b.className='material';b.dataset.material=m.id;b.title=m.hint+' · '+(i+1);b.setAttribute('aria-pressed',i===0?'true':'false');
    const swatch=document.createElement('span');swatch.className='swatch';swatch.style.background=m.color;swatch.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.textContent=m.name;
    const shortcut=document.createElement('span');shortcut.className='shortcut';shortcut.textContent=i+1;
    b.append(swatch,label,shortcut);b.addEventListener('click',()=>selectMaterial(i));$('materials').append(b);
  });
  function setPaused(value){
    paused=value;accumulator=0;$('pause').querySelector('span').textContent=value?'Jatka':'Tauko';
    $('pause').querySelector('path').setAttribute('d',value?'M4 2l9 6-9 6z':'M5 3v10M11 3v10');
    $('paused-label').hidden=!value;
    $('performance').textContent=value?'Tauolla':'60 askelta/s';
  }
  function reset(){
    if(view!=='lab')return;
    clearInput();pointer.inside=false;world.generate(scene);world.emitting=$('sources').checked;combat.reset(true);levelReadout();battleReadout();
    camera.x=drone.x-160;camera.y=drone.y-100;clampCamera();accumulator=0;
    $('follow').checked=true;if(mode==='edit')$('pointer-status').textContent='Valitse aine ja piirrä luolaan.';
    $('sources').disabled=scene==='empty';
  }
  function resize(){
    const compact=window.innerWidth<=680;
    const maxWidth=window.innerWidth-(compact?24:64+264);
    const scale=Math.max(1,Math.min(5,Math.floor(maxWidth/320),compact?2:Math.max(1,Math.floor((window.innerHeight-395)/200))));
    // Only whole CSS-pixel multiples; the backing buffer remains exactly 320 × 200.
    document.documentElement.style.setProperty('--screen-w',320*scale+'px');
    document.documentElement.style.setProperty('--screen-h',200*scale+'px');
    $('resolution').textContent='320 × 200 · '+scale+'×';
  }
  function locate(e){
    const r=screen.getBoundingClientRect();
    pointer.x=clamp(camera.x+Math.floor((e.clientX-r.left)*320/r.width),0,world.width-1);
    pointer.y=clamp(camera.y+Math.floor((e.clientY-r.top)*200/r.height),0,world.height-1);
    pointer.inside=e.clientX>=r.left&&e.clientX<r.right&&e.clientY>=r.top&&e.clientY<r.bottom;
    const i=pointer.y*world.width+pointer.x,k=world.cells[i];
    if(mode==='edit')$('pointer-status').textContent=pointer.x+', '+pointer.y+' · '+names[k]+(k===M.LAVA?' · '+Math.round(world.heat[i])+' °C':'');
  }
  function paint(){
    if(view!=='lab'||mode!=='edit'||!pointer.down||pointer.panning||!pointer.inside)return;
    const mat=pointer.erase?M.AIR:materials[selected].id;
    if(mat===-1)return;
    const from=lastBrush||pointer,dx=pointer.x-from.x,dy=pointer.y-from.y;
    const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/Math.max(1,radius)));
    for(let i=1;i<=n;i++)world.brush(Math.round(from.x+dx*i/n),Math.round(from.y+dy*i/n),radius,mat);
    lastBrush={x:pointer.x,y:pointer.y};
  }
  let dragOrigin=null;
  screen.addEventListener('pointerdown',e=>{
    e.preventDefault();screen.focus({preventScroll:true});locate(e);pointer.down=true;pointer.erase=e.button===2;
    pointer.panning=e.shiftKey||e.button===1||panTool;lastBrush=null;
    screen.setPointerCapture(e.pointerId);
    if(pointer.panning){$('follow').checked=false;dragOrigin={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y};screen.classList.add('dragging');}
    else if(mode==='fly')held.add(e.button===2?'mouse-shield':'mouse-fire');
    else if(mode==='edit'&&materials[selected].id===-1&&!pointer.erase){world.explode(pointer.x,pointer.y,8+radius);}
    else paint();
  });
  screen.addEventListener('pointermove',e=>{
    if(pointer.down&&pointer.panning&&dragOrigin){const scale=screen.getBoundingClientRect().width/320;camera.x=dragOrigin.cx+(dragOrigin.x-e.clientX)/scale;camera.y=dragOrigin.cy+(dragOrigin.y-e.clientY)/scale;clampCamera();}
    locate(e);if(pointer.down&&!pointer.panning)paint();
  });
  const release=()=>{pointer.down=false;pointer.panning=false;held.delete('mouse-fire');held.delete('mouse-shield');dragOrigin=null;lastBrush=null;screen.classList.remove('dragging');};
  screen.addEventListener('pointerup',release);screen.addEventListener('pointercancel',release);screen.addEventListener('lostpointercapture',release);
  screen.addEventListener('pointerleave',()=>{if(!pointer.down)pointer.inside=false;});screen.addEventListener('contextmenu',e=>e.preventDefault());
  screen.addEventListener('wheel',e=>{e.preventDefault();setRadius(radius+(e.deltaY<0?1:-1));},{passive:false});
  function setRadius(value){radius=clamp(value,1,18);$('brush').value=radius;$('brush-value').textContent=radius+' px';}
  $('brush').addEventListener('input',e=>setRadius(+e.target.value));
  $('pause').addEventListener('click',()=>setPaused(!paused));
  $('step').addEventListener('click',()=>{if(view==='lab'){setPaused(true);simulate();}});
  $('reset').addEventListener('click',reset);
  $('fly-mode').addEventListener('click',()=>setMode('fly'));
  $('edit-mode').addEventListener('click',()=>setMode('edit'));
  function centerCamera(){
    $('follow').checked=true;const target=focusActor();camera.x=target.x-160;camera.y=target.y-100;clampCamera();
  }
  function focusActor(){return drone.dead?combat.living(0)[0]||drone:drone;}
  function respawn(){
    if(view==='menu')return;
    clearInput();
    if(solo){
      if(solo.phase==='won'){
        if(!solo.next()){openMenu();return;}
      }else solo.start();
      setPaused(false);
    }else if(match){
      if(match.phase==='finished')match.start();
      else if(match.phase==='round-over'||match.phase==='stage-over')match.nextRound();
      else match.forfeit();
      setPaused(false);
    }else combat.reset();
    accumulator=0;centerCamera();levelReadout();battleReadout();
  }
  $('respawn').addEventListener('click',respawn);
  $('next-round').addEventListener('click',respawn);
  $('opponent').addEventListener('change',e=>{if(view==='lab'){combat.setOpponent(e.target.checked);battleReadout();}});
  function saveSession(){
    if(view==='menu')return;
    Object.assign(sessions[view],{selected,radius,paused,scene,speed,mode,follow:$('follow').checked});
  }
  function openMenu(){
    saveSession();clearInput();view='menu';accumulator=0;lastTime=0;
    $('game-app').hidden=true;$('main-menu').hidden=false;
    const saved=sessions.match?.match,canContinue=saved&&saved.phase!=='finished';
    $('continue-match').hidden=!canContinue;$('saved-match').hidden=!saved;
    $('saved-match').textContent=saved?'Vaikeus '+(saved.stage+1)+' · '+saved.score.join(' : ')+' · erä '+saved.round:'';
    $('start-match').textContent=saved?'Uusi ottelu':'Aloita ottelu →';
    $('start-match').classList.toggle('primary',!canContinue);
    const savedSolo=sessions.solo?.solo;
    $('continue-solo').hidden=!savedSolo;
    $('continue-solo').textContent=savedSolo?'Jatka · '+savedSolo.mission.name:'Jatka tehtävää';
    const records=savedSolo?.records||{};
    $('solo-records').textContent=Object.keys(records).length+' / '+CaveSolo.list.length+' suoritettu';
    for(const [i,option] of Array.from($('mission-select').children).entries())option.textContent=(records[CaveSolo.list[i].id]!==undefined?'✓ ':'')+CaveSolo.list[i].name;
    (canContinue?$('continue-match'):$('start-match')).focus({preventScroll:true});
  }
  function enterSession(kind,fresh=false){
    saveSession();clearInput();
    if(fresh||!sessions[kind])sessions[kind]=createSession(kind,Number($('mission-select').value),sessions.solo?.solo.records);
    const session=sessions[kind];
    ({world,drone,combat,camera,match,solo,selected,radius,paused,scene,speed,mode}=session);
    view=kind;renderer.world=world;rosterActors=[];accumulator=0;lastTime=0;pointer.inside=false;
    $('main-menu').hidden=true;$('game-app').hidden=false;
    $('game-app').classList.toggle('match-game',!!match||!!solo);
    $('game-subtitle').textContent=match?'Tiimitaistelu':solo?'Soolokeikat':'Luolalabra';
    $('battle-heading').textContent=match?'Tiimitaistelu':solo?'Tehtävä':'Harjoittelu';
    document.querySelectorAll('[data-lab-only]').forEach(el=>el.hidden=kind!=='lab');
    $('match-banner').hidden=!match;$('match-progress').hidden=!match;
    $('solo-banner').hidden=!solo;$('mission-progress').hidden=!solo;
    $('score').hidden=!!solo;$('team-guide').hidden=!!solo;
    $('grenade-name').textContent=solo?'Panos':'Kranaatti';
    $('grenade-control').title=solo?'Louhintapanos · K. Tarttuu maastoon, räjähtää 1,4 s laukaisusta. Väistä omaa räjähdystä.':'Kranaatti · K. Pomppii, räjähtää 1,4 s laukaisusta. Oma räjähdys sattuu.';
    $('speed').value=String(speed);$('sources').checked=world.emitting;$('sources').disabled=scene==='empty';
    $('opponent').checked=combat.enabled;setRadius(radius);
    document.querySelectorAll('[data-scene]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.scene===scene)));
    document.querySelectorAll('.material').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===selected)));
    $('material-hint').textContent=materials[selected].hint;
    setMode(mode,false);setPaused(paused);$('follow').checked=session.follow;
    if(!session.opened){centerCamera();session.opened=true;}
    levelReadout();battleReadout();resize();screen.focus({preventScroll:true});
  }
  $('open-menu').addEventListener('click',openMenu);
  $('start-match').addEventListener('click',()=>enterSession('match',true));
  $('continue-match').addEventListener('click',()=>enterSession('match'));
  $('open-lab').addEventListener('click',()=>enterSession('lab'));
  for(const [i,mission] of CaveSolo.list.entries()){
    const option=document.createElement('option');option.value=String(i);option.textContent=mission.name;
    $('mission-select').append(option);
  }
  $('mission-select').value='0';
  function missionPreview(){$('mission-preview').textContent=CaveSolo.list[Number($('mission-select').value)].briefing;}
  $('mission-select').addEventListener('change',missionPreview);missionPreview();
  $('start-solo').addEventListener('click',()=>enterSession('solo',true));
  $('continue-solo').addEventListener('click',()=>enterSession('solo'));
  for(const level of CaveLevels.list){
    const option=document.createElement('option');option.value=level.id;option.textContent=level.name;
    $('level-select').append(option);
  }
  $('level-select').addEventListener('change',e=>{
    if(view!=='lab'||!CaveLevels.get(e.target.value))return;
    scene=e.target.value;
    document.querySelectorAll('[data-scene]').forEach(el=>el.setAttribute('aria-pressed','false'));
    reset();
  });
  function levelReadout(){
    const level=world.level,theme=world.theme;
    const basic={arena:'Areena',cave:'Luola',lab:'Koekenttä',empty:'Tyhjä kenttä'};
    $('level-name').textContent=level?.name||basic[scene];
    $('level-theme').textContent=theme?.name||'Kivi · kultahiekka · sininen vesi';
    $('level-hint').textContent=level?.hint||'Muokkaa luolaa tai kokeile aineita ja lennokin varusteita.';
    $('level-select').value=level?.id||'';
    for(const b of document.querySelectorAll('.material')){
      const material=materials.find(m=>m.id===+b.dataset.material),color=theme?.palettes[material.id]?.[2];
      b.querySelector('.swatch').style.background=color?'rgb('+color.join(',')+')':material.color;
    }
  }

  for(const button of document.querySelectorAll('[data-flight]')) {
    const control=button.dataset.flight;
    const releaseButton=()=>{held.delete(control);button.classList.remove('is-held');};
    button.addEventListener('pointerdown',e=>{e.preventDefault();if(view==='menu')return;button.setPointerCapture(e.pointerId);held.add(control);button.classList.add('is-held');});
    for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])button.addEventListener(event,releaseButton);
    button.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();held.add(control);button.classList.add('is-held');}});
    button.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();releaseButton();}});
  }
  $('speed').addEventListener('change',e=>{if(view==='lab'){speed=+e.target.value;accumulator=0;}});
  $('sources').addEventListener('change',e=>{if(view==='lab')world.emitting=e.target.checked;});
  $('pan').addEventListener('click',()=>{panTool=!panTool;$('pan').setAttribute('aria-pressed',String(panTool));screen.classList.toggle('panning',panTool);});
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{
    if(view!=='lab')return;
    scene=b.dataset.scene;document.querySelectorAll('[data-scene]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));reset();
  }));
  const map=$('minimap');let mapDown=false;
  function mapPan(e){$('follow').checked=false;const rect=map.getBoundingClientRect();camera.x=(e.clientX-rect.left)*world.width/rect.width-160;camera.y=(e.clientY-rect.top)*world.height/rect.height-100;clampCamera();}
  map.addEventListener('pointerdown',e=>{e.preventDefault();mapDown=true;map.setPointerCapture(e.pointerId);mapPan(e);});
  map.addEventListener('pointermove',e=>{if(mapDown)mapPan(e);});
  map.addEventListener('pointerup',()=>mapDown=false);map.addEventListener('pointercancel',()=>mapDown=false);
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('pointer-status').textContent='Selain ei salli koko näytön tilaa.';}}
  $('fullscreen').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',resize);
  $('help-button').addEventListener('click',()=>{$('help').hidden=!$('help').hidden;$('help-button').setAttribute('aria-expanded',String(!$('help').hidden));});
  const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyJ','KeyK','KeyL','KeyI','KeyQ'];
  window.addEventListener('keydown',e=>{
    if(view==='menu')return;
    if(e.code==='Escape'){e.preventDefault();openMenu();return;}
    if(e.target.matches('input:not([type=checkbox]),select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.code==='Space'&&e.target.matches('button,input'))return;
    if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);return;}
    if(e.repeat)return;
    if(e.code==='Space'){e.preventDefault();setPaused(!paused);}
    else if(e.code==='Period'){$('step').click();}
    else if(e.code==='KeyR'){if(view==='lab'&&(e.shiftKey||mode==='edit'))reset();else if(!e.shiftKey)respawn();}
    else if(e.code==='KeyE')setMode(mode==='fly'?'edit':'fly');
    else if(e.code==='KeyC')$('follow').checked=!$('follow').checked;
    else if(e.code==='KeyF')fullscreen();
    else if(e.code==='BracketLeft')setRadius(radius-1);else if(e.code==='BracketRight')setRadius(radius+1);
    else if(/^Digit[1-8]$/.test(e.code))selectMaterial(+e.code.slice(-1)-1);
    else if(e.key==='?')$('help-button').click();
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));
  function clearInput(){keys.clear();held.clear();mapDown=false;release();document.querySelectorAll('[data-flight]').forEach(b=>b.classList.remove('is-held'));}
  window.addEventListener('blur',()=>{clearInput();if((view==='match'||view==='solo')&&!combat.result)setPaused(true);});
  document.addEventListener('visibilitychange',()=>{clearInput();lastTime=0;accumulator=0;if(document.hidden&&(view==='match'||view==='solo')&&!combat.result)setPaused(true);});
  window.addEventListener('resize',resize);
  function flightInput(){return {
    thrust:keys.has('KeyW')||keys.has('ArrowUp')||held.has('thrust'),
    turn:(keys.has('KeyD')||keys.has('ArrowRight')||held.has('right')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')||held.has('left')?1:0),
    brake:keys.has('KeyS')||keys.has('ArrowDown')||held.has('brake'),
    fire:keys.has('KeyJ')||held.has('fire')||held.has('mouse-fire'),
    grenade:keys.has('KeyK')||held.has('grenade'),water:keys.has('KeyL')||held.has('water'),
    shield:keys.has('KeyI')||held.has('shield')||held.has('mouse-shield'),blink:keys.has('KeyQ')||held.has('blink'),
  };}
  function simulate(){
    if(view==='match')match.step(flightInput());
    else if(view==='solo')solo.step(flightInput());
    else if(view==='lab'){world.step();if(mode==='fly')combat.step(flightInput());}
  }
  function renderRoster(){
    const actors=combat.active();
    if(actors.length!==rosterActors.length||actors.some((a,i)=>a!==rosterActors[i])){
      rosterActors=actors.slice();$('roster').replaceChildren();
      for(const actor of actors.slice().sort((a,b)=>a.team-b.team)){
        const row=document.createElement('div');row.className='roster-actor '+(actor.team?'enemy':actor.pilot?'ally':'human');
        const label=document.createElement('div');label.className='hull-label';
        const name=document.createElement('span');name.textContent=actor.name;
        const value=document.createElement('output');label.append(name,value);
        const meter=document.createElement('meter');meter.min=0;meter.max=100;meter.setAttribute('aria-label',actor.name+' · runko');
        row.append(label,meter);$('roster').append(row);row.actor=actor;
      }
    }
    for(const row of $('roster').children){
      row.classList.toggle('eliminated',row.actor.dead);row.querySelector('meter').value=row.actor.health;
      row.querySelector('output').textContent=row.actor.dead?'Poissa':Math.ceil(row.actor.health)+' %';
    }
  }
  function battleReadout(){
    const g=drone.gear;
    $('pulse-status').textContent=g.overheated?'Jäähtyy':Math.round(g.heat*100)+' % lämpö';
    $('grenade-status').textContent=g.grenades+' / 3';$('water-status').textContent=Math.floor(g.water)+' %';
    $('shield-status').textContent=g.shieldLock?'Latautuu':Math.ceil(g.energy)+' %';
    $('blink-status').textContent=drone.dead?'Poissa':g.blink?g.blink.toFixed(1)+' s':combat.blinkTarget(drone)?'Valmis':'Ei tilaa';
    const charge={fire:1-g.heat,grenade:g.grenades/3,water:g.water/100,shield:g.energy/100,blink:1-g.blink/4};
    for(const b of $('weapons').querySelectorAll('button'))b.style.setProperty('--charge',charge[b.dataset.flight]*100+'%');
    for(const b of document.querySelectorAll('[data-flight]'))b.disabled=drone.dead||!!combat.result;
    renderRoster();$('score').textContent=combat.score.join(' : ');
    if(solo){soloReadout();return;}
    const watching=drone.dead&&!combat.result&&combat.living(0).length>0;
    $('combat-hint').textContent=combat.result?'Erä päättyi. Jatka kun olet valmis.':watching?'Sinut pudotettiin. Siipi taistelee vielä!':!combat.started?'Erä alkaa ensimmäisestä ohjauksesta.':match?'Tuhoa koko vihollisjoukkue.':combat.enabled?'Oranssi lennokki on vastustajasi.':'Vapaa harjoittelu · tekoäly pois päältä.';
    $('round-result').hidden=mode!=='fly'||!combat.result;
    $('round-title').textContent=match?.winner?(match.winner==='won'?'Taso voitettu!':'Ottelu hävitty'):combat.result==='won'?'Erävoitto!':combat.result==='draw'?'Tasapeli':combat.enabled?'Erä hävitty':'Lennokki hajosi';
    const action=match?(match.phase==='finished'?'Uusi ottelu':match.phase==='stage-over'?'Seuraava taso':combat.result?'Seuraava erä':'Luovuta erä'):'Uusi erä';
    $('respawn').textContent=action+' · R';$('respawn').title=match&&!combat.result?'Luovutus antaa eräpisteen vihollisille · R':action+' · R';
    $('next-round').textContent=action+' · R';
    if(match){
      $('round-number').textContent='Vaikeus '+(match.stage+1)+' · erä '+match.round;
      $('lineup-label').textContent=(combat.actors.some(a=>a.team===0&&a!==drone)?'Sinä + Siipi':'Sinä')+' vs '+combat.actors.filter(a=>a.team===1).length;
      for(const [i,id] of ['our-wins','their-wins'].entries()){
        $(id).textContent=Array.from({length:CaveMatch.WINS},(_,n)=>n<match.score[i]?'●':'○').join(' ');
        $(id).setAttribute('aria-label',(i?'Viholliset':'Oma joukkue')+': '+match.score[i]+' voittoa');
      }
      const firstStage=Math.max(0,match.stage-2);
      for(const [i,el] of Array.from($('difficulty-ladder').children).entries()){
        const stage=firstStage+i;el.textContent=stage===0?'2v1':'1v'+stage;
        if(stage===match.stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');
        el.classList.toggle('completed',stage<match.stage||(stage===match.stage&&match.winner==='won'));
      }
      const next=match.lineup(match.stage+(match.winner==='won'?1:0)),lineup=next.allies?'sinä + Siipi vastaan 1':'sinä vastaan '+next.enemies;
      $('round-description').textContent=match.winner?match.score.join(' : ')+' · '+(match.winner==='won'?'Viides voitto! Seuraavalla tasolla '+lineup+'. Pisteet alkavat nollasta.':'Viholliset saivat viisi voittoa. Uusi yritys?'):
        (combat.result==='draw'?'Ei eräpisteitä. ':'')+'Seuraavaksi '+lineup+'.';
      if(match.phase!=='finished')$('round-description').textContent+=' Kenttä: '+match.nextLevel.name+'.';
    }else $('round-description').textContent='Maasto ja pisteet säilyvät. Uudet lennokit ja varusteet.';
  }
  function clock(seconds){const s=Math.max(0,Math.ceil(seconds));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
  function soloReadout(){
    const m=solo.mission,rescue=m.id==='rescue',won=solo.phase==='won';
    $('mission-number').textContent=(solo.index+1)+' / '+CaveSolo.list.length;
    $('mission-objective').textContent=m.objective;
    $('mission-count').textContent=rescue?solo.rescued+' / 3 turvassa':Math.min(100,Math.floor(solo.progress*100))+' % · '+(solo.stable>=1?'Valmis':solo.amount>=m.goal?'Tasaantuu…':'Täytä allas');
    $('mission-time').textContent=(m.limit?'Aikaa ':'Aika ')+clock(m.limit?solo.remaining:solo.elapsed);
    $('mission-meter').value=solo.progress;
    $('mission-cargo').textContent=rescue?'Kyydissä '+solo.cargo+' / 2 · moottorin kiihtyvyys '+Math.round(100/(1+solo.cargo*.22))+' %':'Tavoite: '+m.goal+' solua '+(m.material===M.WATER?'vettä':'hiekkaa')+' vähintään sekunnin ajan.';
    $('mission-advice').textContent=m.hint;
    $('combat-hint').textContent=solo.status;
    $('round-result').hidden=solo.phase!=='won'&&solo.phase!=='lost';
    $('round-title').textContent=won?'Tehtävä suoritettu!':'Tehtävä epäonnistui';
    $('round-description').textContent=solo.reason+(won?' Aika '+clock(solo.elapsed)+'. Paras '+clock(solo.records[m.id])+'.':'');
    const action=won?(solo.index+1<CaveSolo.list.length?'Seuraava tehtävä':'Päävalikko'):'Yritä alusta';
    $('respawn').textContent=action+' · R';$('respawn').title=won?action:'Aloita tämä tehtävä ja sen maasto alusta · R';
    $('next-round').textContent=action+' · R';
  }
  function flightReadout(){
    const watching=drone.dead&&!combat.result&&combat.living(0).length>0;
    const text=watching?'Seurataan Siiven taistelua':drone.blocked?'Lähtöpaikka tukossa · kaiva tilaa labrassa':drone.dead?'Lennokki hajosi':!combat.started?'Valmiina · ↑ tai W käynnistää '+(solo?'tehtävän':'erän'):Math.round(drone.speed)+' px/s · Runko '+Math.ceil(drone.health)+' %'+(drone.wet>.25?' · Vedessä':'');
    $('pointer-status').textContent=text;$('pointer-status').classList.toggle('damaged',drone.health<40);battleReadout();
  }
  function frame(now){
    const dt=lastTime?Math.min(100,now-lastTime):16.67;lastTime=now;
    if(!document.hidden&&view!=='menu'){
      const dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
      const dy=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
      if(mode==='edit'&&(dx||dy)){camera.x+=dx*Math.max(1,dt*.15);camera.y+=dy*Math.max(1,dt*.15);clampCamera();pointer.inside=false;}
      if(pointer.down&&!pointer.panning)paint();
      if(!paused){
        accumulator+=dt*speed;let steps=0;const start=performance.now();
        while(accumulator>=1000/60&&steps<6){simulate();accumulator-=1000/60;steps++;stepCount++;}
        simMS=simMS*.95+(performance.now()-start)*.05;
        if(steps===6)accumulator=0;
      }
      if(mode==='fly'&&$('follow').checked&&!pointer.panning){
        const target=focusActor(),ox=target.x-camera.x-160,oy=target.y-camera.y-100;
        if(Math.abs(ox)>42)camera.x+=ox-Math.sign(ox)*42;
        if(Math.abs(oy)>28)camera.y+=oy-Math.sign(oy)*28;
        clampCamera();
      }
      renderer.render(camera.x,camera.y,mode==='edit'?pointer:null,materials[selected].id,radius,drone,combat,solo);
      if(frameCount%6===0){renderer.minimap(camera.x,camera.y,drone,combat,solo);if(mode==='fly')flightReadout();}
      frameCount++;
      if(now-statTime>1000){$('performance').textContent=paused?'Tauolla':Math.round(stepCount*1000/(now-statTime))+' askelta/s';stepCount=0;statTime=now;}
    }
    raf=requestAnimationFrame(frame);
  }
  resize();openMenu();raf=requestAnimationFrame(frame);
  // Inspectable references always point at the session currently shown.
  window.vibelentely=window.luolalabra={
    get world(){return world;},get drone(){return drone;},get combat(){return combat;},get match(){return match;},
    get solo(){return solo;},
    get camera(){return camera;},materials,pause:setPaused,reset,respawn,setMode,renderer,openMenu,enterSession,
    get scene(){return world.level?.id||scene;},get state(){return{view,paused,selected,radius,speed,mode,simMS,screen:[screen.width,screen.height],camera:{...camera}};},
  };
})();
