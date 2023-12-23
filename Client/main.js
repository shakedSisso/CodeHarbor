const net = require('net');
const { app, BrowserWindow , ipcMain, Menu} = require('electron');
const path = require('path');

let mainWindow;
const FILE_REQUEST = 1;
const UPDATE_REQUEST = 2;
const NEW_FILE_REQUEST = 3;
var fileName;

function handleChangesInMain(event, changes) {
    //create message and send it to server
    const messageData = {
        data: {
            updates: changes
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    mainWindow.webContents.send('send-message', messageDataJson ,UPDATE_REQUEST);
    updateLocalFile(changes);
}

function handleCreateFileRequest(event, fileName)
{
    // creating message
    const messageData = {
        data: {
            file_name: fileName,
            location: "",
        },
    };
    const messageDataJson = JSON.stringify(messageData);
    mainWindow.webContents.send('send-message', messageDataJson ,NEW_FILE_REQUEST);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: false,
    })
    mainWindow.loadFile('editFile.html')
}

app.whenReady().then(()=>{
    ipcMain.handle('dialog:sendChanges', handleChangesInMain)
    ipcMain.handle('dialog:createFile', handleCreateFileRequest);
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
    deleteLocalFile(fileName);
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
        createLocalFile(fileName, fileContent);
    }
    else if (jsonObject.code === UPDATE_REQUEST)
    {
        mainWindow.webContents.send('file-updates', jsonObject.data);
        updateLocalFile(jsonObject.data.updates);
    }
  })

  // Handle IPC to set the menu
ipcMain.on('set-menu', (event, menu) => {
    const template = [
        {
          label: 'File',
          submenu: [
            {
              label: 'Create File',
              click: () => {
                openCreateFileDialog();
                },
            },
          ],
        },
      ];
    
      const menuTemplate = Menu.buildFromTemplate(template);
      mainWindow.setMenu(menuTemplate);
  });
  

const fs = require('fs');

function createLocalFile(fileName, content) {
    const filePath = path.join('.', fileName); // '.' is used to create a file in the same folder as the app
    fs.writeFile(filePath, content, (err) => {
        if (err) {
        console.error('Error creating file:', err);
        }
    });
}

function updateLocalFile(changes){
    const filePath = path.join('.', fileName); // '.' is used to access in file that is in the same folder as the app
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
        console.error('Error reading file:', err);
        } else {

            dataArr = data.split('\n');

            for (const key in changes) {
                if (changes.hasOwnProperty(key)) {
                dataArr[key - 1] = changes[key];
                }
            }
            
            const newData = dataArr.join('\n');

            fs.writeFile(filePath, newData, (err) => {
                if (err) {
                console.error('Error editing file:', err);
                }
            });
        }
    });
}


function deleteLocalFile(fileName){
    const filePath = path.join('.', fileName); // '.' is used to delete in file that is in the same folder as the app
    if (fs.existsSync(filePath)) { //check if the file exists
        fs.unlink(filePath, (err) => {
            if (err) {
            console.error('Error deleting file:', err);
            }
        });
    }
}

function openCreateFileDialog() {
    const { BrowserWindow } = require('electron');

    const inputDialog = new BrowserWindow({
        width: 300,
        height: 200,
        show: false,
        webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'fileDialogPreload.js'),
        },
        autoHideMenuBar: true,
    });

    // Load an HTML file for the dialog
    inputDialog.loadFile('fileDialog.html');

    inputDialog.once('ready-to-show', () => {
        inputDialog.show();
    });

    inputDialog.on('closed', () => {
        // Handle the closed event if needed
    });
  }
