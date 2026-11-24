const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('sensePilot',{exportText:(kind,text)=>ipcRenderer.invoke('notes:export',{kind,text}),checkRuntime:()=>ipcRenderer.invoke('runtime:check'),processFile:(kind,consent)=>ipcRenderer.invoke('files:process',{kind,consent}),summarize:(notes,consent)=>ipcRenderer.invoke('notes:summarize',{notes,consent})});
