const { BrowserWindow , ipcMain, Menu} = require('electron');
const path = require('path');
const communicator = require("../communicator.js");
const getMain = () => require('../main.js');
const codes = require('../windowCodes.js');

let mainWindow;
let locationPath = "";
let fileName;
const NEW_FILE_REQUEST = 3;
const GET_FILES_AND_FOLDERS_REQUEST = 7;

function dataHandler(jsonObject)
{
    if (jsonObject.code === GET_FILES_AND_FOLDERS_REQUEST)
    {
        data = jsonObject.data;
        if (data.status === "success"){
            mainWindow.webContents.send('show-files-and-folders', data);
        } else {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: "Couldn't find the requested folder",
                buttons: ['OK']
            });
        }
    }
}

function handleCreateFileRequest(event, file_name)
{
    newFile = locationPath + "/" + file_name
    // creating message
    const messageData = {
        data: {
            file_name: file_name,
            location: locationPath,
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, NEW_FILE_REQUEST);
}

function handleGetFilesAndFolders(event, location)
{
    locationPath = location.substring(0, location.lastIndexOf("/"));
    const messageData = {
        data: {
            location: locationPath
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, GET_FILES_AND_FOLDERS_REQUEST);
}

function handleSwitchToEditFile(event, name)
{
    fileName = name;
    getMain().switchWindow(codes.EDIT);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
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
        ipcMain.handle('dialog:resetLocation', ()=>{locationPath = "";});
        ipcMain.handle('dialog:createFile', handleCreateFileRequest);
        ipcMain.handle('dialog:getFilesAndFolders', handleGetFilesAndFolders);
        ipcMain.handle('dialog:switchToEditFile', handleSwitchToEditFile);
    } catch {} //used in case the handlers already exists

    
    ipcMain.on('set-menu-fileViewing', (event, menu) => {
        const template = [
            {
            label: 'File',
            submenu: [
                {
                label: 'Create File/Folder',
                click: () => {
                    openCreateFileOrFolderDialog();
                    },
                },
            ],
            },
        ];
        
        const menuTemplate = Menu.buildFromTemplate(template);
        mainWindow.setMenu(menuTemplate);
        mainWindow.webContents.send('send-username', getMain().getUsername());
    });
    return mainWindow;
}

function deleteWindow()
{
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
}

function openCreateFileOrFolderDialog() {
    if (locationPath == ""){
        dialog.showMessageBox({
            type: 'error',
            title: 'Error',
            message: "You must enter a folder (`Owned` or one of the folders inside of `Owned`) to create a file",
            buttons: ['OK']
        });
    }else{
        const { BrowserWindow } = require('electron');

        const inputDialog = new BrowserWindow({
            width: 300,
            height: 200,
            show: false,
            webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, '../fileDialog/fileDialogPreload.js'),
            },
            autoHideMenuBar: true,
        });
    }

    // Load an HTML file for the dialog
    inputDialog.loadFile('fileDialog/fileDialog.html');

    inputDialog.once('ready-to-show', () => {
        inputDialog.show();
    });

    inputDialog.on('closed', () => {
        // Handle the closed event if needed
    });
  }

function getLocationPath(){
    return locationPath;
}

function getFileName(){
    return fileName;
}

module.exports = {
    createWindow,
    deleteWindow,
    getLocationPath,
    getFileName
}