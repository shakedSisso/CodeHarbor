const { ipcRenderer, contextBridge } = require('electron');

/**
 * Exposes Electron API functions to the renderer process.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Retrieves current file shares from the main process.
   * @param {Function} users - Callback function to handle the received file shares.
   */
  getCurrentFileShares: (users) => ipcRenderer.on('get-file-shares',users),

  /**
   * Retrieves file share names from the main process.
   * @returns {Promise<Array>} A promise that resolves with an array of file share names.
   */
  getFileSharesNames: () => ipcRenderer.invoke('dialog:getFileSharesNames',),

  /**
   * Removes file shares via the main process.
   * @param {Array} users - Array of users to remove shares for.
   * @returns {Promise<void>} A promise that resolves when shares are successfully removed.
   */
  removeShares: (users) => ipcRenderer.invoke('dialog:removeShares', users)
});
