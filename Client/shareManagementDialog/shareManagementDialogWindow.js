const { BrowserWindow , ipcMain } = require('electron');
const path = require('path');

const communicator = require('../communicator.js');
const getMain = () => require('../main.js');
const requestCodes = require('../requestCodes.js');

var usernames = [];
let inputDialog, file_name, file_location, is_folder;

/**
 * Handles incoming data from the server and closes the input dialog window.
 * @param {Object} jsonObject - The JSON object received from the server.
 */
function dataHandler(jsonObject)
{
    inputDialog.close();
}

/**
 * Opens a share management dialog window.
 * @param {Array} users - An array of usernames for sharing.
 * @param {string} fileName - The name of the file to be shared.
 * @param {string} location - The location of the file to be shared.
 * @param {boolean} isFolder - Indicates whether the shared item is a folder.
 */
async function openShareManagementDialog(users, fileName, location, isFolder) {
    usernames = users;
    file_name = fileName;
    file_location = location;
    is_folder - isFolder;
    const position = await getMain().middleOfWindow();
    inputDialog = new BrowserWindow({
        width: 550,
        height: 430,
        x: position.x,
        y: position.y,
        webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, './shareManagementDialogPreload.js'),
        },
        autoHideMenuBar: true,
    });
    communicator.setDataHandler(dataHandler);

    try {
        ipcMain.handle('dialog:getFileSharesNames', handleGetFileSharesNames);
        ipcMain.handle('dialog:removeShares', handleRemoveShares);
    } catch {} //used in case the handlers already exist because the window was created before

    inputDialog.loadFile('shareManagementDialog/shareManagementDialog.html');
    inputDialog.show();

    inputDialog.on('closed', () => {
        // Handle the closed event if needed
    });
    
}

/**
 * Handles the getFileSharesNames dialog event.
 */
function handleGetFileSharesNames()
{
    inputDialog.webContents.send('get-file-shares', usernames);
}

/**
 * Handles the removeShares dialog event.
 * @param {Array} users - An array of usernames to remove shares for.
 */
function handleRemoveShares(users)
{
    const messageData = { 
        data : { 
            usernames: users,
            name: file_name,
            location: file_location,
            isFolder: is_folder
        }
    };
    communicator.sendMessage(messageData, requestCodes.REMOVE_SHARES);
}

module.exports = {
    openShareManagementDialog
}
