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
// const io = new Server(server, {
//     cors: {
//         origins: "*:*",
//         methods: ["GET", "POST"],
//         allowedHeaders: ["content-type"],
//         pingTimeout: 7000,
//         pingInterval: 3000
//     }
// });

app.use(cors({origin: "*"}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

function log(text) {
    if (LOGGING_ENABLED) {
        console.log(text);
    }
}

server.listen(PORT, () => {
    log(`App listening on the port ${PORT}`);
}).on('error', e => {
    console.error(e);
});
