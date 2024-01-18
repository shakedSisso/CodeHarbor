const { ipcRenderer, remote, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  setMenu: (menu) => { ipcRenderer.send('set-menu-fileViewing', menu); },
});

contextBridge.exposeInMainWorld('electronAPI', {
  resetLocation: () => ipcRenderer.invoke('dialog:resetLocation'),
  getFilesAndFolders: (location) => ipcRenderer.invoke('dialog:getFilesAndFolders', location),
  showFilesAndFolders: (foldersAndFolders) => ipcRenderer.on('show-files-and-folders', foldersAndFolders),
  getUsername: (callback) => ipcRenderer.on('send-username', callback),
  switchToEditFile: (file_name) => ipcRenderer.invoke('dialog:switchToEditFile', file_name),
});

