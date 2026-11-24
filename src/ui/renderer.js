const el=id=>document.getElementById(id);
const notes=el('notes'),consent=el('consent'),submit=el('summarize'),clear=el('clear'),status=el('status'),result=el('result');
let busy=false;
function refresh(){el('count').textContent=notes.value.length+' / 24000';submit.disabled=busy||!consent.checked||!notes.value.trim();clear.disabled=busy;notes.disabled=busy;consent.disabled=busy;}
notes.addEventListener('input',refresh);consent.addEventListener('change',refresh);
clear.addEventListener('click',()=>{notes.value='';consent.checked=false;result.textContent='Your summary will appear here.';status.textContent='';refresh();});
submit.addEventListener('click',async()=>{if(busy||!consent.checked)return;busy=true;refresh();status.textContent='Generating summary with local AI…';result.textContent='';try{result.textContent=await window.sensePilot.summarize(notes.value,consent.checked);status.textContent='Summary ready.';}catch{status.textContent='Could not generate summary. Check that Ollama is running and qwen2.5:3b is installed.';}finally{busy=false;refresh();}});
refresh();
const fileConsent=el('file-consent'),audioFile=el('audio-file'),imageFile=el('image-file'),fileStatus=el('file-status'),fileResult=el('file-result');
let fileBusy=false;
function refreshFiles(){audioFile.disabled=imageFile.disabled=fileBusy||!fileConsent.checked;fileConsent.disabled=fileBusy;}
fileConsent.addEventListener('change',refreshFiles);
async function processFile(kind){if(fileBusy||!fileConsent.checked)return;fileBusy=true;refreshFiles();fileStatus.textContent='Choose a file to process locally…';fileResult.textContent='';try{const output=await window.sensePilot.processFile(kind,true);fileStatus.textContent=output===null?'Selection cancelled.':'Processing complete.';if(output!==null)fileResult.textContent=output;}catch{fileStatus.textContent='Processing failed. Check Python, Whisper or Ollama installation and file format.';}finally{fileBusy=false;refreshFiles();}}
audioFile.addEventListener('click',()=>processFile('audio'));imageFile.addEventListener('click',()=>processFile('image'));refreshFiles();
