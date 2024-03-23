const { app , dialog, BrowserWindow } = require('electron');
const { exec } = require('child_process');

const editFileWindow = require("./editFile/editFileWindow.js");
const loginWindow = require("./login/loginWindow.js");
const signupWindow = require("./signup/signupWindow.js");
const fileViewingWindow = require("./fileViewing/fileViewingWindow.js");
const communicator = require("./communicator.js");
const codes = require('./windowCodes.js');

let currentWindowCode;
let username;
let doesCompilerExists;

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
            loginWindow.createWindow();
            currentWindowCode = codes.LOGIN;
        }
    });
    }
  });
}

function switchWindow(code) {
    try {
        closeLastWindow();
        openRequestedWindow(code);
    } catch (error) {
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
            loginWindow.createWindow();
            break;
        case codes.SIGNUP:
            signupWindow.createWindow();
            break;
        case codes.EDIT:
            currentWindow = editFileWindow.createWindow(fileViewingWindow.getFileLocation(), fileViewingWindow.getFileName());
            break;
        case codes.FILE_VIEW:
            fileViewingWindow.createWindow();
            break;
        default:
            throw new Error(`Couldn't find requested window`);
    }
    currentWindowCode = code;
}

function closeLastWindow() {
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
