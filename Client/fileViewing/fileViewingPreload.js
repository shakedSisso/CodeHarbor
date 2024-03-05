const { ipcRenderer, remote, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  requestUsername: () =>ipcRenderer.invoke('dialog:requestUsername'),
  resetLocation: () => ipcRenderer.invoke('dialog:resetLocation'),
  checkLocation: () => ipcRenderer.invoke('dialog:checkLocation'),
  setMenu: (mainFolderName) => ipcRenderer.invoke('dialog:setMenu', mainFolderName),
  showMenu: () => ipcRenderer.invoke('dialog:showMenu'),
  getFilesAndFolders: (location) => ipcRenderer.invoke('dialog:getFilesAndFolders', location),
  showFilesAndFolders: (foldersAndFolders) => ipcRenderer.on('show-files-and-folders', foldersAndFolders),
  getUsername: (callback) => ipcRenderer.on('send-username', callback),
  getLocation: (callback) => ipcRenderer.on('send-location', callback),
  switchToEditFile: (file_name) => ipcRenderer.invoke('dialog:switchToEditFile', file_name),
  getShareCode: (objectName, location, isFolder) => ipcRenderer.invoke('dialog:getShareCode', objectName, location, isFolder),
  getFileShares: (objectName, location, isFolder) => ipcRenderer.invoke('dialog:getFileShares', objectName, location, isFolder),
  sendRequestToDelete: (objectName, location, isFolder) => ipcRenderer.invoke('dialog:sendRequestToDelete', objectName, location, isFolder),
  getChosenFiles: (objectName, location, isFolder) => ipcRenderer.invoke('dialog:getChosenFiles', objectName, location, isFolder),
  getSharedFilesAndFolders: (location) => ipcRenderer.invoke('dialog:getSharedFilesAndFolders', location),
  switchToSharedEditFile: (fileName, location) => ipcRenderer.invoke('dialog:switchToSharedEditFile', fileName, location),
});

