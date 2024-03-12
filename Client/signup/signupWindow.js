const { BrowserWindow , ipcMain} = require('electron');
const path = require('path');

const getMain = () => require('../main.js');
const communicator = require("../communicator.js");
const windowCodes = require('../windowCodes.js');
const requestCodes = require('../requestCodes.js');

let mainWindow;
let name;

function dataHandler(jsonObject)
{
    const data = jsonObject.data;
    if (data.status == "error") {
        mainWindow.webContents.send('show-error', 'Username is already taken by another user');
    } else  {
        getMain().setUsername(name);
        getMain().switchWindow(windowCodes.FILE_VIEW);
    }
}

function handleSwitchToLogin()
{
    getMain().switchWindow(windowCodes.LOGIN);
}

function handleSendSignUpDetails(event, username, password, email)
{
    name = username;
    const messageData = {
        data: {
            username: username,
            password: password,
            email: email,
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    communicator.sendMessage(messageDataJson, requestCodes.SIGNUP_REQUEST);
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
