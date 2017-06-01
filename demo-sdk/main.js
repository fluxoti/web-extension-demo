const DEBUG = true
const PORT = 3000

const express = require('express')
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('certs/client.key'),
    cert: fs.readFileSync('certs/client.crt')
};

const app = express();

// Create an HTTPS service
const server = https.createServer(options, app).listen(PORT);
const io = require('socket.io').listen(server)
io.set('transports', ['websocket'])

var bodyParser = require('body-parser')
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

io.sockets.on('connection', function(client) {

    client.on('adduser', function(agent_id) {

        if (DEBUG)
            console.log("Add agent id: " + agent_id)

        agents[agent_id] = agent_id;
        client.agent = agent_id;
        client.join(agent_id);
    })

    client.on('disconnect', function() {

        if (DEBUG)
            console.log("Disconnected: ", client.agent)

        client.leave(client.agent);
        delete agents[client.agent];
    })

})