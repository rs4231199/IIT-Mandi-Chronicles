//make a copy of this file by name "LoginScreen.js" and fill line 103-106 with your configuration.
import React, { Component } from 'react';
import { View, Text, StyleSheet, Image, TouchableWithoutFeedback, Alert } from 'react-native';
import * as Google from 'expo-google-app-auth';
import { DotIndicator } from 'react-native-indicators';
import { FontAwesome } from '@expo/vector-icons';

import { fbase } from '../config';

class LoginScreen extends Component {
  constructor(props){
    super(props);
    this.state = {
      visible: false
    }
  }

  isUserEqual = (googleUser, firebaseUser) => {
    if (firebaseUser) {
      var providerData = firebaseUser.providerData;
      for (var i = 0; i < providerData.length; i++) {
        if (
          providerData[i].providerId ===
            fbase.auth.GoogleAuthProvider.PROVIDER_ID &&
          providerData[i].uid === googleUser.getBasicProfile().getId()
        ) {
          // We don't need to reauth the Firebase connection.
          return true;
        }
      }
    }
    return false;
  };
  onSignIn = googleUser => {
    //logout user if gmail doesn't contain .students.iitmandi.ac.in at the end
    let gmail = googleUser.user.email;
    if(gmail.substr(gmail.indexOf('@')) != '@students.iitmandi.ac.in') {
      fbase.auth().signOut()
      this.setState({visible: false})
      Alert.alert("you can sign in using institute's webmail only.")
      return
    }
    // console.log('Google Auth Response', gmail);
    // We need to register an Observer on Firebase Auth to make sure auth is initialized.
    var unsubscribe = fbase.auth().onAuthStateChanged(
      function(firebaseUser) {
        unsubscribe();
        // Check if we are already signed-in Firebase with the correct user.
        if (!this.isUserEqual(googleUser, firebaseUser)) {
          // Build Firebase credential with the Google ID token.
          var credential = fbase.auth.GoogleAuthProvider.credential(
            googleUser.idToken,
            googleUser.accessToken
          );
          // Sign in with credential from the Google user.
          fbase
            .auth()
            .signInWithCredential(credential)
            .then(function(result) {
              // console.log('user signed in ');
              if (result.additionalUserInfo.isNewUser) {
                fbase
                  .firestore()
                  .collection("users").add({
                    userID: result.user.uid,
                    gmail: result.user.email,
                    profile_picture: result.additionalUserInfo.profile.picture,
                    first_name: result.additionalUserInfo.profile.given_name,
                    last_name: result.additionalUserInfo.profile.family_name,
                    created_at: Date.now()
                  })
                  .then(function(docRef) {
                    // console.log('Document written with ID:', docRef.id);
                  })
                  .catch(function(error){
                    // console.log("Error adding document: ", error);
                  });
              } else {
                  // console.log("else");
              }
            })
            .catch(function(error) {
              // Handle Errors here.
              var errorCode = error.code;
              var errorMessage = error.message;
              // The email of the user's account used.
              var email = error.email;
              // The firebase.auth.AuthCredential type that was used.
              var credential = error.credential;
              // ...
              // console.log("error", error);
            });
        } else {
          // console.log('User already signed-in Firebase.');
        }
      }.bind(this)
    );
  };
  signInWithGoogleAsync = async () => {
    this.setState({visible: true});
    try {
      const result = await Google.logInAsync({
        androidStandaloneAppClientId: '',
        iosStandaloneAppClientId: '',
        androidClientId: '',
        iosClientId: '',
        scopes: ['profile', 'email']
      });

      if (result.type === 'success') {
        this.onSignIn(result);
        return result.accessToken;
      } else {
        this.setState({visible: false});
        return { cancelled: true };
      }
    } catch (e) {
      return { error: true };
    }
  };
  render() {
    return (
      <View style={styles.container}>
        <Image
          style={{width: 120, height: 120, borderWidth: 4, borderColor: 'white', borderRadius: 60 }}
          source={require('../assets/ic_launcher_round.png')}
        />
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22, marginTop: 10 }}>IIT Mandi Chronicles</Text>
        <Text style={{ color: 'white', marginTop: 10, paddingHorizontal: 40 }}>Sign-in to stay connected with all the events and news of IIT Mandi.</Text>
        {
          !this.state.visible &&
          <TouchableWithoutFeedback onPress={() => this.signInWithGoogleAsync()}>
            <View style={{ flexDirection: 'row', borderColor: 'white', borderWidth: 1, padding: 2, borderRadius: 3, backgroundColor: 'grey', height: 35, marginTop: 15 }}>
              <FontAwesome name="google" style={{ fontSize: 30, color: 'white', marginLeft: 2 }}/>
              <Text style={{ fontSize: 20, color:'white' }}>  Sign In With Institute's Webmail </Text>
            </View>
          </TouchableWithoutFeedback>
        }
        {
          this.state.visible &&
          <View style={{ flexDirection: 'row', borderColor: 'white', borderWidth: 1, padding: 2, borderRadius: 3, backgroundColor: 'grey', height: 35, marginTop: 15, marginHorizontal: 15 }}>
            <DotIndicator color="white" />
          </View>
        }
      </View>
    );
  }
}
export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#512DA7',
    height: '100%'
  }
});
