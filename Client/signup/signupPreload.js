const { ipcRenderer, remote, contextBridge } = require('electron');

/**
 * Exposes Electron API functions to the main world for communication with the main process.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Sends a request to switch to the login window in the main process.
   * @returns {Promise<void>} A promise that resolves when the request is processed.
   */
  switchToLogin: () => ipcRenderer.invoke('dialog:switchToLogin'),

  /**
   * Sends sign-up details to the main process for registration.
   * @param {string} username - The username for sign-up.
   * @param {string} password - The password for sign-up.
   * @param {string} email - The email for sign-up.
   * @returns {Promise<void>} A promise that resolves when the request is processed.
   */
  sendSignUpDetails: (username, password, email) => ipcRenderer.invoke('dialog:sendSignUpDetails', username, password, email),

  /**
   * Displays an error message from the main process in the renderer process.
   * @param {string} errorMessage - The error message to display.
   */
  showError: (errorMessage) => ipcRenderer.on('show-error', errorMessage),
});
