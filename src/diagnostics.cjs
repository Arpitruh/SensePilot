// Keep diagnostic events free of meeting content, filenames and prompts.
const events=[];
const allowed=new Set(['startup','summary-failed','file-failed','renderer-exit','load-failed','cancelled']);
function record(event){if(!allowed.has(event))return;events.push({event,time:new Date().toISOString()});if(events.length>100)events.shift();}
function snapshot(){return events.map(e=>({...e}));}
module.exports={record,snapshot};
