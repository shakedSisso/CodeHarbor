const { BrowserWindow , ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const communicator = require("../communicator.js");
const getMain = () => require('../main.js');
const codes = require('../windowCodes.js');

let mainWindow;
let locationPath = "";
let fileName;
const NEW_FILE_REQUEST = 3;
const NEW_FOLDER_REQUEST = 6;
const GET_FILES_AND_FOLDERS_REQUEST = 7;
const GET_SHARE_CODE = 9;

function dataHandler(jsonObject)
{
    data = jsonObject.data;
    if (jsonObject.code === GET_FILES_AND_FOLDERS_REQUEST)
    {
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
    } else if (jsonObject.code === NEW_FILE_REQUEST) {
        if (data.status === "success")
            getMain().switchWindow(codes.EDIT);
        else {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: "This file name is already taken by another file in this location",
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
                message: "This folder name is already taken by another folder in this location",
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
                    buttons: ['OK']
                }
            )
        }
        else
        {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: "There was an error while trying to create a share code for this object.\nPlease try again later.",
                buttons: ['OK']
            });
        }
    }
}

function handleCreateRequest(event, name, isFolder)
{
    fileName = name;
    var code, messageData;
    if (isFolder) {
        code = NEW_FOLDER_REQUEST;
        messageData = {
            data: {
                folder_name: name,
                location: locationPath,
            },
        }; 
    }
    else {
        code = NEW_FILE_REQUEST;
        messageData = {
            data: {
                file_name: name,
                location: locationPath,
            },
        }; 
    }
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, code);
}

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
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, GET_FILES_AND_FOLDERS_REQUEST);
}

function handleSwitchToEditFile(event, name)
{
    fileName = name;
    getMain().switchWindow(codes.EDIT);
}

function handleResetLocation(event) {
    locationPath = "";
    mainWindow.setMenuBarVisibility(!mainWindow.isMenuBarVisible());
}

function handleCheckLocation(event){
    if (locationPath != "") {
        mainWindow.webContents.send('send-location', locationPath);
        handleGetFilesAndFolders(event, locationPath);
    } else {
        handleResetLocation();
    }
}

function handleGetShareCode(event, objectName, location, isFolder)
{
    const messageData = {
        data: {
            name: objectName,
            is_folder: isFolder,
            location: location
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, GET_SHARE_CODE);
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
        ipcMain.handle('dialog:resetLocation', handleResetLocation);
        ipcMain.handle('dialog:checkLocation', handleCheckLocation);
        ipcMain.handle('dialog:showMenu', ()=>{mainWindow.setMenuBarVisibility(!mainWindow.isMenuBarVisible());})
        ipcMain.handle('dialog:create', handleCreateRequest);
        ipcMain.handle('dialog:getFilesAndFolders', handleGetFilesAndFolders);
        ipcMain.handle('dialog:switchToEditFile', handleSwitchToEditFile);
        ipcMain.handle('dialog:getShareCode', handleGetShareCode);
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
        const inputDialog = new BrowserWindow({
            width: 525,
            height: 400,
            show: false,
            webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, '../creationDialog/creationDialogPreload.js'),
            },
            autoHideMenuBar: true,
        });
        // Load an HTML file for the dialog
        inputDialog.loadFile('creationDialog/creationDialog.html');

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