const { app, BrowserWindow ,} = require('electron');
const editFileWindow = require("./editFileWindow.js")

app.whenReady().then(()=>{
    editFileWindow.createEditFileWindow();
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
