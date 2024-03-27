const { ipcRenderer, remote, contextBridge } = require('electron');

/**
 * Exposes Electron APIs to the renderer process.
 * Allows invoking the createShare dialog.
 */
contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Shares an object by invoking the createShare dialog in the main process.
     * @param {string} objectName - The name of the object to share.
     * @param {string} shareCode - The share code for accessing the shared object.
     * @param {boolean} isFolder - Indicates whether the shared object is a folder.
     * @returns {Promise} A promise that resolves with the result of the share operation.
     */
    share: (objectName, shareCode, isFolder) => ipcRenderer.invoke('dialog:createShare', objectName, shareCode, isFolder),
});