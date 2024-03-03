const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getCurrentFileShares: (users) => ipcRenderer.on('get-file-shares',users),
  getFileSharesNames: () => ipcRenderer.invoke('dialog:getFileSharesNames',),
  removeShares: (users) => ipcRenderer.invoke('dialog:removeShares', users)
});