const { ipcRenderer, remote, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  switchToLogin: () => ipcRenderer.invoke('dialog:switchToLogin'),
  sendSignUpDetails: (username, password, email) => ipcRenderer.invoke('dialog:sendSignUpDetails', username, password, email),
  showError: (errorMessage) => ipcRenderer.on('show-error', errorMessage),
})
