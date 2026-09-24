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
  const screen=$('screen'),world=new World(),renderer=new CaveRenderer(world,screen,$('minimap'));
  world.generate('arena');
  const drone=new CaveFlight.Drone(world),combat=new CaveCombat.Combat(world,drone),held=new Set();
  const camera={x:16,y:34},keys=new Set(),pointer={inside:false,down:false,x:0,y:0,panning:false,erase:false};
  let selected=0,radius=5,paused=false,scene='arena',panTool=false,speed=1,mode='fly';
  let accumulator=0,lastTime=0,statTime=0,frameCount=0,stepCount=0,raf=0,simMS=0,lastBrush=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function clampCamera(){camera.x=clamp(Math.round(camera.x),0,world.width-320);camera.y=clamp(Math.round(camera.y),0,world.height-200);}
  function setMode(value){
    mode=value;keys.clear();held.clear();document.querySelectorAll('[data-flight]').forEach(b=>b.classList.remove('is-held'));pointer.down=false;pointer.panning=false;pointer.inside=false;lastBrush=null;
    panTool=false;$('pan').setAttribute('aria-pressed','false');screen.classList.remove('panning','dragging');
    screen.classList.toggle('flying',mode==='fly');
    $('fly-mode').setAttribute('aria-pressed',String(mode==='fly'));
    $('edit-mode').setAttribute('aria-pressed',String(mode==='edit'));
    $('flight-controls').hidden=mode!=='fly';$('flight-note').hidden=mode!=='fly';$('edit-note').hidden=mode!=='edit';
    $('weapons').hidden=mode!=='fly';$('combat-panel').hidden=mode!=='fly';$('editor-controls').hidden=mode!=='edit';
    $('round-result').hidden=mode!=='fly'||!combat.result;
    if(mode==='fly'){$('follow').checked=true;camera.x=drone.x-160;camera.y=drone.y-100;clampCamera();}
    else{$('pointer-status').textContent='Valitse aine ja piirrä luolaan.';$('pointer-status').classList.remove('damaged');}
  }
  function selectMaterial(index){
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
    clearInput();pointer.inside=false;world.generate(scene);world.emitting=$('sources').checked;combat.reset(true);battleReadout();
    camera.x=drone.x-160;camera.y=drone.y-100;clampCamera();accumulator=0;
    $('follow').checked=true;if(mode==='edit')$('pointer-status').textContent='Valitse aine ja piirrä luolaan.';
    $('sources').disabled=scene==='empty';
  }
  function resize(){
    const compact=window.innerWidth<=680;
    const maxWidth=window.innerWidth-(compact?24:64+264);
    const scale=Math.max(1,Math.min(5,Math.floor(maxWidth/320),compact?2:Math.max(1,Math.floor((window.innerHeight-350)/200))));
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
    if(mode!=='edit'||!pointer.down||pointer.panning||!pointer.inside)return;
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
  $('step').addEventListener('click',()=>{setPaused(true);simulate();});
  $('reset').addEventListener('click',reset);
  $('fly-mode').addEventListener('click',()=>setMode('fly'));
  $('edit-mode').addEventListener('click',()=>setMode('edit'));
  function respawn(){combat.reset();clearInput();battleReadout();$('follow').checked=true;camera.x=drone.x-160;camera.y=drone.y-100;clampCamera();}
  $('respawn').addEventListener('click',respawn);
  $('next-round').addEventListener('click',respawn);
  $('opponent').addEventListener('change',e=>{combat.setOpponent(e.target.checked);battleReadout();});
  for(const button of document.querySelectorAll('[data-flight]')) {
    const control=button.dataset.flight;
    const releaseButton=()=>{held.delete(control);button.classList.remove('is-held');};
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held.add(control);button.classList.add('is-held');});
    for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])button.addEventListener(event,releaseButton);
    button.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();held.add(control);button.classList.add('is-held');}});
    button.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();releaseButton();}});
  }
  $('speed').addEventListener('change',e=>{speed=+e.target.value;accumulator=0;});
  $('sources').addEventListener('change',e=>world.emitting=e.target.checked);
  $('pan').addEventListener('click',()=>{panTool=!panTool;$('pan').setAttribute('aria-pressed',String(panTool));screen.classList.toggle('panning',panTool);});
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{
    scene=b.dataset.scene;document.querySelectorAll('[data-scene]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));reset();
  }));
  const map=$('minimap');let mapDown=false;
  function mapPan(e){$('follow').checked=false;const rect=map.getBoundingClientRect();camera.x=(e.clientX-rect.left)*world.width/rect.width-160;camera.y=(e.clientY-rect.top)*world.height/rect.height-100;clampCamera();}
  map.addEventListener('pointerdown',e=>{e.preventDefault();mapDown=true;map.setPointerCapture(e.pointerId);mapPan(e);});
  map.addEventListener('pointermove',e=>{if(mapDown)mapPan(e);});
  map.addEventListener('pointerup',()=>mapDown=false);map.addEventListener('pointercancel',()=>mapDown=false);
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.app').requestFullscreen();}catch{$('pointer-status').textContent='Selain ei salli koko näytön tilaa.';}}
  $('fullscreen').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',resize);
  $('help-button').addEventListener('click',()=>{$('help').hidden=!$('help').hidden;$('help-button').setAttribute('aria-expanded',String(!$('help').hidden));});
  const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyJ','KeyK','KeyL','KeyI','KeyQ'];
  window.addEventListener('keydown',e=>{
    if(e.target.matches('input:not([type=checkbox]),select,textarea')||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.code==='Space'&&e.target.matches('button,input'))return;
    if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);return;}
    if(e.repeat)return;
    if(e.code==='Space'){e.preventDefault();setPaused(!paused);}
    else if(e.code==='Period'){$('step').click();}
    else if(e.code==='KeyR'){if(e.shiftKey||mode==='edit')reset();else respawn();}
    else if(e.code==='KeyE')setMode(mode==='fly'?'edit':'fly');
    else if(e.code==='KeyC')$('follow').checked=!$('follow').checked;
    else if(e.code==='KeyF')fullscreen();
    else if(e.code==='BracketLeft')setRadius(radius-1);else if(e.code==='BracketRight')setRadius(radius+1);
    else if(/^Digit[1-8]$/.test(e.code))selectMaterial(+e.code.slice(-1)-1);
    else if(e.key==='?')$('help-button').click();
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));
  function clearInput(){keys.clear();held.clear();release();document.querySelectorAll('[data-flight]').forEach(b=>b.classList.remove('is-held'));}
  window.addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',()=>{clearInput();lastTime=0;accumulator=0;});
  window.addEventListener('resize',resize);
  function flightInput(){return {
    thrust:keys.has('KeyW')||keys.has('ArrowUp')||held.has('thrust'),
    turn:(keys.has('KeyD')||keys.has('ArrowRight')||held.has('right')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')||held.has('left')?1:0),
    brake:keys.has('KeyS')||keys.has('ArrowDown')||held.has('brake'),
    fire:keys.has('KeyJ')||held.has('fire')||held.has('mouse-fire'),
    grenade:keys.has('KeyK')||held.has('grenade'),water:keys.has('KeyL')||held.has('water'),
    shield:keys.has('KeyI')||held.has('shield')||held.has('mouse-shield'),blink:keys.has('KeyQ')||held.has('blink'),
  };}
  function simulate(){world.step();if(mode==='fly')combat.step(flightInput());}
  function battleReadout(){
    const g=drone.gear;
    $('pulse-status').textContent=g.overheated?'Jäähtyy':Math.round(g.heat*100)+' % lämpö';
    $('grenade-status').textContent=g.grenades+' / 3';$('water-status').textContent=Math.floor(g.water)+' %';
    $('shield-status').textContent=g.shieldLock?'Latautuu':Math.ceil(g.energy)+' %';
    $('blink-status').textContent=g.blink?g.blink.toFixed(1)+' s':combat.blinkTarget(drone)?'Valmis':'Ei tilaa';
    const charge={fire:1-g.heat,grenade:g.grenades/3,water:g.water/100,shield:g.energy/100,blink:1-g.blink/4};
    for(const b of $('weapons').querySelectorAll('button'))b.style.setProperty('--charge',charge[b.dataset.flight]*100+'%');
    $('player-health').value=drone.health;$('player-hull').textContent=Math.ceil(drone.health)+' %';
    $('enemy-health').value=combat.enabled?combat.enemy.health:0;$('enemy-hull').textContent=combat.enabled?Math.ceil(combat.enemy.health)+' %':'Pois';
    $('score').textContent=combat.score.join(' : ');
    $('combat-hint').textContent=!drone.started?'Erä alkaa ensimmäisestä ohjauksesta.':combat.result?'R aloittaa heti uuden erän.':combat.enabled?'Oranssi lennokki on vastustajasi.':'Vapaa harjoittelu · tekoäly pois päältä.';
    $('round-result').hidden=mode!=='fly'||!combat.result;
    $('round-title').textContent=combat.result==='won'?'Erävoitto!':combat.result==='draw'?'Tasapeli':combat.enabled?'Erä hävitty':'Lennokki hajosi';
  }
  function flightReadout(){
    const text=drone.blocked?'Lähtöpaikka tukossa · kaiva tilaa muokkaustilassa':drone.dead?'Lennokki hajosi · R tuo uuden lennokin':!drone.started?'Valmiina · ↑ tai W käynnistää moottorin':Math.round(drone.speed)+' px/s · Runko '+Math.ceil(drone.health)+' %'+(drone.wet>.25?' · Vedessä':'');
    $('pointer-status').textContent=text;$('pointer-status').classList.toggle('damaged',drone.health<40);battleReadout();
  }
  function frame(now){
    const dt=lastTime?Math.min(100,now-lastTime):16.67;lastTime=now;
    if(!document.hidden){
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
        const ox=drone.x-camera.x-160,oy=drone.y-camera.y-100;
        if(Math.abs(ox)>42)camera.x+=ox-Math.sign(ox)*42;
        if(Math.abs(oy)>28)camera.y+=oy-Math.sign(oy)*28;
        clampCamera();
      }
      renderer.render(camera.x,camera.y,mode==='edit'?pointer:null,materials[selected].id,radius,drone,combat);
      if(frameCount%6===0){renderer.minimap(camera.x,camera.y,drone,combat);if(mode==='fly')flightReadout();}
      frameCount++;
      if(now-statTime>1000){$('performance').textContent=paused?'Tauolla':Math.round(stepCount*1000/(now-statTime))+' askelta/s';stepCount=0;statTime=now;}
    }
    raf=requestAnimationFrame(frame);
  }
  selectMaterial(0);reset();setMode('fly');resize();raf=requestAnimationFrame(frame);
  // Deliberately inspectable: no build tools or hidden server state are required.
  window.vibelentely=window.luolalabra={world,drone,combat,camera,materials,pause:setPaused,reset,respawn,setMode,renderer,get scene(){return scene;},get state(){return{paused,selected,radius,speed,mode,simMS,screen:[screen.width,screen.height],camera:{...camera}};}};
})();
