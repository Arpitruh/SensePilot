const test=require('node:test');
const assert=require('node:assert/strict');
const {transcribe}=require('../src/file-processing.cjs');
const {mkdtemp,rm}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
test('rejects a directory before launching Python',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sensepilot-'));
 try{await assert.rejects(transcribe(dir),/Choose an audio file/);}
 finally{await rm(dir,{recursive:true,force:true});}
});
test('rejects missing audio before launching Python',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sensepilot-'));
 try{await assert.rejects(transcribe(join(dir,'missing.wav')), {code:'ENOENT'});}
 finally{await rm(dir,{recursive:true,force:true});}
});
