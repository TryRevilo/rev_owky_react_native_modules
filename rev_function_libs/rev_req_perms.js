import React from 'react';

import {PermissionsAndroid, NativeModules} from 'react-native';

var RNFS = require('react-native-fs');

const {RevPersLibCreate_React, RevWebRTCReactModule} = NativeModules;

const requestCameraPermission = () => {
  try {
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_MEDIA_LOCATION,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    ]).then(result => {
      if (
        result['android.permission.ACCESS_COARSE_LOCATION'] &&
        result['android.permission.CAMERA'] &&
        result['android.permission.READ_CONTACTS'] &&
        result['android.permission.ACCESS_FINE_LOCATION'] &&
        result['android.permission.ACCESS_MEDIA_LOCATION'] &&
        result['android.permission.READ_EXTERNAL_STORAGE'] &&
        result['android.permission.WRITE_EXTERNAL_STORAGE'] === 'granted'
      ) {
        console.log('SUCCESS! Permissions Granted!');

        const AppFolder = 'Owki';
        const DirectoryPath = `${RNFS.ExternalStorageDirectoryPath}/Download}`;

        let dbLong = RevPersLibCreate_React.revPersInitJSON(
          JSON.stringify({
            happy: true,
            pi: 3.141,
            revPi: 1985,
            revArray: [
              {revVal: 'One'},
              {revVal: 'Two'},
              {revVal: 'Three'},
              {revVal: 'Four'},
              {revVal: 'Five'},
            ],
          }),
        );

        let dataChannelInit = RevWebRTCReactModule.revInitDataChannel(
          'revLocal',
          revTarget,
        );

        console.log(`>>> dataChannelInit >> ${dataChannelInit}`);

        let revGetTestStr = RevWebRTCReactModule.revGetTestStr('revKey');

        console.log(`>>> revGetTestStr ${revGetTestStr}`);

        console.log('<<< revPersInitJSON : ' + dbLong);
      } else if (
        result['android.permission.ACCESS_COARSE_LOCATION'] ||
        result['android.permission.CAMERA'] ||
        result['android.permission.READ_CONTACTS'] ||
        result['android.permission.ACCESS_FINE_LOCATION'] ||
        result['android.permission.ACCESS_MEDIA_LOCATION'] ||
        result['android.permission.READ_EXTERNAL_STORAGE'] ||
        result['android.permission.WRITE_EXTERNAL_STORAGE'] ===
          'never_ask_again'
      ) {
        this.refs.toast.show(
          'Please Go into Settings -> Applications -> APP_NAME -> Permissions and Allow permissions to continue',
        );
      }

      console.log(
        "result['android.permission.READ_EXTERNAL_STORAGE']" +
          result['android.permission.READ_EXTERNAL_STORAGE'],
      );

      console.log(
        "result['android.permission.WRITE_EXTERNAL_STORAGE']" +
          result['android.permission.WRITE_EXTERNAL_STORAGE'],
      );
    });
  } catch (err) {
    console.warn(err);
  }
};

exports.requestCameraPermission = requestCameraPermission;
