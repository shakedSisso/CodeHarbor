const { BrowserWindow , ipcMain, dialog  } = require('electron');
const path = require('path');

const communicator = require("../communicator.js");
const getMain = () => require('../main.js');
const getFileViewing = () => require('../fileViewing/fileViewingWindow');

const requestCodes = require('../requestCodes.js');
const windowCodes = require('../windowCodes.js');

var fileName;

/**
 * Handles incoming data from the communicator module based on the request code.
 * @param {Object} jsonObject - The JSON object containing the data and code.
 */
function dataHandler(jsonObject) 
{
    data = jsonObject.data;
    if (jsonObject.code === requestCodes.NEW_FILE_REQUEST) {
        if (data.status === "success"){
            getFileViewing().setFileName(fileName);
            getMain().switchWindow(windowCodes.EDIT);
        }
        else {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: "This file name is already taken by another file in this location",
                buttons: ['OK']
            });
        }
    } 
    else if (jsonObject.code === requestCodes.NEW_FOLDER_REQUEST) { 
        if (data.status === "success")
            getFileViewing().reloadCurrentFile();
        else {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: "This folder name is already taken by another folder in this location",
                buttons: ['OK']
            });
        }
    }
}

/**
 * Handles the create request by sending a message to the communicator module.
 * @param {Object} event - The event object.
 * @param {string} name - The name of the file or folder to be created.
 * @param {boolean} isFolder - Indicates whether the creation is for a folder (true) or a file (false).
 */
function handleCreateRequest(event, name, isFolder)
{
    const locationPath = getFileViewing().getLocationPath();
    fileName = name;
    var code, messageData;
    if (isFolder) 
    {
        code = requestCodes.NEW_FOLDER_REQUEST;
        messageData = {
            data: {
                folder_name: name,
                location: locationPath,
            },
        }; 
    }
    else 
    {
        code = requestCodes.NEW_FILE_REQUEST;
        messageData = {
            data: {
                file_name: name,
                location: locationPath,
            },
        }; 
    }
    
    communicator.sendMessage(messageData, code);
}

/**
 * Opens the create file or folder dialog window.
 * This function initializes the dialog window, sets event handlers, and loads the HTML file.
 */
async function openCreateFileOrFolderDialog() 
{
    const position = await getMain().middleOfWindow();
    inputDialog = new BrowserWindow({
        width: 550,
        height: 430,
        x: position.x,
        y: position.y,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, '../creationDialog/creationDialogPreload.js'),
        },
        autoHideMenuBar: true,
    });
    // Load an HTML file for the dialog
    inputDialog.loadFile('creationDialog/creationDialog.html');
    communicator.setDataHandler(dataHandler);

    try {
        ipcMain.handle('dialog:create', handleCreateRequest);
    } catch {} //used in case the handlers already exist because the window was created before

    inputDialog.once('ready-to-show', () => {
        inputDialog.show();
    });

    inputDialog.on('closed', () => {
        // Handle the closed event if needed
        communicator.setDataHandler(getFileViewing().dataHandler);
    });
}

module.exports = {
    openCreateFileOrFolderDialog
};
