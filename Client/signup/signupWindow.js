const { BrowserWindow , ipcMain} = require('electron');
const path = require('path');
const getMain = () => require('../main.js');
const communicator = require("../communicator.js");

let mainWindow;
const SIGNUP_REQUEST = 4;

function dataHandler(jsonObject){}

function handleSwitchToLogin()
{
    getMain().switchLoginAndSignup();
}

function handleSendSignUpDetails(event, username, password, email)
{
    const messageData = {
        data: {
            username: username,
            password: password,
            email: email,
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, SIGNUP_REQUEST);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, './signupPreload.js'),
        },
        autoHideMenuBar: true,
    })
    mainWindow.loadFile('signup/signup.html');
    communicator.setDataHandler(dataHandler);

    try {
        ipcMain.handle('dialog:switchToLogin', handleSwitchToLogin);
        ipcMain.handle('dialog:sendSignUpDetails', handleSendSignUpDetails);
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
