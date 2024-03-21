const { ipcRenderer, contextBridge } = require('electron');

/**
 * Exposes Electron APIs to the renderer process through context bridge.
 * Provides functions for interacting with the main process.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Switches to the signup window in the main process.
   * @returns {Promise<void>} A promise that resolves when the operation is successful.
   */
  switchToSignup: () => ipcRenderer.invoke('dialog:switchToSignup'),

  /**
   * Sends login details to the main process.
   * @param {string} username - The username to send.
   * @param {string} password - The password to send.
   * @returns {Promise<void>} A promise that resolves when the operation is successful.
   */
  sendLoginDetails: (username, password) => ipcRenderer.invoke('dialog:sendLoginDetails', username, password),

  /**
   * Shows an error message in the renderer process.
   * @param {string} errorMessage - The error message to display.
   */
  showError: (errorMessage) => ipcRenderer.on('show-error', errorMessage),
});
