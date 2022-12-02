const express = require('express');
const app = express();

app.use(express.json());

var request = require('request');

var http = require('http'),
  inspect = require('util').inspect;

var Busboy = require('busboy');

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));

var cors = require('cors');

app.use(cors());

const revWebSocketServer = require('./revWebSocketServer');
const {Z_ASCII} = require('zlib');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const revPort = process.env.PORT || 4000;

var server = http.createServer(app);

server.on('listening', function () {
  console.log('ok, server is running');
});

server.listen(revPort, () => {
  console.log(`Listening on port ${revPort} . . . .`);
  console.log(`CORS-enabled web server listening on port : ${revPort}`);
});

revWebSocketServer.revInitWebSocketServer(server);
