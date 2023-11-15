// preload.js
const { ipcRenderer, remote } = require('electron');
const net = require('net');

const socket = new net.Socket();

const serverAddress = '127.0.0.1';
const serverPort = 1888;

ipcRenderer.send('print-message','Attempting to connect to the server...');

socket.connect(serverPort, serverAddress, () => {
    ipcRenderer.send('print-message','Connected to the server!');
    ipcRenderer.send('socket-ready');
});

socket.on('error', (error) => {
  console.error('Error connecting to the server:', error.message);
  ipcRenderer.send('server-connection-failed', error.message);
});

ipcRenderer.on('close-app', () => {
  console.log('Closing the app due to a server connection error.');
  remote.app.quit();
});

ipcRenderer.on('send-message', (event, message) => {
    socket.write(message);
});
