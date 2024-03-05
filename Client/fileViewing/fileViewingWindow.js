const { BrowserWindow , ipcMain, Menu, dialog, clipboard  } = require('electron');
const path = require('path');
const fs = require('fs');
const communicator = require("../communicator.js");
const getMain = () => require('../main.js');
const codes = require('../windowCodes.js');
const compilingDialog = require('../compilingDialog/compilingDialogWindow.js');
const shareManagementDialog = require('../shareManagementDialog/shareManagementDialogWindow.js')

let mainWindow;
let locationPath = "";
let fileName;
let files = [];
const NEW_FILE_REQUEST = 3;
const NEW_FOLDER_REQUEST = 6;
const GET_FILES_AND_FOLDERS_REQUEST = 7;
const GET_SHARE_CODE = 9;
const CONNECT_TO_SHARED_OBJECT_REQUEST = 10;
const GET_SHARED_FILES_AND_FOLDERS_REQUEST = 11;
const GET_FILE_SHARES = 13;
const DOWNLOAD_FILES = 15;

function dataHandler(jsonObject)
{
    data = jsonObject.data;
    if (jsonObject.code === GET_FILES_AND_FOLDERS_REQUEST || jsonObject.code === GET_SHARED_FILES_AND_FOLDERS_REQUEST)
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
                message: "There was an error while trying to create a share code for this object.\nPlease try again later.",
                buttons: ['OK']
            });
        }
    }
    else if (jsonObject.code === GET_FILE_SHARES)
    {
        if(data.status === "success")
        {
            shareManagementDialog.openShareManagementDialog(data.users);
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
    else if (jsonObject.code === CONNECT_TO_SHARED_OBJECT_REQUEST)
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
    else if (jsonObject.code === DOWNLOAD_FILES)
    {
        selectFolderAndCreateStructure(jsonObject.data);
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

function handleShareRequest(event, objectName, shareCode, isFolder)
{
    const messageData = {
        data: {
            name: objectName,
            share_code: shareCode,
            is_folder: isFolder,
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, CONNECT_TO_SHARED_OBJECT_REQUEST);
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

function handleSwitchToSharedEditFile(event, name, location)
{
    fileName = name;
    locationPath = location;
    locationPath = locationPath.substring(locationPath.indexOf("/") + 1);
    locationPath = locationPath.substring(locationPath.indexOf("/") + 1);
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

function handleGetFileShares(event, objectName, location, isFolder)
{
    const messageData = {
        data: {
            name: objectName,
            is_folder: isFolder,
            location: location
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, GET_FILE_SHARES);
}

function handleGetChosenFiles(event, objectName, location, isFolder)
{
    const messageData = {
        data: {
            name: objectName,
            is_folder: isFolder,
            location: location
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, DOWNLOAD_FILES);
}

async function openFolderSelectionDialog() {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths[0]; // return the selected folder path
  }
  
  // Function to create folders and files based on the provided structure
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
  
  // Open folder selection dialog and call createFoldersAndFiles with selected folder
  async function selectFolderAndCreateStructure(structure) {
    try {
      const selectedFolder = await openFolderSelectionDialog();
      await createFoldersAndFiles(selectedFolder, structure);
      dialog.showMessageBox({
        type: 'info',
        title: 'Download successfully',
        message: "The chosen file or folder were downloaded successfully",
        buttons: ['OK']
    });
    } catch (error) {
    }
  }

function handleGetSharedFilesAndFolders(event, location)
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
    communicator.sendMessage(messageDataJson, GET_SHARED_FILES_AND_FOLDERS_REQUEST);
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
        ipcMain.handle('dialog:requestUsername', handleRequestUsername);
        ipcMain.handle('dialog:resetLocation', handleResetLocation);
        ipcMain.handle('dialog:checkLocation', handleCheckLocation);
        ipcMain.handle('dialog:setMenu', handleSetMenu);
        ipcMain.handle('dialog:showMenu', ()=>{mainWindow.setMenuBarVisibility(!mainWindow.isMenuBarVisible());})
        ipcMain.handle('dialog:create', handleCreateRequest);
        ipcMain.handle('dialog:getFilesAndFolders', handleGetFilesAndFolders);
        ipcMain.handle('dialog:switchToEditFile', handleSwitchToEditFile);
        ipcMain.handle('dialog:getShareCode', handleGetShareCode);
        ipcMain.handle('dialog:getFileShares', handleGetFileShares);
        ipcMain.handle('dialog:getChosenFiles', handleGetChosenFiles);
        ipcMain.handle('dialog:getSharedFilesAndFolders', handleGetSharedFilesAndFolders);
        ipcMain.handle('dialog:switchToSharedEditFile', handleSwitchToSharedEditFile);
        ipcMain.handle('dialog:createShare', handleShareRequest);
    } catch {} //used in case the handlers already exists

    return mainWindow;
}

function handleRequestUsername(event) {
    mainWindow.webContents.send('send-username', getMain().getUsername());
}

function handleSetMenu (event, mainFolderName) {
    let template = [
        {
        label: 'File',
        submenu: [
            {
                label: 'Add Shared File/Folder',
                click: () => {
                    openAddSharedFileDialog();
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
        }
    ];
    
    if (mainFolderName === "Owned/")
    {
        template[0].submenu.push({
            label: 'Create File/Folder',
            click: () => {
                openCreateFileOrFolderDialog();
                },
        });
    }
    setMenu(template);
}

function setMenu(template) {
    const menuTemplate = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menuTemplate);
}

function deleteWindow()
{
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
}

function openAddSharedFileDialog()
{
    const inputDialog = new BrowserWindow({
        width: 525,
        height: 400,
        show: false,
        webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, '../sharingDialog/sharingDialogPreload.js'),
        },
        autoHideMenuBar: true,
    });
    // Load an HTML file for the dialog
    inputDialog.loadFile('sharingDialog/sharingDialog.html');

    inputDialog.once('ready-to-show', () => {
        inputDialog.show();
    });

    inputDialog.on('closed', () => {
        // Handle the closed event if needed
    });
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