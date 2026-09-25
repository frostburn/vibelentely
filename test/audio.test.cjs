const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const Music=require('../dist/music.js');
const DSP=require('../dist/audio-dsp.js');
const {World,M}=require('../dist/simulation.js');
const {Drone}=require('../dist/flight.js');
require('../dist/ai.js');require('../dist/tools.js');
const {Combat}=require('../dist/combat.js');
const rms=a=>Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length);

function browser({fallback=false,blocked=false,saved=null,debug=false}={}){
  const messages=[],contexts=[],writes=[],reads=[];let modules=0;
  class Node {
    constructor(){this.connections=[];}
    connect(node){this.connections.push(node);}
  }
  class Context {
    constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=48000;this.destination={speaker:true};contexts.push(this);
      this.audioWorklet={addModule:async()=>{modules++;if(fallback)throw Error('unavailable');}};
    }
    async resume(){if(blocked){blocked=false;throw Error('gesture required');}this.state='running';}
    createGain(){const n=new Node();n.gain={value:1,cancelScheduledValues(){},setTargetAtTime(value,time,smoothing){this.value=value;this.smoothing=smoothing;}};return n;}
    createScriptProcessor(size,inputs,outputs){assert.equal(outputs,1);this.fallback=new Node();return this.fallback;}
  }
  class Worklet extends Node {constructor(){super();this.port={postMessage:m=>messages.push(m)};}}
  const context={CAVE_AUDIO_DEBUG:debug,CaveMusic:Music,CaveAudioDSP:DSP,AudioContext:Context,AudioWorkletNode:Worklet,Blob,
    URL:{createObjectURL:()=> 'blob:audio-test',revokeObjectURL(){}},
    localStorage:{getItem:k=>{reads.push(k);return saved;},setItem:(k,v)=>writes.push([k,JSON.parse(v)])}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../dist/audio.js'),'utf8'),context);
  return {sound:new context.CaveAudio.Sound(),messages,contexts,writes,reads,get modules(){return modules;}};
}
function game(){const world=new World(320,240);world.spawn={x:80,y:110};const player=new Drone(world),combat=new Combat(world,player);combat.enabled=false;player.angle=0;return {world,player,combat};}

test('The master DAC holds 11025 samples/s and quantises to signed 8-bit levels, including exact silence',()=>{
  for(const rate of [44100,48000,96000]){
    const c=new DSP.Cabinet(rate);let changes=0,last=NaN;
    for(let i=0;i<rate/10;i++){
      const out=c.process(Math.sin(i*.11)*2);assert.ok(Number.isFinite(out));
      assert.equal(c.held*128,Math.round(c.held*128));assert.ok(c.held>=-1&&c.held<=127/128);
      if(c.held!==last)changes++;last=c.held;
    }
    assert.ok(changes>400&&changes<=1104,'held samples must not follow the device sample rate');
    const quiet=new DSP.Cabinet(rate);for(let n=0;n<128;n++)assert.equal(quiet.process(.001),0);
  }
});

test('The cabinet removes bass/DC and dulls treble after quantisation',()=>{
  function tone(frequency){const rate=48000,c=new DSP.Cabinet(rate),out=new Float32Array(12000);
    for(let i=0;i<out.length;i++)out[i]=c.process(.45*Math.sin(2*Math.PI*frequency*i/rate));return rms(out.subarray(2000));}
  const middle=tone(700);assert.ok(middle>tone(35)*3);assert.ok(middle>tone(4000)*3);
  const c=new DSP.Cabinet(48000);let end;for(let n=0;n<24000;n++)end=c.process(.5);assert.ok(Math.abs(end)<1e-8);
});

test('Partial blaster sounds are weaker; synthesis stays bounded and clears all continuous tools',()=>{
  function shot(power){const synth=new DSP.Synth(),out=new Float32Array(18000);synth.event('blaster',1,power);synth.render(out);return rms(out);}
  assert.ok(shot(1)>shot(.99)*1.5);
  const synth=new DSP.Synth();
  for(let i=0;i<100;i++)synth.event('explosion');assert.equal(synth.voices.length,24);
  synth.controls({engine:1,wet:1,lava:1,vacuum:1,charge:1,shield:1});const out=new Float32Array(24000);synth.render(out);
  assert.ok(rms(out)>.02);for(const value of out)assert.ok(Number.isFinite(value)&&Math.abs(value)<1.5);
  synth.clear();synth.render(new Float32Array(48000));const tail=new Float32Array(128);synth.render(tail);
  assert.equal(synth.voices.length,0);assert.ok(tail.every(v=>Math.abs(v)<1e-8));
});

test('Render block boundaries do not reset oscillator phase, sample hold or filters',()=>{
  const a=new DSP.Synth(44100),b=new DSP.Synth(44100);a.event('blink');b.event('blink');a.controls({engine:1});b.controls({engine:1});
  const whole=new Float32Array(4096),blocks=new Float32Array(4096);a.render(whole);
  for(let i=0;i<blocks.length;i+=128)b.render(blocks.subarray(i,i+128));assert.deepEqual(blocks,whole);
});

test('The exported AudioWorklet executes the same DSP and responds to clear messages',()=>{
  let Processor;const scope={sampleRate:48000,AudioWorkletProcessor:class{constructor(){this.port={postMessage(){}};}},registerProcessor:(name,ctor)=>{assert.equal(name,'cave-speaker');Processor=ctor;}};
  vm.createContext(scope);vm.runInContext(DSP.workletSource(),scope);
  const p=new Processor(),reference=new DSP.Synth();
  p.port.onmessage({data:{type:'event',kind:'pulse',gain:1,power:1}});reference.event('pulse');
  const out=new Float32Array(128),expected=new Float32Array(128);p.process([],[[out]]);reference.render(expected);assert.deepEqual(out,expected);
  p.port.onmessage({data:{type:'controls',values:{engine:1,charge:1}}});p.process([],[[out]]);
  p.port.onmessage({data:{type:'clear'}});p.process([],[[new Float32Array(48000)]]);p.process([],[[out]]);assert.ok(out.every(x=>Math.abs(x)<1e-8));
});

test('One audio context feeds only the final master gain; volume changes do not touch the DSP',async()=>{
  const b=browser(),s=b.sound;assert.equal(b.contexts.length,0,'page load must not start audio');s.setActive(true);
  await Promise.all([s.unlock(),s.unlock()]);assert.equal(b.contexts.length,1);assert.equal(b.modules,1);
  assert.equal(s.node.connections[0],s.master);assert.equal(s.master.connections[0],s.context.destination);assert.equal(s.master.connections.length,1);
  assert.equal(s.master.gain.value,.36);const before=b.messages.length;s.setVolume(25);
  assert.ok(b.messages.slice(before).every(m=>m.type==='music'&&m.level===.45),'master volume must not alter music mix level, drive, DAC or filters');assert.equal(s.master.gain.value,.0625);assert.ok(s.master.gain.smoothing>0);
  s.toggleMute();assert.equal(s.master.gain.value,0);assert.equal(s.volume,25);s.toggleMute();assert.equal(s.master.gain.value,.0625);
  s.setVolume(0);assert.equal(s.master.gain.value,0);assert.equal(b.writes.at(-1)[1].volume,0);
});

test('Local-file fallback uses the same cabinet, and blocked autoplay can recover on a later gesture',async()=>{
  const b=browser({fallback:true,blocked:true}),s=b.sound;s.setActive(true);
  assert.equal(await s.unlock(),false);assert.equal(await s.unlock(),true);assert.ok(s.context.fallback);assert.equal(b.modules,1);
  s.cue('pulse');const out=new Float32Array(1024);s.node.onaudioprocess({outputBuffer:{getChannelData:()=>out}});
  const reference=new DSP.Synth(),expected=new Float32Array(1024);reference.event('pulse');reference.render(expected);assert.deepEqual(out,expected);
  s.setActive(false);assert.equal(s.master.gain.value,0);assert.equal(s.synth.voices.length,0);
});

test('Saved mute/volume are validated and missing or denied audio/storage cannot break the game',async()=>{
  const b=browser({saved:'{"volume":23,"muted":true}'});assert.equal(b.sound.volume,23);assert.equal(b.sound.muted,true);
  b.sound.setActive(true);await b.sound.unlock();assert.equal(b.sound.master.gain.value,0);
  const scope={CaveMusic:Music,CaveAudioDSP:DSP};Object.defineProperty(scope,'localStorage',{get(){throw Error('blocked');}});
  vm.createContext(scope);vm.runInContext(fs.readFileSync(require.resolve('../dist/audio.js'),'utf8'),scope);
  const s=new scope.CaveAudio.Sound();s.setVolume(30);assert.equal(await s.unlock(),false);assert.equal(s.status,'unsupported');
  assert.equal(browser({saved:'not json'}).sound.volume,60);
});

test('Shots that hit in their first step still sound; explosions, heat and results sound only once',async()=>{
  const {world,player,combat}=game(),b=browser(),s=b.sound;s.watch(combat);s.setActive(true);await s.unlock();
  for(let y=90;y<130;y++)world.set(y*world.width+87,M.ROCK);
  assert.equal(combat.shoot(player,'pulse'),true);const shot=combat.projectiles.pop();assert.equal(combat.projectileStep(shot,1/60),false);
  world.explode(160,110);player.gear.blasterHot=true;s.update(player);s.update(player);
  combat.finish('won');s.update(player);s.update(player);
  const events=b.messages.filter(m=>m.type==='event').map(m=>m.kind);
  for(const kind of ['pulse','explosion','hot','won'])assert.equal(events.filter(x=>x===kind).length,1,kind);
  const count=events.length;s.setActive(false);combat.sound('blink',player);s.update(player);
  assert.equal(b.messages.filter(m=>m.type==='event').length,count);
});

test('Distant sounds attenuate, session changes discard old events, and continuous flight sounds stop at round end',async()=>{
  const {player,combat}=game(),b=browser(),s=b.sound;s.watch(combat);s.setActive(true);await s.unlock();
  s.at('pulse',player.x+280,player.y);assert.equal(b.messages.at(-1).gain,.2);
  const n=b.messages.length;s.at('pulse',player.x+600,player.y);assert.equal(b.messages.length,n);
  player.throttle=1;player.gear.charge=.5;s.update(player);assert.equal(b.messages.at(-1).values.engine,1);
  combat.finish('lost');s.update(player);assert.equal(Object.keys(b.messages.at(-1).values).length,0);
  const next=game();next.world.explode(100,110);s.watch(next.combat);assert.equal(combat.onSound,null);
  const old=b.messages.filter(m=>m.type==='event').length;s.update(next.player);assert.equal(b.messages.filter(m=>m.type==='event').length,old);
});

test('Menu music uses the final master, remembers its mix level, and can pause independently of effects',async()=>{
  const b=browser({fallback:true,saved:'{"musicVolume":32,"musicEnabled":true}'}),s=b.sound;
  s.setMusicActive(true);await s.unlock();assert.equal(s.active,false);assert.equal(s.master.gain.value,.36);
  assert.equal(s.synth.music.level,.32);assert.equal(s.synth.music.playing,true);
  s.synth.render(new Float32Array(1024));const position=s.synth.music.current.frames;
  s.watch(game().combat);assert.equal(s.synth.music.current.frames,position);
  s.setActive(true);s.toggleMusic();assert.equal(s.synth.music.playing,false);assert.equal(s.master.gain.value,.36);
  s.cue('pulse');assert.equal(s.synth.voices.at(-1).kind,'pulse');
  s.setMusicVolume(21);s.toggleMusic();assert.equal(s.synth.music.level,.21);
  s.toggleMute();assert.equal(s.synth.music.playing,false);assert.equal(s.master.gain.value,0);
  s.toggleMute();assert.equal(s.synth.music.playing,true);assert.equal(s.musicVolume,21);
  s.setMusicActive(false);assert.equal(s.synth.music.playing,false);assert.equal(b.writes.at(-1)[1].musicVolume,21);
});

test('Playlist choices survive reloads and automatic updates cannot overwrite a newer manual choice',async()=>{
  const b=browser({saved:'{"musicTrack":"kuparisydan","musicRotation":false}'}),s=b.sound;
  assert.equal(s.musicTrack,'kuparisydan');assert.equal(s.musicRotation,false);
  s.setMusicActive(true);await s.unlock();
  assert.ok(b.messages.some(m=>m.type==='playlist'&&m.track==='kuparisydan'&&m.autoAdvance===false));
  s.setMusicTrack('revontulivirta');const request=s.musicRequest;
  s.node.port.onmessage({data:{type:'music-state',track:'basalttiyo',request:request-1}});
  assert.equal(s.musicTrack,'revontulivirta','queued auto-advance must not undo manual selection');
  s.node.port.onmessage({data:{type:'music-state',track:'basalttiyo',request}});
  assert.equal(s.musicTrack,'basalttiyo');assert.equal(b.writes.at(-1)[1].musicTrack,'basalttiyo');
  s.setMusicRotation(true);assert.equal(b.messages.at(-1).autoAdvance,true);assert.equal(b.writes.at(-1)[1].musicRotation,true);
  s.setMusicTrack('missing');assert.equal(s.musicTrack,'basalttiyo');
  assert.equal(browser({saved:'{"musicTrack":"removed"}'}).sound.musicTrack,'basalttiyo');
  assert.equal(browser({saved:'{"volume":30}'}).sound.musicRotation,true,'old preferences enable rotation by default');
});

test('Local-file playback reports real automatic track changes and preserves repeat mode when adjusting volume',async()=>{
  const b=browser({fallback:true}),s=b.sound;s.setMusicActive(true);await s.unlock();
  const render=()=>s.node.onaudioprocess({outputBuffer:{getChannelData:()=>new Float32Array(1024)}});
  const t=s.synth.music.current;t.row=t.progression.length*16-1;t.loops=2;t.remaining=0;render();
  assert.equal(s.musicTrack,'kuparisydan');assert.equal(b.writes.at(-1)[1].musicTrack,'kuparisydan');
  s.setMusicRotation(false);s.setMusicVolume(28);s.setVolume(42);
  assert.equal(s.synth.music.autoAdvance,false);assert.equal(s.synth.music.current.song.id,'kuparisydan');
  s.toggleMute();const position=s.synth.music.current.frames;render();assert.equal(s.synth.music.current.frames,position);
  s.setMusicTrack('revontulivirta');render();assert.equal(s.musicTrack,'revontulivirta');assert.equal(s.synth.music.current.frames,0);
  s.toggleMute();render();assert.ok(s.synth.music.current.frames>0);
});

test('Debug builds retain separate validated listening preferences and route both modes through the final master',async()=>{
  for(const fallback of [false,true]){
    const b=browser({debug:true,fallback}),s=b.sound;
    assert.equal(s.debug.arpHz,50);assert.equal(s.debug.arpSolo,true);assert.equal(s.musicRotation,false);
    assert.equal(b.reads[0],'vibelentely.audio.debug');
    s.setDebug({arpHz:75,bypass:true});s.setMusicActive(true);await s.unlock();
    assert.equal(s.node.connections[0],s.master);assert.equal(s.master.connections[0],s.context.destination);
    if(fallback){assert.equal(s.synth.debugState.bypass,true);assert.equal(s.synth.music.current.arpHz,75);}
    else assert.ok(b.messages.some(m=>m.type==='debug'&&m.values.bypass&&m.values.arpHz===75));
    s.setVolume(20);assert.equal(s.master.gain.value,(20/100)**2);assert.equal(s.debug.bypass,true);
    s.setDebug({arpHz:Infinity});assert.equal(s.debug.arpHz,75);
    const [key,saved]=b.writes.at(-1);assert.equal(key,'vibelentely.audio.debug');assert.equal(saved.debug.arpHz,75);
    assert.equal(browser({debug:true,saved:JSON.stringify(saved)}).sound.debug.bypass,true);
  }
  const normal=browser();normal.sound.setDebug({arpSolo:true,arpHz:50,bypass:true});
  assert.equal(normal.sound.debug.arpHz,null);assert.equal(normal.messages.length,0);assert.equal(normal.writes.length,0);
  assert.equal(normal.reads[0],'vibelentely.audio');
});
