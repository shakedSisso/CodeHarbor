const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getCurrentLocationFiles: (files) => ipcRenderer.on('get-files',files),
  getFiles: () => ipcRenderer.invoke('dialog:getFiles',),
  getFilesAndRun: (exeName, fileNames) => ipcRenderer.invoke('dialog:getFilesAndRun', exeName, fileNames)
});