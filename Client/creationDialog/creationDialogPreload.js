const { ipcRenderer, remote, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    create: (fileName, isFolder) => ipcRenderer.invoke('dialog:create', fileName, isFolder),
  })
  