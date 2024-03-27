const { ipcRenderer, contextBridge } = require('electron');

// Expose Electron API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Gets the current location files.
   * @param {Function} files - Callback function to handle the received files.
   */
  getCurrentLocationFiles: (files) => ipcRenderer.on('get-files',files),

  /**
   * Gets files using a file dialog.
   */
  getFiles: () => ipcRenderer.invoke('dialog:getFiles',),

  /**
   * Gets files and runs an executable with them.
   * @param {string} exeName - Name of the executable to run.
   * @param {Array<string>} fileNames - Array of file names to be passed to the executable.
   */
  getFilesAndRun: (exeName, fileNames) => ipcRenderer.invoke('dialog:getFilesAndRun', exeName, fileNames)
});
