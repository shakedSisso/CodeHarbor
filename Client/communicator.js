const net = require('net');
const getMain = () => require('./main.js');

const socket = new net.Socket();

const serverAddress = '192.168.0.200';
const serverPort = 1888;
const MESSAGE_CODE_FIELD_SIZE = 2;
const MESSAGE_LEN_FIELD_SIZE = 3;

let dataHandler = null;
let isConnected = false;

/**
 * Connects to the server with the specified address and port.
 * Calls the provided callback function upon successful connection.
 * @param {Function} callback - The callback function to be called after a successful connection.
 */
function connectToServer(callback)
{
    if (!isConnected) {
        socket.connect(serverPort, serverAddress, () => {
            isConnected = true;
            callback();
        });
    }
}

/**
 * Disconnects from the server and ends the socket connection.
 */
function disconnectFromServer() {
    if (isConnected) {
        sendMessage({}, 0); // 0 is the disconnection code
        socket.end();
        isConnected = false;
    }
}

/**
 * Sets the data handler function to process incoming data from the server.
 * @param {Function} newDataHandler - The new data handler function to set.
 */
function setDataHandler(newDataHandler)
{
    dataHandler = newDataHandler;
}

/**
 * Checks if the client is currently connected to the server.
 * @returns {boolean} True if connected, false otherwise.
 */
function getIsConnected()
{
    return isConnected;
}

/**
 * Event handler for incoming error in connecting to the server.
 * Shows the error to the user and closes the app
 * @param {Buffer} error - The error in connecting to the server.
 */
socket.on('error', (error) => {
    console.error('Error connecting to the server:', error.message);
    getMain().closeWindowWhenDisconnected();
  });

/**
 * Sends a message to the server with the specified message data and code.
 * @param {Object} messageData - The data to send in the message.
 * @param {number} code - The code representing the type of message.
 */
function sendMessage(messageData, code)
{
    const messageDataJson = JSON.stringify(messageData);
    
    const messageCode = Buffer.alloc(MESSAGE_CODE_FIELD_SIZE);
    messageCode.writeUInt16BE(code);

    const messageLength = Buffer.alloc(MESSAGE_LEN_FIELD_SIZE);
    messageLength.writeUIntBE(Buffer.from(messageDataJson).length, 0, MESSAGE_LEN_FIELD_SIZE);

    const message = Buffer.concat([messageCode, messageLength, Buffer.from(messageDataJson)]);

    socket.write(message);
}

/**
 * Event handler for incoming data from the server.
 * Parses the received JSON data and calls the data handler function if set.
 * @param {Buffer} data - The data received from the server.
 */
socket.on('data', (data) => {
    const jsonString = data.toString('utf-8');
    // Get only the first JSON if the server sends multiple messages in a row
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
                // Handle other cases if needed
            }
        } catch (error) {
            console.log("Reached error while parsing JSON.");
            console.log(error);
        }
    } else {
        // Handle case where no JSON is found
    }
  });

module.exports = {
    getIsConnected,
    setDataHandler,
    sendMessage,
    connectToServer,
    disconnectFromServer
};