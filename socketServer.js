// Load system variables 
require('./env.js');

var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(process.env.SOCKET_SERVER_PORT);

function handler (req, res) {
  res.end('I\'m not a web server');
}

io.on('connection', function (socket) {
  socket.on('message', function (data) {
    console.log(data);
  });
});