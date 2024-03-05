const { BrowserWindow , ipcMain } = require('electron');
const path = require('path');
const communicator = require('../communicator.js');

let inputDialog;
var usernames = [];
let file_name;
let file_location;
let is_folder;
const REMOVE_SHARES = 14;

function dataHandler(jsonObject)
{
    data = jsonObject.data;
    if (jsonObject.code === REMOVE_SHARES) {
        inputDialog.close();
    }
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
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, REMOVE_SHARES);
}

module.exports = {
    openShareManagementDialog
}
