const { BrowserWindow , ipcMain, dialog  } = require('electron');
const path = require('path');

const communicator = require("../communicator.js");
const getMain = () => require('../main.js');
const getFileViewing = () => require('../fileViewing/fileViewingWindow');
const requestCodes = require('../requestCodes.js');

/**
 * Handles incoming data from the server and performs actions based on the received data.
 * @param {Object} jsonObject - The JSON object received from the server.
 */
function dataHandler(jsonObject) 
{
    data = jsonObject.data;
    if (jsonObject.code === requestCodes.CONNECT_TO_SHARED_OBJECT_REQUEST)
    {
        if(data.status === "success")
        {
            dialog.showMessageBox(
                {
                    type: 'info',
                    title: 'Object Shared successfully',
                    message: 'Object shared successfully',
                    buttons: ['OK']
                }
            );
            getFileViewing().reloadCurrentFile();
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
}

/**
 * Handles the share request by sending a message to the server with the required data.
 * @param {Event} event - The event object.
 * @param {string} objectName - The name of the object to share.
 * @param {string} shareCode - The share code for accessing the shared object.
 * @param {boolean} isFolder - Indicates whether the shared object is a folder.
 */
function handleShareRequest(event, objectName, shareCode, isFolder)
{
    const messageData = {
        data: {
            name: objectName,
            share_code: shareCode,
            is_folder: isFolder,
        },
    };
    communicator.sendMessage(messageData, requestCodes.CONNECT_TO_SHARED_OBJECT_REQUEST);
}

/**
 * Opens a dialog window for adding a shared file or folder.
 */
async function openAddSharedFileDialog()
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
        preload: path.join(__dirname, './sharingDialogPreload.js'),
        },
        autoHideMenuBar: true,
    });
    // Load an HTML file for the dialog
    inputDialog.loadFile('sharingDialog/sharingDialog.html');
    communicator.setDataHandler(dataHandler);

    try {
        ipcMain.handle('dialog:createShare', handleShareRequest);
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
    openAddSharedFileDialog
};