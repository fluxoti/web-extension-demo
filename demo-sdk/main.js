const DEBUG = true
const PORT = 3000
const PORT_HTTP = 8181

const express = require('express')
const http = require('http');
const https = require('https');
const fs = require('fs');
const Request = require('./requests')

const options = {
    key: fs.readFileSync('certs/client.key'),
    cert: fs.readFileSync('certs/client.crt')
};

const app = express();

// Create an HTTP service
http.createServer(app).listen(PORT_HTTP);

// Create an HTTPS service and add socket.io to listen https server
const server = https.createServer(options, app).listen(PORT);
const io = require('socket.io').listen(server)
io.set('transports', ['websocket'])

const bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

let agents = {}

// url to receive webhooks from 3cplus and send to client
app.post('/webhooks', function(req, res) {
    if (agents[req.body.agent.telephony_id] !== undefined) {
        io.sockets.in(req.body.agent.telephony_id).emit('event', req.body);
        console.log(JSON.stringify(req.body, null, 4))
    } else {
        console.log('Agent is not connected')
    }
    res.json({status: 'ok'})
});

// socket.io to receive agent connect/disconnect
io.sockets.on('connection', function(client) {

    client.on('adduser', function(data) {

        if (DEBUG)
            console.log("Add agent: " + data)

        agents[data.telephony_id] = data;
        client.agent = data;
        client.join(data.telephony_id);
    })

    client.on('control', function(data) {
        if (client.agent !== undefined) {
            if (DEBUG)
                console.log("data: " +  JSON.stringify(data))

            Request.process(data, agents[client.agent.telephony_id], function () {

            })
        }
    })

    client.on('disconnect', function() {
        if (client.agent !== undefined) {
            if (DEBUG)
                console.log("Disconnected: ", JSON.stringify(client.agent.telephony_id))

            client.leave(client.agent.telephony_id);
            delete agents[client.agent.telephony_id];
        }
    })

})