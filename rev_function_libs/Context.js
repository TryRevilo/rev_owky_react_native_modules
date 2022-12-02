import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';

import {io} from 'socket.io-client';
import Peer from 'simple-peer';

import {RemoteSocketContext} from './rev_server_lib';

const SocketContext = createContext();

const SocketContextProvider = ({children}) => {
  const {
    REV_PORT,
    REV_IP,
    SESSION_CONSTRAINTS,
    peerConnections,
    handleLeave,
    userVideo,
    setLocalPortraitVideo,
  } = useContext(RemoteSocketContext);

  const socket = io(`http://${REV_IP}:${REV_PORT}`);

  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();

  const revName = 'Oli';
  var myVideoStreamURL = '';

  const failure = e => {
    console.log('getUserMedia Error: ', e);
  };

  function initiateVideoCall(targetPeer) {
    // mediaDevices.enumerateDevices().then(sourceInfos => {
    //   for (let i = 0; i < sourceInfos.length; i++) {
    //     const sourceInfo = sourceInfos[i];
    //   }
    //   mediaDevices
    //     .getUserMedia(SESSION_CONSTRAINTS)
    //     .then(myStream => {
    //       targetPeer.addStream(myStream);
    //       console.log('>>> CALL <<< ' + myStream.toURL());
    //       setCallAccepted(!callAccepted);
    //       console.log('callAccepted : ' + callAccepted);
    //       myStream.getTracks().forEach(track => {
    //         // myVideo.current.streamURL = stream;
    //       });
    //       myVideoStreamURL = myStream.toURL();
    //       setStream(myStream);
    //       setLocalPortraitVideo([{revId: 1, revLocalStream: myStream}]);
    //       peerConnections[2]['stream'] = myStream;
    //     })
    //     .catch(failure);
    // });
  }

  function endVideoCall() {
    setCallAccepted(false);
  }

  useEffect(() => {
    socket.on('me', id => {
      console.log('socket.on me :-> id : ' + id);
      setMe(id);
    });

    let peerConnectionsCount = Object.keys(peerConnections).length;

    console.log('= = = peerConnectionsCount : ' + peerConnectionsCount);

    console.log('useEffect: >>>');
  }, [peerConnections]);

  return (
    <SocketContext.Provider
      value={{
        revName,
        call,
        callAccepted,
        myVideo,
        myVideoStreamURL,
        userVideo,
        stream,
        name,
        setName,
        initiateVideoCall,
        endVideoCall,
        callEnded,
        me,
      }}>
      {children}
    </SocketContext.Provider>
  );
};

export {SocketContextProvider, SocketContext};
