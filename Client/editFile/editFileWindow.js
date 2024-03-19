const { BrowserWindow , ipcMain, Menu, dialog} = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const getMain = () => require('../main.js');
const communicator = require("../communicator.js");
const storeManager = require('../storeManager.js');
const windowCodes = require('../windowCodes.js');
const requestCodes = require('../requestCodes.js');

let mainWindow;
var fileName = "", location = "";

function handleChangesInMain(event, changes, lineCount) {
    //create message and send it to server
    const messageData = {
        data: {
            updates: changes,
            line_count: lineCount,
        },
    };
    communicator.sendMessage(messageData, requestCodes.UPDATE_REQUEST);
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
    communicator.sendMessage(messageData, requestCodes.FILE_REQUEST);
}

function compileAndRun() 
{
    const exeName = fileName.substring(fileName, fileName.lastIndexOf('.'));
    const compileCommand = `gcc -o ${exeName}.exe ${fileName}`;
    exec(compileCommand, (error, stdout, stderr) => {
        if (error) {
            dialog.showMessageBox({
                type: 'error',
                title: 'Error',
                message: `Compilation error:\n${error.message}`,
                buttons: ['OK']
            });
            return;
        }

        if (stderr) {
            if (!stderr.includes("warning: no newline at end of file"))
            {
                console.error(`Compilation stderr: ${stderr}`);
                return;
            }
            console.error(`Compilation stderr: ${stderr}`);
        }

        const executablePath = `./${exeName}.exe`;

        const argumentsArray = [];

        const child = spawn('cmd', ['/c', `start ${executablePath} ${argumentsArray.join(' ')}`]);
        child.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
        });

        child.on('error', (err) => {
            alert(`Error: ${err}`);
        });
    });
    
}

function disconnectFromFile()
{
    const messageData = { data: {} };
    communicator.sendMessage(messageData, requestCodes.DISCONNECT_FROM_FILE_REQUEST)
}

function dataHandler(jsonObject)
{
    if (jsonObject.code === requestCodes.FILE_REQUEST) {
        updateScreenAndCreateLocalFile(jsonObject.data)
    }
    else if (jsonObject.code === requestCodes.UPDATE_REQUEST)
    {
        mainWindow.webContents.send('file-updates', jsonObject.data);
        updateLocalFile(jsonObject.data.updates);
    }
}

function createWindow(locationPath, name) {
    location = locationPath;
    fileName = name;
    const position = storeManager.getValueFromStroe('lastWindowPosition');
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        x: position.x,
        y: position.y,
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

    try {
        ipcMain.handle('dialog:getFile', connectToFileRequest);
        ipcMain.handle('dialog:sendChanges', handleChangesInMain);
    } catch {} //used in case the handlers already exists

    return mainWindow;
}  
    
    ipcMain.on('set-menu-editFile', (event) => {
        const template = [
            {
                label: 'Run',
                submenu: [
                    {
                        label: 'Compile file',
                        click: () => {
                            compileAndRun();
                        },
                        enabled: getMain().getDoesCompilerExists(),
                    },
                ],
            },
            {
                label: 'Exit',
                submenu: [
                    {
                    label: 'Exit File',
                    click: () => {
                        disconnectFromFile();
                        getMain().switchWindow(windowCodes.FILE_VIEW);
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