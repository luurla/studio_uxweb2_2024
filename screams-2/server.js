import express from 'express';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { createServer } from 'node:http';

import { genderData } from './public/genderData.js';

// the current x position of global canvas. Any new client will be appended to the right of the canvas
// TODO you can come up with a more sophisticated way to handle this and and also handle the removal of disconnected clients
let current_x = 0;

// create a new express web server
let app = express();

// create a new socket.io server
const server = createServer(app);
const io = new Server(server);

// get the directory where server.js is located
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// serve the index.html as starting page
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"))
});

// serve static files in the public folder
app.use(express.static('public'));

let gender_counter = 0;

// a client has connected
io.on('connection', (socket) => {
    console.log('a user connected');

    // extract the keys of genderData -> [FEMALE, MALE]
    let genderKeys = Object.keys(genderData);

    // assign gender to the client (switches between female and male for each new client connection)
    let assignedGender = genderKeys[gender_counter % genderKeys.length];

    // emit gender data (gender, sound source, color) to the client
    socket.emit('genderAssignment', genderData[assignedGender]);
    gender_counter++;

    // forward the draw message to all clients except the sender
    socket.on('ripple', (msg) => {
        socket.broadcast.emit('ripple', msg);
    })

    socket.on('dimensions', (dimensions) => {
        console.log('new window size: ' + dimensions.width + ' ' + dimensions.height);
        socket.emit('offset_x', current_x);
        current_x += dimensions.width;
        // TODO handle the case when the client window is resized
    });

    // TODO handle cases when the client disconnects
});


// start the webserver
let port = process.env.PORT || 8080;        // set our port
server.listen(port);
console.log('Magic happens on port ' + port);