import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const args=process.argv.slice(2),debug=args.includes('--debug');
let html=await readFile(new URL('dist/index.html',root),'utf8');
const css=await readFile(new URL('dist/style.css',root),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+css+'\n</style>');
const scripts=debug?['globalThis.CAVE_AUDIO_DEBUG=true;']:[];
for(const name of ['simulation','levels','flight','ai','tools','combat','match','solo','render','music','audio-dsp','audio','app']) {
  html=html.replace(`  <script defer src="${name}.js"></script>\n`,'');
  scripts.push(await readFile(new URL(`dist/${name}.js`,root),'utf8'));
}
if(debug){
  html=html.replace('<body>','<body>\n'+await readFile(new URL('debug/audio.html',root),'utf8'));
  html=html.replace('<title>Vibelentely — luolalennokki</title>','<title>Vibelentely — Arppilabra (debug)</title>');
  scripts.push(await readFile(new URL('debug/audio.js',root),'utf8'));
}
html=html.replace('</body>','<script>\n'+scripts.join('\n')+'\n</script>\n</body>');
const destination=args.find(arg=>arg!=='--debug')||fileURLToPath(new URL(debug?'vibelentely-debug.html':'vibelentely.html',root));
await writeFile(destination,html);console.log(destination);
