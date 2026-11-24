const {app,BrowserWindow,ipcMain,dialog}=require('electron');
const path=require('node:path');
let win;
let busy=false;
let active=null;
const diagnostics=require('./diagnostics.cjs');
function createWindow(){
  win=new BrowserWindow({width:880,height:740,minWidth:420,minHeight:480,title:'SensePilot',backgroundColor:'#10151e',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  diagnostics.record('startup');
  const window=win;
  window.webContents.on('render-process-gone',()=>{diagnostics.record('renderer-exit');active?.abort();if(!window.isDestroyed())dialog.showMessageBox(window,{type:'error',message:'The workspace stopped unexpectedly.',detail:'Unsaved work may be lost. Restart SensePilot to reopen the workspace.'}).catch(()=>{});});
  window.on('closed',()=>{active?.abort();if(win===window)win=null;});
  win.loadFile(path.join(__dirname,'ui','index.html')).catch(()=>diagnostics.record('load-failed'));
}
ipcMain.handle('notes:summarize',async(event,payload)=>{
  if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Unauthorized sender');
  if(busy)throw Error('A summary is already running');
  if(payload?.consent!==true)throw Error('Participant consent required');
  busy=true;
  const controller=new AbortController();active=controller;
  try{const {summarizeNotes}=await import('./core.js');return await summarizeNotes(payload.notes,{consent:true,signal:controller.signal});}
  catch(error){diagnostics.record(controller.signal.aborted?'cancelled':'summary-failed');throw Error(controller.signal.aborted?'Cancelled':'Summary failed');}
  finally{busy=false;active=null;}
});
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

ipcMain.handle('files:process',async(event,payload)=>{
 if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Unauthorized sender');
 if(payload?.consent!==true)throw Error('Permission required');
 if(!['audio','image'].includes(payload.kind))throw Error('Invalid file type');
 if(busy)throw Error('Another task is running');
 busy=true;
 const controller=new AbortController();active=controller;
 try{
 const audio=payload.kind==='audio';
 const selection=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:audio?'Audio':'Images',extensions:audio?['wav','mp3','m4a','flac','ogg']:['png','jpg','jpeg']}]});
 if(selection.canceled||controller.signal.aborted)return null;
 const file=selection.filePaths[0];
 if(audio)return await require('./file-processing.cjs').transcribe(file,{signal:controller.signal});
 const {analyzeImage}=await import('./image-analysis.js');
 return await analyzeImage(file,{consent:true,signal:controller.signal});
 }catch(error){diagnostics.record(controller.signal.aborted?'cancelled':'file-failed');throw Error(controller.signal.aborted?'Cancelled':'File processing failed');}finally{busy=false;active=null;}
});

let healthPending=null;
ipcMain.handle('runtime:check',async(event)=>{
 if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Unauthorized sender');
 if(!healthPending)healthPending=require('./health.cjs').checkRuntime().finally(()=>{healthPending=null;});
 return await healthPending;
});

let saving=false;
ipcMain.handle('notes:export',async(event,payload)=>{
 if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Unauthorized sender');
 if(typeof payload?.text!=='string'||!payload.text.trim()||Buffer.byteLength(payload.text,'utf8')>8*1024*1024)throw Error('Invalid export');
 const names={summary:'meeting-summary',analysis:'file-analysis'};
 if(!Object.hasOwn(names,payload.kind)||saving)throw Error('Invalid or concurrent export');
 saving=true;
 try{const choice=await dialog.showSaveDialog(win,{defaultPath:names[payload.kind]+'.txt',filters:[{name:'Text document',extensions:['txt']}]});if(choice.canceled||!choice.filePath)return false;await require('node:fs/promises').writeFile(choice.filePath,payload.text,{encoding:'utf8'});return true;}finally{saving=false;}
});

ipcMain.handle('task:cancel',event=>{if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Unauthorized sender');if(!active)return false;active.abort();return true;});
ipcMain.handle('runtime:diagnostics',event=>{if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Unauthorized sender');return diagnostics.snapshot();});
