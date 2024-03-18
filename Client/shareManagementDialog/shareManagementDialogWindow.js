const { BrowserWindow , ipcMain } = require('electron');
const path = require('path');

const communicator = require('../communicator.js');
const requestCodes = require('../requestCodes.js');

var usernames = [];
let inputDialog, file_name, file_location, is_folder;

function dataHandler(jsonObject)
{
    inputDialog.close();
}

function openShareManagementDialog(users, fileName, location, isFolder) {
    usernames = users;
    file_name = fileName;
    file_location = location;
    is_folder - isFolder;
    inputDialog = new BrowserWindow({
        width: 550,
        height: 425,
        show: false,
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
    } catch {} //used in case the handlers already exists

    inputDialog.loadFile('shareManagementDialog/shareManagementDialog.html');
    inputDialog.show();

    inputDialog.on('closed', () => {
        // Handle the closed event if needed
    });
    
}

function handleGetFileSharesNames()
{
    inputDialog.webContents.send('get-file-shares', usernames);
}

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
