const { ipcRenderer, remote, contextBridge } = require('electron');

/**
 * Exposes the setMenu function to the main world.
 * @param {Object} menu - The menu object to be set.
 */
contextBridge.exposeInMainWorld('api', {
  setMenu: (menu) => { ipcRenderer.send('set-menu-editFile', menu); },
});

/**
 * Exposes functions related to Electron API to the main world.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Function that connects the DataHandler
   */
  connectHandler: () => ipcRenderer.invoke('dialog:connectDataHandler',),
  /**
   * Retrieves a file using a dialog box.
   */
  getFile: () => ipcRenderer.invoke('dialog:getFile',),

  /**
   * Sends changes and line count to the main process.
   * @param {string} changes - The changes made to the file content.
   * @param {number} lineCount - The number of lines in the file.
   */
  sendChanges: (changes, lineCount) => ipcRenderer.invoke('dialog:sendChanges', changes, lineCount),

  /**
   * Listens for file content updates from the main process.
   * @param {Function} callback - The callback function to handle the file content updates.
   */
  getContentFile: (callback) => ipcRenderer.on('file-content', callback),

  /**
   * Listens for file updates from the main process.
   * @param {Function} updates - The callback function to handle file updates.
   */
  getFileUpdates: (updates) => ipcRenderer.on('file-updates', updates),
})
