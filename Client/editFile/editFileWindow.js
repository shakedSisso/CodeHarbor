const { BrowserWindow , ipcMain, Menu, dialog} = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const getMain = () => require('../main.js');
const getFileViewing = () => require('../fileViewing/fileViewingWindow.js'); 
const communicator = require("../communicator.js");

const windowCodes = require('../windowCodes.js');
const requestCodes = require('../requestCodes.js');

let mainWindow;
var fileName = "", location = "";

/**
 * Handles changes received from the main process and sends them to the server.
 * @param {Event} event - The event object.
 * @param {Object} changes - The changes to be handled.
 * @param {number} lineCount - The line count of the changes.
 */
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

/**
 * Connects to the file request.
 */
function connectToFileRequest()
{
    fileName = getFileViewing().getFileName();
    location = getFileViewing().getFileLocation();
    const messageData = {
        data: {
            file_name: fileName,
            location: location,
        },
    };
    communicator.sendMessage(messageData, requestCodes.FILE_REQUEST);
}

/**
 * Compiles and runs the code.
 */
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

/**
 * Request to disconnects from the file on the server.
 */
function disconnectFromFile()
{
    const messageData = { data: {} };
    communicator.sendMessage(messageData, requestCodes.DISCONNECT_FROM_FILE_REQUEST)
}

/**
 * Handles the data received from the communication module.
 * @param {Object} jsonObject - The JSON object containing the data.
 */
function dataHandler(jsonObject)
{
    if (jsonObject.code === requestCodes.FILE_REQUEST) {
        updateScreenAndCreateLocalFile(jsonObject.data)
    }
    else if (jsonObject.code === requestCodes.UPDATE_REQUEST)
    {
        mainWindow.webContents.send('file-updates', jsonObject.data);
        updateLocalFile(data.updates);
    }
}

/**
 * Creates a new Electron window.
 * @param {Object} bounds - The bounds of the window.
 * @param {string} locationPath - The location path.
 * @param {string} name - The name of the file.
 * @returns {BrowserWindow} The created window.
 */
function createWindow(bounds, locationPath, name) {
    location = locationPath;
    fileName = name;
    mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, './editFilePreload.js'),
        },
        autoHideMenuBar: false,
    })
    mainWindow.loadFile('editFile/editFile.html');

    mainWindow.on('closed', () => {
        getFileViewing().reloadCurrentFolder();
        deleteLocalFile();
      });


    try {
        ipcMain.handle('dialog:connectDataHandler', handleConnectDataHandler);
        ipcMain.handle('dialog:getFile', connectToFileRequest);
        ipcMain.handle('dialog:sendChanges', handleChangesInMain);
    } catch {} //used in case the handlers already exist because the window was created before

    return mainWindow;
}  

/**
 * Event listener for the 'set-menu-editFile' IPC message.
 * Builds and sets the menu for editing files in the main window.
 * @param {object} event - The IPC event object.
 */
ipcMain.on('set-menu-editFile', (event) => {
    // Define the menu template
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
    
    // Build the menu from the template
    const menuTemplate = Menu.buildFromTemplate(template);
    // Set the menu in the main window
    mainWindow.setMenu(menuTemplate);
});


/**
 * Deletes the Electron window.
 */
function deleteWindow()
{
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
}

/**
 * Updates the screen and creates a local file based on the data received.
 * @param {Array} data - The data received.
 */
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

/**
 * Creates a local file with the given content.
 * @param {string} content - The content of the file.
 */
function createLocalFile(content) {
    const filePath = path.join('.', fileName); // '.' is used to create a file in the same folder as the app
    fs.writeFile(filePath, content, (err) => {
        if (err) {
        console.error('Error creating file:', err);
        }
    });
}

/**
 * Updates the local file based on the changes received.
 * @param {Object} changes - The changes to be applied.
 */
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

/**
 * Deletes the local file.
 */
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