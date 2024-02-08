const { ipcRenderer, remote, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    share: (objectName, shareCode, isFolder) => ipcRenderer.invoke('dialog:createShare', objectName, shareCode, isFolder),
  })
  