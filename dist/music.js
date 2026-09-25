(function(root){
  'use strict';
  // Basalttiyö — an original 64-bar tracker piece, E minor, 132 BPM, 4/4.
  // One token per sixteenth: a note retriggers, '-' sustains, '.' rests.
  const SONG={
    title:'Basalttiyö',bpm:132,
    chords:{Em:[40,52,55,59],C:[36,52,55,60],Am:[45,52,57,60],B7:[35,51,54,57],
      D:[38,50,54,57],G:[43,50,55,59],F:[41,53,57,60],Fs:[42,54,57,60]},
    phrases:{
      rest:'. . . . . . . . . . . . . . . .',
      i0:'. . . . E4 - - - . . B4 - G4 - E4 .',
      i1:'. . . . G4 - E4 - . . C5 - B4 - G4 .',
      i2:'A4 - - - . . E4 - C5 - B4 A4 . . E4 .',
      i3:'. . B4 - D#5 - F#5 - A5 G5 F#5 E5 D#5 C5 B4 .',
      a0:'E5 - B4 . G4 B4 E5 - F#5 E5 D5 B4 G4 - B4 .',
      a1:'E5 - G5 E5 D5 - C5 . B4 C5 E5 - G4 - C5 .',
      a2:'A4 - C5 E5 A5 - G5 E5 D5 C5 B4 A4 C5 - E5 .',
      a3:'F#5 - D#5 B4 A4 - F#4 . B4 D#5 F#5 - E5 D#5 B4 .',
      a4:'G5 - F#5 E5 B4 - E5 . D5 B4 G4 - A4 B4 D5 .',
      a5:'F#5 - E5 D5 A4 - D5 . C5 A4 F#4 A4 D5 - E5 .',
      a6:'E5 - C5 A4 B4 C5 E5 - G5 F#5 E5 C5 B4 A4 G4 .',
      a7:'F#4 B4 D#5 F#5 A5 - F#5 . E5 D#5 C5 A4 F#4 - B4 .',
      v0:'E5 - B4 E5 G5 - F#5 E5 D5 B4 G4 B4 E5 - - .',
      v1:'G5 - E5 G5 A5 G5 E5 D5 C5 - B4 C5 E5 - G5 .',
      v2:'A5 - G5 E5 C5 - E5 . D5 C5 B4 A4 G4 A4 C5 .',
      v3:'F#5 - D#5 B4 A4 F#4 B4 D#5 F#5 A5 G5 F#5 E5 D#5 B4 .',
      b0:'B4 - - D5 G5 - F#5 E5 D5 - B4 - A4 B4 D5 .',
      b1:'A4 - - D5 F#5 - E5 D5 C5 - A4 - F#4 A4 C5 .',
      b2:'G4 - C5 - E5 - G5 - A5 G5 E5 - D5 C5 B4 .',
      b3:'E5 - B4 - G4 - - . F#4 G4 B4 D5 E5 - - .',
      b4:'C5 - E5 - A5 - G5 E5 D5 C5 B4 A4 G4 - A4 .',
      b5:'A4 - C5 - F5 - E5 C5 A4 - G4 A4 C5 - F5 .',
      b6:'F#5 - E5 C5 A4 - F#4 . A4 C5 E5 F#5 A5 - G5 .',
      b7:'F#5 E5 D#5 B4 A4 - F#4 . D#5 - F#5 - B4 - - .',
      c0:'E4 - - - G4 - B4 - E5 - - - D5 - B4 .',
      c1:'G4 - - - E4 - G4 - C5 - - - B4 - G4 .',
      c2:'A4 - - - C5 - E5 - C5 - - - B4 - A4 .',
      c3:'F#4 - - - B4 - D#5 - F#5 - E5 - D#5 - B4 .',
      end:'E5 - - - B4 - G4 - E4 - - - . . . .',
    },
    // Arrangement: 4-bar pickup, two A phrases, B, a sparse middle, A reprise,
    // B reprise, and a four-bar turnaround. The loop resolves back to E minor.
    order:[
      ['Em','i0','intro'],['C','i1','intro'],['Am','i2','build'],['B7','i3','build'],
      ['Em','a0','main'],['C','a1','main'],['Am','a2','main'],['B7','a3','main'],
      ['Em','a4','main'],['D','a5','main'],['Am','a6','main'],['B7','a7','fill'],
      ['Em','v0','main'],['C','v1','main'],['Am','v2','main'],['B7','v3','main'],
      ['Em','a4','main'],['D','a5','main'],['Am','a6','main'],['B7','a7','fill'],
      ['G','b0','chorus'],['D','b1','chorus'],['C','b2','chorus'],['Em','b3','chorus'],
      ['Am','b4','chorus'],['F','b5','chorus'],['Fs','b6','chorus'],['B7','b7','fill'],
      ['Em','c0','break'],['C','c1','break'],['Am','c2','break'],['B7','c3','break'],
      ['Em','rest','break'],['C','i1','break'],['Am','i2','build'],['B7','i3','fill'],
      ['Em','a0','chorus'],['C','a1','chorus'],['Am','a2','chorus'],['B7','a3','chorus'],
      ['Em','a4','chorus'],['D','a5','chorus'],['Am','a6','chorus'],['B7','a7','fill'],
      ['Em','v0','chorus'],['C','v1','chorus'],['Am','v2','chorus'],['B7','v3','chorus'],
      ['Em','a4','chorus'],['D','a5','chorus'],['Am','a6','chorus'],['B7','a7','fill'],
      ['G','b0','main'],['D','b1','main'],['C','b2','main'],['Em','b3','main'],
      ['Am','b4','main'],['F','b5','main'],['Fs','b6','main'],['B7','b7','fill'],
      ['Em','end','break'],['C','i1','break'],['Am','i2','intro'],['B7','c3','build'],
    ],
    bass:{drive:[0,'-',12,'.',0,'-',7,'.',0,'-',12,'.',7,'.',12,'.'],
      sparse:[0,'-','-','-','.','.','.',7,0,'-','-','-','.','.',12,'.']},
  };
  class Tracker {
    constructor(rate){
      this.rate=rate;this.rowLength=rate*60/(SONG.bpm*4);this.remaining=0;this.row=-1;this.frames=0;this.loops=0;
      this.playing=false;this.level=0;this.gain=0;this.smooth=1-Math.exp(-1/(rate*.02));this.seed=73129;
      this.lead=null;this.bass=null;this.arpPhase=0;this.arpAge=0;this.arpFrequency=0;this.arpIndex=-1;
      this.kickAge=1;this.kickPhase=0;this.snareAge=1;this.snarePhase=0;this.hatAge=1;this.hatLength=.035;this.lastNoise=0;
      this.echo=new Float32Array(Math.round(this.rowLength*3));this.echoIndex=0;
      this.notes=Object.fromEntries(Object.entries(SONG.phrases).map(([name,phrase])=>[name,phrase.split(' ').map(Tracker.note)]));
      this.progression=SONG.order.map(([chord,phrase,style])=>({chord:SONG.chords[chord],notes:this.notes[phrase],style}));
      this.frequencies=Array.from({length:128},(_,note)=>440*Math.pow(2,(note-69)/12));
    }
    static note(token){
      if(token==='-'||token==='.')return token;
      const match=/^([A-G])(#?)([0-8])$/.exec(token);
      if(!match)throw new Error('Invalid tracker note: '+token);
      return (Number(match[3])+1)*12+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1]]+(match[2]?1:0);
    }
    set(playing,level){this.playing=!!playing;this.level=Math.max(0,Math.min(1,level||0));}
    get audible(){return this.playing&&this.level>0||this.gain>1e-7;}
    voice(note,rows,kind){return {frequency:this.frequencies[note],age:0,phase:0,gate:rows*this.rowLength/this.rate*.88,kind};}
    advance(){
      this.row++;if(this.row===this.progression.length*16){this.row=0;this.loops++;}
      const step=this.row%16,bar=this.progression[this.row>>4],sparse=bar.style==='intro'||bar.style==='break';
      this.bar=bar;
      const note=bar.notes[step];
      if(typeof note==='number'){
        let rows=1;while(step+rows<16&&bar.notes[step+rows]==='-')rows++;
        this.lead=this.voice(note,rows,'lead');
      }
      const pattern=sparse?SONG.bass.sparse:SONG.bass.drive,bass=pattern[step];
      if(typeof bass==='number'){
        let rows=1;while(step+rows<16&&pattern[step+rows]==='-')rows++;
        this.bass=this.voice(bar.chord[0]+bass,rows,'bass');
      }
      if(step%2===0){this.arpAge=0;this.arpIndex=-1;}
      if(bar.style!=='intro'&&bar.style!=='break'){
        if([0,6,8].includes(step)||(bar.style==='fill'&&step===14)){this.kickAge=0;this.kickPhase=0;}
        if(step===4||step===12||(bar.style==='fill'&&step>=13)){this.snareAge=0;this.snarePhase=0;}
        if(step%2===0||bar.style==='chorus'||bar.style==='fill'){this.hatAge=0;this.hatLength=step===10?.09:.028;}
      }else if(bar.style==='break'&&step===0){this.kickAge=0;this.kickPhase=0;}
    }
    pitched(v,dt){
      if(!v||v.age>v.gate+.035)return 0;
      const lead=v.kind==='lead',vibrato=lead&&v.age>.12?1+.0035*Math.sin(v.age*2*Math.PI*6):1;
      v.phase=(v.phase+v.frequency*vibrato*dt)%1;
      const duty=lead?.26+.035*Math.sin(v.age*17):.34;
      const pulse=v.phase<duty?1:-duty/(1-duty),triangle=1-4*Math.abs(v.phase-.5);
      const env=Math.min(1,v.age/.003)*Math.min(1,Math.max(0,(v.gate+.035-v.age)/.035))*(.58+.42*Math.exp(-v.age*18));
      if(this.playing)v.age+=dt;
      return (lead?pulse:pulse*.7+triangle*.3)*env*(lead?.16:.18);
    }
    sample(){
      this.gain+=((this.playing?this.level:0)-this.gain)*this.smooth;
      if(!this.audible){this.gain=0;return 0;}
      if(this.playing){if(this.remaining<=0){this.advance();this.remaining+=this.rowLength;}this.remaining--;this.frames++;}
      if(!this.bar)return 0;
      const dt=1/this.rate,bar=this.bar,sparse=bar.style==='intro'||bar.style==='break';
      const lead=this.pitched(this.lead,dt),bass=this.pitched(this.bass,dt);
      const echo=this.echo[this.echoIndex];
      if(this.playing){this.echo[this.echoIndex]=lead+echo*.23;this.echoIndex=(this.echoIndex+1)%this.echo.length;}
      const arpIndex=Math.floor(this.arpAge*50)%3;
      if(arpIndex!==this.arpIndex){this.arpIndex=arpIndex;this.arpFrequency=this.frequencies[bar.chord[arpIndex+1]+(bar.style==='chorus'?12:0)];}
      this.arpPhase=(this.arpPhase+this.arpFrequency*dt)%1;
      const arp=(this.arpPhase<.125?1:-1/7)*Math.exp(-this.arpAge*9)*.085;
      let n=this.seed;n^=n<<13;n^=n>>>17;n^=n<<5;this.seed=n;const noise=(n>>>0)/2147483648-1;
      this.kickPhase=(this.kickPhase+(48+125*Math.exp(-this.kickAge*48))*dt)%1;
      this.snarePhase=(this.snarePhase+185*dt)%1;
      const kick=this.kickAge<.18?(Math.sin(this.kickPhase*Math.PI*2)*.8+noise*.2*Math.exp(-this.kickAge*160))*Math.exp(-this.kickAge*25)*.32:0;
      const snare=this.snareAge<.16?(noise*.75+Math.sin(this.snarePhase*Math.PI*2)*.25)*Math.exp(-this.snareAge*24)*.16:0;
      const hat=this.hatAge<this.hatLength?(noise-this.lastNoise)*Math.exp(-this.hatAge/this.hatLength*5)*.043:0;this.lastNoise=noise;
      if(this.playing){this.arpAge+=dt;this.kickAge+=dt;this.snareAge+=dt;this.hatAge+=dt;}
      return (lead*(sparse?.72:1)+bass+arp+echo*.25+kick+snare+hat)*this.gain;
    }
  }
  root.CaveMusic={SONG,Tracker};
  if(typeof module!=='undefined')module.exports=root.CaveMusic;
})(globalThis);
