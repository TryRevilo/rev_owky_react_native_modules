//require our websocket library
var WebSocketServer = require('ws').Server;

/** All revConnectedUsers connected to the server
 * var revConnectedUsers = { revEntityGUID: { connection: connection, revEntity: revEntity } }
 * **/

var revConnectedUsers = {};

var revInitWebSocketServer = revServer => {
  //creating a websocket server at port 9090

  let revWebSS = new WebSocketServer({
    server: revServer,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false,
  });

  //when a user connects to our sever
  revWebSS.on('connection', function (connection) {
    console.log('User connected');

    // When server gets a message from a connected user
    connection.on('message', function (message) {
      let revData;

      //accepting only JSON messages
      try {
        revData = JSON.parse(message);
      } catch (e) {
        console.log('Invalid JSON');
      }

      console.log('revData.type : ' + revData.type + '\n');

      //switching type of the user message
      switch (revData.type) {
        //when a user tries to login
        case 'login':
          console.log('User logged in . . .');

          console.log('connection : ' + JSON.stringify(revData));

          revSendToConnection(connection, {
            type: 'login',
            success: true,
          });

          break;

        case 'offer':
          //for ex. UserA wants to call UserB

          console.log('Sending Offer . . .');

          revSendToConnection(connection, {
            type: 'offer',
            offer: revData.offer,
            revConnType: revData.revConnType,
          });

          break;

        case 'answer':
          console.log('Sending answer . . .');

          revSendToConnection(connection, {
            type: 'answer',
            answer: revData,
          });

          break;

        case 'candidate':
          console.log('Sending candidate . . .');

          revSendToConnection(connection, {
            type: 'candidate',
            candidate: revData.candidate,
          });

          break;

        case 'leave':
          console.log('Disconnecting . . .');

          revSendToConnection(connection, {
            type: 'leave',
          });

          break;

        case 'rev_data':
          console.log('rev_data . . .');

          revSendToConnection(connection, {
            type: 'rev_data',
          });

          break;

        default:
          revSendToConnection(connection, {
            type: 'error',
            message: 'Command not found: ' + revData.type,
          });

          break;
      }
    });

    //when user exits, for example closes a browser window
    //this may help if we are still in "offer","answer" or "candidate" state
    connection.on('close', function () {
      revSendToConnection(connection, {
        type: 'leave',
      });
    });
  });
};

var revSendToConnection = (connection, message) => {
  connection.send(JSON.stringify(message));
};

module.exports.revInitWebSocketServer = revInitWebSocketServer;
