const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {SONGS,REPEATS,Tracker,Playlist}=require('../dist/music.js');
const {Synth,Cabinet,workletSource}=require('../dist/audio-dsp.js');
function samples(tracker,n){const out=new Float32Array(n);for(let i=0;i<n;i++)out[i]=tracker.sample();return out;}

test('Every score has valid pitched notes, sixteen-row bars, contrasting sections and a playable arrangement',()=>{
  assert.equal(new Set(SONGS.map(song=>song.id)).size,3);
  for(const song of SONGS){
    const tracker=new Tracker(48000,song);assert.equal(song.order.length,64);
    for(const phrase of Object.values(tracker.notes)){
      assert.equal(phrase.length,16);assert.notEqual(phrase[0],'-','holds must have a preceding note in the bar');
      for(const n of phrase)assert.ok(n==='-'||n==='.'||Number.isInteger(n)&&n>=0&&n<128);
    }
    for(const [i,bar] of tracker.progression.entries()){
      assert.ok(bar.notes);assert.equal(bar.chord.length,4);assert.ok(bar.groove);
      if(song.order[i][3])assert.ok(bar.arp,'named arp patterns must exist');
      if(song.order[i][4])assert.ok(bar.reply,'named reply phrases must exist');
    }
    for(const part of Object.values(tracker.arps)){
      assert.equal(part.rows.length,16);assert.notEqual(part.rows[0],'-');
      assert.ok(part.rows.every(row=>row==='x'||row==='-'||row==='.'));
      assert.ok(Number.isFinite(part.gain)&&part.gain>0);
      for(const chord of Object.values(song.chords))for(const note of chord.slice(1))assert.ok(tracker.frequencies[note+(part.octave??0)]);
    }
    for(const groove of Object.values(song.grooves)){
      assert.ok(song.bass[groove.bass]);assert.ok(groove.level>0&&groove.level<=1);
      for(const kind of ['kick','snare','hat'])assert.ok(groove[kind].every(step=>Number.isInteger(step)&&step>=0&&step<16));
    }
    for(const pattern of Object.values(song.bass))assert.equal(pattern.length,16);
  }
  assert.equal(Tracker.note('A4'),69);assert.equal(Tracker.note('D#5'),75);
});

test('The sample clock holds tempo across device rates and wraps into the first bar without an empty row',()=>{
  for(const rate of [44100,48000])for(const song of SONGS){
    const tracker=new Tracker(rate,song);tracker.set(true,.45);
    const length=Math.ceil(tracker.rowLength*16);samples(tracker,length);
    assert.equal(tracker.row,15);tracker.sample();assert.equal(tracker.row,16);
    assert.equal(tracker.frames,length+1);
    tracker.row=song.order.length*16-2;tracker.remaining=0;
    samples(tracker,Math.ceil(tracker.rowLength));assert.equal(tracker.row,1023);
    tracker.sample();assert.equal(tracker.row,0);assert.equal(tracker.loops,1);
    assert.equal(tracker.bar.chord,song.chords[song.order[0][0]]);
  }
});

test('Fast chord cycling keeps even pitch ticks and oscillator phase across rhythmic accents',()=>{
  for(const rate of [44100,48000])for(const song of SONGS){
    const t=new Tracker(rate,song);t.set(true,.45);
    const chord=song.chords[song.order[0][0]].slice(1).map(n=>t.frequencies[n]),changes=[];
    let previousFrequency=0;
    for(let sample=0;sample<rate;sample++){
      const phase=t.arpPhase;t.sample();
      if(t.arpFrequency===previousFrequency)continue;
      assert.equal(t.arpFrequency,chord[changes.length%3],'pitch sequence must not retrigger with the envelope');
      assert.ok(Math.abs(t.arpPhase-(phase+t.arpFrequency/rate)%1)<1e-12,'pitch changes must preserve oscillator phase');
      changes.push(sample);previousFrequency=t.arpFrequency;
    }
    assert.equal(changes.length,50,'normal playback uses the accepted debug speed');
    assert.equal(changes.length,t.tone.arpHz);
    for(let i=1;i<changes.length;i++){
      const length=changes[i]-changes[i-1];
      assert.ok(length===Math.floor(rate/t.tone.arpHz)||length===Math.ceil(rate/t.tone.arpHz),'accent boundaries must not shorten pitch ticks');
    }
    const frames=t.frames,index=t.arpIndex;t.set(false,.45);samples(t,1024);
    assert.equal(t.frames,frames);assert.equal(t.arpIndex,index,'pausing also freezes the pitch-effect clock');
  }
});

test('Arp rests fade fully and returning accents keep the pitch clock running',()=>{
  const rate=48000;
  for(const song of SONGS){
    const fixture={...song,arps:{test:{pattern:'x - - - . . . . x - - - . . . .',gain:.8}},
      order:[[song.order[0][0],'rest','walk','test'],[song.order[1][0],'rest','walk']]};
    const t=new Tracker(rate,fixture);t.debug({arpSolo:true,arpHz:null});t.set(true,.45);
    function bar(index){t.row=index*16-1;t.remaining=0;t.frames=Math.ceil(index*16*t.rowLength);}
    bar(0);const active=samples(t,4800);assert.ok(active.some(x=>Math.abs(x)>.005));
    bar(1);const release=samples(t,18000);
    assert.ok(release.subarray(0,128).some(x=>Math.abs(x)>.001),'release must fade instead of cutting the oscillator');
    assert.equal(t.arpLevel,0);assert.ok(release.subarray(-128).every(x=>x===0),'omitted patterns must be genuinely silent even in solo');
    const phase=t.arpPhase;bar(0);const frame=t.frames;t.sample();
    assert.equal(t.arpIndex,Math.floor(frame*50/rate+1e-10)%3,'re-entry uses the running pitch clock');
    assert.ok(Math.abs(t.arpPhase-(phase+t.arpFrequency/rate)%1)<1e-12,'re-entry must preserve oscillator phase');
    assert.ok(t.arpLevel>0&&t.arpLevel<.01,'new accents fade in');
    samples(t,2048);const level=t.arpLevel;
    t.set(false,.45);samples(t,2048);assert.equal(t.arpLevel,level,'pause must freeze the arrangement envelope');
    t.reset();assert.equal(t.arpLevel,0);assert.equal(t.arpTarget,0);
  }
});

test('Pausing fades to silence while preserving notes, echo position and transport; resuming continues there',()=>{
  const t=new Tracker(48000);t.set(true,.45);samples(t,4800);
  const before={frames:t.frames,row:t.row,remaining:t.remaining,echo:t.echoIndex,age:t.lead?.age};
  t.set(false,.45);const fade=samples(t,20000);
  assert.deepEqual({frames:t.frames,row:t.row,remaining:t.remaining,echo:t.echoIndex,age:t.lead?.age},before);
  assert.ok(fade.subarray(-256).every(v=>Math.abs(v)<1e-7));
  t.set(true,.45);const resumed=samples(t,2048);assert.equal(t.frames,before.frames+2048);assert.ok(resumed.some(v=>Math.abs(v)>.001));
});

test('The FM-kantele has its own decaying timbre, plays alongside the pulse and preserves its note while paused',()=>{
  const rate=48000,t=new Tracker(rate);t.set(true,.45);
  const pluck=t.voice(69,8,'reply'),pulse=t.voice(69,8,'lead'),a=[],b=[];
  for(let i=0;i<rate/2;i++){a.push(t.pitched(pluck,1/rate));b.push(t.pitched(pulse,1/rate));}
  const rms=values=>Math.sqrt(values.reduce((sum,x)=>sum+x*x,0)/values.length);
  assert.ok(a.every(Number.isFinite));assert.ok(rms(a.slice(480,5280))>.02);
  assert.ok(rms(a.slice(-4800))<rms(a.slice(480,5280))*.6,'the answering voice must have a plucked decay');
  const energy=a.reduce((sum,x,i)=>sum+(x-b[i])**2,0);
  assert.ok(energy>1,'the new voice must be a distinct timbre');
  const duet=t.progression.findIndex(bar=>bar.reply&&bar.notes.some(Number.isInteger)&&bar.reply.some(Number.isInteger));
  t.row=duet*16-1;t.frames=Math.ceil(duet*16*t.rowLength);t.remaining=0;
  const entry=t.progression[duet].reply.findIndex(Number.isInteger);
  samples(t,Math.ceil(t.rowLength*entry)+128);assert.ok(t.lead&&t.reply);assert.notEqual(t.lead,t.reply);
  const age=t.reply.age,frames=t.frames;t.set(false,.45);samples(t,2048);
  assert.equal(t.reply.age,age);assert.equal(t.frames,frames);
  t.set(true,.45);samples(t,128);assert.ok(t.reply.age>age);
  t.reset();assert.equal(t.reply,null);
});

test('An isolated FM-kantele and its echo pass through the same master DAC and cabinet',()=>{
  const rate=48000,song={...SONGS[0],phrases:{rest:'. . . . . . . . . . . . . . . .',held:'A4 - - - - - - - - - - - - - - .'},
    bass:{silence:Array(16).fill('.')},grooves:{quiet:{bass:'silence',kick:[],snare:[],hat:[],level:1}},
    order:[['Em','rest','quiet',null,'held']]};
  const synth=new Synth(rate),reference=new Tracker(rate,song),cabinet=new Cabinet(rate);
  synth.music.current=new Tracker(rate,song);synth.music.set(true,.45);reference.set(true,.45);
  const out=new Float32Array(24000),raw=new Float32Array(out.length),expected=new Float32Array(out.length);
  for(let i=0;i<out.length;i++){const input=reference.sample()*1.8;raw[i]=input;expected[i]=cabinet.process(input);}
  synth.render(out);assert.ok(synth.music.current.reply);assert.ok(raw.some(x=>Math.abs(x)>.02));
  assert.deepEqual(out,expected,'the answering instrument must receive the full shared DAC/filter chain');
  assert.ok(out.some((x,i)=>Math.abs(x-raw[i])>.01),'the cabinet must materially alter the FM voice');
});

test('Music and effects share one nonlinear cabinet and render identically across block boundaries',()=>{
  const whole=new Synth(48000),blocks=new Synth(48000),raw=new Synth(48000),cabinet=new Cabinet(48000);
  const expected=[];raw.cabinet.process=x=>{expected.push(cabinet.process(x));return x;};
  for(const s of [whole,blocks,raw]){s.music.set(true,.45);s.event('pulse');}
  const a=new Float32Array(8192),b=new Float32Array(8192),dry=new Float32Array(8192);whole.render(a);raw.render(dry);
  for(let i=0;i<b.length;i+=128)blocks.render(b.subarray(i,i+128));
  assert.deepEqual(a,b);assert.deepEqual(a,Float32Array.from(expected));assert.ok(a.some((v,i)=>Math.abs(v-dry[i])>.01));
  const position=whole.music.current.frames;whole.clear();whole.render(new Float32Array(128));
  assert.equal(whole.music.current.frames,position+128,'clearing transient effects must not restart or stop music');
});

test('The standalone worklet carries the score, music transport and the same filtered mix',()=>{
  let Processor;const states=[],scope={sampleRate:48000,AudioWorkletProcessor:class{constructor(){this.port={postMessage:s=>states.push(s)};}},registerProcessor:(_,ctor)=>Processor=ctor};
  vm.createContext(scope);vm.runInContext(workletSource(),scope);
  const p=new Processor(),reference=new Synth();p.port.onmessage({data:{type:'music',playing:true,level:.45}});reference.music.set(true,.45);
  const out=new Float32Array(1024),expected=new Float32Array(1024);p.process([],[[out]]);reference.render(expected);assert.deepEqual(out,expected);
  const choice={type:'playlist',track:SONGS[2].id,autoAdvance:false,request:7};
  p.port.onmessage({data:choice});reference.music.configure(choice);p.process([],[[out]]);reference.render(expected);assert.deepEqual(out,expected);
  assert.equal(states.at(-1).track,SONGS[2].id);assert.equal(states.at(-1).request,7);
  assert.equal(p.synth.music.autoAdvance,false);
  const replyBar=reference.music.current.progression.findIndex(bar=>bar.reply);
  const replyStep=reference.music.current.progression[replyBar].reply.findIndex(Number.isInteger);
  for(const t of [p.synth.music.current,reference.music.current]){
    t.row=replyBar*16+replyStep-1;t.frames=Math.ceil((t.row+1)*t.rowLength);t.remaining=0;
  }
  for(let i=0;i<8;i++){p.process([],[[out]]);reference.render(expected);assert.deepEqual(out,expected);}
  assert.ok(p.synth.music.current.reply,'the serialized score and worklet must actually play the answering instrument');
  p.port.onmessage({data:{type:'music',playing:false,level:.45}});p.process([],[[new Float32Array(24000)]]);
  p.process([],[[out]]);assert.ok(out.every(v=>Math.abs(v)<1e-7));
});

function lastRow(playlist,loops){
  const t=playlist.current;t.loops=loops;t.row=t.progression.length*16-2;t.remaining=0;
  t.sample();assert.equal(t.row,t.progression.length*16-1);return t;
}

test('The playlist completes three full loops per track, follows each new tempo and wraps to the first song',()=>{
  for(const rate of [44100,48000]){
    const p=new Playlist(rate);p.set(true,.45);
    for(let index=0;index<SONGS.length;index++){
      assert.equal(p.current.song,SONGS[index]);assert.equal(p.current.frames, index?1:0);
      for(let loop=0;loop<REPEATS;loop++){
        const t=lastRow(p,loop);samples(p,Math.ceil(t.remaining));
        assert.equal(p.current,t,'the last row must finish before switching');
        p.sample();
        if(loop<REPEATS-1){assert.equal(p.current,t);assert.equal(t.row,0);assert.equal(t.loops,loop+1);}
      }
      assert.equal(p.current.song,SONGS[(index+1)%SONGS.length]);assert.equal(p.current.row,0);
      assert.equal(p.current.loops,0);assert.equal(p.current.rowLength,rate*60/(p.current.song.bpm*4));
    }
    assert.equal(p.takeState().track,SONGS[0].id);assert.equal(p.takeState(),null,'no per-block UI traffic');
  }
});

test('Holding a song survives loop boundaries, silence and pauses; manual selection starts a fresh three-loop run',()=>{
  const p=new Playlist(48000);p.set(true,.45);p.configure({autoAdvance:false});
  let t=lastRow(p,8);t.remaining=0;p.sample();assert.equal(p.current,t);assert.equal(t.loops,9);
  p.configure({autoAdvance:true});lastRow(p,9).remaining=0;
  p.set(false,.45);samples(p,24000);assert.equal(p.current,t,'pause must not rotate at a pending boundary');
  p.set(true,0);samples(p,1024);assert.equal(p.current,t,'zero music level must not rotate');
  p.set(true,.45);p.sample();assert.equal(p.current.song,SONGS[1]);
  p.configure({track:SONGS[2].id,request:4});assert.equal(p.current.row,-1);assert.equal(p.current.loops,0);
  samples(p,128);t=p.current;const frames=t.frames;
  p.configure({autoAdvance:false});assert.equal(t.frames,frames,'changing repeat mode must not restart the song');
  p.configure({track:'missing',request:5});assert.equal(p.current,t);assert.equal(p.request,4);
  p.configure({track:SONGS[2].id,request:6});assert.equal(t.frames,frames,'reselecting the same song must not restart it');
});

test('Track changes fade the outgoing sound, clear old notes and echo, and keep render-block-independent output',()=>{
  const a=new Synth(),b=new Synth();
  for(const s of [a,b]){s.music.set(true,.45);s.render(new Float32Array(12000));}
  const outgoing=a.music.current,oldGain=outgoing.gain;
  for(const s of [a,b])s.music.configure({track:SONGS[1].id});
  assert.equal(a.music.current.gain,0);assert.ok(a.music.current.echo.every(x=>x===0));
  const whole=new Float32Array(24000),blocks=new Float32Array(24000);a.render(whole);
  for(let i=0;i<blocks.length;i+=128)b.render(blocks.subarray(i,i+128));assert.deepEqual(whole,blocks);
  assert.ok(oldGain>.4);assert.equal(outgoing.gain,0);assert.equal(a.music.previous,null);
  assert.ok(whole.every(x=>Number.isFinite(x)&&Math.abs(x)<1));
  a.music.configure({track:SONGS[0].id});assert.equal(a.music.current.frames,0);assert.equal(a.music.current.loops,0);
  assert.ok(a.music.current.echo.every(x=>x===0),'returning to a previously played song starts cleanly');
});

test('Live debug rate changes preserve playback and oscillator position; overrides survive song changes',()=>{
  for(const rate of [44100,48000]){
    const s=new Synth(rate);s.debug({arpHz:75});s.music.set(true,.45);s.render(new Float32Array(1024));const t=s.music.current;
    const before={frames:t.frames,row:t.row,phase:t.arpPhase,index:t.arpIndex,echo:t.echoIndex};
    s.debug({arpHz:50});assert.deepEqual({frames:t.frames,row:t.row,phase:t.arpPhase,index:t.arpIndex,echo:t.echoIndex},before);
    const changes=[];let last=t.arpIndex;
    for(let i=0;i<rate;i++){t.sample();if(t.arpIndex!==last){changes.push(i);last=t.arpIndex;}}
    assert.equal(changes.length,50);
    for(let i=1;i<changes.length;i++)assert.equal(changes[i]-changes[i-1],rate/50);
    t.set(false,.45);s.debug({arpHz:1});const frame=t.frames,index=t.arpIndex;samples(t,2048);
    assert.equal(t.frames,frame);assert.equal(t.arpIndex,index);
    s.music.configure({track:SONGS[1].id});assert.equal(s.music.current.arpHz,1);
    s.debug({arpHz:999});assert.equal(s.music.current.arpHz,300);
    s.debug({arpHz:NaN});assert.equal(s.music.current.arpHz,300);
    s.debug({arpHz:null});assert.equal(s.music.current.arpHz,null);assert.equal(s.music.current.tone.arpHz,50);
  }
});

test('Arp solo removes every other instrument and game effect, through either the cabinet or its debug bypass',()=>{
  for(const bypass of [false,true]){
    const s=new Synth(),cabinet=new Cabinet(48000),raw=[];s.debug({arpSolo:true,arpHz:50,bypass});s.music.set(true,.45);
    const t=s.music.current,arp=t.arpeggio.bind(t);
    t.arpeggio=dt=>{const value=arp(dt);raw.push(value*t.gain*1.8);return value;};
    t.kickAge=t.snareAge=t.hatAge=0;t.echo.fill(.2);t.reply=t.voice(69,8,'reply');
    s.controls({engine:1,vacuum:1,charge:1,shield:1,wet:1,lava:1});s.event('explosion');s.event('pulse');
    const out=new Float32Array(24000);s.render(out);
    const expected=Float32Array.from(raw,x=>bypass?Math.max(-1,Math.min(127/128,x)):cabinet.process(x));
    assert.deepEqual(out,expected,'solo must contain only the single arpeggio channel');
    const position=t.frames;s.debug({arpSolo:false,bypass:!bypass});s.render(new Float32Array(24000));
    assert.equal(t.frames,position+24000);assert.equal(s.effectsMix,1);assert.equal(s.bypassMix,Number(!bypass));
    assert.equal(t.soloMix,0,'the full arrangement returns without restarting transport');
  }
});

test('AudioWorklet debug messages control rate, solo and cabinet bypass with identical sample output',()=>{
  let Processor;const scope={sampleRate:48000,AudioWorkletProcessor:class{constructor(){this.port={postMessage(){}};}},registerProcessor:(_,ctor)=>Processor=ctor};
  vm.createContext(scope);vm.runInContext(workletSource(),scope);
  const p=new Processor(),reference=new Synth(),actual=new Float32Array(1024),expected=new Float32Array(1024);
  p.port.onmessage({data:{type:'music',playing:true,level:.45}});reference.music.set(true,.45);
  for(const values of [{arpSolo:true,arpHz:25},{bypass:true,arpHz:75},{arpSolo:false,arpHz:300},{bypass:false,arpHz:null}]){
    p.port.onmessage({data:{type:'debug',values}});reference.debug(values);
    for(let i=0;i<4;i++){p.process([],[[actual]]);reference.render(expected);assert.deepEqual(actual,expected);}
  }
});
