const { BrowserWindow , ipcMain} = require('electron');
const path = require('path');
const getMain = () => require('../main.js');
const communicator = require("../communicator.js");

let mainWindow;
const LOGIN_REQUEST = 5;

function dataHandler(jsonObject){}

function handleSwitchToSignUp()
{
    getMain().switchLoginAndSignup();
}

function handleSendLoginDetails(event, username, password)
{
    const messageData = {
        data: {
            username: username,
            password: password,
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, LOGIN_REQUEST);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
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
