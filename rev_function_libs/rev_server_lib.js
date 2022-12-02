import React, {createContext, useState, useRef, useEffect} from 'react';

import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

var RNFS = require('react-native-fs');

import {RevSendFile} from './RevSendFile';

const AppFolder = 'Owki';
const DirectoryPath = '/storage/emulated/0/Documents/' + AppFolder;
RNFS.mkdir(DirectoryPath);

var path = DirectoryPath + '/rev_test.txt';

// write the file
RNFS.writeFile(path, 'Lorem ipsum dolor sit amet', 'utf8')
  .then(success => {
    console.log('FILE WRITTEN!');
  })
  .catch(err => {
    console.log(err.message);
  });

const RemoteSocketContext = createContext();

const RemoteSocketContextProvider = ({children}) => {
  const [REV_PORT, setREV_PORT] = useState(8000);
  const [REV_IP, setREV_IP] = useState('192.168.191.220');

  const [configuration, setConfiguration] = useState({
    iceServers: [{url: 'stun:stun.1.google.com:19302'}],
  });

  const constraints = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1,
    audio: true,
    video: {
      mandatory: {
        minWidth: 500,
        minHeight: 300,
        minFrameRate: 30,
      },
    },
  };

  const [SESSION_CONSTRAINTS, setSESSION_CONSTRAINTS] = useState(constraints);

  var [myConnection, setMyConnection] = useState({});
  var [peerConnections, setPeerConnections] = useState({});

  var [newPeerDataChannelMessage, setNewPeerDataChannelMessage] = useState({});

  const userVideo = useRef();
  const [peerStream, setPeerStream] = useState();

  const [localPortraitVideos, setLocalPortraitVideo] = useState([
    {revId: 1, revLocalStream: null},
  ]);

  const [peerVideos, setPeerVideos] = useState([{revId: 1, stream: null}]);

  function revWebRTCSendFile(peerId) {
    console.log('>>> revWebRTCSendFile');

    new RevSendFile(peerConnections[peerId].peerConnection).transferFile(
      'file:///storage/emulated/0/DCIM/Camera/file_to_send.txt',
    );
  }

  const revHandleMsgSentEvent = data => {
    console.log('>>> revHandleMsgSentEvent : ' + JSON.stringify(data));

    setNewPeerDataChannelMessage(data);
  };

  async function handleLeave() {}

  return (
    <RemoteSocketContext.Provider
      value={{
        REV_PORT,
        REV_IP,
        SESSION_CONSTRAINTS,
        myConnection,
        revHandleMsgSentEvent,
        revWebRTCSendFile,
        newPeerDataChannelMessage,
        peerConnections,
        handleLeave,
        userVideo,
        peerStream,
        localPortraitVideos,
        setLocalPortraitVideo,
        peerVideos,
      }}>
      {children}
    </RemoteSocketContext.Provider>
  );
};

/* START SEND FILE **/

/* END SEND FILE **/

const styles = StyleSheet.create({
  peerStreamNullContainer: {
    display: 'flex',
    width: '100%',
    marginTop: '4%',
  },
  peerStreamNull: {
    color: '#f8bbd0',
    fontSize: 37,
    textAlign: 'center',
    marginTop: 8,
  },
  peerStreamNullTxt: {
    color: '#f8bbd0',
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 10,
    marginTop: -7,
  },
});

export {RemoteSocketContextProvider, RemoteSocketContext};
