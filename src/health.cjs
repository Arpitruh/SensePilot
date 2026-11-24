const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
async function checkRuntime(){
 const python=process.platform==='win32'?'python':'python3';
 const probe=async(args)=>{try{await run(python,args,{timeout:8000,windowsHide:true});return true;}catch{return false;}};
 const [pythonReady,whisperReady,models]=await Promise.all([
 probe(['--version']),probe(['-c','import faster_whisper']),
 (async()=>{try{const response=await fetch('http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(5000)});if(!response.ok)return null;const data=await response.json();return Array.isArray(data.models)?data.models.map(m=>m.name):null;}catch{return null;}})()
 ]);
 return {python:pythonReady,whisper:whisperReady,ollama:models!==null,textModel:models?.includes('qwen2.5:3b')??false,visionModel:models?.includes('gemma3:4b')??false};
}
module.exports={checkRuntime};
