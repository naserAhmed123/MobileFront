import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ModalType = 'success' | 'error';

interface BlockedAccountModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: ModalType;
}

const BlockedAccountModal: React.FC<BlockedAccountModalProps> = ({
  visible,
  title,
  message,
  onClose,
  type = 'error'
}) => {
  const isSuccess = type === 'success';
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={[
            styles.modalTitle, 
            isSuccess ? styles.successTitle : styles.errorTitle
          ]}>
            {title}
          </Text>
          <Text style={styles.modalText}>{message}</Text>
          <TouchableOpacity
            style={[
              styles.button,
              isSuccess ? styles.successButton : styles.errorButton
            ]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {isSuccess ? "Passer" : "Fermer"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: width * 0.75,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successTitle: {
    color: '#4CAF50'
  },
  errorTitle: {
    color: '#D32F2F'
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22
  },
  button: {
    borderRadius: 5,
    padding: 10,
    width: 120,
    alignItems: 'center'
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  errorButton: {
    backgroundColor: '#D32F2F',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default BlockedAccountModal; 