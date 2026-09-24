import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
let html=await readFile(new URL('dist/index.html',root),'utf8');
const css=await readFile(new URL('dist/style.css',root),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+css+'\n</style>');
const scripts=[];
for(const name of ['simulation','levels','flight','ai','combat','match','render','app']) {
  html=html.replace(`  <script defer src="${name}.js"></script>\n`,'');
  scripts.push(await readFile(new URL(`dist/${name}.js`,root),'utf8'));
}
html=html.replace('</body>','<script>\n'+scripts.join('\n')+'\n</script>\n</body>');
const destination=process.argv[2]||fileURLToPath(new URL('vibelentely.html',root));
await writeFile(destination,html);console.log(destination);
