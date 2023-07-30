const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const {Server} = require('socket.io');

dotenv.config();

const PORT = process?.env?.PORT || 8081;
const LOGGING_ENABLED = process?.env?.LOGGING_ENABLED !== "FALSE";

const app = express()

app.use(express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origins: "*:*",
        methods: ["GET", "POST"],
        allowedHeaders: ["content-type"],
        pingTimeout: 7000,
        pingInterval: 3000
    }
});

app.use(cors({origin: "*"}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

function log(text) {
    if (LOGGING_ENABLED) {
        console.log(text);
    }
}

io.on('connection', socket => {
    log("client connected to socket server " + socket.id);
    socket.on('device-1', (receivedData1) => {
        let receivedData = receivedData1;
        if (typeof receivedData === 'string' || receivedData instanceof String) {
            try {
                receivedData = JSON.parse(receivedData);
            } catch (e) {
                log("Unable to convert device data to JSON object: " + receivedData1);
                return;
            }
        }
        log("received data from device: " + JSON.stringify(receivedData));
        if (!receivedData) {
            log("Undefined data");
            return;
        }
        if (!receivedData["Position"]) {
            log("Data missing position");
            return;
        }
        if (receivedData["Position"]["x"] === undefined || receivedData["Position"]["y"] === undefined || receivedData["Position"]["z"] === undefined) {
            log("Position data missing either x, y, or z");
            return;
        }
        if (!receivedData["Orientation"]) {
            log("Data missing orientation");
            return;
        }
        if (receivedData["Orientation"]["x"] === undefined || receivedData["Orientation"]["y"] === undefined || receivedData["Orientation"]["z"] === undefined || receivedData["Orientation"]["w"] === undefined) {
            log("Orientation data missing either x, y, z, or w");
            return;
        }
        if (!receivedData["Confidence"]) {
            log("Data missing confidence");
            return;
        }
        io.emit('device-data', receivedData);
    });
});

server.listen(PORT, () => {
    log(`App listening on the port ${PORT}`);
}).on('error', e => {
    console.error(e);
});
