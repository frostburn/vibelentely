(function(root){
  'use strict';
  // Basalttiyö — an original 64-bar tracker piece, E minor, 132 BPM, 4/4.
  // One token per sixteenth: a note retriggers, '-' sustains, '.' rests.
  const SONG={
    id:'basalttiyo',title:'Basalttiyö',bpm:132,
    chords:{Em:[40,52,55,59],C:[36,52,55,60],Am:[45,52,57,60],B7:[35,51,54,57],
      D:[38,50,54,57],G:[43,50,55,59],F:[41,53,57,60],Fs:[42,54,57,60]},
    phrases:{
      rest:'. . . . . . . . . . . . . . . .',
      i0:'. . . . E4 - - - . . B4 - G4 - E4 .',
      i1:'. . . . G4 - E4 - . . C5 - B4 - G4 .',
      i2:'A4 - - - . . E4 - C5 - B4 A4 . . E4 .',
      i3:'. . B4 - D#5 - F#5 - A5 G5 F#5 E5 D#5 C5 B4 .',
      a0:'E5 - B4 . G4 B4 E5 - F#5 E5 D5 B4 G4 - B4 .',
      a1:'E5 - G5 E5 D5 - C5 . B4 C5 E5 - . . . .',
      a2:'A4 - C5 E5 A5 - G5 E5 D5 C5 B4 A4 C5 - E5 .',
      a3:'F#5 - D#5 B4 A4 - F#4 . B4 D#5 F#5 - E5 D#5 B4 .',
      a4:'G5 - F#5 E5 B4 - E5 . D5 B4 G4 - A4 B4 D5 .',
      a5:'F#5 - E5 D5 A4 - D5 . C5 A4 F#4 A4 . . . .',
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
    // Arp patterns have one token per sixteenth: x accents, - holds, . releases.
    // The optional fourth order column picks a pattern; omitting it rests the arp.
    arps:{
      hint:{pattern:'x - . . . . . . . . . . . . . .',gain:.4},
      answer:{pattern:'. . . . . . . . . . . . x - - .',gain:.75},
      bed:{pattern:'x - . . . . . . x - . . . . . .',gain:.42},
      lift:{pattern:'. . . . . . . . x - x - x - . .',gain:.85},
      solo:{pattern:'x - - - - - - - x - - - - - . .',gain:1.65,octave:12},
      soloEnd:{pattern:'x - - - . . . . x - x - x - . .',gain:1.65,octave:12},
    },
    // The middle hands four bars to the arp; a two-bar reply returns near the end.
    order:[
      ['Em','i0','intro','hint'],['C','i1','intro'],['Am','i2','build'],['B7','i3','build','lift'],
      ['Em','a0','main'],['C','a1','main','answer'],['Am','a2','main'],['B7','a3','main'],
      ['Em','a4','main'],['D','a5','main','answer'],['Am','a6','main'],['B7','a7','fill','lift'],
      ['Em','v0','main','bed'],['C','v1','main'],['Am','v2','main','bed'],['B7','v3','main'],
      ['Em','a4','main'],['D','a5','main','answer'],['Am','a6','main'],['B7','a7','fill','lift'],
      ['G','b0','chorus','bed'],['D','b1','chorus'],['C','b2','chorus','bed'],['Em','b3','chorus'],
      ['Am','b4','chorus','bed'],['F','b5','chorus'],['Fs','b6','chorus'],['B7','b7','fill','lift'],
      ['Em','c0','break'],['C','c1','break'],['Am','rest','break','solo'],['B7','rest','break','solo'],
      ['Em','rest','break','solo'],['C','rest','break','soloEnd'],['Am','i2','build'],['B7','i3','fill','lift'],
      ['Em','a0','chorus','bed'],['C','a1','chorus','answer'],['Am','a2','chorus'],['B7','a3','chorus'],
      ['Em','a4','chorus','bed'],['D','a5','chorus','answer'],['Am','a6','chorus'],['B7','a7','fill','lift'],
      ['Em','v0','chorus','bed'],['C','v1','chorus'],['Am','v2','chorus','bed'],['B7','v3','chorus'],
      ['Em','a4','chorus'],['D','a5','chorus','answer'],['Am','rest','chorus','solo'],['B7','rest','fill','soloEnd'],
      ['G','b0','main'],['D','b1','main'],['C','b2','main'],['Em','b3','main','bed'],
      ['Am','b4','main'],['F','b5','main'],['Fs','b6','main'],['B7','b7','fill','lift'],
      ['Em','end','break'],['C','i1','break'],['Am','i2','intro'],['B7','c3','build'],
    ],
    bass:{drive:[0,'-',12,'.',0,'-',7,'.',0,'-',12,'.',7,'.',12,'.'],
      sparse:[0,'-','-','-','.','.','.',7,0,'-','-','-','.','.',12,'.']},
  };
  const COPPER={
    id:'kuparisydan',title:'Kuparisydän',bpm:148,
    // A clipped D-minor motor riff answers a broad F-major refrain.
    tone:{duty:.18,triangle:.08,arpGain:.06},
    drums:{kick:[0,3,8,10],snare:[4,12],hat:[0,2,4,6,8,10,12,14]},
    chords:{Dm:[38,50,53,57],Bb:[34,50,53,58],Gm:[43,55,58,62],A7:[33,49,52,55],
      F:[41,53,57,60],C:[36,52,55,60],Em7b5:[40,55,58,62]},
    phrases:{
      rest:'. . . . . . . . . . . . . . . .',
      i0:'. . D4 - . . A4 - . . D5 - C5 A4 F4 .',
      i1:'. . F4 - . . A#4 - . . D5 - F5 D5 A#4 .',
      i2:'G4 - . D5 G5 - F5 D5 A#4 - . D5 F5 D5 A#4 .',
      i3:'A4 - E5 - G5 F5 E5 D5 C#5 - E5 - A4 - - .',
      a0:'D5 - . A4 D5 - F5 - E5 D5 . C5 A4 - C5 .',
      a1:'D5 - F5 - A#5 - A5 F5 D5 - C5 D5 . . . .',
      a2:'G5 - . D5 G5 A5 A#5 - A5 G5 F5 D5 A#4 - D5 .',
      a3:'E5 - C#5 - A4 - . E5 G5 F5 E5 D5 C#5 - A4 .',
      a4:'D5 - . F5 A5 - G5 F5 E5 D5 . A4 F4 A4 D5 .',
      a5:'E5 - . G5 C6 - G5 E5 D5 C5 . G4 . . . .',
      a6:'D5 F5 G5 - A#5 - A5 G5 F5 D5 A#4 - D5 - G5 .',
      a7:'E5 G5 A5 - C#6 - A5 G5 E5 D5 C#5 - B4 C#5 E5 .',
      v0:'D5 A4 D5 . F5 - A5 - G5 F5 E5 D5 C5 - A4 .',
      v1:'F5 D5 F5 . A#5 - C6 A#5 A5 F5 D5 - C5 D5 F5 .',
      v2:'G5 D5 G5 . A#5 - A5 G5 F5 - D5 F5 G5 - A#5 .',
      v3:'A5 - G5 E5 C#5 - A4 . E5 F5 G5 E5 D5 C#5 A4 .',
      b0:'F5 - A5 - C6 - - A5 G5 - F5 - E5 F5 A5 .',
      b1:'E5 - G5 - C6 - - G5 E5 - D5 - C5 D5 E5 .',
      b2:'F5 - A#5 - D6 - C6 A#5 A5 - F5 - D5 F5 A5 .',
      b3:'A5 - - F5 D5 - F5 A5 G5 F5 E5 - D5 - - .',
      b4:'G5 - A#5 - D6 - C6 A#5 A5 G5 F5 - D5 - G5 .',
      b5:'G5 - E5 - A#5 - G5 E5 D5 E5 G5 A#5 A5 - G5 .',
      b6:'E5 - C#5 - A4 - C#5 E5 G5 - A5 G5 F5 E5 D5 .',
      b7:'C#5 - E5 - A5 - G5 F5 E5 D5 C#5 B4 A4 - - .',
      c0:'D4 - - - A4 - - - F4 - A4 - D5 - - .',
      c1:'F4 - - - A#4 - - - D5 - C5 - A#4 - - .',
      c2:'G4 - - - D5 - - - A#4 - A4 - G4 - - .',
      c3:'A4 - - - E5 - - - G5 - F5 - E5 C#5 A4 .',
      end:'D5 - - - F5 - A5 - D5 - - - . . . .',
    },
    arps:{
      hint:{pattern:'x . . . . . . . . . . . . . . .',gain:.4},
      stab:{pattern:'. . x - . . . . . . x - . . . .',gain:.5},
      answer:{pattern:'. . . . . . . . . . . . x - x .',gain:.8},
      lift:{pattern:'. . . . . . . . x . x . x - x .',gain:.9},
      solo:{pattern:'x - . x - . x - x - . x - . x .',gain:1.7,octave:12},
      soloEnd:{pattern:'x - . x - . x - x . x . x - . .',gain:1.7,octave:12},
    },
    order:[
      ['Dm','i0','intro','hint'],['Bb','i1','intro'],['Gm','i2','build'],['A7','i3','fill','lift'],
      ['Dm','a0','main'],['Bb','a1','main','answer'],['Gm','a2','main'],['A7','a3','main','stab'],
      ['Dm','a4','main'],['C','a5','main','answer'],['Gm','a6','main'],['A7','a7','fill','lift'],
      ['Dm','v0','main'],['Bb','v1','main','stab'],['Gm','v2','main'],['A7','v3','main','stab'],
      ['Dm','a4','main'],['C','a5','main','answer'],['Gm','a6','main'],['A7','a7','fill','lift'],
      ['F','b0','chorus','stab'],['C','b1','chorus'],['Bb','b2','chorus','stab'],['Dm','b3','chorus'],
      ['Gm','b4','chorus'],['Em7b5','b5','chorus','stab'],['A7','b6','chorus'],['A7','b7','fill','lift'],
      ['Dm','c0','break'],['Bb','c1','break'],['Gm','rest','break','solo'],['A7','rest','break','solo'],
      ['Dm','rest','intro','solo'],['Bb','rest','build','soloEnd'],['Gm','i2','build'],['A7','i3','fill','lift'],
      ['Dm','a0','chorus','stab'],['Bb','a1','chorus','answer'],['Gm','a2','chorus'],['A7','a3','chorus'],
      ['Dm','a4','chorus','stab'],['C','a5','chorus','answer'],['Gm','a6','chorus'],['A7','a7','fill','lift'],
      ['Dm','v0','chorus','stab'],['Bb','v1','chorus'],['Gm','v2','chorus','stab'],['A7','v3','chorus'],
      ['Dm','a4','chorus'],['C','a5','chorus','answer'],['Gm','a6','chorus'],['A7','a7','fill','lift'],
      ['F','b0','chorus'],['C','b1','chorus'],['Bb','rest','chorus','solo'],['Dm','rest','chorus','soloEnd'],
      ['Gm','b4','main'],['Em7b5','b5','main','stab'],['A7','b6','main'],['A7','b7','fill','lift'],
      ['Dm','end','break'],['Bb','c1','break'],['Gm','c2','intro'],['A7','c3','build'],
    ],
    bass:{drive:[0,'.',0,12,0,'-',7,'.',0,'.',12,7,0,12,7,'.'],
      sparse:[0,'-','-','-','.','.',7,'.',0,'-','-','-','.','.',12,'.']},
  };
  const AURORA={
    id:'revontulivirta',title:'Revontulivirta',bpm:116,
    // A Dorian: the raised sixth lights up a spacious, half-time melody.
    // The borrowed F and E7 in the middle briefly turn it towards harmonic minor.
    tone:{duty:.32,triangle:.55,arpGain:.05},
    drums:{kick:[0,10],snare:[8],hat:[0,3,6,8,11,14]},
    chords:{Am:[45,57,60,64],D:[38,54,57,62],G:[43,55,59,62],C:[36,55,60,64],
      Em:[40,55,59,64],F:[41,53,57,60],E7:[40,56,59,62]},
    phrases:{
      rest:'. . . . . . . . . . . . . . . .',
      i0:'. . . . A4 - - - E5 - - - C5 - - .',
      i1:'. . . . F#4 - - - A4 - - - D5 - - .',
      i2:'B4 - - - D5 - - - G5 - F#5 - E5 - D5 .',
      i3:'E5 - - - C5 - - - G4 - - - B4 C5 E5 .',
      a0:'A4 - - E5 - - C5 - B4 - A4 - E4 - G4 .',
      a1:'F#4 - - A4 - - D5 - E5 - F#5 - . . . .',
      a2:'B4 - - D5 - - G5 - F#5 - E5 - D5 - B4 .',
      a3:'E5 - - G5 - - E5 - D5 - C5 - G4 - C5 .',
      a4:'C5 - - E5 - - A5 - G5 - E5 - C5 B4 A4 .',
      a5:'D5 - - F#5 - - A5 - G5 F#5 E5 - . . . .',
      a6:'B4 - - E5 - - G5 - F#5 - E5 - D5 B4 G4 .',
      a7:'A4 - - - C5 - E5 - G5 - F#5 E5 C5 - B4 .',
      b0:'G5 - - - E5 - G5 - C6 - B5 G5 E5 - - .',
      b1:'F#5 - - - D5 - F#5 - A5 - G5 F#5 E5 - D5 .',
      b2:'G5 - - - D5 - B4 - D5 - E5 - G5 - A5 .',
      b3:'G5 - E5 - B4 - - - D5 - E5 - G5 - F#5 .',
      b4:'A5 - - - E5 - C5 - E5 - G5 - A5 - B5 .',
      b5:'A5 - F#5 - D5 - - - E5 - F#5 - A5 - G5 .',
      b6:'E5 - - - G5 - E5 - D5 - C5 - G4 - E5 .',
      b7:'B4 - - - G4 - B4 - E5 - F#5 - G5 F#5 E5 .',
      c0:'A4 - - - E4 - - - C5 - - - B4 - A4 .',
      c1:'A4 - - - C5 - - - F5 - - - E5 - C5 .',
      c2:'G4 - - - C5 - - - E5 - - - D5 - C5 .',
      c3:'B4 - - - G#4 - - - E5 - D5 - B4 - G#4 .',
      v0:'E5 - A5 - - - G5 E5 C5 - B4 A4 G4 - A4 .',
      v1:'A4 - D5 - - - E5 F#5 A5 - G5 F#5 E5 - D5 .',
      v2:'D5 - G5 - - - A5 B5 A5 - G5 F#5 E5 - D5 .',
      v3:'G5 - E5 - - - C5 G4 C5 - D5 E5 G5 - E5 .',
      end:'A5 - - - E5 - C5 - A4 - - - . . . .',
    },
    arps:{
      hint:{pattern:'x - - . . . . . . . . . . . . .',gain:.35},
      answer:{pattern:'. . . . . . . . . . . . x - - .',gain:.7},
      glow:{pattern:'x - - - . . . . x - - - . . . .',gain:.38},
      lift:{pattern:'. . . . . . . . x - - - x - - .',gain:.75},
      solo:{pattern:'x - - - - - - - x - - - - - . .',gain:1.8,octave:12},
      soloEnd:{pattern:'x - - - - - . . x - - - . . . .',gain:1.8,octave:12},
    },
    order:[
      ['Am','i0','intro','hint'],['D','i1','intro'],['G','i2','intro'],['C','i3','intro'],
      ['Am','i0','break'],['D','i1','break'],['G','i2','build'],['Em','b7','build','lift'],
      ['Am','a0','main'],['D','a1','main','answer'],['G','a2','main'],['C','a3','main'],
      ['Am','a4','main'],['D','a5','main','answer'],['Em','a6','main'],['Am','a7','fill','lift'],
      ['Am','v0','main'],['D','v1','main'],['G','v2','main','glow'],['C','v3','main'],
      ['Am','a4','main'],['D','a5','main','answer'],['Em','a6','main'],['Am','a7','fill','lift'],
      ['C','b0','chorus','glow'],['D','b1','chorus'],['G','b2','chorus'],['Em','b3','chorus','glow'],
      ['Am','b4','chorus'],['D','b5','chorus','glow'],['C','b6','chorus'],['Em','b7','fill','lift'],
      ['Am','c0','break'],['F','c1','break'],['C','rest','break','solo'],['E7','rest','break','solo'],
      ['Am','rest','break','solo'],['F','rest','break','soloEnd'],['D','i1','build'],['E7','c3','fill','lift'],
      ['Am','v0','chorus','glow'],['D','v1','chorus'],['G','v2','chorus','glow'],['C','v3','chorus'],
      ['Am','a4','chorus'],['D','a5','chorus','answer'],['Em','a6','chorus'],['Am','a7','fill','lift'],
      ['C','b0','chorus'],['D','b1','chorus'],['G','rest','chorus','solo'],['Em','rest','chorus','soloEnd'],
      ['Am','b4','chorus','glow'],['D','b5','chorus'],['C','b6','chorus'],['Em','b7','fill','lift'],
      ['Am','a0','main'],['D','a1','main','answer'],['G','a2','main'],['C','a3','main'],
      ['Am','end','break'],['D','i1','break'],['G','i2','intro'],['Em','b7','intro'],
    ],
    bass:{drive:[0,'-','-','.',7,'-','.',12,0,'-','-','.',12,'.',7,'.'],
      sparse:[0,'-','-','-','-','-','.','.',7,'-','-','-','.','.',12,'.']},
  };
  const SONGS=[SONG,COPPER,AURORA],REPEATS=3,ARP_HZ=50;
  class Tracker {
    constructor(rate,song=SONGS[0]){
      this.rate=rate;this.song=song;this.rowLength=rate*60/(song.bpm*4);this.smooth=1-Math.exp(-1/(rate*.02));
      this.tone={duty:.26,triangle:0,arpHz:ARP_HZ,arpGain:.065,...song.tone};
      this.arpHz=null;this.arpSolo=false;
      this.drums=song.drums||{kick:[0,6,8],snare:[4,12],hat:[0,2,4,6,8,10,12,14]};
      this.echo=new Float32Array(Math.round(this.rowLength*3));
      this.notes=Object.fromEntries(Object.entries(song.phrases).map(([name,phrase])=>[name,phrase.split(' ').map(Tracker.note)]));
      this.arps=Object.fromEntries(Object.entries(song.arps).map(([name,part])=>[name,{...part,rows:part.pattern.split(' ')}]));
      this.progression=song.order.map(([chord,phrase,style,arp])=>({chord:song.chords[chord],notes:this.notes[phrase],style,arp:this.arps[arp]}));
      this.frequencies=Array.from({length:128},(_,note)=>440*Math.pow(2,(note-69)/12));this.reset();
    }
    reset(){
      this.remaining=0;this.row=-1;this.frames=0;this.loops=0;this.bar=null;
      this.playing=false;this.level=0;this.gain=0;this.seed=73129;
      this.lead=null;this.bass=null;this.arpPhase=0;this.arpAge=0;this.arpFrequency=0;this.arpIndex=-1;
      this.arpTarget=0;this.arpLevel=0;
      this.arpOffset=0;this.arpBaseFrame=0;this.soloMix=Number(this.arpSolo);
      this.kickAge=1;this.kickPhase=0;this.snareAge=1;this.snarePhase=0;this.hatAge=1;this.hatLength=.035;this.lastNoise=0;
      this.echo.fill(0);this.echoIndex=0;
    }
    static note(token){
      if(token==='-'||token==='.')return token;
      const match=/^([A-G])(#?)([0-8])$/.exec(token);
      if(!match)throw new Error('Invalid tracker note: '+token);
      return (Number(match[3])+1)*12+{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1]]+(match[2]?1:0);
    }
    set(playing,level){this.playing=!!playing;this.level=Math.max(0,Math.min(1,level||0));}
    debug({arpSolo,arpHz}){
      this.arpSolo=arpSolo;if(!this.frames&&!this.gain)this.soloMix=Number(arpSolo);
      if(arpHz===this.arpHz)return;
      const frame=Math.max(0,this.frames-1);
      this.arpOffset=(this.arpOffset+(frame-this.arpBaseFrame)*(this.arpHz??this.tone.arpHz)/this.rate)%3;
      this.arpBaseFrame=frame;this.arpHz=arpHz;
    }
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
      const pattern=sparse?this.song.bass.sparse:this.song.bass.drive,bass=pattern[step];
      if(typeof bass==='number'){
        let rows=1;while(step+rows<16&&pattern[step+rows]==='-')rows++;
        this.bass=this.voice(bar.chord[0]+bass,rows,'bass');
      }
      const arp=bar.arp?.rows[step]??'.';
      if(arp==='x'){this.arpAge=0;this.arpTarget=bar.arp.gain;}
      else if(arp==='.')this.arpTarget=0;
      if(step===0)this.arpIndex=-1; // Refresh the chord without restarting the pitch-effect clock.
      if(bar.style!=='intro'&&bar.style!=='break'){
        if(this.drums.kick.includes(step)||(bar.style==='fill'&&step===14)){this.kickAge=0;this.kickPhase=0;}
        if(this.drums.snare.includes(step)||(bar.style==='fill'&&step>=13)){this.snareAge=0;this.snarePhase=0;}
        if(this.drums.hat.includes(step)||bar.style==='chorus'||bar.style==='fill'){this.hatAge=0;this.hatLength=step===10?.09:.028;}
      }else if(bar.style==='break'&&step===0){this.kickAge=0;this.kickPhase=0;}
    }
    pitched(v,dt){
      if(!v||v.age>v.gate+.035)return 0;
      const lead=v.kind==='lead',vibrato=lead&&v.age>.12?1+.0035*Math.sin(v.age*2*Math.PI*6):1;
      v.phase=(v.phase+v.frequency*vibrato*dt)%1;
      const duty=lead?this.tone.duty+.035*Math.sin(v.age*17):.34;
      const pulse=v.phase<duty?1:-duty/(1-duty),triangle=1-4*Math.abs(v.phase-.5);
      const env=Math.min(1,v.age/.003)*Math.min(1,Math.max(0,(v.gate+.035-v.age)/.035))*(.58+.42*Math.exp(-v.age*18));
      if(this.playing)v.age+=dt;
      return (lead?pulse*(1-this.tone.triangle)+triangle*this.tone.triangle:pulse*.7+triangle*.3)*env*(lead?.16:.18);
    }
    arpeggio(dt){
      // Fast 0xy-style pitch cycling on one continuous oscillator. The sample clock
      // keeps the effect running evenly across rhythmic accents and chord changes.
      const index=Math.floor(this.arpOffset+(this.frames-1-this.arpBaseFrame)*(this.arpHz??this.tone.arpHz)/this.rate+1e-10)%3;
      if(index!==this.arpIndex){this.arpIndex=index;this.arpFrequency=this.frequencies[this.bar.chord[index+1]+(this.bar.arp?.octave??0)];}
      this.arpPhase=(this.arpPhase+this.arpFrequency*dt)%1;
      if(this.playing){
        this.arpLevel+=(this.arpTarget-this.arpLevel)*this.smooth;
        if(Math.abs(this.arpTarget-this.arpLevel)<1e-7)this.arpLevel=this.arpTarget;
      }
      return (this.arpPhase<.125?1:-1/7)*(.65+.35*Math.exp(-this.arpAge*9))*this.tone.arpGain*this.arpLevel;
    }
    sample(){
      this.gain+=((this.playing?this.level:0)-this.gain)*this.smooth;
      this.soloMix+=(Number(this.arpSolo)-this.soloMix)*this.smooth;
      if(Math.abs(Number(this.arpSolo)-this.soloMix)<1e-7)this.soloMix=Number(this.arpSolo);
      if(!this.audible){this.gain=0;return 0;}
      if(this.playing){if(this.remaining<=0){this.advance();this.remaining+=this.rowLength;}this.remaining--;this.frames++;}
      if(!this.bar)return 0;
      const dt=1/this.rate,bar=this.bar,sparse=bar.style==='intro'||bar.style==='break';
      const lead=this.pitched(this.lead,dt),bass=this.pitched(this.bass,dt);
      const echo=this.echo[this.echoIndex];
      if(this.playing){this.echo[this.echoIndex]=lead+echo*.23;this.echoIndex=(this.echoIndex+1)%this.echo.length;}
      const arp=this.arpeggio(dt);
      let n=this.seed;n^=n<<13;n^=n>>>17;n^=n<<5;this.seed=n;const noise=(n>>>0)/2147483648-1;
      this.kickPhase=(this.kickPhase+(48+125*Math.exp(-this.kickAge*48))*dt)%1;
      this.snarePhase=(this.snarePhase+185*dt)%1;
      const kick=this.kickAge<.18?(Math.sin(this.kickPhase*Math.PI*2)*.8+noise*.2*Math.exp(-this.kickAge*160))*Math.exp(-this.kickAge*25)*.32:0;
      const snare=this.snareAge<.16?(noise*.75+Math.sin(this.snarePhase*Math.PI*2)*.25)*Math.exp(-this.snareAge*24)*.16:0;
      const hat=this.hatAge<this.hatLength?(noise-this.lastNoise)*Math.exp(-this.hatAge/this.hatLength*5)*.043:0;this.lastNoise=noise;
      if(this.playing){this.arpAge+=dt;this.kickAge+=dt;this.snareAge+=dt;this.hatAge+=dt;}
      const mix=lead*(sparse?.72:1)+bass+arp+echo*.25+kick+snare+hat;
      if(this.soloMix===1)return arp*this.gain;
      return (mix+(arp-mix)*this.soloMix)*this.gain;
    }
  }
  class Playlist {
    constructor(rate){
      // Compile scores and allocate delay buffers once, outside the audio callback.
      this.tracks=SONGS.map(song=>new Tracker(rate,song));this.index=0;this.current=this.tracks[0];this.previous=null;
      this.playing=false;this.level=0;this.autoAdvance=true;this.request=0;this.changed=true;
    }
    get audible(){return this.current.audible||!!this.previous?.audible;}
    set(playing,level){
      this.playing=!!playing;this.level=Math.max(0,Math.min(1,level||0));
      this.current.set(this.playing,this.level);this.previous?.set(false,this.level);
    }
    configure({track,autoAdvance,request}){
      if(typeof autoAdvance==='boolean')this.autoAdvance=autoAdvance;
      const index=SONGS.findIndex(song=>song.id===track);
      if(index<0)return;
      if(Number.isSafeInteger(request))this.request=request;
      this.select(index);this.changed=true;
    }
    select(index){
      if(index===this.index)return;
      this.previous=this.current;this.previous.set(false,this.level);
      this.index=index;this.current=this.tracks[index];this.current.reset();this.current.set(this.playing,this.level);this.changed=true;
    }
    takeState(){
      if(!this.changed)return null;this.changed=false;
      return {type:'music-state',track:this.current.song.id,request:this.request};
    }
    sample(){
      const t=this.current;
      // Change only after three COMPLETE performances, before triggering row zero again.
      if(this.playing&&this.level>0&&this.autoAdvance&&t.loops>=REPEATS-1&&t.row===t.progression.length*16-1&&t.remaining<=0)
        this.select((this.index+1)%this.tracks.length);
      let value=this.current.sample();
      if(this.previous){value+=this.previous.sample();if(!this.previous.audible)this.previous=null;}
      return value;
    }
  }
  root.CaveMusic={SONG,SONGS,REPEATS,ARP_HZ,Tracker,Playlist};
  if(typeof module!=='undefined')module.exports=root.CaveMusic;
})(globalThis);
