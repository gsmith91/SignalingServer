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
    // Broadcast any received message to all clients
    console.log('received: %s', message);
    wss.broadcast(message);
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

console.log('Server running. Visit http://localhost:' + HTTP_PORT + '.\n\n');