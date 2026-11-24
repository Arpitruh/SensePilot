const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('sensePilot',{summarize:(notes,consent)=>ipcRenderer.invoke('notes:summarize',{notes,consent})});
