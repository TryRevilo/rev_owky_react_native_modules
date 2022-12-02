import React, {useContext} from 'react';

import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  NativeModules,
} from 'react-native';

const {RevPersLibCreate_React, RevWebRTCReactModule} = NativeModules;

import {RemoteSocketContext} from '../../rev_function_libs/rev_server_lib';

var revHandleSendMsg = (revTargetId, revMsg, revCallBack) => {
  if (!revTargetId || !revMsg) {
    return null;
  }

  let revSendMessageStatus = RevWebRTCReactModule.revSendMessage(
    revTargetId,
    revMsg,
  );

  revCallBack(true);
};

export default function RevSubmitChatTab({revTargetId, revMsg}) {
  const {revHandleMsgSentEvent} = useContext(RemoteSocketContext);

  let minMessageLen = 1;
  let maxMessageLen = 200;

  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  let rendNu = getRndInteger(minMessageLen, maxMessageLen);

  let revMsgSendCallback = revSendStatus => {
    if (revSendStatus) {
      const myPromise = new Promise((resolve, reject) => {
        let revData = {
          revMessageId: getRndInteger(minMessageLen, maxMessageLen),
          revMessageType: 'outbox',
          revData: revMsg(),
        };

        revHandleMsgSentEvent(revData);

        setTimeout(() => {
          resolve('foo');
        }, 300);
      });

      myPromise.then(revVal => {
        let revInBox = {
          revMessageId: getRndInteger(minMessageLen, maxMessageLen),
          revMessageType: 'inbox',
          revData: revMsg(),
        };

        revHandleMsgSentEvent(revInBox);
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        revHandleSendMsg(revTargetId, revMsg(), revMsgSendCallback);
      }}>
      <View style={styles.revSubmitChatTabWrapper}>
        <Text style={styles.revSubmitChatTab}>Send</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  revSubmitChatTabWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  revSubmitChatTab: {
    color: '#FFF',
    fontSize: 10,
    backgroundColor: '#444',
    paddingHorizontal: 22,
    paddingVertical: 3,
    marginTop: 2,
    borderRadius: 8,
  },
});
