import React, {createContext, useState, useRef, useEffect} from 'react';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from 'react-native-webrtc';

import {revGetServerData_JSON_Async} from './revPersLibReadServerData_RevEntity';

var revRCTConnectionObjectsArr = {};

//our username
var conn;
var revPort = 4000;
export var REV_IP = '192.168.232.220';

var MsgRecipient;

export var revSetupWebSocket = () => {
  conn = new WebSocket(`ws://${REV_IP}:${revPort}`);

  conn.onerror = function (err) {
    console.log('Got error', err);
    conn = new WebSocket(`ws://${REV_IP}:${revPort}`);
  };

  conn.onopen = function () {
    console.log('Connected to the signaling server');
  };

  let revOKGo = async revVarArgs => {
    let revRecipient = revVarArgs.data.revEntity;

    MsgRecipient = revRecipient;

    console.log('revRecipient : >>> ' + MsgRecipient._remoteRevEntityGUID);

    revInitConn(MsgRecipient);

    /** START REV CALL PLUGINS */
    /** END REV CALL PLUGINS */
  };

  //when we got a message from a signaling server
  conn.onmessage = function (msg) {
    var data = JSON.parse(msg.data);

    console.log('>>> data.type : ' + data.type);

    switch (data.type) {
      case 'connection':
        console.log('connected : ' + JSON.stringify(data.success));
        break;
      //when we make connection
      case 'login':
        handleLogin(data.success);
        break;
      //when somebody wants to call us
      case 'offer':
        handleOffer(data.offer, data.revEntity, data.revConnType);
        break;
      case 'answer':
        handleAnswer(data.answer, data.revEntity);
        break;
      //when a remote peer sends an ice candidate to us
      case 'candidate':
        handleCandidate(data.candidate, data.revEntity);
        break;
      case 'leave':
        handleLeave(data.revEntity);
        break;
      case 'revConnEntity':
        revOKGo(data);
        break;
      case 'error':
        console.log('ERR : ' + JSON.stringify(data));
        break;
      default:
        break;
    }
  };

  conn.onclose = function () {
    // setTimeout(setupWebSocket, 1000);
  };
};

export var sendMsg = () => {
  if (!MsgRecipient) {
    console.log('UNSET !');

    return;
  }

  console.log('MsgRecipient : ' + MsgRecipient._remoteRevEntityGUID);

  revInitiateDataMessanger({revMsg: 'revEditorPlainText'}, MsgRecipient);
};

//alias for sending JSON encoded messages
function send(message) {
  //attach the other peer username to our messages
  if (message && message.revEntity) {
    try {
      conn.send(JSON.stringify(message));
    } catch (error) {}
  }
}

//******
//UI selectors block
//******

// Login when the user clicks the button
export var revWebRTCLogIn = revEntity => {
  if (revEntity._remoteRevEntityGUID > 0) {
    send({
      type: 'login',
      revEntity: revEntity,
    });
  }
};

function handleLogin(success) {
  if (success === false) {
    alert('Ooops...try a different username');
  } else {
    //**********************
    //Starting a peer connection
    //**********************
    console.log('Logged In . . .');
  }
}

var revGetEntityRCTObject = (revTargetEntity, revProp) => {
  if (!revTargetEntity || !revTargetEntity._remoteRevEntityGUID) {
    console.log('ERR -> !revEntity || !revEntity._remoteRevEntityGUID');
    return;
  }

  let remoteRevEntityGUID = revTargetEntity._remoteRevEntityGUID;

  console.log(
    'revRCTConnectionObjectsArr.hasOwnProperty(remoteRevEntityGUID) : ' +
      revRCTConnectionObjectsArr.hasOwnProperty(remoteRevEntityGUID),
  );

  if (revRCTConnectionObjectsArr.hasOwnProperty(remoteRevEntityGUID)) {
    let revRCTConnectionObject =
      revRCTConnectionObjectsArr[remoteRevEntityGUID];
    return revRCTConnectionObject[revProp];
  }

  return null;
};

var revInitConn = revTargetEntity => {
  // Using Google public stun server
  let peerConnectionConfig = {
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}],
  };

  let revTargetConn;

  try {
    revTargetConn = new RTCPeerConnection(peerConnectionConfig, {
      optional: [{RtpDataChannels: true}],
    });

    console.log(
      revTargetEntity._remoteRevEntityGUID +
        'revTargetConn : ' +
        JSON.stringify(revTargetConn),
    );
  } catch (err) {
    console.log('ERR -> revInitConn -> ' + err);
  }

  // Setup ice handling
  revTargetConn.onicecandidate = function (event) {
    console.log(
      'revTargetConn.onicecandidate : ' + revTargetEntity._remoteRevEntityGUID,
    );

    if (event.candidate) {
      send({
        type: 'candidate',
        candidate: event.candidate,
        revEntity: revTargetEntity,
      });

      console.log(
        'onicecandidate >>> : ' + revTargetEntity._remoteRevEntityGUID,
      );
    }
  };

  // Creating data channel
  let remoteRevEntityGUID = revTargetEntity._remoteRevEntityGUID;
  let revDataChannel = revTargetConn.createDataChannel(
    remoteRevEntityGUID.toString(),
    {
      reliable: true,
    },
  );

  revDataChannel.onerror = function (error) {
    console.log('Ooops...error:', error);
  };

  console.log('>>>>> HERE <<<<<<<<');

  revTargetConn.addEventListener(
    'datachannel',
    ev => {
      'DATA CHANNELL AT LAST';
    },
    false,
  );

  //   revTargetConn.ondatachannel = function (event) {
  //     console.log('Data channel is created!');

  //     event.channel.onopen = function () {
  //       console.log('Data channel is open and ready to be used.');

  //       // When we receive a message from the other peer, display it on the screen
  //       event.channel.onmessage = async event => {
  //         console.log('onmessage -> event.data :\n\t\t' + event.data);
  //       };
  //     };
  //   };

  if (!revRCTConnectionObjectsArr.hasOwnProperty(remoteRevEntityGUID)) {
    revRCTConnectionObjectsArr[remoteRevEntityGUID] = {
      revConnection: revTargetConn,
      revDataChannel: revDataChannel,
    };
  }
};

var revSendDataChannelMessage = (revDataChannel, revMessage) => {
  let revSendMsg = JSON.stringify(revMessage);

  console.log(revDataChannel.readyState + ' -> revSendMsg ++ ' + revSendMsg);

  if (revDataChannel.readyState == 'open') {
    console.log('OPEN . . .');
    revDataChannel.send(revSendMsg);
  } else {
    revDataChannel.onopen = function (event) {
      if (revDataChannel.readyState == 'open') {
        console.log('DATA.C OPEN . . .');

        revDataChannel.send(revSendMsg);
      }
    };
  }
};

// Initiating a data messanger
var revInitiateDataMessanger = (revMessage, revMessageRecipientEntity) => {
  console.log(
    'revMessageRecipientEntity._remoteRevEntityGUID : ' +
      revMessageRecipientEntity._remoteRevEntityGUID,
  );

  if (
    !revMessageRecipientEntity ||
    !revMessageRecipientEntity._remoteRevEntityGUID
  )
    return;

  let revDataChannel = revGetEntityRCTObject(
    revMessageRecipientEntity,
    'revDataChannel',
  );

  if (!revDataChannel) {
    revInitConn(revMessageRecipientEntity);

    // create an offer
    let revConnection = revGetEntityRCTObject(
      revMessageRecipientEntity,
      'revConnection',
    );

    revConnection.createOffer(
      function (offer) {
        send({
          type: 'offer',
          offer: offer,
          revEntity: revMessageRecipientEntity,
          revConnType: 'revData',
        });

        revConnection.setLocalDescription(offer);
      },
      function (error) {
        alert('Error when creating an offer :\n\t' + error);
      },
    );

    revDataChannel = revGetEntityRCTObject(
      revMessageRecipientEntity,
      'revDataChannel',
    );
    revSendDataChannelMessage(revDataChannel, revMessage);
  } else {
    revSendDataChannelMessage(revDataChannel, revMessage);
  }
};

var revReceiveMsg = (offer, revEntity) => {
  let revMyConn = revGetEntityRCTObject(revEntity, 'revConnection');
  revMyConn.setRemoteDescription(new RTCSessionDescription(offer.sdp));

  // Create an answer to an offer
  revMyConn.createAnswer(
    function (answer) {
      revMyConn.setLocalDescription(answer);
      send({
        type: 'answer',
        answer: answer,
        revEntity: revEntity,
      });
    },
    function (error) {
      alert('Error when creating an answer');
    },
  );
};

// When somebody sends us an offer
var handleOffer = (offer, revEntity, revConnType) => {
  revInitConn(revEntity);

  if (revConnType && revConnType.localeCompare('revData') == 0) {
    revReceiveMsg(offer, revEntity);
  } else {
    revPickCall(offer, revEntity);
  }
};

// When we got an answer from a remote user
var handleAnswer = (answer, revEntity) => {
  revGetEntityRCTObject(revEntity, 'revConnection').setRemoteDescription(
    new RTCSessionDescription(answer.sdp),
  );
};

// When we got an ice candidate from a remote user
function handleCandidate(candidate, revEntity) {
  revGetEntityRCTObject(revEntity, 'revConnection')
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => {
      console.log(`>>> Failure during addIceCandidate(): ${e.name}`);
    });
}

const SocketContext = createContext();

const ContextProvider = ({children}) => {
  const {stream, setStream} = useState(null);

  useEffect(() => {
    // navigator.mediaDevices
    //   .getUserMedia({video: true, audio: true})
    //   .then(currentStream => {
    //     setStream(currentStream);
    //   });

    console.log('>>>> START . . . .');

    try {
      let revPath =
        `http://${REV_IP}:4000/rev_api?` +
        'rev_entity_unique_id=' +
        'oli' +
        '&revPluginHookContextsRemoteArr=revHookRemoteHandlerLogIn,revHookRemoteSendLoggedInPresenceToConnections,revHookRemoteHandlerProfile,revHookRemoteHandlerProfileStats';

      revGetServerData_JSON_Async(revPath).then(revData => {
        if (revData) {
          let REV_LOGGED_IN_ENTITY = revData;
          let REV_LOGGED_IN_ENTITY_GUID = revData._remoteRevEntityGUID;

          console.log(
            'REV_LOGGED_IN_ENTITY_GUID : ' + REV_LOGGED_IN_ENTITY_GUID,
          );

          revWebRTCLogIn(revData);
        }
      });
    } catch (error) {
      console.log('LOG IN ERR -> ' + JSON.stringify(error));
    }
  }, []);

  return (
    <SocketContext.Provider value={{REV_IP}}>{children}</SocketContext.Provider>
  );
};

export {ContextProvider, SocketContext};
