const net = require('net');
const { app, BrowserWindow } = require('electron');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        autoHideMenuBar: true,
    })
    win.loadFile('editFile.html')
}

app.whenReady().then(createWindow)

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

const client = new net.Socket();

client.on('data', (data) => {
    console.log('Received data from server:', data.toString());
});

client.on('close', () => {
    console.log('Connection closed');
});

client.on('error', (err) => {
    console.error('Error:', err.message);
});

client.connect(1888, '127.0.0.1', () => {
    console.log('Connected to server');
    client.write('Hello from Electron!');
});

app.on('before-quit', () => {
    client.destroy();
});
