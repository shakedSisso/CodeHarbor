const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Requests a username from the main process asynchronously.
   */
  requestUsername: () =>ipcRenderer.invoke('dialog:requestUsername'),

  /**
   * Resets the location asynchronously by sending an IPC message to the main process.
   */
  resetLocation: () => ipcRenderer.invoke('dialog:resetLocation'),

  /**
   * Checks the current location asynchronously by sending an IPC message to the main process.
   */
  checkLocation: () => ipcRenderer.invoke('dialog:checkLocation'),

  /**
   * Sets the menu based on a main folder name asynchronously by sending an IPC message to the main process.
   * @param {string} mainFolderName The name of the main folder for setting the menu.
   */
  setMenu: (mainFolderName) => ipcRenderer.invoke('dialog:setMenu', mainFolderName),

  /**
   * Shows the menu asynchronously by sending an IPC message to the main process.
   */
  showMenu: () => ipcRenderer.invoke('dialog:showMenu'),

  /**
   * Gets files and folders from a specified location asynchronously by sending an IPC message to the main process.
   * @param {string} location The location from which to get files and folders.
   */
  getFilesAndFolders: (location) => ipcRenderer.invoke('dialog:getFilesAndFolders', location),

  /**
   * Listens for and shows files and folders received from the main process.
   * @param {Function} foldersAndFolders The callback function to handle received files and folders.
   */
  showFilesAndFolders: (foldersAndFolders) => ipcRenderer.on('show-files-and-folders', foldersAndFolders),

  /**
   * Listens for the username from the main process and executes a callback.
   * @param {Function} callback The callback function to handle the received username.
   */
  getUsername: (callback) => ipcRenderer.on('send-username', callback),

  /**
   * Listens for the location from the main process and executes a callback.
   * @param {Function} callback The callback function to handle the received location.
   */
  getLocation: (callback) => ipcRenderer.on('send-location', callback),

  /**
   * Switches to editing a file specified by its name asynchronously by sending an IPC message to the main process.
   * @param {string} file_name The name of the file to switch to for editing.
   */
  switchToEditFile: (file_name) => ipcRenderer.invoke('dialog:switchToEditFile', file_name),

  /**
   * Gets a share code for a specified object asynchronously by sending an IPC message to the main process.
   * @param {string} objectName The name of the object to get the share code for.
   * @param {string} location The location of the object.
   * @param {boolean} isFolder Indicates whether the object is a folder or not.
   */
  getShareCode: (objectName, location, isFolder) => ipcRenderer.invoke('dialog:getShareCode', objectName, location, isFolder),

  /**
   * Gets file shares for a specified object asynchronously by sending an IPC message to the main process.
   * @param {string} objectName The name of the object to get file shares for.
   * @param {string} location The location of the object.
   * @param {boolean} isFolder Indicates whether the object is a folder or not.
   */
  getFileShares: (objectName, location, isFolder) => ipcRenderer.invoke('dialog:getFileShares', objectName, location, isFolder),

  /**
   * Sends a request to delete a specified object asynchronously by sending an IPC message to the main process.
   * @param {string} objectName The name of the object to delete.
   * @param {string} location The location of the object.
   * @param {boolean} isFolder Indicates whether the object is a folder or not.
   */
  sendRequestToDelete: (objectName, location, isFolder) => ipcRenderer.invoke('dialog:sendRequestToDelete', objectName, location, isFolder),

  /**
   * Gets chosen files for a specified object asynchronously by sending an IPC message to the main process.
   * @param {string} objectName The name of the object to get chosen files for.
   * @param {string} location The location of the object.
   * @param {boolean} isFolder Indicates whether the object is a folder or not.
   */
  getChosenFiles: (objectName, location, isFolder) => ipcRenderer.invoke('dialog:getChosenFiles', objectName, location, isFolder),

  /**
   * Gets shared files and folders from a specified location asynchronously by sending an IPC message to the main process.
   * @param {string} location The location from which to get shared files and folders.
   */
  getSharedFilesAndFolders: (location) => ipcRenderer.invoke('dialog:getSharedFilesAndFolders', location),

  /**
   * Switches to editing a shared file specified by its name and location asynchronously by sending an IPC message to the main process.
   * @param {string} fileName The name of the shared file to switch to for editing.
   * @param {string} location The location of the shared file.
   */
  switchToSharedEditFile: (fileName, location) => ipcRenderer.invoke('dialog:switchToSharedEditFile', fileName, location),
});

