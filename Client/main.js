const { app, BrowserWindow ,} = require('electron');
const editFileWindow = require("./editFile/editFileWindow.js")
const communicator = require("./communicator.js");

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
