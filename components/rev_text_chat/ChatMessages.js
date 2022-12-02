import React, {useState, useEffect, useContext} from 'react';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import FontAwesome from 'react-native-vector-icons/FontAwesome';

import InboxMessage from './InboxMessage';
import OutboxChatMessage from './OutboxChatMessage';

import {RemoteSocketContext} from '../../rev_function_libs/rev_server_lib';

export default function ChatMessages() {
  const {newPeerDataChannelMessage} = useContext(RemoteSocketContext);

  const [newPeerMessages, setNewPeerMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);

  const [listedChatMessages, setListedChatMessages] = useState({});

  let revAddedMessageIdsArr = [];

  useEffect(() => {
    revAddedMessageIdsArr = [];

    if (
      newPeerDataChannelMessage.hasOwnProperty('revMessageId') &&
      !listedChatMessages.hasOwnProperty(newPeerDataChannelMessage.messageId)
    ) {
      newPeerMessages.push(newPeerDataChannelMessage);

      listedChatMessages[newPeerDataChannelMessage.revMessageId] =
        newPeerDataChannelMessage;

      setListedChatMessages(listedChatMessages);

      setNewPeerMessages(newPeerMessages);
    }
  }, [newPeerDataChannelMessage]);

  return (
    <ScrollView
      vertical
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      contentOffset={{x: 0, y: 99999}}
      style={styles.chatMsgsVScroller}>
      <ScrollView
        horizontal
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={styles.profileImagesScroller}>
        <View style={[styles.revFlexWrapper]}>
          <View style={styles.imageContainer}>
            <Image
              style={styles.imageStyle}
              source={{
                uri: 'file:///storage/emulated/0/DCIM/Camera/IMG_20220428_093819_620.jpg',
              }}
            />
          </View>
          <View style={styles.imageContainer}>
            <Image
              style={styles.imageStyle}
              source={{
                uri: 'file:///storage/emulated/0/DCIM/Camera/IMG_20220604_115651_061.jpg',
              }}
            />
          </View>
          <View style={styles.profileVideoContainer}>
            <View style={styles.profileVideoStyle}>
              <Image
                style={styles.imageStyle}
                source={{
                  uri: 'file:///storage/emulated/0/DCIM/Camera/IMG_20220505_154409_825.jpg',
                }}
              />
            </View>
            <View style={styles.profilePlayVideoStyle}>
              <FontAwesome
                style={styles.profilePlayVideoStyleTxt}
                name="play"
              />
            </View>
          </View>
          <View style={styles.imageContainer}>
            <Image
              style={styles.imageStyle}
              source={{
                uri: 'file:///storage/emulated/0/DCIM/Camera/IMG_20220604_135207_430.jpg',
              }}
            />
          </View>
          <View style={styles.imageContainer}>
            <Image
              style={styles.imageStyle}
              source={{
                uri: 'file:///storage/emulated/0/DCIM/Camera/IMG_20220721_090725_387.jpg',
              }}
            />
          </View>
        </View>
      </ScrollView>
      <View style={[styles.revFlexWrapper, styles.userInfoWrapper]}>
        <Text style={[styles.revSiteTxtColor, styles.userInfoTxt]}>
          About me hello!
        </Text>
      </View>
      <Text style={styles.messagesNull}>No messages exchanged</Text>
      <View style={styles.chatMessagesContainer}></View>
      {newPeerMessages.map(chatMsg => {
        let revCurrMsgId = chatMsg.revMessageId;

        if (revAddedMessageIdsArr.includes(revCurrMsgId)) {
          return null;
        }

        revAddedMessageIdsArr.push(revCurrMsgId);

        if (chatMsg.revMessageType.localeCompare('inbox') === 0) {
          return <InboxMessage key={revCurrMsgId} revData={chatMsg} />;
        } else {
          return <OutboxChatMessage key={revCurrMsgId} revData={chatMsg} />;
        }
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chatMsgsVScroller: {
    width: '100%',
    marginTop: 4,
  },
  revSiteTxtColor: {
    color: '#757575',
  },
  revFlexWrapper: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  profileImagesScroller: {
    flexGrow: 0,
  },
  userInfoWrapper: {
    backgroundColor: '#fffde7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
    borderRadius: 5,
  },
  userInfoTxt: {
    fontSize: 10,
  },
  messagesNull: {
    color: '#90a4ae',
    fontSize: 10,
    marginTop: 5,
    marginLeft: 12,
  },
  chatMessagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 3,
  },
  imageContainer: {
    backgroundColor: '#444',
    width: 35,
    height: 65,
    borderRadius: 15,
    marginRight: 1,
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    verticalAlign: 'middle',
    borderRadius: 15,
  },
  profileVideoContainer: {
    backgroundColor: '#444',
    width: 225,
    height: 65,
    borderRadius: 15,
    marginRight: 1,
    position: 'relative',
  },
  profileVideoStyle: {
    width: '100%',
    height: '100%',
    verticalAlign: 'middle',
    borderRadius: 15,
    position: 'absolute',
    top: 0,
  },
  profilePlayVideoStyle: {
    position: 'absolute',
    top: '32%',
    left: '45%',
  },
  profilePlayVideoStyleTxt: {
    color: '#FFF',
    fontSize: 25,
  },
});
