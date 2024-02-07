const HTTP_PORT = process.env.PORT || 8080;

const express = require('express');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// ----------------------------------------------------------------------------------------

const app = express();
const server = app.listen(HTTP_PORT, () => console.log(`Listening on ${HTTP_PORT}`));
app.set('view engine', 'pug');
app.set('views', './');


// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
const wss = new WebSocketServer({ server });


app.get('/', function (req, res) {
  res.render('index', { nwebsockets: wss.clients.size });
});

wss.on('connection', function(ws) {
  console.log('New connection established.');
  if (wss.clients.size > 2) {
    // we support at most 2 clients at a time right now.
    ws.close(1002,"Closing connection, can handle at most 2 connections at a time.");
  }
  ws.on('message', function(message) {
    console.log('received: %s', message);
	
	// Parse the incoming message
    let data;
    try {
        data = JSON.parse(message);
    } catch (error) {
        console.error('Invalid JSON', error);
        return;
    }

    // Handle different types of messages
    switch(data.type) {
        case 'offer':
            handleOffer(ws, data);
            break;
        case 'answer':
            handleAnswer(ws, data);
            break;
        case 'candidate':
            handleCandidate(ws, data);
            break;
        default:
            console.log('Unknown message type:', data.type);
            break;
    }
  });
  ws.on('close', function(code, reason) {
        console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
        // You can add additional cleanup or notification logic here
  });
  ws.on('error',function(e){});
});

wss.broadcast = function(data) {
  this.clients.forEach(function(client) {
    if(client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

function handleOffer(senderWs, offerData) {
    // Broadcast offer to all clients except the sender
    wss.clients.forEach(function(client) {
        if(client !== senderWs && client.readyState === WebSocket.OPEN) {
            console.log('Sending offer to a client.');
            client.send(JSON.stringify(offerData)); // Convert the offerData back to a JSON string
        }
    });
}

function handleAnswer(senderWs, answerData) {
    // Broadcast answer to all clients except the sender
    wss.clients.forEach(function(client) {
        if(client !== senderWs && client.readyState === WebSocket.OPEN) {
            console.log('Sending answer to the caller.');
            client.send(JSON.stringify(answerData)); // Convert the answerData back to a JSON string
        }
    });
}

function handleCandidate(senderWs, candidateData) {
    // Broadcast ICE candidate to all clients except the sender
    wss.clients.forEach(function(client) {
        if(client !== senderWs && client.readyState === WebSocket.OPEN) {
            console.log('Sending ICE candidate to the other peer.');
            client.send(JSON.stringify(candidateData)); // Convert the candidateData back to a JSON string
        }
    });
}

console.log('Server running. Visit http://localhost:' + HTTP_PORT + '.\n\n');