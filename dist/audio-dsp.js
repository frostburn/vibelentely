(function(root){
  'use strict';
  // A mono 8-bit DAC at 11025 Hz, followed by the narrow speaker cabinet.
  // User volume is deliberately outside this processor, after the filters.
  class Cabinet {
    constructor(rate){
      this.step=Math.min(1,11025/rate);this.clock=1;this.held=0;
      this.hp=Math.exp(-2*Math.PI*180/rate);this.lp=1-Math.exp(-2*Math.PI*2300/rate);
      this.previous=0;this.high=0;this.low=0;this.low2=0;
    }
    process(input){
      this.clock+=this.step;
      if(this.clock>=1){this.clock%=1;this.held=Math.round(Math.max(-1,Math.min(127/128,input))*128)/128;}
      this.high=this.hp*(this.high+this.held-this.previous);this.previous=this.held;
      this.low+=this.lp*(this.high-this.low);this.low2+=this.lp*(this.low-this.low2);
      return this.low2;
    }
  }
  class Synth {
    constructor(rate=48000){
      this.rate=rate;this.cabinet=new Cabinet(rate);this.voices=[];this.seed=19790517;
      this.target={engine:0,wet:0,lava:0,vacuum:0,charge:0,shield:0};this.level={...this.target};
      this.phases=new Float64Array(5);this.time=0;this.smooth=1-Math.exp(-1/(rate*.025));
    }
    controls(values){for(const key of Object.keys(this.target))this.target[key]=Math.max(0,Math.min(1,values[key]||0));}
    clear(){this.voices.length=0;this.controls({});}
    noise(){let n=this.seed;n^=n<<13;n^=n>>>17;n^=n<<5;this.seed=n;return (n>>>0)/2147483648-1;}
    event(kind,gain=1,power=1){
      // Frequency sweeps, waveform, noise share, duration and level. No samples.
      const sounds={
        pulse:[1100,170,1,.12,.105,.22],grenade:[170,62,2,.35,.15,.28],water:[420,160,2,.92,.08,.095],
        mud:[115,42,0,.7,.21,.3],splat:[230,38,0,.8,.28,.32],
        blaster:power>=1?[1350,65,1,.35,.3,.52]:[750,160,1,.22,.13,.17+.1*power],
        explosion:[95,28,2,.86,.3+.24*power,.25+.25*power],
        shield:[1700,850,1,.16,.12,.24],blink:[180,1600,2,.2,.24,.28],
        hurt:[110,40,1,.5,.14,.2],hot:[700,65,1,.72,.42,.24],ready:[1450,960,2,.04,.13,.2],
        pickup:[520,1040,2,0,.18,.22],delivered:[660,1320,2,0,.22,.25],objective:[550,1100,2,0,.3,.24],
        won:[523,1046,2,0,.62,.25],lost:[330,82,2,.18,.65,.23],draw:[392,392,2,0,.3,.2],
      };
      const s=sounds[kind];if(!s||!Number.isFinite(gain)||gain<=0)return;
      if(this.voices.length>=24)this.voices.shift();
      this.voices.push({kind,from:s[0],to:s[1],shape:s[2],noise:s[3],length:s[4],gain:s[5]*Math.min(1,gain),age:0,phase:0});
    }
    wave(phase,shape){return shape===1?(phase<.35?1:-.54):shape===2?1-4*Math.abs(phase-.5):Math.sin(phase*Math.PI*2);}
    render(output){
      if(!this.voices.length&&Object.keys(this.level).every(k=>this.target[k]===0&&this.level[k]<1e-7)&&Math.abs(this.cabinet.low2)<1e-8){output.fill(0);return;}
      const dt=1/this.rate,p=this.phases;
      for(let i=0;i<output.length;i++){
        this.time+=dt;
        for(const key in this.level)this.level[key]+=(this.target[key]-this.level[key])*this.smooth;
        const l=this.level,n=this.noise(),flutter=Math.sin(this.time*2*Math.PI*23);
        p[0]=(p[0]+(58+34*l.engine-18*l.wet)*dt)%1;
        p[1]=(p[1]+(155+65*l.vacuum)*dt)%1;
        p[2]=(p[2]+(120+850*l.charge*l.charge+12*flutter)*dt)%1;
        p[3]=(p[3]+210*dt)%1;p[4]=(p[4]+37*dt)%1;
        let mix=l.engine*(this.wave(p[0],2)*.18+n*(.055+.025*flutter));
        mix+=l.vacuum*(this.wave(p[1],1)*.035+n*.09);
        mix+=l.charge*this.wave(p[2],1)*(.065+(this.target.charge===1?.025*flutter:0));
        mix+=l.shield*this.wave(p[3],2)*.035;
        mix+=l.wet*n*.025*(1+Math.sin(this.time*47));
        mix+=l.lava*(n*.055+this.wave(p[4],2)*.04);
        for(let j=this.voices.length-1;j>=0;j--){
          const v=this.voices[j],t=v.age/v.length;
          if(t>=1){this.voices.splice(j,1);continue;}
          let frequency=v.from*Math.pow(v.to/v.from,t);
          if(v.kind==='won')frequency=[523.25,659.25,783.99,1046.5][Math.min(3,Math.floor(t*4))];
          if(v.kind==='lost')frequency=[330,247,165][Math.min(2,Math.floor(t*3))];
          v.phase=(v.phase+frequency*dt)%1;
          const env=Math.min(1,v.age/.004)*(1-t)*(1-t);
          mix+=(this.wave(v.phase,v.shape)*(1-v.noise)+n*v.noise)*env*v.gain;v.age+=dt;
        }
        output[i]=this.cabinet.process(mix*1.8);
      }
    }
  }
  function workletSource(){return `${Cabinet.toString()}\n${Synth.toString()}\n
    class CaveProcessor extends AudioWorkletProcessor {
      constructor(){super();this.synth=new Synth(sampleRate);this.port.onmessage=({data})=>{
        if(data.type==='event')this.synth.event(data.kind,data.gain,data.power);
        else if(data.type==='controls')this.synth.controls(data.values);
        else if(data.type==='clear')this.synth.clear();
      };}
      process(inputs,outputs){this.synth.render(outputs[0][0]);return true;}
    }
    registerProcessor('cave-speaker',CaveProcessor);`;}
  root.CaveAudioDSP={Cabinet,Synth,workletSource};
  if(typeof module!=='undefined')module.exports=root.CaveAudioDSP;
})(globalThis);
