const { app , dialog } = require('electron');
const editFileWindow = require("./editFile/editFileWindow.js")
const communicator = require("./communicator.js");


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
        if (communicator.getIsConnected())
            editFileWindow.createEditFileWindow();
        else {
            console.log("couldn't connect to server");
            app.quit()
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
    closeWindowWhenDisconnected
}
