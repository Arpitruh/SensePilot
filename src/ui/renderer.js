const el=id=>document.getElementById(id);
const notes=el('notes'),consent=el('consent'),submit=el('summarize'),clear=el('clear'),status=el('status'),result=el('result');
let busy=false;
function refresh(){el('count').textContent=notes.value.length+' / 24000';submit.disabled=busy||!consent.checked||!notes.value.trim();clear.disabled=busy;notes.disabled=busy;consent.disabled=busy;}
notes.addEventListener('input',refresh);consent.addEventListener('change',refresh);
clear.addEventListener('click',()=>{notes.value='';consent.checked=false;result.textContent='Your summary will appear here.';status.textContent='';refresh();});
submit.addEventListener('click',async()=>{if(busy||!consent.checked)return;busy=true;refresh();status.textContent='Generating summary with local AI…';result.textContent='';try{result.textContent=await window.sensePilot.summarize(notes.value,consent.checked);status.textContent='Summary ready.';}catch{status.textContent='Could not generate summary. Check that Ollama is running and qwen2.5:3b is installed.';}finally{busy=false;refresh();}});
refresh();