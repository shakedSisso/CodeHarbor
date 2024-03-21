const { BrowserWindow , ipcMain } = require('electron');
const path = require('path');

const getMain = () => require('../main.js');
const communicator = require("../communicator.js");
const windowCodes = require('../windowCodes.js');
const requestCodes = require('../requestCodes.js');

let mainWindow, name;

/**
 * Handles incoming data from the server and performs actions based on the received data.
 * @param {Object} jsonObject - The JSON object received from the server.
 */
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

/**
 * Handles the request to switch to the sign-up window.
 */
function handleSwitchToSignUp()
{
    getMain().switchWindow(windowCodes.SIGNUP);
}

/**
 * Handles the event when login details are sent.
 * @param {Event} event - The event object.
 * @param {string} username - The username entered by the user.
 * @param {string} password - The password entered by the user.
 */
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

/**
 * Creates a new login window.
 * @param {Object} bounds - The bounds object containing window dimensions and position.
 * @returns {BrowserWindow} The newly created BrowserWindow object.
 */
function createWindow(bounds) {
    mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
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
    } catch {} //used in case the handlers already exist because the window was created before

    return mainWindow;
}

/**
 * Deletes the login window if it exists.
 */
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
