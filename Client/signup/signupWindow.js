const { BrowserWindow , ipcMain} = require('electron');
const path = require('path');

const getMain = () => require('../main.js');
const communicator = require("../communicator.js");
const windowCodes = require('../windowCodes.js');
const requestCodes = require('../requestCodes.js');

let mainWindow;
let name;

/**
 * Handles data received from the server after signing up.
 * @param {Object} jsonObject - The JSON object containing the server response data.
 */
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

/**
 * Handles the event to switch to the login window.
 */
function handleSwitchToLogin()
{
    getMain().switchWindow(windowCodes.LOGIN);
}

/**
 * Handles the event to send sign-up details to the server.
 * @param {Object} event - The event object from IPC main.
 * @param {string} username - The username to sign up with.
 * @param {string} password - The password for the new account.
 * @param {string} email - The email address for the new account.
 */
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
    communicator.sendMessage(messageData, requestCodes.SIGNUP_REQUEST);
}

/**
 * Creates the sign-up window.
 * @param {Object} bounds - The bounds object containing window dimensions and position.
 * @returns {BrowserWindow} The created BrowserWindow object for the sign-up window.
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
            preload: path.join(__dirname, './signupPreload.js'),
        },
        autoHideMenuBar: true,
    })
    mainWindow.loadFile('signup/signup.html');
    communicator.setDataHandler(dataHandler);

    try {
        ipcMain.handle('dialog:switchToLogin', handleSwitchToLogin);
        ipcMain.handle('dialog:sendSignUpDetails', handleSendSignUpDetails);
    } catch {} //used in case the handlers already exist because the window was created before

    return mainWindow;
}

/**
 * Deletes the sign-up window.
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
