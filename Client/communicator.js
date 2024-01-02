const net = require('net');

const socket = new net.Socket();

const serverAddress = '192.168.0.200';
const serverPort = 1888;
const MESSAGE_CODE_FIELD_SIZE = 2;
const MESSAGE_LEN_FIELD_SIZE = 3;

let dataHandler = null;
let isConnected = false;

function connectToServer(callback)
{
    if (!isConnected) {
        socket.connect(serverPort, serverAddress, () => {
            isConnected = true;
            callback();
        });
    }
}

function disconnectFromServer()
{
    if (isConnected) {
        messageDataJson = {};
        sendMessage(messageDataJson, 0); //0 is the disconnection code
        socket.end();
        isConnected = false;
    }
}

function setDataHandler(newDataHandler)
{
    dataHandler = newDataHandler;
}

function getIsConnected()
{
    return isConnected;
}

socket.on('error', (error) => {
    console.error('Error connecting to the server:', error.message);
    //ipcRenderer.send('server-connection-failed', error.message);
  });

function sendMessage(messageDataJson, code)
{
  const messageCode = Buffer.alloc(MESSAGE_CODE_FIELD_SIZE);
  messageCode.writeUInt16BE(code);

  const messageLength = Buffer.alloc(MESSAGE_LEN_FIELD_SIZE);
  messageLength.writeUIntBE(Buffer.from(messageDataJson).length, 0, MESSAGE_LEN_FIELD_SIZE);

  const message = Buffer.concat([messageCode, messageLength, Buffer.from(messageDataJson)]);

  socket.write(message);
}

socket.on('data', (data) => {
    const jsonString = data.toString('utf-8');
    //get only the first json if server sends a couple of messages in a row
    const firstOpeningBraceIndex = jsonString.indexOf('{');
    const CodeIndex = jsonString.indexOf('"code":');
    const trimmedString = jsonString.slice(CodeIndex);
    const firstClosingingBraceIndex = trimmedString.indexOf('}');
    const messageLen = CodeIndex + firstClosingingBraceIndex + 1;
    if (firstOpeningBraceIndex !== -1) {
        const trimmedJsonString = jsonString.slice(firstOpeningBraceIndex, messageLen);
        try {
            const jsonObject = JSON.parse(trimmedJsonString);
            if (jsonObject && jsonObject.data) {
                if(dataHandler != null)
                {
                    dataHandler(jsonObject);
                }
            } else {
            }
        } catch (error) {
        }
    } else {
    }
  });

module.exports = {
    getIsConnected,
    setDataHandler,
    sendMessage,
    connectToServer,
    disconnectFromServer
};