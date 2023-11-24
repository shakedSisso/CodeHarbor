const net = require('net');
const { app, BrowserWindow , ipcMain} = require('electron');
const path = require('path');

let mainWindow;
const FILE_REQUEST = 1;
const UPDATE_REQUEST = 2;
var fileContent;

function handleChangesInMain(event, changes) {
    //create message and send it to server
    const messageData = {
        data: {
            updates: changes
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    mainWindow.webContents.send('send-message', messageDataJson ,UPDATE_REQUEST);
  }

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
    ipcMain.handle('dialog:sendChanges', handleChangesInMain)
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
    fileName = 'examples.txt';
    const messageData = {
        data: {
            file_name: fileName,
        },
    };
    
    const messageDataJson = JSON.stringify(messageData);
    mainWindow.webContents.send('send-message', messageDataJson ,FILE_REQUEST);
  });


  ipcMain.on('handle-message', async (event, jsonObject) => {
    if (jsonObject.code === FILE_REQUEST) {
        var arr = jsonObject.data
        fileContent = ""
        for (var i = 0; i <arr.length; i++){
            fileContent += arr[i];
        }
        mainWindow.webContents.send('file-content', fileContent);
    }
  })
