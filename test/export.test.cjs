const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mkdtempSync,readFileSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join,resolve}=require('node:path');
const {execFileSync}=require('node:child_process');
const {Script}=require('node:vm');

test('Normal and audio-debug exports are standalone; only the debug build enables and includes the listening panel',()=>{
  const dir=mkdtempSync(join(tmpdir(),'vibelentely-export-'));
  try{
    for(const debug of [false,true]){
      const file=join(dir,debug?'debug.html':'game.html');
      execFileSync(process.execPath,[resolve(__dirname,'../scripts/export-html.mjs'),...(debug?['--debug']:[]),file]);
      const html=readFileSync(file,'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
      assert.equal(scripts.length,1);new Script(scripts[0][1]);assert.ok(!/<script[^>]+src=/.test(html));
      assert.equal(html.includes('id="debug-arp-rate"'),debug);assert.equal(html.includes('globalThis.CAVE_AUDIO_DEBUG=true;'),debug);
      for(const title of ['Basalttiyö','Kuparisydän','Revontulivirta'])assert.ok(html.includes(title));
      if(debug){
        assert.ok(scripts[0][1].indexOf('CAVE_AUDIO_DEBUG=true')<scripts[0][1].indexOf('class Sound'));
        assert.ok(scripts[0][1].indexOf("const audio=window.vibelentely.audio")>scripts[0][1].indexOf('window.vibelentely=window.luolalabra='));
      }
    }
  }finally{rmSync(dir,{recursive:true,force:true});}
});
