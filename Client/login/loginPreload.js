const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  switchToSignup: () => ipcRenderer.invoke('dialog:switchToSignup'),
  sendLoginDetails: (username, password) => ipcRenderer.invoke('dialog:sendLoginDetails', username, password),
  showError: (errorMessage) => ipcRenderer.on('show-error', errorMessage),
})
