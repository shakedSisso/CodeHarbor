const { ipcRenderer, remote, contextBridge } = require('electron');

// Exposing the 'electronAPI' object to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Creates a new file or folder with the specified name.
     * @param {string} fileName - The name of the file or folder to create.
     * @param {boolean} isFolder - A flag indicating whether the item to create is a folder (true) or a file (false).
     */
    create: (fileName, isFolder) => ipcRenderer.invoke('dialog:create', fileName, isFolder),
  })
  