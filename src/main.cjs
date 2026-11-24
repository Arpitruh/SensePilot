const {app,BrowserWindow,ipcMain}=require('electron');
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
