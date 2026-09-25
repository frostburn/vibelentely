(function(root){
  'use strict';
  // Three little walking plays; the dialogue and bar map live in docs/music-scenes.md.
  // Sixteenth-note tokens: a note attacks, '-' holds, '.' rests.
  // Order columns: chord, pulse phrase, groove, optional arp, optional FM-kantele phrase.
  const SONG={
    id:'basalttiyo',title:'Basalttiyö',bpm:132,
    tone:{duty:.27,triangle:.12,arpGain:.05,replyColor:1.1,replyDecay:.23},
    chords:{Em:[40,52,55,59],C:[36,52,55,60],Am:[45,52,57,60],B7:[35,51,54,57],
      D:[38,50,54,57],G:[43,50,55,59],F:[41,53,57,60],Fs:[42,54,57,60]},
    phrases:{
      rest:'. . . . . . . . . . . . . . . .',
      path:'E4 - B4 - G4 - - . F#4 - - - . . . .',
      pathEnd:'E4 - - . G4 - A4 - B4 - - - . . . .',
      pathMore:'B4 - E5 - F#5 - G5 - F#5 - E5 - . . . .',
      pathAlt:'E4 - B4 - G4 - A4 - B4 - E5 - . . . .',
      side:'. . . . . . . . . . B4 - E5 - . .',
      sideC:'. . . . . . . . . . G4 - C5 - . .',
      cut:'A4 - C5 - E5 - . . . . . . . . . .',
      answerAm:'. . . . . . E5 - C5 - B4 - A4 - . .',
      thread:'E4 - - - . . . . B4 - - - . . . .',
      threadG:'G4 - - - . . . . D4 - - - . . . .',
      light:'. . B4 - E5 - D5 - B4 - G4 - . . . .',
      lightEnd:'. . G4 - B4 - E5 - D5 - B4 - . . . .',
      hollow:'A4 - C5 - B4 - A4 - . . E5 - - - . .',
      hollowEnd:'F#4 - A4 - F#4 - - . D#4 - - - . . . .',
      step:'E4 - . . G4 - . . B4 - E5 - D5 - . .',
      stepEnd:'D#5 - B4 - F#4 - . . B4 - - - . . . .',
      doubt:'E5 - F#5 - G5 - - . F#5 - E5 - B4 - . .',
      doubtEnd:'G4 - A4 - B4 - D5 - B4 - - - . . . .',
      bend:'. . B4 - D5 - G5 - F#5 - D5 - . . . .',
      bendEnd:'. . A4 - D5 - F#5 - E5 - D5 - . . . .',
      listen:'B4 - - . . . . . . . . . . . . .',
      pickup:'. . . . . . . . . . . . E4 - G4 B4',
      near:'G5 - B5 - A5 - G5 - D5 - - - . . . .',
      nearEnd:'F#5 - A5 - G5 - F#5 - D5 - - - . . . .',
      climb:'E5 - B5 - G5 - - . F#5 - G5 - E5 - . .',
      climbEnd:'C5 - E5 - G5 - E5 - D5 - C5 - B4 - . .',
      trust:'A4 - C5 - E5 - - - D5 - C5 - A4 - . .',
      trustEnd:'F#4 - B4 - D#5 - - - F#5 - E5 D#5 B4 - . .',
      together:'E5 - B5 - G5 - - . . . . . E5 - - .',
      togetherEnd:'G5 - E5 - C5 - - . . . . . D5 - - .',
      under:'. . . . . . . . G4 - B4 - E5 - . .',
      underEnd:'. . . . . . . . E4 - G4 - C5 - . .',
      home:'E5 - - - B4 - G4 - E4 - - - . . . .',
      homeEnd:'. . G4 - E4 - - . . . B3 - E4 - . .',
    },
    arps:{
      leaves:{pattern:'x - . . . . x - . . . . . . . .',gain:.32},
      wind:{pattern:'. . x - - - . . . . x - - . . .',gain:.46},
      gust:{pattern:'x - - - . . . . x - - - - - . .',gain:.78,octave:12},
    },
    bass:{
      walk:[0,'-','-','.',7,'-','-','.',12,'-','-','.',7,'-','-','.'],
      climb:[0,'-','.',12,7,'-','-','.',12,'-','.',7,0,'-',7,11],
      breath:[0,'-','.','.',7,'-','.','.','.','.','.','.','.','.',7,'.'],
      turn:[0,'-',3,5,7,'-',10,7,12,'-',7,5,3,'-',2,'.'],
      pedal:[0,'-','-','-','-','-','-','-',0,'-','-','-','-','-','-','.'],
    },
    grooves:{
      light:{bass:'walk',kick:[0,8],snare:[12],hat:[2,6,10,14],level:.58},
      walk:{bass:'walk',kick:[0,8],snare:[4,12],hat:[2,6,10,14],level:.78},
      push:{bass:'climb',kick:[0,6,8],snare:[4,12],hat:[0,2,4,6,8,10,12,14],level:.91},
      rise:{bass:'climb',kick:[0,8,14],snare:[4,12,15],hat:[0,2,4,6,8,10,12,14],level:1},
      breath:{bass:'breath',kick:[0,4,14],snare:[],hat:[14],level:.5},
      turn:{bass:'turn',kick:[0,8],snare:[12],hat:[2,6,10,14],level:.84},
      half:{bass:'pedal',kick:[0,8],snare:[8],hat:[4,12],level:.76},
      lean:{bass:'walk',kick:[0,8,11],snare:[6,12],hat:[2,6,10,14],level:.85},
    },
    order:[
      // 1–8: The walker asks where the path went. The echo answers in a new voice.
      ['Em','path','light','leaves'],['C','pathEnd','light',null,'sideC'],['Em','pathMore','walk'],['B7','rest','walk',null,'stepEnd'],
      ['Am','cut','walk',null,'answerAm'],['B7','rest','walk','wind','hollowEnd'],['Em','step','walk'],['B7','stepEnd','push'],
      // 9–16: One step becomes a question; its rhythm comes back as an answer.
      ['Em','path','walk'],['C','pathEnd','walk','leaves'],['Em','rest','walk',null,'light'],['C','climbEnd','walk',null,'sideC'],
      ['Am','cut','push',null,'answerAm'],['B7','rest','walk',null,'stepEnd'],['Em','rest','turn','wind'],['B7','rest','walk',null,'pickup'],
      // 17–24: They argue about the way. Longer phrases open towards G major.
      ['G','doubtEnd','walk','leaves'],['D','nearEnd','walk'],['G','near','walk',null,'threadG'],['D','rest','walk',null,'bendEnd'],
      ['C','rest','walk',null,'climbEnd'],['Am','cut','walk','wind','answerAm'],['Fs','trustEnd','push'],['B7','stepEnd','rise'],
      // 25–32: The echo knows the bend. A two-beat listening pause, then a pickup.
      ['G','near','half'],['D','nearEnd','half','leaves'],['G','near','walk',null,'threadG'],['D','nearEnd','walk'],
      ['Am','listen','light'],['B7','hollowEnd','light'],['Em','rest','light',null,'listen'],['B7','rest','breath',null,'pickup'],
      // 33–40: Roles reverse: the kantele asks with the walker's exact motif.
      ['Em','rest','walk','leaves','path'],['C','rest','walk',null,'pathEnd'],['Em','thread','walk',null,'pathMore'],['B7','rest','push',null,'stepEnd'],
      ['Am','hollow','walk'],['B7','hollowEnd','walk','wind'],['Em','pathAlt','walk',null,'side'],['B7','rest','rise',null,'stepEnd'],
      // 41–48: Confidence raises the question an octave; answers grow with it.
      ['Em','climb','push','leaves'],['C','climbEnd','push',null,'sideC'],['G','near','push'],['D','nearEnd','push',null,'bendEnd'],
      ['Am','rest','lean',null,'trust'],['F','rest','walk','wind','climbEnd'],['Fs','trustEnd','push'],['B7','stepEnd','rise','gust'],
      // 49–56: Short overlaps become a shared sentence instead of two solos.
      ['Em','together','push','leaves','under'],['C','togetherEnd','walk',null,'underEnd'],['G','threadG','push',null,'near'],['D','nearEnd','walk'],
      ['Am','trust','push','wind'],['F','climbEnd','walk'],['Fs','trustEnd','push'],['B7','stepEnd','rise','gust'],
      // 57–64: The opening question now resolves. Footsteps lead back into the loop.
      ['Em','path','walk'],['C','pathEnd','walk'],['Am','rest','turn','leaves'],['B7','rest','walk',null,'stepEnd'],
      ['Em','home','light'],['C','climbEnd','light',null,'homeEnd'],['Am','trust','walk'],['B7','rest','walk',null,'pickup'],
    ],
  };
  const COPPER={
    id:'kuparisydan',title:'Kuparisydän',bpm:148,
    tone:{duty:.19,triangle:.08,arpGain:.047,replyColor:1.8,replyDecay:.18,replyGain:.12},
    chords:{Dm:[38,50,53,57],Bb:[34,50,53,58],Gm:[43,55,58,62],A7:[33,49,52,55],
      F:[41,53,57,60],C:[36,52,55,60],Em7b5:[40,55,58,62]},
    phrases:{
      rest:'. . . . . . . . . . . . . . . .',
      knock:'D5 - . A4 D5 - . . F5 - E5 - D5 - . .',
      knockEnd:'F5 - D5 - A#4 - - . A4 - - - . . . .',
      knockLong:'A5 - G5 F5 E5 - D5 - F5 - E5 - D5 - . .',
      cut:'G5 - D5 - G5 - . . . . . . . . . .',
      interject:'. . . . . . A4 . E5 . C#5 - A4 - . .',
      tail:'. . . . . . . . . . . . D4 F4 A4 .',
      chordF:'F4 - - - . . . . C5 - - - . . . .',
      last:'E5 - C#5 - . . . . A4 - - - . . . .',
      answerFast:'F4 A4 C5 - D5 C5 A4 - . . . . . . . .',
      screw:'. D4 . A4 . D5 - . . A4 . F4 D4 - . .',
      screwEnd:'. A4 . E5 . C#5 - . . A4 . G4 E4 - . .',
      doubt:'G5 - D5 - G5 - . . A#5 - A5 - G5 - . .',
      doubtEnd:'E5 - C#5 - A4 - . . G5 - E5 - C#5 - . .',
      wait:'. . G4 - A#4 - D5 - . . F5 - D5 - . .',
      waitEnd:'. . E5 - C#5 - A4 - . . G4 - A4 - . .',
      faster:'D5 A5 D5 - F5 - A5 - G5 - F5 - E5 D5 . .',
      fasterEnd:'E5 G5 C6 - G5 - E5 - D5 - C5 - G4 - . .',
      protest:'. . D5 - . F5 A5 - . . G5 F5 D5 - . .',
      protestEnd:'. . E5 - . G5 A5 - . . G5 E5 C#5 - . .',
      hinge:'D5 - - . F5 - - . A5 - - - . . . .',
      hingeEnd:'A#4 - - . D5 - - . F5 - - - . . . .',
      stop:'A4 - . . . . . . . . . . . . . .',
      pickup:'. . . . . . . . . . . . . D4 F4 A4',
      heart:'F5 - A5 - C6 - - . A5 - G5 - F5 - . .',
      heartEnd:'E5 - G5 - C6 - - . G5 - E5 - C5 - . .',
      answer:'F4 - A4 - C5 - - . D5 - C5 - A4 - . .',
      answerEnd:'A4 - F4 - D4 - - . F4 - A4 - D5 - . .',
      together:'D5 - . A4 D5 - . . . . . . F5 - - .',
      togetherEnd:'F5 - A5 - C6 - - . . . . . A5 - - .',
      under:'. . . . . . . . D4 - F4 - A4 - D5 .',
      underEnd:'. . . . . . . . F4 - A4 - C5 - F5 .',
      home:'D5 - F5 - A5 - - . F5 - D5 - . . . .',
      homeEnd:'A4 - F4 - D4 - - . . . A4 - D5 - . .',
    },
    arps:{
      leaves:{pattern:'. . x - . . . . . . x - . . . .',gain:.32},
      wind:{pattern:'. . . . x - . . . . x - x - . .',gain:.48},
      gust:{pattern:'x - . x - . . . x - . x - - . .',gain:.8,octave:12},
    },
    bass:{
      walk:[0,'-','-','.',7,'-','-','.',12,'-','-','.',7,'-','-','.'],
      climb:[0,'-','.',12,7,'-','.',0,12,'-','.',7,0,'-',7,12],
      breath:[0,'-','.','.',7,'-','.','.','.','.','.','.','.','.',7,'.'],
      turn:[0,'-','.',7,12,'-','-','.',15,'-',14,'-',12,'-',7,'.'],
      hitch:[0,'.','.',7,'.','.',12,'.',0,'-','.',7,'.','.',12,'.'],
    },
    grooves:{
      light:{bass:'walk',kick:[0,8],snare:[4,12],hat:[2,6,10,14],level:.57},
      walk:{bass:'walk',kick:[0,8],snare:[4,12],hat:[0,2,6,8,10,14],level:.78},
      push:{bass:'climb',kick:[0,3,8,10],snare:[4,12],hat:[0,2,4,6,8,10,12,14],level:.93},
      rise:{bass:'climb',kick:[0,3,8,14],snare:[4,12,15],hat:[0,2,4,6,8,10,12,14],level:1},
      breath:{bass:'breath',kick:[0,4,14],snare:[],hat:[14],level:.5},
      turn:{bass:'turn',kick:[0,8],snare:[12],hat:[2,6,14],level:.86},
      hitch:{bass:'hitch',kick:[0,7,10],snare:[4,12],hat:[2,6,14],level:.86},
      bare:{bass:'walk',kick:[0,8],snare:[],hat:[],level:.76},
    },
    order:[
      // 1–8: A syncopated knock. The machine dismisses it with a crooked little reply.
      ['Dm','knock','light','leaves'],['Bb','knockEnd','walk'],['Dm','rest','walk',null,'screw'],['A7','rest','walk',null,'screwEnd'],
      ['Gm','cut','walk',null,'wait'],['A7','doubtEnd','walk','wind','interject'],['Gm','doubt','push'],['A7','last','walk'],
      // 9–16: The walker quickens; the answer stumbles and catches up.
      ['Dm','faster','push'],['C','fasterEnd','push','leaves'],['Dm','knockLong','push',null,'tail'],['A7','rest','hitch',null,'protestEnd'],
      ['Dm','knock','walk'],['Bb','knockEnd','walk'],['Dm','rest','push','wind','screw'],['A7','doubtEnd','rise',null,'interject'],
      // 17–24: The broad major theme is offered; the machine still dodges the question.
      ['F','heart','walk','leaves'],['C','heartEnd','walk'],['Bb','hingeEnd','walk',null,'answerFast'],['Dm','rest','turn'],
      ['Gm','rest','walk',null,'doubt'],['Em7b5','rest','walk','wind','doubtEnd'],['A7','last','walk',null,'protestEnd'],['A7','doubtEnd','rise'],
      // 25–32: A stopped heartbeat lasts half a bar, then the answer reveals itself.
      ['Dm','hinge','light'],['Bb','hingeEnd','light'],['A7','rest','light',null,'stop'],['A7','rest','breath',null,'pickup'],
      ['F','rest','bare',null,'heart'],['C','rest','bare','leaves','heartEnd'],['Bb','knockEnd','walk',null,'answerFast'],['Dm','home','rise'],
      // 33–40: The same motifs switch instruments. Both now recognise the knock.
      ['Dm','rest','walk','leaves','knock'],['Bb','rest','walk',null,'knockEnd'],['Dm','under','walk',null,'knockLong'],['A7','last','walk'],
      ['Gm','rest','push',null,'doubt'],['A7','rest','walk','wind','doubtEnd'],['Gm','rest','walk',null,'wait'],['A7','last','rise',null,'interject'],
      // 41–48: The machine stops dodging: a full answer, followed by a warmer refrain.
      ['F','heart','push',null,'chordF'],['C','heartEnd','push','leaves'],['Bb','hingeEnd','push',null,'answerFast'],['Dm','rest','turn'],
      ['Gm','doubt','push'],['Em7b5','doubtEnd','push'],['A7','last','push','wind','interject'],['A7','waitEnd','rise','gust'],
      // 49–56: Shared rhythm, staggered entries; the gait keeps its little syncopation.
      ['Dm','together','push','leaves','under'],['F','togetherEnd','push',null,'underEnd'],['Bb','knockEnd','walk',null,'answerFast'],['A7','last','hitch',null,'interject'],
      ['F','chordF','walk',null,'heart'],['C','rest','walk','wind','heartEnd'],['Bb','rest','push',null,'answer'],['Dm','home','rise','gust'],
      // 57–64: A companionable argument trails off while the footsteps keep going.
      ['Dm','knock','walk'],['Bb','knockEnd','walk',null,'tail'],['Gm','doubt','walk','leaves'],['A7','rest','walk',null,'waitEnd'],
      ['Dm','rest','light',null,'home'],['Bb','hingeEnd','light',null,'homeEnd'],['Gm','doubt','walk'],['A7','last','walk',null,'pickup'],
    ],
  };
  const AURORA={
    id:'revontulivirta',title:'Revontulivirta',bpm:116,
    tone:{duty:.32,triangle:.6,arpGain:.043,replyColor:.7,replyDecay:.3,replyGain:.095},
    chords:{Am:[45,57,60,64],D:[38,54,57,62],G:[43,55,59,62],C:[36,55,60,64],
      Em:[40,55,59,64],F:[41,53,57,60],E7:[40,56,59,62]},
    phrases:{
      rest:'. . . . . . . . . . . . . . . .',
      river:'A4 - - E5 C5 - - . B4 - A4 - . . . .',
      riverEnd:'F#4 - - A4 D5 - - . E5 - F#5 - . . . .',
      riverMore:'C5 - E5 - A5 - - - G5 - E5 - . . . .',
      riverAlt:'A4 - - E5 C5 - B4 - G4 - A4 - . . . .',
      lateSky:'. . . . . . . . . . E5 - G5 - A5 -',
      answerShort:'E5 - G5 - A5 - - . . . . . . . . .',
      thread:'A4 - - - - - . . E4 - - - . . . .',
      threadC:'G4 - - - - - . . C5 - - - . . . .',
      shore:'. . . . G#4 - B4 - E5 - D5 - B4 - . .',
      sky:'. . E5 - G5 - - . A5 - G5 - E5 - . .',
      skyEnd:'. . D5 - F#5 - - . A5 - F#5 - D5 - . .',
      uphill:'B4 - D5 - G5 - - . F#5 - E5 - D5 - . .',
      uphillEnd:'E5 - G5 - E5 - - . D5 - C5 - . . . .',
      fallen:'. . C5 - E5 - - . G5 - E5 - C5 - . .',
      fallenEnd:'. . B4 - E5 - - . G5 - F#5 - E5 - . .',
      look:'A5 - - G5 E5 - C5 - B4 - A4 - . . . .',
      lookEnd:'A5 - - F#5 D5 - E5 - F#5 - A5 - . . . .',
      laugh:'E5 - A5 - G5 E5 . . C5 - E5 - A5 - . .',
      laughEnd:'D5 - F#5 - A5 F#5 . . E5 - D5 - . . . .',
      ice:'A4 - C5 - B4 - - . A4 - G4 - . . . .',
      iceEnd:'G#4 - B4 - E5 - - . D5 - B4 - . . . .',
      listen:'E5 - - . . . . . . . . . . . . .',
      pickup:'. . . . . . . . . . . . A4 - C5 E5',
      bank:'C5 - E5 - G5 - E5 - D5 - C5 - . . . .',
      bankEnd:'B4 - G#4 - E4 - - . G#4 - B4 - E5 - . .',
      light:'A5 - - E5 C6 - - . B5 - A5 - E5 - . .',
      lightEnd:'A5 - - F#5 D6 - - . C6 - A5 - F#5 - . .',
      carry:'C5 - E5 - A5 - - . G5 - E5 - C5 - . .',
      carryEnd:'B4 - D5 - G5 - - . F#5 - D5 - B4 - . .',
      together:'A5 - - E5 C5 - - . . . . . E5 - - .',
      togetherEnd:'F#5 - - A5 D5 - - . . . . . F#5 - - .',
      under:'. . . . . . . . A4 - C5 - E5 - A5 .',
      underEnd:'. . . . . . . . D4 - F#4 - A4 - D5 .',
      home:'A5 - - - E5 - C5 - A4 - - - . . . .',
      homeEnd:'. . E5 - C5 - A4 - . . G4 - A4 - . .',
    },
    arps:{
      leaves:{pattern:'x - - . . . . . . . x - - . . .',gain:.3},
      wind:{pattern:'. . x - - - . . . . x - - - . .',gain:.44},
      gust:{pattern:'x - - - - - . . x - - - - - . .',gain:.76,octave:12},
    },
    bass:{
      walk:[0,'-','-','.',7,'-','-','.',12,'-','-','.',7,'-','-','.'],
      climb:[0,'-','-',7,12,'-','-','.',7,'-','-',12,0,'-',7,'.'],
      breath:[0,'-','.','.',7,'-','.','.','.','.','.','.','.','.',7,'.'],
      turn:[0,'-',3,7,12,'-',10,7,5,'-',7,10,12,'-',7,'.'],
      pedal:[0,'-','-','-','-','-','-','-','-','-','-','-','-','-','-','.'],
    },
    grooves:{
      light:{bass:'walk',kick:[0,8],snare:[12],hat:[4,6,12,14],level:.57},
      walk:{bass:'walk',kick:[0,8],snare:[8],hat:[2,4,6,10,12,14],level:.76},
      push:{bass:'climb',kick:[0,8,10],snare:[4,12],hat:[0,2,4,6,8,10,12,14],level:.9},
      rise:{bass:'climb',kick:[0,8,14],snare:[4,12,15],hat:[0,2,4,6,8,10,12,14],level:1},
      breath:{bass:'breath',kick:[0,4,14],snare:[],hat:[14],level:.5},
      turn:{bass:'turn',kick:[0,8],snare:[8],hat:[4,12],level:.8},
      float:{bass:'pedal',kick:[0,8],snare:[],hat:[4,12],level:.72},
      skip:{bass:'walk',kick:[0,10],snare:[8],hat:[2,6,11,14],level:.85},
    },
    order:[
      // 1–8: Two walkers mistake the reflection for a river flowing uphill.
      ['Am','river','light','leaves'],['D','riverEnd','walk'],['G','uphill','walk',null,'lateSky'],['D','skyEnd','walk'],
      ['G','rest','walk',null,'sky'],['C','threadC','walk','wind','fallen'],['C','rest','walk',null,'fallen'],['Em','rest','turn'],
      // 9–16: A practical warning gets a mischievous answer in the same rhythm.
      ['Am','river','walk'],['D','riverEnd','walk','leaves'],['Am','riverMore','walk',null,'lateSky'],['D','lookEnd','walk'],
      ['Am','rest','walk',null,'laugh'],['D','rest','walk',null,'laughEnd'],['G','uphill','walk','wind'],['Em','uphillEnd','skip',null,'answerShort'],
      // 17–24: The sky widens; the answer borrows the question's rising sixth.
      ['C','carry','push','leaves'],['D','lookEnd','walk'],['G','carryEnd','walk'],['Em','uphillEnd','walk',null,'answerShort'],
      ['Am','rest','walk',null,'look'],['D','thread','walk','wind','lookEnd'],['C','threadC','float',null,'fallen'],['Em','rest','float',null,'fallenEnd'],
      // 25–32: They hear ice. F natural and G sharp briefly darken the walk.
      ['Am','ice','light'],['F','bank','walk','leaves',null],['C','uphillEnd','walk'],['E7','rest','walk',null,'shore'],
      ['Am','rest','walk',null,'ice'],['F','threadC','walk',null,'bank'],['D','lookEnd','walk','wind'],['E7','iceEnd','walk',null,'shore'],
      // 33–40: Listen, then take the bank. Only half a bar really stands still.
      ['Am','ice','light'],['F','bank','light'],['E7','rest','light',null,'listen'],['E7','rest','breath',null,'pickup'],
      ['Am','rest','walk',null,'river'],['D','rest','walk','leaves','riverEnd'],['G','threadC','walk',null,'uphill'],['Em','rest','walk',null,'fallenEnd'],
      // 41–48: A longer pulse arc returns higher; the bass answers under its last turn.
      ['Am','look','push','leaves'],['D','lookEnd','push'],['G','carryEnd','push'],['Em','fallenEnd','walk',null,'answerShort'],
      ['Am','light','turn'],['D','lightEnd','push','wind'],['C','carry','push',null,'threadC'],['Em','rest','rise','gust','fallenEnd'],
      // 49–56: The river and sky motifs interlock, with footsteps under both.
      ['Am','together','push','leaves','under'],['D','togetherEnd','walk',null,'underEnd'],['G','threadC','walk',null,'uphill'],['Em','rest','walk',null,'fallenEnd'],
      ['Am','light','push'],['D','lightEnd','push','wind'],['C','carry','push'],['Em','carryEnd','skip','gust',null],
      // 57–64: They take the rhythm home. The unresolved fifth invites another walk.
      ['Am','river','walk'],['D','riverEnd','walk'],['G','uphill','walk','leaves',null],['Em','rest','walk',null,'fallenEnd'],
      ['Am','riverAlt','light'],['D','rest','light',null,'homeEnd'],['G','uphill','walk',null,'lateSky'],['Em','uphillEnd','walk'],
    ],
  };
  const SONGS=[SONG,COPPER,AURORA],REPEATS=3,ARP_HZ=50;
  class Tracker {
    constructor(rate,song=SONGS[0]){
      this.rate=rate;this.song=song;this.rowLength=rate*60/(song.bpm*4);this.smooth=1-Math.exp(-1/(rate*.02));
      this.tone={duty:.26,triangle:0,arpHz:ARP_HZ,arpGain:.05,replyColor:1,replyDecay:.23,replyGain:.13,...song.tone};
      this.arpHz=null;this.arpSolo=false;
      this.echo=new Float32Array(Math.round(this.rowLength*3));
      this.notes=Object.fromEntries(Object.entries(song.phrases).map(([name,phrase])=>[name,phrase.split(' ').map(Tracker.note)]));
      this.arps=Object.fromEntries(Object.entries(song.arps).map(([name,part])=>[name,{...part,rows:part.pattern.split(' ')}]));
      this.progression=song.order.map(([chord,phrase,style,arp,reply])=>({chord:song.chords[chord],notes:this.notes[phrase],style,
        groove:song.grooves[style],arp:this.arps[arp],reply:this.notes[reply]}));
      this.frequencies=Array.from({length:128},(_,note)=>440*Math.pow(2,(note-69)/12));this.reset();
    }
    reset(){
      this.remaining=0;this.row=-1;this.frames=0;this.loops=0;this.bar=null;
      this.playing=false;this.level=0;this.gain=0;this.seed=73129;
      this.lead=null;this.reply=null;this.bass=null;this.arpPhase=0;this.arpAge=0;this.arpFrequency=0;this.arpIndex=-1;
      this.arpTarget=0;this.arpLevel=0;
      this.arpOffset=0;this.arpBaseFrame=0;this.soloMix=Number(this.arpSolo);
      this.kickAge=1;this.kickPhase=0;this.snareAge=1;this.snarePhase=0;this.hatAge=1;this.hatLength=.035;this.lastNoise=0;
      this.kickGain=0;this.snareGain=0;this.hatGain=0;
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
    voice(note,rows,kind,velocity=1){return {frequency:this.frequencies[note],age:0,phase:0,gate:rows*this.rowLength/this.rate*.88,kind,velocity};}
    advance(){
      this.row++;if(this.row===this.progression.length*16){this.row=0;this.loops++;}
      const step=this.row%16,bar=this.progression[this.row>>4],groove=bar.groove;
      this.bar=bar;
      // Both characters read the same phrase book, so a motif can change speaker.
      for(const kind of ['lead','reply']){
        const notes=kind==='lead'?bar.notes:bar.reply,note=notes?.[step];
        if(typeof note==='number'){
          let rows=1;while(step+rows<16&&notes[step+rows]==='-')rows++;
          this[kind]=this.voice(note,rows,kind,groove.level*(step%4===0?1:.84));
        }
      }
      const pattern=this.song.bass[groove.bass],bass=pattern[step];
      if(typeof bass==='number'){
        let rows=1;while(step+rows<16&&pattern[step+rows]==='-')rows++;
        this.bass=this.voice(bar.chord[0]+bass,rows,'bass',groove.level*(step%4===0?1:.72));
      }
      const arp=bar.arp?.rows[step]??'.';
      if(arp==='x'){this.arpAge=0;this.arpTarget=bar.arp.gain;}
      else if(arp==='.')this.arpTarget=0;
      if(step===0)this.arpIndex=-1; // Refresh the chord without restarting the pitch-effect clock.
      const accent=groove.level*(step%4===0?1:.7);
      if(groove.kick.includes(step)){this.kickAge=0;this.kickPhase=0;this.kickGain=accent;}
      if(groove.snare.includes(step)){this.snareAge=0;this.snarePhase=0;this.snareGain=accent;}
      if(groove.hat.includes(step)){this.hatAge=0;this.hatLength=step===14?.06:.025;this.hatGain=accent*.8;}
    }
    pitched(v,dt){
      if(!v||v.age>v.gate+.035)return 0;
      const lead=v.kind==='lead',vibrato=lead&&v.age>.12?1+.0035*Math.sin(v.age*2*Math.PI*6):1;
      v.phase=(v.phase+v.frequency*vibrato*dt)%1;
      if(v.kind==='reply'){
        // Coarse oscillator phase and a driven carrier give the pluck some chip grit.
        // Retain a little 2:1 FM in the tail; this voice still joins the shared cabinet.
        const phase=Math.floor(v.phase*64)/64*2*Math.PI,brightness=this.tone.replyColor*(.25+.75*Math.exp(-v.age*18));
        const carrier=Math.sin(phase+brightness*Math.sin(phase*2))+.12*Math.sin(phase*3)*Math.exp(-v.age*25);
        const wave=Math.tanh(carrier*2.4)*.8;
        const env=Math.min(1,v.age/.003)*Math.exp(-v.age/this.tone.replyDecay)*Math.min(1,Math.max(0,(v.gate+.035-v.age)/.035));
        if(this.playing)v.age+=dt;
        return wave*env*this.tone.replyGain*v.velocity;
      }
      const duty=lead?this.tone.duty+.035*Math.sin(v.age*17):.34;
      const pulse=v.phase<duty?1:-duty/(1-duty),triangle=1-4*Math.abs(v.phase-.5);
      const env=Math.min(1,v.age/.003)*Math.min(1,Math.max(0,(v.gate+.035-v.age)/.035))*(.58+.42*Math.exp(-v.age*18));
      if(this.playing)v.age+=dt;
      return (lead?pulse*(1-this.tone.triangle)+triangle*this.tone.triangle:pulse*.7+triangle*.3)*env*(lead?.16:.18)*v.velocity;
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
      const dt=1/this.rate;
      const lead=this.pitched(this.lead,dt),reply=this.pitched(this.reply,dt),bass=this.pitched(this.bass,dt);
      const echo=this.echo[this.echoIndex];
      if(this.playing){this.echo[this.echoIndex]=lead*.7+reply*.35+echo*.18;this.echoIndex=(this.echoIndex+1)%this.echo.length;}
      const arp=this.arpeggio(dt);
      let n=this.seed;n^=n<<13;n^=n>>>17;n^=n<<5;this.seed=n;const noise=(n>>>0)/2147483648-1;
      this.kickPhase=(this.kickPhase+(48+125*Math.exp(-this.kickAge*48))*dt)%1;
      this.snarePhase=(this.snarePhase+185*dt)%1;
      const kick=this.kickAge<.18?(Math.sin(this.kickPhase*Math.PI*2)*.8+noise*.2*Math.exp(-this.kickAge*160))*Math.exp(-this.kickAge*25)*.32*this.kickGain:0;
      const snare=this.snareAge<.16?(noise*.75+Math.sin(this.snarePhase*Math.PI*2)*.25)*Math.exp(-this.snareAge*24)*.16*this.snareGain:0;
      const hat=this.hatAge<this.hatLength?(noise-this.lastNoise)*Math.exp(-this.hatAge/this.hatLength*5)*.043*this.hatGain:0;this.lastNoise=noise;
      if(this.playing){this.arpAge+=dt;this.kickAge+=dt;this.snareAge+=dt;this.hatAge+=dt;}
      const mix=lead+reply+bass+arp+echo*.2+kick+snare+hat;
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
