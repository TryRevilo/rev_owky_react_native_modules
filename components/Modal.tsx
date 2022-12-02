import React from 'react';
import {StyleSheet, View, Text, Button} from 'react-native';
import RNModal from 'react-native-modal';

type ModalProps = {
  isVisible: boolean,
  children: React.ReactNode,
  [x: string]: any,
};
export const Modal = ({isVisible = false, children, ...props}: ModalProps) => {
  return (
    <RNModal
      isVisible={isVisible}
      style={styles.modal}
      animationInTiming={1000}
      animationOutTiming={1000}
      backdropTransitionInTiming={800}
      backdropTransitionOutTiming={800}
      {...props}>
      {children}
    </RNModal>
  );
};

const ModalContainer = ({children}: {children: React.ReactNode}) => (
  <View style={styles.modalContainer}>{children}</View>
);

const ModalHeader = ({title}: {title: string}) => (
  <View>
    <Text style={styles.text}>{title}</Text>
  </View>
);

const ModalBody = ({children}: {children?: React.ReactNode}) => (
  <View style={styles.body}>
    <View>{children}</View>
  </View>
);

const ModalFooter = ({children}: {children?: React.ReactNode}) => (
  <View>{children}</View>
);

const styles = StyleSheet.create({
  modal: {
    margin: 22,
    flex: 1,
  },
  modalContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#999',
    borderStyle: 'solid',
    position: 'relative',
  },
  text: {
    textAlign: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});

Modal.Header = ModalHeader;
Modal.Container = ModalContainer;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
