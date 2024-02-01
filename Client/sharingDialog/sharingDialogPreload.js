const { ipcRenderer, remote, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    share: (objectName, shareCode, isFolder) => ipcRenderer.invoke('dialog:create', objectName, shareCode, isFolder),
  })
  