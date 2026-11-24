const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('sensePilot',{processFile:(kind,consent)=>ipcRenderer.invoke('files:process',{kind,consent}),summarize:(notes,consent)=>ipcRenderer.invoke('notes:summarize',{notes,consent})});
