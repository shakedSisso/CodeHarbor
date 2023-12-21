const { ipcRenderer, remote, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    createNewFile: (fileName) => ipcRenderer.invoke('dialog:createFile', fileName),
  })
  