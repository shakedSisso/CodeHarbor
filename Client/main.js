const { app , dialog, BrowserWindow, screen} = require('electron');
const { exec } = require('child_process');

const editFileWindow = require("./editFile/editFileWindow.js");
const loginWindow = require("./login/loginWindow.js");
const signupWindow = require("./signup/signupWindow.js");
const fileViewingWindow = require("./fileViewing/fileViewingWindow.js");
const communicator = require("./communicator.js");
const storeManager = require('./storeManager.js');
const codes = require('./windowCodes.js');

let currentWindowCode, currentWindow, username, doesCompilerExists;

function checkGCCInstallation() {
  exec('gcc --version', (error, stdout, stderr) => {
    if (error) {
      console.error('GCC is not installed', stderr);
      // Open a website with information on how to download GCC
      const win = new BrowserWindow({ show: false, autoHideMenuBar: true }, );
      win.loadURL('https://www.scaler.com/topics/c/c-compiler-for-windows/');
      win.on('ready-to-show', () => {
        win.show();
      });

      win.on('closed', () => {
        doesCompilerExists = false;
      });
    } else {
      communicator.connectToServer(() => {
        if (communicator.getIsConnected()){
            doesCompilerExists = true;
            initializePositionInStore();
            currentWindow = loginWindow.createWindow();
            currentWindowCode = codes.LOGIN;
        }
    });
    }
  });
}

function initializePositionInStore(){
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const middleX = Math.floor(width / 2) - 400; // (width / 2) - halfOfTheScreenWidth
    const middleY = Math.floor(height / 2) - 300; // (height / 2) - halfOfTheScreenHeight
    position = {x:middleX, y:middleY};
    storeManager.setValueInStore('lastWindowPosition', position);
}

function switchWindow(code) {
    try {
        closeLastWindow();
        openRequestedWindow(code);
    } catch (error) {
        console.log(error.message);
        dialog.showMessageBox({
            type: 'error',
            title: 'Error',
            message: error.message,
            buttons: ['OK']
          }).then((result) => {
              app.quit();
          });
    }
}

function openRequestedWindow(code){
    switch(code){
        case codes.LOGIN:
            currentWindow = loginWindow.createWindow();
            break;
        case codes.SIGNUP:
            currentWindow = signupWindow.createWindow();
            break;
        case codes.EDIT:
            currentWindow = editFileWindow.createWindow(fileViewingWindow.getLocationPath(), fileViewingWindow.getFileName());
            break;
        case codes.FILE_VIEW:
            currentWindow = fileViewingWindow.createWindow();
            break;
        default:
            throw new Error(`Couldn't find requested window`);
    }
    currentWindowCode = code;
}

function closeLastWindow() {
    storeManager.setValueInStore('lastWindowPosition', currentWindow.getBounds());
    
    switch(currentWindowCode){
        case codes.LOGIN:
            loginWindow.deleteWindow();
            break;
        case codes.SIGNUP:
            signupWindow.deleteWindow();
            break;
        case codes.EDIT:
            editFileWindow.deleteWindow();
            break;
        case codes.FILE_VIEW:
            fileViewingWindow.deleteWindow();
            break;
        default:
            throw new Error(`Couldn't delete the current window`);
    }
}

function closeWindowWhenDisconnected() {
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: "Couldn't connect to the server.\nPlease try again later",
      buttons: ['OK']
    }).then((result) => {
        app.quit();
    });
  }

app.whenReady().then(()=>{
    checkGCCInstallation();
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('before-quit', () => {
    storeManager.initializeStore();
    communicator.disconnectFromServer();
});

function getUsername() {
    return username;
}

function setUsername(name) {
    username = name;
}

function getDoesCompilerExists(){
    return doesCompilerExists;
}

module.exports = {
    switchWindow,
    closeWindowWhenDisconnected,
    getUsername,
    setUsername, 
    getDoesCompilerExists
}
