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

const runtimeCheck=el('runtime-check'),runtimeStatus=el('runtime-status'),runtimeResults=el('runtime-results');
let runtimeBusy=false;
async function checkRuntime(){
 if(runtimeBusy)return;
 runtimeBusy=true;runtimeCheck.disabled=true;runtimeStatus.textContent='Checking local dependencies…';runtimeResults.replaceChildren();
 try{const state=await window.sensePilot.checkRuntime();const fields=[['python','Python'],['whisper','Faster Whisper'],['ollama','Ollama'],['textModel','Qwen 2.5 3B'],['visionModel','Gemma 3 4B']];
 for(const [key,label] of fields){const item=document.createElement('li');item.textContent=label+': '+(state[key]===true?'Ready':'Not detected');runtimeResults.append(item);}
 runtimeStatus.textContent=fields.every(([key])=>state[key]===true)?'All dependency checks passed.':'Some dependencies need setup. See installation instructions below.';
 }catch{runtimeStatus.textContent='Dependency check failed. Try again.';}finally{runtimeBusy=false;runtimeCheck.disabled=false;}
}
runtimeCheck.addEventListener('click',checkRuntime);checkRuntime();

const exportsConfig=[['summary',result,el('export-summary'),el('export-summary-status')],['analysis',fileResult,el('export-analysis'),el('export-analysis-status')]];
for(const [kind,output,button,message] of exportsConfig){let exporting=false;const update=()=>{button.disabled=exporting||!output.textContent.trim()||(kind==='summary'&&output.textContent==='Your summary will appear here.');};new MutationObserver(update).observe(output,{childList:true,characterData:true,subtree:true});button.addEventListener('click',async()=>{exporting=true;update();message.textContent='Choose where to save…';try{message.textContent=await window.sensePilot.exportText(kind,output.textContent)?'File saved.':'Export cancelled.';}catch{message.textContent='Unable to save file.';}finally{exporting=false;update();}});update();}
const theme=el('theme-toggle');theme.addEventListener('click',()=>{const light=document.body.classList.toggle('light');theme.textContent=light?'Dark theme':'Light theme';theme.setAttribute('aria-pressed',String(light));});

// Workspace preferences and explicitly saved results only.
const store={get(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}};
const initialLight=store.get('sp-theme',false)===true;if(initialLight&&!document.body.classList.contains('light'))theme.click();theme.addEventListener('click',()=>store.set('sp-theme',document.body.classList.contains('light')));
const navItems=el('nav-items'),navToggle=el('nav-toggle');navToggle.addEventListener('click',()=>{navItems.hidden=!navItems.hidden;navToggle.setAttribute('aria-expanded',String(!navItems.hidden));navToggle.textContent=navItems.hidden?'Expand navigation':'Collapse navigation';});
function showPage(page){for(const section of document.querySelectorAll('main > section'))section.hidden=(section.dataset.view||'dashboard')!==page;for(const button of document.querySelectorAll('[data-page]')){if(button.dataset.page===page)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}}
for(const button of document.querySelectorAll('[data-page]'))button.addEventListener('click',()=>showPage(button.dataset.page));showPage('dashboard');
const historyEnabled=el('history-enabled'),historyList=el('history-list'),historyStatus=el('history-status');historyEnabled.checked=store.get('sp-history-enabled',false)===true;
let records=store.get('sp-history',[]);if(!Array.isArray(records))records=[];records=records.filter(x=>x&&typeof x.id==='string'&&typeof x.text==='string'&&['summary','analysis'].includes(x.kind));
function renderHistory(){historyList.replaceChildren();const q=el('history-search').value.toLowerCase(),filter=el('history-filter').value;for(const item of records.filter(x=>(filter==='all'||x.kind===filter)&&x.text.toLowerCase().includes(q))){const card=document.createElement('article'),heading=document.createElement('h4'),content=document.createElement('pre'),remove=document.createElement('button');heading.textContent=item.kind+' · '+new Date(item.date).toLocaleString();content.textContent=item.text;remove.textContent='Delete';remove.addEventListener('click',()=>{const next=records.filter(x=>x.id!==item.id);if(store.set('sp-history',next)){records=next;renderHistory();}else historyStatus.textContent='Could not delete saved result.';});card.append(heading,content,remove);historyList.append(card);}if(!historyList.children.length)historyList.textContent='No matching saved results.';}
function clearHistory(){if(!store.set('sp-history',[])){historyStatus.textContent='Could not delete history.';return false;}records=[];renderHistory();historyStatus.textContent='History cleared.';return true;}
historyEnabled.addEventListener('change',()=>{if(!historyEnabled.checked&&!clearHistory()){historyEnabled.checked=true;return;}if(!store.set('sp-history-enabled',historyEnabled.checked))historyEnabled.checked=store.get('sp-history-enabled',false)===true;for(const fn of saveUpdates)fn();});
el('history-search').addEventListener('input',renderHistory);el('history-filter').addEventListener('change',renderHistory);el('history-clear').addEventListener('click',()=>{if(window.confirm('Delete all saved results?'))clearHistory();});
const saveUpdates=[];for(const [kind,output,id] of [['summary',result,'save-summary'],['analysis',fileResult,'save-analysis']]){const button=el(id);const update=()=>{button.disabled=!historyEnabled.checked||!output.textContent.trim()||output.textContent==='Your summary will appear here.';};saveUpdates.push(update);new MutationObserver(update).observe(output,{childList:true,characterData:true,subtree:true});button.addEventListener('click',()=>{if(button.disabled)return;const text=output.textContent;if(text.length>100000){historyStatus.textContent='Result too large for history; export it instead.';return;}const next=[{id:crypto.randomUUID(),kind,text,date:new Date().toISOString()},...records].slice(0,30);if(store.set('sp-history',next)){records=next;renderHistory();historyStatus.textContent='Result saved locally.';showPage('history');}else historyStatus.textContent='Could not save history; storage may be full.';});update();}renderHistory();
