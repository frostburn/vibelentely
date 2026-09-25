(function(){
  'use strict';
  if(!globalThis.CAVE_AUDIO_DEBUG)return;
  const audio=window.vibelentely.audio,{SONGS,ARP_HZ}=CaveMusic,$=id=>document.getElementById(id);
  for(const song of SONGS){const option=document.createElement('option');option.value=song.id;option.textContent=song.title;$('debug-track').append(option);}
  function render(){
    const song=SONGS.find(song=>song.id===audio.musicTrack),hz=audio.debug.arpHz??song.tone?.arpHz??ARP_HZ;
    $('debug-track').value=audio.musicTrack;$('debug-solo').checked=audio.debug.arpSolo;$('debug-bypass').checked=audio.debug.bypass;
    $('debug-arp-rate').value=String(hz);$('debug-arp-number').value=String(hz);
    const decimal=n=>n.toFixed(1).replace('.',',');
    $('debug-rate-readout').textContent=hz+' sävelenvaihtoa/s · '+decimal(1000/hz)+' ms per sävel · '+decimal(hz/3)+' sointukiertoa/s'+(audio.debug.arpHz===null?' · biisin oletus':'');
    for(const el of document.querySelectorAll('[data-arp-rate]'))el.setAttribute('aria-pressed',String(Number(el.dataset.arpRate)===hz));
    $('debug-listen').disabled=audio.status==='unsupported';$('debug-pause').disabled=!audio.musicEnabled||audio.status==='unsupported';
  }
  const readout=audio.onchange;audio.onchange=()=>{readout();render();};
  $('debug-track').addEventListener('change',()=>audio.setMusicTrack($('debug-track').value));
  $('debug-solo').addEventListener('change',()=>audio.setDebug({arpSolo:$('debug-solo').checked}));
  $('debug-bypass').addEventListener('change',()=>audio.setDebug({bypass:$('debug-bypass').checked}));
  function rate(value){const hz=Number.parseFloat(value);if(Number.isFinite(hz))audio.setDebug({arpHz:hz});}
  for(const id of ['debug-arp-rate','debug-arp-number']){
    $(id).addEventListener('input',()=>rate($(id).value));$(id).addEventListener('change',render);
  }
  for(const el of document.querySelectorAll('[data-arp-rate]'))el.addEventListener('click',()=>rate(el.dataset.arpRate));
  $('debug-arp-default').addEventListener('click',()=>audio.setDebug({arpHz:null}));
  $('debug-pause').addEventListener('click',()=>{if(audio.musicEnabled)audio.toggleMusic();});
  $('debug-listen').addEventListener('click',()=>{
    if(!audio.musicEnabled)audio.toggleMusic();if(audio.muted)audio.toggleMute();
    if(!audio.volume)audio.setVolume(40);if(!audio.musicVolume)audio.setMusicVolume(45);
    audio.setMusicActive(true);audio.unlock();
  });
  render();
})();
