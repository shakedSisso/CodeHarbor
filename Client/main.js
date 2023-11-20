const net = require('net');
const { app, BrowserWindow , ipcMain} = require('electron');
const path = require('path');

let mainWindow;
const FILE_REQUEST = 1;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: true,
    })
    mainWindow.loadFile('editFile.html')
}

app.whenReady().then(()=>{
    createWindow();
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

ipcMain.on('server-connection-failed', (event, serverUrl) => {
    console.error('Failed to connect to the server at', serverUrl);
    app.quit();
  });

ipcMain.on('print-message',(event, message)=>{
    console.log(message);
});

app.on('before-quit', () => {
    client.destroy();
});

ipcMain.on('socket-ready', (event) => {
    const messageData = {
        data: {
            file_name: 'example',
        },
    };
    
    const messageDataJson = JSON.stringify(messageData);
    mainWindow.webContents.send('send-message', messageDataJson ,FILE_REQUEST);
  });

  ipcMain.on('handle-message', (event, jsonObject) => {
    mainWindow.webContents.executeJavaScript(`
      const textarea = document.getElementById('text-box');
      textarea.value = '${jsonObject.data}';
    `);
  });
  
