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
    for(const bar of tracker.progression){assert.ok(bar.notes);assert.equal(bar.chord.length,4);}
    assert.ok(new Set(tracker.progression.map(b=>b.notes)).size>20);assert.ok(new Set(tracker.progression.map(b=>b.style)).size>=5);
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
    assert.ok(changes.length>=150,'the effect must run at least 150 pitch steps per second');
    assert.equal(changes.length,t.tone.arpHz);
    for(let i=1;i<changes.length;i++){
      const length=changes[i]-changes[i-1];
      assert.ok(length===Math.floor(rate/t.tone.arpHz)||length===Math.ceil(rate/t.tone.arpHz),'accent boundaries must not shorten pitch ticks');
    }
    const frames=t.frames,index=t.arpIndex;t.set(false,.45);samples(t,1024);
    assert.equal(t.frames,frames);assert.equal(t.arpIndex,index,'pausing also freezes the pitch-effect clock');
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
