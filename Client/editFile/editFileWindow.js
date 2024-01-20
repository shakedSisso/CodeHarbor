const { BrowserWindow , ipcMain, Menu} = require('electron');
const path = require('path');
const getMain = () => require('../main.js');
const communicator = require("../communicator.js");
const fs = require('fs');
const codes = require('../windowCodes.js');

let mainWindow;
const FILE_REQUEST = 1;
const UPDATE_REQUEST = 2;
var fileName = "", newFile, location = "";

function handleChangesInMain(event, changes, lineCount) {
    //create message and send it to server
    const messageData = {
        data: {
            updates: changes,
            line_count: lineCount,
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, UPDATE_REQUEST);
    updateLocalFile(changes);
}

function connectToFileRequest()
{
    const messageData = {
        data: {
            file_name: fileName,
            location: location,
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, FILE_REQUEST);
}

function dataHandler(jsonObject)
{
    if (jsonObject.code === FILE_REQUEST) {
        updateScreenAndCreateLocalFile(jsonObject.data)
    }
    else if (jsonObject.code === UPDATE_REQUEST)
    {
        mainWindow.webContents.send('file-updates', jsonObject.data);
        updateLocalFile(jsonObject.data.updates);
    }
}

function createWindow(locationPath, name) {
    location = locationPath;
    fileName = name;
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, './editFilePreload.js'),
        },
        autoHideMenuBar: false,
    })
    mainWindow.loadFile('editFile/editFile.html');
    mainWindow.on('closed', () => {
        deleteLocalFile();
      });

    communicator.setDataHandler(dataHandler);
    connectToFileRequest();

    try {
        ipcMain.handle('dialog:sendChanges', handleChangesInMain);
    } catch {} //used in case the handlers already exists

    return mainWindow;
}  
    
    ipcMain.on('set-menu-editFile', (event) => {
        const template = [
            {
                label: 'Exit',
                submenu: [
                    {
                    label: 'Exit File',
                    click: () => {
                        getMain().switchWindow(codes.FILE_VIEW);
                        },
                    },
                ],
                },
        ];
        
        const menuTemplate = Menu.buildFromTemplate(template);
        mainWindow.setMenu(menuTemplate);
    });

function deleteWindow()
{
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
}

function updateScreenAndCreateLocalFile(data)
{
    var arr = data
    fileContent = ""
    for (var i = 0; i <arr.length; i++){
        fileContent += arr[i];
    }
    mainWindow.webContents.send('file-content', fileContent);
    createLocalFile(fileContent);
}

function createLocalFile(content) {
    const filePath = path.join('.', fileName); // '.' is used to create a file in the same folder as the app
    fs.writeFile(filePath, content, (err) => {
        if (err) {
        console.error('Error creating file:', err);
        }
    });
}

function updateLocalFile(changes){
    const filePath = path.join('.', fileName); // '.' is used to access in file that is in the same folder as the app
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
        console.error('Error reading file:', err);
        } else {

            dataArr = data.split('\n');

            for (const key in changes) {
                if (changes.hasOwnProperty(key)) {
                dataArr[key - 1] = changes[key];
                }
            }
            
            const newData = dataArr.join('\n');

            fs.writeFile(filePath, newData, (err) => {
                if (err) {
                console.error('Error editing file:', err);
                }
            });
        }
    });
}

function deleteLocalFile() {
    if (fileName == "") //to avoid trying to delete a fileName if it's empty
        return;
    const filePath = path.join('.', fileName);

    // Use fs.promises.unlink for promise-based file deletion
    fs.promises.unlink(filePath)
        .then(() => {
        })
        .catch((err) => {
            if (err.code === 'ENOENT') {
                console.log('File does not exist');
            } else {
                console.error('Error deleting file:', err);
            }
        });
}

  module.exports = {
    createWindow,
    deleteWindow,
    deleteLocalFile
}