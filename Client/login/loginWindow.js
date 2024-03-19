const { BrowserWindow , ipcMain } = require('electron');
const path = require('path');

const getMain = () => require('../main.js');
const communicator = require("../communicator.js");
const storeManager = require('../storeManager.js');
const windowCodes = require('../windowCodes.js');
const requestCodes = require('../requestCodes.js');

let mainWindow, name;

function dataHandler(jsonObject)
{
    const data = jsonObject.data;
    if (data.status == "error") {
        mainWindow.webContents.send('show-error', 'Username or password are incorrect');
    } else  {
        getMain().setUsername(name);
        getMain().switchWindow(windowCodes.FILE_VIEW);
    }
}

function handleSwitchToSignUp()
{
    getMain().switchWindow(windowCodes.SIGNUP);
}

function handleSendLoginDetails(event, username, password)
{
    name = username;
    const messageData = {
        data: {
            username: username,
            password: password,
        },
    };
    communicator.sendMessage(messageData, requestCodes.LOGIN_REQUEST);
}

function createWindow() {
    const position = storeManager.getValueFromStroe('lastWindowPosition');
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        x: position.x,
        y: position.y,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, './loginPreload.js'),
        },
        autoHideMenuBar: true,
    })
    mainWindow.loadFile('login/login.html');
    communicator.setDataHandler(dataHandler);
    try {
        ipcMain.handle('dialog:switchToSignup', handleSwitchToSignUp);
        ipcMain.handle('dialog:sendLoginDetails', handleSendLoginDetails);
    } catch {} //used in case the handlers already exists

    return mainWindow;
}

function deleteWindow()
{
    if (mainWindow) {
        mainWindow.close();
        mainWindow = null;
    }
}

module.exports = {
    createWindow,
    deleteWindow
}
