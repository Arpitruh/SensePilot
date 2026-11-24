const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const path=require('node:path');
const {stat}=require('node:fs/promises');
const run=promisify(execFile);
async function transcribe(file){
 const info=await stat(file);
 if(!info.isFile()||info.size>100*1024*1024) throw Error('Choose an audio file under 100 MiB.');
 const python=process.platform==='win32'?'python':'python3';
 const {stdout}=await run(python,[path.join(process.resourcesPath && __dirname.includes('app.asar') ? process.resourcesPath : path.join(__dirname,'..'),'scripts','transcribe.py'),file,'--consent'],{timeout:600000,maxBuffer:8*1024*1024,windowsHide:true});
 const data=JSON.parse(stdout);
 if(!Array.isArray(data.segments))throw Error('Invalid transcription result');
 return data.segments.map(s=> '['+Number(s.start).toFixed(1)+'s] '+String(s.text)).join('\n');
}
module.exports={transcribe};
