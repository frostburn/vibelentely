(function(root){
  'use strict';
  const DSP=root.CaveAudioDSP,{SONGS}=root.CaveMusic,storageKey='vibelentely.audio';
  class Sound {
    constructor(){
      this.volume=60;this.muted=false;this.active=false;this.context=null;this.node=null;this.master=null;this.starting=null;
      this.status='idle';this.onchange=()=>{};this.combat=null;this.listener=null;
      this.musicEnabled=true;this.musicVolume=45;this.musicActive=false;
      this.musicTrack=SONGS[0].id;this.musicRotation=true;this.musicRequest=0;
      try{
        const saved=JSON.parse(root.localStorage?.getItem(storageKey)||'null');
        if(Number.isFinite(saved?.volume))this.volume=Math.max(0,Math.min(100,saved.volume));
        this.muted=saved?.muted===true;
        if(Number.isFinite(saved?.musicVolume))this.musicVolume=Math.max(0,Math.min(100,saved.musicVolume));
        this.musicEnabled=saved?.musicEnabled!==false;
        if(SONGS.some(song=>song.id===saved?.musicTrack))this.musicTrack=saved.musicTrack;
        this.musicRotation=saved?.musicRotation!==false;
      }catch{}
    }
    save(){try{root.localStorage?.setItem(storageKey,JSON.stringify({volume:this.volume,muted:this.muted,musicVolume:this.musicVolume,musicEnabled:this.musicEnabled,musicTrack:this.musicTrack,musicRotation:this.musicRotation}));}catch{}}
    setVolume(value){if(!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(100,value));this.save();this.gain();this.updateMusic();this.onchange();}
    toggleMute(){this.muted=!this.muted;this.save();this.clear();this.gain();this.updateMusic();this.onchange();}
    setMusicVolume(value){if(!Number.isFinite(value))return;this.musicVolume=Math.max(0,Math.min(100,value));this.save();this.updateMusic();this.onchange();}
    toggleMusic(){this.musicEnabled=!this.musicEnabled;this.save();this.updateMusic();this.gain();this.onchange();}
    setMusicActive(value){value=!!value;if(value===this.musicActive)return;this.musicActive=value;this.updateMusic();this.gain();}
    updateMusic(){this.send({type:'music',playing:this.musicActive&&this.musicEnabled&&!this.muted&&this.volume>0&&this.musicVolume>0,level:this.musicVolume/100});}
    setMusicTrack(track){
      if(track===this.musicTrack||!SONGS.some(song=>song.id===track))return;
      this.musicTrack=track;this.musicRequest++;this.send({type:'playlist',track,request:this.musicRequest});this.save();this.onchange();
    }
    setMusicRotation(value){this.musicRotation=!!value;this.send({type:'playlist',autoAdvance:this.musicRotation});this.save();this.onchange();}
    musicState(state){
      // An automatic advance already in flight must not undo a newer manual choice.
      if(state?.type!=='music-state'||state.request!==this.musicRequest||state.track===this.musicTrack||!SONGS.some(song=>song.id===state.track))return;
      this.musicTrack=state.track;this.save();this.onchange();
    }
    gain(){
      if(!this.master)return;
      const now=this.context.currentTime,param=this.master.gain;
      // Squared slider taper, after quantisation AND filtering. No upstream volume changes.
      param.cancelScheduledValues(now);param.setTargetAtTime((this.active||this.musicActive&&this.musicEnabled)&&!this.muted?(this.volume/100)**2:0,now,.012);
    }
    send(message){if(this.node?.port)this.node.port.postMessage(message);else if(this.synth){
      if(message.type==='event')this.synth.event(message.kind,message.gain,message.power);
      else if(message.type==='controls')this.synth.controls(message.values);
      else if(message.type==='music')this.synth.music.set(message.playing,message.level);
      else if(message.type==='playlist')this.synth.music.configure(message);
      else this.synth.clear();
    }}
    clear(){this.send({type:'clear'});}
    setActive(value){value=!!value;if(value===this.active)return;this.active=value;this.clear();this.gain();}
    async build(){
      const ctx=this.context;let url;
      try{
        if(!ctx.audioWorklet||!root.AudioWorkletNode)throw new Error('No AudioWorklet');
        url=URL.createObjectURL(new Blob([DSP.workletSource()],{type:'text/javascript'}));
        await ctx.audioWorklet.addModule(url);
        this.node=new root.AudioWorkletNode(ctx,'cave-speaker',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]});
        this.node.port.onmessage=({data})=>this.musicState(data);
      }catch{
        // Local-file/older-browser fallback uses the very same DSP, not a clean bypass.
        if(!ctx.createScriptProcessor){this.status='unsupported';throw new Error('No audio processor');}
        this.synth=new DSP.Synth(ctx.sampleRate);this.node=ctx.createScriptProcessor(1024,0,1);
        this.node.onaudioprocess=e=>{this.synth.render(e.outputBuffer.getChannelData(0));this.musicState(this.synth.music.takeState());};
      }finally{if(url)URL.revokeObjectURL(url);}
      this.master=ctx.createGain();this.master.gain.value=0;
      this.node.connect(this.master);this.master.connect(ctx.destination);
      this.send({type:'playlist',track:this.musicTrack,autoAdvance:this.musicRotation,request:this.musicRequest});this.gain();this.updateMusic();
    }
    async unlock(){
      if(this.status==='unsupported')return false;
      try{
        if(!this.context){
          const Context=root.AudioContext||root.webkitAudioContext;
          if(!Context){this.status='unsupported';this.onchange();return false;}
          this.context=new Context({latencyHint:'interactive'});
          this.context.onstatechange=()=>{this.status=this.context.state==='running'&&this.node?'ready':'idle';this.onchange();};
        }
        // Call resume inside the gesture, before waiting for the worklet module.
        const resumed=this.context.state==='running'?Promise.resolve():this.context.resume();
        this.starting??=this.build().catch(error=>{this.starting=null;throw error;});
        await Promise.all([resumed,this.starting]);
        this.status=this.context.state==='running'?'ready':'idle';this.onchange();return this.status==='ready';
      }catch{
        if(this.status!=='unsupported')this.status='idle';this.onchange();return false;
      }
    }
    cue(kind,power=1,gain=1){
      if(this.active&&!this.muted&&this.volume>0&&this.context?.state==='running')this.send({type:'event',kind,power,gain});
    }
    at(kind,x,y,power=1){
      const a=this.listener;if(!a)return;const d=Math.hypot(x-a.x,y-a.y);
      if(d<540)this.cue(kind,power,1/(1+(d/140)**2));
    }
    watch(combat,solo=null){
      if(this.combat)this.combat.onSound=null;
      this.clear();this.combat=combat;this.listener=combat.player;
      this.seen=new WeakSet([...combat.world.effects,...combat.effects]);this.actors=new WeakMap();this.result=combat.result;
      this.cargo=solo?.cargo||0;this.delivered=solo?.rescued||0;this.objective=!!solo?.readyToReturn;
      for(const actor of combat.actors)this.actors.set(actor,this.state(actor));
      combat.onSound=e=>this.at(e.kind,e.x,e.y,e.power);
    }
    state(a){return {health:a.health,hot:a.gear.blasterHot||a.gear.vacuumHot||a.gear.overheated,full:a.gear.charge===1,hurtAt:-Infinity};}
    update(listener,solo=null,flying=true){
      const c=this.combat;if(!c)return;this.listener=listener;
      for(const e of c.world.effects)if(!this.seen.has(e)){
        this.seen.add(e);this.at('explosion',e.x,e.y,Math.min(1,e.radius/30));
      }
      for(const e of c.effects)if(!this.seen.has(e)){
        this.seen.add(e);if(e.kind==='mud')this.at('splat',e.x,e.y);
      }
      for(const a of c.actors){
        const before=this.actors.get(a)||this.state(a),now=this.state(a);now.hurtAt=before.hurtAt;
        if(now.health<before.health&&c.time-before.hurtAt>.25){this.at('hurt',a.x,a.y);now.hurtAt=c.time;}
        if(now.hot&&!before.hot)this.at('hot',a.x,a.y);
        if(now.full&&!before.full)this.at('ready',a.x,a.y);
        this.actors.set(a,now);
      }
      if(c.result&&c.result!==this.result)this.cue(c.result);this.result=c.result;
      if(solo){
        if(solo.cargo>this.cargo)this.cue('pickup');
        if(solo.rescued>this.delivered&&!c.result)this.cue('delivered');
        if(solo.readyToReturn&&!this.objective&&!solo.delivery)this.cue('objective');
        this.cargo=solo.cargo;this.delivered=solo.rescued;this.objective=solo.readyToReturn;
      }
      const a=listener,g=a.gear,live=this.active&&flying&&!a.dead&&!c.result;
      const medium=live?a.medium():{};
      this.send({type:'controls',values:live?{engine:a.throttle,wet:medium.wet,lava:medium.hot,
        vacuum:g.vacuumRays.length?1:0,charge:g.charge,shield:g.shield?1:0}:{}});
    }
  }
  root.CaveAudio={Sound};
  if(typeof module!=='undefined')module.exports=root.CaveAudio;
})(globalThis);
