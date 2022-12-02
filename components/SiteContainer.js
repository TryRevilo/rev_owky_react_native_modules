/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TextInput,
  Image,
  TouchableOpacity,
  PermissionsAndroid,
  NativeModules,
  DeviceEventEmitter,
} from 'react-native';

import DocumentPicker, {
  DirectoryPickerResponse,
  DocumentPickerResponse,
  isInProgress,
  types,
} from 'react-native-document-picker';

var RNFS = require('react-native-fs');

const {RevPersLibCreate_React, RevWebRTCReactModule} = NativeModules;

import {Button} from '../components/Button';
import {Modal} from '../components/Modal';

import {SocketContext} from '../rev_function_libs/Context';
import {RemoteSocketContext} from '../rev_function_libs/rev_server_lib';

import {REV_IP, sendMsg} from '../rev_function_libs/revLibRTCCLient';

import FontAwesome from 'react-native-vector-icons/FontAwesome';

import InboxMessage from './rev_text_chat/InboxMessage';
import OutboxChatMessage from './rev_text_chat/OutboxChatMessage';

import MyLocalPortraitVideo from './rev_call/MyLocalPortraitVideo';
import PeerVideoView from './rev_call/PeerVideoView';

import {Dimensions} from 'react-native';
import ChatMessages from './rev_text_chat/ChatMessages';
import {RevSendFile} from '../rev_function_libs/RevSendFile';

import ChatMessageInputComposer from './rev_text_chat/ChatMessageInputComposer';
import RevCurrentChatOptionProfileMedia from './rev_user_profiles/RevCurrentChatOptionProfileMedia';
import RevSubmitChatTab from './rev_text_chat/RevSubmitChatTab';

import {requestCameraPermission} from '../rev_function_libs/rev_req_perms';

var revTarget;

var revSetTargetId = _revTarget => {
  revTarget = _revTarget;
};

const quote = `Single quote "'" and double quote '"'`;
const regexpQuotes = /(['"]).*?\1/g;
for (const match of quote.matchAll(regexpQuotes)) {
  console.log(match[0]);
}

// get a list of files and directories in the main bundle
RNFS.readDir(RNFS.ExternalStorageDirectoryPath) // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
  .then(result => {
    // stat the first file
    return Promise.all([RNFS.stat(result[0].path), result[0].path]);
  })
  .then(statResult => {
    if (statResult[0].isFile()) {
      // if we have a file, read it
      return RNFS.readFile(statResult[1], 'utf8');
    }

    return 'no file';
  })
  .then(contents => {
    // log the file contents
    // console.log(contents);
  })
  .catch(err => {
    console.log(err.message, err.code);
  });

var revIsWebServerUp = false;

var revInitNative_C = () => {
  DeviceEventEmitter.addListener('revSetOnlineUserId', event => {
    console.log('>>> Event - revSetOnlineUserId : ' + event.eventProperty);

    revSetTargetId(event.eventProperty);
  });

  if (revIsWebServerUp) {
    return;
  }

  let revInitWSStatus = RevWebRTCReactModule.revInitWS(
    '192.168.245.220',
    'revLocal',
  );

  console.log(`>>> revInitWSStatus ${revInitWSStatus}`);

  if (!revInitWSStatus || revInitWSStatus.length === 0) {
    revIsWebServerUp = false;
  } else {
    revIsWebServerUp = true;
  }

  let revSetTestStr = RevWebRTCReactModule.revSetTestStr(
    'revKey',
    '>>> Rev Val >>>',
  );

  console.log(`>>> revSetTestStr ${revSetTestStr}`);
};

revInitNative_C();

const SiteContainer = () => {
  const [chatMessage, setChatMessage] = useState('');

  const {
    me,
    name,
    callAccepted,
    myVideo,
    userVideo,
    callEnded,
    stream,
    peerStream,
    call,
    initiateVideoCall,
    endVideoCall,
  } = useContext(SocketContext);

  const {
    localPortraitVideos,
    peerVideos,
    myConnection,
    peerConnections,
    revWebRTCSendFile,
    handleLeave,
  } = useContext(RemoteSocketContext);

  const [idToCall, setIdToCall] = useState(me);

  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const handleModal = () => setIsModalVisible(() => !isModalVisible);

  const handleDocumentSelection = useCallback(async () => {
    try {
      const response = await DocumentPicker.pick({
        presentationStyle: 'fullScreen',
        allowMultiSelection: true,
      });

      for (let i = 0; i < response.length; i++) {
        new RevSendFile(peerConnections[2].dataChannel).transferFile(
          response[i],
        );
      }
    } catch (err) {
      console.warn(err);
    }
  }, []);

  const handleSendMsg = () => {
    try {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]).then(result => {
        console.log('REV PERSS');

        if (
          result['android.permission.READ_EXTERNAL_STORAGE'] === 'granted' &&
          result['android.permission.WRITE_EXTERNAL_STORAGE'] === 'granted'
        ) {
          console.log('SUCCESS! Permissions Granted!');

          console.log('We will invoke the native module here!');

          let revDbPath = RNFS.DownloadDirectoryPath;

          let dbLong = RevPersLibCreate_React.revPersInitReact(revDbPath);

          console.log('>>> revDbPath : ' + RNFS.DownloadDirectoryPath);

          console.log('<<< revPersInitReact : ' + dbLong);
        } else if (
          result['android.permission.READ_EXTERNAL_STORAGE'] ||
          result['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            'never_ask_again'
        ) {
          console.log(
            'Please Go into Settings -> Applications -> APP_NAME -> Permissions and Allow permissions to continue',
          );
        }
      });
    } catch (err) {
      console.warn(err);
    }
  };

  const handleInitiateVideoCall = () => {
    initiateVideoCall(myConnection);
    setIsModalVisible(() => !isModalVisible);
  };

  const handleEndVideoCall = () => {
    // endVideoCall()

    requestCameraPermission();
  };

  useEffect(() => {
    console.log('::: useEffect :: HOME');

    if (peerStream) console.log(';;; ' + peerStream.toURL());
  }, [peerStream]);

  const [revChatStatus, setRevChatStatus] = useState(false);

  const revHandleShowChatComposer = () => {
    setRevChatStatus(!revChatStatus);
  };

  let revChatMessageTxt = '';

  let revSetChatMessageTxt = revText => {
    revChatMessageTxt = revText;
  };

  function revGetChatMessageTxt() {
    return revChatMessageTxt;
  }

  return (
    <SafeAreaView style={styles.siteContainer}>
      <StatusBar backgroundColor="#00796b" />
      <StatusBar backgroundColor="#F7F7F7" barStyle={'dark-content'} />
      <View style={styles.pageContainer}>
        <Modal isVisible={isModalVisible}>
          <Modal.Container>
            <Modal.Body>
              <View style={styles.modalVideoChatArea}>
                <View style={styles.modalPeerVideoContainer}>
                  {peerVideos.map(peerVideo => (
                    <PeerVideoView
                      key={peerVideo.revId}
                      revId={peerVideo.revId}
                      revPeerStream={peerVideo.revPeerStream}
                    />
                  ))}
                </View>
                <View style={styles.myVideoStreamContainer}>
                  {localPortraitVideos.map(localPortraitVideo => (
                    <MyLocalPortraitVideo
                      key={localPortraitVideo.revId}
                      revId={localPortraitVideo.revId}
                      revLocalStream={localPortraitVideo.revLocalStream}
                    />
                  ))}
                </View>
                <View style={styles.endCallBtnWrapper}>
                  <Text style={styles.endCallBtn} onPress={handleModal}>
                    <FontAwesome
                      name="power-off"
                      style={styles.endCallBtnIcon}
                    />
                  </Text>
                </View>
              </View>
            </Modal.Body>
          </Modal.Container>
        </Modal>
        <View style={styles.siteHeaderWrapper}>
          <View style={styles.headerContainer}>
            <Text
              style={styles.siteLogoTxt}
              onPress={async () => {
                await handleSendMsg();
              }}>
              Owki
            </Text>
            <Text style={styles.siteTellTxt}>
              Chat with people from around the world!
            </Text>
          </View>
          <View style={styles.siteHeaderOptionsWrapper}>
            <Text style={styles.siteHeaderOptionTxt}>contacts</Text>
            <Text style={styles.siteHeaderOptionTxt}>/</Text>
            <Text style={styles.siteHeaderOptionTxt}>messages</Text>
          </View>
        </View>
        <View style={styles.siteHeader2Wrapper}>
          <Text style={styles.siteOnlineUsersCounterTxt}>
            2, 500 people online
          </Text>
          <View style={styles.siteHeader2Search}>
            <FontAwesome name="search" style={styles.siteHeader2SearchIcon} />
          </View>
        </View>
        <ScrollView
          horizontal
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={styles.availableChatPeopleScroller}>
          <View
            style={[styles.revFlexWrapper, styles.availableChatPeopleWrapper]}>
            <View style={styles.availableChatPeople}>
              <FontAwesome
                name="user"
                style={styles.availableChatPeopleNonIcon}
              />
            </View>
            <View style={styles.availableChatPeople}>
              <FontAwesome
                name="user"
                style={styles.availableChatPeopleNonIcon}
              />
            </View>
            <View style={styles.availableChatPeople}>
              <FontAwesome
                name="user"
                style={styles.availableChatPeopleNonIcon}
              />
            </View>
            <View style={styles.availableChatPeople}>
              <FontAwesome
                name="user"
                style={styles.availableChatPeopleNonIcon}
              />
            </View>
            <View style={styles.availableChatPeople}>
              <FontAwesome
                name="user"
                style={styles.availableChatPeopleNonIcon}
              />
            </View>
            <View style={styles.availableChatPeople}>
              <FontAwesome
                name="user"
                style={styles.availableChatPeopleNonIcon}
              />
            </View>
            <View style={styles.availableChatPeople}>
              <FontAwesome
                name="user"
                style={styles.availableChatPeopleNonIcon}
              />
            </View>
            <View style={styles.availableChatPeople}>
              <FontAwesome
                name="user"
                style={styles.availableChatPeopleNonIcon}
              />
            </View>
          </View>
        </ScrollView>
        <View style={styles.messagesContainer}>
          <Text style={styles.communityGuidlineWarning}>
            violence ~ intimidation may lead to suspension
          </Text>

          <View style={styles.videoChatArea}>
            <ChatMessages />
          </View>
        </View>

        <View style={styles.chatAreaContainer}>
          <View style={styles.chatChannelsOptionsWrapper}>
            <View style={styles.currentChatOptionsWrapper}>
              <TouchableOpacity onPress={() => handleInitiateVideoCall()}>
                <View style={styles.currentChatOptionTab}>
                  <FontAwesome
                    name="video-camera"
                    style={styles.currentChatOptionTabIcon}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleEndVideoCall()}>
                <View style={styles.currentChatOptionTab}>
                  <FontAwesome
                    name="phone"
                    style={styles.currentChatOptionTabIcon}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.currentChatOptionTab}>
                <FontAwesome
                  name="flag"
                  style={styles.currentChatOptionTabIcon}
                />
              </View>

              <View style={styles.currentChatOptionTab}>
                <FontAwesome
                  name="user-plus"
                  style={styles.currentChatOptionTabIcon}
                />
              </View>
            </View>
            <View style={styles.channelsContainer}>
              <View style={styles.channelsOptionsWrapper}>
                <FontAwesome name="hashtag" style={styles.channelOptionItem} />
                <FontAwesome name="circle" style={styles.channelOptionItem} />
                <FontAwesome
                  name="object-ungroup"
                  style={styles.channelOptionItem}
                />
                <FontAwesome name="asterisk" style={styles.channelOptionItem} />
                <Text style={styles.channelOptionItem}>ads</Text>
              </View>
            </View>
          </View>
          <View style={styles.loggedInPeopleWrapper}>
            <View style={styles.recipientProfileWrapper}>
              <View style={styles.recipientProfileIcon}></View>
              <View style={styles.recipientProfileInfoContainer}>
                <Text style={styles.recipientProfileInfoNames}>
                  Oliver Muchai
                </Text>
                <Text style={styles.recipientProfileInfoDetails}>
                  M, 23, US NY
                </Text>
              </View>
            </View>
            <View style={styles.recipientNextWrapper}>
              <Text style={styles.recipientNextTxt}>NExT</Text>
              <View style={styles.recipientNextUserIconWrapper}>
                <FontAwesome name="user" style={styles.recipientNextUserIcon} />
              </View>
              <FontAwesome
                name="arrow-right"
                style={styles.recipientNextpointerIcon}
              />
            </View>
          </View>
        </View>

        {revChatStatus ? (
          <ChatMessageInputComposer
            revSetText={revInputText => {
              revSetChatMessageTxt(revInputText);

              console.log(`revChatMessageTxt : ${revChatMessageTxt}`);
            }}
          />
        ) : (
          <RevCurrentChatOptionProfileMedia />
        )}

        <View style={styles.footerContainer}>
          <View style={styles.chatFooterWrapper}>
            <View style={styles.footerSubmitOptionsLeftWrapper}>
              {revChatStatus ? (
                <RevSubmitChatTab
                  revTargetId={revTarget}
                  revMsg={() => {
                    return revChatMessageTxt;
                  }}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    revHandleShowChatComposer();
                  }}>
                  <View style={[styles.cancelComposeChatMsg]}>
                    <FontAwesome
                      name="quote-left"
                      style={[
                        styles.revSiteTxtColor,
                        styles.revSiteTxtMedium,
                      ]}></FontAwesome>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={async () => {
                  revWebRTCSendFile(2);
                }}>
                <View style={[styles.cancelComposeChatMsg]}>
                  <FontAwesome
                    name="image"
                    style={[
                      styles.revSiteTxtColor,
                      styles.revSiteTxtMedium,
                    ]}></FontAwesome>
                </View>
              </TouchableOpacity>
              <View style={[styles.cancelComposeChatMsg]}>
                <FontAwesome
                  name="times"
                  style={[styles.revSiteTxtColor, styles.revSiteTxtMedium]}
                  onPress={() => {
                    revHandleShowChatComposer();
                  }}></FontAwesome>
              </View>
            </View>
            <View style={styles.rightFooterSubmitOptionsWrapper}>
              <TouchableOpacity
                onPress={() => {
                  handleDocumentSelection();
                }}>
                <View style={styles.rightFooterOptionTab}>
                  <FontAwesome
                    name="folder"
                    style={styles.footerSubmitOptionFA}></FontAwesome>
                </View>
              </TouchableOpacity>
              <View style={styles.rightFooterOptionTab}>
                <FontAwesome
                  name="arrows"
                  style={styles.footerSubmitOptionFA}></FontAwesome>
              </View>
              <View style={styles.rightFooterOptionTab}>
                <FontAwesome
                  name="gear"
                  style={styles.footerSubmitOptionFA}></FontAwesome>
              </View>
              <View style={styles.rightFooterOptionTab}>
                <FontAwesome
                  name="share-alt"
                  style={styles.footerSubmitOptionFA}></FontAwesome>
              </View>
              <Text style={styles.rightFooterHelpTab}>Help</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

var pageWidth = Dimensions.get('window').width - 12;
var height = Dimensions.get('window').height;

var maxChatMessageContainerWidth = pageWidth - 45;

const styles = StyleSheet.create({
  revChatStatusStyle: {
    isVisible: false,
  },
  revSiteTxtColor: {
    color: '#757575',
  },
  revSiteTxtMedium: {
    fontSize: 12,
  },
  revFlexWrapper: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  endCallBtnWrapper: {
    backgroundColor: '#e57373',
    alignSelf: 'center',
    padding: 1,
    position: 'absolute',
    bottom: '5%',
    borderRadius: 100,
  },
  endCallBtn: {
    backgroundColor: '#ba000d',
    width: 'auto',
    padding: 15,
    borderRadius: 100,
  },
  endCallBtnIcon: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 22,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  videoChatArea: {
    flex: 1,
    position: 'relative',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  modalVideoChatArea: {
    flex: 1,
    position: 'relative',
  },
  modalPeerVideoContainer: {
    flex: 1,
    position: 'relative',
  },
  peerVideoContainer: {
    backgroundColor: '#F7F7F7',
    height: '100%',
    overflow: 'hidden',
    borderColor: '#F7F7F7',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 5,
    alignSelf: 'stretch',
    position: 'relative',
  },
  videoStyle: {
    height: '100%',
    backgroundColor: '#F7F7F7',
    borderColor: '#F7F7F7',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 5,
    alignSelf: 'stretch',
  },
  myVideoStreamContainer: {
    backgroundColor: '#FFF',
    width: 75,
    height: 105,
    borderColor: '#FFF',
    borderStyle: 'solid',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'absolute',
    left: 10,
    top: 10,
    borderRadius: 3,
  },
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
  peerStreamOngoingTxt: {
    color: '#f8bbd0',
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 10,
    marginBottom: 7,
  },
  siteContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFF',
    // marginTop: StatusBar.currentHeight,
  },
  pageContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#FFF',
    paddingTop: 12,
    paddingRight: 12,
    paddingLeft: 12,
  },
  siteHeaderWrapper: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'column',
    backgroundColor: '#FFF',
    width: 'auto',
  },
  siteLogoTxt: {
    color: '#009688',
    fontSize: 17,
    lineHeight: 17,
    fontWeight: 'bold',
  },
  siteTellTxt: {
    color: '#009688',
    fontSize: 11,
    lineHeight: 11,
  },
  siteHeaderOptionsWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    width: 'auto',
    marginLeft: 'auto',
  },
  siteHeaderOptionTxt: {
    color: '#999',
    fontSize: 11,
    marginHorizontal: 4,
  },
  siteHeader2Wrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  siteOnlineUsersCounterTxt: {
    color: '#90a4ae',
    fontSize: 11,
    width: 'auto',
    borderStyle: 'solid',
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
    paddingRight: 12,
  },
  siteHeader2Search: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 22,
    marginLeft: 'auto',
  },
  siteHeader2SearchIcon: {
    color: '#90a4ae',
    fontSize: 17,
  },
  availableChatPeopleScroller: {
    flexGrow: 0,
    marginTop: 2,
  },
  availableChatPeopleWrapper: {
    alignItems: 'center',
    height: 'auto',
  },
  availableChatPeople: {
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#rgba(27, 31, 35, 0.06)',
    marginRight: 2,
    borderRadius: 10,
  },
  availableChatPeopleNonIcon: {
    color: '#CCC',
    fontSize: 17,
  },
  messagesContainer: {
    backgroundColor: '#FFF',
    flex: 8,
    flexDirection: 'column',
  },
  communityGuidlineWarning: {
    color: '#90a4ae',
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  chatContainer: {
    backgroundColor: '#FFF',
    display: 'none',
    isVisible: false,
    flexDirection: 'column',
  },
  chatAreaContainer: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'column',
    marginTop: 2,
  },
  chatChannelsOptionsWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentChatOptionsWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    marginLeft: 8,
  },
  currentChatOptionTab: {
    backgroundColor: '#ffebee',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginRight: 10,
    borderRadius: 50,
    opacity: 0.5,
  },
  currentChatOptionTabIcon: {
    color: '#ec407a',
    textAlign: 'center',
    fontSize: 11,
  },
  loggedInPeopleWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  recipientProfileWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
  },
  channelsContainer: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginLeft: 'auto',
    marginRight: 12,
  },
  channelsOptionsWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: 'auto',
  },
  channelOptionItem: {
    color: '#999',
    fontSize: 11,
    lineHeight: 11,
    borderBottomColor: '#CCC',
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    paddingHorizontal: 2,
    marginRight: 8,
  },
  recipientNextWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 12,
  },
  recipientNextTxt: {
    color: '#4db6ac',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 7,
  },
  recipientNextUserIconWrapper: {
    backgroundColor: '#FFF',
  },
  recipientNextUserIcon: {
    color: '#4db6ac',
    fontSize: 22,
    textAlign: 'center',
    marginLeft: 1,
  },
  recipientNextpointerIcon: {
    color: '#4db6ac',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
  },
  recipientProfileIcon: {
    backgroundColor: '#4db6ac',
    width: 42,
    height: 32,
    borderRadius: 55,
  },
  recipientProfileInfoContainer: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
    marginLeft: 4,
  },
  recipientProfileInfoNames: {
    color: '#009688',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 11,
  },
  recipientProfileInfoDetails: {
    color: '#009688',
    fontSize: 10,
    lineHeight: 10,
  },
  chatInput: {
    color: '#006064',
    fontSize: 11,
    paddingHorizontal: 5,
  },
  footerContainer: {
    backgroundColor: '#FFF',
    flex: 0,
    flexDirection: 'column',
    marginTop: 8,
    marginBottom: 22,
  },
  chatFooterWrapper: {
    backgroundColor: '#FFF',
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerSubmitOptionsLeftWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerUploadWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  footerSubmitOptionTab: {
    backgroundColor: '#FFF',
  },
  footerSubmitOptionFA: {
    color: '#00695c',
    fontSize: 11,
  },
  cancelComposeChatMsg: {
    marginTop: 2,
    paddingHorizontal: 8,
  },
  rightFooterSubmitOptionsWrapper: {
    backgroundColor: '#FFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: 'auto',
    marginRight: 12,
    marginLeft: 'auto',
  },
  rightFooterOptionTab: {
    backgroundColor: '#FFF',
    marginRight: 12,
  },
  rightFooterHelpTab: {
    color: '#00695c',
    fontSize: 10,
    backgroundColor: '#FFF',
    marginRight: 12,
  },
});

export default SiteContainer;
