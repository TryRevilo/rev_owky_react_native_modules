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
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';

export default function ChatMessageInputComposer({revSetText}) {
  const [chatMessage, setChatMessage] = useState('');

  return (
    <View>
      <TextInput
        style={styles.chatInput}
        placeholder=" Chat away !"
        placeholderTextColor="#00838f"
        multiline={true}
        numberOfLines={3}
        onChangeText={newText => {
          setChatMessage(newText);
          revSetText(newText);
        }}
        defaultValue={chatMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chatInput: {
    color: '#006064',
    fontSize: 11,
    paddingHorizontal: 5,
  },
});
