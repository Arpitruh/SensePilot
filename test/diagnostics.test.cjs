const test=require('node:test');
const assert=require('node:assert/strict');
const {record,snapshot}=require('../src/diagnostics.cjs');
test('diagnostics only retain known events and cap history',()=>{record('private content');for(let i=0;i<105;i++)record('startup');assert.equal(snapshot().length,100);assert.ok(snapshot().every(e=>e.event==='startup'));const copy=snapshot();copy[0].event='changed';assert.equal(snapshot()[0].event,'startup');});
