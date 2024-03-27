const { BrowserWindow ,ipcMain ,dialog } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const getMain = () => require('../main.js');
const getFileViewing = () => require('../fileViewing/fileViewingWindow');
const communicator = require('../communicator.js');
const requestCodes = require('../requestCodes.js');

let inputDialog;
var filesNames = [];
var executableName = "";

/**
 * Handles data received from the main process.
 * @param {Object} jsonObject - The JSON object containing data.
 */
function dataHandler(jsonObject)
{
    data = jsonObject.data;
    let files = [];
    for (let fileName in data.files)
    {
        files.push(fileName);
        const fileContent = data.files[fileName].join('');
        createLocalFile(fileName, fileContent);
    }
    compileAndRun(files);
}

/**
 * Creates a local file with the given content.
 * @param {string} fileName - The name of the file to create.
 * @param {string} content - The content to write to the file.
 */
function createLocalFile(fileName, content) {
    fs.writeFile("./" + fileName, content, (err) => {
        if (err) {
            console.error('Error creating file:', err);
        }
    });
}

/**
 * Deletes local files with the given names.
 * @param {Array<string>} fileNames - An array of file names to delete.
 */
function deleteLocalFiles(fileNames)
{
    fileNames.forEach(name =>{
        deleteLocalFile(name);
    })
}

/**
 * Deletes a local file with the given name.
 * @param {string} file_name - The name of the file to delete.
 */
function deleteLocalFile(file_name) {
    fs.promises.unlink("./" + file_name)
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

/**
 * Opens a dialog for compiling files.
 * @param {Array<string>} files - An array of file names to compile.
 */
async function openCompilingDialog(files) {
    filesNames = files;

    const position = await getMain().middleOfWindow();
    inputDialog = new BrowserWindow({
        width: 550,
        height: 430,
        show: false,
        x: position.x,
        y: position.y,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, './compilingDialogPreload.js'),
        },
        autoHideMenuBar: true,
    });
    communicator.setDataHandler(dataHandler);

    try {
        ipcMain.handle('dialog:getFiles', handleGetFiles);
        ipcMain.handle('dialog:getFilesAndRun', handleGetFilesAndRun);
    } catch {} //used in case the handlers already exist because the window was created before

    inputDialog.loadFile('compilingDialog/compilingDialog.html');
    inputDialog.show();

    inputDialog.on('closed', () => {
        // Handle the closed event if needed
        communicator.setDataHandler(getFileViewing().dataHandler);
    });
}

/**
 * Handles the event to get files in the dialog window.
 */
function handleGetFiles()
{
    inputDialog.webContents.send('get-files', filesNames);
}

/**
 * Gets files and creates local versions for compilation.
 * @param {Array<string>} fileNames - An array of file names to fetch.
 */
function getFilesAndCreateLocalVersions(fileNames)
{
    const messageData = { data : { file_names: fileNames}};
    communicator.sendMessage(messageData, requestCodes.GET_FILES_REQUEST);
}

/**
 * Handles the event to get files and run the compilation.
 * @param {Object} event - The event object.
 * @param {string} exeName - The name of the executable.
 * @param {Array<string>} fileNames - An array of file names to compile.
 */

function handleGetFilesAndRun (event, exeName, fileNames) {
    executableName = exeName;
    getFilesAndCreateLocalVersions(fileNames);
}

/**
 * Compiles and runs the specified files.
 * @param {Array<string>} fileNames - An array of file names to compile.
 */
function compileAndRun(fileNames) 
{
    var compileCommand = `gcc -o ${executableName}.exe `;
    compileCommand += fileNames.join(' ');
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

        const executablePath = `./${executableName}.exe`;

        const argumentsArray = [];

        const child = spawn('cmd', ['/c', `start ${executablePath} ${argumentsArray.join(' ')}`]);
            child.on('close', (code) => {
            console.log(`Child process exited with code ${code}`);
            inputDialog.close();
            deleteLocalFiles(fileNames);
        });

        child.on('error', (err) => {
            alert(`Error: ${err}`);
        });
    });
    
}

module.exports = {
    openCompilingDialog
}
