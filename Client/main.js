const { app , dialog } = require('electron');
const editFileWindow = require("./editFile/editFileWindow.js");
const loginWindow = require("./login/loginWindow.js");
const signupWindow = require("./signup/signupWindow.js");
const communicator = require("./communicator.js");
const codes = require('./windowCodes.js');

let currentWindowCode;

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
            editFileWindow.createWindow();
            break;
        default:
            throw new Error(`Couldn't find requested window`);
    }
    currentWindowCode = code;
}

function closeLastWindow() {
    switch(currentWindowCode){
        case codes.LOGIN:
            loginWindow().deleteWindow();
            break;
        case codes.SIGNUP:
            signupWindow().deleteWindow();
            break;
        case codes.EDIT:
            editFileWindow().deleteWindow();
            break;
        default:
            throw new Error(`Couldn't delete the current window`);
    }
}

function closeWindowWhenDisconnected() {
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: "Couldn't connect to the server.\n\nPlease try again later",
      buttons: ['OK']
    }).then((result) => {
        app.quit();
    });
  }

app.whenReady().then(()=>{
    communicator.connectToServer(() => {
        if (communicator.getIsConnected()){
            loginWindow().createWindow();
            currentWindowCode = codes.LOGIN;
        }
    });
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('before-quit', () => {
    communicator.disconnectFromServer();
});

module.exports = {
    switchWindow,
    closeWindowWhenDisconnected
}
