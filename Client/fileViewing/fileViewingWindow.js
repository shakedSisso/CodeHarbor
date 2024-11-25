const { BrowserWindow , ipcMain, Menu, dialog, clipboard  } = require('electron');
const path = require('path');
const fs = require('fs');

const shareManagementDialog = require('../shareManagementDialog/shareManagementDialogWindow.js');
const creationDialog = require('../creationDialog/creationDialogWindow.js');
const sharingDialog = require('../sharingDialog/sharingDialogWindow.js');
const compilingDialog = require('../compilingDialog/compilingDialogWindow.js');

const communicator = require("../communicator.js");
const getMain = () => require('../main.js');

const windowCodes = require('../windowCodes.js');
const requestCodes = require('../requestCodes.js');

let locationPath = "", fileLocation = "";
let mainWindow, fileName, folderOrNot;
let files = [];

/**
 * Handles incoming data from the server and performs actions based on the received data.
 * @param {Object} jsonObject - The JSON object received from the server.
 */
function dataHandler(jsonObject)
{
    data = jsonObject.data;
    if (jsonObject.code === requestCodes.GET_FILES_AND_FOLDERS_REQUEST || jsonObject.code === requestCodes.GET_SHARED_FILES_AND_FOLDERS_REQUEST)
    {
        if (data.status === "success"){
            for (const fileData of data.files) {
                files.push(fileData.location + "/" + fileData.file_name);
            }
            mainWindow.webContents.send('show-files-and-folders', data);
        } else {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: data.message,
                buttons: ['OK']
            });
        }
    } else if (jsonObject.code === NEW_FILE_REQUEST) {
        if (data.status === "success")
            getMain().switchWindow(codes.EDIT);
        else {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: data.message,
                buttons: ['OK']
            });
        }
    } else if (jsonObject.code === NEW_FOLDER_REQUEST) { 
        if (data.status === "success")
            handleGetFilesAndFolders(null, locationPath); //when a user creates a folder, we don't enter that folder
        else {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: data.message,
                buttons: ['OK']
            });
        }
    }
    else if (jsonObject.code === GET_SHARE_CODE)
    {
        if(data.status === "success")
        {
            dialog.showMessageBox(
                {
                    type: 'info',
                    title: 'Shared successfully',
                    message: `Your share code: ${data.shareCode}`,
                    buttons: ['Copy'],
                }
            ).then((response) => {
                if (response.response === 0) // 'Copy to Clipboard' button clicked
                {
                  clipboard.writeText(data.shareCode);
                }
              }).catch((err) => {
                console.log(err);
              });
        }
        else
        {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: data.message,
                buttons: ['OK']
            });
        }
    }
    else if (jsonObject.code === requestCodes.GET_FILE_SHARES)
    {
        if(data.status === "success")
        {
            const users = data.users.map(user => user.username);
            shareManagementDialog.openShareManagementDialog(users, fileName, fileLocation, folderOrNot);
        }
        else
        {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: data.message,
                buttons: ['OK']
            });
        }
    }
    else if (jsonObject.code === requestCodes.DELETE_SELECTION)
    {
        if(data.status === "success")
        {
            dialog.showMessageBox(
                {
                    type: 'info',
                    title: 'Object Deleted successfully',
                    message: 'Object deleted successfully',
                    buttons: ['OK']
                }
            );
            handleGetFilesAndFolders(null, locationPath);
        }
        else if(data.status === "error")
        {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: data.message,
                buttons: ['OK']
            });
        }
    }
    else if (jsonObject.code === requestCodes.DOWNLOAD_FILES)
    {
        if (data.status === 'error') {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: data.message,
                buttons: ['OK']
            });
            return;
        }
        delete data.status; //remove the status from the structure so the function doesn't create it as a folder/file
        selectFolderAndCreateStructure(data);
    }
    else if (jsonObject.code === LOGOUT_REQUEST)
    {
        locationPath = "";
        getMain().switchWindow(codes.LOGIN);
    }
}

function handleCreateRequest(event, name, isFolder)
{
    fileName = name;
    var code, messageData;
    if (isFolder) 
    {
        code = NEW_FOLDER_REQUEST;
        messageData = {
            data: {
                folder_name: name,
                location: locationPath,
            },
        }; 
    }
    else 
    {
        fileLocation = locationPath;
        code = NEW_FILE_REQUEST;
        messageData = {
            data: {
                file_name: name,
                location: locationPath,
            },
        }; 
    }
    communicator.sendMessage(messageDataJson, code);
}

function handleShareRequest(event, objectName, shareCode, isFolder)
{
    const messageData = {
        data: {
            name: objectName,
            share_code: shareCode,
            is_folder: isFolder,
        },
    };
    communicator.sendMessage(messageDataJson, CONNECT_TO_SHARED_OBJECT_REQUEST);
}

/**
 * Handles the request to fetch files and folders from a specific location.
 * @param {Event} event - The event object.
 * @param {string} location - The location to fetch files and folders from.
 */
function handleGetFilesAndFolders(event, location)
{
    if (location != locationPath) {
        locationPath = location.substring(0, location.lastIndexOf("/"));
    }
    const messageData = {
        data: {
            location: locationPath
        },
    };
    communicator.sendMessage(messageData, requestCodes.GET_FILES_AND_FOLDERS_REQUEST);
}

/**
 * Handles the request to switch to editing a file.
 * @param {Event} event - The event object.
 * @param {string} name - The name of the file to edit.
 */
function handleSwitchToEditFile(event, name)
{
    fileName = name;
    fileLocation = locationPath;
    getMain().switchWindow(codes.EDIT);
}

/**
 * Handles the request to switch to editing a file from the shared folder.
 * @param {Event} event - The event object.
 * @param {string} name - The name of the file to edit.
 * @param {string} location - The location of the file in the server.
 */
function handleSwitchToSharedEditFile(event, name, location)
{
    fileName = name;
    fileLocation = location;
    let parts = fileLocation.split('./files/'); //only save the location that is after './files/'
    fileLocation = parts[1];
    getMain().switchWindow(codes.EDIT);
}

/**
 * Handles the request to reset the location and hides the menu bar
 * @param {Event} event - The event object.
 */
function handleResetLocation(event) {
    locationPath = "";
    mainWindow.setMenuBarVisibility(!mainWindow.isMenuBarVisible());
}

/**
 * Handles the request to check the location and act accordingly
 * @param {Event} event - The event object.
 */
function handleCheckLocation(event){
    if (locationPath != "") {
        mainWindow.webContents.send('send-location', locationPath);
        handleGetFilesAndFolders(event, locationPath);
    } else {
        handleResetLocation();
    }
}

/**
 * Handles the request to get a share code to the file or folder.
 * @param {Event} event - The event object.
 * @param {string} objectName - The name of the file or folder.
 * @param {string} location - The location of the file/folder
 * @param {boolean} isFolder - The parameter that indicates if the chosen object is a file or a folder
 */
function handleGetShareCode(event, objectName, location, isFolder)
{
    const messageData = {
        data: {
            name: objectName,
            is_folder: isFolder,
            location: location
        },
    };
    communicator.sendMessage(messageData, requestCodes.GET_SHARE_CODE);
}

/**
 * Handles the request to get the shares of the chosen object
 * @param {Event} event - The event object.
 * @param {string} objectName - The name of the file or folder.
 * @param {string} location - The location of the file/folder
 * @param {boolean} isFolder - The parameter that indicates if the chosen object is a file or a folder
 */
function handleGetFileShares(event, objectName, location, isFolder)
{
    fileName = objectName;
    fileLocation = location;
    folderOrNot = isFolder;
    location = './files/' + location.substring(0,location.lastIndexOf('/'));
    const messageData = {
        data: {
            name: objectName,
            is_folder: isFolder,
            location: location
        },
    };
    communicator.sendMessage(messageData, requestCodes.GET_FILE_SHARES);
}

/**
 * Handles the request to delete the file or folder.
 * @param {Event} event - The event object.
 * @param {string} objectName - The name of the file or folder.
 * @param {string} location - The location of the file/folder
 * @param {boolean} isFolder - The parameter that indicates if the chosen object is a file or a folder
 */
function handleSendRequestToDelete(event, objectName, location, isFolder)
{
    location = './files/' + location.substring(0,location.lastIndexOf('/'));
    const messageData = {
        data: {
            name: objectName,
            is_folder: isFolder,
            location: location
        },
    };
    communicator.sendMessage(messageData, requestCodes.DELETE_SELECTION);
}

/**
 * Handles the request to download the file or folder.
 * @param {Event} event - The event object.
 * @param {string} objectName - The name of the file or folder.
 * @param {string} location - The location of the file/folder
 * @param {boolean} isFolder - The parameter that indicates if the chosen object is a file or a folder
 */
function handleGetChosenFiles(event, objectName, location, isFolder)
{
    location = './files/' + location.substring(0,location.lastIndexOf('/'));
    if (isFolder)
        objectName = objectName.substring(0, objectName.lastIndexOf('/')); //removes the `/` in the end of the name of a folder
    const messageData = {
        data: {
            name: objectName,
            is_folder: isFolder,
            location: location
        },
    };
    communicator.sendMessage(messageData, requestCodes.DOWNLOAD_FILES);
}

/**
 * Opens a folder selection dialog to choose a directory.
 * @returns {Promise<string>} The selected folder path.
 */
async function openFolderSelectionDialog() {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled)
    {
        throw new Error('Download canceled');
    }
    return result.filePaths[0]; // return the selected folder path
  }
  
/**
 * Creates folders and files based on the provided structure.
 * @param {string} directory - The directory where to create the folders and files.
 * @param {Object} structure - The structure defining the folders and files to create.
 */
async function createFoldersAndFiles(directory, structure) {
    for (const [name, content] of Object.entries(structure)) {
        const newPath = path.join(directory, name);
        if (Array.isArray(content)) {
            fs.writeFileSync(newPath, content.join(''));
        } else {
            fs.mkdirSync(newPath);
            await createFoldersAndFiles(newPath, content);
        }
    }
}

/**
 * Opens the folder selection dialog and creates the folder structure based on the provided structure.
 * @param {Object} structure - The structure defining the folders and files to create.
 */
  async function selectFolderAndCreateStructure(structure) {
    try {
      const selectedFolder = await openFolderSelectionDialog();
      createFoldersAndFiles(selectedFolder, structure);
      dialog.showMessageBox({
            type: 'info',
            title: 'Download successfully',
            message: "The chosen file or folder were downloaded successfully",
            buttons: ['OK']
        });
    } catch (error) {
        dialog.showMessageBox({
            type: 'info',
            title: 'Download canceled', 
            message: 'Download was canceled successfully',
            buttons: ['OK']
        });
    }
  }

/**
 * Handles the "get shared files and folders" request from the client.
 * @param {Event} event - The event object.
 * @param {string} location - The location of the shared files and folders.
 */
function handleGetSharedFilesAndFolders(event, location)
{
    if (location === "Shared/"){
        const messageData = {
            data: {
                location: "Shared"
            },
        };    
        const messageDataJson = JSON.stringify(messageData);
        communicator.sendMessage(messageDataJson, GET_SHARED_FILES_AND_FOLDERS_REQUEST);
    }
    else {
        let parts;
        if (location.includes('files'))
        {
            parts = location.split('./files/'); //only save the location that is after './files/'
        }
        else if (location.includes('Shared'))
        {
            parts = location.split('Shared/');
        }
        location = parts[1];
        handleGetFilesAndFolders(event, location);
    }
    const messageData = {
        data: {
            location: locationPath
        },
    };
    communicator.sendMessage(messageData, requestCodes.GET_SHARED_FILES_AND_FOLDERS_REQUEST);

}

/**
 * Creates a BrowserWindow instance and loads the fileViewing.html file.
 * @param {Object} bounds - The bounds object containing window dimensions and position.
 * @returns {BrowserWindow} The created BrowserWindow instance.
 */
function createWindow(bounds) {
    mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, './fileViewingPreload.js'),
        },
        autoHideMenuBar: false,
    })
    mainWindow.loadFile('fileViewing/fileViewing.html');
    mainWindow.on('closed', () => {
      });

    communicator.setDataHandler(dataHandler);

    try {
        ipcMain.handle('dialog:requestUsername', handleRequestUsername);
        ipcMain.handle('dialog:resetLocation', handleResetLocation);
        ipcMain.handle('dialog:checkLocation', handleCheckLocation);
        ipcMain.handle('dialog:setMenu', handleSetMenu);
        ipcMain.handle('dialog:showMenu', ()=>{mainWindow.setMenuBarVisibility(!mainWindow.isMenuBarVisible());})
        ipcMain.handle('dialog:getFilesAndFolders', handleGetFilesAndFolders);
        ipcMain.handle('dialog:switchToEditFile', handleSwitchToEditFile);
        ipcMain.handle('dialog:getShareCode', handleGetShareCode);
        ipcMain.handle('dialog:getFileShares', handleGetFileShares);
        ipcMain.handle('dialog:sendRequestToDelete', handleSendRequestToDelete);
        ipcMain.handle('dialog:getChosenFiles', handleGetChosenFiles);
        ipcMain.handle('dialog:getSharedFilesAndFolders', handleGetSharedFilesAndFolders);
        ipcMain.handle('dialog:switchToSharedEditFile', handleSwitchToSharedEditFile);
    } catch {} //used in case the handlers already exist because the window was created before

    return mainWindow;
}

/**
 * Handles the "request username" event by sending the username to the renderer process.
 * @param {Event} event - The event object.
 */
function handleRequestUsername(event) {
    mainWindow.webContents.send('send-username', getMain().getUsername());
}

/**
 * Sets the menu based on the main folder name and template.
 * @param {Event} event - The event object.
 * @param {string} mainFolderName - The main folder name.
 */
function handleSetMenu (event, mainFolderName) {
    let template = [
        {
        label: 'File',
        submenu: [
            {
                label: 'Add Shared File/Folder',
                click: () => {
                    sharingDialog.openAddSharedFileDialog();
                },
            }
        ],
        },
        {
            label: 'Run',
            submenu: [
                {
                    label: 'Compile files',
                    click: () => {
                        compilingDialog.openCompilingDialog(files);
                    },
                    enabled: getMain().getDoesCompilerExists(),
                },
            ],
        },
        {
            label: 'Exit',
            submenu: [
                {
                    label: 'Exit App',
                    click: () => {
                        mainWindow.close();
                    },
                },
                {
                    label: 'Log out',
                    click: () => {
                        logOut();
                    },
                }
            ],
        }
    ];
    
    if (mainFolderName === "Owned/")
    {
        template[0].submenu.push({
            label: 'Create File/Folder',
            click: () => {
                creationDialog.openCreateFileOrFolderDialog();
                },
        });
    }
    setMenu(template);
}

/**
 * Sends a message to the server requesting to disconnect from the user
 */
function logOut() {
    const messageDataJson = JSON.stringify({});
    communicator.sendMessage(messageDataJson, LOGOUT_REQUEST);
}

/**
 * Sets the menu based on the provided template.
 * @param {Object} template - The menu template object.
 */
function setMenu(template) {
    const menuTemplate = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menuTemplate);
}

/**
 * Closes the main window.
 */
function deleteWindow()
{
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
}

/**
 * Retrieves the current location path.
 * @returns {string} The current location path.
 */
function getLocationPath(){
    return locationPath;
}

/**
 * Resets the variable 'locationPath' to an empty string
 */
function resetLocation()
{
    locationPath = "";
}

/**
 * Retrieves the current file location
 * @returns {string} The current file location
 */
function getFileLocation() {
    return fileLocation;
}

/**
 * Retrieves the current file name.
 * @returns {string} The current file name.
 */
function getFileName(){
    return fileName;
}

/**
 * Sets the current file name
 * @param {string} the name file name
 */
function setFileName(name){
    fileName = name;
}

/**
 * Reloads the current file in the main window.
 */
function reloadCurrentFolder() {
    if (locationPath.startsWith('Shared'))
    {
        handleGetSharedFilesAndFolders(null, locationPath);
    }
    else 
    {
        handleGetFilesAndFolders(null, locationPath);
    }
    communicator.setDataHandler(dataHandler);
}

module.exports = {
    createWindow,
    deleteWindow,
    dataHandler,
    getLocationPath,
    getFileName,
    setFileName,
    reloadCurrentFile,
    resetLocation,
    getFileLocation
}