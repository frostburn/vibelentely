const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {SONG,Tracker}=require('../dist/music.js');
const {Synth,Cabinet,workletSource}=require('../dist/audio-dsp.js');
function samples(tracker,n){const out=new Float32Array(n);for(let i=0;i<n;i++)out[i]=tracker.sample();return out;}

test('The complete score has valid pitched notes, sixteen-row bars, contrasting sections and a playable arrangement',()=>{
  const tracker=new Tracker(48000);assert.equal(SONG.order.length,64);
  for(const phrase of Object.values(tracker.notes)){
    assert.equal(phrase.length,16);assert.notEqual(phrase[0],'-','holds must have a preceding note in the bar');
    for(const n of phrase)assert.ok(n==='-'||n==='.'||Number.isInteger(n)&&n>=0&&n<128);
  }
  for(const bar of tracker.progression){assert.ok(bar.notes);assert.equal(bar.chord.length,4);}
  assert.ok(new Set(tracker.progression.map(b=>b.notes)).size>20);assert.ok(new Set(tracker.progression.map(b=>b.style)).size>=5);
  assert.equal(Tracker.note('A4'),69);assert.equal(Tracker.note('D#5'),75);
});

test('The sample clock holds tempo across device rates and wraps into the first bar without an empty row',()=>{
  for(const rate of [44100,48000]){
    const tracker=new Tracker(rate);tracker.set(true,.45);
    const length=Math.ceil(tracker.rowLength*16);samples(tracker,length);
    assert.equal(tracker.row,15);tracker.sample();assert.equal(tracker.row,16);
    assert.equal(tracker.frames,length+1);
    tracker.row=SONG.order.length*16-2;tracker.remaining=0;
    samples(tracker,Math.ceil(tracker.rowLength));assert.equal(tracker.row,1023);
    tracker.sample();assert.equal(tracker.row,0);assert.equal(tracker.loops,1);
    assert.equal(tracker.bar.chord,SONG.chords.Em);
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
  const position=whole.music.frames;whole.clear();whole.render(new Float32Array(128));
  assert.equal(whole.music.frames,position+128,'clearing transient effects must not restart or stop music');
});

test('The standalone worklet carries the score, music transport and the same filtered mix',()=>{
  let Processor;const scope={sampleRate:48000,AudioWorkletProcessor:class{constructor(){this.port={};}},registerProcessor:(_,ctor)=>Processor=ctor};
  vm.createContext(scope);vm.runInContext(workletSource(),scope);
  const p=new Processor(),reference=new Synth();p.port.onmessage({data:{type:'music',playing:true,level:.45}});reference.music.set(true,.45);
  const out=new Float32Array(1024),expected=new Float32Array(1024);p.process([],[[out]]);reference.render(expected);assert.deepEqual(out,expected);
  p.port.onmessage({data:{type:'music',playing:false,level:.45}});p.process([],[[new Float32Array(24000)]]);
  p.process([],[[out]]);assert.ok(out.every(v=>Math.abs(v)<1e-7));
});
