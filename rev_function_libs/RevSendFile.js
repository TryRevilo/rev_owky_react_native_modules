var RNFS = require('react-native-fs');

class Channel {
  static BYNARY_TYPE_CHANNEL = 'arraybuffer';
  static MAXIMUM_SIZE_DATA_TO_SEND = 65535;
  static BUFFER_THRESHOLD = 65535;
  static LAST_DATA_OF_FILE = 'LDOF7';
}

class RevSendFile {
  #channel;
  #queue = [];
  #paused = false;

  constructor(_channel) {
    this.#channel = _channel;
  }

  async transferFile(fileToShare) {
    const selectedFileURI = fileToShare.uri;
    const name = fileToShare.name;
    const type = fileToShare.type;
    const size = fileToShare.size;

    console.log('selectedFileURI : ' + selectedFileURI);
    console.log('name : ' + name);
    console.log('type : ' + type);
    console.log('size : ' + size);

    let arrayBuffer = await RNFS.read(
      selectedFileURI,
      fileToShare.size,
      0,
      'base64',
    );

    try {
      this.send(
        JSON.stringify({
          messageType: 'inbox',
          messageId: Math.random(),
          peerId: 2,
          message: '. . .',
          totalByte: arrayBuffer.length,
          uri: selectedFileURI,
          name: name,
          type: type,
          size: size,
          dataSize: Channel.MAXIMUM_SIZE_DATA_TO_SEND,
          fileContent: '',
        }),
      );

      for (
        let index = 0;
        index < arrayBuffer.length;
        index += Channel.MAXIMUM_SIZE_DATA_TO_SEND
      ) {
        index < arrayBuffer.length;

        let dataMsg = {
          messageType: 'inbox',
          messageId: Math.random(),
          peerId: 2,
          message: 'Picture',
          dataSize: Channel.MAXIMUM_SIZE_DATA_TO_SEND,
          fileContent: arrayBuffer.slice(
            index,
            index + Channel.MAXIMUM_SIZE_DATA_TO_SEND,
          ),
          byteLength: arrayBuffer.slice(
            index,
            index + Channel.MAXIMUM_SIZE_DATA_TO_SEND,
          ).length,
        };

        this.send(JSON.stringify(dataMsg));
      }

      this.send(
        JSON.stringify({
          messageType: 'inbox',
          messageId: Math.random(),
          peerId: 2,
          message: Channel.LAST_DATA_OF_FILE,
          fileContent: '',
        }),
      );
    } catch (error) {
      console.error('error sending big file', error);
    }

    return true;
  }

  send(data) {
    this.#queue.push(data);

    if (this.#paused) {
      return;
    }

    this.shiftQueue();
  }

  shiftQueue() {
    this.#paused = false;
    let message = this.#queue.shift();

    while (message) {
      if (
        this.#channel.bufferedAmount &&
        this.#channel.bufferedAmount > Channel.BUFFER_THRESHOLD
      ) {
        this.#paused = true;
        this.#queue.unshift(message);

        const listener = () => {
          this.#channel.removeEventListener('bufferedamountlow', listener);
          this.shiftQueue();
        };

        this.#channel.addEventListener('bufferedamountlow', listener);
        return;
      }

      try {
        this.#channel.send(message);
        message = this.#queue.shift();
      } catch (error) {
        throw new Error(
          `Error to send the next data: ${error.name} ${error.message}`,
        );
      }
    }
  }
}

exports.RevSendFile = RevSendFile;
