const {app,BrowserWindow,ipcMain,dialog}=require('electron');
const path=require('node:path');
let win;
let busy=false;
function createWindow(){
  win=new BrowserWindow({width:880,height:740,minWidth:420,minHeight:480,title:'SensePilot',backgroundColor:'#10151e',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  win.loadFile(path.join(__dirname,'ui','index.html'));
}
ipcMain.handle('notes:summarize',async(event,payload)=>{
  if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Unauthorized sender');
  if(busy)throw Error('A summary is already running');
  if(payload?.consent!==true)throw Error('Participant consent required');
  busy=true;
  try{const {summarizeNotes}=await import('./core.js');return await summarizeNotes(payload.notes,{consent:true});}
  finally{busy=false;}
});
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

ipcMain.handle('files:process',async(event,payload)=>{
 if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Unauthorized sender');
 if(payload?.consent!==true)throw Error('Permission required');
 if(!['audio','image'].includes(payload.kind))throw Error('Invalid file type');
 if(busy)throw Error('Another task is running');
 busy=true;
 try{
 const audio=payload.kind==='audio';
 const selection=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:audio?'Audio':'Images',extensions:audio?['wav','mp3','m4a','flac','ogg']:['png','jpg','jpeg']}]});
 if(selection.canceled)return null;
 const file=selection.filePaths[0];
 if(audio)return await require('./file-processing.cjs').transcribe(file);
 const {analyzeImage}=await import('./image-analysis.js');
 return await analyzeImage(file,{consent:true});
 }finally{busy=false;}
});

let healthPending=null;
ipcMain.handle('runtime:check',async(event)=>{
 if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Unauthorized sender');
 if(!healthPending)healthPending=require('./health.cjs').checkRuntime().finally(()=>{healthPending=null;});
 return await healthPending;
});
