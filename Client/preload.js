const { ipcRenderer, remote, contextBridge } = require('electron');
const net = require('net');

const socket = new net.Socket();

const serverAddress = '127.0.0.1';
const serverPort = 1888;
const MESSAGE_CODE_FIELD_SIZE = 2;
const MESSAGE_LEN_FIELD_SIZE = 3;

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
  ipcRenderer.send('print-message','Closing the app due to a server connection error.');
  remote.app.quit();
});

ipcRenderer.on('send-message', (event, messageDataJson, code) => {
  const messageCode = Buffer.alloc(MESSAGE_CODE_FIELD_SIZE);
  messageCode.writeUInt16BE(code);

  const messageLength = Buffer.alloc(MESSAGE_LEN_FIELD_SIZE);
  messageLength.writeUIntBE(Buffer.from(messageDataJson).length, 0, MESSAGE_LEN_FIELD_SIZE);

  const message = Buffer.concat([messageCode, messageLength, Buffer.from(messageDataJson)]);

  socket.write(message);
});

socket.on('data', (data) => {
  const jsonString = data.toString('utf-8');
  const firstOpeningBraceIndex = jsonString.indexOf('{');
  if (firstOpeningBraceIndex !== -1) {
      const trimmedJsonString = jsonString.slice(firstOpeningBraceIndex);
      try {
          const jsonObject = JSON.parse(trimmedJsonString);
          if (jsonObject && jsonObject.data) {
              ipcRenderer.send('handle-message', jsonObject);
          } else {
              ipcRenderer.send('print-message', 'Invalid JSON format: ' + trimmedJsonString);
          }
      } catch (error) {
          ipcRenderer.send('print-message', 'Error parsing JSON: ' + error);
      }
  } else {
      ipcRenderer.send('print-message', 'No JSON content found in the received data');
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  sendChanges: (changes) => ipcRenderer.invoke('dialog:sendChanges', changes),
})
