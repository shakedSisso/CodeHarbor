const { ipcRenderer, remote, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  setMenu: (menu) => { ipcRenderer.send('set-menu-editFile', menu); },
});

contextBridge.exposeInMainWorld('electronAPI', {
  getFile: () => ipcRenderer.invoke('dialog:getFile',),
  sendChanges: (changes, lineCount) => ipcRenderer.invoke('dialog:sendChanges', changes, lineCount),
  getContentFile: (callback) => ipcRenderer.on('file-content', callback),
  getFileUpdates: (updates) => ipcRenderer.on('file-updates', updates),
})
