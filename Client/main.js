const { app , dialog } = require('electron');
const editFileWindow = require("./editFile/editFileWindow.js");
const loginWindow = require("./login/loginWindow.js");
const signupWindow = require("./signup/signupWindow.js");
const communicator = require("./communicator.js");

let isLogin;
let currentWindow;

function switchLoginAndSignup(){
    if (isLogin){
        isLogin = false;
        loginWindow.deleteWindow();
        currentWindow = signupWindow.createWindow();
    } else {
        isLogin = true;
        signupWindow.deleteWindow();
        currentWindow = loginWindow.createWindow();
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
            currentWindow = loginWindow.createWindow();
            isLogin = true;
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
    switchLoginAndSignup, 
    closeWindowWhenDisconnected
}
